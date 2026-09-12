"""Offline safety tests. No real GitHub mutations or Codex execution."""
import contextlib
import io
import json
import logging
import multiprocessing
import os
import plistlib
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import worker


def issue(states=('ready',)):
    return {'number': 123, 'title': 'Implement safe thing', 'body': 'Acceptance criteria',
            'state': 'OPEN', 'labels': [{'name': state} for state in states]}


class FakeWorker(worker.Worker):
    def __init__(self, root):
        super().__init__(root)
        self.calls = []
        self.remote = issue()
        self.is_dirty = False
        self.fail = None
        self.completed = True
        self.no_issue = False
        self.current_branch = 'main'
        self.network_down = False

    def preflight(self):
        self.repo = 'example/repository'
        self.base = 'trunk'

    def command(self, *args, **kwargs):
        self.calls.append(args)
        if args[:2] == ('git', 'status'):
            return ' M unrelated' if self.is_dirty else ''
        if args[:2] == ('git', 'branch'):
            return self.current_branch
        if args[:2] == ('git', 'rev-parse'):
            return 'head123'
        if args[:2] == ('git', 'switch'):
            if self.fail == 'branch':
                raise worker.WorkerError('git switch failed (exit 1)')
            self.current_branch = args[-2]
        if args[:2] == ('codex', 'exec'):
            if self.fail == 'codex':
                raise worker.WorkerError('codex exec failed (exit 1)')
            if self.fail == 'interrupt':
                raise KeyboardInterrupt()
            if self.fail == 'network-after-codex':
                self.network_down = True
                raise worker.WorkerError('codex exec failed (exit 1)')
            output = Path(args[args.index('--output-last-message') + 1])
            output.write_text(json.dumps({'completed': self.completed}))
        if args[0] == 'npm' and self.fail == 'validation':
            raise worker.WorkerError('npm test failed (exit 1)')
        return ''

    def github(self, *args):
        self.calls.append(('gh',) + args)
        if self.network_down:
            raise worker.WorkerError('gh issue failed (exit 1)')
        if args[0] == 'api':
            return json.dumps([[{'name': label} for label in worker.STATES]])
        if args[:2] == ('issue', 'list'):
            if 'in-progress' in args:
                return json.dumps([{'number': 456}] if 'in-progress' in worker.labels(self.remote) else [])
            return json.dumps([] if self.no_issue else [self.remote])
        if args[:2] == ('issue', 'view'):
            return json.dumps(self.remote)
        if args[:2] == ('issue', 'edit'):
            target = args[args.index('--add-label') + 1]
            self.remote['labels'] = [{'name': target}]
        return ''


def lock_in_child(root, connection):
    other = worker.Worker(Path(root))
    acquired = other.acquire()
    connection.send(acquired)
    if acquired:
        other.lock.close()
    connection.close()


class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.worker = FakeWorker(self.root)
        self.stdout = contextlib.redirect_stdout(io.StringIO())
        self.stdout.__enter__()

    def tearDown(self):
        for handler in list(logging.getLogger('codex-worker').handlers):
            handler.close()
            logging.getLogger('codex-worker').removeHandler(handler)
        self.stdout.__exit__(None, None, None)
        self.directory.cleanup()

    def test_dry_run_no_writes_or_mutations_even_dirty(self):
        self.worker.is_dirty = True
        self.worker.work(dry=True)
        self.assertEqual(list(self.root.iterdir()), [])
        self.assertFalse(any(call[:3] in [('gh', 'issue', 'edit'), ('gh', 'issue', 'comment')]
                             or call[0] == 'codex' or call[:2] == ('git', 'switch')
                             for call in self.worker.calls))

    def test_success_requires_validation_and_claim_before_codex(self):
        self.worker.work()
        self.assertEqual(worker.labels(self.worker.remote), {'review'})
        calls = self.worker.calls
        claim = next(i for i, c in enumerate(calls) if c[:3] == ('gh', 'issue', 'edit'))
        execution = next(i for i, c in enumerate(calls) if c[:2] == ('codex', 'exec'))
        self.assertLess(claim, execution)
        self.assertEqual([c for c in calls if c[0] == 'npm'], list(worker.VALIDATION))
        self.assertFalse((self.worker.state / 'current-issue').exists())
        self.assertEqual(worker.read_json(self.worker.state / 'last-run')['result'], 'success')

    def test_dirty_tree_not_claimed(self):
        self.worker.is_dirty = True
        with self.assertRaises(worker.WorkerError):
            self.worker.work()
        self.assertEqual(worker.labels(self.worker.remote), {'ready'})
        self.assertFalse(any(c[0] == 'codex' for c in self.worker.calls))

    def test_no_issue_is_successful_idle(self):
        self.worker.no_issue = True
        self.worker.work()
        self.assertEqual(worker.read_json(self.worker.state / 'last-run')['result'], 'idle')

    def test_remote_active_issue_prevents_claim(self):
        self.worker.remote = issue(('in-progress',))
        self.worker.work()
        self.assertFalse(any(c[:3] == ('gh', 'issue', 'edit') for c in self.worker.calls))

    def test_conflicting_or_invalid_data_not_eligible(self):
        self.assertFalse(worker.eligible(issue(('ready', 'review'))))
        invalid = issue()
        invalid['number'] = '123; touch /tmp/bad'
        self.assertFalse(worker.eligible(invalid))

    def test_nonzero_exit_and_validation_failure_block(self):
        for failure in ('codex', 'validation', 'branch'):
            with self.subTest(failure=failure):
                self.worker.fail = failure
                self.worker.remote = issue()
                with self.assertRaises(worker.WorkerError):
                    self.worker.work()
                self.assertEqual(worker.labels(self.worker.remote), {'blocked'})
                self.assertIsNone(self.worker.lock)
                self.assertFalse((self.worker.state / 'current-issue').exists())

    def test_incomplete_zero_exit_blocks(self):
        self.worker.completed = False
        with self.assertRaises(worker.WorkerError):
            self.worker.work()
        self.assertEqual(worker.labels(self.worker.remote), {'blocked'})
        self.assertFalse(any(c[0] == 'npm' for c in self.worker.calls))

    def test_interrupt_blocks_and_releases_lock(self):
        self.worker.fail = 'interrupt'
        with self.assertRaises(KeyboardInterrupt):
            self.worker.work()
        self.assertEqual(worker.labels(self.worker.remote), {'blocked'})
        self.assertIsNone(self.worker.lock)

    def test_network_failure_journal_recovered_before_new_work(self):
        self.worker.fail = 'network-after-codex'
        with self.assertRaises(worker.WorkerError):
            self.worker.work()
        self.assertTrue((self.worker.state / 'current-issue').exists())
        self.worker.network_down = False
        self.worker.calls = []
        self.worker.work()
        self.assertEqual(worker.labels(self.worker.remote), {'blocked'})
        self.assertFalse(any(c[0] == 'codex' for c in self.worker.calls))
        self.assertFalse((self.worker.state / 'current-issue').exists())

    def test_completed_recovery_preserves_review(self):
        self.worker.state.mkdir()
        worker.write_json(self.worker.state / 'current-issue', {'number': 123, 'phase': 'validated'})
        self.worker.remote = issue(('review',))
        self.worker.work()
        self.assertEqual(worker.labels(self.worker.remote), {'review'})

    def test_kernel_lock_excludes_process_and_recovers_on_close(self):
        self.assertTrue(self.worker.acquire())
        context = multiprocessing.get_context('spawn')
        parent, child = context.Pipe()
        process = context.Process(target=lock_in_child, args=(str(self.root), child))
        process.start()
        self.assertFalse(parent.recv())
        process.join(10)
        self.assertEqual(process.exitcode, 0)
        self.worker.lock.close()
        other = worker.Worker(self.root)
        self.assertTrue(other.acquire())
        other.lock.close()

    def test_timeout_terminates_command(self):
        with self.assertRaises(subprocess.TimeoutExpired):
            worker.run(['/bin/sleep', '10'], timeout=0.05)

    def test_stdin_closed(self):
        self.assertEqual(worker.run(['/bin/cat']), '')

    def test_failed_command_preserves_diagnostic_and_redacts_secrets(self):
        code = "import sys; sys.stderr.write('Error: invalid configuration; token=ghp_example123\\n'); sys.exit(2)"
        with self.assertRaises(worker.WorkerError) as caught:
            worker.run([sys.executable, '-c', code], quiet=True)
        self.assertIn('invalid configuration', str(caught.exception))
        self.assertIn('exit 2', str(caught.exception))
        self.assertNotIn('ghp_example123', str(caught.exception))

    def test_noisy_stderr_is_bounded_and_drained(self):
        code = "import sys; sys.stderr.write('x' * 200000 + '\\nError: final diagnostic'); sys.exit(1)"
        with self.assertRaises(worker.WorkerError) as caught:
            worker.run([sys.executable, '-c', code], quiet=True, timeout=5)
        self.assertIn('final diagnostic', str(caught.exception))
        self.assertLess(len(str(caught.exception)), 8300)

    def test_diagnostic_redacts_environment_credentials_paths_and_headers(self):
        with patch.dict(os.environ, {'EXAMPLE_SECRET': 'unique-sensitive-value'}):
            result = worker.diagnostic(b'Error unique-sensitive-value Authorization: Bearer abcdef\n'
                                      b'api_key="two words" /Users/alice/private https://example.test/?token=abc')
        for forbidden in ('unique-sensitive-value', 'abcdef', 'two words', '/Users/alice', 'token=abc'):
            self.assertNotIn(forbidden, result)

    def test_idle_poll_preserves_last_issue_failure(self):
        self.worker.fail = 'codex'
        with self.assertRaises(worker.WorkerError):
            self.worker.work()
        before = worker.read_json(self.worker.state / 'last-run')
        self.worker.fail = None
        self.worker.no_issue = True
        self.worker.work()
        self.assertEqual(worker.read_json(self.worker.state / 'last-run'), before)
        self.assertEqual(before['number'], 123)
        self.assertIn('codex exec failed', before['reason'])
        self.assertEqual(worker.read_json(self.worker.state / 'last-check')['result'], 'idle')

    def test_child_inherits_lock_after_parent_descriptor_closed(self):
        self.assertTrue(self.worker.acquire())
        with subprocess.Popen(['/bin/sleep', '0.2'], pass_fds=(self.worker.lock.fileno(),)) as child:
            self.worker.lock.close()
            other = worker.Worker(self.root)
            self.assertFalse(other.acquire())
            child.wait()
            self.assertTrue(other.acquire())
            other.lock.close()

    def test_installer_generates_valid_plist_and_preserves_existing_labels(self):
        with patch('worker.Path.home', return_value=self.root), patch('worker.sys.platform', 'darwin'), \
                patch('worker.resolve_codex', return_value='/test/bin/codex'), \
                patch('worker.run', return_value='') as command:
            worker.scheduler(self.worker, 'install')
        plist = next((self.root / 'Library/LaunchAgents').glob('*.plist'))
        with plist.open('rb') as stream:
            data = plistlib.load(stream)
        self.assertEqual(data['StartInterval'], 60)
        self.assertTrue(data['RunAtLoad'])
        self.assertEqual(data['WorkingDirectory'], str(self.root))
        self.assertEqual(data['EnvironmentVariables']['CODEX_BIN'], '/test/bin/codex')
        self.assertTrue(data['StandardOutPath'].endswith('launchd.stdout.log'))
        self.assertFalse(any(call[:3] == ('gh', 'label', 'create') for call in self.worker.calls))
        self.assertTrue(any(call.args[0][:2] == ['launchctl', 'bootstrap'] for call in command.call_args_list))
        if worker.sys.platform == 'darwin':
            worker.run(['plutil', '-lint', str(plist)])

    def test_uninstall_keeps_plist_when_service_cannot_stop(self):
        directory = self.root / 'Library/LaunchAgents'
        directory.mkdir(parents=True)
        plist = directory / (worker.scheduler_identity(self.root) + '.plist')
        plist.write_text('retained')
        with patch('worker.Path.home', return_value=self.root), patch('worker.sys.platform', 'darwin'), \
                patch('worker.run', side_effect=[worker.WorkerError('stop failed'), 'loaded']):
            with self.assertRaisesRegex(worker.WorkerError, 'could not be stopped'):
                worker.scheduler(self.worker, 'uninstall')
        self.assertTrue(plist.exists())

    def test_status_idle_creates_no_files(self):
        worker.status(self.worker)
        self.assertEqual(list(self.root.iterdir()), [])

    def test_missing_dependency_fails_preflight(self):
        with patch('worker.shutil.which', return_value=None):
            with self.assertRaisesRegex(worker.WorkerError, 'Missing dependency: git'):
                worker.Worker(self.root).preflight()

    def test_codex_falls_back_to_app_without_path(self):
        binary = self.root / 'ChatGPT.app/Contents/Resources/codex'
        binary.parent.mkdir(parents=True)
        binary.write_text('#!/bin/sh\nexit 0\n')
        binary.chmod(0o755)
        with patch.dict(os.environ, {'PATH': '', 'CODEX_BIN': ''}), \
                patch('worker.codex_candidates', return_value=(binary,)):
            self.assertEqual(worker.resolve_codex(), str(binary))
            self.assertEqual(worker.Worker(self.root).command('codex', '--version'), '')

    def test_codex_prefers_path(self):
        with patch.dict(os.environ, {'CODEX_BIN': ''}), \
                patch('worker.shutil.which', return_value='/custom/bin/codex'):
            self.assertEqual(worker.resolve_codex(), '/custom/bin/codex')

    def test_model_default_and_explicit_override(self):
        with patch.dict(os.environ, {'CODEX_MODEL': ''}):
            self.assertEqual(worker.codex_model(), 'gpt-5.5')
        with patch.dict(os.environ, {'CODEX_MODEL': 'chosen-model'}):
            self.assertEqual(worker.codex_model(), 'chosen-model')
            self.worker.work()
        call = next(call for call in self.worker.calls if call[:2] == ('codex', 'exec'))
        self.assertEqual(call[call.index('--model') + 1], 'chosen-model')

    def test_codex_invalid_override_fails_without_fallback(self):
        with patch.dict(os.environ, {'CODEX_BIN': str(self.root / 'missing')}):
            with self.assertRaisesRegex(worker.WorkerError, 'CODEX_BIN'):
                worker.resolve_codex()

    def test_codex_missing_has_actionable_message(self):
        with patch.dict(os.environ, {'PATH': '', 'CODEX_BIN': ''}), \
                patch('worker.codex_candidates', return_value=()):
            with self.assertRaisesRegex(worker.WorkerError, 'Install Codex CLI or set CODEX_BIN'):
                worker.resolve_codex()

    def test_identifier_handles_spaces_and_distinguishes_checkouts(self):
        first = worker.scheduler_identity(Path('/one/My Repo!'))
        second = worker.scheduler_identity(Path('/two/My Repo!'))
        self.assertNotEqual(first, second)
        self.assertRegex(first, r'^com\.codex\.[a-z0-9.-]+\.worker$')

    def test_private_title_removes_common_secret_patterns(self):
        self.assertNotIn('ghp_abcd', worker.private_title('Fix ghp_abcd password=secret /Users/alice/file'))
        self.assertNotIn('/Users/alice', worker.private_title('/Users/alice/file'))


if __name__ == '__main__':
    unittest.main()

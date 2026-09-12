import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>saas_frota</h1>
      <p>Três superfícies. Mesmos dados do tenant. Cromos separados.</p>
      <ul>
        <li>
          <Link href="/loja">Loja</Link>
        </li>
        <li>
          <Link href="/saas">SaaS</Link>
        </li>
        <li>
          <Link href="/conta">Conta</Link>
        </li>
      </ul>
      <p>Usuários seed e senha: veja o README e docs/architecture/seed.md.</p>
    </main>
  );
}

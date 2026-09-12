import { AccountChrome } from "@/ui/account/AccountChrome";
import { SessionProvider } from "@/ui/session";

/** Product chrome only. No pedidos / estoque / tema. */
export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider surface="conta">
      <AccountChrome>{children}</AccountChrome>
    </SessionProvider>
  );
}

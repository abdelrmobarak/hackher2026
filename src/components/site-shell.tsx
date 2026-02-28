import Link from "next/link";

interface SiteShellProps {
  children: React.ReactNode;
}

export const SiteShell = ({ children }: SiteShellProps) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="border-b border-border-subtle bg-background/90 backdrop-blur-sm">
        <div className="max-w-screen-4xl mx-auto flex w-full items-center justify-between px-6 py-3 sm:px-10">
          <Link
            className="flex items-center gap-3 font-display text-2xl font-semibold tracking-tight text-foreground"
            href="/"
          >
            <span className="text-primary-500">+</span>
            DeepShield
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium text-muted">
            <Link
              className="rounded-full px-4 py-2 transition hover:bg-surface-strong hover:text-foreground"
              href="/protect"
            >
              Sign
            </Link>
            <Link
              className="rounded-full border border-border-subtle bg-surface px-4 py-2 text-foreground transition hover:border-primary-300 hover:text-foreground"
              href="/verify"
            >
              Check
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

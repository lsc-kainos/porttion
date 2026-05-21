interface Props {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function LandingShell({ header, footer, children }: Props) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}

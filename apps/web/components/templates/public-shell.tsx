interface Props {
  children: React.ReactNode;
}

export function PublicShell({ children }: Props) {
  return <div className="bg-background min-h-screen">{children}</div>;
}

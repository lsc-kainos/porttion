interface Props {
  eyebrow?: string;
  title: string;
  body?: string;
  actions?: React.ReactNode;
}

export function ErrorShell({ eyebrow, title, body, actions }: Props) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      {eyebrow ? (
        <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">{eyebrow}</p>
      ) : null}
      <h1 className="mt-3 font-serif text-4xl italic">{title}</h1>
      {body ? <p className="text-muted-foreground mt-4">{body}</p> : null}
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      ) : null}
    </main>
  );
}

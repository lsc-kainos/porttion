export function resetPasswordHtml(params: {
  name: string | null;
  resetUrl: string;
}): string {
  const greeting = params.name ? `Olá, ${escapeHtml(params.name)}` : 'Olá';
  return `<!doctype html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#fafafa;padding:32px;">
  <div style="max-width:480px;margin:0 auto;">
    <h1 style="font-size:20px;font-weight:500;">${greeting},</h1>
    <p>Recebemos um pedido de redefinição da sua senha no Porttion.</p>
    <p><a href="${escapeAttr(params.resetUrl)}" style="display:inline-block;background:#3b6cf5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Redefinir senha</a></p>
    <p style="color:#888;font-size:13px;">Se você não pediu isso, ignore. O link expira em 30 minutos.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ] as string,
  );
}
const escapeAttr = escapeHtml;

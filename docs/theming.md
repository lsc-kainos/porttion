# Theming

O template usa Tailwind v4 com variáveis CSS em `apps/web/app/globals.css`. A paleta padrão é a **neutra zinc** do shadcn, em light + dark mode. Para customizar a identidade visual:

## 1. Trocar a paleta

Edite `apps/web/app/globals.css`. As variáveis estão organizadas em três blocos:

- `:root { ... }` — light mode (default)
- `.dark { ... }` — dark mode (ativado via `<html class="dark">` ou `next-themes`)
- `@theme inline { ... }` — mapeia variáveis CSS para tokens Tailwind

Todas as cores são em formato OKLCH. Use [oklch.com](https://oklch.com/) para gerar paletas.

## 2. Tema cobre + conhaque (identidade Kainos original)

Para usar a paleta cobre+preto da Kainos (antes do template ser neutralizado), substitua os blocos `:root` e `.dark` por:

```css
/* Paleta Kainos: cobre/conhaque sobre preto absoluto */
:root {
  --background: oklch(0.9818 0.0054 95.0986);
  --foreground: oklch(0.3438 0.0269 95.7226);
  --card: oklch(0.9818 0.0054 95.0986);
  --card-foreground: oklch(0.1908 0.002 106.5859);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.2671 0.0196 98.939);
  --primary: oklch(0.6171 0.1375 39.0427);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.9245 0.0138 92.9892);
  --secondary-foreground: oklch(0.4334 0.0177 98.6048);
  --muted: oklch(0.9341 0.0153 90.239);
  --muted-foreground: oklch(0.4 0.0075 97.4233);
  --accent: oklch(0.9245 0.0138 92.9892);
  --accent-foreground: oklch(0.2671 0.0196 98.939);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.8847 0.0069 97.3627);
  --border-strong: oklch(0.7621 0.0156 98.3528);
  --input: oklch(0.7621 0.0156 98.3528);
  --ring: oklch(0.6171 0.1375 39.0427);
  --sidebar: oklch(0.9663 0.008 98.8792);
  --sidebar-foreground: oklch(0.359 0.0051 106.6524);
  --sidebar-primary: oklch(0.6171 0.1375 39.0427);
  --sidebar-primary-foreground: oklch(0.9881 0 0);
  --sidebar-accent: oklch(0.9245 0.0138 92.9892);
  --sidebar-accent-foreground: oklch(0.325 0 0);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0.7731 0 0);
}

.dark {
  --background: oklch(0 0 0);
  --foreground: oklch(0.8074 0.0142 93.0137);
  --card: oklch(0.04 0 0);
  --card-foreground: oklch(0.9818 0.0054 95.0986);
  --popover: oklch(0.16 0.0035 106.6039);
  --popover-foreground: oklch(0.9211 0.004 106.4781);
  --primary: oklch(0.473 0.137 46.201);
  --primary-foreground: oklch(0.96 0.012 93);
  --secondary: oklch(0.205 0 0);
  --secondary-foreground: oklch(0.9663 0.008 98.8792);
  --muted: oklch(0.2213 0.0038 106.707);
  --muted-foreground: oklch(0.7713 0.0169 99.0657);
  --accent: oklch(0.213 0.0078 95.4245);
  --accent-foreground: oklch(0.9663 0.008 98.8792);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.3618 0.0101 106.8928 / 0.6);
  --border-strong: oklch(0.3618 0.0101 106.8928);
  --input: oklch(0.4336 0.0113 100.2195);
  --ring: oklch(0.6724 0.1308 38.7559);
  --sidebar: oklch(0.07 0.0024 67.7);
  --sidebar-foreground: oklch(0.8074 0.0142 93.0137);
  --sidebar-primary: oklch(0.325 0 0);
  --sidebar-primary-foreground: oklch(0.9881 0 0);
  --sidebar-accent: oklch(0.13 0.002 106.6177);
  --sidebar-accent-foreground: oklch(0.8074 0.0142 93.0137);
  --sidebar-border: oklch(0.18 0 0);
  --sidebar-ring: oklch(0.7731 0 0);
}
```

E adicione o background atmosférico opcional:

```css
.dark body {
  background-image:
    radial-gradient(ellipse 60% 40% at 80% 0%, oklch(0.18 0.06 40 / 0.12) 0%, transparent 100%),
    radial-gradient(ellipse 50% 60% at 20% 100%, oklch(0.12 0.04 280 / 0.08) 0%, transparent 100%);
  background-attachment: fixed;
}
```

## 3. Trocar o default mode

Em `apps/web/app/layout.tsx`, a classe `dark` está no `<html>`. Para light por padrão, remova `dark` da string `className`.

## 4. Trocar o logo

Edite `apps/web/components/layout/logo.tsx` — substitua a string `"K"` e `"Kainos"` pelo seu branding (texto, SVG, lucide icon).

## 5. Trocar as fontes

Em `apps/web/app/layout.tsx`, troque `Geist`, `Geist_Mono`, `Instrument_Serif` por outras de `next/font/google`. Mantenha os names das CSS variables (`--font-sans`, `--font-mono`, `--font-serif`) — os componentes referenciam por nome.

# Deployment (Railway)

Guia rápido pra subir um app derivado do template no Railway.

## Pré-requisitos

- Conta Railway com plano que permita ≥4 serviços (postgres, redis, web, api)
- Repo do projeto no GitHub
- OAuth apps criadas no Google e GitHub apontando pro domínio Railway

## Passo a passo

### 1. Criar projeto Railway

- New Project → Deploy from GitHub repo → escolher o repo do projeto
- Railway detecta o monorepo. Para cada serviço (web e api), criar um Service apontando para a pasta correspondente.

### 2. Provisionar Postgres + Redis

- Add Service → Database → PostgreSQL
- Add Service → Database → Redis
- Railway injeta automaticamente `DATABASE_URL` e `REDIS_URL` quando você adiciona como service reference (`${{Postgres.DATABASE_URL}}`).

### 3. Configurar Volume (se usar `STORAGE_DRIVER=volume` em produção)

- No serviço da api → Volumes → Create Volume → mount em `/data`
- Setar `VOLUME_ROOT=/data` no env da api

### 4. Env vars

Setar em cada serviço:

**api:**

```
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
NEXTAUTH_SECRET=<gerar: openssl rand -base64 32>
INTERNAL_SERVICE_TOKEN=<gerar: openssl rand -base64 48>
STORAGE_URL_SECRET=<gerar: openssl rand -base64 32>
ALLOWED_ORIGINS=https://<seu-dominio-web>.railway.app
ADMIN_EMAILS=admin@suaempresa.com.br
STORAGE_DRIVER=volume   # ou r2
VOLUME_ROOT=/data       # se driver=volume
# Se driver=r2:
# R2_ACCOUNT_ID=...
# R2_ACCESS_KEY_ID=...
# R2_SECRET_ACCESS_KEY=...
# R2_BUCKET=...
# Se for usar LLM:
# OPENAI_API_KEY=...
# LLM_PROVIDER=openai
# Bull Board (opcional):
BULL_BOARD_ENABLED=true
BULL_BOARD_BASIC_AUTH_USER=admin
BULL_BOARD_BASIC_AUTH_PASSWORD=<gerar: openssl rand -base64 24>
```

**web:**

```
NODE_ENV=production
NEXTAUTH_URL=https://<seu-dominio-web>.railway.app
NEXTAUTH_SECRET=${{api.NEXTAUTH_SECRET}}              # service reference
INTERNAL_SERVICE_TOKEN=${{api.INTERNAL_SERVICE_TOKEN}} # service reference
API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}                 # ou private domain
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
# Bull Board URL (opcional, aparece no /admin):
BULL_DASHBOARD_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}/admin/queues
```

### 5. OAuth callback URLs

Atualizar nos providers:

- **Google Cloud Console** → OAuth client → Authorized redirect URIs: `https://<seu-dominio-web>.railway.app/api/auth/callback/google`
- **GitHub** → Settings → Developer settings → OAuth Apps → Authorization callback URL: `https://<seu-dominio-web>.railway.app/api/auth/callback/github`

### 6. Verificar fingerprint do NEXTAUTH_SECRET

Após o primeiro deploy, nos logs da api e do web procure:

```
[bootstrap] NEXTAUTH_SECRET fingerprint: <hash>
```

Os dois fingerprints DEVEM ser iguais. Se forem diferentes, o JWT emitido pelo web não vai ser aceito pela api — 401 em todas as requests autenticadas. Refaça a service reference.

### 7. Smoke test

- Acessar `https://<web>.railway.app/login`
- Login Google ou GitHub → deve redirecionar pra `/`
- Se seu email está em `ADMIN_EMAILS`, ver link `/admin` no topbar
- Acessar `/admin` → cards de Queues + Métricas
- Se `BULL_BOARD_ENABLED=true` e `BULL_DASHBOARD_URL` setado, o card de Bull Board abre o dashboard com basic auth

### 8. Custom domain

- Railway → Settings → Domains → Add custom domain
- Atualizar `NEXTAUTH_URL` e `ALLOWED_ORIGINS` para o domínio custom
- Atualizar callback URLs do Google/GitHub

## Troubleshooting

| Sintoma                                                           | Causa provável                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 401 em todas requests autenticadas                                | `NEXTAUTH_SECRET` diferente entre web e api (ver fingerprint)                        |
| `OPENAI_API_KEY é obrigatória quando LLM_PROVIDER=openai` no boot | Setou provider sem a key                                                             |
| Upload aparece como ok mas arquivo não baixa                      | `STORAGE_URL_SECRET` diferente entre os deploys (signed URL não valida)              |
| `/admin/queues` 401                                               | Basic auth user/pass não setados                                                     |
| Login retorna `OAuthAccountNotLinked`                             | Email já existe via outro provider — usar o original ou apagar User                  |
| Migration falha no deploy                                         | Coluna nova sem default em tabela com dados — adicionar default ou rodar manualmente |

## Resumo

<!-- 1-3 frases. Conecte com a fase / spec que essa PR implementa. -->

## Checklist

- [ ] CI verde (lint + typecheck + tests + build + e2e + i18n-check)
- [ ] Comentários **P0** resolvidos
- [ ] Sem `--no-verify` em hooks
- [ ] Sem hardcode de string visível (passou pelo `i18n-check`)
- [ ] Ownership: toda query nova de dado de usuário filtra por `userId`
- [ ] Nenhuma chave/segredo no client
- [ ] Migrações Prisma reversíveis (ou marcadas como destrutivas com plano)

## Como testar

<!-- Passo a passo manual. Inclua URL/comando para reproduzir. -->

## Screenshots / vídeos

<!-- Se mudou UI, anexar mobile (375px) e desktop. -->

## Rotas / contratos afetados

<!-- Listar endpoints, schemas, eventos. Quebra de contrato = P0. -->

## Severidade da review

| Sev    | Descrição                                             | Resolução                        |
| ------ | ----------------------------------------------------- | -------------------------------- |
| **P0** | Bug, regressão, falha de segurança, contrato quebrado | Obrigatório antes do merge       |
| **P1** | Refactor / UX / perf importante                       | Issue ou follow-up; não bloqueia |
| **P2** | Nit / opinião                                         | Opcional                         |

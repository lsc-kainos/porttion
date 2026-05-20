# ai-runtime

Facade provider-agnóstica para LLMs (Vercel AI SDK `generateObject`) + versionamento de configs (`LlmConfig`).

## Por que existe

- Centraliza chamadas a LLM em um único lugar com retry, validação via Zod schemas e logging consistente.
- Permite versionar prompts (`LlmConfig` no banco) sem deploy — admins iteram em prompts via UI/endpoint.
- Provider-agnóstico: hoje só OpenAI, mas a interface (`modelFor`) permite plugar Anthropic/Google sem mudar o consumidor.

## Como usar

```ts
// 1. Ative uma config no banco (via endpoint POST /api/v1/admin/llm-configs/:id/activate
//    ou diretamente no seed)
//
// 2. Consuma no seu serviço:
constructor(private readonly ai: AiRuntimeService) {}

const result = await this.ai.generateObject({
  key: 'meu-extrator', // string livre, definida pelo seu projeto
  schema: mySchema,    // Zod schema do output esperado
  messages: [{ role: 'user', content: 'Extraia X do texto Y' }],
});
```

## Adicionar uma nova LLM config (admin)

```bash
POST /api/v1/admin/llm-configs
{ "key": "meu-extrator", "model": "gpt-4o", "prompt": "Você é...", "params": { "temperature": 0 } }

POST /api/v1/admin/llm-configs/:id/activate
```

## Adicionar um novo provider

Edite `providers/provider-registry.ts` e `providers/available-models.ts` para incluir
o novo provider e seus modelos. A interface `modelFor(modelId)` retorna um `LanguageModel`
do Vercel AI SDK.

## Para desligar este módulo

Ver `docs/modules.md` na raiz.

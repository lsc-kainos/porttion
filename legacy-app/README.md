# Porttion — Portfolio Evaluation

Plataforma multipágina em Streamlit para análise de ativos com candlestick e apoio de IA.

## Funcionalidades

- Gestão de carteira de ativos
- Validação de ticker com Yahoo Finance
- Dashboard com gráfico candlestick e seleção de período (`S`, `2S`, `M`, `6M`)
- Análise individual por IA (OpenAI)
- Relatório consolidado em Markdown
- Exportação de relatório para PDF
- Persistência local via `localStorage` e arquivo local

## Tecnologias

- Python
- Streamlit
- Pandas
- Yahoo Finance (`yfinance`)
- OpenAI API
- Plotly
- FPDF2

## Estrutura do Projeto

```text
app.py
Procfile
railway.json
runtime.txt
pages/
  home.py
  carteira.py
  dashboard.py
  relatorio.py
  configuracoes.py
services/
  data_provider.py
  ai_agent.py
  config.py
  local_storage.py
  portfolio.py
  report_export.py
components/
  candlestick_chart.py
portfolio.json
requirements.txt
```

## Requisitos

- Python 3.11+
- Conta OpenAI com API key válida

## Instalação

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Execução

```bash
streamlit run app.py
```

## Deploy no Railway

Este repositório já está preparado para deploy no Railway com:

- `Procfile` com comando web
- `railway.json` com build/deploy
- `runtime.txt` para fixar versão do Python

### Passo a passo

1. Crie um novo projeto no Railway conectando este repositório.
2. No serviço, configure as variáveis:
   - `OPENAI_API_KEY` (obrigatória para análise com IA)
   - `OPENAI_MODEL` (opcional, padrão no app: `gpt-4o-mini`)
3. Faça deploy (o Railway usa `NIXPACKS` automaticamente via `railway.json`).
4. Abra a URL pública gerada pelo Railway.

Observação:

- A variável `PORT` é injetada automaticamente pelo Railway e usada no start command.

## Configuração

Na página **Configurações**, defina:

- `OpenAI API key`
- Modelo (`gpt-4o-mini`, `gpt-4o`, `gpt-5` ou custom)
- Estratégia de persistência:
  - `LocalStorage (navegador)`
  - `Sessão`
  - `Arquivo local (config.json)`

Também é possível usar variáveis de ambiente:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Observações de Ticker

- A carteira aceita códigos como `BOVA11`, `PETR4`, `FIQE3`.
- Para ativos especiais (ex.: `DOL`, `EUR`) existe resolução por aliases internos.
- Se um ativo não for encontrado no Yahoo Finance, ele não será analisado.

## Segurança

- Não versione chaves reais de API.
- `config.json` e `.env` devem ficar fora do repositório.

## Contribuição

Contribuições são bem-vindas.

1. Faça um fork
2. Crie uma branch (`feature/minha-feature`)
3. Commit das alterações
4. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).

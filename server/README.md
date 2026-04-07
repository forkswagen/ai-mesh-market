# depai-orchestrator

Минимальный бэкенд для хакатон-демо: SQLite + вызовы `data_arbiter` на Solana devnet через сырые инструкции Anchor.

См. [docs/API_CONTRACT.md](../docs/API_CONTRACT.md) — тот же контракт можно реализовать в `depai-backend`.

## Railway

Корень сервиса в Railway = эта папка (`server/`). См. [railway.toml](railway.toml) (builder **RAILPACK**) и раздел в корневом [README.md](../README.md#бэкенд-на-railway). Если Railpack падает — проверь **Root Directory = server**; fallback — [Dockerfile](Dockerfile).

## Запуск

### Быстро для демо (локальный devnet)

Из **корня** монорепо:

```bash
npm run setup:devnet
```

Создаёт `server/.env` с тремя keypair и пытается airdrop. Если RPC ответил **429** — пополни вручную:

```bash
npm run demo:addrs
```

Адреса открой в [faucet.solana.com](https://faucet.solana.com) (network **devnet**, по ~1–2 SOL на каждый).

### Вручную

```bash
cp .env.example .env
# заполни BUYER_SECRET_JSON, SELLER_SECRET_JSON, ORACLE_SECRET_JSON (JSON array bytes как в solana-keygen)
npm install
npm run dev
```

Все три ключа должны иметь SOL на devnet. Покупатель дополнительно оплачивает `amountLamports` при `deposit`.

Проверка: из корня `npm run demo:check` (оркестратор должен слушать **:8787**).

## LLM oracle

Опционально: `ORACLE_LLM_URL` (OpenAI-compatible), `ORACLE_LLM_MODEL`, `ORACLE_LLM_API_KEY`. Иначе используется эвристика (JSONL) в `src/heuristicJudge.js`.

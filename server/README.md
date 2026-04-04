# depai-orchestrator

Минимальный бэкенд для хакатон-демо: SQLite + вызовы `data_arbiter` на Solana devnet через сырые инструкции Anchor.

См. [docs/API_CONTRACT.md](../docs/API_CONTRACT.md) — тот же контракт можно реализовать в `depai-backend`.

## Запуск

```bash
cp .env.example .env
# заполни BUYER_SECRET_JSON, SELLER_SECRET_JSON, ORACLE_SECRET_JSON (JSON array bytes как в solana-keygen)
npm install
npm run dev
```

Все три ключа должны иметь SOL на devnet. Покупатель дополнительно оплачивает `amountLamports` при `deposit`.

## LLM oracle

Опционально: `ORACLE_LLM_URL` (OpenAI-compatible), `ORACLE_LLM_MODEL`, `ORACLE_LLM_API_KEY`. Иначе используется эвристика (JSONL) в `src/heuristicJudge.js`.

# NexusAI

Маркетплейс задач, датасетов, GPU и AI-агентов. В репозитории также лежит Solana / Anchor-модуль **dataset escrow** с инструкцией **`ai_judge`** (автономная выплата или возврат).

## Solana program · `data_arbiter` (devnet)

- **Program ID:** `9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg`
- **Код:** `programs/data_arbiter/src/lib.rs`
- **Документация по инструкциям:** `programs/README.md`
- **Фронт-хелперы:** `src/lib/solana/escrow.ts`
- **Оффчейн проверки датасета (до LLM / tx):** `src/lib/judge/datasetJudge.ts`

Сборка контракта: `anchor build` (нужны Anchor CLI и Rust toolchain).

## Фронтенд

```bash
npm install
npm run dev
```

## Деплой (Vercel)

В корне есть `vercel.json` с SPA-fallback для React Router.

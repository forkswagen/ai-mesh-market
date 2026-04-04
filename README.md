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

В dev открой [http://127.0.0.1:5173](http://127.0.0.1:5173). Для страницы **AI Escrow** нужен оркестратор (см. ниже).

## Оркестратор (демо-бэкенд) · `server/`

Локальный сервис: SQLite + полный on-chain цикл `initialize_escrow` → `deposit` → `submit_dataset_hash` → эвристика или **LLM** → `ai_judge`.

- Контракт REST и маппинг на `depai-backend`: [docs/API_CONTRACT.md](docs/API_CONTRACT.md)
- Настройка: скопируй [server/.env.example](server/.env.example) в `server/.env` и вставь три keypair (JSON-массив байт) + пополни **buyer/seller/oracle** на devnet.

```bash
cd server && npm install && npm run dev
# в другом терминале из корня:
npm run dev
```

На фронте в разделе **AI Escrow** нажми «Запустить seeded demo». В продакшене задай `VITE_API_BASE_URL` на задеплоенный API.

## Деплой (Vercel)

Фронт: `vercel.json` (build `dist/`, SPA fallback). Задай **VITE_API_BASE_URL** на хост оркестратора (Railway/Fly/Render и т.д.) и разреши CORS (`VITE_DEV_ORIGIN` / прод-домен в `server`).

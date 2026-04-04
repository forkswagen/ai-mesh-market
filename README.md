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

В dev открой [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite проксирует `/api` и `/health` на оркестратор **:8787** по умолчанию ([`vite.config.ts`](vite.config.ts)).

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

### Главный сценарий (около 5 минут)

Цель: убедиться, что **AI-oracled escrow** на Solana devnet проходит полный цикл до `ai_judge`.

1. **Предусловия:** в `server/.env` (шаблон [server/.env.example](server/.env.example)) заданы `BUYER_SECRET_JSON`, `SELLER_SECRET_JSON`, `ORACLE_SECRET_JSON` — JSON-массив байт в формате Solana keypair. На **devnet** у всех трёх есть SOL; покупатель дополнительно покрывает сумму `deposit` ([server/README.md](server/README.md)).
2. **Установка:** из корня `npm install`, в `server/` при необходимости `npm install`.
3. **Запуск одной командой** из корня репозитория:

   ```bash
   npm run dev:demo
   ```

   Поднимается Vite (**5173**) и оркестратор (**8787**). Альтернатива — два терминала: `npm run server:dev` и `npm run dev`.
4. **В браузере:** открой [http://127.0.0.1:5173/escrow](http://127.0.0.1:5173/escrow). Должен быть зелёный статус оркестратора; нажми **«Запустить seeded demo»**.
5. **Ожидание:** в списке сделок появилась запись со статусом `settled` и ссылкой на транзакцию `ai_judge` (Solscan devnet).

**Troubleshooting**

- Нет ответа `/health` / красный статус — оркестратор не запущен или не слушает **8787**; проверь [vite.config.ts](vite.config.ts) (прокси на `127.0.0.1:8787`).
- Ответ **503** про ключи — не заполнен `server/.env` или отсутствуют секреты.
- Ошибка on-chain / RPC — сеть devnet, балансы кошельков, при необходимости `SOLANA_RPC_URL` в `server/.env`.

Опционально в **`.env.local`** задай `VITE_DEPAI_DEV_WALLET` для совместимости с auth-флоу на других бэкендах; локальный оркестратор отдаёт `GET /api/deals` и без JWT.

## Деплой (Vercel)

Фронт: `vercel.json` (build `dist/`, SPA fallback). Задай **VITE_API_BASE_URL** на хост оркестратора (Railway/Fly/Render и т.д.) и разреши CORS (`VITE_DEV_ORIGIN` / прод-домен в `server`).

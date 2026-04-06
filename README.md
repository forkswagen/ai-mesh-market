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

В dev открой [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite проксирует `/api`, `/health` и **`/ws`** на оркестратор **:8787** ([`vite.config.ts`](vite.config.ts)). **SolToloka (HTTP):** фронт ходит на публичный **`https://soltoloka-backend.vercel.app`** (или `VITE_SOLToloka_API_URL`); Swagger: [soltoloka-backend.vercel.app/docs](https://soltoloka-backend.vercel.app/docs).

### SolToloka: связка фронт · бэк · агент

| Компонент | Что настроить |
|-----------|----------------|
| **Фронт** ([`/soltoloka`](http://127.0.0.1:5173/soltoloka)) | Уже дергает API по [`soltoloka.ts`](src/lib/api/soltoloka.ts). Для своего инстанса — `VITE_SOLToloka_API_URL` в Vercel / `.env.local`. |
| **Бэк** ([`forkswagen/soltoloka-backend`](https://github.com/forkswagen/soltoloka-backend)) | Postgres, Redis, `.env`, `uvicorn`. Ноды: **POST `/api/v1/compute/register`** (JWT). WebSocket: **`/api/v1/ws/connect/{node_id}`** — при старте бэка путь пишется в лог. Для **агентов** надёжнее хост с нормальным **wss** (Railway/VM), не serverless. |
| **Агент** ([`forkswagen/soltoloka-agent`](https://github.com/forkswagen/soltoloka-agent)) | Клон рядом с монорепо или отдельно. `.env` из **`.env.example`**: **`BACKEND_WS_URL`**, **`NODE_ID`**, **`LM_STUDIO_URL`**. Запуск: `python src/main.py`. README в репозитории агента. |

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

**Live-обновления:** страница escrow подключается к **`wss://…/ws`** / **`ws://…/ws`** на **том же хосте, что и REST** (из `VITE_API_BASE_URL`: `https` → `wss`, `http` → `ws`). Статический хостинг (например Vercel) WebSocket не отдаёт — канал всегда к оркестратору. На **Railway** апгрейд WebSocket обычно проходит без отдельной настройки.

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

## Деплой (Vercel) — прод

**Публичный фронт:** [https://ai-mesh-market.vercel.app](https://ai-mesh-market.vercel.app) · AI Escrow: [/escrow](https://ai-mesh-market.vercel.app/escrow).

### Что сделать вручную в дашборде Vercel

1. **Project → Settings → Environment Variables**
2. Добавить **`VITE_API_BASE_URL`** = публичный URL оркестратора (Railway / Render и т.д., например `https://….up.railway.app`) **без** завершающего `/`.
3. **SolToloka (`/soltoloka`):** по умолчанию в бандле уже **`https://soltoloka-backend.vercel.app`**. Укажи **`VITE_SOLToloka_API_URL`** только если нужен другой инстанс. CORS на бэке должен допускать origin фронта.
4. Опционально: **`VITE_DEPAI_DEV_WALLET`** — публичный Solana-адрес (см. [.env.example](.env.example)).
5. **Deployments → Redeploy** (переменные `VITE_*` вшиваются на **build**).

### Бэкенд на Railway

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo** → выбери `ai-mesh-market`.
2. Добавь **сервис** из этого репо → **Settings → Root Directory** = **`server`** (обязательно; иначе Railpack смотрит корень монорепо и падает с *Error creating build plan with Railpack*).
3. **Variables** (аналог `.env`, только в UI Railway) — все из [server/.env.example](server/.env.example):
   - `SOLANA_RPC_URL`, `PROGRAM_ID`, `BUYER_SECRET_JSON`, `SELLER_SECRET_JSON`, `ORACLE_SECRET_JSON`
   - **`VITE_DEV_ORIGIN`** = `https://ai-mesh-market.vercel.app` (или с запятой и локалкой — см. [server/.env.example](server/.env.example))
   - `PORT` **не задавай** — Railway подставит сама; приложение уже читает `process.env.PORT`.
4. После деплоя скопируй **публичный URL** (Generate Domain) и вставь в Vercel как **`VITE_API_BASE_URL`**, затем **Redeploy** фронта.

В [`server/railway.toml`](server/railway.toml) указан **RAILPACK** (не `nixpacks`). Если сборка всё ещё падает — в логах **View logs**; запасной вариант: в настройках сервиса выставить **Dockerfile** и использовать [`server/Dockerfile`](server/Dockerfile) (сборка `better-sqlite3` с `g++`). Задан **Node ≥ 20** в [`server/package.json`](server/package.json).

### Что сделать на бэке (любой хостинг)

В **Environment** задать **`VITE_DEV_ORIGIN`** так, чтобы в список CORS попал прод-фронт:

- Минимум: `https://ai-mesh-market.vercel.app`
- Либо несколько через **запятую**: `https://ai-mesh-market.vercel.app,http://localhost:5173` (см. [server/.env.example](server/.env.example))

После смены env — перезапуск сервиса.

Фронт: [`vercel.json`](vercel.json) (build `dist/`, SPA fallback).

## Сдача хакатона (National Solana Hackathon by Decentrathon)

- **Кейс:** 2 — AI + Blockchain (autonomous / AI-oracled escrow).
- **Colosseum:** загрузить решение (в ТЗ: без сдачи на Colosseum работа не принимается).
- **Форма Google:** [https://forms.gle/ZfKofXP5ymxW69o48](https://forms.gle/ZfKofXP5ymxW69o48)
- **Дедлайн (по ТЗ):** до 23:59 **7 апреля 2026** (GMT+5).

В описании укажи: ссылку на **GitHub**, **Program ID** (см. выше), URL фронта, кратко шаги из раздела «Главный сценарий» / прод выше.

**Питч 3–5 минут:** черновой сценарий — [docs/PITCH_OUTLINE.md](docs/PITCH_OUTLINE.md).

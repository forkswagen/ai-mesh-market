# Escora

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

В dev открой [http://127.0.0.1:5173](http://127.0.0.1:5173). REST и **`/health`** идут на **единый бэкенд SolToloka** — по умолчанию **`https://soltoloka-backend.vercel.app`** ([`src/lib/api/backendOrigin.ts`](src/lib/api/backendOrigin.ts)); при необходимости прокси в [`vite.config.ts`](vite.config.ts) указывает туда же. Swagger: [soltoloka-backend.vercel.app/docs](https://soltoloka-backend.vercel.app/docs).

### SolToloka: связка фронт · бэк · агент

| Компонент | Что настроить |
|-----------|----------------|
| **Фронт** ([`/soltoloka`](http://127.0.0.1:5173/soltoloka)) | Уже дергает API по [`soltoloka.ts`](src/lib/api/soltoloka.ts). Для своего инстанса — `VITE_SOLToloka_API_URL` в Vercel / `.env.local`. |
| **Бэк** ([`forkswagen/soltoloka-backend`](https://github.com/forkswagen/soltoloka-backend)) | Postgres, Redis, `.env`, `uvicorn`. Ноды: **POST `/api/v1/compute/register`** (JWT). WebSocket: **`/api/v1/ws/connect/{node_id}`** — при старте бэка путь пишется в лог. Для **агентов** надёжнее хост с нормальным **wss** (Railway/VM), не serverless. |
| **Агент** ([`forkswagen/soltoloka-agent`](https://github.com/forkswagen/soltoloka-agent)) | Один репо: воркер **`python src/main.py`** и демо-настройка LM/backend — **`streamlit run streamlit_app/app.py`** (хост/порт LM Studio, WS бэка, `NODE_ID`, запись в `.env`). Запросы к локальным LLM пользователей идут **только** как фронт → бэк → WS → агент → LM Studio. |

## Бэкенд (прод): [forkswagen/soltoloka-backend](https://github.com/forkswagen/soltoloka-backend) · Vercel

Целевой API для фронта — **SolToloka FastAPI** (деплой **`https://soltoloka-backend.vercel.app`**). Один репозиторий, один хост для REST, **`/soltoloka`** и остальных вызовов через [`apiUrl` / `getBackendOrigin`](src/lib/api/backendOrigin.ts).

Переопределение URL: **`VITE_API_BASE_URL`** или **`VITE_SOLToloka_API_URL`** (без `/` в конце). На FastAPI в CORS добавьте origin фронта (например `https://ai-mesh-market.vercel.app`).

Ручки вроде **`/api/deals`**, **`POST /api/demo/seeded`**, **`/ws/agent`** сейчас реализованы в **Node-оркестраторе** этого монорепо (`server/`). Если на Vercel нужен только soltoloka-backend, перенесите эти маршруты туда или поднимайте `server/` локально для escrow-demo.

## Опционально: оркестратор escrow · `server/` (Node)

Локальный сервис: Postgres/SQLite + цикл `initialize_escrow` → … → `ai_judge` (см. [docs/API_CONTRACT.md](docs/API_CONTRACT.md)).

```bash
cd server && npm install && npm run dev
npm run dev   # из корня, параллельно
```

**WebSocket / LM Studio:** ориентированы на `server/`. При работе только через soltoloka-backend каналы могут быть недоступны, пока не реализованы на FastAPI.

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

- Нет ответа `/health` — проверь доступность soltoloka-backend (или `VITE_API_BASE_URL`), CORS и путь `/health` на FastAPI.
- **503** и про ключи в seeded demo — не реализовано на выбранном бэкенде или не заполнен `server/.env` при локальном Node-оркестраторе.
- Ошибка on-chain / RPC — devnet, балансы, `VITE_SOLANA_RPC_URL` / `SOLANA_RPC_URL` в `server/.env` для локального сценария.

Опционально в **`.env.local`** задай `VITE_DEPAI_DEV_WALLET` для совместимости с auth-флоу на других бэкендах; локальный оркестратор отдаёт `GET /api/deals` и без JWT.

## Деплой (Vercel) — прод

**Фронт:** [https://ai-mesh-market.vercel.app](https://ai-mesh-market.vercel.app) · **Бэкенд:** [soltoloka-backend.vercel.app](https://soltoloka-backend.vercel.app) (тот же репозиторий, что и для SolToloka).

### Фронт (этот репозиторий → Vercel)

1. **Project → Settings → Environment Variables**
2. Опционально **`VITE_API_BASE_URL`** / **`VITE_SOLToloka_API_URL`** — если инстанс бэкенда не `https://soltoloka-backend.vercel.app`.
3. Для страницы **Tasks** — **`VITE_ORCHESTRATOR_URL`**: публичный URL Node-оркестратора (`server/` с `DATABASE_URL` и `GET/POST /api/tasks`). SolToloka FastAPI эти маршруты не содержит. Устаревший алиас: `VITE_VERBITTO_API_URL`.
4. Опционально **`VITE_DEPAI_DEV_WALLET`**, **`VITE_SOLANA_RPC_URL`** и др. — см. [.env.example](.env.example).
5. **Redeploy** после смены `VITE_*` (вшиваются в **build**).

Сборка: [`vercel.json`](vercel.json) (`dist/`, SPA fallback).

### Бэкенд (soltoloka-backend → Vercel)

Отдельный проект Vercel из [**forkswagen/soltoloka-backend**](https://github.com/forkswagen/soltoloka-backend). В CORS FastAPI укажите origin фронта (`https://ai-mesh-market.vercel.app`, локальный `http://localhost:5173` и т.д.).

### Опционально: Node `server/` на Railway

Если нужны без изменений ручки **`/api/deals`**, LM Studio и WebSocket из монорепо — задеплойте [`server/`](server/) (Root Directory **`server`**, см. [server/.env.example](server/.env.example), **`VITE_DEV_ORIGIN`** для CORS) и тогда задайте **`VITE_API_BASE_URL`** на этот URL вместо soltoloka-backend.

## Сдача хакатона (National Solana Hackathon by Decentrathon)

- **Кейс:** 2 — AI + Blockchain (autonomous / AI-oracled escrow).
- **Colosseum:** загрузить решение (в ТЗ: без сдачи на Colosseum работа не принимается).
- **Форма Google:** [https://forms.gle/ZfKofXP5ymxW69o48](https://forms.gle/ZfKofXP5ymxW69o48)
- **Дедлайн (по ТЗ):** до 23:59 **7 апреля 2026** (GMT+5).

В описании укажи: ссылку на **GitHub**, **Program ID** (см. выше), URL фронта, кратко шаги из раздела «Главный сценарий» / прод выше.

**Питч 3–5 минут:** черновой сценарий — [docs/PITCH_OUTLINE.md](docs/PITCH_OUTLINE.md).

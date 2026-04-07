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

В dev открой [http://127.0.0.1:5173](http://127.0.0.1:5173). REST, **`/health`**, escrow и задачи идут на **Node-оркестратор** (`server/`) — по умолчанию **`http://127.0.0.1:8787`** при `npm run server:dev` ([`src/lib/api/backendOrigin.ts`](src/lib/api/backendOrigin.ts)). Прокси Vite в [`vite.config.ts`](vite.config.ts) тоже смотрит на этот порт. Страница **SolToloka** по желанию ходит в отдельный FastAPI (`VITE_SOLToloka_API_URL` или публичный демо-URL в коде).

### SolToloka: связка фронт · бэк · агент

| Компонент | Что настроить |
|-----------|----------------|
| **Фронт** ([`/soltoloka`](http://127.0.0.1:5173/soltoloka)) | Только эта страница: API по [`soltoloka.ts`](src/lib/api/soltoloka.ts). Свой инстанс — **`VITE_SOLToloka_API_URL`**. Остальной фронт (`/escrow`, `/tasks`, health) — **`VITE_API_BASE_URL`** → оркестратор. |
| **Бэк** ([`forkswagen/soltoloka-backend`](https://github.com/forkswagen/soltoloka-backend)) | Postgres, Redis, `.env`, `uvicorn`. Ноды: **POST `/api/v1/compute/register`** (JWT). WebSocket: **`/api/v1/ws/connect/{node_id}`** — при старте бэка путь пишется в лог. Для **агентов** надёжнее хост с нормальным **wss** (Railway/VM), не serverless. |
| **Агент** ([`forkswagen/soltoloka-agent`](https://github.com/forkswagen/soltoloka-agent)) | Один репо: воркер **`python src/main.py`** и демо-настройка LM/backend — **`streamlit run streamlit_app/app.py`** (хост/порт LM Studio, WS бэка, `NODE_ID`, запись в `.env`). Запросы к локальным LLM пользователей идут **только** как фронт → бэк → WS → агент → LM Studio. |

## Бэкенд (прод): Node-оркестратор `server/`

Целевой API для фронта (escrow, tasks, LM, WebSocket) — **деплой [`server/`](server/)**. Задайте **`VITE_API_BASE_URL`** на этот URL (без `/` в конце); в CORS оркестратора укажите **`VITE_DEV_ORIGIN`** = origin фронта.

**SolToloka FastAPI** ([forkswagen/soltoloka-backend](https://github.com/forkswagen/soltoloka-backend)) опционален: только страница **`/soltoloka`**, переменная **`VITE_SOLToloka_API_URL`** (или дефолт демо-хоста в коде).

## Опционально: оркестратор escrow · `server/` (Node)

Локальный сервис: Postgres/SQLite + цикл `initialize_escrow` → … → `ai_judge` (см. [docs/API_CONTRACT.md](docs/API_CONTRACT.md)).

```bash
cd server && npm install && npm run dev
npm run dev   # из корня, параллельно
```

**WebSocket / LM Studio / oracle-worker:** реализованы в `server/` (`/ws`, `/ws/agent`, `/ws/oracle-worker`).

**Локальный хост агента (LM Studio у пользователя):** панель Streamlit [`streamlit/agent_host_panel.py`](streamlit/agent_host_panel.py) — проверка оркестратора и LM Studio (`/v1/models`), вкл/выкл приёма задач, готовая команда для `oracle-worker`. Запуск: `pip install -r streamlit/requirements.txt`, затем **`npm run agent-host:panel`** из корня (UI на [http://127.0.0.1:8501](http://127.0.0.1:8501)). Воркер по-прежнему отдельным процессом: `npm run oracle-worker --prefix server`.

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

- Нет ответа `/health` — подними `server/` на :8787 или задай `VITE_API_BASE_URL` на деплой оркестратора; проверь CORS (`VITE_DEV_ORIGIN` на сервере).
- **503** и про ключи в seeded demo — не реализовано на выбранном бэкенде или не заполнен `server/.env` при локальном Node-оркестраторе.
- Ошибка on-chain / RPC — devnet, балансы, `VITE_SOLANA_RPC_URL` / `SOLANA_RPC_URL` в `server/.env` для локального сценария.

Опционально в **`.env.local`** задай `VITE_DEPAI_DEV_WALLET` для совместимости с auth-флоу на других бэкендах; локальный оркестратор отдаёт `GET /api/deals` и без JWT.

## Деплой (Vercel) — прод

**Фронт:** [https://ai-mesh-market.vercel.app](https://ai-mesh-market.vercel.app) · **Оркестратор:** свой деплой `server/` (Railway и т.д.); **SolToloka** — опционально отдельный FastAPI.

### Фронт (этот репозиторий → Vercel)

1. **Project → Settings → Environment Variables**
2. **`VITE_API_BASE_URL`** — URL деплоя Node-оркестратора (`server/`), обязателен для escrow/tasks в проде.
3. Опционально **`VITE_SOLToloka_API_URL`** — только для страницы `/soltoloka`.
4. Опционально **`VITE_DEPAI_DEV_WALLET`**, **`VITE_SOLANA_RPC_URL`** — см. [.env.example](.env.example).
5. **Redeploy** после смены `VITE_*` (вшиваются в **build**).

Сборка: [`vercel.json`](vercel.json) (`dist/`, SPA fallback).

### Бэкенд: Node `server/` (Railway / VPS / локально)

Для escrow, задач и WebSocket задеплойте [`server/`](server/) (Root Directory **`server`**, [server/.env.example](server/.env.example), **`VITE_DEV_ORIGIN`** в CORS). На фронте задайте **`VITE_API_BASE_URL`** на этот URL.

### Опционально: SolToloka FastAPI (только `/soltoloka`)

Отдельный деплой [**forkswagen/soltoloka-backend**](https://github.com/forkswagen/soltoloka-backend) и **`VITE_SOLToloka_API_URL`** на фронте, если нужна страница compute-нод.

## Сдача хакатона (National Solana Hackathon by Decentrathon)

- **Кейс:** 2 — AI + Blockchain (autonomous / AI-oracled escrow).
- **Colosseum:** загрузить решение (в ТЗ: без сдачи на Colosseum работа не принимается).
- **Форма Google:** [https://forms.gle/ZfKofXP5ymxW69o48](https://forms.gle/ZfKofXP5ymxW69o48)
- **Дедлайн (по ТЗ):** до 23:59 **7 апреля 2026** (GMT+5).

В описании укажи: ссылку на **GitHub**, **Program ID** (см. выше), URL фронта, кратко шаги из раздела «Главный сценарий» / прод выше.

**Питч 3–5 минут:** черновой сценарий — [docs/PITCH_OUTLINE.md](docs/PITCH_OUTLINE.md).

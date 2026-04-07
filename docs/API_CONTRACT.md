# API contract — Escora escrow orchestrator

Совместимо с отдельным [`depai-backend`](https://github.com/forkswagen/depai-backend): те же пути и модели можно реализовать там или проксировать сюда.

**Base URL:** Node-оркестратор `server/` — локально `http://localhost:8787`, на фронте задаётся **`VITE_API_BASE_URL`** (в dev без переменной используется `http://127.0.0.1:8787`).

## Маппинг `deal_id` ↔ on-chain

- Поле **`dealId`** (number / u64) в API **совпадает** с `deal_id` в программе `data_arbiter` и с сидом PDA `escrow[buyer, seller, dealId]`.
- **Program ID (devnet):** `9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg`

## Кто подписывает `ai_judge`

- В демо по умолчанию — **ключ оркула на сервере** (`ORACLE_SECRET_JSON`), хранится только в `.env`, не в браузере.
- Для продакшена: HSM / отдельный сервис / ограничение доступа к эндпоинту.

## Очередь оракула на локальных LM (агенты)

1. Процессы **`npm run oracle-worker --prefix server`** подключаются к **`WS /ws/oracle-worker`** (опционально `?id=my-node`).
2. Оркестратор рассылает **`oracle_eval`** `{ jobId, deliverableText, model, temperature }`; воркер отвечает **`oracle_result`** `{ jobId, ok, verdict?, reason?, error? }` после вызова своего LM Studio.
3. Выбор воркера: **`ORACLE_WORKER_STRATEGY=round_robin`** (по умолчанию) среди свободных подключений или **`random`**. Если воркеров нет, истек таймаут (`ORACLE_WORKER_TIMEOUT_MS`) или ошибка — используется LM на сервере (`LM_STUDIO_BASE_URL` / `ORACLE_LLM_URL`) или эвристика.
4. **`GET /api/agent/oracle-workers`** — счётчики и массив **`agents`**: `logicalId`, `sessionId`, `name`, **`accepting`**, `busy`.
5. **`GET /api/agent/live`** — только список агентов (как в `agents` выше).
6. Чат через выбранный хост: **`POST /api/agent/infer`** с телом `{ "agentId": "<logicalId>", "messages": [{ "role": "user", "content": "..." }], "model": "", "temperature": 0.7 }`. Оркестратор шлёт на WebSocket **`lm_chat`**; воркер отвечает **`lm_chat_result`** `{ jobId, ok, text?, error? }`.
7. Вкл/выкл приёма задач на хосте (тот же `logicalId`, что `?id=` при подключении): **`POST /api/agent/control/accepting`** с `{ "logicalId": "my-node", "accepting": true|false, "secret": "..." }` и/или заголовок **`X-Agent-Control-Secret`**. В **production** на сервере должен быть задан **`AGENT_CONTROL_SECRET`**.
8. В **`POST /api/deals`**, **`POST /api/demo/seeded`**, **`POST /api/agent/oracle`** опционально **`oracleWorkerAgentId`** (logicalId) — оракул идёт в указанный воркер, иначе round-robin среди `accepting`.

## Эндпоинты

### `GET /api/meta`

Диагностика деплоя: **`apiRevision`**, **`serverSrcDir`**, **`db`** (`pg` / `sqlite`), список agent-endpoints. Если здесь нет `apiRevision` ≥ 3 или нет `GET /api/agent/live` в списке — на порту крутится **старая** сборка оркестратора (перезапустите `server/`).

### `GET /health`

Проверка живости. Ответ (совместим с фронтом `fetchApiHealth`):

```json
{
  "status": "ok",
  "app": "depai-orchestrator",
  "env": "development",
  "ok": true,
  "programId": "9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg"
}
```

### `POST /api/v1/auth/challenge` · `POST /api/v1/auth/verify`

Мок для локального оркестратора: те же пути, что у depai-backend, чтобы фронт с `VITE_DEPAI_DEV_WALLET` мог получить токен через [`depaiAuth`](../src/lib/api/depaiAuth.ts). Подпись **не проверяется** — только для dev.

### `GET /api/deals`

Список сделок из БД оркестратора.

### `GET /api/deals/:id`

`id` — UUID записи оркестратора. Возвращает статусы и подписи транзакций при наличии.

### `POST /api/deals`

Создать сделку и (опционально) выполнить on-chain шаги до `Submitted`.

Body (JSON):

```json
{
  "dealId": 1001,
  "buyerPublicKey": "<base58>",
  "sellerPublicKey": "<base58>",
  "amountLamports": 1000000,
  "expectedHashHex": "00...64 hex",
  "deliverableText": "{\"text\":\"hello\",\"label\":1}\n...",
  "runChain": true
}
```

- Если `runChain: true` и заданы `BUYER_SECRET_JSON`, `SELLER_SECRET_JSON`, `ORACLE_SECRET_JSON` в `.env`, сервер выполнит `initialize_escrow` → `deposit` → `submit_dataset_hash` → heuristic/LLM oracle → `ai_judge`.
- Публичные ключи в body должны совпадать с ключами из секретов при `runChain`.

### `POST /api/deals/:id/oracle`

Повторно запустить oracle + `ai_judge` (если состояние `submitted` в БД).

### `POST /api/demo/seeded`

Один клик: поднимает сделку с `dealId` из timestamp, используются только ключи из `.env` (см. `server/.env.example`).

## CORS

Оркестратор разрешает origin из **`VITE_DEV_ORIGIN`** (несколько значений через **запятую**) и всегда добавляет `http://127.0.0.1:5173`. По умолчанию: `http://localhost:5173`.

## Перенос в depai-backend

1. Скопировать маршруты `/api/deals` и логику Solana из `server/src/`.
2. Оставить тот же JSON-контракт — фронт не меняется.
3. Выставить `VITE_API_BASE_URL` на URL деплоя бэка.

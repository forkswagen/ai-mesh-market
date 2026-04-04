# API contract — NexusAI escrow orchestrator

Совместимо с отдельным [`depai-backend`](https://github.com/forkswagen/depai-backend): те же пути и модели можно реализовать там или проксировать сюда.

**Base URL:** `http://localhost:8787` (локальный оркестратор в `server/`) или `VITE_API_BASE_URL` на фронте.

## Маппинг `deal_id` ↔ on-chain

- Поле **`dealId`** (number / u64) в API **совпадает** с `deal_id` в программе `data_arbiter` и с сидом PDA `escrow[buyer, seller, dealId]`.
- **Program ID (devnet):** `9vZy3wDuyeWiajhxG8WCFxHMXAijrzmCTbmA44XaV7cg`

## Кто подписывает `ai_judge`

- В демо по умолчанию — **ключ оркула на сервере** (`ORACLE_SECRET_JSON`), хранится только в `.env`, не в браузере.
- Для продакшена: HSM / отдельный сервис / ограничение доступа к эндпоинту.

## Эндпоинты

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

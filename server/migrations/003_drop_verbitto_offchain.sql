-- Старые офчейн-задачи Verbitto больше не используются приложением.
DROP INDEX IF EXISTS idx_verbitto_offchain_created;
DROP INDEX IF EXISTS idx_verbitto_offchain_creator;
DROP TABLE IF EXISTS verbitto_offchain_tasks;

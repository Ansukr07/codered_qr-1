-- Resource transactions are issued to participants. The original MongoDB
-- migration incorrectly pointed transactions.user_id at the legacy users
-- table, while every scanner writes participants.id.

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES participants(id) ON DELETE CASCADE
  NOT VALID;

-- Existing migrated rows may predate the participant mapping. New writes are
-- protected immediately; validate after any legacy orphan cleanup:
-- ALTER TABLE transactions VALIDATE CONSTRAINT transactions_user_id_fkey;


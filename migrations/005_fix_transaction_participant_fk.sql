-- Resource transactions are issued to participants by volunteers. The
-- original MongoDB migration pointed both IDs at the legacy users table,
-- while the portal writes participants.id and volunteers.id.

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES participants(id) ON DELETE CASCADE
  NOT VALID;

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_volunteer_id_fkey;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_volunteer_id_fkey
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE RESTRICT
  NOT VALID;

-- Existing migrated rows may predate the participant mapping. New writes are
-- protected immediately; validate after any legacy orphan cleanup:
-- ALTER TABLE transactions VALIDATE CONSTRAINT transactions_user_id_fkey;

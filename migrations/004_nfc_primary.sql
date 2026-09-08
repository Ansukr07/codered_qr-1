-- CODERED 4.0 NFC-primary identity and networking layer.
-- Run after 002_codered_4_game_layer.sql and 003_networking_scans.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- All resource scanners write participant IDs. Correct legacy installations
-- whose transaction foreign key still targets the old users table.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES participants(id) ON DELETE CASCADE NOT VALID;

CREATE TABLE IF NOT EXISTS participant_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  public_token_hash TEXT NOT NULL UNIQUE,
  public_token_ciphertext TEXT NOT NULL,
  token_hint VARCHAR(12) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'lost', 'revoked', 'replaced')),
  assigned_by UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS participant_one_active_tag
  ON participant_tags(participant_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS participant_tags_participant_idx
  ON participant_tags(participant_id);

CREATE TABLE IF NOT EXISTS participant_connections (
  participant_low_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  participant_high_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  low_tapped_high_at TIMESTAMPTZ,
  high_tapped_low_at TIMESTAMPTZ,
  first_connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (participant_low_id, participant_high_id),
  CHECK (participant_low_id < participant_high_id)
);

CREATE TABLE IF NOT EXISTS nfc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES participant_tags(id) ON DELETE SET NULL,
  actor_id UUID,
  actor_role VARCHAR(20),
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN
    ('opened', 'profile_connected', 'resource_issued', 'resource_returned', 'rejected')),
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  request_id UUID NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nfc_events_tag_created_idx
  ON nfc_events(tag_id, created_at DESC);
CREATE INDEX IF NOT EXISTS nfc_events_actor_created_idx
  ON nfc_events(actor_id, created_at DESC);

ALTER TABLE participant_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_events ENABLE ROW LEVEL SECURITY;

-- Atomic resource mutation for serverless callers. The API authenticates the
-- volunteer; this function locks inventory and makes retries idempotent.
CREATE OR REPLACE FUNCTION process_nfc_resource_action(
  p_tag_hash TEXT,
  p_resource_id UUID,
  p_volunteer_id UUID,
  p_action TEXT,
  p_request_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tag participant_tags%ROWTYPE;
  v_participant participants%ROWTYPE;
  v_resource resources%ROWTYPE;
  v_prior nfc_events%ROWTYPE;
  v_claims INTEGER;
  v_returns INTEGER;
  v_active INTEGER;
  v_max INTEGER := 1;
BEGIN
  IF p_action NOT IN ('claim', 'return') THEN RAISE EXCEPTION 'Unsupported action'; END IF;
  SELECT * INTO v_prior FROM nfc_events WHERE request_id = p_request_id;
  IF FOUND THEN RETURN v_prior.metadata || jsonb_build_object('duplicate', true); END IF;

  SELECT * INTO v_tag FROM participant_tags WHERE public_token_hash = p_tag_hash AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Badge is inactive'; END IF;
  SELECT * INTO v_participant FROM participants WHERE id = v_tag.participant_id;
  SELECT * INTO v_resource FROM resources WHERE id = p_resource_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Resource not found'; END IF;

  IF lower(v_resource.name) LIKE '%coffee%' OR v_resource.category = 'coffee' THEN v_max := 3; END IF;
  IF v_participant.team_id IS NOT NULL AND (v_resource.category = 'accommodation' OR lower(v_resource.name) LIKE '%bag%') THEN
    SELECT count(*) INTO v_claims FROM transactions t JOIN participants p ON p.id=t.user_id
      WHERE p.team_id=v_participant.team_id AND t.resource_id=p_resource_id AND t.action='claim';
    SELECT count(*) INTO v_returns FROM transactions t JOIN participants p ON p.id=t.user_id
      WHERE p.team_id=v_participant.team_id AND t.resource_id=p_resource_id AND t.action='return';
  ELSE
    SELECT count(*) INTO v_claims FROM transactions WHERE user_id = v_participant.id AND resource_id = p_resource_id AND action = 'claim';
    SELECT count(*) INTO v_returns FROM transactions WHERE user_id = v_participant.id AND resource_id = p_resource_id AND action = 'return';
  END IF;
  v_active := v_claims - v_returns;

  IF p_action = 'claim' THEN
    IF v_claims >= v_max THEN RAISE EXCEPTION 'Claim limit reached'; END IF;
    IF v_resource.distributed_quantity >= v_resource.total_quantity THEN RAISE EXCEPTION 'Resource out of stock'; END IF;
    INSERT INTO transactions(user_id, resource_id, volunteer_id, action) VALUES(v_participant.id, p_resource_id, p_volunteer_id, 'claim');
    UPDATE resources SET distributed_quantity = distributed_quantity + 1 WHERE id = p_resource_id;
  ELSE
    IF v_active <= 0 THEN RAISE EXCEPTION 'No active claim to return'; END IF;
    INSERT INTO transactions(user_id, resource_id, volunteer_id, action) VALUES(v_participant.id, p_resource_id, p_volunteer_id, 'return');
    UPDATE resources SET distributed_quantity = GREATEST(0, distributed_quantity - 1) WHERE id = p_resource_id;
  END IF;

  INSERT INTO nfc_events(tag_id, actor_id, actor_role, event_type, resource_id, request_id, metadata)
  VALUES(v_tag.id, p_volunteer_id, 'volunteer', CASE WHEN p_action='claim' THEN 'resource_issued' ELSE 'resource_returned' END,
    p_resource_id, p_request_id, jsonb_build_object('participantName',v_participant.name,'resourceName',v_resource.name,'action',p_action));
  RETURN jsonb_build_object('participantName',v_participant.name,'resourceName',v_resource.name,'action',p_action,'duplicate',false);
END;
$$;

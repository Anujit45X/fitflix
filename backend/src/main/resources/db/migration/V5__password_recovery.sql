CREATE TABLE password_reset (
 token_hash char(64) PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 used_at timestamptz,
 CHECK (expires_at > created_at)
);
CREATE INDEX password_reset_user_idx ON password_reset(user_id, created_at DESC);

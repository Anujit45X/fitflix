"""Generate local-only secrets without overwriting an existing configuration."""
from pathlib import Path
import secrets
root=Path(__file__).resolve().parents[1]
p=root/'.env'
if p.exists():
    raise SystemExit('.env already exists; left unchanged.')
p.write_text('DATABASE_PASSWORD='+secrets.token_urlsafe(32)+'\nJWT_SECRET='+secrets.token_urlsafe(48)+'\nAPP_ORIGIN=http://localhost:8088\nSECURE_COOKIE=false\nDEMO_MODE=false\nDEMO_PASSWORD='+secrets.token_urlsafe(20)+'\nWEB_PORT=8088\n')
try:p.chmod(0o600)
except OSError:pass
print('Created .env with random secrets. Enable DEMO_MODE only for a demo database. Run docker compose up --build -d.')

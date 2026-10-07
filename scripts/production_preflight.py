#!/usr/bin/env python3
"""Offline configuration gate. Prints only setting names, never secret values.
Usage: python scripts/production_preflight.py --env .env.production
Does not certify deployment, deliverability, backups or security.
"""
import argparse
import os
from pathlib import Path
from urllib.parse import urlsplit

def validate(env):
    issues=[]
    def require(ok,message):
        if not ok:issues.append(message)
    for name,minlength in [('JWT_SECRET',32),('DATABASE_PASSWORD',24)]:
        value=env.get(name,'')
        require(len(value.encode())>=minlength and len(set(value))>=12 and not any(x in value.lower() for x in ['changeme','replace','example','ci-only','test-only']),name+': set a unique randomly generated secret')
    origin=urlsplit(env.get('APP_ORIGIN',''))
    require(origin.scheme=='https' and bool(origin.hostname) and origin.hostname not in ['localhost','127.0.0.1'] and not origin.hostname.endswith(('.example','.invalid','.local')) and origin.path in ('','/') and not origin.query and not origin.fragment and not origin.username,'APP_ORIGIN: set a public HTTPS origin without path/query/credentials')
    require(not env.get('APP_ORIGIN','').endswith('/'),'APP_ORIGIN: omit trailing slash for exact Origin validation')
    require(env.get('SECURE_COOKIE','true').lower()=='true','SECURE_COOKIE: must be true')
    require(env.get('DEMO_MODE','false').lower()=='false','DEMO_MODE: must be false')
    require(env.get('MAIL_ENABLED','false').lower()=='true','MAIL_ENABLED: enable configured recovery delivery')
    require(env.get('SMTP_TLS','true').lower()=='true','SMTP_TLS: must be true')
    require(env.get('SMTP_AUTH','true').lower()=='true','SMTP_AUTH: must be true')
    for name in ['SMTP_HOST','SMTP_USERNAME','SMTP_PASSWORD','MAIL_FROM']:
        value=env.get(name,'')
        require(bool(value) and 'example' not in value.lower() and 'localhost' not in value.lower() and 'fitplix.local' not in value.lower(),name+': supply provider configuration')
    require('@' in env.get('MAIL_FROM',''),'MAIL_FROM: supply a verified sender email')
    require(env.get('SMTP_PORT','587').isdigit() and 0<int(env.get('SMTP_PORT','587'))<65536,'SMTP_PORT: invalid port')
    return issues

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--env',type=Path);args=parser.parse_args()
    env=dict(os.environ)
    if args.env:
        for number,line in enumerate(args.env.read_text().splitlines(),1):
            line=line.strip()
            if not line or line.startswith('#'):continue
            if '=' not in line:raise SystemExit(f'Invalid env assignment on line {number}')
            key,value=line.split('=',1);env[key.strip()]=value.strip().strip('"\'')
    issues=validate(env)
    for issue in issues:print('BLOCKED:',issue)
    if issues:raise SystemExit(1)
    print('PASS: production configuration checks. Still run native PostgreSQL/Flyway, HTTPS, SMTP deliverability, restore and security gates in LAUNCH_RUNBOOK.md.')
if __name__=='__main__':main()

"""Local SMTP only. Run with API configured SMTP localhost:1025, AUTH/TLS false.
Never points at a real recipient or email service. Requires aiosmtpd and requests.
"""
import email, json, os, re, secrets, subprocess, threading, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import requests
from aiosmtpd.controller import Controller

base=os.getenv('API_BASE','http://localhost:8080/api')
origin=os.getenv('APP_ORIGIN','http://localhost:5173')
messages=[]
class Mailbox:
    async def handle_DATA(self, server, session, envelope):
        msg=email.message_from_bytes(envelope.content)
        messages.append((envelope.rcpt_tos,msg.get_payload(decode=True).decode()))
        return '250 Accepted by local test mailbox'
controller=Controller(Mailbox(),hostname='127.0.0.1',port=1025)
controller.start()
try:
    account='recovery-'+secrets.token_hex(5)+'@example.invalid'
    old='OldPassword-'+secrets.token_hex(8)
    new='NewPassword-'+secrets.token_hex(8)
    s=requests.Session()
    r=s.post(base+'/auth/register',json={'name':'Recovery test','email':account,'password':old});r.raise_for_status()
    access=r.json()['accessToken']
    known=requests.post(base+'/auth/forgot-password',json={'email':account});assert known.status_code==200
    unknown=requests.post(base+'/auth/forgot-password',json={'email':'missing-'+secrets.token_hex(5)+'@example.invalid'})
    assert unknown.status_code==200 and known.json()==unknown.json()
    for _ in range(100):
        if messages:break
        time.sleep(.1)
    assert len(messages)==1 and messages[0][0]==[account]
    token=re.search(r'#token=([A-Za-z0-9_-]{64})',messages[0][1])[1]
    assert origin+'/reset-password#token=' in messages[0][1]
    assert requests.post(base+'/auth/reset-password',json={'token':token,'password':'short'}).status_code==400
    assert requests.post(base+'/auth/reset-password',json={'token':token,'password':'😀'*20}).status_code==400
    assert requests.post(base+'/auth/reset-password',json={'token':'X'*64,'password':new}).status_code==400
    # Atomic single-use behavior: exactly one concurrent reset succeeds.
    with ThreadPoolExecutor(2) as pool:
        statuses=list(pool.map(lambda _:requests.post(base+'/auth/reset-password',json={'token':token,'password':new}).status_code,range(2)))
    assert sorted(statuses)==[200,400],statuses
    assert requests.get(base+'/me',headers={'Authorization':'Bearer '+access}).status_code==401
    assert s.post(base+'/auth/refresh',headers={'Origin':origin}).status_code==401
    assert requests.post(base+'/auth/login',json={'email':account,'password':old}).status_code==401
    assert requests.post(base+'/auth/login',json={'email':account,'password':new}).status_code==200
    print('PASS recovery: SMTP capture, neutral response, input validation, concurrent single use, old password rejection, session revocation, new login')
    # Second account exercises the visible email and reset forms.
    browser_account='browser-recovery-'+secrets.token_hex(5)+'@example.invalid'
    requests.post(base+'/auth/register',json={'name':'Browser recovery','email':browser_account,'password':old}).raise_for_status()
    env=dict(os.environ,RECOVERY_EMAIL=browser_account,RECOVERY_PASSWORD=new)
    mailbox=Path('/tmp/fitplix-recovery-mail.json')
    mailbox.unlink(missing_ok=True)
    env['RECOVERY_MAILBOX']=str(mailbox)
    proc=subprocess.Popen(['node','verify-recovery.mjs'],cwd=Path(__file__).resolve().parents[1]/'frontend',env=env)
    deadline=time.time()+45
    while proc.poll() is None and time.time()<deadline:
        for recipients,body in messages:
            if recipients==[browser_account]:
                mailbox.write_text(json.dumps({'url':re.search(r'http[^\s]+',body)[0]}));mailbox.chmod(0o600)
        time.sleep(.1)
    if proc.poll() is None:proc.kill();raise AssertionError('Browser timeout')
    assert proc.returncode==0
    mailbox.unlink(missing_ok=True)
finally:
    controller.stop()

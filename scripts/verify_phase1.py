import os,tempfile
import requests,uuid,json,pathlib
base=os.getenv('API_BASE','http://localhost:8080/api');s=requests.Session();s.headers['Origin']=os.getenv('APP_ORIGIN','http://localhost:5173')
email='verify-'+str(uuid.uuid4())[:8]+'@example.com';password='Verification-password-2026!'
def call(method,path,body=None,status=200):
 r=s.request(method,base+path,json=body);assert r.status_code==status,(path,r.status_code,r.text);return r.json()
call('GET','/me',status=401)
a=call('POST','/auth/register',{'name':'Verification User','email':email,'password':password});s.headers['Authorization']='Bearer '+a['accessToken'];uid=a['user']['id']
assert call('GET','/me')['profile'] is None
call('POST','/auth/register',{'name':'Duplicate','email':email,'password':password},409)
call('POST','/auth/login',{'email':email,'password':'wrong'},401)
call('PUT','/profile',{'age':12},400)
profile={'age':25,'sex':'MALE','height':175,'weight':75,'targetWeight':70,'activity':'MODERATE','goal':'LOSE','diet':'ANY','waterTarget':2500,'timezone':'Asia/Kolkata'}
p=call('PUT','/profile',profile);assert p['calorieTarget']==2372,p
call('GET','/admin/product-metrics',status=403)
old=s.cookies.get('fitplix_refresh');a=call('POST','/auth/refresh');assert s.cookies.get('fitplix_refresh')!=old
s.headers['Authorization']='Bearer '+a['accessToken'];assert call('GET','/profile')['weight']==75
r=requests.post(base+'/auth/refresh',cookies={'fitplix_refresh':old},headers={'Origin':os.getenv('APP_ORIGIN','http://localhost:5173')});assert r.status_code==401
r=s.post(base+'/auth/refresh',headers={'Origin':'https://evil.example'});assert r.status_code==403
call('POST','/auth/logout');call('GET','/me',status=401)
a=call('POST','/auth/login',{'email':email,'password':password});s.headers['Authorization']='Bearer '+a['accessToken'];assert call('GET','/me')['profile']['weight']==75
pathlib.Path(os.path.join(tempfile.gettempdir(),'fitplix-test-account.json')).write_text(json.dumps({'email':email,'password':password,'userId':uid}))
print('PASS: registration, duplicate protection, login, validation, onboarding/calorie formula, authorization, refresh rotation/replay, CSRF origin, logout revocation and new-session persistence.')

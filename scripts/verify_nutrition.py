import os,tempfile
import requests,json,datetime
account=json.load(open(os.path.join(tempfile.gettempdir(),'fitplix-test-account.json')));s=requests.Session();s.trust_env=False;s.headers['Origin']=os.getenv('APP_ORIGIN','http://localhost:5173');base=os.getenv('API_BASE','http://localhost:8080/api')
def call(method,path,body=None,status=200):
 r=s.request(method,base+path,json=body,timeout=20);assert r.status_code==status,(path,r.status_code,r.text);return r.json()
a=call('POST','/auth/login',account);s.headers['Authorization']='Bearer '+a['accessToken']
today=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(hours=5,minutes=30)).date();date=str(today);yesterday=str(today-datetime.timedelta(days=1))
foods=call('GET','/foods?search=rice');assert foods['totalElements']>0;assert call('GET','/foods')['totalElements']>500
f=foods['content'][0]
payload={'date':yesterday,'mealType':'LUNCH','items':[{'foodId':f['id'],'grams':150}]}
m=call('POST','/meals',payload);assert abs(m['items'][0]['calories']-f['calories']*1.5)<1e-8
assert abs(call('GET','/dashboard?date='+yesterday)['totals']['calories']-f['calories']*1.5)<1e-8
payload['items'][0]['grams']=200;m=call('PUT','/meals/'+m['id'],payload);assert abs(m['items'][0]['protein']-f['protein']*2)<1e-8
assert call('POST','/meals/copy',{'date':date})['copied']==1
assert call('POST','/meals/copy',{'date':date})['copied']==0
call('POST','/water',{'date':date,'ml':500});call('POST','/weight',{'date':date,'kg':74.2});call('POST','/activity',{'date':date,'steps':8000,'minutes':30})
d=call('GET','/dashboard?date='+date);assert d['totals']['water']==500 and d['weight']==74.2 and d['totals']['steps']==8000
snap=d['target']['calories'];call('PUT','/goals',{'calories':2200,'protein':130,'carbs':285,'fat':60,'fiber':30,'water':2400});assert call('GET','/dashboard?date='+date)['target']['calories']==snap
call('POST','/meals',{'date':date,'mealType':'BAD','items':[]},400)
call('POST','/water',{'date':str(today+datetime.timedelta(days=1)),'ml':250},400)
plan=call('POST','/saved-meals',{'name':'Test lunch','mealType':'LUNCH','items':[{'foodId':f['id'],'grams':100}],'plannedDate':date});call('POST','/saved-meals/'+plan['id']+'/log',{'date':date})
custom=call('POST','/foods',{'name':'Private test food','category':'Custom','calories':120,'protein':10,'carbs':15,'fat':2,'fiber':2,'sugar':1,'sodium':100})
call('POST','/favorites',{'foodId':custom['id']});assert any(x['id']==custom['id'] for x in call('GET','/favorites'))
call('DELETE','/meals/'+m['id']);assert call('GET','/dashboard?date='+yesterday)['totals']['calories']==0
json.dump({'date':date,'dashboard':call('GET','/dashboard?date='+date)},open(os.path.join(tempfile.gettempdir(),'fitplix-persistence-evidence.json'),'w'))
other=call('POST','/auth/register',{'name':'Other User','email':'other-'+account['email'],'password':account['password']});s.headers['Authorization']='Bearer '+other['accessToken']
call('DELETE','/meals/'+d['meals'][0]['id'],status=404)
assert call('GET','/foods?search=Private%20test%20food')['totalElements']==0
print('PASS: sourced catalog, gram scaling, edit/delete totals, idempotent copy, water/weight/activity, target history, validation, plans, favorites and cross-user isolation.')

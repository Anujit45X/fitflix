import os,tempfile
import requests,os,datetime,json
s=requests.Session();s.trust_env=False;s.headers['Origin']=os.getenv('APP_ORIGIN','http://localhost:5173');base=os.getenv('API_BASE','http://localhost:8080/api');utc=datetime.datetime.now(datetime.timezone.utc).date();local=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(hours=5,minutes=30)).date()
def call(method,path,body=None,status=200):
 r=s.request(method,base+path,json=body,timeout=30);assert r.status_code==status,(path,r.status_code,r.text);return r.json()
a=call('POST','/auth/login',json.load(open(os.path.join(tempfile.gettempdir(),'fitplix-test-account.json'))));s.headers['Authorization']='Bearer '+a['accessToken']
today=call('GET','/dashboard?date='+str(local));summary=call('GET',f'/analytics/summary?from={local-datetime.timedelta(days=6)}&to={local}')
assert summary['totalDays']==7 and summary['trackedDays']==1
assert abs(summary['averageCalories']-today['totals']['calories']/7)<1e-8
assert abs(summary['loggingConsistency']-100/7)<1e-8
assert 0<=summary['score']<=100
call('GET',f'/analytics/summary?from={local-datetime.timedelta(days=90)}&to={local}',status=400)
call('GET','/admin/product-metrics?demo=true',status=403)
a=call('POST','/auth/login',{'email':'admin@fitplix.local','password':os.environ['DEMO_PASSWORD']});s.headers['Authorization']='Bearer '+a['accessToken']
p=call('GET',f'/admin/product-metrics?demo=true&from={utc-datetime.timedelta(days=89)}&to={utc}');assert p['kpis']['totalUsers']==30,p['kpis']
assert [r['eligible'] for r in p['retention']]==[29,27,19],p['retention']
counts=[x['users'] for x in p['funnel']];assert counts[:5]==[60,30,27,27,25],counts;assert all(a>=b for a,b in zip(counts,counts[1:]))
assert any(None in c['retention'] for c in p['cohorts'])
assert sum(p['segments'].values())==30
assert all(x['rate'] is None or 0<=x['rate']<=100 for x in p['adoption'])
assert sum(v['assigned'] for v in p['experiment']['variants'])==27
real=call('GET','/admin/product-metrics?demo=false');assert real['dataset']=='REAL USERS';assert not any(u['name'].startswith('Demo') or u['name']=='Alex Morgan' for u in real['users'])
json.dump({'demo_kpis':p['kpis'],'funnel':p['funnel'],'retention':p['retention'],'experiment':p['experiment']},open(os.path.join(tempfile.gettempdir(),'fitplix-metric-evidence.json'),'w'),indent=2)
r=s.get(base.removesuffix('/api')+'/v3/api-docs',timeout=30);r.raise_for_status();schema=r.json();assert len(schema['paths'])>20
import pathlib
pathlib.Path(__file__).resolve().parents[1].joinpath('docs/openapi.json').write_text(json.dumps(schema,indent=2))
print('PASS: personal averages/calendar denominators, score bounds, range checks, admin roles, demo isolation, ordered funnel, mature D1/D7/D30, null future cohorts, segmentation and experiment assignment.')

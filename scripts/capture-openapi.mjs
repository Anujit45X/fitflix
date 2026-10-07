// Run only against the disposable native local test database created by start-local.ps1.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='http://localhost:8080';
const password='Disposable-docs-'+Date.now()+'!';
const email='docs-'+Date.now()+'@example.invalid';
const register=await fetch(base+'/api/v1/auth/register',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:5173'},body:JSON.stringify({name:'Documentation test',email,password})});
assert.equal(register.status,200);const account=await register.json();
assert.match(account.user.id,/^[0-9a-f-]{36}$/i);
const pg=process.env.PSQL_PATH||'C:/Program Files/PostgreSQL/17/bin/psql.exe';
function sql(statement){return execFileSync(pg,['-h','127.0.0.1','-p','55432','-U','fitflix','-d','fitflix','-Atc',statement],{encoding:'utf8',stdio:['ignore','pipe','pipe']});}
const headers={'Content-Type':'application/json',Authorization:'Bearer '+account.accessToken,Origin:'http://localhost:5173'};
try{
 sql("UPDATE app_user SET role='ADMIN' WHERE id='"+account.user.id+"'");
 const response=await fetch(base+'/v3/api-docs',{headers});assert.equal(response.status,200);
 const doc=await response.json();assert.ok(doc.paths['/api/v1/workouts']);assert.ok(doc.paths['/api/v1/account']);
 fs.writeFileSync(path.join(root,'docs/openapi.json'),JSON.stringify(doc,null,2));
 console.log('Exported live OpenAPI with '+Object.keys(doc.paths).length+' routes.');
}finally{
 sql("UPDATE app_user SET role='USER' WHERE id='"+account.user.id+"'");
 await fetch(base+'/api/v1/account',{method:'DELETE',headers,body:JSON.stringify({password})});
}
const foreign=await fetch(base+'/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.invalid'},body:JSON.stringify({email,password})});assert.equal(foreign.status,403);
const noOrigin=await fetch(base+'/api/v1/auth/refresh',{method:'POST'});assert.equal(noOrigin.status,403);
const recovery=await fetch(base+'/api/v1/auth/forgot-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});assert.equal(recovery.status,503);
let limited;
for(let i=0;i<31;i++) limited=await fetch(base+'/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'invalid-password'})});
assert.equal(limited.status,429);assert.equal(limited.headers.get('retry-after'),'60');
fs.writeFileSync(path.join(root,'docs/auth-probe-results.json'),JSON.stringify({date:new Date().toISOString(),passed:true,checks:['Foreign login Origin rejected (403)','Origin-less cookie refresh rejected (403)','Unconfigured recovery explicitly unavailable (503)','Versioned authentication rate limit (429, Retry-After 60)']},null,2));
console.log('PASS: Origin protection, disabled email recovery and authentication rate limit.');

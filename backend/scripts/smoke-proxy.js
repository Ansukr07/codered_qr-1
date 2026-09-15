const jwt=require('jsonwebtoken');
const config=require('../src/config');

const participantId=process.env.SMOKE_PARTICIPANT_ID?.trim();
const participantEmail=process.env.SMOKE_PARTICIPANT_EMAIL?.trim();
const client=(process.env.SMOKE_CLIENT_URL||'http://127.0.0.1:5173').replace(/\/$/,'');
if(!participantId||!participantEmail)throw new Error('Set SMOKE_PARTICIPANT_ID and SMOKE_PARTICIPANT_EMAIL to an existing participant');

const token=jwt.sign({userId:participantId,role:'participant',email:participantEmail},config.jwtSecret,{expiresIn:'2m'});
const checks=[
  ['client shell','/',false,'text/html'],
  ['SPA deep link','/campus-map',false,'text/html'],
  ['proxied health','/api/health',false,'application/json'],
  ['proxied session','/api/auth/me',true,'application/json'],
  ['proxied profile','/api/participants/me',true,'application/json'],
  ['proxied quests','/api/quests',true,'application/json'],
];

(async()=>{let failed=false;for(const [name,path,authenticated,type] of checks){try{const response=await fetch(client+path,{headers:authenticated?{cookie:`token=${token}`}:{}});const contentType=response.headers.get('content-type')||'';const ok=response.ok&&contentType.includes(type);console.log(`${ok?'PASS':'FAIL'} ${response.status} ${name}`);if(!ok){failed=true;const body=await response.text();console.error(body.slice(0,200)||`Expected ${type}`);}}catch(error){failed=true;console.error(`FAIL 000 ${name}: ${error.message}`);}}if(failed)process.exitCode=1;else console.log('Local client → Express → Supabase path is healthy.');})();

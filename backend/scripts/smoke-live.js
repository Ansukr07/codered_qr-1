const jwt=require('jsonwebtoken');
const config=require('../src/config');
const {createApp}=require('../src/app');

const participantId=process.env.SMOKE_PARTICIPANT_ID?.trim();
const participantEmail=process.env.SMOKE_PARTICIPANT_EMAIL?.trim();
if(!participantId||!participantEmail)throw new Error('Set SMOKE_PARTICIPANT_ID and SMOKE_PARTICIPANT_EMAIL to an existing participant');

const participant=jwt.sign({userId:participantId,role:'participant',email:participantEmail},config.jwtSecret,{expiresIn:'5m'});
const admin=jwt.sign({userId:'00000000-0000-4000-8000-000000000001',role:'admin',email:'smoke@localhost'},config.jwtSecret,{expiresIn:'5m'});
const checks=[
  ['health','/api/health',null],['auth session','/api/auth/me',participant],['participant profile','/api/participants/me',participant],
  ['event assignment','/api/participants/event',participant],['leaderboard','/api/participants/leaderboard',participant],['repository','/api/participants/repository',participant],
  ['network stats','/api/network/stats',participant],['connections','/api/network/connections',participant],['quests','/api/quests',participant],
  ['announcements','/api/operations/announcements',participant],['participant help','/api/operations/help',participant],['participant NFC','/api/nfc/my-tag',participant],
  ['admin stats','/api/admin/stats',admin],['participant roster','/api/admin/roster',admin],['repository audit','/api/admin/repositories',admin],
  ['resource list','/api/operations/resources',admin],['NFC administration','/api/admin/nfc/tags',admin],['staff list','/api/admin/staff',admin],
  ['quest review','/api/quests/submissions?status=pending',admin],['participant detail',`/api/admin/participants/${participantId}`,admin],
];

const server=createApp().listen(0,async()=>{let failed=false;const base=`http://127.0.0.1:${server.address().port}`;try{for(const [name,path,token] of checks){const response=await fetch(base+path,{headers:token?{cookie:`token=${token}`}:{}});console.log(`${response.ok?'PASS':'FAIL'} ${response.status} ${name}`);if(!response.ok){failed=true;const body=await response.json().catch(()=>({}));console.error(body.message||'Unknown response');}}}finally{server.close(()=>{process.exitCode=failed?1:0;});}});

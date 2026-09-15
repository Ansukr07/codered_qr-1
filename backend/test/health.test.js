const test=require('node:test');
const assert=require('node:assert/strict');
process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.JWT_SECRET ||= 'test-jwt-secret-that-is-long-enough-for-tests';
const {createApp}=require('../src/app');
const serverlessApp=require('../../api/[...path].js');
const {createToken,decryptToken,encryptToken,hashToken}=require('../src/nfc');
const jwt=require('jsonwebtoken');

test('health endpoint identifies the Supabase API',async()=>{
  const server=createApp().listen(0);
  try{
    const {port}=server.address();
    const response=await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status,200);
    assert.equal(response.headers.get('x-content-type-options'),'nosniff');
    assert.equal(response.headers.get('x-powered-by'),null);
    assert.deepEqual(await response.json(),{status:'ok',database:'supabase'});
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('same-project Vercel function exposes Express without an external proxy',async()=>{
  const server=serverlessApp.listen(0);
  try{
    const {port}=server.address();
    const response=await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{status:'ok',database:'supabase'});
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('unknown routes return structured JSON',async()=>{
  const server=createApp().listen(0);
  try{
    const {port}=server.address();
    const response=await fetch(`http://127.0.0.1:${port}/api/not-real`);
    assert.equal(response.status,404);
    assert.deepEqual(await response.json(),{message:'Endpoint not found'});
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('invalid NFC tokens are rejected before database access',async()=>{
  const server=createApp().listen(0);
  try{
    const {port}=server.address();
    const response=await fetch(`http://127.0.0.1:${port}/api/nfc/tags/not-a-token`);
    assert.equal(response.status,400);
    assert.deepEqual(await response.json(),{message:'This badge link is invalid'});
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('volunteer resource actions require authentication',async()=>{
  const server=createApp().listen(0);
  try{
    const {port}=server.address();
    const response=await fetch(`http://127.0.0.1:${port}/api/nfc/volunteer-action`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
    assert.equal(response.status,401);
    assert.deepEqual(await response.json(),{message:'Not authenticated'});
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('networking statistics require authentication',async()=>{
  const server=createApp().listen(0);
  try{
    const {port}=server.address();
    const response=await fetch(`http://127.0.0.1:${port}/api/network/stats`);
    assert.equal(response.status,401);
    assert.deepEqual(await response.json(),{message:'Not authenticated'});
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('quest submissions and review queues require authentication',async()=>{
  const server=createApp().listen(0);
  try{
    const {port}=server.address();
    const [quests,reviews]=await Promise.all([
      fetch(`http://127.0.0.1:${port}/api/quests`),
      fetch(`http://127.0.0.1:${port}/api/quests/submissions`),
    ]);
    assert.equal(quests.status,401);
    assert.equal(reviews.status,401);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('NFC tokens encrypt reversibly without storing their plaintext hash input',()=>{
  const token=createToken();const encrypted=encryptToken(token);
  assert.match(token,/^[A-Za-z0-9_-]{32}$/);
  assert.notEqual(encrypted,token);
  assert.equal(decryptToken(encrypted),token);
  assert.equal(hashToken(token).length,64);
});

test('NFC administration requires authentication',async()=>{
  const server=createApp().listen(0);
  try{const {port}=server.address();const response=await fetch(`http://127.0.0.1:${port}/api/admin/nfc/tags`);assert.equal(response.status,401);}
  finally{await new Promise(resolve=>server.close(resolve));}
});

test('announcements and help queues require authentication',async()=>{
  const server=createApp().listen(0);
  try{const {port}=server.address();const [radio,help]=await Promise.all([fetch(`http://127.0.0.1:${port}/api/operations/announcements`),fetch(`http://127.0.0.1:${port}/api/operations/help`)]);assert.equal(radio.status,401);assert.equal(help.status,401);}
  finally{await new Promise(resolve=>server.close(resolve));}
});

test('repository writes stay locked until explicitly enabled',async()=>{
  const server=createApp().listen(0);
  try{const {port}=server.address();const token=jwt.sign({userId:'00000000-0000-4000-8000-000000000001',role:'participant',email:'test@example.com'},process.env.JWT_SECRET);const response=await fetch(`http://127.0.0.1:${port}/api/participants/repository`,{method:'PUT',headers:{'content-type':'application/json','cookie':`token=${token}`},body:JSON.stringify({githubLink:'https://github.com/example/project'})});assert.equal(response.status,423);assert.deepEqual(await response.json(),{message:'Project submissions are currently locked'});}
  finally{await new Promise(resolve=>server.close(resolve));}
});

test('participant event and leaderboard endpoints require authentication',async()=>{
  const server=createApp().listen(0);
  try{const {port}=server.address();const [event,leaderboard]=await Promise.all([fetch(`http://127.0.0.1:${port}/api/participants/event`),fetch(`http://127.0.0.1:${port}/api/participants/leaderboard`)]);assert.equal(event.status,401);assert.equal(leaderboard.status,401);}
  finally{await new Promise(resolve=>server.close(resolve));}
});

test('staff account administration requires authentication',async()=>{
  const server=createApp().listen(0);
  try{const {port}=server.address();const [list,create]=await Promise.all([fetch(`http://127.0.0.1:${port}/api/admin/staff`),fetch(`http://127.0.0.1:${port}/api/admin/staff`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'})]);assert.equal(list.status,401);assert.equal(create.status,401);}
  finally{await new Promise(resolve=>server.close(resolve));}
});

test('participant detail requires administrator authentication',async()=>{
  const server=createApp().listen(0);
  try{const {port}=server.address();const response=await fetch(`http://127.0.0.1:${port}/api/admin/participants/00000000-0000-4000-8000-000000000001`);assert.equal(response.status,401);}
  finally{await new Promise(resolve=>server.close(resolve));}
});

test('resource tracking requires staff authentication',async()=>{
  const server=createApp().listen(0);
  try{const {port}=server.address();const [resources,activity]=await Promise.all([fetch(`http://127.0.0.1:${port}/api/operations/resources`),fetch(`http://127.0.0.1:${port}/api/operations/resources/00000000-0000-4000-8000-000000000001/activity`)]);assert.equal(resources.status,401);assert.equal(activity.status,401);}
  finally{await new Promise(resolve=>server.close(resolve));}
});

test('repository audit requires administrator authentication',async()=>{
  const server=createApp().listen(0);
  try{const {port}=server.address();const response=await fetch(`http://127.0.0.1:${port}/api/admin/repositories`);assert.equal(response.status,401);}
  finally{await new Promise(resolve=>server.close(resolve));}
});

test('staff sessions cannot enter participant-only APIs',async()=>{
  const server=createApp().listen(0);
  try{const {port}=server.address();const token=jwt.sign({userId:'00000000-0000-4000-8000-000000000001',role:'volunteer',email:'staff@example.com'},process.env.JWT_SECRET);const response=await fetch(`http://127.0.0.1:${port}/api/participants/me`,{headers:{cookie:`token=${token}`}});assert.equal(response.status,403);assert.deepEqual(await response.json(),{message:'Participant access required'});}
  finally{await new Promise(resolve=>server.close(resolve));}
});

test('participant roster requires administrator authentication',async()=>{
  const server=createApp().listen(0);
  try{const {port}=server.address();const response=await fetch(`http://127.0.0.1:${port}/api/admin/roster`);assert.equal(response.status,401);}
  finally{await new Promise(resolve=>server.close(resolve));}
});

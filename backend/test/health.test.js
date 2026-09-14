const test=require('node:test');
const assert=require('node:assert/strict');
process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.JWT_SECRET ||= 'test-jwt-secret-that-is-long-enough-for-tests';
const {createApp}=require('../src/app');
const {createToken,decryptToken,encryptToken,hashToken}=require('../src/nfc');

test('health endpoint identifies the Supabase API',async()=>{
  const server=createApp().listen(0);
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

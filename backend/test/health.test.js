const test=require('node:test');
const assert=require('node:assert/strict');
process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.JWT_SECRET ||= 'test-jwt-secret-that-is-long-enough-for-tests';
const {createApp}=require('../src/app');

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

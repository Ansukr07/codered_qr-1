#!/usr/bin/env node
const site=(process.argv[2]||'').replace(/\/$/,'');
if(!/^https:\/\//.test(site)||process.argv[3]){
  console.error('Usage: node scripts/check-react-deployment.js https://portal.example');
  process.exit(2);
}
let failures=0;
async function check(label,url,verify,options={}){
  try{
    const response=await fetch(url,{redirect:'manual',headers:{accept:'application/json,text/html',...options.headers},...options});
    const body=await response.text();
    const problem=await verify(response,body);
    if(problem){failures++;console.error(`FAIL  ${label}: ${problem}`);}
    else console.log(`PASS  ${label}`);
  }catch(error){failures++;console.error(`FAIL  ${label}: ${error.message}`);}
}
const health=async(response,body)=>{
  if(response.status!==200)return `HTTP ${response.status}`;
  try{const value=JSON.parse(body);if(value.status!=='ok'||value.database!=='supabase')return 'unexpected health payload';}
  catch{return 'response is not JSON';}
  return null;
};
(async()=>{
  await check('React client',`${site}/`,async(response,body)=>{
    if(response.status!==200)return `HTTP ${response.status}`;
    if(/\/_next\/|X-Nextjs/i.test(body))return 'legacy Next.js application is still deployed';
    if(!body.includes('CodeRed Participant Portal'))return 'Vite client title was not found';
    if(!body.includes('name="viewport"'))return 'mobile viewport metadata is missing';
    return null;
  });
  await check('Same-project serverless API',`${site}/api/health`,health);
  await check('First-party CORS on auth check',`${site}/api/auth/me`,async(response,body)=>{
    if(response.status!==401)return `expected unauthenticated HTTP 401, got ${response.status}`;
    if(response.headers.get('access-control-allow-origin')!==site)return 'portal origin was not allowed';
    try{return JSON.parse(body).message==='Not authenticated'?null:'unexpected auth response';}
    catch{return 'response is not JSON';}
  },{headers:{origin:site}});
  await check('OTP POST route (invalid payload only)',`${site}/api/auth/otp/generate`,async(response,body)=>{
    if(response.status!==400)return `expected validation HTTP 400, got ${response.status}`;
    try{return JSON.parse(body).message==='Email is required'?null:'unexpected validation response';}
    catch{return 'response is not JSON';}
  },{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
  await check('Serverless API security headers',`${site}/api/health`,async response=>response.headers.get('x-content-type-options')==='nosniff'?null:'security headers are missing');
  await check('SPA deep link',`${site}/login`,async(response,body)=>response.status===200&&body.includes('CodeRed Participant Portal')?null:`HTTP ${response.status} or missing React shell`);
  if(failures){console.error(`\n${failures} deployment check${failures===1?'':'s'} failed.`);process.exitCode=1;}
  else console.log('\nDeployment wiring is ready for the authenticated pilot.');
})();

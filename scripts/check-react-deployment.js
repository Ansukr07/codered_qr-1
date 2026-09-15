#!/usr/bin/env node
const site=(process.argv[2]||'').replace(/\/$/,'');
if(!/^https:\/\//.test(site)||process.argv[3]){
  console.error('Usage: node scripts/check-react-deployment.js https://portal.example');
  process.exit(2);
}
let failures=0;
async function check(label,url,verify){
  try{
    const response=await fetch(url,{redirect:'manual',headers:{accept:'application/json,text/html'}});
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
  await check('Serverless API security headers',`${site}/api/health`,async response=>response.headers.get('x-content-type-options')==='nosniff'?null:'security headers are missing');
  await check('SPA deep link',`${site}/login`,async(response,body)=>response.status===200&&body.includes('CodeRed Participant Portal')?null:`HTTP ${response.status} or missing React shell`);
  if(failures){console.error(`\n${failures} deployment check${failures===1?'':'s'} failed.`);process.exitCode=1;}
  else console.log('\nDeployment wiring is ready for the authenticated pilot.');
})();

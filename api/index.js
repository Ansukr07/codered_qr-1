const {createApp}=require('../backend/src/app');
const app=createApp();

module.exports=function handler(req,res){
  const incoming=new URL(req.url||'/', 'http://localhost');
  const route=String(req.query?.route||incoming.searchParams.get('route')||'');
  if(!route||route.startsWith('/')||route.includes('..')){
    return res.statusCode=400,res.end(JSON.stringify({message:'Invalid API route'}));
  }
  incoming.searchParams.delete('route');
  req.url=`/api/${route}${incoming.search}`;
  return app(req,res);
};

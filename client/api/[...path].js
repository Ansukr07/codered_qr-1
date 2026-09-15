export const config={api:{bodyParser:false}};
export default async function handler(req,res){
  const origin=process.env.API_ORIGIN?.replace(/\/$/,'');
  if(!origin)return res.status(503).json({message:'API proxy is not configured'});
  const path=Array.isArray(req.query.path)?req.query.path.join('/'):String(req.query.path||'');
  const query=new URLSearchParams();for(const [key,value] of Object.entries(req.query)){if(key==='path')continue;for(const item of Array.isArray(value)?value:[value])if(item!=null)query.append(key,String(item));}
  const target=`${origin}/api/${path}${query.size?`?${query}`:''}`;
  const headers={...req.headers};delete headers.host;delete headers['content-length'];delete headers.connection;
  const body=['GET','HEAD'].includes(req.method)?undefined:await readBody(req);
  try{
    const upstream=await fetch(target,{method:req.method,headers,body,redirect:'manual'});
    for(const [key,value] of upstream.headers){if(!['content-encoding','content-length','transfer-encoding'].includes(key))res.setHeader(key,value);}
    if(typeof upstream.headers.getSetCookie==='function'){const cookies=upstream.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);}
    res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
  }catch{res.status(502).json({message:'The CodeRed API is temporarily unavailable'});}
}
function readBody(stream){return new Promise((resolve,reject)=>{const chunks=[];stream.on('data',chunk=>chunks.push(chunk));stream.on('end',()=>resolve(Buffer.concat(chunks)));stream.on('error',reject);});}

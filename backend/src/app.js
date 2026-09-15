const express=require('express');const cors=require('cors');const cookieParser=require('cookie-parser');const compression=require('compression');const helmet=require('helmet');const config=require('./config');
function createApp(){
  const app=express();app.disable('x-powered-by');app.use(helmet({contentSecurityPolicy:false,crossOriginResourcePolicy:false,strictTransportSecurity:config.nodeEnv==='production'?undefined:false}));app.use(compression());
  app.use(cors((req,cb)=>{
    const origin=req.get('origin');
    let firstParty=false;
    try{
      const parsed=new URL(origin);
      firstParty=parsed.host===req.get('host')&&['https:','http:'].includes(parsed.protocol);
    }catch{}
    if(origin&&!firstParty&&!config.clientOrigins.includes(origin))return cb(new Error('Origin not allowed'));
    cb(null,{credentials:true,origin:origin||false});
  }));
  app.use(express.json({limit:'1mb'}));app.use(cookieParser());
  app.get('/api/health',(_req,res)=>res.json({status:'ok',database:'supabase'}));
  app.use('/api/auth',require('./routes/auth'));app.use('/api/participants',require('./routes/participants'));app.use('/api/nfc',require('./routes/nfc'));app.use('/api/network',require('./routes/network'));app.use('/api/quests',require('./routes/quests'));app.use('/api/admin',require('./routes/admin'));app.use('/api/operations',require('./routes/operations'));
  app.use((_req,res)=>res.status(404).json({message:'Endpoint not found'}));
  app.use((error,_req,res,_next)=>{const forbidden=error.message==='Origin not allowed';if(!forbidden)console.error(error);if(error.code==='LIMIT_FILE_SIZE')return res.status(400).json({message:'Proof image must be under 2 MB'});if(error.message==='UNSUPPORTED_IMAGE')return res.status(400).json({message:'Proof must be a JPG, PNG, or WebP image'});res.status(forbidden?403:500).json({message:forbidden?error.message:'Unexpected server error'});});
  return app;
}
module.exports={createApp};

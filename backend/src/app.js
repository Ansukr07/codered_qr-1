const express=require('express');
const cors=require('cors');
const cookieParser=require('cookie-parser');
const config=require('./config');
function createApp(){const app=express();app.disable('x-powered-by');app.use(cors({credentials:true,origin(origin,cb){if(!origin||config.clientOrigins.includes(origin))return cb(null,true);cb(new Error('Origin not allowed'));}}));app.use(express.json({limit:'1mb'}));app.use(cookieParser());app.get('/api/health',(_req,res)=>res.json({status:'ok',database:'supabase'}));app.use('/api/auth',require('./routes/auth'));app.use('/api/participants',require('./routes/participants'));app.use('/api/nfc',require('./routes/nfc'));app.use((_req,res)=>res.status(404).json({message:'Endpoint not found'}));app.use((error,_req,res,_next)=>{console.error(error);const forbidden=error.message==='Origin not allowed';res.status(forbidden?403:500).json({message:forbidden?error.message:'Unexpected server error'});});return app;}
module.exports={createApp};

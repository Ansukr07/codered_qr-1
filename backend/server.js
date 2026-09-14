const http=require('node:http');
const {createApp}=require('./src/app');
const port=Number(process.env.PORT||5000);
const server=http.createServer(createApp());
server.listen(port,()=>console.log(`CodeRed API listening on http://localhost:${port}`));
function shutdown(signal){console.log(`${signal} received; closing API server`);server.close(()=>process.exit(0));}
process.on('SIGTERM',()=>shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));

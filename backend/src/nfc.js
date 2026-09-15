const {createCipheriv,createDecipheriv,createHash,randomBytes}=require('node:crypto');
const config=require('./config');
const TOKEN=/^[A-Za-z0-9_-]{32}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hashToken=token=>createHash('sha256').update(token).digest('hex');
const createToken=()=>randomBytes(24).toString('base64url');
function encryptToken(token){const key=createHash('sha256').update(config.nfcEncryptionKey).digest();const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key,iv);const encrypted=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);return[iv,cipher.getAuthTag(),encrypted].map(value=>value.toString('base64url')).join('.');}
function decryptToken(value){const [iv,tag,encrypted]=String(value||'').split('.');if(!iv||!tag||!encrypted)throw new Error('Invalid encrypted NFC token');const key=createHash('sha256').update(config.nfcEncryptionKey).digest();const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(iv,'base64url'));decipher.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([decipher.update(Buffer.from(encrypted,'base64url')),decipher.final()]).toString('utf8');}
function pair(a,b){return a<b?{low:a,high:b,actorIsLow:true}:{low:b,high:a,actorIsLow:false};}
function safeUrl(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.toString():null;}catch{return null;}}
module.exports={TOKEN,UUID,createToken,encryptToken,hashToken,decryptToken,pair,safeUrl};

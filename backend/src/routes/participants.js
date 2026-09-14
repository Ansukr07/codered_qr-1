const express=require('express');
const db=require('../db');
const {requireAuth}=require('../auth');
const router=express.Router();
router.use(requireAuth,(req,res,next)=>req.user.role==='participant'?next():res.status(403).json({message:'Participant access required'}));
const fields='id,name,email,participant_id,team_id,track,hall,seat_number,username,bio,github_profile,linkedin_url,portfolio_url,avatar_key,onboarding_completed';
router.get('/me',async(req,res,next)=>{try{const {data,error}=await db.from('participants').select(fields).eq('id',req.user.userId).single();if(error)throw error;res.json({participant:data});}catch(error){next(error);}});
router.patch('/me',async(req,res,next)=>{try{const allowed=['username','bio','github_profile','linkedin_url','portfolio_url','avatar_key'];const changes=Object.fromEntries(allowed.filter(k=>Object.hasOwn(req.body,k)).map(k=>[k,typeof req.body[k]==='string'?req.body[k].trim()||null:req.body[k]]));if(!Object.keys(changes).length)return res.status(400).json({message:'No supported profile fields provided'});if(changes.username&&!/^[a-z0-9-]{3,30}$/.test(changes.username))return res.status(400).json({message:'Username must be 3–30 lowercase letters, numbers, or hyphens'});for(const key of ['github_profile','linkedin_url','portfolio_url'])if(changes[key]&&!isUrl(changes[key]))return res.status(400).json({message:`${key} must be a valid http(s) URL`});changes.onboarding_completed=true;const {data,error}=await db.from('participants').update(changes).eq('id',req.user.userId).select(fields).single();if(error?.code==='23505')return res.status(409).json({message:'That username is already taken'});if(error)throw error;res.json({participant:data});}catch(error){next(error);}});
function isUrl(value){try{return ['http:','https:'].includes(new URL(value).protocol);}catch{return false;}}
module.exports=router;

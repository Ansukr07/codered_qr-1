const express=require('express');
const db=require('../db');
const {requireAuth}=require('../auth');
const {safeUrl}=require('../nfc');
const router=express.Router();
const participantOnly=(req,res,next)=>req.user.role==='participant'?next():res.status(403).json({message:'Participant access required'});

router.get('/stats',requireAuth,participantOnly,async(req,res,next)=>{try{
  const id=req.user.userId;
  const [views,scans,low,high]=await Promise.all([
    db.from('profile_scans').select('id',{count:'exact',head:true}).eq('profile_id',id),
    db.from('profile_scans').select('id',{count:'exact',head:true}).eq('scanner_id',id),
    db.from('participant_connections').select('low_tapped_high_at,high_tapped_low_at').eq('participant_low_id',id),
    db.from('participant_connections').select('low_tapped_high_at,high_tapped_low_at').eq('participant_high_id',id),
  ]);
  const failed=[views,scans,low,high].find(result=>result.error);if(failed)throw failed.error;
  const outgoing=(low.data||[]).filter(r=>r.low_tapped_high_at).length+(high.data||[]).filter(r=>r.high_tapped_low_at).length;
  const incoming=(low.data||[]).filter(r=>r.high_tapped_low_at).length+(high.data||[]).filter(r=>r.low_tapped_high_at).length;
  res.json({profileViews:(views.count||0)+incoming,connectionsMade:(scans.count||0)+outgoing});
}catch(error){next(error);}});

router.get('/connections',requireAuth,participantOnly,async(req,res,next)=>{try{
  const id=req.user.userId;
  const [low,high]=await Promise.all([
    db.from('participant_connections').select('*').eq('participant_low_id',id),
    db.from('participant_connections').select('*').eq('participant_high_id',id),
  ]);
  if(low.error)throw low.error;if(high.error)throw high.error;
  const rows=[...(low.data||[]),...(high.data||[])];
  const otherIds=[...new Set(rows.map(r=>r.participant_low_id===id?r.participant_high_id:r.participant_low_id))];
  if(!otherIds.length)return res.json({connections:[]});
  const profiles=await db.from('participants').select('id,name,username,bio,avatar_key,team_id,track,participant_id,github_profile,linkedin_url,portfolio_url').in('id',otherIds);
  if(profiles.error)throw profiles.error;const byId=new Map((profiles.data||[]).map(p=>[p.id,p]));
  const connections=rows.map(row=>{const selfLow=row.participant_low_id===id;const profile=byId.get(selfLow?row.participant_high_id:row.participant_low_id);return profile?{...publicProfile(profile),mutual:Boolean(row.low_tapped_high_at&&row.high_tapped_low_at),connectedAt:row.first_connected_at}:null;}).filter(Boolean);
  res.json({connections});
}catch(error){next(error);}});

router.post('/profiles/:username/scan',requireAuth,participantOnly,async(req,res,next)=>{try{
  const username=String(req.params.username||'').toLowerCase();
  const target=await db.from('participants').select('id,name,username').ilike('username',username).eq('onboarding_completed',true).maybeSingle();
  if(target.error)throw target.error;if(!target.data)return res.status(404).json({message:'Player card not found'});
  if(target.data.id===req.user.userId)return res.status(400).json({message:'That is your own player card',self:true});
  const saved=await db.from('profile_scans').upsert({profile_id:target.data.id,scanner_id:req.user.userId},{onConflict:'profile_id,scanner_id',ignoreDuplicates:true});
  if(saved.error)throw saved.error;res.json({message:`You connected with ${target.data.name}.`,profile:target.data});
}catch(error){next(error);}});

router.get('/profiles/:username',async(req,res,next)=>{try{
  const result=await db.from('participants').select('id,name,participant_id,team_id,track,username,bio,github_profile,linkedin_url,portfolio_url,avatar_key').ilike('username',String(req.params.username||'').toLowerCase()).eq('onboarding_completed',true).maybeSingle();
  if(result.error)throw result.error;if(!result.data)return res.status(404).json({message:'Player not found'});
  const scans=await db.from('profile_scans').select('id',{count:'exact',head:true}).eq('profile_id',result.data.id);if(scans.error)throw scans.error;
  res.set('Cache-Control','public, max-age=15, stale-while-revalidate=60').json({profile:{...publicProfile(result.data),scanCount:scans.count||0}});
}catch(error){next(error);}});

function publicProfile(p){return{name:p.name,participantId:p.participant_id,teamId:p.team_id,track:p.track,username:p.username,bio:p.bio,avatarKey:p.avatar_key||'byte',github:safeUrl(p.github_profile),linkedin:safeUrl(p.linkedin_url),portfolio:safeUrl(p.portfolio_url)};}
module.exports=router;

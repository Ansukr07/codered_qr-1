const express=require('express');
const jwt=require('jsonwebtoken');
const db=require('../db');
const config=require('../config');
const {requireAuth}=require('../auth');
const {TOKEN,UUID,hashToken,decryptToken,pair,safeUrl}=require('../nfc');
const router=express.Router();
function optionalUser(req){try{return req.cookies.token?jwt.verify(req.cookies.token,config.jwtSecret):null;}catch{return null;}}

async function resourceState(participant){
  const resources=await db.from('resources').select('id,name,category,total_quantity,distributed_quantity').order('name');
  if(resources.error)throw resources.error;
  let participantIds=[participant.id];
  if(participant.team_id){const team=await db.from('participants').select('id').eq('team_id',participant.team_id);if(team.error)throw team.error;participantIds=(team.data||[]).map(p=>p.id);}
  const transactions=await db.from('transactions').select('user_id,resource_id,action').in('user_id',participantIds).in('action',['claim','return']);
  if(transactions.error)throw transactions.error;
  return (resources.data||[]).map(resource=>{
    const teamScoped=resource.category==='accommodation'||resource.name.toLowerCase().includes('bag');
    const relevant=(transactions.data||[]).filter(t=>t.resource_id===resource.id&&(teamScoped||t.user_id===participant.id));
    const claims=relevant.filter(t=>t.action==='claim').length;
    const returns=relevant.filter(t=>t.action==='return').length;
    const active=Math.max(0,claims-returns);
    const limit=resource.category==='coffee'||resource.name.toLowerCase().includes('coffee')?3:1;
    return {...resource,claim_count:claims,active_quantity:active,claim_limit:limit,can_issue:claims<limit&&resource.distributed_quantity<resource.total_quantity,can_return:active>0,team_scoped:teamScoped};
  });
}

router.get('/tags/:token',async(req,res,next)=>{try{
  if(!TOKEN.test(req.params.token))return res.status(400).json({message:'This badge link is invalid'});
  const tagResult=await db.from('participant_tags').select('id,status,participant_id').eq('public_token_hash',hashToken(req.params.token)).maybeSingle();
  if(tagResult.error)throw tagResult.error;const tag=tagResult.data;
  if(!tag)return res.status(404).json({message:'This badge is not recognized'});
  if(tag.status!=='active')return res.status(410).json({message:'This badge is inactive'});
  const participantResult=await db.from('participants').select('id,name,username,bio,avatar_key,team_id,track,participant_id,github_profile,linkedin_url,portfolio_url').eq('id',tag.participant_id).maybeSingle();
  if(participantResult.error)throw participantResult.error;const p=participantResult.data;
  if(!p)return res.status(404).json({message:'This badge is not assigned'});
  const user=optionalUser(req);const resources=user?.role==='volunteer'?await resourceState(p):[];
  res.set('Cache-Control','no-store').json({authenticated:Boolean(user),viewerRole:user?.role||null,isSelf:user?.role==='participant'&&user.userId===p.id,participant:{name:p.name,username:p.username,bio:p.bio,avatarKey:p.avatar_key,teamId:p.team_id,track:p.track,participantId:p.participant_id,github:safeUrl(p.github_profile),linkedin:safeUrl(p.linkedin_url),portfolio:safeUrl(p.portfolio_url)},resources});
}catch(error){next(error);}});

router.get('/my-tag',requireAuth,async(req,res,next)=>{try{if(req.user.role!=='participant')return res.status(403).json({message:'Participant access required'});const {data,error}=await db.from('participant_tags').select('public_token_ciphertext,token_hint,assigned_at').eq('participant_id',req.user.userId).eq('status','active').maybeSingle();if(error)throw error;if(!data)return res.json({tag:null});const token=decryptToken(data.public_token_ciphertext);res.json({tag:{url:`${config.publicAppUrl}/nfc/t/${token}`,tokenHint:data.token_hint,assignedAt:data.assigned_at}});}catch(error){next(error);}});

router.post('/connect',requireAuth,async(req,res,next)=>{try{if(req.user.role!=='participant')return res.status(403).json({message:'Participant access required'});const {token,requestId}=req.body;if(!TOKEN.test(token||'')||!UUID.test(requestId||''))return res.status(400).json({message:'Valid badge token and request ID are required'});const prior=await db.from('nfc_events').select('metadata').eq('request_id',requestId).maybeSingle();if(prior.error)throw prior.error;if(prior.data)return res.json({message:'Connection already recorded',duplicate:true,...prior.data.metadata});const tagResult=await db.from('participant_tags').select('id,participant_id,status').eq('public_token_hash',hashToken(token)).maybeSingle();if(tagResult.error)throw tagResult.error;const tag=tagResult.data;if(!tag||tag.status!=='active')return res.status(410).json({message:'This badge is inactive'});if(tag.participant_id===req.user.userId)return res.status(400).json({message:'You cannot connect with your own badge'});const ids=pair(req.user.userId,tag.participant_id);const tap=ids.actorIsLow?'low_tapped_high_at':'high_tapped_low_at';const existing=await db.from('participant_connections').select('*').eq('participant_low_id',ids.low).eq('participant_high_id',ids.high).maybeSingle();if(existing.error)throw existing.error;const payload=existing.data?{...existing.data,[tap]:existing.data[tap]||new Date().toISOString()}:{participant_low_id:ids.low,participant_high_id:ids.high,[tap]:new Date().toISOString()};const saved=await db.from('participant_connections').upsert(payload).select().single();if(saved.error)throw saved.error;const mutual=Boolean(saved.data.low_tapped_high_at&&saved.data.high_tapped_low_at);const event=await db.from('nfc_events').insert({tag_id:tag.id,actor_id:req.user.userId,actor_role:'participant',event_type:'profile_connected',request_id:requestId,metadata:{mutual}});if(event.error&&event.error.code!=='23505')throw event.error;res.json({message:mutual?'You are now mutual connections!':'Connection saved',mutual});}catch(error){next(error);}});

router.post('/volunteer-action',requireAuth,async(req,res,next)=>{try{
  if(req.user.role!=='volunteer')return res.status(403).json({message:'Volunteer access required'});
  const {token,resourceId,action,requestId}=req.body;
  if(!TOKEN.test(token||'')||!UUID.test(resourceId||'')||!['claim','return'].includes(action)||!UUID.test(requestId||''))return res.status(400).json({message:'Invalid NFC action request'});
  const {data,error}=await db.rpc('process_nfc_resource_action',{p_tag_hash:hashToken(token),p_resource_id:resourceId,p_volunteer_id:req.user.userId,p_action:action,p_request_id:requestId});
  if(error){if(error.message.includes('transactions_user_id_fkey')||error.message.includes('transactions_volunteer_id_fkey'))return res.status(503).json({message:'Resource tracking setup is incomplete. Apply database migration 005.'});const known=['Badge is inactive','Resource not found','Claim limit reached','Resource out of stock','No active claim to return'];const message=known.find(item=>error.message.includes(item))||'Could not record this resource action';return res.status(message==='Badge is inactive'?410:409).json({message});}
  res.json({message:data.duplicate?'This action was already recorded':`${data.resourceName} ${action==='claim'?'issued':'returned'} for ${data.participantName}.`,result:data});
}catch(error){next(error);}});
module.exports=router;

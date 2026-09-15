import {useEffect,useState} from 'react';
import {Link,Navigate} from 'react-router-dom';
import QRCode from 'react-qr-code';
import {api} from '../api';

function useCheckpoint(path){
  const [state,setState]=useState({status:'loading',value:null,error:''});
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true;
    setState({status:'loading',value:null,error:''});
    api(path).then(value=>active&&setState({status:'ready',value,error:''})).catch(error=>active&&setState({status:'error',value:null,error:error.message}));
    return()=>{active=false;};
  },[path,attempt]);
  return {...state,retry:()=>setAttempt(value=>value+1)};
}

function Checkpoint({label,value,loading,error,retry}){
  return <div className="dash-detail"><span>{label}</span>{loading?<strong aria-busy="true">Checking…</strong>:error&&!value?<><strong>Unavailable</strong><button className="dash-retry" onClick={retry} aria-label={`Retry ${label}`}>Retry</button></>:<strong>{value||'Not assigned yet'}</strong>}</div>;
}

function BadgeStation({tagState,participantId}){
  const [notice,setNotice]=useState('');
  const tag=tagState.value?.tag;
  async function copy(){
    try{await navigator.clipboard.writeText(tag.url);setNotice('Badge link copied.');}
    catch{setNotice('Copy the badge link from the field below.');}
  }
  const title=tagState.status==='loading'?'Checking your event pass.':tagState.status==='error'?'Your badge could not load.':tag?'Your badge link is assigned.':'Waiting for your NFC tag.';
  return <section className="dash-pass" aria-labelledby="pass-title">
    <div className="dash-pass-top"><span className="dash-kicker">01 / YOUR EVENT PASS</span><span className="dash-pass-status">{tagState.status==='loading'?'CHECKING':tag?'TAG ASSIGNED':tagState.status==='error'?'CHECK FAILED':'AWAITING TAG'}</span></div>
    <div className="dash-pass-body"><div className="dash-pass-copy"><h2 id="pass-title">{title}</h2><p>Tap your physical NFC badge at the volunteer desk for event resources. If a phone cannot read it, show your QR backup.</p><div className="dash-id"><small>PARTICIPANT ID</small><strong>{participantId}</strong></div>
      {tagState.status==='loading'&&<p className="dash-feedback" role="status">Checking your badge assignment…</p>}
      {tagState.status==='error'&&<div className="dash-feedback dash-warning" role="alert"><p>Could not load your badge. {tagState.error}</p><button className="dash-retry" onClick={tagState.retry}>Try again</button></div>}
      {tagState.status==='ready'&&!tag&&<p className="dash-feedback dash-warning">No NFC tag has been assigned yet. Ask the badge desk; your participant ID remains available.</p>}
      {tag&&<div className="dash-pass-actions"><a className="dash-primary" href={tag.url}>OPEN MY BADGE <span aria-hidden="true">↗</span></a><button className="dash-copy" onClick={copy}>COPY LINK</button></div>}
      {tag&&<label className="dash-url">BACKUP BADGE LINK<input readOnly value={tag.url} onFocus={event=>event.currentTarget.select()}/></label>}
      {notice&&<p className="dash-feedback" role="status">{notice}</p>}
    </div><div className="dash-qr-frame">{tag?<><div className="dash-qr" role="img" aria-label="Backup QR code for your NFC badge"><QRCode value={tag.url} size={166}/></div><span>SCAN IF NFC IS UNAVAILABLE</span></>:<div className="dash-qr-empty" aria-hidden="true"><span>CR</span></div>}</div></div>
  </section>;
}

export function ParticipantDashboard({user,logout}){
  if(!user.onboardingCompleted)return <Navigate to="/profile" replace/>;
  return <ReadyParticipantDashboard user={user} logout={logout}/>;
}

function ReadyParticipantDashboard({user,logout}){
  const tagState=useCheckpoint('/api/nfc/my-tag');
  const eventState=useCheckpoint('/api/participants/event');
  const networkState=useCheckpoint('/api/network/stats');
  const assignment=eventState.value?.assignment;
  const stats=networkState.value;
  const firstName=user.name?.trim().split(/\s+/)[0]||'Player';
  return <main className="dash-shell">
    <header className="dash-header"><Link className="dash-brand" to="/" aria-label="CodeRed participant home"><span className="dash-brand-mark">CR</span><span><strong>CODERED 4.0</strong><small>PARTICIPANT PORTAL</small></span></Link><div className="dash-header-actions"><Link to="/operations">HELP DESK</Link><button className="dash-logout" onClick={logout}>LOG OUT</button></div></header>
    <div className="dash-heading"><div><p className="dash-kicker">PLAYER HUB / {user.participantId}</p><h1>Good to see you, {firstName}.</h1><p>Your badge, event details, quests, and connections.</p></div><Link className="dash-profile-link" to="/profile"><span className="dash-avatar" aria-hidden="true">{firstName[0].toUpperCase()}</span><span><strong>{user.username?`@${user.username}`:'Player profile'}</strong><small>EDIT PLAYER CARD ↗</small></span></Link></div>
    <div className="dash-main-grid"><BadgeStation tagState={tagState} participantId={user.participantId}/><aside className="dash-aside" aria-label="Event and networking status"><section className="dash-info-panel"><div className="dash-panel-title"><span className="dash-kicker">02 / EVENT CHECKPOINT</span><Link to="/event">FULL DETAILS ↗</Link></div><h2>Find your place.</h2><div className="dash-detail-grid"><Checkpoint label="TEAM" value={assignment?.teamId||user.teamId} loading={eventState.status==='loading'} error={eventState.status==='error'} retry={eventState.retry}/><Checkpoint label="TRACK" value={assignment?.track||user.track} loading={eventState.status==='loading'} error={eventState.status==='error'} retry={eventState.retry}/><Checkpoint label="HALL" value={assignment?.hall} loading={eventState.status==='loading'} error={eventState.status==='error'} retry={eventState.retry}/><Checkpoint label="SEAT" value={assignment?.seatNumber} loading={eventState.status==='loading'} error={eventState.status==='error'} retry={eventState.retry}/></div><Link className="dash-inline-link" to="/campus-map">OPEN CAMPUS MAP <span aria-hidden="true">→</span></Link></section><section className="dash-info-panel dash-network-panel"><div className="dash-panel-title"><span className="dash-kicker">03 / YOUR NETWORK</span><Link to="/network">OPEN NETWORK ↗</Link></div><div className="dash-network-counts"><div><strong>{networkState.status==='ready'?stats.profileViews:'—'}</strong><span>PROFILE VIEWS</span></div><div><strong>{networkState.status==='ready'?stats.connectionsMade:'—'}</strong><span>CONNECTIONS MADE</span></div></div>{networkState.status==='error'&&<p className="dash-feedback" role="alert">Network counts unavailable. <button className="dash-retry" onClick={networkState.retry}>Retry</button></p>}{networkState.status==='loading'&&<p className="dash-feedback" role="status">Loading network activity…</p>}<Link className="dash-inline-link" to="/scan">SCAN SOMEONE’S QR BACKUP <span aria-hidden="true">→</span></Link></section></aside></div>
    <section className="dash-journey" aria-labelledby="journey-title"><div className="dash-section-heading"><div><p className="dash-kicker">YOUR NEXT MOVES</p><h2 id="journey-title">Explore CodeRed</h2></div><p>Complete quests for team XP and connect with participants.</p></div><div className="dash-journey-grid"><Link className="dash-feature dash-feature-quest" to="/quests"><span className="dash-feature-number">01 / PLAY</span><strong>Enter quest town</strong><p>Walk the pixel campus, complete a challenge, and send proof for volunteer review.</p><span className="dash-feature-arrow" aria-hidden="true">→</span></Link><Link className="dash-feature dash-feature-connect" to="/network"><span className="dash-feature-number">02 / CONNECT</span><strong>Meet other players</strong><p>Tap a participant’s NFC badge or scan their QR, then choose to connect.</p><span className="dash-feature-arrow" aria-hidden="true">→</span></Link><Link className="dash-feature dash-feature-rank" to="/leaderboard"><span className="dash-feature-number">03 / RANKINGS</span><strong>Team leaderboard</strong><p>See points after volunteers approve quest proof.</p><span className="dash-feature-arrow" aria-hidden="true">→</span></Link></div></section>
    <section className="dash-tools" aria-labelledby="tools-title"><div className="dash-section-heading"><div><p className="dash-kicker">EVENT TOOLS</p><h2 id="tools-title">Event essentials</h2></div></div><div className="dash-tool-list"><Link to="/repository"><strong>PROJECT REPOSITORY</strong><span>Submit or check your GitHub link</span><b aria-hidden="true">→</b></Link><Link to="/event"><strong>SCHEDULE & SEATING</strong><span>Check times, hall, and seat</span><b aria-hidden="true">→</b></Link><Link to="/campus-map"><strong>CAMPUS MAP</strong><span>Navigate floors 2–4</span><b aria-hidden="true">→</b></Link><Link to="/operations"><strong>ANNOUNCEMENTS & HELP</strong><span>Latest updates and help desk</span><b aria-hidden="true">→</b></Link></div></section>
  </main>;
}

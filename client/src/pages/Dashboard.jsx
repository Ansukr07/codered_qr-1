import {useEffect,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useAuth} from '../auth';
import {api} from '../api';

export function Dashboard(){
  const {user,logout}=useAuth();
  if(user.role==='volunteer')return <VolunteerHome user={user} logout={logout}/>;
  if(user.role==='admin')return <StaffHome user={user} logout={logout}/>;
  return <ParticipantHome user={user} logout={logout}/>;
}

function Header({label,user,logout}){return <header><div><p className="eyebrow">{label}</p><h1>Welcome, {user.name}</h1></div><button className="secondary compact" onClick={logout}>LOG OUT</button></header>}

function ParticipantHome({user,logout}){
  const [tag,setTag]=useState(undefined);
  useEffect(()=>{api('/api/nfc/my-tag').then(r=>setTag(r.tag)).catch(()=>setTag(null));},[]);
  return <main className="shell"><Header label="PLAYER HUB" user={user} logout={logout}/><section className="hero"><span className="badge">{user.participantId}</span><h2>Your CodeRed journey starts here.</h2><p>Complete your profile before networking, then use your badge for NFC check-ins and connections.</p></section><section className="grid"><Link className="action-card" to="/profile"><strong>Player profile</strong><span>Edit your public links and identity →</span></Link>{tag?<a className="action-card" href={tag.url}><strong>NFC badge</strong><span>Open your programmed badge link →</span></a>:<div className="action-card disabled"><strong>NFC badge</strong><span>{tag===undefined?'Checking badge…':'Ask an admin to issue your tag'}</span></div>}<Link className="action-card" to="/network"><strong>Network</strong><span>Connections, profile views, and manual scan →</span></Link><div className="action-card disabled"><strong>Quest town</strong><span>Next route being migrated</span></div></section></main>;
}

function VolunteerHome({user,logout}){
  const navigate=useNavigate();const [badge,setBadge]=useState('');const [error,setError]=useState('');
  function open(e){e.preventDefault();setError('');try{const url=new URL(badge);const match=url.pathname.match(/^\/nfc\/t\/([A-Za-z0-9_-]{32})$/);if(match)return navigate(`/volunteer/nfc/${match[1]}`);}catch{}const token=badge.trim();if(/^[A-Za-z0-9_-]{32}$/.test(token))return navigate(`/volunteer/nfc/${token}`);setError('Enter a valid CodeRed NFC badge URL or token.');}
  return <main className="shell narrow"><Header label="VOLUNTEER DESK" user={user} logout={logout}/><section className="panel"><h2>Scan a participant badge</h2><p>Tap the participant’s NFC badge with this phone. Their resource screen opens automatically. You can also paste a badge URL below.</p><form onSubmit={open}><label>Badge URL or token<input value={badge} onChange={e=>setBadge(e.target.value)} required/></label>{error&&<p className="error" role="alert">{error}</p>}<button>OPEN RESOURCE DESK</button></form></section></main>;
}

function StaffHome({user,logout}){return <main className="shell narrow"><Header label="ADMIN CONSOLE" user={user} logout={logout}/><section className="panel"><h2>Admin migration in progress</h2><p>The new Express session is active. NFC issuance and participant administration are the next tools being migrated; use the existing production admin portal until parity is verified.</p></section></main>}

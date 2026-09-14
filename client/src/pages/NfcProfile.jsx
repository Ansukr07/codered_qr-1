import {useEffect,useState} from 'react';
import {Link,Navigate,useParams} from 'react-router-dom';
import {api} from '../api';
import {useAuth} from '../auth';
export function NfcProfile(){
  const {token}=useParams();const {user}=useAuth();const [data,setData]=useState(null);const [message,setMessage]=useState('Reading badge…');
  useEffect(()=>{api(`/api/nfc/tags/${encodeURIComponent(token)}`).then(setData).catch(e=>setMessage(e.message));},[token]);
  async function connect(){setMessage('Saving connection…');try{const result=await api('/api/nfc/connect',{method:'POST',body:JSON.stringify({token,requestId:crypto.randomUUID()})});setMessage(result.message);}catch(e){setMessage(e.message);}}
  if(data?.viewerRole==='volunteer')return <Navigate to={`/volunteer/nfc/${token}`} replace/>;
  if(!data)return <main className="center"><section className="panel"><p className="eyebrow">NFC BADGE</p><h1>{message}</h1><Link to="/">Go to portal</Link></section></main>;
  const p=data.participant;
  return <main className="center"><section className="panel profile-card"><p className="eyebrow">CODERED NETWORK</p><div className="avatar" aria-hidden="true">{p.name.slice(0,1).toUpperCase()}</div><h1>{p.name}</h1><p className="handle">@{p.username||p.participantId}</p>{p.bio&&<p>{p.bio}</p>}<div className="links">{p.github&&<a href={p.github} target="_blank" rel="noreferrer">GitHub ↗</a>}{p.linkedin&&<a href={p.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}{p.portfolio&&<a href={p.portfolio} target="_blank" rel="noreferrer">Portfolio ↗</a>}</div>{data.isSelf?<p className="success">This is your badge.</p>:user?.role==='participant'?<button onClick={connect}>CONNECT WITH {p.name.toUpperCase()}</button>:<Link className="login-link" to={`/login?returnTo=${encodeURIComponent(`/nfc/t/${token}`)}`}>Log in to connect</Link>}<p role="status" className="muted">{message!=='Reading badge…'&&message}</p></section></main>;
}

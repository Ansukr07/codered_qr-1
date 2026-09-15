import {useState} from 'react';
import {Navigate,useNavigate} from 'react-router-dom';
import {api} from '../api';
import {useAuth} from '../auth';

export function Login(){
  const {user,setUser}=useAuth();const navigate=useNavigate();
  const [email,setEmail]=useState('');const [otp,setOtp]=useState('');const [sent,setSent]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  if(user)return <Navigate to="/" replace/>;
  async function submit(event){event.preventDefault();setBusy(true);setError('');try{if(!sent){await api('/api/auth/otp/generate',{method:'POST',body:JSON.stringify({email})});setSent(true);}else{const result=await api('/api/auth/otp/verify',{method:'POST',body:JSON.stringify({email,otp})});setUser(result.user);const requested=new URLSearchParams(window.location.search).get('returnTo');const safe=requested?.startsWith('/nfc/t/')?requested:null;navigate(safe||(result.user.onboardingCompleted?'/':'/profile'));}}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <main className="login-world"><section className="panel login-card"><p className="eyebrow">CODERED 4.0</p><h1>Participant portal</h1><p className="muted">Enter your registered email to receive a secure one-time code.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={sent} required autoComplete="email"/></label>{sent&&<label>Code from email (6–8 digits)<input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,8))} inputMode="numeric" pattern="[0-9]{6,8}" minLength={6} maxLength={8} required autoFocus autoComplete="one-time-code"/></label>}{error&&<p className="error" role="alert">{error}</p>}<button disabled={busy}>{busy?'PLEASE WAIT…':sent?'VERIFY & ENTER':'SEND LOGIN CODE'}</button>{sent&&<button type="button" className="secondary" onClick={()=>{setSent(false);setOtp('');setError('');}}>USE ANOTHER EMAIL</button>}</form></section></main>;
}

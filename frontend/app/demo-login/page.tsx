'use client'
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Gamepad2, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function DemoLoginPage(){
  const router=useRouter();const{refreshUser}=useAuth();const[email,setEmail]=useState('demo.participant@codered.local');const[password,setPassword]=useState('');const[error,setError]=useState('');const[busy,setBusy]=useState(false)
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError('');const response=await fetch('/api/auth/demo-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const data=await response.json();setBusy(false);if(!response.ok)return setError(data.message||'Demo login failed.');await refreshUser();router.replace('/participant')}
  return <main className="demo-login-world"><form className="pixel-panel demo-login-card" onSubmit={submit}><Gamepad2 className="demo-gamepad"/><p className="eyebrow">NFC PILOT ACCESS</p><h1>Demo participant</h1><p>Use Alice and Bob in separate browsers to test badge connections.</p><div className="flex gap-2"><button type="button" className="pixel-button secondary" onClick={()=>setEmail('alice.demo@codered.local')}>ALICE</button><button type="button" className="pixel-button secondary" onClick={()=>setEmail('bob.demo@codered.local')}>BOB</button></div><label className="game-field">EMAIL<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label className="game-field">PASSWORD<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter demo password" required/></label>{error&&<p className="game-error">{error}</p>}<button className="pixel-button" disabled={busy}>{busy?'LOADING...':'ENTER DEMO WORLD'} <LogIn/></button><Link href="/login" className="demo-back"><ArrowLeft/> Regular OTP login</Link></form></main>
}

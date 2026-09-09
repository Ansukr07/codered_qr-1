'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2, Nfc, Package, RotateCcw, Search, ShieldCheck, UserRound, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Resource = {
  id:string
  name:string
  category:string
  total_quantity:number
  distributed_quantity:number
  claim_count:number
  active_quantity:number
  claim_limit:number
  can_issue:boolean
  can_return:boolean
  team_scoped:boolean
}

type BadgeData = {
  viewerRole:string|null
  participant:{name:string;participantId?:string;teamId?:string;track?:string}
  resources:Resource[]
}

export default function VolunteerNfcPage(){
  const { token } = useParams<{token:string}>()
  const[data,setData]=useState<BadgeData|null>(null)
  const[loading,setLoading]=useState(true)
  const[busy,setBusy]=useState('')
  const[query,setQuery]=useState('')
  const[message,setMessage]=useState('')
  const[error,setError]=useState('')

  const load=useCallback(async()=>{
    const response=await fetch(`/api/nfc/tags/${encodeURIComponent(token)}`,{cache:'no-store'})
    const body=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(body.message||'Could not read this NFC badge.')
    if(body.viewerRole!=='volunteer')throw new Error('A volunteer login is required to assign resources.')
    setData(body)
  },[token])

  useEffect(()=>{setLoading(true);load().catch(cause=>setError(cause.message||'Could not load volunteer resources.')).finally(()=>setLoading(false))},[load])

  const resources=useMemo(()=>{
    const needle=query.trim().toLowerCase()
    return !needle?(data?.resources||[]):(data?.resources||[]).filter(resource=>`${resource.name} ${resource.category}`.toLowerCase().includes(needle))
  },[data?.resources,query])

  async function act(resource:Resource,action:'claim'|'return'){
    const verb=action==='claim'?'Issue':'Return'
    if(!confirm(`${verb} ${resource.name} ${action==='claim'?'to':'from'} ${data?.participant.name}?`))return
    setBusy(`${resource.id}:${action}`);setMessage('');setError('')
    try{
      const response=await fetch('/api/nfc/volunteer-action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,resourceId:resource.id,action,requestId:crypto.randomUUID()})})
      const body=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(body.message||`Could not ${verb.toLowerCase()} this resource.`)
      setMessage(body.message)
      await load()
    }catch(cause:any){setError(cause.message||'Could not record this resource action.')}
    finally{setBusy('')}
  }

  if(loading)return <div className="min-h-[60vh] grid place-items-center"><div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin"/> Reading NFC badge…</div></div>
  if(!data)return <Card className="max-w-xl mx-auto"><CardHeader><CardTitle className="flex items-center gap-2"><XCircle className="text-destructive"/> Badge unavailable</CardTitle><CardDescription>{error||'This participant could not be loaded.'}</CardDescription></CardHeader><CardContent><Button asChild><Link href="/volunteer"><ArrowLeft/> Volunteer dashboard</Link></Button></CardContent></Card>

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">NFC resource desk</p><h1 className="mt-1 text-3xl font-bold">Assign participant resources</h1><p className="mt-1 text-muted-foreground">Confirm the participant, then issue or return exactly one resource.</p></div><Button variant="outline" asChild><Link href="/volunteer"><ArrowLeft/> Scan another badge</Link></Button></div>
    <Card className="border-primary/30"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10"><UserRound className="h-7 w-7 text-primary"/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate text-2xl font-bold">{data.participant.name}</h2><ShieldCheck className="h-5 w-5 text-emerald-500"/></div><p className="text-sm text-muted-foreground">{data.participant.participantId||'No participant ID'} · {data.participant.teamId||'No team'} · {data.participant.track||'No track'}</p></div><div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600"><Nfc className="h-4 w-4"/> Badge active</div></CardContent></Card>
    {message&&<div role="status" className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-5 w-5"/>{message}</div>}
    {error&&<div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive"><XCircle className="h-5 w-5"/>{error}</div>}
    <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input aria-label="Search resources" className="pl-9" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search food, coffee, sleeping bag…"/></div>
    {resources.length?<div className="grid gap-4 md:grid-cols-2">{resources.map(resource=>{
      const remaining=Math.max(0,resource.total_quantity-resource.distributed_quantity)
      return <Card key={resource.id}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5 text-primary"/>{resource.name}</CardTitle><CardDescription className="mt-1 capitalize">{resource.category||'Event resource'}{resource.team_scoped?' · one per team':' · per participant'}</CardDescription></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resource.active_quantity>0?'bg-emerald-500/10 text-emerald-600':'bg-secondary text-muted-foreground'}`}>{resource.active_quantity>0?'ASSIGNED':'NOT ASSIGNED'}</span></div></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-md bg-secondary/60 p-2"><strong className="block text-lg">{remaining}</strong><span className="text-xs text-muted-foreground">Remaining</span></div><div className="rounded-md bg-secondary/60 p-2"><strong className="block text-lg">{resource.distributed_quantity}</strong><span className="text-xs text-muted-foreground">Issued</span></div><div className="rounded-md bg-secondary/60 p-2"><strong className="block text-lg">{resource.claim_count}/{resource.claim_limit}</strong><span className="text-xs text-muted-foreground">Claims</span></div></div><div className="grid grid-cols-2 gap-2"><Button disabled={Boolean(busy)||!resource.can_issue} onClick={()=>act(resource,'claim')}>{busy===`${resource.id}:claim`?<Loader2 className="animate-spin"/>:<Package/>}{resource.can_issue?'Issue':'Cannot issue'}</Button><Button variant="outline" disabled={Boolean(busy)||!resource.can_return} onClick={()=>act(resource,'return')}>{busy===`${resource.id}:return`?<Loader2 className="animate-spin"/>:<RotateCcw/>}Return</Button></div></CardContent></Card>
    })}</div>:<Card><CardContent className="py-12 text-center text-muted-foreground">No matching resources are configured.</CardContent></Card>}
  </div>
}

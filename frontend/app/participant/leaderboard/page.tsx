'use client'
import { useEffect, useState } from 'react'
import { Crown, Trophy } from 'lucide-react'
export default function LeaderboardPage() { const [rows, setRows] = useState<any[]>([]); useEffect(() => { fetch('/api/leaderboard').then((r) => r.json()).then((d) => setRows(d.leaderboard || [])) }, []); return <div className="game-stack"><div className="page-heading"><div><p className="eyebrow">GUILD HALL</p><h1>Leaderboard</h1><p>Rankings refresh as volunteer reviews land.</p></div><Trophy className="heading-icon"/></div><section className="pixel-panel rank-board">{rows.length ? rows.map((row) => <div className={`rank-row rank-${row.rank}`} key={row.teamId}><span className="rank-number">{row.rank <= 3 ? <Crown/> : `#${row.rank}`}</span><b>{row.teamId}</b><span>{row.completed} QUESTS</span><strong>{row.points} XP</strong></div>) : <div className="empty-game"><Trophy/><b>THE BOARD IS EMPTY</b><p>Be the first team to clear a quest.</p></div>}</section></div> }


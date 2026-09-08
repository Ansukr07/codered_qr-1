'use client'

import { useEffect, useRef, useState } from 'react'

type Quest = { id: string; title: string; points: number; category: string }
type Point = { x: number; y: number }

const TILE = 32
const WORLD = { width: 30, height: 20 }
const NPC_POINTS: Point[] = [
  { x: 7, y: 5 }, { x: 15, y: 8 }, { x: 23, y: 5 },
  { x: 25, y: 14 }, { x: 8, y: 15 }, { x: 16, y: 15 },
]

const blocked = new Set([
  ...Array.from({ length: 5 }, (_, y) => Array.from({ length: 8 }, (_, x) => `${11 + x},${2 + y}`)).flat(),
  ...Array.from({ length: 4 }, (_, y) => Array.from({ length: 7 }, (_, x) => `${3 + x},${9 + y}`)).flat(),
  ...Array.from({ length: 4 }, (_, y) => Array.from({ length: 6 }, (_, x) => `${21 + x},${9 + y}`)).flat(),
])

function isBlocked(x: number, y: number) {
  return x < 1 || y < 1 || x >= WORLD.width - 1 || y >= WORLD.height - 1 || blocked.has(`${x},${y}`)
}

function drawCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, step: number, label?: string) {
  const px = x * TILE + 8
  const py = y * TILE + 5 + (step % 2 ? 1 : 0)
  ctx.fillStyle = '#17213a'; ctx.fillRect(px + 4, py, 12, 10)
  ctx.fillStyle = color; ctx.fillRect(px + 2, py + 7, 16, 13)
  ctx.fillStyle = '#ffe0b2'; ctx.fillRect(px + 5, py + 4, 10, 8)
  ctx.fillStyle = '#17213a'; ctx.fillRect(px + 3, py + 20, 6, 7); ctx.fillRect(px + 13, py + 20, 6, 7)
  if (label) { ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff8dc'; ctx.fillText(label, x * TILE + TILE / 2, py - 4) }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const px = x * TILE, py = y * TILE
  ctx.fillStyle = '#7b4f38'; ctx.fillRect(px + 14, py + 17, 5, 13)
  ctx.fillStyle = '#226b45'; ctx.fillRect(px + 7, py + 8, 20, 17)
  ctx.fillStyle = '#2f8e50'; ctx.fillRect(px + 10, py + 3, 15, 15)
  ctx.fillStyle = '#4bb967'; ctx.fillRect(px + 13, py + 1, 8, 8)
}

function drawPond(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tick: number) {
  ctx.fillStyle = '#377aa1'; ctx.fillRect(x * TILE, y * TILE, w * TILE, h * TILE)
  ctx.fillStyle = '#62c5d5'; ctx.fillRect((x + 1) * TILE, (y + 1) * TILE, (w - 2) * TILE, (h - 2) * TILE)
  ctx.fillStyle = '#d9f2dc'
  for (let i = 0; i < 4; i++) ctx.fillRect((x + 1 + ((i * 3 + tick) % Math.max(2, w - 2))) * TILE, (y + 1 + i % Math.max(1, h - 1)) * TILE + 8, 7, 2)
}

export function PixelTownGame({ quests, states, onInteract }: { quests: Quest[]; states: string[]; onInteract: (quest: Quest) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [player, setPlayer] = useState({ x: 15, y: 17 })
  const [facing, setFacing] = useState('down')
  const [nearby, setNearby] = useState<number | null>(null)
  const playerRef = useRef(player)
  const frame = useRef(0)
  const pressed = useRef(false)

  useEffect(() => { playerRef.current = player }, [player])

  const move = (dx: number, dy: number, direction: string) => {
    if (pressed.current) return
    pressed.current = true
    setTimeout(() => { pressed.current = false }, 75)
    setFacing(direction)
    setPlayer(current => {
      const next = { x: current.x + dx, y: current.y + dy }
      if (isBlocked(next.x, next.y)) return current
      return next
    })
  }

  const interact = () => {
    if (nearby !== null && quests[nearby] && states[nearby] === 'current') onInteract(quests[nearby])
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key === 'e' || key === 'enter') { event.preventDefault(); interact(); return }
      const vectors: Record<string, [number, number, string]> = { w: [0, -1, 'up'], arrowup: [0, -1, 'up'], s: [0, 1, 'down'], arrowdown: [0, 1, 'down'], a: [-1, 0, 'left'], arrowleft: [-1, 0, 'left'], d: [1, 0, 'right'], arrowright: [1, 0, 'right'] }
      const vector = vectors[key]; if (vector) { event.preventDefault(); move(...vector) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.width = WORLD.width * TILE; canvas.height = WORLD.height * TILE
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.imageSmoothingEnabled = false
    let raf = 0
    const render = () => {
      frame.current += 1
      ctx.fillStyle = '#7dc6ff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      for (let y = 0; y < WORLD.height; y++) for (let x = 0; x < WORLD.width; x++) {
        const road = x >= 13 && x <= 17 || y >= 8 && y <= 10
        ctx.fillStyle = road ? '#e5d9b8' : '#55b96a'; ctx.fillRect(x * TILE, y * TILE, TILE, TILE)
        ctx.fillStyle = road ? '#d1c39e' : '#43a75c'; ctx.fillRect(x * TILE + 2, y * TILE + 2, 2, 2)
      }
      // Hand-authored landmarks keep the town readable at a glance.
      drawPond(ctx, 22, 2, 5, 4, Math.floor(frame.current / 18) % 4)
      drawPond(ctx, 2, 14, 4, 3, Math.floor(frame.current / 18) % 4)
      ;[[1, 5], [4, 5], [8, 3], [20, 4], [27, 4], [1, 12], [10, 16], [20, 16], [27, 16], [28, 7], [7, 7]].forEach(([x, y]) => drawTree(ctx, x, y))
      // Flowers and path markers add the small-scale texture of a handheld RPG map.
      for (let i = 0; i < 18; i++) {
        const fx = (i * 7 + 3) % 28, fy = (i * 11 + 4) % 18
        if (!isBlocked(fx, fy)) { ctx.fillStyle = i % 2 ? '#f7d45c' : '#f1839b'; ctx.fillRect(fx * TILE + 12, fy * TILE + 12, 4, 4) }
      }
      ctx.fillStyle = '#d9a24e'; ctx.fillRect(6 * TILE, 7 * TILE, 3 * TILE, 8); ctx.fillStyle = '#8b4e38'; ctx.fillRect(7 * TILE, 8 * TILE, 4, 12); ctx.fillRect(8 * TILE, 8 * TILE, 4, 12)
      ctx.fillStyle = '#fff0c5'; ctx.fillRect(12 * TILE, 16 * TILE, 6 * TILE, TILE); ctx.strokeStyle = '#7a563c'; ctx.strokeRect(12 * TILE, 16 * TILE, 6 * TILE, TILE); ctx.fillStyle = '#7a563c'; ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center'; ctx.fillText('WELCOME, TRAINER', 15 * TILE, 16 * TILE + 20)
      const building = (x: number, y: number, w: number, h: number, roof: string, name: string) => { ctx.fillStyle = '#fff0c5'; ctx.fillRect(x*TILE,y*TILE,w*TILE,h*TILE);ctx.fillStyle=roof;ctx.fillRect(x*TILE,y*TILE,w*TILE,10);ctx.fillStyle='#9cdbef';ctx.fillRect((x+1)*TILE,(y+1)*TILE,18,13);ctx.fillStyle='#17213a';ctx.font='bold 7px monospace';ctx.textAlign='center';ctx.fillText(name,(x+w/2)*TILE,(y+h)*TILE-5) }
      building(11, 2, 8, 5, '#e65757', 'QUEST HALL'); building(3, 9, 7, 4, '#5c8df2', 'GUILD'); building(21, 9, 6, 4, '#e8b844', 'MARKET')
      ctx.fillStyle='#3e9b59';ctx.fillRect(1*TILE,1*TILE,4*TILE,3*TILE);ctx.fillStyle='#2d8150';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('PARK',(3)*TILE,3*TILE)
      NPC_POINTS.forEach((point,index)=>{const state=states[index]||'locked';if(state==='complete')return;drawCharacter(ctx,point.x,point.y,state==='locked'?'#8791a5':'#e84f52',frame.current/10,index<quests.length?`Q${index+1}`:undefined);if(state==='current'){ctx.fillStyle='#ffe45b';ctx.fillRect(point.x*TILE+13,point.y*TILE-8,6,6)}})
      const current=playerRef.current;const bob=Math.floor(frame.current/8)%2;drawCharacter(ctx,current.x,current.y,'#3d74e8',bob)
      const nearest=NPC_POINTS.map((point,index)=>({index,distance:Math.hypot(current.x-point.x,current.y-point.y)})).filter(item=>item.index<quests.length&&item.distance<=1.5&&states[item.index]==='current').sort((a,b)=>a.distance-b.distance)[0]?.index??null;setNearby(previous=>previous===nearest?previous:nearest)
      raf=requestAnimationFrame(render)
    }
    render(); return () => cancelAnimationFrame(raf)
  }, [quests, states])

  return <div className="pixel-town-game"><div className="town-game-hud"><span>CODERED TOWN</span><b>★ {quests.filter((_,i)=>states[i]==='complete').length} CLEARED</b><small>{nearby !== null ? 'PRESS E TO TALK' : 'EXPLORE THE TOWN'}</small></div><canvas ref={canvasRef} aria-label="Single player CODERED town game"/><div className="town-game-controls"><button onClick={()=>move(0,-1,'up')}>▲</button><div><button onClick={()=>move(-1,0,'left')}>◀</button><button onClick={()=>move(0,1,'down')}>▼</button><button onClick={()=>move(1,0,'right')}>▶</button></div><button className="town-action" onClick={interact}>A</button></div>{nearby !== null && quests[nearby] && <button className="town-dialogue" onClick={interact}><b>!</b> {quests[nearby].title} <small>+{quests[nearby].points} XP · TALK</small></button>}</div>
}

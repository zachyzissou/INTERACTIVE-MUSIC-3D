'use client'
import { Html } from '@react-three/drei'
import { a, useSpring } from '@react-spring/web'
import { useSelectedShape } from '@/store/useSelectedShape'
import { useEffectSettings } from '@/store/useEffectSettings'

export default function ShapeEditorPanel() {
  const selected = useSelectedShape(s => s.selected)
  const { setEffect, getParams } = useEffectSettings()
  const params = selected ? getParams(selected) : null
  const springs = useSpring({ y: selected ? 0 : 150 })
  if (!selected || !params) return null
  return (
    <Html position={[0,0,0]} transform>
      <a.div style={{ transform: springs.y.to(y => `translateY(${y}px)`) as any }} className="bg-white bg-opacity-70 p-2 rounded pointer-events-auto text-xs">
        <div className="flex flex-col gap-1">
          <label>Reverb</label>
          <input type="range" min={0} max={1} step={0.01} value={params.reverb} onChange={e=>setEffect(selected,{reverb: parseFloat(e.target.value)})} />
          <label>Delay</label>
          <input type="range" min={0} max={1} step={0.01} value={params.delay} onChange={e=>setEffect(selected,{delay: parseFloat(e.target.value)})} />
        </div>
      </a.div>
    </Html>
  )
}

// src/components/ui/Confetti.tsx
// Self-contained canvas confetti — no external library.
// Mount it to fire; it removes itself after the animation ends.

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  color: string
  width: number
  height: number
  opacity: number
}

const COLORS = ['#8b5cf6', '#a78bfa', '#f59e0b', '#34d399', '#60a5fa', '#f472b6', '#fb923c']
const COUNT  = 120
const GRAVITY = 0.35
const FADE_START = 0.7 // fade out during last 30% of lifetime

function makeParticle(canvasW: number): Particle {
  return {
    x:             Math.random() * canvasW,
    y:             -10,
    vx:            (Math.random() - 0.5) * 6,
    vy:            Math.random() * 4 + 2,
    rotation:      Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    color:         COLORS[Math.floor(Math.random() * COLORS.length)],
    width:         Math.random() * 8 + 5,
    height:        Math.random() * 4 + 3,
    opacity:       1,
  }
}

interface ConfettiProps {
  onDone: () => void
}

export function Confetti({ onDone }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = Array.from({ length: COUNT }, () => makeParticle(canvas.width))
    let frame: number
    let elapsed = 0
    const duration = 180 // frames (~3s at 60fps)

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      elapsed++

      for (const p of particles) {
        p.x  += p.vx
        p.vy += GRAVITY
        p.y  += p.vy
        p.rotation += p.rotationSpeed
        p.vx *= 0.99

        const progress = elapsed / duration
        p.opacity = progress > FADE_START
          ? 1 - (progress - FADE_START) / (1 - FADE_START)
          : 1

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
        ctx.restore()
      }

      if (elapsed < duration) {
        frame = requestAnimationFrame(tick)
      } else {
        onDone()
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [onDone])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}

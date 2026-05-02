import React, { useRef, useEffect } from 'react'

const MotionWallpaper = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    
    const setSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setSize()

    const particles: {x: number; y: number; vx: number; vy: number; radius: number}[] = []
    const numParticles = Math.min(100, Math.floor((window.innerWidth * window.innerHeight) / 12000))
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5
      })
    }

    let animId: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      for(let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      }

      ctx.lineWidth = 1
      for(let i = 0; i < particles.length; i++) {
        for(let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if(dist < 150) {
            // Gradient effect for connections to make it "Deep learning" themed
            const opacity = 0.5 * (1 - dist/150)
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      particles.forEach(p => {
        ctx.fillStyle = `rgba(139, 92, 246, 0.6)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }
    draw()
    
    window.addEventListener('resize', setSize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', setSize)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      style={{
         position: 'fixed', 
         top: 0, 
         left: 0, 
         zIndex: -1, 
         pointerEvents: 'none',
         background: 'transparent'
      }} 
    />
  )
}

export default MotionWallpaper

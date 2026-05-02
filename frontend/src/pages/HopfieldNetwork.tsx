import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { trainHopfield, predictHopfield } from '../api/client'

// Internal resolution fed to the Hopfield network
const NET_W = 28
const NET_H = 28
const NET_SIZE = NET_W * NET_H // 784 neurons

// ──────────────────────────────────────────────────────────────
//  Animated Network Background
// ──────────────────────────────────────────────────────────────

// NetworkBackground moved to global App.tsx

// ──────────────────────────────────────────────────────────────
//  Canvas ↔ Pattern helpers
// ──────────────────────────────────────────────────────────────

function canvasToPattern(canvas: HTMLCanvasElement): number[] {
  const tmp = document.createElement('canvas')
  tmp.width = NET_W
  tmp.height = NET_H
  const ctx = tmp.getContext('2d')!
  ctx.drawImage(canvas, 0, 0, NET_W, NET_H)
  const { data } = ctx.getImageData(0, 0, NET_W, NET_H)
  const out: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    out.push(brightness > 128 ? 1 : -1)
  }
  return out
}

function patternToImageData(pattern: number[], canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(canvas.width, canvas.height)
  const scaleX = canvas.width / NET_W
  const scaleY = canvas.height / NET_H
  for (let ny = 0; ny < NET_H; ny++) {
    for (let nx = 0; nx < NET_W; nx++) {
      const v = pattern[ny * NET_W + nx] === 1 ? 255 : 0
      const px = Math.round(nx * scaleX)
      const py = Math.round(ny * scaleY)
      const pw = Math.round(scaleX)
      const ph = Math.round(scaleY)
      for (let dy = 0; dy < ph; dy++) {
        for (let dx = 0; dx < pw; dx++) {
          const idx = ((py + dy) * canvas.width + (px + dx)) * 4
          imageData.data[idx] = v
          imageData.data[idx + 1] = v
          imageData.data[idx + 2] = v
          imageData.data[idx + 3] = 255
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

function getResemblance(pattern: number[], target: number[]): number {
  if (!pattern || !target || pattern.length !== target.length) return 0;
  let matches = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === target[i]) matches++;
  }
  return (matches / pattern.length) * 100;
}

// ──────────────────────────────────────────────────────────────
//  Thumbnail
// ──────────────────────────────────────────────────────────────

function PatternThumb({ pattern, size = 56 }: { pattern: number[]; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.width = size
    ref.current.height = size
    patternToImageData(pattern, ref.current)
  }, [pattern, size])
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{
        borderRadius: 6,
        border: '2px solid var(--border)',
        background: '#000',
        flexShrink: 0,
        imageRendering: 'pixelated',
      }}
    />
  )
}

// ──────────────────────────────────────────────────────────────
//  Large pattern display
// ──────────────────────────────────────────────────────────────

function PatternDisplay({ pattern, label, size = 220 }: { pattern: number[]; label: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current || !pattern.length) return
    ref.current.width = size
    ref.current.height = size
    patternToImageData(pattern, ref.current)
  }, [pattern, size])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      <canvas
        ref={ref}
        width={size}
        height={size}
        style={{
          borderRadius: 10,
          border: '2px solid var(--border)',
          background: '#000',
          imageRendering: 'pixelated',
          display: 'block',
        }}
      />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
//  Drawing canvas
// ──────────────────────────────────────────────────────────────

export interface DrawingCanvasHandle {
  getPattern: () => number[]
  clear: () => void
}

interface DrawingCanvasProps {
  label?: string
  disabled?: boolean
  onDrawEnd?: () => void
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ label, disabled, onDrawEnd }, ref) => {
    const canvasEl = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    const lastPos = useRef<{ x: number; y: number } | null>(null)

    useEffect(() => {
      const c = canvasEl.current!
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, c.width, c.height)
    }, [])

    useImperativeHandle(ref, () => ({
      getPattern: () => canvasEl.current ? canvasToPattern(canvasEl.current) : [],
      clear: () => {
        const c = canvasEl.current!
        const ctx = c.getContext('2d')!
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, c.width, c.height)
      },
    }))

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
      const c = canvasEl.current!
      const rect = c.getBoundingClientRect()
      const scaleX = c.width / rect.width
      const scaleY = c.height / rect.height
      if ('touches' in e) {
        const t = e.touches[0]
        return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
      }
      return {
        x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
        y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
      }
    }

    const stroke = (x: number, y: number, fx?: number, fy?: number) => {
      const c = canvasEl.current!
      const ctx = c.getContext('2d')!
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = c.width * 0.07 // 7% of width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(fx ?? x, fy ?? y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    const onStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return
      e.preventDefault()
      drawing.current = true
      const pos = getPos(e)
      lastPos.current = pos
      stroke(pos.x, pos.y)
    }

    const onMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawing.current || disabled) return
      e.preventDefault()
      const pos = getPos(e)
      stroke(pos.x, pos.y, lastPos.current?.x, lastPos.current?.y)
      lastPos.current = pos
    }

    const onEnd = () => { 
      drawing.current = false; 
      lastPos.current = null; 
      if (!disabled && onDrawEnd) onDrawEnd();
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {label && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {label}
          </span>
        )}
        <canvas
          ref={canvasEl}
          width={280}
          height={280}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
          style={{
            display: 'block',
            borderRadius: 12,
            border: `2px solid ${disabled ? 'var(--border)' : '#8b5cf6'}`,
            background: '#000',
            cursor: disabled ? 'not-allowed' : 'crosshair',
            touchAction: 'none',
            boxShadow: disabled ? 'none' : '0 0 24px rgba(139,92,246,0.3)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            width: '100%',
            maxWidth: 280,
            aspectRatio: '1',
          }}
        />
        <button
          className="btn btn-secondary"
          onClick={() => {
            const c = canvasEl.current!
            const ctx = c.getContext('2d')!
            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, c.width, c.height)
          }}
          disabled={disabled}
          style={{ fontSize: '0.8rem', padding: '5px 18px' }}
        >
          Clear
        </button>
      </div>
    )
  }
)

// ──────────────────────────────────────────────────────────────
//  Main page
// ──────────────────────────────────────────────────────────────

type Phase = 'draw-patterns' | 'trained' | 'recalled'

export default function HopfieldNetwork() {
  const [phase, setPhase] = useState<Phase>('draw-patterns')
  const [patterns, setPatterns] = useState<{data: number[], label?: string}[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [inputPattern, setInputPattern] = useState<number[]>([])
  const [recalledPattern, setRecalledPattern] = useState<number[]>([])
  const [converged, setConverged] = useState(false)
  const [resemblanceMap, setResemblanceMap] = useState<{label: string, match: number}[]>([])

  const addCanvasRef = useRef<DrawingCanvasHandle>(null)
  const queryCanvasRef = useRef<DrawingCanvasHandle>(null)

  // ── Add pattern to library
  const handleAddPattern = useCallback(() => {
    const pat = addCanvasRef.current?.getPattern() ?? []
    if (!pat.some(v => v === 1)) { setError('Canvas is empty — draw something first!'); return }
    setPatterns(prev => [...prev, { data: pat, label: `Pattern ${prev.length + 1}` }])
    setError('')
    addCanvasRef.current?.clear()
  }, [])

  // ── Load Standard Alphabet
  const handleLoadAlphabet = useCallback(() => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    const newPatterns = alphabet.map((char) => {
      const tmp = document.createElement('canvas')
      tmp.width = NET_W
      tmp.height = NET_H
      const ctx = tmp.getContext('2d')!
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, NET_W, NET_H)
      ctx.fillStyle = '#fff'
      ctx.font = '22px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(char, NET_W / 2, NET_H / 2 + 2)
      return { data: canvasToPattern(tmp), label: `Letter ${char}` }
    })
    setPatterns(newPatterns)
    setError('')
    addCanvasRef.current?.clear()
  }, [])


  // ── Train
  const handleTrain = async () => {
    if (patterns.length === 0) { setError('Add at least one pattern first.'); return }
    setError('')
    setBusy(true)
    setStatusMsg('Training Hopfield network…')
    try {
      const res = await trainHopfield(NET_SIZE, patterns.map(p => p.data))
      setSessionId(res.session_id)
      setPhase('trained')
      setStatusMsg(`✅ Trained on ${patterns.length} pattern${patterns.length !== 1 ? 's' : ''}. Draw a partial version to recall.`)
    } catch (e: any) {
      setError(e.message || 'Training failed.')
      setStatusMsg('')
    } finally {
      setBusy(false)
    }
  }

  // ── Recall
  const handleRecall = async () => {
    if (!sessionId) return
    const pat = queryCanvasRef.current?.getPattern() ?? []
    if (!pat.some(v => v === 1)) { setError('Query canvas is empty — draw something first!'); return }
    setError('')
    setBusy(true)
    setStatusMsg('Recalling memory…')
    try {
      const res = await predictHopfield(sessionId, pat, true)
      setInputPattern(pat)
      
      const finalPat = res.history[res.history.length - 1]
      setRecalledPattern(finalPat)
      setConverged(res.converged)

      // Calculate resemblance of recalled pattern (handled by handleLiveQuery for inputPattern)
      const resData = patterns.map(p => ({
        label: p.label || 'Unknown',
        match: getResemblance(finalPat, p.data)
      })).sort((a,b) => b.match - a.match) // sort by best match

      setResemblanceMap(resData)
      setPhase('recalled')
      const steps = res.history.length - 1
      setStatusMsg(`✅ Done in ${steps} step${steps !== 1 ? 's' : ''} — ${res.converged ? 'stable memory found!' : 'max steps reached.'}`)
    } catch (e: any) {
      setError(e.message || 'Recall failed.')
      setStatusMsg('')
    } finally {
      setBusy(false)
    }
  }

  // ── Live Resemblance Engine
  const handleLiveQuery = useCallback(() => {
    const pat = queryCanvasRef.current?.getPattern() ?? []
    if (pat.length === 0 || !pat.some(v => v === 1)) {
      setResemblanceMap([])
      return
    }
    const resData = patterns.map(p => ({
      label: p.label || 'Unknown',
      match: getResemblance(pat, p.data)
    })).sort((a,b) => b.match - a.match)
    setResemblanceMap(resData)
  }, [patterns])

  // ── Reset
  const handleReset = () => {
    setPhase('draw-patterns')
    setPatterns([])
    setSessionId(null)
    setError('')
    setStatusMsg('')
    setInputPattern([])
    setRecalledPattern([])
    setResemblanceMap([])
  }

  const StepDot = ({ n, p }: { n: number; p: Phase }) => {
    const phases: Phase[] = ['draw-patterns', 'trained', 'recalled']
    const idx = phases.indexOf(p)
    const curIdx = phases.indexOf(phase)
    const done = curIdx > idx
    const active = phase === p
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700,
          background: done ? '#22c55e' : active ? '#8b5cf6' : 'var(--bg-section)',
          color: (done || active) ? '#fff' : 'var(--text-muted)',
          border: `2px solid ${done ? '#22c55e' : active ? '#8b5cf6' : 'var(--border)'}`,
          transition: 'all 0.3s'
        }}>
          {done ? '✓' : n}
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: active ? 600 : 400, color: active ? '#c4b5fd' : 'var(--text-muted)' }}>
          {p === 'draw-patterns' ? 'Draw Patterns' : p === 'trained' ? 'Draw Query' : 'Recalled!'}
        </span>
      </div>
    )
  }

  return (
      <div className="animate-in" style={{ position: 'relative', zIndex: 1 }}>
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <h2>Hopfield Network — Freehand Memory</h2>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '900px' }}>
            <p>
              During every moment of your life, waves of activity propagate across the networks of your brain. Billions of signals continuously harmonize and oscillate; these networks are the functional architecture which underlie your everything. They are your love, your stress, your favorite song, and your hopes and dreams. Your entire sense of being and experience is formed from the dynamic behavior of these networks, held stable by memory systems which constantly adapt to better represent your place in an ever-changing environment.
            </p>
            <p>
              The sheer scope and integration of networks in the human brain make it incredibly difficult to study how, where, or even if computation in the forms we're familiar with occurs. There is evidence for information processing at the levels of modulatory proteins in single cells, cortical microcircuits, and brain-wide functional networks, among others. Experimental understanding of the brain moves slowly. Fortunately, clever engineers have invented or discovered algorithms which can, in part, model aspects of these networks. No single model will ever encapsulate the absolute complexity and behavior of the human brain, but these tools allow students of such systems a convenient window to observe the ways in which information might be computed, and ultimately represented, within the activity of a distributed network.
            </p>
            <p>
              For the purpose of this writeup, we will be analyzing and implementing binary Hopfield neural networks in python. Though newer algorithms exist, this simple machine is both an informative and aesthetically pleasing point of entry into the study and modeling of memory and information processing in neural networks. We'll begin with conceptual background, then move to implementation. Finally we'll cover some functional use-cases for Hopfield Networks in modern data analysis and model generation.
            </p>
            <div style={{ marginTop: '8px' }}>
              <h4 style={{ color: '#c4b5fd', marginBottom: '6px', fontSize: '1rem', fontWeight: 600 }}>Conceptual Background</h4>
              <p>
                Hopfield networks are a beautiful form of Recurrent Artificial Neural Networks (RNNs), first described by John Hopfield in his 1982 paper titled: "Neural networks and physical systems with emergent collective computational abilities." Notably, Hopfield Networks were the first instance of associative neural networks: RNN architectures which are capable of producing an emergent associative memory. Associative memory, or content-addressable memory, is a system in which a memory recall is initiated by the associability of an input pattern to a memorized one. In other words, associative memory allows for the retrieval and completion of a memory using only an incomplete or noisy portion of it. As an example, a person might hear a song they like and be ‘brought back’ to the memory of their first time hearing it. The context, people, surroundings, and emotions in that memory can be retrieved via subsequent exposure to only a portion of the original stimulus: the song alone. These features of Hopfield Networks (HNs) made them a good candidate for early computational models of human associative memory, and marked the beginning of a new era in neural computation and modeling.
              </p>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <img 
                  src="https://miro.medium.com/v2/resize:fit:1248/1*nW9JAq2TUznp1Fjj_BsB_g.gif" 
                  alt="Hopfield Network Animated Fig 5 Converging"
                  style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-section)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <p style={{ fontWeight: 600, color: '#c4b5fd', margin: 0 }}>
              Quickstart: Draw patterns to store, train, then sketch a partial/noisy version and watch the network recall the original.
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 22, alignItems: 'center', flexWrap: 'wrap' }}>
          <StepDot n={1} p="draw-patterns" />
          <div style={{ width: 28, height: 1, background: 'var(--border)' }} />
          <StepDot n={2} p="trained" />
          <div style={{ width: 28, height: 1, background: 'var(--border)' }} />
          <StepDot n={3} p="recalled" />
        </div>

        {statusMsg && (
          <div style={{
            background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '10px 16px', marginBottom: 18, fontSize: '0.875rem',
            color: statusMsg.startsWith('✅') ? '#86efac' : 'var(--text-secondary)'
          }}>
            {statusMsg}
          </div>
        )}
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>

          {/* ── LEFT: Draw & manage patterns ── */}
          <div className="card">
            <h3 style={{ marginBottom: 14, fontSize: '1rem' }}>
              {phase === 'draw-patterns' ? '① Draw & Add Patterns' : '📚 Memorised Patterns'}
            </h3>

            {/* Drawing canvas only shown during pattern collection */}
            {phase === 'draw-patterns' && (
              <>
                <DrawingCanvas ref={addCanvasRef} label="Draw here (freehand)" />
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={handleAddPattern}
                    disabled={busy}
                  >
                    + Add to Memory
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={handleLoadAlphabet}
                    title="Pre-loads A, B, C standard letters"
                    disabled={busy || patterns.length > 0}
                  >
                    🔠 Load Alphabet
                  </button>
                </div>
              </>
            )}

            {/* Thumbnails */}
            {patterns.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  {patterns.length} pattern{patterns.length > 1 ? 's' : ''} in memory
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  {patterns.map((p, i) => (
                    <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <PatternThumb pattern={p.data} size={62} />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>{p.label}</span>
                      {phase === 'draw-patterns' && (
                        <button
                          onClick={() => setPatterns(prev => prev.filter((_, j) => j !== i))}
                          style={{
                            position: 'absolute', top: -6, right: -6,
                            width: 18, height: 18, borderRadius: '50%', border: 'none',
                            background: '#ef4444', color: '#fff', cursor: 'pointer',
                            fontSize: '0.65rem', lineHeight: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {phase === 'draw-patterns' && (
                <button
                  className="btn btn-primary"
                  style={{ justifyContent: 'center' }}
                  onClick={handleTrain}
                  disabled={busy || patterns.length === 0}
                >
                  {busy ? '⏳ Training…' : `🧠 Train (${patterns.length} pattern${patterns.length !== 1 ? 's' : ''})`}
                </button>
              )}
              <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={handleReset} disabled={busy}>
                🔄 Start Over
              </button>
            </div>
          </div>

          {/* ── RIGHT: Query / Result ── */}
          <div className="card">
            {phase === 'draw-patterns' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 360, color: 'var(--text-muted)', gap: 14 }}>
                <span style={{ fontSize: '2.8rem' }}>🔗</span>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', maxWidth: 240 }}>
                  Add patterns and hit <strong style={{ color: '#c4b5fd' }}>Train</strong> to start recalling memories.
                </p>
              </div>
            )}

            {phase === 'trained' && (
              <>
                <h3 style={{ marginBottom: 10, fontSize: '1rem' }}>② Sketch a Query</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                  Draw a rough, partial, or noisy version of one of your memorised patterns. The network will complete and return the closest stored memory.
                </p>
                <DrawingCanvas ref={queryCanvasRef} label="Draw noisy / partial version" onDrawEnd={handleLiveQuery} />
                {/* Live Output */}
                {resemblanceMap.length > 0 && phase === 'trained' && (
                  <div style={{ marginTop: 14, padding: '12px', background: 'var(--bg-section)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '0.8rem', marginBottom: 8, color: 'var(--text-muted)' }}>Live Draw Resemblance</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {resemblanceMap.slice(0, 5).map((rm, i) => (
                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                           <span>{rm.label}:</span>
                           <span style={{ fontWeight: 600, color: rm.match > 90 ? '#86efac' : (rm.match > 70 ? '#fde047' : 'var(--text-muted)') }}>{rm.match.toFixed(1)}%</span>
                         </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ marginTop: 14, width: '100%', justifyContent: 'center', fontSize: '1rem' }}
                  onClick={handleRecall}
                  disabled={busy}
                >
                  {busy ? '⏳ Recalling…' : '⚡ Recall Memory'}
                </button>
              </>
            )}

            {phase === 'recalled' && (
              <>
                <h3 style={{ marginBottom: 18, fontSize: '1rem' }}>③ Memory Recalled</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 12 }}>
                  <PatternDisplay pattern={inputPattern} label="Your Input" size={160} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#a78bfa', fontSize: '1.8rem' }}>→</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>recalled</span>
                  </div>
                  <PatternDisplay pattern={recalledPattern} label="Recalled Memory" size={160} />
                </div>
                
                {/* Resemblance Output */}
                {resemblanceMap.length > 0 && (
                  <div style={{ marginTop: 18, padding: '12px', background: 'var(--bg-section)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '0.8rem', marginBottom: 8, color: 'var(--text-muted)' }}>Resemblance Match</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {resemblanceMap.slice(0, 5).map((rm, i) => (
                         <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                           <span>{rm.label}:</span>
                           <span style={{ fontWeight: 600, color: rm.match > 90 ? '#86efac' : (rm.match > 70 ? '#fde047' : 'var(--text-muted)') }}>{rm.match.toFixed(1)}%</span>
                         </div>
                      ))}
                    </div>
                  </div>
                )}


                <div style={{
                  marginTop: 18, textAlign: 'center', borderRadius: 10,
                  padding: '10px 20px', background: 'var(--bg-section)',
                  fontSize: '0.85rem', color: converged ? '#86efac' : '#fbbf24'
                }}>
                  {converged ? '✅ Stable attractor reached' : '⚠️ Max steps reached — partial recall'}
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setPhase('trained')
                    setInputPattern([])
                    setRecalledPattern([])
                    setResemblanceMap([])
                    queryCanvasRef.current?.clear()
                    setStatusMsg('Draw another query to recall again.')
                  }}
                >
                  🔁 Try Another Query
                </button>
              </>
            )}
          </div>
        </div>

        {/* Wiki and Learnings */}
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.2rem', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>Mathematical Explanations & Theory</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {/* Hebbian Rule */}
            <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>🧠</span>
                <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#c4b5fd' }}>Hebbian Learning Rule</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The training process uses Hebbian learning, often summarized as "Neurons that fire together, wire together."
                The neural network learns by adjusting the weights ({"$W_{ij}$"}) between neurons $i$ and $j$. 
                <div style={{ padding: '10px', margin: '10px 0', background: 'rgba(0,0,0,0.3)', borderRadius: 6, fontFamily: 'monospace', color: '#a78bfa' }}>
                  W_ij = 1/N * Σ (x_i * x_j)   for all patterns x
                </div>
                If pixel $i$ and pixel $j$ are frequently the same color (both ON or both OFF) across multiple alphabet patterns, their connection weight {"$W_{ij}$"} becomes positive and strong.
              </div>
            </div>

            {/* Energy Function */}
            <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>⚡</span>
                <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#c4b5fd' }}>Energy Function</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The Hopfield network operates by minimizing an Energy function. Stored patterns (like the letters A-Z) act as "attractor wells" (minima) in the energy landscape.
                <div style={{ padding: '10px', margin: '10px 0', background: 'rgba(0,0,0,0.3)', borderRadius: 6, fontFamily: 'monospace', color: '#a78bfa' }}>
                  E = -0.5 * Σ_i Σ_j (W_ij * s_i * s_j)
                </div>
                When a partial or noisy network state $s$ is fed into the system, the network traverses this landscape downward. Because the learned letters have the lowest possible energy values, the network naturally converges to one of them.
              </div>
            </div>

            {/* Async Update */}
            <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>⚙️</span>
                <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#c4b5fd' }}>Asynchronous State Update Mechanism</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Unlike forward-propagation in standard neural networks, the Hopfield network updates laterally and asynchronously. A random neuron is chosen, and its next state is evaluated via a sign threshold:
                <div style={{ padding: '10px', margin: '10px 0', background: 'rgba(0,0,0,0.3)', borderRadius: 6, fontFamily: 'monospace', color: '#a78bfa' }}>
                  s_i(t+1) = sign( Σ_j (W_ij * s_j(t)) )
                </div>
                Updating asynchronously (one by one) rather than synchronously guarantees that the energy function $E$ will always decrease or stay the same. This totally prevents the network from getting caught in endless oscillation loops.
              </div>
            </div>
          </div>
        </div>

        {/* Research Papers & Lecture Notes */}
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.2rem', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>Research Papers & Lecture Notes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>
            <a 
              href="https://ocw.mit.edu/courses/9-40-introduction-to-neural-computation-spring-2018/d0eb7c14d2fa8ddb6bed2583d2f2962d_MIT9_40S18_Lec20.pdf" 
              download 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#c4b5fd'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ fontSize: '1.8rem' }}>📄</span>
              <div>
                <div style={{ fontWeight: 600, color: '#c4b5fd', marginBottom: 4 }}>MIT 9.40 Introduction to Neural Computation</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lecture 20: Hopfield Networks and Attractor Dynamics (PDF)</div>
              </div>
            </a>
            
            <a 
              href="https://www.cs.toronto.edu/~tijmen/csc321/slides/lecture_slides_lec11.pdf" 
              download 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#c4b5fd'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ fontSize: '1.8rem' }}>📄</span>
              <div>
                <div style={{ fontWeight: 600, color: '#c4b5fd', marginBottom: 4 }}>University of Toronto CSC321</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lecture 11: Energy-Based Models and Hopfield Nets (PDF)</div>
              </div>
            </a>
          </div>
        </div>
      </div>
  )
}

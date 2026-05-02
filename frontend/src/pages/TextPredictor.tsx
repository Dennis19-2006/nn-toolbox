import { useState, useRef, useEffect } from 'react'
import { predictNextWord } from '../api/client'

export default function TextPredictor() {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lastPrediction, setLastPrediction] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handlePredict = async () => {
    if (!text.trim()) {
      setError('Please enter some text first.')
      return
    }
    setError('')
    setBusy(true)
    try {
      // Predict next 5 tokens by default
      const res = await predictNextWord(text, 10)
      
      // We append the new text directly to the text area
      const newText = res.new_text
      setText(prev => prev + newText)
      setLastPrediction(newText)
      
      // Auto-focus and move cursor
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate prediction.')
    } finally {
      setBusy(false)
    }
  }

  // Clear highlight after a short time
  useEffect(() => {
    if (lastPrediction) {
      const timer = setTimeout(() => setLastPrediction(''), 2500)
      return () => clearTimeout(timer)
    }
  }, [lastPrediction])

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Next Word Predictor</h2>
        <p>A natural language generation tool powered by DistilGPT-2. Start typing and let the neural network predict what comes next.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            className="input"
            rows={10}
            placeholder="Once upon a time in a futuristic cyberpunk city..."
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={busy}
            style={{ 
              width: '100%', 
              resize: 'vertical', 
              fontSize: '1rem', 
              lineHeight: 1.6,
              fontFamily: 'var(--font-mono)' 
            }}
          />
          {busy && (
            <div style={{ 
              position: 'absolute', top: 10, right: 10, 
              background: 'var(--bg-section)', padding: '4px 10px', 
              borderRadius: 20, fontSize: '0.75rem', color: '#a78bfa',
              display: 'flex', alignItems: 'center', gap: 6,
              border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
              Thinking...
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {lastPrediction && (
              <span style={{ fontSize: '0.85rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '4px 8px', borderRadius: 4 }}>
                ✨ <strong>Generated:</strong> {lastPrediction}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => { setText(''); setLastPrediction(''); setError(''); }}
              disabled={busy || !text}
            >
              Clear
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handlePredict}
              disabled={busy || !text.trim()}
              style={{ padding: '8px 24px' }}
            >
              ✨ Auto-Complete
            </button>
          </div>
        </div>
      </div>
      
      {/* Information Section */}
      <div style={{ maxWidth: 800, margin: '32px auto 0', background: 'var(--bg-section)', borderRadius: 10, padding: 20, border: '1px solid var(--border)' }}>
         <h3 style={{ fontSize: '1rem', marginBottom: 12, color: '#c4b5fd' }}>How It Works</h3>
         <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
           This tool uses a <strong>Transformer</strong> model loaded via the HuggingFace `pipeline` in our FastAPI backend.
           Unlike the Hopfield Network which recalls exact patterns asynchronously, Transformers predict the next sequence of tokens mathematically based on the attention weights across the prior context.
         </p>
         <br/>
         <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
           Every time you click "Auto-Complete", the backend parses your entire text and probabilistically selects the next {`10`} words that are most likely to follow, making it highly adept at creative and continuous generation.
         </p>
      </div>
    </div>
  )
}

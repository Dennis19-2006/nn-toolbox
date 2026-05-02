import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadCSV } from '../api/client'

export default function DataUpload() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const data = await uploadCSV(file)
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Home</h2>
        <p>Neural Network Workbench — learn, train, and diagnose models interactively.</p>
      </div>

      {/* What is a Neural Network */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ background: 'var(--bg-section)', borderRadius: 12, padding: '28px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#c4b5fd', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.6rem' }}>🧠</span> What is a Neural Network?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20 }}>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <p style={{ marginBottom: 14 }}>
                Imagine you are trying to teach a child to identify numerical digits. Initially, the child might make mistakes identifying the correct numbers. However, if you continue showing the images of the digits to the child and pointing out the correct digits, the child will get better at recognizing them.
              </p>
              <p>
                A neural network is like a simplified version of the human brain that also <strong style={{ color: '#e2e8f0' }}>learns by example</strong>. When we train it using a dataset, it learns the underlying patterns in the dataset and can use them to make predictions or decisions in the future.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: 8, padding: '14px 16px', border: '1px solid rgba(139,92,246,0.3)' }}>
                <div style={{ fontWeight: 600, color: '#c4b5fd', marginBottom: 4 }}>📥 Input Layer</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Receives raw data — pixels, numbers, or text tokens.</div>
              </div>
              <div style={{ background: 'rgba(6,182,212,0.1)', borderRadius: 8, padding: '14px 16px', border: '1px solid rgba(6,182,212,0.3)' }}>
                <div style={{ fontWeight: 600, color: '#67e8f9', marginBottom: 4 }}>⚡ Hidden Layers</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Learn intermediate representations — edges, concepts, patterns.</div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: 8, padding: '14px 16px', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div style={{ fontWeight: 600, color: '#6ee7b7', marginBottom: 4 }}>📤 Output Layer</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Produces the final prediction — a class label or a value.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Types of Neural Networks */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🗂️</span> Types of Neural Networks
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { to: '/nn/feedforward', icon: '➡️', title: 'Feedforward Neural Networks', desc: 'Data flows in one direction. The foundational MLP architecture for tabular classification and regression.', color: '#c4b5fd', border: 'rgba(139,92,246,0.35)' },
            { to: '/nn/cnn',         icon: '🔲', title: 'Convolutional Neural Networks', desc: 'Learns spatial hierarchies via sliding filters. Powers image recognition, object detection, and computer vision.', color: '#67e8f9', border: 'rgba(6,182,212,0.35)' },
            { to: '/nn/rnn',         icon: '🔁', title: 'Recurrent Neural Networks', desc: 'Hidden state loops through time for sequential data. Core architecture for language and time-series tasks.', color: '#6ee7b7', border: 'rgba(16,185,129,0.35)' },
            { to: '/nn/lstm-gru',    icon: '🔒', title: 'LSTM / GRU', desc: 'Gated extensions of RNNs that solve the vanishing gradient problem and learn long-range dependencies.', color: '#a78bfa', border: 'rgba(167,139,250,0.35)' },
            { to: '/nn/transformers', icon: '⚡', title: 'Transformers', desc: 'Self-attention replaces recurrence. The architecture behind GPT, BERT, and modern generative AI.', color: '#fbbf24', border: 'rgba(251,191,36,0.35)' },
            { to: '/nn/autoencoders', icon: '🗜️', title: 'Autoencoders', desc: 'Encode data into a compressed latent space and reconstruct it. Used for anomaly detection and generative modeling.', color: '#fb923c', border: 'rgba(251,146,60,0.35)' },
            { to: '/nn/gan',         icon: '🎨', title: 'GANs', desc: 'A Generator and Discriminator compete to produce photorealistic synthetic data — images, audio, and more.', color: '#f472b6', border: 'rgba(244,114,182,0.35)' },
          ].map(({ to, icon, title, desc, color, border }) => (
            <div
              key={to}
              onClick={() => navigate(to)}
              style={{ padding: '18px', background: 'var(--bg-section)', borderRadius: 10, border: `1px solid ${border}`, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column', gap: 8 }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${border}` }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: '1.6rem' }}>{icon}</div>
              <div style={{ fontWeight: 700, color, fontSize: '0.95rem' }}>{title}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
              <div style={{ marginTop: 4, fontSize: '0.78rem', color, opacity: 0.8 }}>Read more →</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-header" style={{ marginTop: 0, marginBottom: 16 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Data Upload &amp; Cleaning</h3>
        <p style={{ fontSize: '0.85rem' }}>Upload a raw CSV, view exploratory stats, and automatically clean it.</p>
      </div>

      {!result ? (
        <div className="card">
          <div 
            className="drop-zone"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="drop-icon">📁</div>
            {file ? (
              <p style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{file.name}</p>
            ) : (
              <>
                <p>Drag and drop your CSV here, or click to browse</p>
                <p className="drop-hint">Files are processed instantly on the backend</p>
              </>
            )}
            <input 
              id="file-upload" 
              type="file" 
              accept=".csv" 
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div style={{ marginTop: 'var(--sp-xl)', textAlign: 'right' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleUpload} 
              disabled={!file || loading}
            >
              {loading ? <div className="spinner" /> : 'Upload & Clean Data'}
            </button>
          </div>
          {error && <div className="alert alert-error" style={{ marginTop: 'var(--sp-md)' }}>{error}</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }}>
          <div className="alert alert-ok">
            <strong>Success!</strong> Cleaned dataset is ready in memory.
          </div>

          <div className="card-grid">
            <div className="stat-card">
              <div className="stat-label">Raw Rows</div>
              <div className="stat-value">{result.profile.rows}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cleaned Rows</div>
              <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{result.cleaning_report.final_rows}</div>
              <div className="stat-unit">Dropped {result.cleaning_report.dropped_duplicates} duplicates</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Columns</div>
              <div className="stat-value">{result.cleaning_report.final_columns}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Label Encoded</div>
              <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{result.cleaning_report.label_encoded_columns?.length || 0}</div>
              <div className="stat-unit">categorical features</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 'var(--sp-md)' }}>Cleaning Report</h3>
            <pre style={{ 
              background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--r-md)', 
              fontSize: '0.85rem', color: 'var(--text-secondary)', overflowX: 'auto' 
            }}>
              {JSON.stringify(result.cleaning_report, null, 2)}
            </pre>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 'var(--sp-md)' }}>Cleaned Preview (First 10 rows)</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {result.columns.map((c: string) => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.cleaned_preview.map((row: any, i: number) => (
                    <tr key={i}>
                      {result.columns.map((c: string) => <td key={c} title={row[c]}>{row[c]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button className="btn btn-ghost" onClick={() => { setFile(null); setResult(null) }}>
              Upload Another File
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

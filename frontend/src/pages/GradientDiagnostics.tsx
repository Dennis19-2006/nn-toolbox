import { useState, useMemo } from 'react'
import { getGradients, GradientLayer } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function GradientDiagnostics() {
  const [jobId, setJobId] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ summary: any, layers: Record<string, GradientLayer> } | null>(null)
  const [error, setError] = useState('')

  const handleFetch = async () => {
    if (!jobId.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await getGradients(jobId.trim())
      if (res.message) {
        setError(res.message + ` (Status: ${res.status || 'unknown'})`)
      } else {
        setData(res)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch gradients')
    } finally {
      setLoading(false)
    }
  }

  const chartData = useMemo(() => {
    if (!data?.layers) return []
    return Object.entries(data.layers).map(([name, val]) => ({
      name,
      norm: val.norm,
      status: val.status,
      logNorm: Math.max(val.norm, 1e-10)
    }))
  }, [data])

  const getColor = (status: string) => {
    if (status === 'vanishing') return 'var(--accent-amber)'
    if (status === 'exploding') return 'var(--accent-red)'
    return 'var(--accent-green)'
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Gradient Diagnostics</h2>
        <p>Analyze layer-wise gradient norms from a completed training job to detect vanishing or exploding gradients.</p>
      </div>

      <div className="card" style={{ display: 'flex', gap: 'var(--sp-md)', alignItems: 'flex-end', marginBottom: 'var(--sp-xl)' }}>
        <div className="form-group" style={{ margin: 0, flex: 1 }}>
          <label>Job ID</label>
          <input
            type="text"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            value={jobId}
            onChange={e => setJobId(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleFetch} disabled={loading || !jobId}>
          {loading ? <div className="spinner"/> : 'Diagnose Gradients'}
        </button>
      </div>

      {error && <div className="alert alert-warn" style={{ marginBottom: 'var(--sp-xl)' }}>{error}</div>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }}>
          
          <div className="card-grid">
            <div className="stat-card" style={{ borderColor: 'var(--accent-green)' }}>
              <div className="stat-label">Healthy Layers</div>
              <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{data.summary?.healthy || 0}</div>
            </div>
            <div className="stat-card" style={{ borderColor: 'var(--accent-amber)' }}>
              <div className="stat-label">Vanishing Layers</div>
              <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{data.summary?.vanishing || 0}</div>
              <div className="stat-unit">Norm &lt; 1e-4</div>
            </div>
            <div className="stat-card" style={{ borderColor: 'var(--accent-red)' }}>
              <div className="stat-label">Exploding Layers</div>
              <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{data.summary?.exploding || 0}</div>
              <div className="stat-unit">Norm &gt; 100.0</div>
            </div>
          </div>

          <div className="card" style={{ height: '400px' }}>
            <h3 style={{ marginBottom: 'var(--sp-md)' }}>Per-Layer Mean L2 Normal (Log Scale)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} interval={0} />
                <YAxis scale="log" domain={['auto', 'auto']} tickFormatter={(v) => v.toExponential(1)} tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip
                  formatter={(val: number) => val.toExponential(4)}
                  contentStyle={{ background: 'var(--bg-card)', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="logNorm" name="Gradient Norm">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 'var(--sp-md)' }}>Layer Breakdown</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Layer Name</th>
                    <th>Mean L2 Norm</th>
                    <th>Health Status</th>
                    <th>Diagnosis Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.layers).map(([name, info]) => (
                    <tr key={name}>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td>{info.norm.toExponential(4)}</td>
                      <td>
                        <span className={`badge badge-${info.status}`}>
                          {info.status}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'normal', minWidth: '300px', color: 'var(--text-secondary)' }}>
                        {info.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Explainer Section */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1.2rem', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>Understanding Gradient Diagnostics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🆔</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>What is a Job ID?</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Every training run started from the <strong>Custom Trainer</strong> or <strong>Sentiment Analysis</strong> pages generates a unique <strong>Job ID</strong> — a UUID (e.g. <code>550e8400-e29b-41d4-a716-446655440000</code>). The backend stores gradient data under this ID after training completes. Paste it here to load and diagnose that specific run.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>📐</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>What is a Gradient Norm?</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              The gradient norm is the <strong>L2 magnitude</strong> of all gradient values in a weight layer. It tells you how strongly that layer is updating during backpropagation. A healthy norm is roughly between <code>1e-4</code> and <code>100</code>. The chart uses a log scale to make both tiny and huge values visible at once.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🟡</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Vanishing Gradients (Norm &lt; 1e-4)</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              When gradients shrink to near-zero, early layers receive almost no update signal. This is the classic <strong>vanishing gradient problem</strong>. The layer effectively stops learning. Common causes: too many layers, Sigmoid/Tanh activations, or learning rate too small. Fix: use ReLU, residual connections, or gradient clipping.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🔴</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Exploding Gradients (Norm &gt; 100)</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              When gradients grow exponentially, weight updates become destructively large and loss diverges. This is the <strong>exploding gradient problem</strong>. Common causes: high learning rate, very deep networks, or poor weight initialization. Fix: use gradient clipping, lower learning rate, or switch to AdamW optimizer.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🟢</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Healthy Layers</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              A layer is healthy when its gradient norm falls between <code>1e-4</code> and <code>100</code>. This means error signals are propagating correctly and the layer is learning at a reasonable pace. The goal is for all layers to show green — indicating stable, well-balanced training.
            </p>
          </div>

        </div>
      </div>

      {/* Gradient Theory Article */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1.2rem', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
          What is the Role of Gradients in Training Neural Networks?
        </h3>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            In the realm of machine learning, particularly in training neural networks, gradients play a pivotal role. Understanding their function is crucial for comprehending how neural networks learn and improve over time. At its core, the concept of gradients is tied to the optimization process, which is fundamental to training these models.
          </p>

          <div style={{ padding: '16px 20px', background: 'rgba(139,92,246,0.08)', borderRadius: 8, borderLeft: '3px solid #8b5cf6' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
              Gradients are essentially <strong style={{ color: '#e2e8f0' }}>vectors of partial derivatives</strong> of the neural network's loss function concerning its weights and biases. The loss function quantifies the difference between the predicted output of the neural network and the actual target values. During training, the goal is to minimize this loss, thereby improving the model's accuracy. Gradients indicate the direction and rate at which the weights and biases should be adjusted to decrease the loss function. This process is commonly known as <strong style={{ color: '#c4b5fd' }}>gradient descent</strong>.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div style={{ background: 'rgba(6,182,212,0.08)', borderRadius: 8, padding: '14px 16px', border: '1px solid rgba(6,182,212,0.25)' }}>
              <div style={{ fontWeight: 600, color: '#67e8f9', marginBottom: 6, fontSize: '0.9rem' }}>① Compute the Gradient</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Calculate the gradient of the loss function with respect to every weight and bias using backpropagation.
              </div>
            </div>
            <div style={{ background: 'rgba(139,92,246,0.08)', borderRadius: 8, padding: '14px 16px', border: '1px solid rgba(139,92,246,0.25)' }}>
              <div style={{ fontWeight: 600, color: '#c4b5fd', marginBottom: 6, fontSize: '0.9rem' }}>② Update in the Opposite Direction</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Move parameters in the <em>opposite</em> direction of the gradient — the gradient points toward steepest increase, so we go the other way.
              </div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '14px 16px', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div style={{ fontWeight: 600, color: '#6ee7b7', marginBottom: 6, fontSize: '0.9rem' }}>③ Repeat Until Convergence</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Iterate across multiple epochs until the loss function reaches a minimum or satisfies a predefined stopping criterion.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research Papers & Lecture Notes */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1.2rem', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>Research Papers & Lecture Notes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>
          <a
            href="https://web.stanford.edu/class/cs224n/readings/gradient-notes.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#c4b5fd'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: '1.8rem' }}>📄</span>
            <div>
              <div style={{ fontWeight: 600, color: '#c4b5fd', marginBottom: 4 }}>Stanford CS224N — Gradient Notes</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Notes on Gradients and Backpropagation in Neural Networks (PDF)</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

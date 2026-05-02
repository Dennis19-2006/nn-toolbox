import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { streamEpochs, EpochData } from '../api/client'

export default function EpochGraph() {
  const [jobId, setJobId] = useState('')
  const [status, setStatus] = useState<string>('idle')
  const [epochData, setEpochData] = useState<EpochData[]>([])

  const handleConnect = () => {
    if (!jobId.trim()) return
    setStatus('connecting')
    setEpochData([])
    
    // We treat attaching to an existing job just like streaming a new one
    streamEpochs(jobId.trim(), (data) => {
      setEpochData(prev => [...prev, data])
      setStatus('running')
    }, (finalStatus) => {
      setStatus(finalStatus)
    })
  }

  // Derived max metrics 
  const maxTrainAcc = Math.max(...epochData.map(d => d.train_acc || 0))
  const maxValAcc = Math.max(...epochData.map(d => d.val_acc || 0))
  const minTrainLoss = Math.min(...epochData.map(d => d.train_loss))
  const minValLoss = Math.min(...epochData.map(d => d.val_loss))

  const hasAcc = epochData.some(d => d.train_acc !== null)

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Epoch Dashboard</h2>
        <p>Connect to any running or completed job ID to visualize the entire training trajectory.</p>
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
        <button className="btn btn-primary" onClick={handleConnect} disabled={status === 'connecting' || status === 'running' || !jobId}>
          {status === 'connecting' || status === 'running' ? <div className="spinner"/> : 'Load Graph'}
        </button>
      </div>

      {epochData.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xl)' }}>
          <div className="card-grid">
             <div className="stat-card">
              <div className="stat-label">Best Train Loss</div>
              <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{minTrainLoss === Infinity ? '-' : minTrainLoss.toFixed(4)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Best Val Loss</div>
              <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{minValLoss === Infinity ? '-' : minValLoss.toFixed(4)}</div>
            </div>
            {hasAcc && (
              <>
                <div className="stat-card">
                  <div className="stat-label">Best Train Acc</div>
                  <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{(maxTrainAcc * 100).toFixed(1)}%</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Best Val Acc</div>
                  <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{(maxValAcc * 100).toFixed(1)}%</div>
                </div>
              </>
            )}
            <div className="stat-card" style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
               <div className="stat-label">Job Status</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', marginTop: 'var(--sp-xs)' }}>
                 <span className={`badge badge-${status === 'done' ? 'healthy' : status === 'running' ? 'running' : 'vanishing'}`}>
                    {status}
                 </span>
                 <span className="stat-unit">Total Epochs fetched: {epochData.length}</span>
               </div>
            </div>
          </div>

          <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: 'var(--sp-lg)' }}>Loss & Accuracy Progression</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={epochData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="epoch" tick={{ fill: 'var(--text-secondary)' }} />
                  <YAxis yAxisId="left" tick={{ fill: '#8b5cf6' }} domain={['auto', 'auto']} />
                  {hasAcc && <YAxis yAxisId="right" orientation="right" tick={{ fill: '#06b6d4' }} domain={[0, 1]} />}
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="train_loss" stroke="#8b5cf6" strokeWidth={2} dot={true} name="Train Loss" />
                  <Line yAxisId="left" type="monotone" dataKey="val_loss" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={true} name="Val Loss" />
                  {hasAcc && <Line yAxisId="right" type="monotone" dataKey="train_acc" stroke="#06b6d4" strokeWidth={2} dot={true} name="Train Acc" />}
                  {hasAcc && <Line yAxisId="right" type="monotone" dataKey="val_acc" stroke="#67e8f9" strokeWidth={2} strokeDasharray="5 5" dot={true} name="Val Acc" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Explainer Section */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1.2rem', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>Reading the Epoch Graph</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🆔</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>What is a Job ID?</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              When you start a training run from <strong>Custom Trainer</strong> or <strong>Sentiment Analysis</strong>, the backend assigns it a unique <strong>Job ID</strong> (a UUID string). Paste that ID here to stream or replay that job's full per-epoch training history, even after the original page has closed or refreshed.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🟣</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Train Loss vs Val Loss</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>Train Loss</strong> measures how well your model fits the training set. <strong>Val Loss</strong> measures fit on held-out validation data. Both should decrease over epochs. If train loss keeps falling but val loss starts rising, your model is <strong>overfitting</strong> — memorizing training data rather than generalizing.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🟦</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Train Acc vs Val Acc</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Only shown for classification tasks. <strong>Train Acc</strong> is the proportion of training samples predicted correctly. <strong>Val Acc</strong> is the same metric on the validation set. A good model has both values converging upward. A large gap between them is a sign of overfitting.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Best Metrics (Stat Cards)</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              The summary cards at the top of the graph show the <strong>best values ever achieved</strong> across all epochs — the minimum loss and maximum accuracy seen during the entire training run. These are the headline figures you would quote when reporting model performance.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🟢</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Job Status Badge</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              The <strong>done</strong> badge (green) means the training job has fully completed and all epochs are loaded. <strong>running</strong> (animated) means the job is still active and new epochs are streaming in live. Other states like <strong>error</strong> indicate the job crashed — check the Custom Trainer page for the original error.
            </p>
          </div>

        </div>
      </div>

      {/* Example Simulation */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1.2rem', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>Example Simulation</h3>
        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            The animation below shows how a neural network's decision boundary evolves epoch by epoch during training on a classification task. 
            Notice how the boundary starts poorly positioned and gradually converges toward the optimal separating surface — exactly what you'd see in your epoch graph as loss decreases and accuracy climbs.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src="http://tomaszgolan.github.io/reveal_talks/img/ml/logistic_classification.gif"
              alt="Neural network classification boundary evolving over training epochs"
              style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
            Fig: Logistic classification boundary converging over training iterations — Tomasz Golan
          </p>
        </div>
      </div>
    </div>
  )
}

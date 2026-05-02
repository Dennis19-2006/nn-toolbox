import { useState, useEffect } from 'react'
import { trainCustom, streamEpochs, EpochData } from '../api/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function CustomTrainer() {
  const [file, setFile] = useState<File | null>(null)
  const [targetCol, setTargetCol] = useState('')
  const [taskType, setTaskType] = useState('classification')
  
  const [arch, setArch] = useState('dense')
  const [hiddenSizes, setHiddenSizes] = useState('128,64,32')
  const [activation, setActivation] = useState('relu')
  const [optimizer, setOptimizer] = useState('adam')
  
  const [epochs, setEpochs] = useState(10)
  const [lr, setLr] = useState(0.001)
  const [batchSize, setBatchSize] = useState(32)
  const [dropout, setDropout] = useState(0.2)

  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const [epochData, setEpochData] = useState<EpochData[]>([])
  const [error, setError] = useState('')

  const startTrain = async () => {
    if (!file || !targetCol) return
    setError('')
    setStatus('starting')
    setEpochData([])
    
    try {
      const res = await trainCustom({
        file, target_col: targetCol, task_type: taskType,
        arch, hidden_sizes: hiddenSizes, activation, optimizer_name: optimizer,
        epochs, lr, batch_size: batchSize, dropout, val_size: 0.2
      })
      setJobId(res.job_id)
      setStatus('running')
    } catch (err: any) {
      setError(err.message)
      setStatus('idle')
    }
  }

  useEffect(() => {
    if (!jobId || status !== 'running') return
    const es = streamEpochs(jobId, (data) => {
      setEpochData(prev => [...prev, data])
    }, (finalStatus) => {
      setStatus(finalStatus)
    })
    return () => es.close()
  }, [jobId, status])

  const isClass = taskType === 'classification'

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Custom Architecture Trainer</h2>
        <p>Build and train arbitrary feedforward or recurrent networks on tabular data.</p>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr', alignItems: 'start' }}>
        
        {/* Left: Form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          <h3>Data & Task</h3>
          <div className="form-group">
            <label>Numerical CSV</label>
            <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Target Column</label>
              <input type="text" placeholder="e.g. price" value={targetCol} onChange={e => setTargetCol(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Task Type</label>
              <select value={taskType} onChange={e => setTaskType(e.target.value)}>
                <option value="classification">Classification</option>
                <option value="regression">Regression</option>
              </select>
            </div>
          </div>

          <div className="glow-divider" style={{ margin: 'var(--sp-sm) 0' }} />
          <h3>Architecture</h3>
          
          <div className="form-group">
            <label>Base Layer Type</label>
            <select value={arch} onChange={e => setArch(e.target.value)}>
              <option value="dense">Dense (MLP)</option>
              <option value="rnn">RNN (Sequence-like tabular)</option>
              <option value="lstm">LSTM (Sequence-like tabular)</option>
              <option value="gru">GRU (Sequence-like tabular)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Hidden Layer Sizes (comma-separated)</label>
            <input type="text" value={hiddenSizes} onChange={e => setHiddenSizes(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Activation</label>
              <select value={activation} onChange={e => setActivation(e.target.value)}>
                <option value="relu">ReLU</option>
                <option value="gelu">GELU</option>
                <option value="tanh">Tanh</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Dropout: {dropout}</label>
              <input type="range" min="0" max="0.8" step="0.1" value={dropout} onChange={e => setDropout(Number(e.target.value))} />
            </div>
          </div>

          <div className="glow-divider" style={{ margin: 'var(--sp-sm) 0' }} />
          <h3>Hyperparameters</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--sp-sm)' }}>
             <div className="form-group">
              <label>Optimizer</label>
              <select value={optimizer} onChange={e => setOptimizer(e.target.value)}>
                <option value="adam">Adam</option>
                <option value="adamw">AdamW</option>
                <option value="sgd">SGD</option>
              </select>
            </div>
            <div className="form-group">
              <label>Learning Rate</label>
              <select value={lr} onChange={e => setLr(Number(e.target.value))}>
                <option value={0.01}>1e-2</option>
                <option value={0.001}>1e-3</option>
                <option value={0.0001}>1e-4</option>
              </select>
            </div>
            <div className="form-group">
              <label>Batch Size</label>
              <select value={batchSize} onChange={e => setBatchSize(Number(e.target.value))}>
                <option value={16}>16</option>
                <option value={32}>32</option>
                <option value={64}>64</option>
                <option value={128}>128</option>
                <option value={256}>256</option>
              </select>
            </div>
            <div className="form-group">
              <label>Epochs: {epochs}</label>
              <input type="range" min="5" max="100" step="5" value={epochs} onChange={e => setEpochs(Number(e.target.value))} />
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button 
            className="btn btn-primary" 
            style={{ marginTop: 'var(--sp-md)' }}
            onClick={startTrain}
            disabled={status === 'running' || status === 'starting' || !file || !targetCol}
          >
            {status === 'running' ? <>Training <div className="dot-live"/></> : 'Start Custom Training'}
          </button>
        </div>

        {/* Right: Chart */}
        <div className="card" style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
            <h3>Loss & Metrics</h3>
            {status !== 'idle' && (
              <span className={`badge badge-${status === 'done' ? 'healthy' : status === 'running' ? 'running' : 'vanishing'}`}>
                {status}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            {epochData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={epochData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="epoch" tick={{ fill: 'var(--text-secondary)' }} />
                  <YAxis yAxisId="left" tick={{ fill: '#8b5cf6' }} domain={['auto', 'auto']} />
                  {isClass && <YAxis yAxisId="right" orientation="right" tick={{ fill: '#06b6d4' }} domain={[0, 1]} />}
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="train_loss" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="val_loss" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  {isClass && <Line yAxisId="right" type="monotone" dataKey="train_acc" stroke="#06b6d4" strokeWidth={2} dot={false} />}
                  {isClass && <Line yAxisId="right" type="monotone" dataKey="val_acc" stroke="#67e8f9" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                {status === 'idle' ? 'Ready to train' : 'Waiting for metrics...'}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* How the Custom Trainer Works */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1.2rem', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>How the Custom Trainer Works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>📂</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Your CSV Dataset</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Upload any numerical CSV. The trainer will auto-split 80% for training and 20% for validation. Your chosen <strong>Target Column</strong> becomes the model's output — either a predicted class or a continuous value.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🏗️</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Architecture Builder</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Choose between <strong>Dense (MLP)</strong> for tabular data, or <strong>RNN / LSTM / GRU</strong> for sequence-like tabular data. Hidden Layer Sizes (e.g. <code>128,64,32</code>) define the number and width of hidden layers stacked in order.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>⚙️</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Activations & Dropout</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>ReLU</strong> is the standard choice — fast and effective for most tasks. <strong>GELU</strong> is smoother and works well for transformer-style data. <strong>Tanh</strong> squashes outputs to [-1, 1] and is common in RNNs. Dropout randomly zeros neurons during training to prevent overfitting.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>📈</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Optimizers Explained</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>Adam</strong> adapts the learning rate per-parameter and is the default for most tasks. <strong>AdamW</strong> adds weight decay to reduce overfitting. <strong>SGD</strong> is simpler and can generalize better with tuning but needs more epochs. Learning rate controls how large each gradient update step is.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🔢</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Batch Size & Epochs</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>Batch Size</strong> is how many samples the model sees before updating weights. Smaller batches give noisier but sometimes more generalizable updates. <strong>Epochs</strong> is how many full passes through the training data are performed — more epochs means more learning, but also risk of overfitting.
            </p>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🆔</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd' }}>Job ID — What Is It?</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              When you click <strong>Start Custom Training</strong>, the backend creates a unique training job and returns a <strong>Job ID</strong> — a UUID like <code>550e8400-e29b-41d4-a716-446655440000</code>. This ID lets you reconnect to the live stream, check gradient health, or replay the epoch graph at any time from the other tools.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

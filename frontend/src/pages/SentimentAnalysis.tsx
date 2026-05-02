import { useState, useRef, useEffect } from 'react'
import { trainSentiment, trainTFSentiment, streamEpochs, EpochData } from '../api/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function SentimentAnalysis() {
  const [file, setFile] = useState<File | null>(null)
  const [textCol, setTextCol] = useState('')
  const [labelCol, setLabelCol] = useState('')
  const [engine, setEngine] = useState<'pytorch' | 'tensorflow'>('pytorch')
  const [arch, setArch] = useState('lstm')
  const [epochs, setEpochs] = useState(5)
  const [lr, setLr] = useState(0.001)
  const [batchSize, setBatchSize] = useState(32)

  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const [epochData, setEpochData] = useState<EpochData[]>([])
  const [error, setError] = useState('')

  const startTrain = async () => {
    if (!file || !textCol || !labelCol) return
    setError('')
    setStatus('starting')
    setEpochData([])
    
    try {
      let res;
      if (engine === 'pytorch') {
        res = await trainSentiment({
          file, text_col: textCol, label_col: labelCol,
          arch, epochs, lr, batch_size: batchSize,
          embed_dim: 64, hidden_dim: 128, num_layers: 2, dropout: 0.3
        })
      } else {
        res = await trainTFSentiment({
          file, text_col: textCol, label_col: labelCol,
          epochs, lr, batch_size: batchSize,
          embed_dim: 64, hidden_dim: 128, dropout: 0.3,
          max_vocab: 10000, max_len: 64
        })
      }
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

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Sentiment Analysis RNN</h2>
        <p>Train a recurrent neural network on your custom text dataset.</p>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        {/* left: Form */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--sp-lg)' }}>Configuration</h3>
          
          <div className="form-group">
            <label>Dataset (CSV)</label>
            <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
            <div className="form-group">
              <label>Text Column</label>
              <input type="text" placeholder="e.g. review" value={textCol} onChange={e => setTextCol(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Label Column</label>
              <input type="text" placeholder="e.g. sentiment" value={labelCol} onChange={e => setLabelCol(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Engine</label>
            <select value={engine} onChange={e => setEngine(e.target.value as 'pytorch' | 'tensorflow')}>
              <option value="pytorch">PyTorch</option>
              <option value="tensorflow">TensorFlow</option>
            </select>
          </div>

          {engine === 'pytorch' && (
            <div className="form-group">
              <label>Architecture</label>
              <select value={arch} onChange={e => setArch(e.target.value)}>
                <option value="rnn">Standard RNN</option>
                <option value="lstm">LSTM</option>
                <option value="gru">GRU</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Epochs: {epochs}</label>
            <input type="range" min="1" max="50" value={epochs} onChange={e => setEpochs(Number(e.target.value))} />
          </div>

          <div className="form-group">
            <label>Learning Rate: {lr}</label>
            <select value={lr} onChange={e => setLr(Number(e.target.value))}>
              <option value={0.01}>0.01</option>
              <option value={0.001}>0.001</option>
              <option value={0.0001}>0.0001</option>
            </select>
          </div>

          <div className="form-group">
            <label>Batch Size: {batchSize}</label>
            <select value={batchSize} onChange={e => setBatchSize(Number(e.target.value))}>
              <option value={16}>16</option>
              <option value={32}>32</option>
              <option value={64}>64</option>
              <option value={128}>128</option>
            </select>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--sp-md)' }}>{error}</div>}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={startTrain}
            disabled={status === 'running' || status === 'starting' || !file || !textCol || !labelCol}
          >
            {status === 'running' ? <>Training <div className="dot-live"/></> : 'Start Training'}
          </button>
        </div>

        {/* Right: Chart */}
        <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-lg)' }}>
            <h3>Live Epoch Metrics</h3>
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
                  <YAxis yAxisId="left" tick={{ fill: '#8b5cf6' }} domain={['auto', 'auto']} label={{ value: 'Loss', angle: -90, position: 'insideLeft', fill: '#8b5cf6' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#06b6d4' }} domain={[0, 1]} label={{ value: 'Accuracy', angle: 90, position: 'insideRight', fill: '#06b6d4' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="train_loss" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Train Loss" />
                  <Line yAxisId="left" type="monotone" dataKey="val_loss" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Val Loss" />
                  <Line yAxisId="right" type="monotone" dataKey="train_acc" stroke="#06b6d4" strokeWidth={2} dot={false} name="Train Acc" />
                  <Line yAxisId="right" type="monotone" dataKey="val_acc" stroke="#67e8f9" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Val Acc" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                {status === 'idle' ? 'Configure side panel and start training to see live graph' : 'Awaiting first epoch...'}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* LSTM Theory Section */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1.2rem', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>Understanding LSTMs</h3>
        
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8, padding: '16px', background: 'var(--bg-section)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <p>
            Standard recurrent neural networks struggle with memory. As sequences grow beyond 20-30 timesteps, gradients either shrink toward zero or blow up during backpropagation, and the network loses its ability to connect distant parts of the input. Hochreiter and Schmidhuber tackled this problem in their 1997 paper by introducing Long Short-Term Memory networks.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontWeight: 600, fontSize: '1.05rem', color: '#c4b5fd', marginBottom: 12 }}>What Is an LSTM Model?</h4>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: 12 }}>LSTM stands for Long Short-Term Memory, a type of recurrent neural network (RNN) designed to handle sequences where context from much earlier in the input still matters.</p>
              <p style={{ marginBottom: 12 }}>The core idea behind LSTMs is a gating mechanism that regulates information flow through the network. Rather than letting all signals pass through equally, gates learn when to retain context and when to let it go.</p>
              <p>This selective memory allows LSTMs to track dependencies across hundreds of timesteps, which proved useful for language modeling, speech recognition, and time series forecasting. To understand why this architecture exists, it helps to see what breaks in standard RNNs.</p>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <img 
                  src="https://cdn-images-1.readmedium.com/v2/resize:fit:800/1*goJVQs-p9kgLODFNyhl9zA.gif" 
                  alt="Animated LSTM cell mechanics"
                  style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontWeight: 600, fontSize: '1.05rem', color: '#c4b5fd', marginBottom: 12 }}>The Vanishing Gradient Problem in RNNs</h4>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: 12 }}>Recurrent networks pass information from one timestep to the next through a hidden state. Each step multiplies this state by learned weights, updates it, and passes it forward. Training requires sending error signals backward through all those steps, and each backward pass shrinks the signal a bit. After enough steps, there's nothing left.</p>
              <p>It's like making a photocopy of a photocopy. Do it a few times, and the copy looks fine. Do it fifty times, and you can barely read the text. RNNs hit this wall somewhere around 20-30 timesteps, which is why they struggle with longer sequences.</p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '20px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontWeight: 600, fontSize: '1.05rem', color: '#c4b5fd', marginBottom: 12 }}>How LSTMs Solve Long-Term Dependencies</h4>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: 12 }}>LSTMs add a separate memory track, called the cell state, that runs in parallel to the standard hidden state. The difference is structural: information in the cell state flows through addition rather than repeated multiplication, so it doesn't degrade the same way.</p>
              <p style={{ marginBottom: 12 }}>To control what goes into and out of this memory, LSTMs use gates. Each gate is a small neural network that learns to output values between 0 and 1, acting as a filter. A value near 0 blocks information; a value near 1 lets it through. The network learns during training which patterns are worth remembering across long sequences and which can be discarded.</p>
              <p>This gating mechanism is what separates LSTMs from vanilla RNNs. Instead of forcing all information through the same path, LSTMs can selectively preserve context across hundreds of timesteps. The next section breaks down exactly how these gates work and how they combine to update the cell state.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Research Papers & Lecture Notes */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1.2rem', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>Research Papers & Lecture Notes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>

          <a
            href="https://cse.iitk.ac.in/users/sigml/lec/Slides/LSTM.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#c4b5fd'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: '1.8rem' }}>📄</span>
            <div>
              <div style={{ fontWeight: 600, color: '#c4b5fd', marginBottom: 4 }}>IIT Kanpur — SigML Lecture Slides</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>LSTM: Long Short-Term Memory — Lecture Slides (PDF)</div>
            </div>
          </a>

          <a
            href="https://pages.cs.wisc.edu/~shavlik/cs638/lectureNotes/Long%20Short-Term%20Memory%20Networks.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#c4b5fd'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: '1.8rem' }}>📄</span>
            <div>
              <div style={{ fontWeight: 600, color: '#c4b5fd', marginBottom: 4 }}>University of Wisconsin-Madison — CS638</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Long Short-Term Memory Networks — Lecture Notes (PDF)</div>
            </div>
          </a>

          <a
            href="https://web.stanford.edu/class/cs379c/archive/2018/class_messages_listing/content/Artificial_Neural_Network_Technology_Tutorials/OlahLSTM-NEURAL-NETWORK-TUTORIAL-15.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '16px', background: 'var(--bg-section)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#c4b5fd'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: '1.8rem' }}>📄</span>
            <div>
              <div style={{ fontWeight: 600, color: '#c4b5fd', marginBottom: 4 }}>Stanford CS379C — Olah LSTM Tutorial</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Understanding LSTM Networks — Christopher Olah (PDF)</div>
            </div>
          </a>

        </div>
      </div>
    </div>
  )
}

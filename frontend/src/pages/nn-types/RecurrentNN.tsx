export default function RecurrentNN() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Recurrent Neural Networks (RNN)</h2>
        <p>Dynamic sequence processing with internal memory.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Introduction</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Recurrent Neural Networks are designed for sequential data. Unlike feedforward networks, RNNs have connections that form directed cycles, allowing them to maintain a memory of previous inputs. This makes them ideal for tasks where context or time sequence is important.
          </p>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
           <h4 style={{ marginBottom: 16 }}>Figure: Recurrent Neural Network (RNN)</h4>
           <div style={{ display: 'flex', justifyContent: 'center' }}>
             <img 
               src="/images/nn-types/rnn.png" 
               alt="Recurrent Neural Network Diagram" 
               style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
             />
           </div>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Use Cases of RNNs</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12 }}>
            In today’s technological landscape, Recurrent Neural Networks (RNNs) have proven to be incredibly versatile and effective in a variety of applications. From natural language processing tasks such as language modeling, text generation, and machine translation to speech recognition and time series prediction, RNNs offer powerful solutions thanks to their ability to model temporal dependencies.
          </p>
          <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Natural Language Processing (NLP):</strong> RNNs are widely used in NLP tasks such as language modeling, text generation, and machine translation.</li>
            <li><strong>Speech Recognition:</strong> RNNs are effective in processing audio data for speech recognition.</li>
            <li><strong>Time Series Prediction:</strong> RNNs can model temporal dependencies, making them suitable for time series forecasting.</li>
          </ul>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>When to Use RNNs</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            RNNs are used when working with sequential data, such as text and time series data, where the order of the data points is crucial. Their capability to remember previous inputs makes them well-suited for tasks involving time series or text.
          </p>
        </div>

      </div>
    </div>
  )
}

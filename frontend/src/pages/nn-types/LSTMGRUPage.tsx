export default function LSTMGRUPage() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>LSTM & GRU</h2>
        <p>Gated memory units for long-term dependency learning.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Introduction</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            LSTM (Long Short-Term Memory) and GRU (Gated Recurrent Unit) are advanced types of RNNs specifically created to overcome the vanishing gradient problem commonly encountered by traditional RNNs. These specialized networks utilize gates to regulate the flow of information, enabling more effective long-term learning and retention of information.
          </p>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
           <h4 style={{ marginBottom: 16 }}>Figure: LSTM Architecture</h4>
           <div style={{ display: 'flex', justifyContent: 'center' }}>
             <img 
               src="/images/nn-types/lstm_v2.png" 
               alt="LSTM Network Diagram" 
               style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
             />
           </div>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
           <h4 style={{ marginBottom: 16 }}>Figure: GRU vs LSTM Comparison</h4>
           <div style={{ display: 'flex', justifyContent: 'center' }}>
             <img 
               src="/images/nn-types/gru.png" 
               alt="GRU vs LSTM Architecture Comparison" 
               style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
             />
           </div>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Use Cases of LSTMs and GRUs</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12 }}>
            When it comes to the use cases of LSTMs and GRUs, these advanced types of RNNs are particularly useful for tasks requiring the modeling of long-term dependencies in the data. Some examples are as follows:
          </p>
          <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Language Translation:</strong> They are effective in translation tasks where understanding the context over long sequences of text is important.</li>
            <li><strong>Stock Market Prediction:</strong> LSTMs and GRUs can capture long-range temporal dependencies in financial time series data, making them suitable for stock market prediction.</li>
          </ul>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>When to Use LSTMs and GRUs</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Opt for LSTMs or GRUs when your sequential data has long-term dependencies that standard RNNs cannot effectively capture. They provide better performance for tasks requiring remembering information over extended sequences.
          </p>
        </div>

      </div>
    </div>
  )
}

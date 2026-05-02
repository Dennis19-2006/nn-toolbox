export default function TransformersPage() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Transformers</h2>
        <p>Parallelized self-attention for sequence modeling.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Introduction</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Transformers represent a neural network architecture that utilizes self-attention mechanisms for processing input data. They have emerged as the cornerstone for numerous cutting-edge models in natural language processing. Transformers have significantly transformed the handling of sequential data by addressing certain constraints of RNNs and LSTMs.
          </p>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
           <h4 style={{ marginBottom: 16 }}>Figure: The Transformer Model Architecture</h4>
           <div style={{ display: 'flex', justifyContent: 'center' }}>
             <img 
               src="/images/nn-types/transformer.png" 
               alt="Transformer Model Architecture Diagram" 
               style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
             />
           </div>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Use Cases of Transformer Networks</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12 }}>
            In the ever-expanding landscape of artificial intelligence, transformers have emerged as a revolutionary force, driving transformative advancements across a multitude of domains.
          </p>
          <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Machine Translation:</strong> Transformers are highly effective in translating text from one language to another.</li>
            <li><strong>Text Summarization:</strong> They can generate concise summaries of long documents.</li>
            <li><strong>Question Answering:</strong> Transformers enrich models that can answer questions based on text passages.</li>
            <li><strong>Speech Recognition:</strong> They are used in processing sequential audio data for tasks like speech-to-text conversion.</li>
            <li><strong>Time Series Analysis:</strong> Transformers can be applied to time series forecasting by capturing dependencies across different time steps.</li>
            <li><strong>Bioinformatics:</strong> They are used for protein structure prediction and other sequence-based tasks in biology.</li>
          </ul>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>When to Use Transformers</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Transformers are particularly well-suited for natural language processing tasks where it is essential to capture the context and dependencies within text. They perform exceptionally well in tasks that demand a deep understanding of the subtleties and structural intricacies of language.
          </p>
        </div>

      </div>
    </div>
  )
}

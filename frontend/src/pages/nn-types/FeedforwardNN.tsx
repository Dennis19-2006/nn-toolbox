export default function FeedforwardNN() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Feedforward Neural Networks (FNN)</h2>
        <p>The foundational architecture of Deep Learning.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Introduction</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Feedforward Neural Networks (FNNs) are the simplest type of artificial neural network. They are also known as multi-layer perceptrons (MLPs).
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 12 }}>
            In FNNs, information moves in one direction—from the input layer through the hidden layers to the output layer. The network does not cycle or loop.
          </p>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
           <h4 style={{ marginBottom: 16 }}>Figure: A Feedforward Neural Network (FNN)</h4>
           <div style={{ display: 'flex', justifyContent: 'center' }}>
             <img 
               src="/images/nn-types/feedforward.png" 
               alt="Feedforward Neural Network Architecture" 
               style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
             />
           </div>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Use Cases of FNNs</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Classification and regression problems are popular use cases of FNNs.
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 12 }}>
            Feedforward neural networks (FNNs) are commonly utilized for straightforward classification tasks in which the connections between input features and the target variable are not overly complex. In a classification problem, the objective is to predict a class label based on given features, resulting in a discrete output from the network. FNNs are also employed in regression problems, where the aim is to predict a continuous output.
          </p>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>When to Use FNNs</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            FNNs are suitable for situations where the data is structured, and the relationships between features are relatively straightforward.
          </p>
        </div>

      </div>
    </div>
  )
}

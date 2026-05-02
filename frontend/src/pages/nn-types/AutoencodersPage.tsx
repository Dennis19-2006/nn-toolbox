export default function AutoencodersPage() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Autoencoders</h2>
        <p>Unsupervised learning via efficient data encoding and reconstruction.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Introduction</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Autoencoders are a type of neural network that falls under the unsupervised learning category. They are specifically designed to learn the most efficient ways to encode input data. Autoencoders have two main parts: an encoder, which compresses the input data into a lower-dimensional representation, and a decoder, which reconstructs the original input data from the compressed representation.
          </p>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
           <h4 style={{ marginBottom: 16 }}>Figure: Autoencoder Architecture</h4>
           <div style={{ display: 'flex', justifyContent: 'center' }}>
             <img 
               src="/images/nn-types/autoencoder.png" 
               alt="Autoencoder Architecture showing Mona Lisa" 
               style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
             />
           </div>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Use Cases of Autoencoders</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12 }}>
            Autoencoders have various practical applications across different domains. Below are some of the key use cases.
          </p>
          <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Dimensionality Reduction:</strong> Autoencoders can reduce the dimensionality of data, making it easier to visualize or process.</li>
            <li><strong>Anomaly Detection:</strong> By learning to reconstruct normal data, autoencoders can identify anomalies by their reconstruction errors.</li>
            <li><strong>Data Denoising:</strong> They can remove noise from data, such as images or signals.</li>
          </ul>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>When to Use Autoencoders</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Autoencoders are useful when compressing data, detecting anomalies, or denoising data. They are also effective for unsupervised learning tasks where labeled data is not available.
          </p>
        </div>

      </div>
    </div>
  )
}

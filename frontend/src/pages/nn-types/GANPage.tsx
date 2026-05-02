export default function GANPage() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Generative Adversarial Networks (GAN)</h2>
        <p>Two neural networks competing in a zero-sum game to generate data.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Introduction</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Generative Adversarial Networks (GANs) are a type of machine learning framework that consists of two neural networks: the generator and the discriminator. The generator is responsible for creating synthetic data, while the discriminator’s role is to differentiate between the real and generated data. These two networks are trained simultaneously in a competitive manner, with the generator aiming to generate data that is indistinguishable from real data, and the discriminator striving to become increasingly proficient at identifying the generated data. As a result, GANs are known for their ability to produce realistic synthetic data across various domains, including images, videos, and text.
          </p>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
           <h4 style={{ marginBottom: 16 }}>Figure: Generative Adversarial Network Architecture</h4>
           <div style={{ display: 'flex', justifyContent: 'center' }}>
             <img 
               src="/images/nn-types/gan.png" 
               alt="GAN Generator and Discriminator Architecture" 
               style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
             />
           </div>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Use Cases of GANs</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12 }}>
            GANs have found prominent use in various domains due to their ability to produce realistic data and creative outputs. Some of the key use cases of GANs are as follows.
          </p>
          <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Image Generation:</strong> GANs are famous for generating realistic images, such as creating high-resolution photos from low-resolution inputs.</li>
            <li><strong>Data Augmentation:</strong> They can generate synthetic data to augment training datasets.</li>
            <li><strong>Creative Applications:</strong> GANs are used in artistic applications like generating artwork or music.</li>
          </ul>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>When to Use GANs</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            GANs are particularly useful for creative tasks and data augmentation in cases where obtaining real data is challenging. They are a great choice when you need to generate new, realistic data samples.
          </p>
        </div>

      </div>
    </div>
  )
}

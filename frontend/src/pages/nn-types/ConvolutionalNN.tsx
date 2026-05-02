export default function ConvolutionalNN() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Convolutional Neural Networks (CNN)</h2>
        <p>Expertly designed for visual data and spatial hierarchies.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Introduction</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Convolutional Neural Networks, also known as CNNs, are a type of deep learning algorithm used to process and analyze visual data, such as images. These networks are built with specialized layers, including convolutional layers to detect features, pooling layers to reduce dimensionality, and fully connected layers to make sense of the detected features. CNNs are designed to extract intricate spatial hierarchies within the data, allowing them to recognize patterns and objects within images with remarkable accuracy.
          </p>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
           <h4 style={{ marginBottom: 16 }}>Figure: Typical CNN</h4>
           <div style={{ display: 'flex', justifyContent: 'center' }}>
             <img 
               src="https://lmsspada.kemdiktisaintek.go.id/pluginfile.php/724024/mod_page/content/1/info-cnn.gif" 
               alt="Convolutional Neural Network Animation" 
               style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
             />
           </div>
           <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
             Figure attribution: Aphex34, CC BY-SA 4.0, via Wikimedia Commons.
           </p>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>Use Cases of CNNs</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12 }}>
            When it comes to computer vision tasks, CNNs play a crucial role in various applications, such as image recognition, object detection, and video analysis, highlighting their versatility and wide-ranging capabilities within the field of computer vision.
          </p>
          <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Image Recognition:</strong> CNNs are the go-to architecture for image recognition and image classification tasks.</li>
            <li><strong>Object Detection:</strong> CNNs are utilized for identifying and locating objects within images in object detection tasks.</li>
            <li><strong>Video Analysis:</strong> CNNs can be adapted to analyze video data by processing frames either sequentially or in parallel.</li>
          </ul>
        </div>

        <div style={{ background: 'var(--bg-section)', borderRadius: 10, padding: '24px', border: '1px solid var(--border)' }}>
          <h3 style={{ color: '#c4b5fd', marginBottom: 12 }}>When to Use CNNs</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            CNNs should be used when dealing with image data or any spatially structured data. Their ability to capture spatial hierarchies makes them highly effective for visual tasks.
          </p>
        </div>

      </div>
    </div>
  )
}

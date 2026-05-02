import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import MotionWallpaper from './components/MotionWallpaper'
import DataUpload from './pages/DataUpload'
import SentimentAnalysis from './pages/SentimentAnalysis'
import CustomTrainer from './pages/CustomTrainer'
import GradientDiagnostics from './pages/GradientDiagnostics'
import EpochGraph from './pages/EpochGraph'
import Attendance from './pages/Attendance'
import HopfieldNetwork from './pages/HopfieldNetwork'
import TextPredictor from './pages/TextPredictor'
import FeedforwardNN from './pages/nn-types/FeedforwardNN'
import ConvolutionalNN from './pages/nn-types/ConvolutionalNN'
import RecurrentNN from './pages/nn-types/RecurrentNN'
import LSTMGRUPage from './pages/nn-types/LSTMGRUPage'
import TransformersPage from './pages/nn-types/TransformersPage'
import AutoencodersPage from './pages/nn-types/AutoencodersPage'
import GANPage from './pages/nn-types/GANPage'

const NAV = [
  { to: '/',           icon: '🏠', label: 'Home'          },
  { to: '/sentiment',  icon: '🧠', label: 'Sentiment / LSTM'},
  { to: '/trainer',    icon: '⚙️',  label: 'Custom Trainer' },
  { to: '/gradients',  icon: '📉', label: 'Gradients'      },
  { to: '/epochs',     icon: '📈', label: 'Epoch Graph'    },
  { to: '/attendance', icon: '📷', label: 'Attendance'     },
  { to: '/hopfield',   icon: '🔗', label: 'Hopfield Network'},
  { to: '/predictor',  icon: '✨', label: 'Text Predictor'   },
]

export default function App() {
  return (
    <BrowserRouter>
      <MotionWallpaper />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🔮</div>
            <h1 className="gradient-text">NN Toolbox</h1>
            <p>Neural Network Workbench</p>
          </div>
          <nav className="sidebar-nav">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Backend: <span style={{ color: 'var(--accent-cyan)' }}>localhost:8000</span><br />
              Frontend: <span style={{ color: 'var(--accent-purple)' }}>localhost:5173</span>
            </p>
          </div>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/"           element={<DataUpload />}        />
            <Route path="/sentiment"  element={<SentimentAnalysis />} />
            <Route path="/trainer"    element={<CustomTrainer />}     />
            <Route path="/gradients"  element={<GradientDiagnostics />} />
            <Route path="/epochs"     element={<EpochGraph />}        />
            <Route path="/attendance" element={<Attendance />}        />
            <Route path="/hopfield"   element={<HopfieldNetwork />}   />
            <Route path="/predictor"  element={<TextPredictor />}     />
            <Route path="/nn/feedforward" element={<FeedforwardNN />}    />
            <Route path="/nn/cnn"     element={<ConvolutionalNN />}   />
            <Route path="/nn/rnn"     element={<RecurrentNN />}       />
            <Route path="/nn/lstm-gru" element={<LSTMGRUPage />}     />
            <Route path="/nn/transformers" element={<TransformersPage />} />
            <Route path="/nn/autoencoders" element={<AutoencodersPage />} />
            <Route path="/nn/gan"     element={<GANPage />}           />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

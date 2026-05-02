import { useState, useEffect } from 'react'
import { registerFace, markAttendance, getAttendanceLog, getRegisteredPeople, releaseCamera, STREAM_URL, AttendanceRecord } from '../api/client'

export default function Attendance() {
  const [activeTab, setActiveTab] = useState<'scan' | 'register'>('scan')
  
  // Register state
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regMsg, setRegMsg] = useState('')

  // Scan state
  const [streamActive, setStreamActive] = useState(false)
  const [markLoading, setMarkLoading] = useState(false)
  const [markMsg, setMarkMsg] = useState('')
  const [log, setLog] = useState<AttendanceRecord[]>([])
  const [people, setPeople] = useState<string[]>([])

  useEffect(() => {
    fetchLog()
    fetchPeople()
    return () => { releaseCamera().catch(() => {}) }
  }, [])

  const fetchLog = async () => {
    try {
      const data = await getAttendanceLog()
      setLog(data.records || [])
    } catch (e) {}
  }

  const fetchPeople = async () => {
    try {
      const data = await getRegisteredPeople()
      setPeople(data.people || [])
    } catch (e) {}
  }

  const handleRegister = async () => {
    if (!file || !name) return
    setRegLoading(true)
    setRegMsg('')
    try {
      const res = await registerFace(file, name.trim().toLowerCase())
      setRegMsg(res.message)
      setFile(null)
      setName('')
      fetchPeople()
    } catch (err: any) {
      setRegMsg(err.message || 'Failed to register face')
    } finally {
      setRegLoading(false)
    }
  }

  const handleMark = async () => {
    setMarkLoading(true)
    setMarkMsg('')
    try {
      const res = await markAttendance()
      setMarkMsg(`Detected ${res.total_faces} face(s). Marked ${res.marked.length} recognized.`)
      fetchLog()
    } catch (err: any) {
      setMarkMsg(err.message)
    } finally {
      setMarkLoading(false)
    }
  }

  const toggleCamera = async () => {
    if (streamActive) {
      await releaseCamera()
      setStreamActive(false)
    } else {
      setStreamActive(true)
    }
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>OpenCV Attendance System</h2>
        <p>Real-time face detection and LBPH recognition using webcam streams.</p>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => setActiveTab('scan')}>
           Live Scanner
        </button>
        <button className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
          Register Faces
        </button>
      </div>

      {activeTab === 'register' && (
        <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <h3>Add New Person</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--sp-lg)' }}>
              Upload a clear photo of a face. The Haar cascade will detect the largest face, crop it, and use it to train the LBPH recognizer.
            </p>

            <div className="form-group">
              <label>Name</label>
              <input type="text" placeholder="e.g. alice" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Face Photo (JPG/PNG)</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>

            {regMsg && (
              <div className={`alert ${regMsg.includes('Failed') ? 'alert-error' : 'alert-ok'}`} style={{ marginBottom: 'var(--sp-md)' }}>
                {regMsg}
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleRegister} disabled={!name || !file || regLoading}>
              {regLoading ? <div className="spinner"/> : 'Register & Retrain Model'}
            </button>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 'var(--sp-md)' }}>Registered People</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-sm)' }}>
              {people.length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No faces registered yet.</span>
              ) : (
                people.map(p => (
                  <span key={p} className="badge badge-healthy" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    {p}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scan' && (
        <div className="card-grid" style={{ gridTemplateColumns: '3fr 2fr' }}>
          
          {/* Main camera view */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
              <h3>Camera Feed</h3>
              <button className={`btn ${streamActive ? 'btn-danger' : 'btn-primary'}`} onClick={toggleCamera}>
                {streamActive ? 'Stop Stream' : 'Start Camera'}
              </button>
            </div>

            <div style={{ flex: 1, minHeight: '400px', background: '#000', borderRadius: 'var(--r-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {streamActive ? (
                <img 
                  src={STREAM_URL} 
                  alt="Camera MJPEG Stream" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={() => setStreamActive(false)}
                />
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Camera is offline</div>
              )}
            </div>

            <div style={{ marginTop: 'var(--sp-lg)', textAlign: 'center' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', justifyContent: 'center' }}
                onClick={handleMark}
                disabled={!streamActive || markLoading}
              >
                {markLoading ? <div className="spinner"/> : 'Snapshot & Mark Attendance'}
              </button>
              {markMsg && <div style={{ marginTop: 'var(--sp-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{markMsg}</div>}
            </div>
          </div>

          {/* Log view */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
              <h3>Attendance Log</h3>
              <span className="badge badge-running">{log.length} Records</span>
            </div>
            
            <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr>
                    <th>Target Name</th>
                    <th>Timestamp</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {log.slice().reverse().map((r, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--accent-cyan)' }}>{r.name}</td>
                      <td>{r.timestamp}</td>
                      <td>{r.confidence}</td>
                    </tr>
                  ))}
                  {log.length === 0 && (
                     <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '32px' }}>No records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: 'var(--sp-md)' }}>
                <a href="/api/attendance/log" download="attendance.csv" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                  Download CSV Log
                </a>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

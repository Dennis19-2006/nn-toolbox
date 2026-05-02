// Typed API client — all fetch calls to FastAPI backend

const BASE = '/api'

export type EpochData = {
  epoch: number
  train_loss: number
  val_loss: number
  train_acc: number | null
  val_acc: number | null
}

export type GradientLayer = {
  norm: number
  status: 'healthy' | 'vanishing' | 'exploding'
  description: string
}

export type AttendanceRecord = {
  name: string
  timestamp: string
  confidence: string
}

// ── Data ──────────────────────────────────────────────────────────────────────

export async function uploadCSV(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload-csv`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getCleanedData() {
  const res = await fetch(`${BASE}/cleaned-data`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Training ──────────────────────────────────────────────────────────────────

export async function trainSentiment(params: {
  file: File
  text_col: string
  label_col: string
  arch: string
  epochs: number
  lr: number
  batch_size: number
  embed_dim: number
  hidden_dim: number
  num_layers: number
  dropout: number
}) {
  const form = new FormData()
  Object.entries(params).forEach(([k, v]) => form.append(k, v as string | Blob))
  const res = await fetch(`${BASE}/train/sentiment`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{ job_id: string; total_epochs: number; label_map: Record<string, number> }>
}

export async function trainTFSentiment(params: {
  file: File
  text_col: string
  label_col: string
  epochs: number
  lr: number
  batch_size: number
  embed_dim: number
  hidden_dim: number
  dropout: number
  max_vocab: number
  max_len: number
}) {
  const form = new FormData()
  Object.entries(params).forEach(([k, v]) => form.append(k, v as string | Blob))
  const res = await fetch(`${BASE}/train/tf_sentiment`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{ job_id: string; total_epochs: number; label_map: Record<string, number> }>
}

export async function trainCustom(params: {
  file: File
  target_col: string
  arch: string
  hidden_sizes: string
  activation: string
  dropout: number
  optimizer_name: string
  lr: number
  batch_size: number
  epochs: number
  val_size: number
  task_type: string
}) {
  const form = new FormData()
  Object.entries(params).forEach(([k, v]) => form.append(k, v as string | Blob))
  const res = await fetch(`${BASE}/train/custom`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{ job_id: string; total_epochs: number }>
}

export function streamEpochs(
  jobId: string,
  onEpoch: (e: EpochData) => void,
  onDone: (status: string) => void
): EventSource {
  const es = new EventSource(`${BASE}/train/stream/${jobId}`)
  es.addEventListener('epoch', (ev) => {
    try {
      const data = JSON.parse(ev.data.replace(/'/g, '"'))
      onEpoch(data as EpochData)
    } catch (_) {}
  })
  es.addEventListener('done', (ev) => {
    try {
      const data = JSON.parse(ev.data)
      onDone(data.status)
    } catch (_) {
      onDone('done')
    }
    es.close()
  })
  es.onerror = () => { onDone('error'); es.close() }
  return es
}

export async function getGradients(jobId: string) {
  const res = await fetch(`${BASE}/gradients/${jobId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{
    job_id: string
    summary: Record<string, number>
    layers: Record<string, GradientLayer>
    message?: string
    status?: string
  }>
}

// ── Attendance ────────────────────────────────────────────────────────────────

export const STREAM_URL = `${BASE}/attendance/stream`


export async function registerFace(file: File, name: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('name', name)
  const res = await fetch(`${BASE}/attendance/register`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function markAttendance() {
  const res = await fetch(`${BASE}/attendance/mark`, { method: 'POST' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getAttendanceLog(): Promise<{ records: AttendanceRecord[]; count: number }> {
  const res = await fetch(`${BASE}/attendance/log`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getRegisteredPeople(): Promise<{ people: string[] }> {
  const res = await fetch(`${BASE}/attendance/registered`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function releaseCamera() {
  await fetch(`${BASE}/attendance/release`, { method: 'POST' })
}

// ── Hopfield Network ──────────────────────────────────────────────────────────

export async function trainHopfield(size: number, patterns: number[][]) {
  const res = await fetch(`${BASE}/hopfield/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ size, patterns })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{ session_id: string; message: string }>
}

export async function predictHopfield(session_id: string, pattern: number[], async_update: boolean = true) {
  const res = await fetch(`${BASE}/hopfield/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, pattern, async_update })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{ history: number[][]; converged: boolean }>
}

// ── Text Predictor ────────────────────────────────────────────────────────────

export async function predictNextWord(text: string, max_new_tokens: number = 5) {
  const res = await fetch(`${BASE}/predictor/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, max_new_tokens })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{ original: string; generated_text: string; new_text: string }>
}


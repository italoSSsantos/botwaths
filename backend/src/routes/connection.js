import { Router } from 'express'
import { state, initWhatsApp, disconnect } from '../whatsapp.js'

const router = Router()

// SSE — stream de eventos em tempo real (status + QR)
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Envia estado atual imediatamente
  res.write(`event: status\ndata: ${JSON.stringify({ status: state.status })}\n\n`)
  if (state.qrDataUrl) {
    res.write(`event: qr\ndata: ${JSON.stringify({ qr: state.qrDataUrl })}\n\n`)
  }

  state.subscribers.add(res)

  req.on('close', () => {
    state.subscribers.delete(res)
  })
})

// Status atual
router.get('/status', (_req, res) => {
  res.json({ status: state.status })
})

// Conectar (inicia o cliente)
router.post('/connect', (_req, res) => {
  initWhatsApp()
  res.json({ ok: true })
})

// Desconectar
router.post('/disconnect', async (_req, res) => {
  await disconnect()
  res.json({ ok: true })
})

export default router

import { Router } from 'express'
import { state, broadcast } from '../whatsapp.js'
import { logEvent } from '../logger.js'
import pkg from 'whatsapp-web.js'
const { MessageMedia } = pkg

const router = Router()
const running = new Map()

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function sendMessage(chatId, { text, mediaBase64, mediaMime, mediaName }) {
  const client = state.client
  if (mediaBase64 && mediaMime) {
    const media = new MessageMedia(mediaMime, mediaBase64, mediaName ?? 'file')
    await client.sendMessage(chatId, media, { caption: text ?? '' })
  } else {
    await client.sendMessage(chatId, text)
  }
}

// Envio simples
router.post('/send', async (req, res) => {
  if (!state.client || state.status !== 'ready')
    return res.status(503).json({ error: 'WhatsApp não conectado' })

  const { chatId, text, mediaBase64, mediaMime, mediaName } = req.body
  if (!chatId) return res.status(400).json({ error: 'chatId obrigatório' })

  try {
    await sendMessage(chatId, { text, mediaBase64, mediaMime, mediaName })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Disparo em massa
router.post('/campaign', async (req, res) => {
  if (!state.client || state.status !== 'ready')
    return res.status(503).json({ error: 'WhatsApp não conectado' })

  const {
    id,
    recipients,        // [{ id, name }]
    text,
    mediaBase64,
    mediaMime,
    mediaName,
    intervalSeconds = 10,
    pauseEvery = 10,
    pauseDurationSeconds = 60,
  } = req.body

  if (!id || !recipients?.length)
    return res.status(400).json({ error: 'id e recipients obrigatórios' })

  if (running.has(id))
    return res.status(409).json({ error: 'Campanha já está rodando' })

  let cancelled = false
  let paused = false
  let pauseResolve = null

  running.set(id, {
    cancel: () => { cancelled = true; pauseResolve?.() },
    pause: () => { paused = true },
    resume: () => { paused = false; pauseResolve?.() },
  })

  res.json({ ok: true, total: recipients.length })
  logEvent('campaign_started', { total: recipients.length, hasMedia: !!mediaBase64 })

  ;(async () => {
    let success = 0
    let fail = 0

    for (let i = 0; i < recipients.length; i++) {
      if (cancelled) break

      if (paused) {
        await new Promise(r => { pauseResolve = r })
        pauseResolve = null
        if (cancelled) break
      }

      try {
        await sendMessage(recipients[i].id, { text, mediaBase64, mediaMime, mediaName })
        success++
      } catch {
        fail++
      }

      broadcast('campaign_progress', {
        campaignId: id,
        index: i + 1,
        total: recipients.length,
        success,
        fail,
        status: 'running',
        currentName: recipients[i].name,
      })

      if (i < recipients.length - 1) {
        if ((i + 1) % pauseEvery === 0) {
          await sleep(pauseDurationSeconds * 1000)
        } else {
          await sleep(intervalSeconds * 1000)
        }
      }
    }

    broadcast('campaign_progress', {
      campaignId: id,
      index: recipients.length,
      total: recipients.length,
      success,
      fail,
      status: cancelled ? 'cancelled' : 'completed',
    })

    logEvent(cancelled ? 'campaign_cancelled' : 'campaign_completed', { total: recipients.length, success, fail })
    running.delete(id)
  })()
})

router.post('/campaign/:id/pause', (req, res) => {
  const ctrl = running.get(req.params.id)
  if (!ctrl) return res.status(404).json({ error: 'Não encontrada' })
  ctrl.pause()
  res.json({ ok: true })
})

router.post('/campaign/:id/resume', (req, res) => {
  const ctrl = running.get(req.params.id)
  if (!ctrl) return res.status(404).json({ error: 'Não encontrada' })
  ctrl.resume()
  res.json({ ok: true })
})

router.post('/campaign/:id/cancel', (req, res) => {
  const ctrl = running.get(req.params.id)
  if (!ctrl) return res.status(404).json({ error: 'Não encontrada' })
  ctrl.cancel()
  res.json({ ok: true })
})

export default router

import { Router } from 'express'
import { state } from '../whatsapp.js'

const router = Router()

router.get('/contacts', async (_req, res) => {
  if (!state.client || state.status !== 'ready') {
    return res.status(503).json({ error: 'WhatsApp não conectado' })
  }
  try {
    const contacts = await state.client.getContacts()
    const result = contacts
      .filter(c => c.id._serialized.endsWith('@c.us') && (c.isMyContact || c.name))
      .map(c => ({
        id: c.id._serialized,
        name: c.name || c.pushname || c.number,
        number: c.number,
        isMyContact: c.isMyContact,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/groups', async (_req, res) => {
  if (!state.client || state.status !== 'ready') {
    return res.status(503).json({ error: 'WhatsApp não conectado' })
  }
  try {
    const chats = await state.client.getChats()
    const groups = chats
      .filter(c => c.isGroup)
      .map(c => ({
        id: c.id._serialized,
        name: c.name,
        participants: c.participants?.length ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
    res.json(groups)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

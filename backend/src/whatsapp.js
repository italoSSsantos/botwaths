import pkg from 'whatsapp-web.js'
const { Client, LocalAuth } = pkg
import qrcode from 'qrcode'

// Estado global da conexão
export const state = {
  status: 'disconnected', // disconnected | qr | connecting | ready
  qrDataUrl: null,
  client: null,
  subscribers: new Set(),
}

export function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of state.subscribers) {
    try { res.write(payload) } catch (_) {}
  }
}

export function initWhatsApp() {
  if (state.client) return

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  })

  state.client = client

  client.on('qr', async (qr) => {
    state.status = 'qr'
    state.qrDataUrl = await qrcode.toDataURL(qr)
    broadcast('status', { status: 'qr' })
    broadcast('qr', { qr: state.qrDataUrl })
    console.log('[WA] QR Code gerado')
  })

  client.on('authenticated', () => {
    state.status = 'connecting'
    state.qrDataUrl = null
    broadcast('status', { status: 'connecting' })
    console.log('[WA] Autenticado')
  })

  client.on('loading_screen', (percent) => {
    state.status = 'connecting'
    broadcast('status', { status: 'connecting', percent })
    console.log(`[WA] Carregando... ${percent}%`)
  })

  client.on('ready', () => {
    state.status = 'ready'
    state.qrDataUrl = null
    broadcast('status', { status: 'ready' })
    console.log('[WA] Pronto!')
  })

  client.on('auth_failure', (msg) => {
    state.status = 'disconnected'
    state.client = null
    broadcast('status', { status: 'disconnected' })
    console.log('[WA] Falha na autenticação:', msg)
  })

  client.on('disconnected', (reason) => {
    state.status = 'disconnected'
    state.client = null
    broadcast('status', { status: 'disconnected' })
    console.log('[WA] Desconectado:', reason)
  })

  client.initialize().catch(err => {
    console.error('[WA] Erro ao inicializar:', err.message)
    state.status = 'disconnected'
    state.client = null
  })
  console.log('[WA] Inicializando...')
}

export async function sendText(phone, text) {
  if (!state.client || state.status !== 'ready') {
    throw new Error('WhatsApp não está conectado')
  }
  const chatId = phone.replace(/\D/g, '') + '@c.us'
  await state.client.sendMessage(chatId, text)
}

export async function disconnect() {
  if (state.client) {
    await state.client.destroy()
    state.client = null
    state.status = 'disconnected'
    state.qrDataUrl = null
    broadcast('status', { status: 'disconnected' })
  }
}

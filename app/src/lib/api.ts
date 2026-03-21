const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const api = {
  async get(path: string) {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  async post(path: string, body?: unknown) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },

  events(onMessage: (event: string, data: unknown) => void): () => void {
    const es = new EventSource(`${BASE}/api/events`)
    const evts = ['status', 'qr', 'campaign_progress']
    const handlers: Record<string, (e: MessageEvent) => void> = {}
    for (const ev of evts) {
      const h = (e: MessageEvent) => onMessage(ev, JSON.parse(e.data))
      es.addEventListener(ev, h)
      handlers[ev] = h
    }
    return () => {
      for (const [ev, h] of Object.entries(handlers)) es.removeEventListener(ev, h)
      es.close()
    }
  },
}

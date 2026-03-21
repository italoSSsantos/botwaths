import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'

export type ConnectionStatus = 'disconnected' | 'qr' | 'connecting' | 'ready'

interface ConnectionState {
  status: ConnectionStatus
  qr: string | null
}

export function useConnection() {
  const [conn, setConn] = useState<ConnectionState>({ status: 'disconnected', qr: null })
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    function connect() {
      if (esRef.current) {
        esRef.current.close()
      }

      const es = new EventSource('http://localhost:3001/api/events')
      esRef.current = es

      es.addEventListener('status', (e) => {
        const d = JSON.parse((e as MessageEvent).data)
        setConn(prev => ({
          status: d.status as ConnectionStatus,
          qr: d.status !== 'qr' ? null : prev.qr,
        }))
      })

      es.addEventListener('qr', (e) => {
        const d = JSON.parse((e as MessageEvent).data)
        setConn({ status: 'qr', qr: d.qr })
      })

      es.onerror = () => {
        // Reconnect after 3s on error
        es.close()
        esRef.current = null
        setTimeout(connect, 3000)
      }
    }

    connect()

    // Polling de fallback a cada 5s para garantir sincronismo
    const poll = setInterval(async () => {
      try {
        const data = await api.get('/api/status')
        setConn(prev => {
          if (data.status !== prev.status && data.status !== 'qr') {
            return { status: data.status, qr: null }
          }
          return prev
        })
      } catch (_) {}
    }, 5000)

    return () => {
      esRef.current?.close()
      esRef.current = null
      clearInterval(poll)
    }
  }, [])

  return conn
}

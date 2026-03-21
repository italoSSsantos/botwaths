import express from 'express'
import cors from 'cors'
import { initWhatsApp } from './whatsapp.js'
import connectionRoutes from './routes/connection.js'
import messagesRoutes from './routes/messages.js'
import contactsRoutes from './routes/contacts.js'

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173']

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  }
}))
app.use(express.json({ limit: '50mb' }))

app.use('/api', connectionRoutes)
app.use('/api', messagesRoutes)
app.use('/api', contactsRoutes)

app.listen(PORT, () => {
  console.log(`[Server] Rodando em http://localhost:${PORT}`)
  initWhatsApp()
})

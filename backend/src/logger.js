import os from 'os'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = 'https://xcqcmaobjhbsoirgdoub.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcWNtYW9iamhic29pcmdkb3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTIyMTEsImV4cCI6MjA4NjIyODIxMX0.CAfiSJpotv-DDZvoPC56eEQMEe4TUszlekTtrDZk89A'

function getDeviceId() {
  const idFile = path.join(os.tmpdir(), '.app_disparos_id')
  try {
    if (fs.existsSync(idFile)) return fs.readFileSync(idFile, 'utf8').trim()
    const id = crypto.randomUUID()
    fs.writeFileSync(idFile, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

const deviceId = getDeviceId()
const deviceName = os.hostname()

export async function logEvent(event, metadata = {}) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/app_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ event, device_id: deviceId, device_name: deviceName, metadata }),
    })
  } catch {
    // silently fail — log não pode travar o app
  }
}

import { existsSync, readFileSync } from 'fs'
import { spawn } from 'child_process'

// Se tiver o caminho do Chrome salvo, passa como env var
if (existsSync('.chrome-path')) {
  const chromePath = readFileSync('.chrome-path', 'utf-8').trim()
  if (chromePath) {
    process.env.PUPPETEER_EXECUTABLE_PATH = chromePath
    console.log('[Start] Usando Chrome em:', chromePath)
  }
}

// Inicia o servidor
const child = spawn('node', ['src/index.js'], {
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code) => process.exit(code))

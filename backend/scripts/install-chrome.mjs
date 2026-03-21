import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

try {
  // Instala o Chrome via puppeteer
  execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' })

  // Descobre o caminho do executável
  const puppeteer = require('puppeteer')
  const execPath = puppeteer.executablePath()
  console.log('[Chrome] Instalado em:', execPath)

  // Salva em arquivo para uso no start
  writeFileSync('.chrome-path', execPath)
} catch (err) {
  console.warn('[Chrome] Aviso ao instalar:', err.message)
}

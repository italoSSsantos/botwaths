const { app, BrowserWindow } = require('electron')
const path = require('path')

const isDev = !app.isPackaged
let mainWindow

async function startBackend() {
  process.env.PORT = '3001'
  process.env.WA_AUTH_PATH = path.join(app.getPath('userData'), 'wwebjs_auth')

  const backendEntry = isDev
    ? path.resolve(__dirname, '../backend/src/index.js')
    : path.join(app.getAppPath(), 'backend/src/index.js')

  await import(`file://${backendEntry.replace(/\\/g, '/')}`)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../universal.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'app/dist/index.html'))
  }

}

app.whenReady().then(async () => {
  await startBackend()
  // Aguarda o Express subir antes de abrir a janela
  setTimeout(createWindow, 1500)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

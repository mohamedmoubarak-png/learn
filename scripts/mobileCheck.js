import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const port = 9337
const profile = mkdtempSync(join(tmpdir(), 'edge-mobile-check-'))
const screenshotPath = join(tmpdir(), 'gamified-coding-platform-mobile-cdp.png')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const edge = spawn(edgePath, [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  'about:blank',
])

const waitForJson = async () => {
  for (let index = 0; index < 40; index += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (response.ok) return
    } catch {
      await sleep(100)
    }
  }
  throw new Error('Edge remote debugging did not start')
}

const createTarget = async () => {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })
  if (!response.ok) throw new Error('Could not create target')
  return response.json()
}

const connect = (url) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    const callbacks = new Map()
    let id = 0
    let loaded = false

    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const messageId = id + 1
        id = messageId
        callbacks.set(messageId, { resolve: res, reject: rej })
        ws.send(JSON.stringify({ id: messageId, method, params }))
      })

    ws.onopen = () => resolve({ ws, send, waitForLoad: () => waitForLoad() })
    ws.onerror = reject
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.method === 'Page.loadEventFired') loaded = true
      if (message.id && callbacks.has(message.id)) {
        const callback = callbacks.get(message.id)
        callbacks.delete(message.id)
        if (message.error) callback.reject(new Error(message.error.message))
        else callback.resolve(message.result)
      }
    }

    const waitForLoad = async () => {
      for (let index = 0; index < 50; index += 1) {
        if (loaded) return
        await sleep(100)
      }
    }
  })

try {
  await waitForJson()
  const target = await createTarget()
  const { ws, send, waitForLoad } = await connect(target.webSocketDebuggerUrl)
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true,
  })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/?mobile-check=1' })
  await waitForLoad()
  await sleep(700)
  const metrics = await send('Runtime.evaluate', {
    expression:
      '({ innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, text: document.body.innerText.slice(0, 80) })',
    returnByValue: true,
  })
  const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  })
  writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  ws.close()
  console.log(JSON.stringify({ ...metrics.result.value, screenshotPath }, null, 2))
} finally {
  edge.kill()
}

// Starts the Vite dev server AND the Cloudflare Worker API together.
// The SPA talks to the API at http://localhost:8787/api, so both processes
// must be running. Running `npm run dev` now launches both and cleans both
// up on exit (kills the whole process tree, important on Windows).
import { spawn } from 'node:child_process'

const isWin = process.platform === 'win32'
const npmCmd = isWin ? 'npm.cmd' : 'npm'

const commands = [
  { name: 'vite (frontend)', args: ['run', 'dev:client'] },
  { name: 'api (wrangler dev)', args: ['run', 'cf:dev'] },
]

const procs = commands.map(({ name, args }) => {
  console.log(`[dev] starting ${name}...`)
  const child = isWin
    ? spawn(npmCmd, args, { stdio: 'inherit', shell: true })
    : spawn(npmCmd, args, { stdio: 'inherit', detached: true })
  child.on('exit', (code, signal) => {
    console.log(`[dev] ${name} exited (code ${code}, signal ${signal})`)
    shutdown()
  })
  return child
})

let shuttingDown = false
function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  console.log('[dev] shutting down...')
  for (const child of procs) {
    if (!child || child.exitCode !== null) continue
    if (isWin) {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'])
    } else {
      try { process.kill(-child.pid, 'SIGTERM') } catch { try { child.kill() } catch { /* already gone */ } }
    }
  }
  setTimeout(() => process.exit(0), 1000)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

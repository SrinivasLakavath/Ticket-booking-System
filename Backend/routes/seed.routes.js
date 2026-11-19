const express = require('express')
const path = require('path')

const router = express.Router()

/**
 * One-time / admin demo seed for empty Atlas DBs.
 * POST /api/seed-demo
 * Header: x-seed-secret: <SEED_SECRET>
 */
router.post('/seed-demo', async (req, res) => {
  const expected = process.env.SEED_SECRET
  const provided = req.header('x-seed-secret') || req.body?.secret

  if (!expected) {
    return res.status(503).json({
      success: false,
      message: 'SEED_SECRET is not configured on the server',
    })
  }

  if (!provided || provided !== expected) {
    return res.status(403).json({
      success: false,
      message: 'Invalid seed secret',
    })
  }

  try {
    // Reuse the existing seed script logic in-process
    delete require.cache[require.resolve('../seeds/seed-all.js')]
    // seed-all.js runs itself when executed via node; export a function instead by spawning
    const { spawn } = require('child_process')
    const script = path.join(__dirname, '..', 'seeds', 'seed-all.js')

    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [script], {
        cwd: path.join(__dirname, '..'),
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''
      child.stdout.on('data', (d) => {
        stdout += d.toString()
      })
      child.stderr.on('data', (d) => {
        stderr += d.toString()
      })
      child.on('error', reject)
      child.on('close', (code) => {
        if (code === 0) resolve({ stdout, stderr })
        else reject(new Error(stderr || stdout || `seed exited ${code}`))
      })
    })

    return res.json({
      success: true,
      message: 'Demo data seeded successfully',
    })
  } catch (err) {
    console.error('Seed failed', err)
    return res.status(500).json({
      success: false,
      message: err.message || 'Seed failed',
    })
  }
})

module.exports = router

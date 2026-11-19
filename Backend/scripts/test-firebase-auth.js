const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

// Load .env
const envPath = path.join(__dirname, '..', '.env')
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
  const i = line.indexOf('=')
  let k = line.slice(0, i).trim()
  let v = line.slice(i + 1).trim()
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1)
  }
  if (!process.env[k]) process.env[k] = v
}

const AuthService = require('../services/auth.service')
const User = require('../models/user.model')

async function main() {
  const fixturePath = path.join(
    process.env.TEMP || '/tmp',
    'cineseat-firebase-test.json'
  )
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))

  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI_ATLAS ||
    process.env.MONGO_URI

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 20000 })
  console.log('MONGO_OK', mongoose.connection.name)

  const token = await AuthService.signInWithFirebaseIdToken({
    idToken: fixture.idToken,
    firstname: 'CineSeat',
    lastname: 'Tester',
  })
  console.log('JWT_OK', Boolean(token), 'len=' + String(token).length)

  const payload = AuthService.decodeUserToken(token)
  console.log('JWT_PAYLOAD', payload)

  const user = await User.findById(payload._id).lean()
  console.log('USER_OK', {
    email: user.email,
    firebaseUid: user.firebaseUid,
    authProvider: user.authProvider,
    firstname: user.firstname,
  })

  // cleanup test user
  await User.deleteOne({ _id: user._id })
  console.log('CLEANUP_OK deleted test mongo user')

  await mongoose.connection.close()
}

main().catch((err) => {
  console.error('FIREBASE_BRIDGE_FAIL', err.message)
  process.exit(1)
})

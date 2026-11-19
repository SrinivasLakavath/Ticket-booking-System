const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

const envPath = path.join(__dirname, '..', '.env')
const raw = fs.readFileSync(envPath, 'utf8')
const env = {}

for (const line of raw.split(/\r?\n/)) {
  if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
  const i = line.indexOf('=')
  let key = line.slice(0, i).trim()
  let value = line.slice(i + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  env[key] = value
}

const uri = env.MONGODB_URI || env.MONGO_URI_ATLAS || env.MONGO_URI

console.log('HAS_MONGODB_URI', Boolean(env.MONGODB_URI))
console.log('HAS_MONGO_URI_ATLAS', Boolean(env.MONGO_URI_ATLAS))
console.log('URI_MATCHES_YOURS', uri === 'mongodb+srv://SrinivasLakavath:Password%40123@cluster0.ncuxl.mongodb.net/TICKET-BOOKING-SYSTEM?retryWrites=true&w=majority&appName=Cluster0')
console.log('URI_PREFIX', uri.slice(0, 52) + '...')
console.log('DB_NAME', (uri.match(/\.net\/([^?]+)/) || [])[1])

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 20000 })
  .then(async () => {
    console.log('ATLAS_OK')
    console.log('db=', mongoose.connection.name)
    console.log('host=', mongoose.connection.host)
    const cols = await mongoose.connection.db.listCollections().toArray()
    console.log(
      'collections=',
      cols.length,
      cols
        .slice(0, 15)
        .map((c) => c.name)
        .join(', ') || '(empty)'
    )
    await mongoose.connection.close()
    process.exit(0)
  })
  .catch((err) => {
    console.error('ATLAS_FAIL')
    console.error(err.message)
    process.exit(1)
  })

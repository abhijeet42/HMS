const fs = require('fs')
const path = require('path')

// Manually parse .env.local
let supabaseUrl = ''
let serviceKey = ''

try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const parts = trimmed.split('=')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const value = parts.slice(1).join('=').trim()
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = value
    }
  })
} catch (err) {
  console.error('Error reading .env.local:', err.message)
}

if (!supabaseUrl || !serviceKey) {
  console.error('Error: Credentials missing in .env.local')
  process.exit(1)
}

const url = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl

async function test(tableName) {
  try {
    const res = await fetch(`${url}/rest/v1/${tableName}?limit=1`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Accept': 'application/json'
      }
    })
    if (!res.ok) {
      const txt = await res.text()
      console.error(`Error fetching ${tableName}:`, res.status, txt)
    } else {
      const data = await res.json()
      console.log(`${tableName} columns:`, Object.keys(data[0] || {}))
    }
  } catch (err) {
    console.error(`Fetch exception for ${tableName}:`, err.message)
  }
}

async function run() {
  await test('hostel_settings')
  await test('monthly_bills')
}

run()

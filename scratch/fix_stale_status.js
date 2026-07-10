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

async function run() {
  try {
    const res = await fetch(`${url}/rest/v1/monthly_bills?select=*`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Accept': 'application/json'
      }
    })
    if (!res.ok) {
      const txt = await res.text()
      console.error('Error fetching bills:', res.status, txt)
      return
    }

    const bills = await res.json()
    console.log(`Fetched ${bills.length} bills. Checking for status sync...`)

    for (const b of bills) {
      const total = Number(b.total_amount || 0)
      const paid = Number(b.amount_paid || 0)
      let expectedStatus = 'pending'
      if (paid >= total - 0.01) {
        expectedStatus = 'paid'
      } else if (paid > 0) {
        expectedStatus = 'partial'
      }

      if (b.status !== expectedStatus) {
        console.log(`Fixing Bill ID ${b.id}: Status is '${b.status}', expected '${expectedStatus}' (Total: ${total}, Paid: ${paid})`)
        const updateRes = await fetch(`${url}/rest/v1/monthly_bills?id=eq.${b.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            status: expectedStatus,
            ...(expectedStatus === 'paid' && !b.paid_date ? { paid_date: new Date().toISOString().split('T')[0] } : {})
          })
        })
        if (!updateRes.ok) {
          console.error(`Failed to update bill ${b.id}:`, await updateRes.text())
        } else {
          console.log(`Successfully updated bill ${b.id}`)
        }
      }
    }
    console.log('Sync complete!')
  } catch (err) {
    console.error('Exception during run:', err.message)
  }
}

run()

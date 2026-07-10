// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/admin/settings-client'
import { headers } from 'next/headers'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  // 1. Get current logged-in admin user
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Fetch hostel settings
  const { data: hostelSettings, error: hErr } = await supabase
    .from('hostel_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (hErr) {
    console.error('Error fetching hostel settings:', hErr)
  }

  // 3. Fetch admin profile (contains full_name, phone, avatar_url, notification_settings)
  let adminProfile = null
  if (user) {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (pErr) {
      console.error('Error fetching admin profile:', pErr)
    } else {
      adminProfile = profile
    }
  }

  // 4. Read headers for device/user-agent info
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'Unknown'
  
  let deviceName = 'Web Browser'
  if (userAgent.includes('Windows')) deviceName = 'Windows PC'
  else if (userAgent.includes('Macintosh')) deviceName = 'Mac'
  else if (userAgent.includes('iPhone')) deviceName = 'iPhone'
  else if (userAgent.includes('iPad')) deviceName = 'iPad'
  else if (userAgent.includes('Android')) deviceName = 'Android Device'
  else if (userAgent.includes('Linux')) deviceName = 'Linux PC'

  const lastLoginFormatted = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : 'N/A'

  return (
    <SettingsClient
      hostelSettings={hostelSettings || {}}
      adminProfile={adminProfile || {}}
      adminUser={user || {}}
      deviceInfo={{
        device: deviceName,
        userAgent: userAgent,
        lastLogin: lastLoginFormatted
      }}
    />
  )
}

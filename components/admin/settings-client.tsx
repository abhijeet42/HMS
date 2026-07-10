// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  Building,
  User,
  PaintBucket,
  Bell,
  ShieldCheck,
  Lock,
  LogOut,
  Moon,
  Sun,
  Laptop
} from 'lucide-react'

interface SettingsClientProps {
  hostelSettings: any
  adminProfile: any
  adminUser: any
  deviceInfo?: {
    device: string
    userAgent: string
    lastLogin: string
  }
}

export default function SettingsClient({
  hostelSettings,
  adminProfile,
  adminUser,
  deviceInfo
}: SettingsClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'hostel' | 'profile' | 'appearance' | 'notifications' | 'security'>('hostel')
  
  // Loading & feedback states
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // 1. Hostel Settings States
  const [hostelForm, setHostelForm] = useState({
    hostel_name: hostelSettings.hostel_name || 'GL Hostel',
    logo_url: hostelSettings.logo_url || '',
    address: hostelSettings.address || '',
    contact_number: hostelSettings.contact_number || '',
    email: hostelSettings.email || '',
    upi_id: hostelSettings.upi_id || ''
  })

  // 2. Admin Profile States
  const [profileForm, setProfileForm] = useState({
    full_name: adminProfile.full_name || '',
    phone: adminProfile.phone || '',
    avatar_url: adminProfile.avatar_url || ''
  })

  // 3. Notification Settings States
  const defaultNotifications = { email: true, rent_reminder: true, complaints: true }
  const [notifications, setNotifications] = useState(() => {
    try {
      if (adminProfile.notification_settings) {
        return {
          ...defaultNotifications,
          ...(typeof adminProfile.notification_settings === 'string'
            ? JSON.parse(adminProfile.notification_settings)
            : adminProfile.notification_settings)
        }
      }
    } catch (e) {
      console.error('Error parsing notification settings', e)
    }
    return defaultNotifications
  })

  // 4. Security States (Change Password)
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  })

  // 5. Appearance States (Dark Mode)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'light'
    setTheme(savedTheme)
  }, [])

  function applyTheme(newTheme: 'light' | 'dark' | 'system') {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }
  }

  // Show status feedbacks
  function showFeedback(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => {
      setMessage({ type: '', text: '' })
    }, 5000)
  }

  // Save Hostel Settings
  async function handleSaveHostel(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let error
      if (hostelSettings.id) {
        const { error: err } = await supabase
          .from('hostel_settings')
          .update(hostelForm)
          .eq('id', hostelSettings.id)
        error = err
      } else {
        const { error: err } = await supabase
          .from('hostel_settings')
          .insert(hostelForm)
        error = err
      }

      if (error) throw error
      showFeedback('success', 'Hostel settings updated successfully.')
      router.refresh()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update hostel settings.')
    } finally {
      setSaving(false)
    }
  }

  // Save Admin Profile
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileForm)
        .eq('id', adminUser.id)

      if (error) throw error
      showFeedback('success', 'Profile information updated successfully.')
      router.refresh()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  // Save Notification Settings
  async function handleSaveNotifications() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_settings: notifications })
        .eq('id', adminUser.id)

      if (error) throw error
      showFeedback('success', 'Notification settings updated successfully.')
      router.refresh()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update notifications.')
    } finally {
      setSaving(false)
    }
  }

  // Save Password
  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwordForm.password !== passwordForm.confirmPassword) {
      showFeedback('error', 'Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.password
      })

      if (error) throw error
      showFeedback('success', 'Password updated successfully.')
      setPasswordForm({ password: '', confirmPassword: '' })
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  // Sign out of all devices
  async function handleLogoutAll() {
    if (!confirm('Are you sure you want to sign out from all devices?')) return
    setSaving(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
      router.push('/login')
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to sign out globally.')
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage hostel preferences, notifications, security, and appearance</p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        
        {/* Navigation Tabs - horizontal scroll on mobile, vertical sidebar on desktop */}
        <div className="lg:col-span-1">
          {/* Mobile: horizontal scrollable tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 lg:hidden scrollbar-none">
            {[
              { id: 'hostel', label: 'Hostel', icon: Building },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'appearance', label: 'Theme', icon: PaintBucket },
              { id: 'notifications', label: 'Alerts', icon: Bell },
              { id: 'security', label: 'Security', icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any)
                    setMessage({ type: '', text: '' })
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
          {/* Desktop: vertical sidebar tabs */}
          <div className="hidden lg:flex flex-col space-y-1">
            {[
              { id: 'hostel', label: 'Hostel Settings', icon: Building },
              { id: 'profile', label: 'Admin Profile', icon: User },
              { id: 'appearance', label: 'Appearance', icon: PaintBucket },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'security', label: 'Security', icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any)
                    setMessage({ type: '', text: '' })
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Hostel Settings Tab */}
          {activeTab === 'hostel' && (
            <Card className="p-6 border-gray-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Hostel Profile</h2>
                <p className="text-xs text-gray-500 mt-0.5">This details will be printed on monthly billing records and notices.</p>
              </div>

              <form onSubmit={handleSaveHostel} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Hostel Name *"
                    value={hostelForm.hostel_name}
                    onChange={(e) => setHostelForm(prev => ({ ...prev, hostel_name: e.target.value }))}
                    required
                  />
                  <Input
                    label="Hostel Logo URL"
                    value={hostelForm.logo_url}
                    onChange={(e) => setHostelForm(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                  <Input
                    label="Contact Email"
                    type="email"
                    value={hostelForm.email}
                    onChange={(e) => setHostelForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    label="Contact Phone"
                    value={hostelForm.contact_number}
                    onChange={(e) => setHostelForm(prev => ({ ...prev, contact_number: e.target.value }))}
                  />
                  <Input
                    label="UPI ID (for payments)"
                    value={hostelForm.upi_id}
                    onChange={(e) => setHostelForm(prev => ({ ...prev, upi_id: e.target.value }))}
                    placeholder="e.g. hostel@upi"
                  />
                </div>
                <Textarea
                  label="Address"
                  value={hostelForm.address}
                  onChange={(e) => setHostelForm(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                />
                
                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" loading={saving} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Hostel Settings
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Admin Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="p-6 border-gray-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Profile Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage your personal information and login metadata.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                  <Input
                    label="Email Address (Login)"
                    value={adminUser.email || ''}
                    disabled
                  />
                  <Input
                    label="Phone Number"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <Input
                    label="Profile Picture URL"
                    value={profileForm.avatar_url}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" loading={saving} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile Details
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Appearance (Theme) Tab */}
          {activeTab === 'appearance' && (
            <Card className="p-6 border-gray-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Appearance Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">Choose your layout visualization preferences.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light Mode', icon: Sun },
                  { id: 'dark', label: 'Dark Mode', icon: Moon },
                  { id: 'system', label: 'System Mode', icon: Laptop }
                ].map((mode) => {
                  const Icon = mode.icon
                  return (
                    <button
                      key={mode.id}
                      onClick={() => applyTheme(mode.id as any)}
                      className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 transition-all ${
                        theme === mode.id
                          ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-xs font-semibold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{mode.label}</span>
                    </button>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="p-6 border-gray-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Notification Channels</h2>
                <p className="text-xs text-gray-500 mt-0.5">Toggle alert preferences for system actions.</p>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'email', title: 'Email Alerts', desc: 'Receive system receipts and notice alerts on registered email.' },
                  { id: 'rent_reminder', title: 'Rent Reminders', desc: 'Receive warning notifications for approaching rent due dates.' },
                  { id: 'complaints', title: 'Complaint Logs', desc: 'Receive updates when new complaints are logged or resolved.' }
                ].map((channel) => (
                  <div key={channel.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-0.5 max-w-md">
                      <p className="text-sm font-semibold text-gray-900">{channel.title}</p>
                      <p className="text-xs text-gray-500">{channel.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[channel.id]}
                      onChange={(e) => setNotifications(prev => ({ ...prev, [channel.id]: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer mt-1"
                    />
                  </div>
                ))}

                <div className="pt-4 border-t flex justify-end">
                  <Button onClick={handleSaveNotifications} loading={saving} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Toggles
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Last Login Security Info */}
              <Card className="p-6 border-gray-200 shadow-xs space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                    Last Login Security Log
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Details of your current session & last authenticated login.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border">
                  <div>
                    <span className="block text-[10px] font-bold text-gray-405 uppercase tracking-wider">Device</span>
                    <span className="text-sm font-semibold text-gray-900 mt-1 block">{deviceInfo?.device || 'Web Browser'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-405 uppercase tracking-wider">Last Login Time</span>
                    <span className="text-sm font-semibold text-gray-900 mt-1 block">{deviceInfo?.lastLogin || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-405 uppercase tracking-wider">User Agent</span>
                    <span className="text-xs font-mono text-gray-600 mt-1 block truncate max-w-[200px]" title={deviceInfo?.userAgent}>
                      {deviceInfo?.userAgent || 'Unknown'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-gray-200 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-gray-400" />
                    Change Password
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Ensure your account password is robust and secure.</p>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="New Password"
                      type="password"
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="pt-4 border-t flex justify-end">
                    <Button type="submit" loading={saving} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  </div>
                </form>
              </Card>

              <Card className="p-6 border-red-200 bg-red-50/20 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-red-950 flex items-center gap-2">
                    <LogOut className="h-5 w-5 text-red-600" />
                    Session Management
                  </h2>
                  <p className="text-xs text-red-700 mt-0.5">Logs you out from all other active sessions across browsers and devices.</p>
                </div>

                <div className="flex justify-start">
                  <Button
                    onClick={handleLogoutAll}
                    loading={saving}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    Logout from All Devices
                  </Button>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

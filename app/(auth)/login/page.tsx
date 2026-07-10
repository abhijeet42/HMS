'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Building2, DoorOpen, Wallet, Users, MessageSquareText, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('error') === 'no-profile') {
        setError(
          "Your account has no associated profile. If you created this user in the Supabase Auth panel, please make sure you also created a row in the 'profiles' table with the role set to 'admin' or 'student'."
        )
      }
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginAction(email, password)

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.redirect) {
        router.push(result.redirect)
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        {/* Decorative glow blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 shadow-lg shadow-amber-900/20">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">GL HMS</span>
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-medium text-blue-200 mb-5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            Secure hostel operations platform
          </span>

          <h1 className="text-4xl font-bold text-white leading-tight">
            Welcome to<br />
            <span className="text-amber-400">GOPE LODGE Hostel</span><br />
            Management
          </h1>
          <p className="mt-4 text-blue-200/90 text-lg leading-relaxed max-w-md">
            A complete digital system to manage rooms, students, payments, and daily hostel operations — all in one place.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Room Management', desc: 'Track occupancy & availability', icon: DoorOpen },
              { label: 'Rent & Billing', desc: 'Electricity, water & more', icon: Wallet },
              { label: 'Student Portal', desc: 'Self-service for residents', icon: Users },
              { label: 'Complaints', desc: 'Track & resolve issues fast', icon: MessageSquareText },
            ].map((item) => (
              <div
                key={item.label}
                className="group rounded-xl p-4 border border-white/10 bg-white/[0.06] hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                <item.icon className="h-5 w-5 text-amber-400 mb-2.5" />
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-blue-300/90 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-blue-300/70 text-sm">© 2026 GL Hostel. All rights reserved.</p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 shadow-md">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">GL HMS</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-200/60 p-7 sm:p-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-7 space-y-5">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                id="email"
              />

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1 pr-10 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-400 placeholder:text-gray-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 animate-fade-in">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-sm font-semibold"
                loading={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            GL Hostel Management System • Secure & Private
          </p>
        </div>
      </div>
    </div>
  )
}
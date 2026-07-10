// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Building2 } from 'lucide-react'

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
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">GL HMS</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Welcome to<br />
            <span className="text-amber-400">GOPE LODGE Hostel</span><br />
            Management
          </h1>
          <p className="mt-4 text-blue-200 text-lg leading-relaxed">
            A complete digital system to manage rooms, students, payments, and daily hostel operations — all in one place.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Room Management', desc: 'Track occupancy & availability' },
              { label: 'Rent & Billing', desc: 'Electricity, water & more' },
              { label: 'Student Portal', desc: 'Self-service for residents' },
              { label: 'Complaints', desc: 'Track & resolve issues fast' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-blue-300 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">© 2026 GL Hostel. All rights reserved.</p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">GL HMS</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 pr-10 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
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
              className="w-full"
              loading={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            GL Hostel Management System • Secure & Private
          </p>
        </div>
      </div>
    </div>
  )
}

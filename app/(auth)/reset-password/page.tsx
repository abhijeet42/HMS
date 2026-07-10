'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    // Supabase sends token in the URL hash fragment as #access_token=...&type=recovery
    // We need to exchange it for a session
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    const refreshToken = hashParams.get('refresh_token')

    if (type === 'recovery' && accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        if (error) {
          setSessionError('This reset link is invalid or has expired. Please request a new one.')
        } else {
          setSessionReady(true)
        }
      })
    } else {
      // Check if already have a valid session (e.g. user navigated back)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true)
        } else {
          setSessionError('No valid reset session found. Please use the link from your email or request a new one.')
        }
      })
    }
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message || 'Failed to update password.')
        return
      }

      setSuccess(true)
      // Sign out and redirect to login after 2 seconds
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login')
      }, 2500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">GL HMS</span>
        </div>

        {success ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Password Updated!</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your password has been changed successfully. Redirecting you to sign in...
            </p>
          </div>
        ) : sessionError ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Link Expired</h2>
            <p className="mt-2 text-sm text-gray-500">{sessionError}</p>
            <Link href="/forgot-password">
              <Button className="mt-6 w-full">Request New Reset Link</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="mt-3 w-full">Back to Sign In</Button>
            </Link>
          </div>
        ) : !sessionReady ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
            Verifying reset link...
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose a strong password for your GL HMS account.
              </p>
            </div>

            <form onSubmit={handleReset} className="mt-8 space-y-5">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                autoFocus
                id="new-password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                id="confirm-password"
              />

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                {loading ? 'Updating...' : 'Set New Password'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

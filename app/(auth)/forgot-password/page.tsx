// @ts-nocheck
import Link from 'next/link'
import { Building2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">GL HMS</span>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Password Recovery</h2>
          <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800 leading-relaxed">
            Please contact the hostel administrator or office to recover, reset, or change your password. Only admin operators can update resident credentials.
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

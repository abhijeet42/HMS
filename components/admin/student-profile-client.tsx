// @ts-nocheck
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import BillForm from '@/components/admin/bill-form'
import { resetStudentPassword } from '@/lib/actions/student'
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils'
import {
  ArrowLeft,
  User,
  Home,
  Receipt,
  FileText,
  AlertCircle,
  ShieldAlert,
  Save,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  GraduationCap,
  Key,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface StudentProfileClientProps {
  student: any
  bills: any[]
  complaints: any[]
  rooms: any[]
}

export default function StudentProfileClient({
  student,
  bills,
  complaints,
  rooms
}: StudentProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'personal' | 'rent' | 'complaints' | 'notes'>('personal')
  const [adminNotes, setAdminNotes] = useState(student.admin_notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesMessage, setNotesMessage] = useState({ type: '', text: '' })
  const [showBillForm, setShowBillForm] = useState(false)
  
  // Rent search & filter states
  const [rentSearch, setRentSearch] = useState('')
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null)

  // Reset password states
  const [newPassword, setNewPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  async function handleResetPassword() {
    if (!student.user_id) {
      setPasswordMessage({ type: 'error', text: 'This student has no associated Auth User ID.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long.' })
      return
    }

    setResettingPassword(true)
    setPasswordMessage({ type: '', text: '' })

    try {
      const res = await resetStudentPassword(student.user_id, newPassword)
      if (res.success) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' })
        setNewPassword('')
      } else {
        setPasswordMessage({ type: 'error', text: res.error || 'Failed to update password.' })
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Something went wrong.' })
    } finally {
      setResettingPassword(false)
    }
  }

  // Calculate Rent Summary Metrics
  const totalRentBilled = bills.reduce((sum, b) => sum + (b.total_amount || 0), 0)
  const totalRentPaid = bills.reduce((sum, b) => sum + (b.amount_paid || 0), 0)
  const totalRentPending = totalRentBilled - totalRentPaid

  const currentMonthBill = bills.find(
    (b) => b.month === new Date().getMonth() + 1 && b.year === new Date().getFullYear()
  )

  const filteredBills = bills.filter((b) => {
    const monthName = getMonthName(b.month).toLowerCase()
    const yearStr = b.year.toString()
    const query = rentSearch.toLowerCase()
    return monthName.includes(query) || yearStr.includes(query)
  })

  async function handleSaveNotes() {
    setSavingNotes(true)
    setNotesMessage({ type: '', text: '' })
    try {
      const { error } = await supabase
        .from('students')
        .update({ admin_notes: adminNotes })
        .eq('id', student.id)

      if (error) throw error
      setNotesMessage({ type: 'success', text: 'Internal notes saved successfully.' })
    } catch (err: any) {
      setNotesMessage({ type: 'error', text: err.message || 'Failed to save notes.' })
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <>
      {/* Bill Generation Modal */}
      {showBillForm && (
        <BillForm
          students={[student]} // Pass only this student so they are auto-selected and locked in the dropdown
          onClose={() => {
            setShowBillForm(false)
            router.refresh()
          }}
          defaultStudentId={student.id}
        />
      )}

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Back Link & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Students
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
              <Badge
                variant={
                  student.status === 'active'
                    ? 'success'
                    : student.status === 'inactive'
                    ? 'warning'
                    : 'default'
                }
              >
                {student.status === 'active'
                  ? 'Active'
                  : student.status === 'inactive'
                  ? 'Inactive'
                  : 'Checked Out'}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowBillForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Generate Monthly Rent
            </Button>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 -mb-px">
            {[
              { id: 'personal', label: 'Personal & Room Info', icon: User },
              { id: 'rent', label: 'Rent Details & History', icon: Receipt },
              { id: 'complaints', label: 'Complaint History', icon: FileText },
              { id: 'notes', label: 'Internal Notes', icon: ShieldAlert }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Contents */}
        <div className="mt-6">
          {/* PERSONAL & ROOM INFO TAB */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Personal Info Card */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{student.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent/Guardian Contact</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{student.parent_phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emergency Contact</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{student.emergency_contact || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">College</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{student.college || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{student.course || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Joining Date</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{student.joining_date ? formatDate(student.joining_date) : 'N/A'}</p>
                      </div>
                    </div>
                    {student.checkout_date && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checkout Date</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(student.checkout_date)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Column: Room Details Card */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    Room Information
                  </h2>
                  {student.rooms ? (
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Room Number</span>
                        <span className="text-sm font-bold text-gray-950">Room {student.rooms.room_number}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Floor</span>
                        <span className="text-sm font-semibold text-gray-900">Floor {student.rooms.floor}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Room Rent</span>
                        <span className="text-sm font-bold text-blue-600">{formatCurrency(student.rooms.monthly_rent)}/mo</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Room Status</span>
                        <Badge
                          variant={
                            student.rooms.status === 'available'
                              ? 'success'
                              : student.rooms.status === 'full'
                              ? 'default'
                              : 'warning'
                          }
                        >
                          {student.rooms.status === 'available' ? 'Available Beds' : student.rooms.status === 'full' ? 'Full' : 'Maintenance'}
                        </Badge>
                      </div>
                      {student.rooms.description && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2 leading-relaxed">
                          {student.rooms.description}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 italic text-sm">
                      No room currently assigned.
                    </div>
                  )}
                </Card>

                {/* Reset Password Card */}
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <Key className="h-5 w-5 text-orange-600" />
                    Reset Password
                  </h2>
                  <div className="space-y-4">
                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                    />
                    {passwordMessage.text && (
                      <div className={`p-3 rounded-lg border text-sm ${
                        passwordMessage.type === 'success'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {passwordMessage.text}
                      </div>
                    )}
                    <Button
                      onClick={handleResetPassword}
                      loading={resettingPassword}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium"
                      disabled={!student.user_id}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* RENT DETAILS & HISTORY TAB */}
          {activeTab === 'rent' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-gray-50/50 border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount Billed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRentBilled)}</p>
                </Card>
                <Card className="p-4 bg-green-50/30 border-green-100">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Total Paid</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totalRentPaid)}</p>
                </Card>
                <Card className="p-4 bg-red-50/30 border-red-100">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Total Outstanding Due</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(totalRentPending)}</p>
                </Card>
                <Card className="p-4 bg-blue-50/30 border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Current Month Rent</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {currentMonthBill ? (
                      <span className="flex items-center gap-1.5 mt-1.5">
                        <Badge
                          variant={
                            currentMonthBill.status === 'paid'
                              ? 'success'
                              : currentMonthBill.status === 'partial'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {currentMonthBill.status === 'paid' ? 'Paid' : currentMonthBill.status === 'partial' ? 'Partially Paid' : 'Pending'}
                        </Badge>
                        <span className="text-xs text-gray-500">({formatCurrency(currentMonthBill.total_amount)})</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs mt-1.5 block">Not generated yet</span>
                    )}
                  </p>
                </Card>
              </div>

              {/* History Search & List */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-base font-semibold text-gray-900">Rent & Billing History</h3>
                  <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={rentSearch}
                      onChange={(e) => setRentSearch(e.target.value)}
                      placeholder="Search by Month or Year..."
                      className="w-full pl-9 pr-3 h-9 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {filteredBills.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-sm">
                    No matching rent records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs font-medium border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4">Billing Period</th>
                          <th className="px-6 py-4">Total Rent</th>
                          <th className="px-6 py-4">Paid</th>
                          <th className="px-6 py-4">Outstanding</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredBills.map((bill) => {
                          const isBillExpanded = expandedBillId === bill.id
                          return (
                            <React.Fragment key={bill.id}>
                              <tr
                                className="hover:bg-gray-50/50 cursor-pointer"
                                onClick={() => setExpandedBillId(isBillExpanded ? null : bill.id)}
                              >
                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                  {isBillExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                  {getMonthName(bill.month)} {bill.year}
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-900">
                                  {formatCurrency(bill.total_amount)}
                                </td>
                                <td className="px-6 py-4 text-green-600">
                                  {formatCurrency(bill.amount_paid)}
                                </td>
                                <td className="px-6 py-4 text-red-600 font-medium">
                                  {formatCurrency(bill.total_amount - bill.amount_paid)}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge
                                    variant={
                                      bill.status === 'paid'
                                        ? 'success'
                                        : bill.status === 'partial'
                                        ? 'warning'
                                        : 'destructive'
                                    }
                                  >
                                    {bill.status === 'paid' ? 'Paid' : bill.status === 'partial' ? 'Partial' : 'Pending'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                  {bill.due_date ? formatDate(bill.due_date) : '—'}
                                </td>
                              </tr>
                              {isBillExpanded && (
                                <tr>
                                  <td colSpan={6} className="px-6 py-4 bg-gray-50/50">
                                    <div className="max-w-md space-y-2 text-xs text-gray-600">
                                      <div className="flex justify-between border-b pb-1">
                                        <span className="font-semibold">Rent Component</span>
                                        <span className="font-semibold">Amount</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Room Rent</span>
                                        <span>{formatCurrency(bill.base_rent || 0)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Electricity</span>
                                        <span>{formatCurrency(bill.electricity || 0)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Water</span>
                                        <span>{formatCurrency(bill.water || 0)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Wi-Fi (Internet)</span>
                                        <span>{formatCurrency(bill.internet || 0)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Food / Mess</span>
                                        <span>{formatCurrency(bill.food || 0)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Laundry / Cleaning</span>
                                        <span>{formatCurrency(bill.cleaning || 0)}</span>
                                      </div>
                                      {bill.laundry > 0 && (
                                        <div className="flex justify-between">
                                          <span>Laundry Extra</span>
                                          <span>{formatCurrency(bill.laundry)}</span>
                                        </div>
                                      )}
                                      {bill.maintenance > 0 && (
                                        <div className="flex justify-between">
                                          <span>Maintenance</span>
                                          <span>{formatCurrency(bill.maintenance)}</span>
                                        </div>
                                      )}
                                      {bill.security_deposit > 0 && (
                                        <div className="flex justify-between">
                                          <span>Security Deposit</span>
                                          <span>{formatCurrency(bill.security_deposit)}</span>
                                        </div>
                                      )}
                                      {bill.previous_due > 0 && (
                                        <div className="flex justify-between">
                                          <span>Previous Due</span>
                                          <span className="text-red-500">{formatCurrency(bill.previous_due)}</span>
                                        </div>
                                      )}
                                      {bill.discount > 0 && (
                                        <div className="flex justify-between">
                                          <span>Discount</span>
                                          <span className="text-green-600">-{formatCurrency(bill.discount)}</span>
                                        </div>
                                      )}
                                      {bill.adjustment !== 0 && (
                                        <div className="flex justify-between">
                                          <span>Adjustment</span>
                                          <span className={bill.adjustment < 0 ? 'text-green-600' : 'text-gray-900'}>
                                            {bill.adjustment < 0 ? '-' : '+'}{formatCurrency(Math.abs(bill.adjustment))}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span>Fine / Late Fee</span>
                                        <span className="text-red-500">{formatCurrency(bill.late_fee || 0)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>{bill.other_label || 'Other Charges'}</span>
                                        <span>{formatCurrency(bill.other_charges || 0)}</span>
                                      </div>
                                      <div className="flex justify-between font-bold text-gray-900 border-t pt-1 mt-1 text-sm">
                                        <span>Calculated Total</span>
                                        <span>{formatCurrency(bill.total_amount || 0)}</span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPLAINTS TAB */}
          {activeTab === 'complaints' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Submitted Complaints
              </h2>
              {complaints.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  This student has not submitted any complaints.
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/30 flex flex-col md:flex-row justify-between gap-4 items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{c.title}</h3>
                          <Badge variant="outline" className="text-xs uppercase bg-white">
                            {c.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{c.description}</p>
                        {c.admin_note && (
                          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2 mt-1">
                            <span className="font-semibold">Admin Response:</span> {c.admin_note}
                          </div>
                        )}
                        <span className="text-[10px] text-gray-400 block mt-1">
                          Submitted on {formatDate(c.created_at)}
                        </span>
                      </div>
                      <Badge
                        variant={
                          c.status === 'resolved'
                            ? 'success'
                            : c.status === 'in_progress'
                            ? 'default'
                            : 'warning'
                        }
                        className="flex-shrink-0"
                      >
                        {c.status === 'resolved' ? 'Resolved' : c.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* INTERNAL NOTES TAB */}
          {activeTab === 'notes' && (
            <Card className="p-6 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-600" />
                Internal Student Notes
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                These notes are internal and only visible to hostel administrators. Students will never see them.
              </p>

              <div className="space-y-4">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={6}
                  placeholder="Add administrative notes regarding conduct, payment delays, special permissions, etc..."
                  className="w-full p-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {notesMessage.text && (
                  <div
                    className={`p-3 rounded-lg border text-sm ${
                      notesMessage.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {notesMessage.text}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveNotes}
                    loading={savingNotes}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Notes
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

// @ts-nocheck
'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getMonthName, getBillStatus, getComplaintStatus } from '@/lib/utils'
import {
  User,
  Home,
  Receipt,
  Bell,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText
} from 'lucide-react'

interface StudentProfileViewProps {
  student: any
  bills: any[]
  payments: any[]
  complaints: any[]
  notices: any[]
}

export default function StudentProfileView({
  student,
  bills,
  payments,
  complaints,
  notices
}: StudentProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'payments' | 'notices' | 'complaints'>('personal')
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null)

  const totalBilled = bills.reduce((sum, b) => sum + (b.total_amount || 0), 0)
  const totalPaid = bills.reduce((sum, b) => sum + (b.amount_paid || 0), 0)
  const totalPending = totalBilled - totalPaid

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center font-bold text-2xl border border-white/20">
            {student.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{student.full_name}</h2>
            <p className="text-blue-100 text-sm mt-0.5">{student.email}</p>
            {student.rooms && (
              <span className="inline-block mt-2 bg-white/10 text-xs px-2.5 py-1 rounded-md font-medium border border-white/15">
                Room {student.rooms.room_number} • Floor {student.rooms.floor}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
          <div className="bg-white/10 rounded-xl p-3 border border-white/5 text-center min-w-[80px]">
            <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Billed</p>
            <p className="text-base font-bold mt-1">{formatCurrency(totalBilled)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/5 text-center min-w-[80px]">
            <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Paid</p>
            <p className="text-base font-bold mt-1 text-green-300">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/5 text-center min-w-[80px]">
            <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Pending</p>
            <p className={`text-base font-bold mt-1 ${totalPending > 0 ? 'text-red-300' : 'text-green-300'}`}>
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 sm:gap-6 -mb-px overflow-x-auto scrollbar-none">
          {[
            { id: 'personal', label: 'Personal & Room', icon: User },
            { id: 'payments', label: 'Billing & Rent', icon: Receipt },
            { id: 'notices', label: 'Notices', icon: Bell },
            { id: 'complaints', label: 'Complaints', icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 touch-manipulation ${
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
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Personal Info Card */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Personal Information
                </h3>
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
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Joining Date</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{student.joining_date ? formatDate(student.joining_date) : 'N/A'}</p>
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
                </div>
              </Card>
            </div>

            {/* Right Column: Room Details Card */}
            <div>
              <Card className="p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                  <Home className="h-4 w-4 text-blue-600" />
                  Room Information
                </h3>
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
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 italic text-sm">
                    No room currently assigned.
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Billing & Rent History</h3>
            </div>
            {bills.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No rent records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" style={{minWidth: '600px'}}>
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-4">Billing Period</th>
                      <th className="px-4 py-4">Total Rent</th>
                      <th className="px-4 py-4">Paid</th>
                      <th className="px-4 py-4">Outstanding</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bills.map((bill) => {
                      const isBillExpanded = expandedBillId === bill.id
                      const statusConfig = getBillStatus(bill.status)
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
                              <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'partial' ? 'warning' : 'destructive'}>
                                {statusConfig.label}
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
                                  <div className="flex justify-between font-medium">
                                    <span>Fine / Late Fee</span>
                                    <span className="text-red-500">{formatCurrency(bill.late_fee || 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{bill.other_label || 'Other Charges'}</span>
                                    <span>{formatCurrency(bill.other_charges || 0)}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-gray-900 border-t pt-1 mt-1 text-sm">
                                    <span>Total Calculated</span>
                                    <span>{formatCurrency(bill.total_amount || 0)}</span>
                                  </div>
                                  {bill.notes && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded text-[11px] text-yellow-800">
                                      <span className="font-bold">Hostel Note:</span> {bill.notes}
                                    </div>
                                  )}
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
        )}

        {activeTab === 'notices' && (
          <div className="space-y-4">
            {notices.length === 0 ? (
              <Card className="p-12 text-center text-gray-400 italic text-sm">
                No active notices published.
              </Card>
            ) : (
              notices.map((n) => (
                <Card key={n.id} className={`p-5 border-l-4 ${
                  n.priority === 'urgent' ? 'border-l-red-500 bg-red-50/20' :
                  n.priority === 'high' ? 'border-l-orange-500 bg-orange-50/20' :
                  'border-l-blue-500 bg-blue-50/20'
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{n.title}</h4>
                      <p className="text-sm text-gray-650 mt-1 leading-relaxed">{n.content}</p>
                      <p className="text-[10px] text-gray-400 mt-3">{formatDate(n.published_at)}</p>
                    </div>
                    <Badge variant={n.priority === 'urgent' ? 'destructive' : n.priority === 'high' ? 'warning' : 'default'}>
                      {n.priority.toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <Card className="p-12 text-center text-gray-400 italic text-sm">
                You have not submitted any complaints yet.
              </Card>
            ) : (
              complaints.map((c) => {
                const status = getComplaintStatus(c.status)
                return (
                  <Card key={c.id} className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">{c.title}</h4>
                          <Badge variant="outline" className="text-[10px] uppercase">{c.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{c.description}</p>
                      </div>
                      <Badge variant={c.status === 'resolved' ? 'success' : c.status === 'in_progress' ? 'default' : 'warning'}>
                        {status.label}
                      </Badge>
                    </div>
                    {c.admin_note && (
                      <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <span className="font-semibold block">Office Action Note:</span>
                        <p className="mt-0.5">{c.admin_note}</p>
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 border-t pt-2 flex justify-between">
                      <span>Submitted: {formatDate(c.created_at)}</span>
                      <span>Last Updated: {formatDate(c.updated_at)}</span>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

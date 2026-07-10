'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ComplaintActionModal from '@/components/admin/complaint-action-modal'
import { formatDate, getComplaintStatus, getInitials } from '@/lib/utils'
import { COMPLAINT_CATEGORIES } from '@/lib/constants'
import type { ComplaintWithStudent } from '@/types/database'
import { Search, Pencil, Trash2, MessageSquare, Filter } from 'lucide-react'

interface ComplaintsClientProps {
  complaints: ComplaintWithStudent[]
}

export default function ComplaintsClient({ complaints }: ComplaintsClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  
  const [showModal, setShowModal] = useState(false)
  const [editComplaint, setEditComplaint] = useState<ComplaintWithStudent | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = complaints.filter((c) => {
    const studentName = c.students?.full_name || ''
    const matchSearch = 
      studentName.toLowerCase().includes(search.toLowerCase()) || 
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    const matchCategory = filterCategory === 'all' || c.category === filterCategory
    
    return matchSearch && matchStatus && matchCategory
  })

  async function handleDelete(complaint: ComplaintWithStudent) {
    if (!confirm(`Delete complaint "${complaint.title}"? This cannot be undone.`)) return

    setDeletingId(complaint.id)
    try {
      const { error } = await supabase.from('complaints').delete().eq('id', complaint.id)
      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  function openAction(complaint: ComplaintWithStudent) {
    setEditComplaint(complaint)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditComplaint(null)
  }

  return (
    <>
      {showModal && editComplaint && <ComplaintActionModal complaint={editComplaint} onClose={closeModal} />}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Complaints</h1>
            <p className="text-sm text-gray-500">Manage and resolve student issues</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search complaints..."
                className="w-full pl-9 pr-3 h-9 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {COMPLAINT_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
            <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No complaints found</p>
            <p className="text-xs text-gray-400 mt-1">
              Either there are no issues, or they have all been filtered out.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((complaint) => {
              const statusConfig = getComplaintStatus(complaint.status)
              const catLabel = COMPLAINT_CATEGORIES.find(c => c.value === complaint.category)?.label || complaint.category
              
              return (
                <div key={complaint.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Student Info */}
                    <div className="md:w-1/4 flex flex-col items-start gap-2 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                      <div className="flex items-center gap-3 w-full">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold flex-shrink-0">
                          {getInitials(complaint.students?.full_name || '?')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{complaint.students?.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{complaint.students?.email}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Submitted: {formatDate(complaint.created_at)}
                      </div>
                    </div>

                    {/* Middle: Complaint Details */}
                    <div className="md:w-2/4 flex-1">
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant="outline" className="text-xs font-normal bg-gray-50 text-gray-600">
                          {catLabel}
                        </Badge>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">{complaint.title}</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{complaint.description}</p>
                      
                      {complaint.admin_note && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm">
                          <span className="font-semibold text-blue-900 text-xs uppercase tracking-wider block mb-1">Admin Note:</span>
                          <span className="text-blue-800">{complaint.admin_note}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="md:w-1/4 flex flex-row md:flex-col items-center justify-end md:justify-start gap-2 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                      <Button className="w-full md:w-auto" onClick={() => openAction(complaint)}>
                        Update Status
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full md:w-auto mt-auto"
                        onClick={() => handleDelete(complaint)}
                        loading={deletingId === complaint.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

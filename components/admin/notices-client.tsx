// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import NoticeForm from '@/components/admin/notice-form'
import { formatDate } from '@/lib/utils'
import type { Notice } from '@/types/database'
import { Plus, Search, Pencil, Trash2, Bell, Eye, EyeOff } from 'lucide-react'

interface NoticesClientProps {
  notices: Notice[]
}

export default function NoticesClient({ notices }: NoticesClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const [showForm, setShowForm] = useState(false)
  const [editNotice, setEditNotice] = useState<Notice | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = notices.filter((n) => {
    const matchSearch = 
      n.title.toLowerCase().includes(search.toLowerCase()) || 
      n.content.toLowerCase().includes(search.toLowerCase())
    
    let matchStatus = true
    if (filterStatus === 'active') matchStatus = n.is_active === true
    if (filterStatus === 'inactive') matchStatus = n.is_active === false
    
    return matchSearch && matchStatus
  })

  async function handleDelete(notice: Notice) {
    if (!confirm(`Delete notice "${notice.title}"? This cannot be undone.`)) return

    setDeletingId(notice.id)
    try {
      const { error } = await supabase.from('notices').delete().eq('id', notice.id)
      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }
  
  async function toggleStatus(notice: Notice) {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !notice.is_active })
        .eq('id', notice.id)
        
      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`)
    }
  }

  function openEdit(notice: Notice) {
    setEditNotice(notice)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditNotice(null)
  }
  
  function getPriorityBadge(priority: string) {
    switch(priority) {
      case 'urgent': return <Badge variant="danger">Urgent</Badge>
      case 'high': return <Badge variant="warning">High</Badge>
      case 'low': return <Badge variant="info">Low</Badge>
      default: return <Badge variant="outline">Normal</Badge>
    }
  }

  return (
    <>
      {showForm && <NoticeForm notice={editNotice} onClose={closeForm} />}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notice Board</h1>
            <p className="text-sm text-gray-500">Publish announcements and updates for students</p>
          </div>
          <Button onClick={() => { setEditNotice(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" />
            New Notice
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notices..."
              className="w-full pl-9 pr-3 h-9 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Notices List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Bell className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No notices found</p>
            <p className="text-xs text-gray-400 mt-1">
              Create a new notice to announce something to the students.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((notice) => (
              <div 
                key={notice.id} 
                className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-shadow hover:shadow-sm ${notice.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50/50 opacity-80'}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getPriorityBadge(notice.priority)}
                      {notice.is_active ? (
                        <Badge variant="success" className="gap-1"><Eye className="h-3 w-3"/> Active</Badge>
                      ) : (
                        <Badge variant="default" className="gap-1"><EyeOff className="h-3 w-3"/> Hidden</Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md">
                      {formatDate(notice.published_at)}
                    </span>
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-2 ${notice.is_active ? 'text-gray-900' : 'text-gray-600'}`}>
                    {notice.title}
                  </h3>
                  <p className={`text-sm mb-4 line-clamp-4 whitespace-pre-line ${notice.is_active ? 'text-gray-600' : 'text-gray-500'}`}>
                    {notice.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-gray-500 h-8 px-2 text-xs"
                    onClick={() => toggleStatus(notice)}
                  >
                    {notice.is_active ? 'Hide from students' : 'Show to students'}
                  </Button>
                  
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(notice)} title="Edit">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(notice)}
                      loading={deletingId === notice.id}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function StudentNoticesPage() {
  const supabase = await createClient()

  const { data: notices } = await supabase
    .from('notices')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false }) // Might not be perfect string sort, fallback to date
    .order('published_at', { ascending: false })

  function getPriorityBadge(priority: string) {
    switch(priority) {
      case 'urgent': return <Badge variant="danger">Urgent</Badge>
      case 'high': return <Badge variant="warning">High</Badge>
      case 'low': return <Badge variant="info">Low</Badge>
      default: return <Badge variant="outline">Normal</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notice Board</h1>
        <p className="text-sm text-gray-500">Important announcements from hostel management</p>
      </div>

      {(!notices || notices.length === 0) ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center border-dashed">
          <Bell className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-medium text-gray-900">No active notices</h2>
          <p className="text-sm text-gray-500 mt-1">You're all caught up. There are no announcements at the moment.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id} className={`p-6 border-l-4 ${
              notice.priority === 'urgent' ? 'border-l-red-500 bg-red-50/30' :
              notice.priority === 'high' ? 'border-l-orange-500 bg-orange-50/30' :
              'border-l-blue-500'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {getPriorityBadge(notice.priority)}
                  <h2 className="text-lg font-bold text-gray-900">{notice.title}</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1 rounded-md border shadow-sm shrink-0">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(notice.published_at)}
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {notice.content}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

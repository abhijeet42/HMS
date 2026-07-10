'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import StudentComplaintForm from '@/components/student/student-complaint-form'
import { formatDate, getComplaintStatus } from '@/lib/utils'
import { COMPLAINT_CATEGORIES } from '@/lib/constants'
import type { Complaint } from '@/types/database'
import { Plus, MessageSquare } from 'lucide-react'

interface StudentComplaintsClientProps {
  complaints: Complaint[]
  studentId: string
}

export default function StudentComplaintsClient({ complaints, studentId }: StudentComplaintsClientProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      {showForm && <StudentComplaintForm studentId={studentId} onClose={() => setShowForm(false)} />}

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Complaints</h1>
            <p className="text-sm text-gray-500">Report issues and track their status</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Report Issue
          </Button>
        </div>

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <Card className="p-16 flex flex-col items-center justify-center text-center border-dashed">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
            <h2 className="text-lg font-medium text-gray-900">No issues reported</h2>
            <p className="text-sm text-gray-500 mt-1">
              If you face any issues with your room or hostel facilities, you can report them here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => {
              const statusConfig = getComplaintStatus(complaint.status)
              const catLabel = COMPLAINT_CATEGORIES.find(c => c.value === complaint.category)?.label || complaint.category
              
              return (
                <Card key={complaint.id} className="p-5 border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="outline" className="text-xs font-normal bg-gray-50 text-gray-600">
                        {catLabel}
                      </Badge>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{complaint.title}</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">{complaint.description}</p>
                    
                    <div className="text-xs text-gray-400">
                      Submitted on {formatDate(complaint.created_at)}
                    </div>
                  </div>

                  {complaint.admin_note && (
                    <div className="sm:w-1/3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm self-start mt-4 sm:mt-0">
                      <span className="font-semibold text-blue-900 text-xs uppercase tracking-wider block mb-1">Reply from Admin:</span>
                      <span className="text-blue-800">{complaint.admin_note}</span>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

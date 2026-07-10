// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import RoomForm from '@/components/admin/room-form'
import { formatCurrency, getRoomStatus } from '@/lib/utils'
import type { Room } from '@/types/database'
import { Plus, Search, Pencil, Trash2, BedDouble } from 'lucide-react'

interface RoomsClientProps {
  rooms: Room[]
  students: any[]
}

export default function RoomsClient({ rooms, students = [] }: RoomsClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterFloor, setFilterFloor] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = rooms.filter((r) => {
    const matchSearch =
      r.room_number.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    const matchFloor = filterFloor === 'all' || r.floor.toString() === filterFloor
    return matchSearch && matchStatus && matchFloor
  })

  async function handleDelete(room: Room) {
    if (room.occupied_beds > 0) {
      alert('Cannot delete a room with students assigned. Move students out first.')
      return
    }
    if (!confirm(`Delete room ${room.room_number}? This cannot be undone.`)) return

    setDeletingId(room.id)
    await supabase.from('rooms').delete().eq('id', room.id)
    router.refresh()
    setDeletingId(null)
  }

  function openEdit(room: Room) {
    setEditRoom(room)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditRoom(null)
  }

  // Define floor labels
  const floors = [
    { value: 'all', label: 'All Floors' },
    { value: '0', label: 'Ground Floor' },
    { value: '1', label: 'First Floor' },
    { value: '2', label: 'Second Floor' },
    { value: '3', label: 'Third Floor' }
  ]

  return (
    <>
      {/* Modals */}
      {showForm && <RoomForm room={editRoom} onClose={closeForm} />}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Rooms</h1>
            <p className="text-sm text-gray-500">{rooms.length} total rooms</p>
          </div>
          <Button onClick={() => { setEditRoom(null); setShowForm(true) }} id="add-room-btn">
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rooms..."
                id="room-search"
                className="w-full pl-9 pr-3 h-9 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs font-semibold text-gray-500 mr-1">Status:</span>
              {['all', 'available', 'full', 'maintenance'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-650 hover:bg-gray-200'}`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500 mr-1">Floor:</span>
            {floors.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterFloor(f.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterFloor === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-650 hover:bg-gray-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BedDouble className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No rooms found</p>
            <p className="text-xs text-gray-400 mt-1">
              {rooms.length === 0 ? 'Add your first room to get started.' : 'Try adjusting your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((room) => {
              const { label, color } = getRoomStatus(room.status)
              const occupancyPct = room.capacity > 0 ? (room.occupied_beds / room.capacity) * 100 : 0
              const roomStudents = students.filter(s => s.room_id === room.id)

              return (
                <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Room Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">Room {room.room_number}</p>
                        <p className="text-xs text-gray-400">Floor {room.floor}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
                        {label}
                      </span>
                    </div>

                    {/* Occupancy Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{room.occupied_beds} occupied</span>
                        <span>{room.capacity} beds</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${occupancyPct === 100 ? 'bg-red-400' : occupancyPct > 60 ? 'bg-yellow-400' : 'bg-green-400'}`}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Rent */}
                    <p className="text-sm font-semibold text-gray-800">
                      {formatCurrency(room.monthly_rent)}
                      <span className="font-normal text-gray-400 text-xs"> / month base</span>
                    </p>

                    {/* Description */}
                    {room.description && (
                      <p className="text-xs text-gray-400 line-clamp-2">{room.description}</p>
                    )}

                    {/* Students List */}
                    {roomStudents.length > 0 && (
                      <div className="pt-2 border-t border-gray-150 space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Students ({roomStudents.length})</p>
                        <div className="space-y-1">
                          {roomStudents.map(s => (
                            <Link
                              key={s.id}
                              href={`/admin/students/${s.id}`}
                              className="block text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                            >
                              • {s.full_name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEdit(room)}
                      id={`edit-room-${room.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(room)}
                      loading={deletingId === room.id}
                      id={`delete-room-${room.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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

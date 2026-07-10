'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createStudentUser(email: string, fullName: string) {
  const supabase = createAdminClient() as any

  // Generate a random temporary password
  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

  // 1. Create auth user with email already confirmed (no email verification required)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: 'student',
      full_name: fullName,
    },
  })

  if (authError) {
    let msg = authError.message
    if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('email_exists')) {
      msg = 'A user with this email address is already registered.'
    }
    return { success: false, error: msg }
  }

  if (!authData.user) {
    return { success: false, error: 'Failed to create user' }
  }

  // 2. Explicitly upsert profile row (guards against DB trigger race condition)
  await supabase.from('profiles').upsert(
    { id: authData.user.id, role: 'student', full_name: fullName },
    { onConflict: 'id' }
  )

  return { 
    success: true, 
    userId: authData.user.id,
    tempPassword 
  }
}

export async function deleteStudentUser(studentId: string, userId: string | null) {
  const supabase = createAdminClient() as any
  
  // 1. Get student room information before deleting
  const { data: student } = await supabase
    .from('students')
    .select('room_id')
    .eq('id', studentId)
    .maybeSingle()

  // 2. Delete student record from public.students table
  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  // 3. Decrement occupied_beds if room_id was assigned
  if (student?.room_id) {
    const { data: room } = await supabase
      .from('rooms')
      .select('occupied_beds, capacity')
      .eq('id', student.room_id)
      .maybeSingle()

    if (room) {
      const newOccupied = Math.max(0, room.occupied_beds - 1)
      const newStatus = newOccupied >= room.capacity ? 'full' : 'available'
      await supabase
        .from('rooms')
        .update({ occupied_beds: newOccupied, status: newStatus })
        .eq('id', student.room_id)
    }
  }

  // 4. Delete auth user (will cascade to profiles)
  if (userId) {
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      console.error('Error deleting auth user:', authError)
    }
  }
  
  revalidatePath('/admin/students')
  return { success: true }
}

export async function resetStudentPassword(userId: string, newPassword: string) {
  const supabase = createAdminClient() as any

  if (!userId) {
    return { success: false, error: 'No authentication user ID provided.' }
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' }
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

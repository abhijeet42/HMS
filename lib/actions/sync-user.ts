'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Syncs a manually created Supabase auth user into the students table.
 * Run this when a user was created directly in the Supabase Dashboard,
 * not through the "Add Student" form.
 */
export async function syncSupabaseUserToStudent(email: string) {
  const supabase = createAdminClient() as any

  // 1. Look up the auth user by email
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) return { success: false, error: 'Failed to list users: ' + listError.message }

  const authUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
  if (!authUser) {
    return { success: false, error: `No Supabase auth user found with email: ${email}. Make sure you created the user in the Supabase Dashboard first.` }
  }

  // 2. Ensure profile row exists
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: authUser.id, role: 'student', full_name: authUser.user_metadata?.full_name || authUser.email }, { onConflict: 'id' })

  if (profileError) return { success: false, error: 'Failed to upsert profile: ' + profileError.message }

  // 3. Check if student row already exists (by user_id or email)
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .or(`user_id.eq.${authUser.id},email.eq.${email}`)
    .maybeSingle()

  if (existing) {
    // Just link user_id if not already linked
    await supabase.from('students').update({ user_id: authUser.id }).eq('id', existing.id)
    revalidatePath('/admin/students')
    return { success: true, message: 'Student already exists — linked auth user successfully.' }
  }

  // 4. Create new student row
  const { error: insertError } = await supabase.from('students').insert({
    user_id: authUser.id,
    full_name: authUser.user_metadata?.full_name || email.split('@')[0],
    email: email,
    status: 'active',
    joining_date: new Date().toISOString().split('T')[0],
  })

  if (insertError) return { success: false, error: 'Failed to create student record: ' + insertError.message }

  revalidatePath('/admin/students')
  return { success: true, message: 'Student record created and linked to Supabase auth user.' }
}

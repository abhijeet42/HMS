// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'

export async function loginAction(email: string, password: string) {
  const supabase = await createClient()

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !data.user) {
    const msg = authError?.message || ''
    if (msg.toLowerCase().includes('email not confirmed')) {
      return { error: 'Your email address has not been confirmed. Please check your inbox or contact the administrator.' }
    }
    if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials')) {
      return { error: 'Incorrect email or password. If you just received a temporary password, make sure you copied it exactly.' }
    }
    return { error: 'Incorrect email or password. Please try again.' }
  }

  // Fetch profile on the server — no RLS/URL issues
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    // Sign the user back out so they don't get stuck
    await supabase.auth.signOut()
    return {
      error:
        'Your account has no profile assigned. Run this SQL in Supabase SQL Editor:\n\nINSERT INTO public.profiles (id, role, full_name) SELECT id, \'admin\', email FROM auth.users ON CONFLICT (id) DO UPDATE SET role = \'admin\';',
    }
  }

  if (profile.role === 'admin') {
    return { redirect: '/admin/dashboard' }
  } else if (profile.role === 'student') {
    return { redirect: '/student/dashboard' }
  } else {
    await supabase.auth.signOut()
    return { error: 'Account has an invalid role. Contact the administrator.' }
  }
}

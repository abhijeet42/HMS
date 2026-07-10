import { createClient } from '@/lib/supabase/server'
import ExpensesClient from '@/components/admin/expenses-client'
import type { Expense } from '@/types/database'

export default async function AdminExpensesPage() {
  const supabase = await createClient()

  // Fetch all expenses (or default to current year). We'll let client filter.
  // In production, we might want to paginate or filter on the server.
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })

  if (error) {
    console.error('Error fetching expenses:', error)
  }

  return <ExpensesClient expenses={(expenses as Expense[]) || []} />
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleString('en-IN', { month: 'long' })
}

export function getReceiptNumber(transaction: any) {
  if (!transaction || !transaction.id) return 'GL-RECEIPT'
  const year = new Date(transaction.paid_at || transaction.created_at).getFullYear()
  let hash = 0
  const idStr = transaction.id
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash)
  }
  const receiptNum = Math.abs(hash % 100000).toString().padStart(5, '0')
  return `GL-${year}-${receiptNum}`
}

export function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getBillStatus(status: string) {
  switch (status) {
    case 'paid':
      return { label: 'Paid', color: 'text-green-600 bg-green-50' }
    case 'partial':
      return { label: 'Partial', color: 'text-yellow-600 bg-yellow-50' }
    case 'pending':
      return { label: 'Pending', color: 'text-red-600 bg-red-50' }
    default:
      return { label: status, color: 'text-gray-600 bg-gray-50' }
  }
}

export function getComplaintStatus(status: string) {
  switch (status) {
    case 'resolved':
      return { label: 'Resolved', color: 'text-green-600 bg-green-50' }
    case 'in_progress':
      return { label: 'In Progress', color: 'text-blue-600 bg-blue-50' }
    case 'pending':
      return { label: 'Pending', color: 'text-yellow-600 bg-yellow-50' }
    default:
      return { label: status, color: 'text-gray-600 bg-gray-50' }
  }
}

export function getRoomStatus(status: string) {
  switch (status) {
    case 'available':
      return { label: 'Available', color: 'text-green-600 bg-green-50' }
    case 'full':
      return { label: 'Full', color: 'text-red-600 bg-red-50' }
    case 'maintenance':
      return { label: 'Maintenance', color: 'text-yellow-600 bg-yellow-50' }
    default:
      return { label: status, color: 'text-gray-600 bg-gray-50' }
  }
}

export const CURRENT_YEAR = new Date().getFullYear()
export const CURRENT_MONTH = new Date().getMonth() + 1

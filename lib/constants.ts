export const APP_NAME = 'GL HMS'
export const HOSTEL_NAME = 'GL Hostel'

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
} as const

export const ROUTES = {
  // Public
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ROOMS: '/admin/rooms',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_EXPENSES: '/admin/expenses',
  ADMIN_COMPLAINTS: '/admin/complaints',
  ADMIN_NOTICES: '/admin/notices',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
  // Student
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_RENT: '/student/rent',
  STUDENT_NOTICES: '/student/notices',
  STUDENT_COMPLAINTS: '/student/complaints',
  STUDENT_PROFILE: '/student/profile',
} as const

export const BILL_COMPONENTS = [
  { key: 'base_rent', label: 'Base Rent', icon: '🏠' },
  { key: 'electricity', label: 'Electricity', icon: '⚡' },
  { key: 'water', label: 'Water', icon: '💧' },
  { key: 'internet', label: 'Internet', icon: '🌐' },
  { key: 'food', label: 'Food', icon: '🍽️' },
  { key: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { key: 'other_charges', label: 'Other', icon: '📋' },
] as const

export const EXPENSE_CATEGORIES = [
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' },
  { value: 'internet', label: 'Internet' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'food', label: 'Food' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'other', label: 'Other' },
] as const

export const COMPLAINT_CATEGORIES = [
  { value: 'fan', label: 'Fan Issue' },
  { value: 'light', label: 'Light Issue' },
  { value: 'water', label: 'Water Issue' },
  { value: 'internet', label: 'Internet Issue' },
  { value: 'cleaning', label: 'Cleaning Issue' },
  { value: 'furniture', label: 'Furniture Issue' },
  { value: 'other', label: 'Other' },
] as const

export const COMPLAINT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
] as const

export const NOTICE_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
] as const

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const

// Current date helpers — exported from constants so all components can import from one place
export const CURRENT_YEAR = new Date().getFullYear()
export const CURRENT_MONTH = new Date().getMonth() + 1

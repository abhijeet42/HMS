'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, CreditCard, Bell, MessageSquare, LogOut, Menu, X, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Dashboard', href: '/student/dashboard', icon: Home },
  { label: 'My Rent', href: '/student/rent', icon: CreditCard },
  { label: 'Notice Board', href: '/student/notices', icon: Bell },
  { label: 'Complaints', href: '/student/complaints', icon: MessageSquare },
  { label: 'My Profile', href: '/student/profile', icon: User },
]

export default function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  
  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between bg-brand-navy p-4 text-white sticky top-0 z-40">
        <div className="font-bold text-xl flex items-center gap-2">
          <span className="bg-brand-gold text-brand-navy w-8 h-8 rounded-md flex items-center justify-center">
            GL
          </span>
          Hostel
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 -mr-2">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-brand-navy text-white flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 hidden lg:flex items-center gap-3">
          <div className="bg-brand-gold text-brand-navy w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg">
            GL
          </div>
          <span className="font-bold text-xl tracking-tight">Hostel</span>
        </div>

        {/* User Role Badge */}
        <div className="px-6 pb-6">
          <div className="bg-white/10 rounded-md px-3 py-2 flex items-center gap-2 text-sm text-brand-gold font-medium border border-white/5">
            <User className="h-4 w-4" />
            Student Portal
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-brand-gold/20 text-brand-gold' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-brand-gold' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

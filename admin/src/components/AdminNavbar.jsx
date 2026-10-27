import React from 'react'
import { Database, ShieldCheck, User } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'

export const AdminNavbar = ({ title = 'Dashboard' }) => {
  const { adminUser } = useAdminAuth()

  return (
    <header className="h-18 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-400">Online OPD Central Administration</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Database indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium">
          <Database className="w-3.5 h-3.5" />
          <span>MongoDB: opd</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">{adminUser?.name || 'Admin'}</p>
            <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider mt-0.5">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminNavbar

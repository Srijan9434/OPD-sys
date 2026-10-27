import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'

export const AdminLayout = () => {
  const location = useLocation()

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'System Overview & Control'
      case '/queue':
        return 'Live OPD Patient Queue'
      case '/patients':
        return 'Registered Patients'
      case '/doctors':
        return 'Medical Specialists & Doctors'
      case '/specialities':
        return 'Medical Specialities'
      case '/appointments':
        return 'Hospital Appointments'
      case '/analytics':
        return 'Revenue & Operational Analytics'
      default:
        return 'Administration'
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

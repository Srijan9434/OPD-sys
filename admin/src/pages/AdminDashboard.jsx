import React, { useState, useEffect } from 'react'
import {
  Users,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import adminApi from '../api/adminApi'
import StatCard from '../components/StatCard'
import toast from 'react-hot-toast'

export const AdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const res = await adminApi.get('/admin/dashboard')
      if (res.data?.success) {
        setData(res.data.data)
        if (isManualRefresh) toast.success('Dashboard data refreshed')
      } else {
        throw new Error(res.data?.message || 'Failed to load dashboard data')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch dashboard data'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm">Aggregating live OPD metrics from MongoDB...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-xs text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Unable to load dashboard</h3>
        <p className="text-sm text-slate-500 mt-1 mb-6">{error}</p>
        <button
          onClick={() => fetchDashboard()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    )
  }

  const { stats, recentAppointments = [] } = data || {}

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time synchronization with central MongoDB <code className="text-indigo-600 font-mono text-xs">opd</code> database
          </p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Patients"
          value={stats?.totalPatients ?? 0}
          icon={Users}
          color="indigo"
          subtitle="Total patient accounts"
        />
        <StatCard
          title="Registered Doctors"
          value={stats?.totalDoctors ?? 0}
          icon={Stethoscope}
          color="sky"
          subtitle="Active medical specialists"
        />
        <StatCard
          title="Total Appointments"
          value={stats?.totalAppointments ?? 0}
          icon={Calendar}
          color="emerald"
          subtitle="All-time hospital bookings"
        />
        <StatCard
          title="Revenue Collected"
          value={`₹${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Confirmed paid visits"
        />
      </div>

      {/* Operational Queue Quick Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Today's OPD Queue</p>
            <h4 className="text-2xl font-bold text-purple-900 mt-1">{stats?.waitingQueue ?? 0} Waiting</h4>
            <p className="text-[11px] text-purple-600 mt-0.5">{stats?.inConsultation ?? 0} currently with doctor</p>
          </div>
          <Link
            to="/queue"
            className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shadow-2xs"
          >
            Open Queue
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Clinical Departments</p>
            <h4 className="text-2xl font-bold text-indigo-900 mt-1">{stats?.specialitiesCount ?? 8} Specialities</h4>
            <p className="text-[11px] text-indigo-600 mt-0.5">Active categories & filters</p>
          </div>
          <Link
            to="/specialities"
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            Manage
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Bookings</p>
            <h4 className="text-2xl font-bold text-amber-900 mt-1">{stats?.pendingAppointments ?? 0} Awaiting</h4>
            <p className="text-[11px] text-amber-600 mt-0.5">{stats?.cancelledAppointments ?? 0} cancelled</p>
          </div>
          <Link
            to="/appointments"
            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors shadow-2xs"
          >
            Review
          </Link>
        </div>
      </div>

      {/* Recent Appointments Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Appointment Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Most recent bookings logged into the hospital registry</p>
          </div>
          <Link
            to="/appointments"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No appointments registered yet in the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Patient</th>
                  <th className="py-3 px-6">Doctor</th>
                  <th className="py-3 px-6">Date & Slot</th>
                  <th className="py-3 px-6">Reason</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentAppointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800">
                      <div>
                        <p className="font-semibold text-slate-900">{apt.patient?.name || 'Unknown Patient'}</p>
                        <p className="text-xs text-slate-400">{apt.patient?.email || 'No email'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div>
                        <p className="font-medium text-slate-800">{apt.doctor?.name || 'Unknown Doctor'}</p>
                        <p className="text-xs text-slate-400">{apt.doctor?.speciality || 'General'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="text-xs">
                        <span className="font-medium text-slate-800">{apt.date}</span>
                        <span className="text-slate-400 ml-1.5 font-mono">({apt.slot})</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs max-w-xs truncate">
                      {apt.reason || 'General Consultation'}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${getStatusBadge(
                          apt.status
                        )}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard

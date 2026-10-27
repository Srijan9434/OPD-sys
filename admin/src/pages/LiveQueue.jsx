import React, { useState, useEffect } from 'react'
import {
  Clock,
  RefreshCw,
  Users,
  CheckCircle2,
  Stethoscope,
  Activity,
  UserCheck,
  AlertCircle,
} from 'lucide-react'
import adminApi from '../api/adminApi'
import toast from 'react-hot-toast'

export const LiveQueue = () => {
  const [queueData, setQueueData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchQueue = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await adminApi.get('/admin/queue')
      if (res.data?.success) {
        setQueueData(res.data)
        if (isManual) toast.success('Live queue refreshed')
      }
    } catch (err) {
      toast.error('Failed to load live OPD queue')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchQueue()
    // Poll every 30 seconds for live queue monitoring
    const interval = setInterval(() => {
      fetchQueue(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const { summary, queue = [], date } = queueData || {}

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold animate-pulse'
      case 'in-consultation':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold'
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'confirmed':
        return 'bg-sky-100 text-sky-800 border-sky-300'
      case 'cancelled':
      case 'rejected':
      case 'doctor-unavailable':
        return 'bg-rose-100 text-rose-800 border-rose-300'
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Live OPD Patient Queue</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Active clinic OPD queue for today: <span className="font-semibold text-slate-800">{date}</span>
          </p>
        </div>

        <button
          onClick={() => fetchQueue(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Queue'}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Today</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary?.totalToday ?? 0}</p>
        </div>
        <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 shadow-2xs">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Patients Waiting</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{summary?.waiting ?? 0}</p>
        </div>
        <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 shadow-2xs">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">In Consultation</p>
          <p className="text-2xl font-bold text-indigo-900 mt-1">{summary?.inConsultation ?? 0}</p>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{summary?.completed ?? 0}</p>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Monitoring clinic OPD queue...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Activity className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No active queue for today</p>
            <p className="text-xs text-slate-400 mt-1">
              No patients booked for today's OPD date ({date}).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Slot Time</th>
                  <th className="py-3 px-6">Patient</th>
                  <th className="py-3 px-6">Consulting Doctor</th>
                  <th className="py-3 px-6">Reason for Visit</th>
                  <th className="py-3 px-6">Queue Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {queue.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-800">
                      {item.slot}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">{item.patient?.name || 'Walk-in Patient'}</p>
                      <p className="text-xs text-slate-400">
                        {item.patient?.age ? `${item.patient.age} yrs` : ''}{' '}
                        {item.patient?.gender ? `• ${item.patient.gender}` : ''}{' '}
                        {item.patient?.phone ? `• ${item.patient.phone}` : ''}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-800">{item.doctor?.name}</p>
                      <p className="text-xs text-indigo-600">{item.doctor?.speciality}</p>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                      {item.reason || 'General Checkup'}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] border capitalize ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
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

export default LiveQueue

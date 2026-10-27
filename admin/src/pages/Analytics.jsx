import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Stethoscope,
  PieChart,
  RefreshCw,
  Clock,
  ShieldAlert,
} from 'lucide-react'
import adminApi from '../api/adminApi'
import toast from 'react-hot-toast'

export const Analytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await adminApi.get('/admin/analytics')
      if (res.data?.success) {
        setAnalytics(res.data.data)
      }
    } catch {
      toast.error('Failed to load financial & clinical analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const { paymentBreakdown = [], revenueByDoctor = [], statusCounts = [], doctorsOnLeave = [] } =
    analytics || {}

  let totalCollected = 0
  let pendingCollection = 0

  paymentBreakdown.forEach((p) => {
    if (p._id === 'paid') totalCollected = p.totalAmount
    else pendingCollection += p.totalAmount
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Financial & Clinical Analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Accurate revenue reconciliation, doctor earnings, and emergency leave audit
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Aggregating hospital ledger from MongoDB...</p>
        </div>
      ) : (
        <>
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Revenue Collected
                  </p>
                  <h3 className="text-3xl font-bold text-emerald-600 mt-2">₹{totalCollected.toLocaleString()}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Confirmed paid consultations</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Pending Fee Collections
                  </p>
                  <h3 className="text-3xl font-bold text-amber-600 mt-2">₹{pendingCollection.toLocaleString()}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Awaiting in-clinic cash / card payment</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Doctors on Leave
                  </p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{doctorsOnLeave.length}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Emergency or scheduled leave</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue by Doctor Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base mb-1">Doctor Revenue Breakdown</h3>
              <p className="text-xs text-slate-400 mb-5">
                Total consultations paid and gross clinical earnings per physician
              </p>

              {revenueByDoctor.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No paid appointment transactions recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {revenueByDoctor.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {doc.doctorName?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{doc.doctorName}</p>
                          <p className="text-xs text-indigo-600">{doc.speciality}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 text-sm">₹{doc.totalRevenue}</p>
                        <p className="text-[11px] text-slate-400">{doc.paidAppointments} Paid Consultations</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base mb-1">Appointment Status Distribution</h3>
              <p className="text-xs text-slate-400 mb-5">Aggregate classification of hospital consultations</p>

              <div className="grid grid-cols-2 gap-3">
                {statusCounts.map((sc) => (
                  <div key={sc._id} className="p-3 rounded-xl border border-slate-100 bg-white">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider capitalize">
                      {sc._id}
                    </span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{sc.count}</p>
                  </div>
                ))}
              </div>

              {/* Emergency Leave Notice */}
              {doctorsOnLeave.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Emergency Leave Alerts ({doctorsOnLeave.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {doctorsOnLeave.map((doc) => (
                      <div key={doc._id} className="text-xs text-rose-900 bg-white p-2.5 rounded-lg border border-rose-200">
                        <span className="font-bold">{doc.name}</span> ({doc.speciality}) is currently marked unavailable.
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Analytics

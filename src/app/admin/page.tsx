'use client'

import { useState, useEffect } from 'react'

const LOGO = 'https://d3f1iyfxxz8i1e.cloudfront.net/courses/course_image/849736ed9ea6.png'

interface AuditRow {
  id: string
  shareToken: string
  siteUrl: string
  auditorName: string
  auditorEmail: string
  opportunity: string | null
  region: string
  status: string
  createdAt: string
  overallScore: number | null
  grade: string | null
}

interface Stats {
  total: number
  complete: number
  manual: number
  avgScore: number
  byRegion: Record<string, number>
  byAuditor: { name: string; email: string; count: number }[]
  byDay: Record<string, number>
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    complete: 'bg-green-100 text-green-700',
    manual: 'bg-blue-100 text-blue-700',
    running: 'bg-amber-100 text-amber-700',
    pending: 'bg-gray-100 text-gray-500',
    error: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-500'
}

function scoreColor(s: number | null) {
  if (s === null) return 'text-gray-300'
  if (s >= 70) return 'text-green-600'
  if (s >= 40) return 'text-amber-600'
  return 'text-red-600'
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [audits, setAudits] = useState<AuditRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  async function login() {
    setLoading(true)
    setAuthError(false)
    try {
      const res = await fetch('/api/admin/audits', {
        headers: { 'x-admin-token': password },
      })
      if (!res.ok) { setAuthError(true); setLoading(false); return }
      const data = await res.json()
      setAudits(data.audits)
      setStats(data.stats)
      setAuthed(true)
    } catch {
      setAuthError(true)
    }
    setLoading(false)
  }

  async function refresh() {
    const res = await fetch('/api/admin/audits', {
      headers: { 'x-admin-token': password },
    })
    if (!res.ok) return
    const data = await res.json()
    setAudits(data.audits)
    setStats(data.stats)
  }

  async function deleteAudit(id: string) {
    await fetch('/api/admin/audits', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': password },
      body: JSON.stringify({ id }),
    })
    setAudits(prev => prev.filter(a => a.id !== id))
    setStats(prev => prev ? { ...prev, total: prev.total - 1 } : prev)
  }

  async function deleteAll() {
    if (!confirm(`Delete all ${audits.length} audits? This cannot be undone.`)) return
    await fetch('/api/admin/audits', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': password },
      body: JSON.stringify({}),
    })
    setAudits([])
    setStats(prev => prev ? { ...prev, total: 0, complete: 0, manual: 0, avgScore: 0, byRegion: {}, byAuditor: [], byDay: {} } : prev)
  }

  useEffect(() => {
    if (!authed) return
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  })

  const filtered = audits.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.siteUrl.toLowerCase().includes(q) || a.auditorName.toLowerCase().includes(q) || a.auditorEmail.toLowerCase().includes(q)
    const matchRegion = regionFilter === 'all' || a.region === regionFilter
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchRegion && matchStatus
  })

  const regions = [...new Set(audits.map(a => a.region))].filter(Boolean).sort()

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#DCE9E8' }}>
        <div className="bg-white rounded-3xl p-10 w-full max-w-sm" style={{ boxShadow: '0 8px 48px rgba(45,74,68,0.13)' }}>
          <div className="flex items-center gap-3 mb-8">
            <img src={LOGO} alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <p className="font-black text-gray-900 text-sm">CC Site Audit</p>
              <p className="text-gray-400 text-xs">Admin Dashboard</p>
            </div>
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-1">Admin access</h1>
          <p className="text-gray-400 text-sm mb-6">Enter the admin password to continue.</p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#2D4A44' } as React.CSSProperties}
          />
          {authError && <p className="text-red-500 text-xs mb-3">Incorrect password.</p>}
          <button
            onClick={login}
            disabled={loading}
            className="w-full text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60"
            style={{ backgroundColor: '#2D4A44' }}
          >
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#DCE9E8' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-white/60" style={{ backgroundColor: '#2D4A44' }}>
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="Logo" className="w-8 h-8 object-contain" />
          <div>
            <p className="text-white font-bold text-sm">CC Site Audit</p>
            <p className="text-white/40 text-xs">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} className="text-white/60 hover:text-white text-xs flex items-center gap-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <a href="/" className="text-white/60 hover:text-white text-xs transition-colors">← Back to app</a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Total Audits</p>
              <p className="text-4xl font-black" style={{ color: '#2D4A44' }}>{stats.total}</p>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Completed</p>
              <p className="text-4xl font-black text-green-500">{stats.complete}</p>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Unique Users</p>
              <p className="text-4xl font-black" style={{ color: '#C9A227' }}>{stats.byAuditor.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Avg Score</p>
              <p className={`text-4xl font-black ${scoreColor(stats.avgScore)}`}>{stats.avgScore || '—'}</p>
            </div>
          </div>
        )}

        {/* Charts row */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Activity — last 30 days */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 className="font-bold text-gray-900 mb-4">Audits — last 30 days</h2>
              <ActivityChart byDay={stats.byDay} />
            </div>

            {/* By Region */}
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 className="font-bold text-gray-900 mb-4">By Region</h2>
              <div className="space-y-3">
                {Object.entries(stats.byRegion).sort((a, b) => b[1] - a[1]).map(([region, count]) => (
                  <div key={region} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-14 font-medium">{region}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${(count / stats.total) * 100}%`, backgroundColor: '#2D4A44' }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top users */}
        {stats && stats.byAuditor.length > 0 && (
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-900 mb-4">Top Users</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.byAuditor.slice(0, 10).map(u => (
                <div key={u.email} className="rounded-xl bg-gray-50 p-3 text-center">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-2" style={{ backgroundColor: '#2D4A44' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  <p className="text-lg font-black mt-1" style={{ color: '#C9A227' }}>{u.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit table */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <h2 className="font-bold text-gray-900 flex-1">All Audits ({filtered.length})</h2>
            {audits.length > 0 && (
              <button
                onClick={deleteAll}
                className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-red-200"
              >
                Delete all
              </button>
            )}
            <input
              type="text"
              placeholder="Search URL, name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-xs w-56 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#2D4A44' } as React.CSSProperties}
            />
            <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none">
              <option value="all">All regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none">
              <option value="all">All statuses</option>
              {['complete', 'manual', 'running', 'pending', 'error'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Site</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Auditor</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Region</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Score</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{a.siteUrl}</p>
                      {a.opportunity && <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{a.opportunity}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{a.auditorName}</p>
                      <p className="text-xs text-gray-400">{a.auditorEmail}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{a.region}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-lg font-black ${scoreColor(a.overallScore)}`}>
                        {a.overallScore !== null ? `${a.overallScore}` : '—'}
                      </span>
                      {a.grade && <span className="text-xs text-gray-400 ml-1">({a.grade})</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/audit/${a.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium hover:underline"
                          style={{ color: '#2D4A44' }}
                        >
                          Audit
                        </a>
                        <span className="text-gray-200">|</span>
                        <a
                          href={`/share/${a.shareToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium hover:underline"
                          style={{ color: '#C9A227' }}
                        >
                          Share
                        </a>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => deleteAudit(a.id)}
                          className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">No audits match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityChart({ byDay }: { byDay: Record<string, number> }) {
  // Build last 30 days array
  const days: { date: string; label: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({
      date: key,
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      count: byDay[key] ?? 0,
    })
  }
  const max = Math.max(...days.map(d => d.count), 1)

  return (
    <div className="flex items-end gap-1 h-24">
      {days.map(d => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${Math.max((d.count / max) * 88, d.count > 0 ? 4 : 2)}px`,
              backgroundColor: d.count > 0 ? '#2D4A44' : '#e5e7eb',
            }}
          />
          {/* Tooltip on hover */}
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {d.label}: {d.count}
          </div>
        </div>
      ))}
    </div>
  )
}

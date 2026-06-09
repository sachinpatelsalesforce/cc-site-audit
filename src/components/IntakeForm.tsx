'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const REGIONS = ['AMER', 'EMEA', 'UKI', 'MEA', 'APAC']

export default function IntakeForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'automated' | 'manual'>('manual')
  const [form, setForm] = useState({
    siteUrl: '',
    auditorName: '',
    auditorEmail: '',
    opportunity: '',
    region: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, mode }),
      })
      if (!res.ok) throw new Error('Failed to start audit')
      const { id } = await res.json()
      router.push(`/audit/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Audit mode</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('automated')}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 transition-all text-left ${
              mode === 'automated'
                ? 'border-[#2D4A44] bg-[#2D4A44]/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 w-full">
              <svg className={`w-4 h-4 flex-shrink-0 ${mode === 'automated' ? 'text-[#2D4A44]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
              <span className={`text-sm font-semibold ${mode === 'automated' ? 'text-[#2D4A44]' : 'text-gray-700'}`}>Automated</span>
            </div>
            <p className="text-xs text-gray-400 w-full">Crawls the site automatically with AI analysis</p>
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 transition-all text-left ${
              mode === 'manual'
                ? 'border-[#2D4A44] bg-[#2D4A44]/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 w-full">
              <svg className={`w-4 h-4 flex-shrink-0 ${mode === 'manual' ? 'text-[#2D4A44]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className={`text-sm font-semibold ${mode === 'manual' ? 'text-[#2D4A44]' : 'text-gray-700'}`}>Manual</span>
            </div>
            <p className="text-xs text-gray-400 w-full">Browse the site in a split-pane and score it yourself</p>
          </button>
        </div>
      </div>

      {mode === 'automated' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <span className="text-lg flex-shrink-0">👋</span>
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold text-amber-900">Heads up — automated audits are a great starting point</span>, but they can miss things like personalisation, login-gated features, and dynamic content. You can review and adjust scores manually once the audit completes.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Site URL <span className="text-red-500">*</span></label>
        <input
          type="text"
          placeholder="https://www.example.com"
          value={form.siteUrl}
          onChange={e => set('siteUrl', e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D4A44] focus:border-transparent text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="Jane Smith"
            value={form.auditorName}
            onChange={e => set('auditorName', e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D4A44] text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            placeholder="jane@salesforce.com"
            value={form.auditorEmail}
            onChange={e => set('auditorEmail', e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D4A44] text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opportunity Name
            <span className="text-gray-400 font-normal ml-1 text-xs">(org62 link)</span>
          </label>
          <input
            type="text"
            placeholder="Paste org62 opportunity link"
            value={form.opportunity}
            onChange={e => set('opportunity', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D4A44] text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Region <span className="text-red-500">*</span></label>
          <select
            value={form.region}
            onChange={e => set('region', e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D4A44] text-sm bg-white"
          >
            <option value="">Please select</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
        style={{ backgroundColor: '#2D4A44' }}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Starting audit…
          </>
        ) : mode === 'manual' ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Start Manual Audit
          </>
        ) : (
          'Start Automated Audit'
        )}
      </button>
    </form>
  )
}

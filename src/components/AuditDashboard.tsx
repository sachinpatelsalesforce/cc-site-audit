'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AuditRecord, AuditResult, CategoryResult, Opportunity } from '@/types/audit'
import OverallScore from './OverallScore'
import CategoryCard from './CategoryCard'
import TechReport from './TechReport'
import CheckHintTooltip from './CheckHintTooltip'
import { getHint } from '@/lib/check-hints'
import type { CheckResult, CheckStatus } from '@/types/audit'

function logoUrl(siteUrl: string) {
  try {
    const host = new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`).hostname
    const key = process.env.NEXT_PUBLIC_LOGO_DEV_KEY
    return key ? `https://img.logo.dev/${host}?token=${key}&size=64&format=png` : null
  } catch {
    return null
  }
}

function BrandLogo({ siteUrl, size = 32, className = '' }: { siteUrl: string; size?: number; className?: string }) {
  const src = logoUrl(siteUrl)
  if (!src) return null
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
    />
  )
}

const STATUS_OPTIONS: { value: CheckStatus; label: string; colors: string }[] = [
  { value: 'pass',    label: 'Pass',    colors: 'bg-green-100 text-green-800 ring-green-300' },
  { value: 'partial', label: 'Partial', colors: 'bg-amber-100 text-amber-800 ring-amber-300' },
  { value: 'fail',    label: 'Gap',     colors: 'bg-red-100 text-red-800 ring-red-300' },
]

function InlineCheck({ check, editable, onChange }: {
  check: CheckResult
  editable: boolean
  onChange: (patch: Partial<CheckResult>) => void
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const bgClass = check.status === 'pass'
    ? 'border-green-100 bg-green-50'
    : check.status === 'partial'
    ? 'border-amber-100 bg-amber-50'
    : 'border-red-100 bg-red-50'

  return (
    <div className={`rounded-xl border p-4 ${bgClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 leading-snug">{check.label}</p>
          {getHint(check.id) && <CheckHintTooltip hint={getHint(check.id)!} />}
        </div>
        {editable ? (
          <div className="flex gap-1 flex-shrink-0">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange({ status: opt.value })}
                className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
                  check.status === opt.value ? `${opt.colors} ring-1` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
            check.status === 'pass' ? 'text-green-700 bg-green-100' :
            check.status === 'partial' ? 'text-amber-700 bg-amber-100' :
            'text-red-700 bg-red-100'
          }`}>
            {check.status === 'pass' ? 'Pass' : check.status === 'partial' ? 'Partial' : 'Gap'}
          </span>
        )}
      </div>
      {check.detail && <p className="text-xs text-gray-500 mt-1">{check.detail}</p>}
      {check.note && !noteOpen && <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">{check.note}</p>}
      {editable && noteOpen && (
        <div className="mt-2">
          <textarea
            autoFocus
            value={check.note || ''}
            onChange={e => onChange({ note: e.target.value })}
            placeholder="Add a note…"
            rows={2}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 resize-none bg-white"
            style={{ '--tw-ring-color': '#2D4A44' } as React.CSSProperties}
          />
          <button onClick={() => setNoteOpen(false)} className="mt-1 text-xs text-gray-400 hover:text-gray-600">Done</button>
        </div>
      )}
      {editable && !noteOpen && (
        <button
          onClick={() => setNoteOpen(true)}
          className="mt-1.5 text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {check.note ? 'Edit note' : 'Add note'}
        </button>
      )}
      {!editable && check.note && (
        <p className="text-xs text-gray-600 italic mt-2 pt-2 border-t border-white/60">{check.note}</p>
      )}
      {check.sfccValue && check.status !== 'pass' && (
        <div className="mt-2 pt-2 border-t border-white/60">
          <p className="text-xs text-[#032D60] flex items-start gap-1.5">
            <span className="text-[#0070D2] flex-shrink-0">💡</span>
            <span><strong className="text-[#0070D2]">SFCC:</strong> {check.sfccValue}</span>
          </p>
        </div>
      )}
    </div>
  )
}

function scoreToGrade(score: number) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function recalcOverall(categories: CategoryResult[]) {
  if (!categories.length) return 0
  return Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length)
}

function impactColor(impact: string) {
  if (impact === 'high') return { dot: 'bg-red-400', badge: 'text-red-700 bg-red-50 border-red-100' }
  if (impact === 'medium') return { dot: 'bg-amber-400', badge: 'text-amber-700 bg-amber-50 border-amber-100' }
  return { dot: 'bg-gray-300', badge: 'text-gray-600 bg-gray-50 border-gray-200' }
}

function AutomatedAccuracyBanner({ onEdit }: { onEdit: () => void }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-4">
      <span className="text-2xl flex-shrink-0 mt-0.5">👋</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 mb-1">Heads up — automated audits are a great starting point</p>
        <p className="text-sm text-amber-800 leading-relaxed">
          They can miss things like personalisation, login-gated features, and dynamic content.
          Take 5 minutes to walk through the site and tweak the scores using{' '}
          <button onClick={onEdit} className="font-semibold underline underline-offset-2 hover:text-amber-900 transition-colors">Edit Scores</button>.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type Tab = 'overview' | 'categories' | 'tech' | 'pages'

export default function AuditDashboard({ audit, isShare = false }: { audit: AuditRecord; isShare?: boolean }) {
  const initialResults = audit.results as AuditResult
  const [categories, setCategories] = useState<CategoryResult[]>(initialResults.categories)
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialResults.topOpportunities)
  const [overallScore, setOverallScore] = useState(initialResults.overallScore)
  const [grade, setGrade] = useState(initialResults.grade)
  const [copied, setCopied] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [activeCatIndex, setActiveCatIndex] = useState(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)

  function goToCategory(index: number) {
    setActiveCatIndex(index)
    setActiveTab('categories')
  }

  const passCount = categories.reduce((s, c) => s + c.checks.filter(ch => ch.status === 'pass').length, 0)
  const totalChecks = categories.reduce((s, c) => s + c.checks.length, 0)
  const gapCount = categories.reduce((s, c) => s + c.checks.filter(ch => ch.status === 'fail').length, 0)

  const save = useCallback(async (cats: CategoryResult[]) => {
    setSaveState('saving')
    try {
      const res = await fetch(`/api/audit/${audit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: cats }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOverallScore(data.overallScore)
      setGrade(data.grade)
      setOpportunities(data.topOpportunities)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
    }
  }, [audit.id])

  function handleCategoryUpdate(updated: CategoryResult) {
    const next = categories.map(c => c.id === updated.id ? updated : c)
    const newOverall = recalcOverall(next)
    setCategories(next)
    setOverallScore(newOverall)
    setGrade(scoreToGrade(newOverall))
    dirty.current = true
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      dirty.current = false
      save(next)
    }, 1500)
  }

  useEffect(() => {
    return () => {
      if (dirty.current && saveTimer.current) {
        clearTimeout(saveTimer.current)
        save(categories)
      }
    }
  }, [categories, save])

  function copyShareLink() {
    const url = `${window.location.origin}/share/${audit.shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'categories', label: 'All Categories' },
    { id: 'tech', label: 'Tech Stack' },
    { id: 'pages', label: 'Pages Crawled' },
  ]

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#DCE9E8' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ backgroundColor: '#2D4A44', minHeight: '100vh' }}>
        {/* Brand */}
        <div className="px-6 pt-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <img src="https://d3f1iyfxxz8i1e.cloudfront.net/courses/course_image/849736ed9ea6.png" alt="Logo" className="w-10 h-10 object-contain flex-shrink-0" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">Commerce Cloud</p>
              <p className="text-blue-300 text-xs">Site Audit</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2.5">
            <BrandLogo siteUrl={audit.siteUrl} size={28} className="rounded flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-white font-semibold text-xs truncate">{audit.siteUrl}</p>
              <p className="text-blue-300 text-xs mt-0.5">{audit.auditorName}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-hidden">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest pl-6 mb-3">Navigation</p>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 pl-4 pr-4 py-2.5 text-sm font-medium transition-all mb-0.5 text-left ${
                activeTab === tab.id
                  ? 'text-[#2D4A44] font-semibold rounded-l-xl'
                  : 'text-blue-300 hover:text-white hover:bg-white/5 rounded-l-xl'
              }`}
              style={activeTab === tab.id ? { backgroundColor: '#DCE9E8', marginRight: '-1px' } : {}}
            >
              {tab.id === 'overview' && (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )}
              {tab.id === 'categories' && (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )}
              {tab.id === 'tech' && (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              )}
              {tab.id === 'pages' && (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              )}
              {tab.label}
            </button>
          ))}

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest pl-6 mb-3">Actions</p>
            {!isShare && (
              <a
                href="/"
                className="w-full flex items-center gap-3 pl-4 pr-4 py-2.5 rounded-l-xl text-sm font-medium text-blue-300 hover:text-white hover:bg-white/5 transition-all mb-0.5"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Audit
              </a>
            )}
            {!isShare && (
              <button
                onClick={copyShareLink}
                className="w-full flex items-center gap-3 pl-4 pr-4 py-2.5 rounded-l-xl text-sm font-medium text-blue-300 hover:text-white hover:bg-white/5 transition-all mb-0.5"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {copied ? 'Copied!' : 'Share Link'}
              </button>
            )}
            <a
              href={`/api/audit/${audit.id}/pdf`}
              className="w-full flex items-center gap-3 pl-4 pr-4 py-2.5 rounded-l-xl text-sm font-medium text-blue-300 hover:text-white hover:bg-white/5 transition-all mb-0.5"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </a>
          </div>
        </nav>

        {/* Footer meta */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-blue-400 text-xs">{audit.region} · {audit.auditorEmail}</p>
          <p className="text-blue-500 text-xs mt-0.5">{new Date(initialResults.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">{activeTab === 'overview' ? 'Audit Overview' : activeTab === 'categories' ? 'All Categories' : activeTab === 'tech' ? 'Technology Report' : 'Pages Crawled'}</h1>
            <p className="text-gray-400 text-xs mt-0.5">Commerce Cloud Readiness Report</p>
          </div>
          <div className="flex items-center gap-3">
            {!isShare && saveState !== 'idle' && (
              <span className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                saveState === 'saving' ? 'bg-blue-50 text-blue-600' :
                saveState === 'saved' ? 'bg-green-50 text-green-600' :
                'bg-red-50 text-red-600'
              }`}>
                {saveState === 'saving' && <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : '⚠ Save failed'}
              </span>
            )}
            {!isShare && activeTab === 'overview' && (
              <button
                onClick={() => setActiveTab('categories')}
                className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-colors"
                style={{ backgroundColor: '#2D4A44' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Scores
              </button>
            )}
          </div>
        </header>

        <div className="p-8">
          {/* ── OVERVIEW TAB ──────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Site identity */}
              <div className="flex items-center gap-3">
                <BrandLogo siteUrl={audit.siteUrl} size={40} className="rounded-xl flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 text-base leading-tight">{audit.siteUrl}</p>
                  <p className="text-gray-400 text-xs mt-0.5">Audited by {audit.auditorName} · {new Date(audit.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              {/* Accuracy notice */}
              {!isShare && <AutomatedAccuracyBanner onEdit={() => setActiveTab('categories')} />}
              {/* Stat cards row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Score card — amber accent like reference image's hero card */}
                <div className="rounded-2xl p-5 text-white col-span-2 lg:col-span-1 flex flex-col justify-between min-h-[140px]" style={{ backgroundColor: '#C9A227' }}>
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">Overall Score</p>
                  <div>
                    <p className="text-5xl font-black leading-none">{overallScore}</p>
                    <p className="text-white/80 text-sm mt-1">Grade {grade}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 flex flex-col justify-between min-h-[140px]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Checks Passed</p>
                  <div>
                    <p className="text-4xl font-black text-green-500">{passCount}</p>
                    <p className="text-gray-400 text-xs mt-1">of {totalChecks} total</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 flex flex-col justify-between min-h-[140px]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Gaps Found</p>
                  <div>
                    <p className="text-4xl font-black text-red-500">{gapCount}</p>
                    <p className="text-gray-400 text-xs mt-1">across all categories</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 flex flex-col justify-between min-h-[140px]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Lighthouse</p>
                  <div>
                    <p className={`text-4xl font-black ${
                      initialResults.lighthouseScore == null ? 'text-gray-300' :
                      initialResults.lighthouseScore >= 90 ? 'text-green-500' :
                      initialResults.lighthouseScore >= 50 ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {initialResults.lighthouseScore ?? '—'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">performance score</p>
                  </div>
                </div>
              </div>

              {/* Score gauge + opportunities */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gauge */}
                <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <OverallScore score={overallScore} grade={grade} />
                  <div className="mt-4 w-full space-y-2">
                    {categories.slice(0, 4).map(cat => (
                      <div key={cat.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-28 truncate">{cat.name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${cat.score >= 70 ? 'bg-green-400' : cat.score >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${cat.score}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{cat.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Opportunities */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C9A227' }}>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    Top SFCC Opportunities
                  </h2>
                  {opportunities.length === 0 ? (
                    <p className="text-gray-400 text-sm">No opportunities detected yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {opportunities.map((op, i) => {
                        const { dot, badge } = impactColor(op.impact)
                        return (
                          <div key={op.checkId} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ backgroundColor: '#2D4A44' }}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-xs text-gray-400">{op.categoryName}</span>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                                <span className="text-sm font-semibold text-gray-800">{op.checkLabel}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge}`}>
                                  {op.impact.charAt(0).toUpperCase() + op.impact.slice(1)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed">{op.sfccValue}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Category score cards — mini preview */}
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Category Scores</h2>
                  {!isShare && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Click to edit
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {categories.map((cat, i) => (
                    <div
                      key={cat.id}
                      onClick={() => goToCategory(i)}
                      className="flex flex-col items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors text-center"
                    >
                      <span className="text-2xl mb-1">{cat.icon}</span>
                      <span className={`text-lg font-black ${cat.score >= 70 ? 'text-green-500' : cat.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{cat.score}%</span>
                      <span className="text-xs text-gray-400 mt-0.5 leading-tight">{cat.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CATEGORIES TAB ───────────────────────────────────── */}
          {activeTab === 'categories' && (() => {
            const cat = categories[activeCatIndex]
            const totalCats = categories.length
            return (
              <div className="space-y-4">
                {/* Category strip nav */}
                <div className="bg-white rounded-2xl p-3 flex items-center gap-1 overflow-x-auto" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  {categories.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCatIndex(i)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                        i === activeCatIndex ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                      style={i === activeCatIndex ? { backgroundColor: '#2D4A44' } : {}}
                    >
                      <span>{c.icon}</span>
                      <span>{c.name}</span>
                      <span className={`font-bold ml-0.5 ${i === activeCatIndex ? 'text-white/70' : c.score >= 70 ? 'text-green-500' : c.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {c.score}%
                      </span>
                    </button>
                  ))}
                </div>

                {/* Full-page category detail */}
                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  {/* Category header */}
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: '#2D4A44' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cat.icon}</span>
                      <div>
                        <h2 className="font-bold text-white text-lg">{cat.name}</h2>
                        <p className="text-blue-300 text-xs">
                          {cat.checks.filter(c => c.status === 'pass').length} passed · {cat.checks.filter(c => c.status === 'fail').length} gaps · {cat.checks.length} total
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-3xl font-black ${cat.score >= 70 ? 'text-green-400' : cat.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {cat.score}%
                        </div>
                        <div className="w-24 bg-white/20 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${cat.score >= 70 ? 'bg-green-400' : cat.score >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${cat.score}%` }}
                          />
                        </div>
                      </div>
                      {!isShare && (
                        <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-1 rounded-lg font-medium border border-amber-400/30">
                          Editing
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checks list — full width, no drawer */}
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {cat.checks.map(check => (
                      <InlineCheck
                        key={check.id}
                        check={check}
                        editable={!isShare}
                        onChange={patch => {
                          const updatedChecks = cat.checks.map(c => c.id === check.id ? { ...c, ...patch } : c)
                          handleCategoryUpdate({ ...cat, checks: updatedChecks })
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Prev / Next navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveCatIndex(i => Math.max(0, i - 1))}
                    disabled={activeCatIndex === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    {activeCatIndex > 0 ? categories[activeCatIndex - 1].name : 'Previous'}
                  </button>
                  <span className="text-xs text-gray-400">{activeCatIndex + 1} of {totalCats}</span>
                  <button
                    onClick={() => setActiveCatIndex(i => Math.min(totalCats - 1, i + 1))}
                    disabled={activeCatIndex === totalCats - 1}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  >
                    {activeCatIndex < totalCats - 1 ? categories[activeCatIndex + 1].name : 'Next'}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })()}

          {/* ── TECH TAB ─────────────────────────────────────────── */}
          {activeTab === 'tech' && (
            initialResults.techStack
              ? <TechReport techStack={initialResults.techStack} />
              : (
                <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <p className="text-gray-400">Technology data not available for this audit.</p>
                </div>
              )
          )}

          {/* ── PAGES TAB ────────────────────────────────────────── */}
          {activeTab === 'pages' && (
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 className="font-bold text-gray-900 mb-4">Pages Crawled</h3>
              {initialResults.crawledPages && Object.values(initialResults.crawledPages).some(Boolean) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(initialResults.crawledPages).map(([type, url]) => url && (
                    <div key={type} className="rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-500 uppercase tracking-wide text-xs mb-1">{type}</p>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{url}</a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No crawled pages recorded (manual audit).</p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pb-8">
          Generated by Salesforce Commerce Cloud Site Audit Tool · {audit.auditorEmail}
        </p>
      </main>
    </div>
  )
}

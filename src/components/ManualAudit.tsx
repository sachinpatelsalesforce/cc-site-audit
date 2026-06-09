'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AuditRecord, AuditResult, CategoryResult, CheckResult, CheckStatus } from '@/types/audit'
import TechReport from './TechReport'
import CheckHintTooltip from './CheckHintTooltip'
import { getHint } from '@/lib/check-hints'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const STATUS_OPTIONS: { value: CheckStatus; label: string; colors: string }[] = [
  { value: 'pass',    label: 'Pass',    colors: 'bg-green-100 text-green-800 ring-green-300' },
  { value: 'partial', label: 'Partial', colors: 'bg-amber-100 text-amber-800 ring-amber-300' },
  { value: 'fail',    label: 'Gap',     colors: 'bg-red-100 text-red-800 ring-red-300' },
]

function scoreColor(score: number) {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

function calcScore(checks: CheckResult[]) {
  const earned = checks.reduce((s, c) => s + (c.status === 'pass' ? 2 : c.status === 'partial' ? 1 : 0), 0)
  return checks.length === 0 ? 0 : Math.round((earned / (checks.length * 2)) * 100)
}

function overallScore(categories: CategoryResult[]) {
  if (!categories.length) return 0
  return Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length)
}

type IframeMode = 'direct' | 'proxy' | 'blocked'

function IframePanel({ siteUrl }: { siteUrl: string }) {
  const [mode, setMode] = useState<IframeMode>('direct')
  const [proxyReady, setProxyReady] = useState(false)
  const normalised = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(normalised)}`

  // Detect whether the direct iframe was blocked by checking if the frame
  // loaded but reports an empty location (X-Frame-Options blocks).
  // We use a short timer after load — if contentDocument is null or blank, switch to proxy.
  function handleDirectLoad(e: React.SyntheticEvent<HTMLIFrameElement>) {
    const iframe = e.currentTarget
    try {
      const doc = iframe.contentDocument
      if (!doc || doc.location.href === 'about:blank') {
        setMode('proxy')
      }
      // else: loaded successfully — leave as direct
    } catch {
      // Security error means cross-origin load succeeded (can't read document, but it rendered)
      // This is actually fine — leave as direct
    }
  }

  function handleDirectError() {
    setMode('proxy')
  }

  function handleProxyLoad() {
    setProxyReady(true)
  }

  function handleProxyError() {
    setMode('blocked')
  }

  const displayUrl = mode === 'proxy' ? `${normalised} (via proxy)` : normalised

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-amber-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <div className="flex flex-1 items-center gap-2 bg-gray-700 rounded px-3 py-1 min-w-0">
          {mode === 'proxy' && (
            <span className="text-[#0070D2] text-xs font-medium flex-shrink-0">proxy</span>
          )}
          <span className="text-xs text-gray-300 truncate">{displayUrl}</span>
        </div>
        <a
          href={normalised}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Blocked fallback */}
      {mode === 'blocked' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <div>
            <p className="text-gray-400 font-medium mb-1">Site blocked embedding</p>
            <p className="text-gray-500 text-sm mb-4">
              This site uses aggressive frame-busting that prevents embedding even via proxy.
              Open it in a new tab and use the checklist alongside it.
            </p>
            <a
              href={normalised}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0070D2] hover:bg-[#005fb2] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open {siteUrl} in new tab
            </a>
          </div>
        </div>
      )}

      {/* Direct iframe — hidden once we know we need proxy, but kept in DOM briefly to detect */}
      {mode === 'direct' && (
        <iframe
          src={normalised}
          className="flex-1 w-full border-0"
          onLoad={handleDirectLoad}
          onError={handleDirectError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          title={`Preview of ${siteUrl}`}
        />
      )}

      {/* Proxy iframe */}
      {mode === 'proxy' && (
        <div className="flex-1 relative">
          {!proxyReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-gray-400 text-xs">Loading via proxy…</p>
              </div>
            </div>
          )}
          <iframe
            src={proxyUrl}
            className="w-full h-full border-0"
            onLoad={handleProxyLoad}
            onError={handleProxyError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title={`Proxy preview of ${siteUrl}`}
          />
        </div>
      )}
    </div>
  )
}

interface CheckRowProps {
  check: CheckResult
  onChange: (patch: Partial<CheckResult>) => void
}

function CheckRow({ check, onChange }: CheckRowProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const bgClass = check.status === 'pass'
    ? 'border-green-100 bg-green-50'
    : check.status === 'partial'
    ? 'border-amber-100 bg-amber-50'
    : 'border-red-100 bg-red-50'

  return (
    <div className={`rounded-lg border ${bgClass} p-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-snug">{check.label}</p>
          {getHint(check.id) && <CheckHintTooltip hint={getHint(check.id)!} />}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ status: opt.value })}
              className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
                check.status === opt.value
                  ? `${opt.colors} ring-1`
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {check.note && !noteOpen && (
        <p className="text-xs text-gray-500 italic mt-1.5 line-clamp-2">{check.note}</p>
      )}

      {noteOpen && (
        <div className="mt-2">
          <textarea
            autoFocus
            value={check.note || ''}
            onChange={e => onChange({ note: e.target.value })}
            placeholder="Add a note (e.g. 'Behind login', 'Uses Nosto')…"
            rows={2}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0070D2] resize-none bg-white"
          />
          <button onClick={() => setNoteOpen(false)} className="mt-1 text-xs text-gray-400 hover:text-gray-600">Done</button>
        </div>
      )}

      {!noteOpen && (
        <button
          onClick={() => setNoteOpen(true)}
          className="mt-1.5 text-xs text-gray-400 hover:text-[#0070D2] flex items-center gap-1 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {check.note ? 'Edit note' : 'Add note'}
        </button>
      )}

      {check.sfccValue && check.status !== 'pass' && (
        <div className="mt-2 pt-2 border-t border-white/60">
          <p className="text-xs text-[#032D60] flex items-start gap-1.5">
            <span className="text-[#0070D2] mt-0.5 flex-shrink-0">💡</span>
            <span><strong className="text-[#0070D2]">SFCC:</strong> {check.sfccValue}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default function ManualAudit({ audit }: { audit: AuditRecord }) {
  const initialResults = audit.results as AuditResult
  const [categories, setCategories] = useState<CategoryResult[]>(initialResults.categories)
  const [activeCatId, setActiveCatId] = useState<string>(initialResults.categories[0]?.id ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [finished, setFinished] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)

  const overall = overallScore(categories)
  const activeCat = categories.find(c => c.id === activeCatId) ?? categories[0]

  const save = useCallback(async (cats: CategoryResult[]) => {
    setSaveState('saving')
    try {
      const res = await fetch(`/api/audit/${audit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: cats }),
      })
      if (!res.ok) throw new Error()
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
    }
  }, [audit.id])

  function updateCheck(catId: string, checkId: string, patch: Partial<CheckResult>) {
    const next = categories.map(cat => {
      if (cat.id !== catId) return cat
      const checks = cat.checks.map(c => c.id === checkId ? { ...c, ...patch } : c)
      return { ...cat, checks, score: calcScore(checks) }
    })
    setCategories(next)
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

  async function finishAudit() {
    await save(categories)
    // Mark as complete
    await fetch(`/api/audit/${audit.id}/finish`, { method: 'POST' })
    setFinished(true)
    window.location.href = `/audit/${audit.id}/results`
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-[#032D60] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#2D4A44' }}>
      {/* Top bar */}
      <header className="text-white flex-shrink-0 z-20" style={{ backgroundColor: '#2D4A44' }}>
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src="https://d3f1iyfxxz8i1e.cloudfront.net/courses/course_image/849736ed9ea6.png" alt="Logo" className="w-7 h-7 object-contain flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight">Manual Audit</span>
              <span className="text-blue-300 text-xs ml-2 truncate hidden sm:inline">{audit.siteUrl}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href="/"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Audit
            </a>

            <div className="text-center hidden sm:block">
              <div className={`text-lg font-black ${scoreColor(overall)}`}>{overall}%</div>
              <div className="text-xs text-blue-300">Overall</div>
            </div>

            {saveState !== 'idle' && (
              <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                saveState === 'saving' ? 'text-blue-200' :
                saveState === 'saved' ? 'text-green-300' : 'text-red-300'
              }`}>
                {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : '⚠ Error'}
              </span>
            )}

            <button
              onClick={finishAudit}
              className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              style={{ backgroundColor: '#C9A227' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Finish Audit
            </button>
          </div>
        </div>
      </header>

      {/* Body: iframe | category nav | checklist */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: site preview */}
        <div className="flex-1 overflow-hidden">
          <IframePanel siteUrl={audit.siteUrl} />
        </div>

        {/* Middle: vertical category nav */}
        <div className="w-44 flex-shrink-0 flex flex-col overflow-y-auto border-l border-white/10 py-3 overflow-hidden" style={{ backgroundColor: '#2D4A44' }}>
          {categories.map(cat => {
            const score = cat.score
            const isActive = cat.id === activeCatId
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCatId(cat.id)}
                className={`flex items-center gap-2 pl-2 pr-2 py-2 text-xs font-medium transition-all w-full text-left mb-0.5 ${
                  isActive
                    ? 'text-[#2D4A44] font-semibold rounded-l-xl'
                    : 'text-blue-300 hover:text-white hover:bg-white/5 rounded-l-xl'
                }`}
                style={isActive ? { backgroundColor: '#DCE9E8', marginRight: '-1px' } : {}}
              >
                <span className="flex-shrink-0">{cat.icon}</span>
                <span className="flex-1 leading-tight truncate">{cat.name}</span>
                <span className={`text-xs font-bold flex-shrink-0 ${
                  isActive ? 'text-[#2D4A44]/60' :
                  score >= 70 ? 'text-green-400' :
                  score >= 40 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {score}%
                </span>
              </button>
            )
          })}
          {/* Tech Stack — always 100% */}
          <div className="mt-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setActiveCatId('tech')}
              className={`flex items-center gap-2 pl-2 pr-2 py-2 text-xs font-medium transition-all w-full text-left mb-0.5 ${
                activeCatId === 'tech'
                  ? 'text-[#2D4A44] font-semibold rounded-l-xl'
                  : 'text-blue-300 hover:text-white hover:bg-white/5 rounded-l-xl'
              }`}
              style={activeCatId === 'tech' ? { backgroundColor: '#DCE9E8', marginRight: '-1px' } : {}}
            >
              <span className="flex-shrink-0">🔬</span>
              <span className="flex-1 leading-tight truncate">Tech Stack</span>
              <span className={`text-xs font-bold flex-shrink-0 ${activeCatId === 'tech' ? 'text-[#2D4A44]/60' : 'text-green-400'}`}>100%</span>
            </button>
          </div>
        </div>

        {/* Right: checklist panel or tech report */}
        <div className="w-[400px] flex-shrink-0 bg-white flex flex-col overflow-hidden border-l border-gray-200">
          {activeCatId === 'tech' ? (
            <>
              <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔬</span>
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">Tech Stack</h2>
                      <p className="text-xs text-gray-400">Detected automatically</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-green-500">100%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-green-500 w-full transition-all" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {(audit.results as AuditResult).techStack ? (
                  <TechReport techStack={(audit.results as AuditResult).techStack!} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm p-8 text-center">
                    Tech stack is being detected in the background. Check back shortly.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Active category header */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeCat?.icon}</span>
                    <div>
                      <h2 className="font-bold text-gray-900 text-sm">{activeCat?.name}</h2>
                      <p className="text-xs text-gray-400">
                        {activeCat?.checks.filter(c => c.status === 'pass').length}/{activeCat?.checks.length} passed
                      </p>
                    </div>
                  </div>
                  <span className={`text-xl font-black ${scoreColor(activeCat?.score ?? 0)}`}>
                    {activeCat?.score ?? 0}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      (activeCat?.score ?? 0) >= 70 ? 'bg-green-500' :
                      (activeCat?.score ?? 0) >= 40 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${activeCat?.score ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {activeCat?.checks.map(check => (
                  <CheckRow
                    key={check.id}
                    check={check}
                    onChange={patch => updateCheck(activeCat.id, check.id, patch)}
                  />
                ))}
              </div>

              {/* Prev / Next footer */}
              <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
                <button
                  onClick={() => {
                    const idx = categories.findIndex(c => c.id === activeCatId)
                    if (idx > 0) setActiveCatId(categories[idx - 1].id)
                  }}
                  disabled={categories.findIndex(c => c.id === activeCatId) === 0}
                  className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Prev
                </button>
                <span className="text-xs text-gray-400">
                  {categories.findIndex(c => c.id === activeCatId) + 1} / {categories.length}
                </span>
                <button
                  onClick={() => {
                    const idx = categories.findIndex(c => c.id === activeCatId)
                    if (idx < categories.length - 1) setActiveCatId(categories[idx + 1].id)
                  }}
                  disabled={categories.findIndex(c => c.id === activeCatId) === categories.length - 1}
                  className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 flex items-center gap-1 transition-colors"
                >
                  Next
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

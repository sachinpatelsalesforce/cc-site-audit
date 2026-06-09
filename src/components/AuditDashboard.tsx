'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AuditRecord, AuditResult, CategoryResult, Opportunity } from '@/types/audit'
import OverallScore from './OverallScore'
import CategoryCard from './CategoryCard'

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

function impactBadge(impact: string) {
  if (impact === 'high') return <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">High Impact</span>
  if (impact === 'medium') return <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Medium Impact</span>
  return <span className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">Low Impact</span>
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function AuditDashboard({ audit, isShare = false }: { audit: AuditRecord; isShare?: boolean }) {
  const initialResults = audit.results as AuditResult
  const [categories, setCategories] = useState<CategoryResult[]>(initialResults.categories)
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialResults.topOpportunities)
  const [overallScore, setOverallScore] = useState(initialResults.overallScore)
  const [grade, setGrade] = useState(initialResults.grade)
  const [copied, setCopied] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)

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

    // Debounce save — 1.5s after last edit
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      dirty.current = false
      save(next)
    }, 1500)
  }

  // Save on unmount if there are unsaved changes
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

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top bar */}
      <header className="bg-[#032D60] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#0070D2] rounded-lg p-1.5">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight">Commerce Cloud Site Audit</span>
            </div>
            <span className="text-blue-300 text-sm hidden sm:block">|</span>
            <span className="text-blue-200 text-sm hidden sm:block truncate max-w-xs">{audit.siteUrl}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Save indicator — only shown to auditor */}
            {!isShare && saveState !== 'idle' && (
              <span className={`text-xs px-2 py-1 rounded-md flex items-center gap-1.5 ${
                saveState === 'saving' ? 'text-blue-200' :
                saveState === 'saved' ? 'text-green-300' :
                'text-red-300'
              }`}>
                {saveState === 'saving' && (
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                )}
                {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : '⚠ Save failed'}
              </span>
            )}

            {!isShare && (
              <button
                onClick={copyShareLink}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {copied ? 'Copied!' : 'Share'}
              </button>
            )}
            <a
              href={`/api/audit/${audit.id}/pdf`}
              className="flex items-center gap-1.5 bg-[#0070D2] hover:bg-[#005fb2] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </a>
          </div>
        </div>
      </header>

      {/* Meta bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6 text-xs text-gray-500 flex-wrap">
          <span>Audited by <strong className="text-gray-700">{audit.auditorName}</strong></span>
          <span>Region: <strong className="text-gray-700">{audit.region}</strong></span>
          {audit.opportunity && <span>Opportunity: <strong className="text-gray-700 truncate max-w-xs">{audit.opportunity}</strong></span>}
          <span>Completed: <strong className="text-gray-700">{new Date(initialResults.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
          {!isShare && (
            <span className="ml-auto text-blue-600 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Click any card to edit results
            </span>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#032D60] to-[#0070D2] rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <OverallScore score={overallScore} grade={grade} />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold mb-1">{audit.siteUrl}</h1>
              <p className="text-blue-200 text-sm mb-4">Commerce Cloud Readiness Report</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-green-400">{passCount}</div>
                  <div className="text-xs text-blue-200 mt-0.5">Checks Passed</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-red-400">{gapCount}</div>
                  <div className="text-xs text-blue-200 mt-0.5">Gaps Found</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-white">{totalChecks}</div>
                  <div className="text-xs text-blue-200 mt-0.5">Total Checks</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Opportunities */}
        {opportunities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#0070D2] rounded flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Top SFCC Opportunities
            </h2>
            <div className="grid gap-3">
              {opportunities.map((op, i) => (
                <div key={op.checkId} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#0070D2]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[#0070D2] font-bold text-sm">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs text-gray-400 font-medium">{op.categoryName}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm font-semibold text-gray-800">{op.checkLabel}</span>
                      {impactBadge(op.impact)}
                    </div>
                    <p className="text-sm text-gray-600">{op.sfccValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Grid */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#0070D2] rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </span>
            All Categories
            <span className="text-sm text-gray-400 font-normal">
              {isShare ? '— click any card for details' : '— click any card to view or edit'}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <CategoryCard
                key={cat.id}
                category={cat}
                editable={!isShare}
                onUpdate={isShare ? undefined : handleCategoryUpdate}
              />
            ))}
          </div>
        </div>

        {/* Crawled pages */}
        {initialResults.crawledPages && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pages Crawled</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {Object.entries(initialResults.crawledPages).map(([type, url]) => url && (
                <div key={type} className="bg-gray-50 rounded-lg p-2.5">
                  <p className="font-medium text-gray-500 uppercase tracking-wide text-[10px] mb-1">{type}</p>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#0070D2] hover:underline truncate block">{url}</a>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Generated by Salesforce Commerce Cloud Site Audit Tool · {audit.auditorEmail}
        </p>
      </main>
    </div>
  )
}

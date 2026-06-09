'use client'

import { useState } from 'react'
import type { CategoryResult, CheckResult, CheckStatus } from '@/types/audit'

function scoreColor(score: number) {
  if (score >= 70) return 'bg-green-500'
  if (score >= 40) return 'bg-amber-400'
  return 'bg-red-500'
}

function scoreTextColor(score: number) {
  if (score >= 70) return 'text-green-600'
  if (score >= 40) return 'text-amber-500'
  return 'text-red-500'
}

const STATUS_OPTIONS: { value: CheckStatus; label: string; colors: string }[] = [
  { value: 'pass',    label: 'Pass',    colors: 'bg-green-100 text-green-800 ring-green-300' },
  { value: 'partial', label: 'Partial', colors: 'bg-amber-100 text-amber-800 ring-amber-300' },
  { value: 'fail',    label: 'Gap',     colors: 'bg-red-100 text-red-800 ring-red-300' },
]

function StatusToggle({ status, onChange }: { status: CheckStatus; onChange: (s: CheckStatus) => void }) {
  return (
    <div className="flex gap-1 flex-shrink-0">
      {STATUS_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all ${
            status === opt.value
              ? `${opt.colors} ring-1`
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

interface Props {
  category: CategoryResult
  editable?: boolean
  onUpdate?: (updated: CategoryResult) => void
}

export default function CategoryCard({ category, editable = false, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [checks, setChecks] = useState<CheckResult[]>(category.checks)
  const [expandedNote, setExpandedNote] = useState<string | null>(null)

  const currentScore = Math.round(
    checks.reduce((sum, c) => sum + (c.status === 'pass' ? 2 : c.status === 'partial' ? 1 : 0), 0)
    / (checks.length * 2) * 100
  )
  const gaps = checks.filter(c => c.status !== 'pass')
  const passed = checks.filter(c => c.status === 'pass').length

  function updateCheck(id: string, patch: Partial<CheckResult>) {
    const updated = checks.map(c => c.id === id ? { ...c, ...patch } : c)
    setChecks(updated)
    onUpdate?.({ ...category, checks: updated, score: currentScore })
  }

  return (
    <>
      <div
        className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-[#0070D2] transition-all"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{category.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{passed}/{checks.length} checks passed</p>
            </div>
          </div>
          <span className={`text-lg font-bold ${scoreTextColor(currentScore)}`}>
            {currentScore}%
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all ${scoreColor(currentScore)}`}
            style={{ width: `${currentScore}%` }}
          />
        </div>

        {gaps.length > 0 && (
          <div className="space-y-1">
            {gaps.slice(0, 3).map(gap => (
              <div key={gap.id} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 truncate">{gap.label}</span>
              </div>
            ))}
            {gaps.length > 3 && (
              <p className="text-xs text-gray-400 ml-3">+{gaps.length - 3} more gaps</p>
            )}
          </div>
        )}

        <p className="text-xs text-[#0070D2] mt-3 font-medium">
          {editable ? 'View & edit details →' : 'View details →'}
        </p>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white h-full w-full max-w-lg shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h2 className="font-bold text-gray-900">{category.name}</h2>
                  <p className="text-xs text-gray-400">{currentScore}% score</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {editable && (
                  <span className="text-xs text-[#0070D2] bg-blue-50 px-2 py-1 rounded-md font-medium">
                    Editing
                  </span>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {editable && (
              <div className="mx-6 mt-4 mb-0 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Override any check result — scores update live and auto-save.
              </div>
            )}

            <div className="p-6 space-y-3">
              {checks.map(check => {
                const isNoteOpen = expandedNote === check.id
                const bgClass = check.status === 'pass'
                  ? 'border-green-100 bg-green-50'
                  : check.status === 'partial'
                  ? 'border-amber-100 bg-amber-50'
                  : 'border-red-100 bg-red-50'

                return (
                  <div key={check.id} className={`rounded-lg border ${bgClass} overflow-hidden`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="text-sm font-medium text-gray-800 flex-1 leading-snug">{check.label}</p>
                        {editable
                          ? <StatusToggle status={check.status} onChange={s => updateCheck(check.id, { status: s })} />
                          : (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                              check.status === 'pass' ? 'text-green-700 bg-green-100' :
                              check.status === 'partial' ? 'text-amber-700 bg-amber-100' :
                              'text-red-700 bg-red-100'
                            }`}>
                              {check.status === 'pass' ? 'Pass' : check.status === 'partial' ? 'Partial' : 'Gap'}
                            </span>
                          )
                        }
                      </div>

                      {check.detail && (
                        <p className="text-xs text-gray-500 mb-1">{check.detail}</p>
                      )}

                      {/* Existing note preview */}
                      {check.note && !isNoteOpen && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <svg className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <p className="text-xs text-gray-600 italic line-clamp-2">{check.note}</p>
                        </div>
                      )}

                      {/* Note editor */}
                      {editable && isNoteOpen && (
                        <div className="mt-2">
                          <textarea
                            autoFocus
                            value={check.note || ''}
                            onChange={e => updateCheck(check.id, { note: e.target.value })}
                            placeholder="Add a note for context (e.g. 'Found behind login', 'Uses Nosto for recs')…"
                            rows={3}
                            className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070D2] resize-none bg-white"
                          />
                          <button
                            onClick={() => setExpandedNote(null)}
                            className="mt-1 text-xs text-gray-500 hover:text-gray-700"
                          >
                            Done
                          </button>
                        </div>
                      )}

                      {/* Add / edit note button */}
                      {editable && !isNoteOpen && (
                        <button
                          onClick={() => setExpandedNote(check.id)}
                          className="mt-2 text-xs text-gray-400 hover:text-[#0070D2] flex items-center gap-1 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          {check.note ? 'Edit note' : 'Add note'}
                        </button>
                      )}

                      {/* Read-only note on share view */}
                      {!editable && check.note && (
                        <div className="mt-2 pt-2 border-t border-white/60">
                          <p className="text-xs text-gray-600 italic flex items-start gap-1.5">
                            <svg className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            {check.note}
                          </p>
                        </div>
                      )}

                      {check.sfccValue && check.status !== 'pass' && (
                        <div className="mt-2 pt-2 border-t border-white/60">
                          <p className="text-xs font-medium text-[#032D60] flex items-start gap-1.5">
                            <span className="text-[#0070D2] mt-0.5 flex-shrink-0">💡</span>
                            <span><strong className="text-[#0070D2]">SFCC Opportunity:</strong> {check.sfccValue}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

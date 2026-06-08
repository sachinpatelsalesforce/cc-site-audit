'use client'

import { useState } from 'react'
import type { CategoryResult, CheckResult } from '@/types/audit'

function statusColor(score: number) {
  if (score >= 70) return 'bg-green-500'
  if (score >= 40) return 'bg-amber-400'
  return 'bg-red-500'
}

function statusBadge(status: CheckResult['status']) {
  if (status === 'pass') return <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Pass</span>
  if (status === 'partial') return <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Partial</span>
  return <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Gap</span>
}

export default function CategoryCard({ category }: { category: CategoryResult }) {
  const [open, setOpen] = useState(false)
  const gaps = category.checks.filter(c => c.status !== 'pass')
  const passed = category.checks.filter(c => c.status === 'pass').length

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
              <p className="text-xs text-gray-400 mt-0.5">{passed}/{category.checks.length} checks passed</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold ${category.score >= 70 ? 'text-green-600' : category.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {category.score}%
            </span>
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all ${statusColor(category.score)}`}
            style={{ width: `${category.score}%` }}
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

        <p className="text-xs text-[#0070D2] mt-3 font-medium">View details →</p>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white h-full w-full max-w-lg shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h2 className="font-bold text-gray-900">{category.name}</h2>
                  <p className="text-xs text-gray-400">{category.score}% score</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-3">
              {category.checks.map(check => (
                <div key={check.id} className={`p-4 rounded-lg border ${check.status === 'pass' ? 'border-green-100 bg-green-50' : check.status === 'partial' ? 'border-amber-100 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-gray-800 flex-1">{check.label}</p>
                    {statusBadge(check.status)}
                  </div>
                  {check.detail && (
                    <p className="text-xs text-gray-500 mt-1">{check.detail}</p>
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
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

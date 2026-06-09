'use client'

import { useState } from 'react'
import type { TechStackResult, TechItem } from '@/types/audit'

const CATEGORY_ICONS: Record<string, string> = {
  'Ecommerce Platform': '🛍️',
  'Search': '🔍',
  'Personalisation': '🎯',
  'Marketing Automation': '📧',
  'Live Chat & Support': '💬',
  'Reviews & Ratings': '⭐',
  'Loyalty': '🏆',
  'Order Management': '📦',
  'Payment': '💳',
  'A/B Testing': '🧪',
  'Analytics': '📊',
  'Tag Management': '🏷️',
  'CDN': '🌐',
  'Hosting': '🖥️',
  'CMS': '📝',
  'JavaScript Framework': '⚡',
}

// Categories where we want to highlight SFCC opportunities
const COMPETITOR_CATEGORIES = new Set([
  'Ecommerce Platform', 'Search', 'Personalisation', 'Marketing Automation',
  'Live Chat & Support', 'Loyalty', 'Order Management', 'A/B Testing', 'Reviews & Ratings',
])

function ConfidenceDot({ confidence }: { confidence: TechItem['confidence'] }) {
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        confidence === 'high' ? 'bg-green-400' :
        confidence === 'medium' ? 'bg-amber-400' : 'bg-gray-300'
      }`}
      title={`${confidence} confidence`}
    />
  )
}

function TechCard({ item }: { item: TechItem }) {
  const [expanded, setExpanded] = useState(false)
  const isCompetitor = COMPETITOR_CATEGORIES.has(item.category) && item.sfccOpportunity &&
    item.name !== 'Salesforce Commerce Cloud' &&
    !item.name.startsWith('Salesforce')

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${
      isCompetitor ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'
    }`}>
      <div className="flex items-center gap-2">
        <ConfidenceDot confidence={item.confidence} />
        <span className="text-sm font-medium text-gray-800 flex-1">{item.name}</span>
        {isCompetitor && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[#0070D2] hover:text-[#005fb2] flex-shrink-0"
            title="SFCC opportunity"
          >
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
      {expanded && item.sfccOpportunity && (
        <div className="mt-2 pt-2 border-t border-amber-200">
          <p className="text-xs text-[#032D60] flex items-start gap-1.5">
            <span className="text-[#0070D2] flex-shrink-0">💡</span>
            <span><strong className="text-[#0070D2]">SFCC Opportunity:</strong> {item.sfccOpportunity}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default function TechReport({ techStack }: { techStack: TechStackResult }) {
  const { categories, technologies } = techStack
  const catEntries = Object.entries(categories)
  const competitorCount = technologies.filter(t =>
    COMPETITOR_CATEGORIES.has(t.category) &&
    t.sfccOpportunity &&
    !t.name.startsWith('Salesforce')
  ).length

  if (!technologies.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <p className="text-gray-400 text-sm">No technologies detected — the site may have blocked the fingerprinting request.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <span>🔬</span> Technology Report
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {technologies.length} technologies detected across {catEntries.length} categories
          </p>
        </div>
        {competitorCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-amber-700">
              {competitorCount} SFCC {competitorCount === 1 ? 'opportunity' : 'opportunities'} — click 💡 to expand
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />High confidence</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Medium confidence</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-100 border border-amber-200 inline-block" />SFCC opportunity</span>
      </div>

      {/* Category grid */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {catEntries.map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span>{CATEGORY_ICONS[cat] ?? '🔧'}</span>
              {cat}
            </h3>
            <div className="space-y-1.5">
              {items.map(item => (
                <TechCard key={item.name} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AuditProgress from '@/components/AuditProgress'
import AuditDashboard from '@/components/AuditDashboard'
import type { AuditRecord } from '@/types/audit'

export default function AuditPage() {
  const { id } = useParams<{ id: string }>()
  const [audit, setAudit] = useState<AuditRecord | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    async function poll() {
      try {
        const res = await fetch(`/api/audit/${id}`)
        if (!res.ok) { setError('Audit not found'); return }
        const data: AuditRecord = await res.json()
        setAudit(data)
        if (data.status === 'complete' || data.status === 'error') {
          clearInterval(interval)
        }
      } catch {
        setError('Failed to load audit')
      }
    }

    poll()
    interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [id])

  if (error) {
    return (
      <div className="min-h-screen bg-[#032D60] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <p className="text-red-600 font-semibold">{error}</p>
          <a href="/" className="mt-4 inline-block text-[#0070D2] text-sm hover:underline">← Start a new audit</a>
        </div>
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-[#032D60] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (audit.status === 'error') {
    return (
      <div className="min-h-screen bg-[#032D60] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="font-bold text-gray-900 mb-2">Audit failed</h2>
          <p className="text-gray-600 text-sm mb-1">{audit.errorMessage || 'The site could not be crawled.'}</p>
          <p className="text-gray-400 text-xs mb-4">This can happen with sites that block automated crawlers or require authentication.</p>
          <a href="/" className="inline-block bg-[#0070D2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#005fb2]">Try another site</a>
        </div>
      </div>
    )
  }

  if (audit.status !== 'complete') {
    return <AuditProgress progress={audit.progress} currentStep={audit.currentStep} siteUrl={audit.siteUrl} />
  }

  return <AuditDashboard audit={audit} />
}

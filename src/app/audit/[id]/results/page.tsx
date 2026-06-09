'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ResultsRedirect() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/audit/${id}`)
  }, [id, router])

  return (
    <div className="min-h-screen bg-[#032D60] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )
}

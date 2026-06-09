'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { CheckHint } from '@/lib/check-hints'

export default function CheckHintTooltip({ hint }: { hint: CheckHint }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  function show() {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const TIP_W = 256
    const MARGIN = 8

    // prefer left of button; fall back to right if not enough room
    let left = r.left - TIP_W - MARGIN
    if (left < MARGIN) left = r.right + MARGIN

    // clamp vertically so it never falls below viewport
    const TIP_H = 160 // rough estimate
    let top = r.top
    if (top + TIP_H > window.innerHeight - MARGIN) {
      top = window.innerHeight - TIP_H - MARGIN
    }

    setPos({ top, left })
    setOpen(true)
  }

  // close on scroll so it doesn't drift
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [open])

  return (
    <div className="relative inline-flex flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onFocus={show}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none flex-shrink-0 cursor-help"
        style={{ backgroundColor: '#2D4A44', opacity: 0.55 }}
        aria-label="What does this mean?"
      >
        ?
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed z-[9999] w-64 bg-gray-900 text-white rounded-xl shadow-2xl p-3 text-xs leading-relaxed pointer-events-none"
          style={{ top: pos.top, left: pos.left }}
          role="tooltip"
        >
          <p className="font-semibold text-white mb-1">What is this?</p>
          <p className="text-gray-300 mb-2">{hint.what}</p>
          <p className="font-semibold text-white mb-1">How to check</p>
          <p className="text-gray-300">{hint.how}</p>
        </div>,
        document.body
      )}
    </div>
  )
}

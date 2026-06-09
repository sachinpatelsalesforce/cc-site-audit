import IntakeForm from '@/components/IntakeForm'

const FEATURES = [
  {
    icon: (
      <svg className="w-4 h-4" style={{ color: '#C9A227' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: '12 audit categories',
    desc: 'Homepage, Search, PDP, Checkout, AI Readiness, Core Web Vitals & more',
  },
  {
    icon: (
      <svg className="w-4 h-4" style={{ color: '#C9A227' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    title: '80+ tech fingerprint rules',
    desc: 'Detect platforms, vendors, and tools powering any commerce site',
  },
  {
    icon: (
      <svg className="w-4 h-4" style={{ color: '#C9A227' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'AI-powered analysis',
    desc: 'Claude AI surfaces SFCC gaps and scores AI readiness automatically',
  },
  {
    icon: (
      <svg className="w-4 h-4" style={{ color: '#C9A227' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m6.632 3.316a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 0l-6.632-3.316m0-2.684l6.632-3.316" />
      </svg>
    ),
    title: 'Shareable reports',
    desc: 'Send a link or export PDF — ready for your POV deck',
  },
]

const PREVIEW = [
  { name: 'Homepage', score: 67 },
  { name: 'Search', score: 83 },
  { name: 'Checkout', score: 42 },
  { name: 'Mobile', score: 91 },
  { name: 'SEO', score: 55 },
  { name: 'AI Ready', score: 28 },
]

function scoreColor(s: number) {
  if (s >= 70) return '#4ade80'
  if (s >= 40) return '#fbbf24'
  return '#f87171'
}

export default function Home() {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#DCE9E8' }}>

      {/* ── Left panel ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-[460px] flex-shrink-0 flex-col relative overflow-hidden"
        style={{ backgroundColor: '#2D4A44' }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Decorative circles */}
        <div className="absolute -top-28 -right-28 w-72 h-72 rounded-full pointer-events-none" style={{ backgroundColor: '#C9A227', opacity: 0.12 }} />
        <div className="absolute bottom-24 -left-20 w-56 h-56 rounded-full pointer-events-none" style={{ backgroundColor: '#C9A227', opacity: 0.08 }} />

        <div className="relative z-10 flex flex-col h-full p-10">

          {/* Brand */}
          <div className="flex items-center gap-3 mb-12">
            <img
              src="https://d3f1iyfxxz8i1e.cloudfront.net/courses/course_image/849736ed9ea6.png"
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <p className="text-white font-bold text-sm leading-tight">Commerce Cloud</p>
              <p className="text-white/40 text-xs">Site Audit Tool · Internal</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-4xl font-black text-white leading-[1.15] mb-4">
              Turn any commerce site into a Salesforce opportunity
            </h1>
            <p className="text-white/55 text-sm leading-relaxed">
              Audit any retail site across 12 capability areas in minutes. Built for AEs, SEs and CSMs who need to move fast and win.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-5 mb-10">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'rgba(201,162,39,0.18)' }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{f.title}</p>
                  <p className="text-white/45 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Example output preview */}
          <div className="mt-auto">
            <p className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-3">Example audit output</p>
            <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
              <div className="grid grid-cols-3 gap-2.5">
                {PREVIEW.map(p => (
                  <div key={p.name} className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-xl font-black leading-none" style={{ color: scoreColor(p.score) }}>{p.score}%</p>
                    <p className="text-white/45 text-xs mt-1">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-white/20 text-xs text-center mt-4">For Salesforce internal use only</p>
          </div>

        </div>
      </div>

      {/* ── Right: form ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-lg">

          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <img
                src="https://d3f1iyfxxz8i1e.cloudfront.net/courses/course_image/849736ed9ea6.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
              <div className="text-left">
                <p className="font-black text-gray-900 text-sm">Commerce Cloud</p>
                <p className="text-gray-400 text-xs">Site Audit Tool</p>
              </div>
            </div>
          </div>

          {/* Form card */}
          <div
            className="bg-white rounded-3xl p-8 lg:p-10"
            style={{ boxShadow: '0 8px 48px rgba(45,74,68,0.13)' }}
          >
            <div className="mb-7">
              <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1.5">
                Audit a site in minutes
              </h2>
              <p className="text-gray-400 text-sm">
                Enter the details below and we&apos;ll handle the rest.
              </p>
            </div>
            <IntakeForm />
          </div>

          <p className="text-center text-xs mt-5" style={{ color: '#2D4A44', opacity: 0.4 }}>
            Powered by Salesforce Commerce Cloud · Internal use only
          </p>
        </div>
      </div>

    </div>
  )
}

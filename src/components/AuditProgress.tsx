'use client'

const STEPS = [
  'Starting audit…',
  'Launching Lighthouse + browser crawl + AI analysis…',
  'Auditing homepage…',
  'Testing search & navigation…',
  'Checking product listing pages…',
  'Analysing product detail pages…',
  'Reviewing cart & checkout…',
  'Testing mobile experience…',
  'Checking page performance…',
  'Calculating scores…',
]

export default function AuditProgress({ progress, currentStep, siteUrl }: {
  progress: number
  currentStep: string
  siteUrl: string
}) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#DCE9E8' }}>
      {/* Left accent panel */}
      <div className="hidden lg:flex w-64 flex-shrink-0 flex-col justify-between p-8" style={{ backgroundColor: '#2D4A44' }}>
        <div>
          <img src="https://d3f1iyfxxz8i1e.cloudfront.net/courses/course_image/849736ed9ea6.png" alt="Logo" className="w-12 h-12 object-contain mb-6" />
          <p className="text-white font-bold">Commerce Cloud</p>
          <p className="text-blue-300 text-sm">Site Audit</p>
        </div>
        <p className="text-blue-500 text-xs">Running automated analysis…</p>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {/* Spinner */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: '#C9A227' }}>
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Auditing your site</h2>
            <p className="text-gray-400 text-sm text-center truncate mb-6">{siteUrl}</p>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{currentStep}</span>
                <span className="font-semibold" style={{ color: '#C9A227' }}>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: '#C9A227' }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {STEPS.map((step, i) => {
                const stepProgress = (i + 1) / STEPS.length * 100
                const done = progress > stepProgress
                const active = !done && Math.abs(progress - stepProgress) < 15
                return (
                  <div key={step} className={`flex items-center gap-2.5 text-xs transition-opacity ${done || active ? 'opacity-100' : 'opacity-25'}`}>
                    {done ? (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2D4A44' }}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : active ? (
                      <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0" style={{ borderColor: '#C9A227', borderTopColor: 'transparent' }} />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />
                    )}
                    <span className={done ? 'text-gray-400 line-through' : active ? 'font-semibold' : 'text-gray-400'} style={active ? { color: '#2D4A44' } : {}}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">This typically takes 30–60 seconds</p>
          </div>
        </div>
      </div>
    </div>
  )
}

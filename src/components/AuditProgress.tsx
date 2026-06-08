'use client'

const STEPS = [
  'Starting crawl…',
  'Discovering site pages…',
  'Auditing homepage…',
  'Testing search & navigation…',
  'Checking product listing pages…',
  'Analysing product detail pages…',
  'Reviewing cart & checkout…',
  'Testing mobile experience…',
  'Measuring performance…',
  'Calculating scores…',
]

export default function AuditProgress({ progress, currentStep, siteUrl }: {
  progress: number
  currentStep: string
  siteUrl: string
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#032D60] to-[#0070D2] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <svg className="w-16 h-16 animate-spin text-[#0070D2]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Auditing your site</h2>
          <p className="text-gray-500 text-sm truncate">{siteUrl}</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{currentStep}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-[#0070D2] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="text-left space-y-1.5 max-h-48 overflow-hidden">
          {STEPS.map((step, i) => {
            const stepProgress = (i + 1) / STEPS.length * 100
            const done = progress > stepProgress
            const active = !done && Math.abs(progress - stepProgress) < 15
            return (
              <div key={step} className={`flex items-center gap-2 text-xs transition-opacity ${done || active ? 'opacity-100' : 'opacity-30'}`}>
                {done ? (
                  <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : active ? (
                  <span className="w-4 h-4 rounded-full border-2 border-[#0070D2] border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />
                )}
                <span className={done ? 'text-gray-500 line-through' : active ? 'text-[#0070D2] font-medium' : 'text-gray-400'}>
                  {step}
                </span>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-400 mt-6">This typically takes 30–60 seconds</p>
      </div>
    </div>
  )
}

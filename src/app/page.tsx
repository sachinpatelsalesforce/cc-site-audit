import IntakeForm from '@/components/IntakeForm'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#032D60] to-[#0070D2] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur rounded-xl p-2.5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Commerce Cloud</h1>
          <h2 className="text-xl font-semibold text-blue-200 mt-0.5">Site Audit Tool</h2>
          <p className="text-blue-300 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
            Automated ecommerce readiness analysis — identify gaps and build your SFCC value story in minutes.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="font-bold text-gray-900 text-lg mb-1">Start a new audit</h3>
          <p className="text-gray-500 text-sm mb-6">Enter the customer's site URL and we'll handle the rest.</p>
          <IntakeForm />
        </div>

        <p className="text-center text-blue-300/60 text-xs mt-6">
          For Salesforce AEs, SEs, and CSMs · Internal use only
        </p>
      </div>
    </div>
  )
}

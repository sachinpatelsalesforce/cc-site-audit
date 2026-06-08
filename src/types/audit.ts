export type CheckStatus = 'pass' | 'partial' | 'fail'

export interface CheckResult {
  id: string
  label: string
  status: CheckStatus
  detail?: string
  sfccValue?: string
}

export interface CategoryResult {
  id: string
  name: string
  icon: string
  score: number // 0-100
  maxScore: number
  checks: CheckResult[]
}

export interface AuditResult {
  overallScore: number
  grade: string
  siteUrl: string
  crawledPages: {
    homepage?: string
    plp?: string
    pdp?: string
    cart?: string
    checkout?: string
  }
  categories: CategoryResult[]
  topOpportunities: Opportunity[]
  completedAt: string
}

export interface Opportunity {
  categoryId: string
  categoryName: string
  checkId: string
  checkLabel: string
  sfccValue: string
  impact: 'high' | 'medium' | 'low'
}

export interface AuditRecord {
  id: string
  shareToken: string
  siteUrl: string
  auditorName: string
  auditorEmail: string
  opportunity?: string | null
  region: string
  status: string
  progress: number
  currentStep: string
  results?: AuditResult | null
  errorMessage?: string | null
  createdAt: string
}

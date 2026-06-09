export type CheckStatus = 'pass' | 'partial' | 'fail'

export interface TechItem {
  name: string
  category: string
  confidence: 'high' | 'medium' | 'low'
  sfccOpportunity?: string
}

export interface TechStackResult {
  technologies: TechItem[]
  categories: Record<string, TechItem[]>
}

export interface CheckResult {
  id: string
  label: string
  status: CheckStatus
  detail?: string
  sfccValue?: string
  note?: string
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
  lighthouseScore?: number | null
  crawledPages: {
    homepage?: string
    plp?: string
    pdp?: string
    cart?: string
    checkout?: string
  }
  categories: CategoryResult[]
  topOpportunities: Opportunity[]
  techStack?: TechStackResult
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

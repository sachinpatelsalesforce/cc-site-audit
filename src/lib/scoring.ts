import { AuditResult, CategoryResult, Opportunity } from '@/types/audit'

export function scoreCategory(category: CategoryResult): number {
  const earned = category.checks.reduce((sum, c) => {
    if (c.status === 'pass') return sum + 2
    if (c.status === 'partial') return sum + 1
    return sum
  }, 0)
  const max = category.checks.length * 2
  return max === 0 ? 0 : Math.round((earned / max) * 100)
}

export function overallScore(categories: CategoryResult[]): number {
  if (categories.length === 0) return 0
  const avg = categories.reduce((sum, c) => sum + c.score, 0) / categories.length
  return Math.round(avg)
}

export function scoreToGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

export function extractOpportunities(categories: CategoryResult[]): Opportunity[] {
  const ops: Opportunity[] = []
  for (const cat of categories) {
    for (const check of cat.checks) {
      if ((check.status === 'fail' || check.status === 'partial') && check.sfccValue) {
        const impact: Opportunity['impact'] =
          check.status === 'fail' ? 'high' : 'medium'
        ops.push({
          categoryId: cat.id,
          categoryName: cat.name,
          checkId: check.id,
          checkLabel: check.label,
          sfccValue: check.sfccValue,
          impact,
        })
      }
    }
  }
  // Sort: high first, then medium, take top 5
  return ops
    .sort((a, b) => (a.impact === 'high' && b.impact !== 'high' ? -1 : 1))
    .slice(0, 5)
}

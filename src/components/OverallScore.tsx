'use client'

import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

function gradeColor(grade: string) {
  if (grade === 'A') return '#22c55e'
  if (grade === 'B') return '#84cc16'
  if (grade === 'C') return '#f59e0b'
  if (grade === 'D') return '#f97316'
  return '#ef4444'
}

export default function OverallScore({ score, grade }: { score: number; grade: string }) {
  const color = gradeColor(grade)
  const data = [{ value: score, fill: color }]

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <RadialBarChart
          width={200}
          height={200}
          cx={100}
          cy={100}
          innerRadius={70}
          outerRadius={90}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: '#f1f5f9' }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={6}
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black" style={{ color }}>{grade}</span>
          <span className="text-lg font-bold text-gray-700">{score}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-1">Overall Score</p>
    </div>
  )
}

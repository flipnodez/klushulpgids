import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(request: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const where: Prisma.ComplianceLogWhereInput = {}
  const event = searchParams.get('event')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (event) where.eventType = event
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      where.createdAt.lte = toDate
    }
  }

  const items = await prisma.complianceLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50000,
    select: { id: true, eventType: true, createdAt: true, metadata: true },
  })

  const header = 'id,createdAt,eventType,metadata\n'
  const rows = items
    .map(
      (i) =>
        `${csvEscape(i.id)},${csvEscape(i.createdAt.toISOString())},${csvEscape(i.eventType)},${csvEscape(i.metadata)}`,
    )
    .join('\n')

  const filename = `compliance-log-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(header + rows + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

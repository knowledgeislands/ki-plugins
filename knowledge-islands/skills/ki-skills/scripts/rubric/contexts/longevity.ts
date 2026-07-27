type RefreshClass = 'external-spec' | 'canonical'

export type RefreshContext = {
  sourcesPresent: boolean
  refreshClass: RefreshClass | null
  cadence: string | null
  windowDays: number | null
  lastReviewed: string | null
  ageDays: number | null
}

const CADENCE_DAYS: Readonly<Record<string, number>> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90
}

const latestReviewDate = (text: string): string | null => {
  let column = -1
  let latest: string | null = null
  for (const line of text.split(/\r?\n/)) {
    if (!line.trimStart().startsWith('|')) {
      column = -1
      continue
    }
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim())
    const header = cells.findIndex((cell) => /^last reviewed$/i.test(cell))
    if (header >= 0) {
      column = header
      continue
    }
    const date = column < 0 ? undefined : (cells[column] ?? '').match(/\d{4}-\d{2}-\d{2}/)?.[0]
    if (date && (latest === null || date > latest)) latest = date
  }
  return latest
}

export const createRefreshContext = (sources: string | null, now = Date.now()): RefreshContext => {
  if (sources === null)
    return {
      sourcesPresent: false,
      refreshClass: null,
      cadence: null,
      windowDays: null,
      lastReviewed: null,
      ageDays: null
    }

  const marker = sources.match(/^\*\*Refresh:\*\*\s*(external-spec|canonical)\s*·\s*(weekly|monthly|quarterly|on-change|\d+d)\s*$/m)
  const parsedClass = (marker?.[1] as RefreshClass | undefined) ?? null
  const parsedCadence = marker?.[2] ?? null
  const parsedWindowDays =
    parsedCadence === null || parsedCadence === 'on-change'
      ? null
      : /^\d+d$/.test(parsedCadence)
        ? Number.parseInt(parsedCadence, 10)
        : (CADENCE_DAYS[parsedCadence] ?? null)
  const markerValid = parsedCadence === 'on-change' || (parsedWindowDays !== null && parsedWindowDays > 0)
  const refreshClass = markerValid ? parsedClass : null
  const cadence = markerValid ? parsedCadence : null
  const windowDays = markerValid ? parsedWindowDays : null
  const lastReviewed = latestReviewDate(sources)
  const ageDays = lastReviewed ? Math.floor((now - Date.parse(`${lastReviewed}T00:00:00Z`)) / 86_400_000) : null

  return { sourcesPresent: true, refreshClass, cadence, windowDays, lastReviewed, ageDays }
}

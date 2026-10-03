import { labs } from './data/labs'
import { partners } from './data/partners'
import { fits } from './data/fits'
import type { Fit, FitStatus, LabId, Partner } from './types'

const fitIndex = new Map<string, Fit>()
for (const f of fits) fitIndex.set(`${f.partnerId}::${f.labId}`, f)

export function fitFor(partnerId: string, labId: LabId): Fit {
  return (
    fitIndex.get(`${partnerId}::${labId}`) ?? {
      partnerId,
      labId,
      status: 'no_fit' as FitStatus,
      reasoning: '',
      evidence: [],
      reviewed: false,
      audited: false,
    }
  )
}

export function fitsForPartner(partnerId: string): Fit[] {
  return labs.map((l) => fitFor(partnerId, l.id))
}

export function existingLabs(p: Partner): LabId[] {
  return fitsForPartner(p.id)
    .filter((f) => f.status === 'existing')
    .map((f) => f.labId)
}

export function existingCount(p: Partner): number {
  return existingLabs(p).length
}

export function candidateCount(p: Partner): number {
  return fitsForPartner(p.id).filter((f) => f.status === 'strong_candidate').length
}

export interface Opportunity {
  partner: Partner
  fit: Fit
  /** Labs that already hold a visible relationship with this partner, and would introduce. */
  introducers: LabId[]
}

/**
 * The queue: every strong candidate where the partner already works with a different lab.
 * Ranked by how many existing relationships the partner holds, because a partner already
 * working with three labs is a warmer introduction than one working with one.
 */
export const opportunities: Opportunity[] = partners
  .flatMap((p) => {
    const introducers = existingLabs(p)
    if (introducers.length === 0) return []
    return fitsForPartner(p.id)
      .filter((f) => f.status === 'strong_candidate')
      .map((fit) => ({ partner: p, fit, introducers }))
  })
  .sort(
    (a, b) =>
      b.introducers.length - a.introducers.length ||
      Number(b.fit.reviewed) - Number(a.fit.reviewed) ||
      a.partner.name.localeCompare(b.partner.name),
  )

export function opportunityCount(p: Partner): number {
  return opportunities.filter((o) => o.partner.id === p.id).length
}

/** Matrix ordering: most existing relationships first, then most opportunities, then name. */
export const partnersRanked: Partner[] = [...partners].sort(
  (a, b) =>
    existingCount(b) - existingCount(a) ||
    opportunityCount(b) - opportunityCount(a) ||
    a.name.localeCompare(b.name),
)

export const totals = {
  partners: partners.length,
  labs: labs.length,
  existing: fits.filter((f) => f.status === 'existing').length,
  candidates: fits.filter((f) => f.status === 'strong_candidate').length,
  possible: fits.filter((f) => f.status === 'possible').length,
  scored: partners.length * labs.length,
  reviewed: fits.filter((f) => f.reviewed).length,
  audited: fits.filter((f) => f.audited).length,
  assessed: fits.filter((f) => f.status !== 'no_fit').length,
  /** Partners that are a strong candidate for at least one lab not already working with them. */
  partnersWithOpportunity: new Set(opportunities.map((o) => o.partner.id)).size,
  confirmedAssociations: partners.reduce(
    (n, p) => n + p.currentLabs.filter((a) => a.confidence === 'confirmed').length,
    0,
  ),
  inferredAssociations: partners.reduce(
    (n, p) => n + p.currentLabs.filter((a) => a.confidence === 'inferred').length,
    0,
  ),
  /**
   * Companies whose only link is a TUM-level alliance that TUM Venture Labs belongs to as a
   * peer. They are not in the cross-lab queue, and that is not an oversight: the queue names
   * the lab that would make the introduction, and for these there is no such lab. They are
   * still strong candidates, visible as hollow marks on the grid and in the untapped column.
   */
  allianceAssociations: partners.reduce(
    (n, p) => n + p.currentLabs.filter((a) => a.confidence === 'alliance').length,
    0,
  ),
}


/**
 * Strip diacritics before comparing. Two of the sponsors carry them, Dassault Systèmes and
 * High-Tech Gründerfonds, and without folding neither is reachable from an English keyboard:
 * "Systemes" returned nothing at all.
 */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export const statusLabel: Record<FitStatus, string> = {
  existing: 'Existing relationship',
  strong_candidate: 'Strong candidate',
  possible: 'Possible',
  no_fit: 'No fit',
}

export const typeLabel: Record<Partner['type'], string> = {
  corporate: 'Corporate',
  foundation: 'Foundation',
  public_body: 'Public body',
  ecosystem: 'Ecosystem',
}

/* ------------------------------------------------------------------ ERP helpers */

export type SponsorStatus = 'engaged' | 'indicative' | 'alliance' | 'unattributed'

/**
 * The status a sponsor-relations team would actually triage on.
 *
 * engaged:      named in a partner or sponsor section of at least one lab page
 * indicative:   only appears in looser page context (event, venue, programme mention)
 * alliance:     shares a TUM-level alliance with TUM Venture Labs and nothing more
 * unattributed: listed at organisation level with no lab named at all
 */
export function sponsorStatus(p: Partner): SponsorStatus {
  if (p.currentLabs.length === 0) return 'unattributed'
  if (p.currentLabs.some((a) => a.confidence === 'confirmed')) return 'engaged'
  if (p.currentLabs.some((a) => a.confidence === 'inferred')) return 'indicative'
  return 'alliance'
}

export const sponsorStatusLabel: Record<SponsorStatus, string> = {
  engaged: 'Engaged',
  indicative: 'Indicative',
  alliance: 'Alliance only',
  unattributed: 'No lab named',
}

/** Initials for the row tile. No partner logos are used anywhere in this prototype. */
export function monogram(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 &+]/g, ' ').split(/\s+/).filter(Boolean)
  const skip = new Set(['the', 'of', 'and', 'for', 'group', 'ag', 'gmbh', 'se'])
  const useful = words.filter((w) => !skip.has(w.toLowerCase()))
  const src = useful.length ? useful : words
  return (src[0][0] + (src[1] ? src[1][0] : '')).toUpperCase()
}

export const labCoverage = labs.map((lab) => {
  /**
   * Alliance co-membership is not engagement. Fourteen companies are named as founding
   * partners of the TUM Security and Defense Alliance in a sentence that names TUM Venture
   * Labs alongside them rather than above them. Counting those as Aerospace relationships put
   * that lab at sixteen engaged, roughly double every other lab, off a list it belongs to as
   * a peer. They are counted here as what they are: openings with a documented way in.
   */
  const engaged = partners.filter((p) =>
    p.currentLabs.some((a) => a.labId === lab.id && a.confidence !== 'alliance'),
  )
  const candidates = opportunities.filter((o) => o.fit.labId === lab.id)
  return {
    lab,
    engaged: engaged.length,
    confirmed: partners.filter((p) =>
      p.currentLabs.some((a) => a.labId === lab.id && a.confidence === 'confirmed'),
    ).length,
    candidates: candidates.length,
    /** Warm introductions available into this lab, ranked by the introducing lab's count. */
    topCandidates: candidates.slice(0, 3),
  }
})

export type LabId =
  | 'additive'
  | 'quantum'
  | 'mobility'
  | 'built'
  | 'fab'
  | 'chembio'
  | 'healthcare'
  | 'robotics'
  | 'climate'
  | 'aerospace'
  | 'sw-munich'
  | 'sw-heilbronn'

export interface Lab {
  id: LabId
  /** Name as TUM Venture Labs writes it on their own site. */
  name: string
  /** Tight label for the matrix column header. */
  short: string
  url: string
  /** Domain description drawn from their own page wording. */
  domain: string
  technologies: string[]
  /** The lab accent colour taken from TUM Venture Labs own stylesheet. */
  color: string
}

export type PartnerType = 'corporate' | 'foundation' | 'public_body' | 'ecosystem'

export interface LabAssociation {
  labId: LabId
  /**
   * confirmed: the partner appears in a named Partners / Sponsors section on that lab's page.
   * inferred:  the partner appears on the page in some other context (event sponsor, venue,
   *             programme mention) and the association is our read, not their statement.
   * alliance:  the partner and TUM Venture Labs are both named in the same TUM-level alliance.
   *             That is co-membership, not a lab relationship, and it is kept out of every
   *             engagement count. The founding-partner list of the TUM Security and Defense
   *             Alliance names TUM Venture Labs alongside the companies, not above them, so
   *             reading those names as sponsors of the Aerospace lab would invent a
   *             relationship out of a peer listing. They are openings, not relationships.
   */
  confidence: 'confirmed' | 'inferred' | 'alliance'
  /** Exactly how it appeared on the page. Shown verbatim in the interface. */
  context: string
}

export interface Partner {
  id: string
  name: string
  type: PartnerType
  /** What the organisation actually does. */
  sectors: string[]
  whatTheyDo: string
  /** Where on tum-venture-labs.de this partner was found. */
  sourceUrl: string
  currentLabs: LabAssociation[]
}

export type FitStatus = 'existing' | 'strong_candidate' | 'possible' | 'no_fit'

export interface Fit {
  partnerId: string
  labId: LabId
  status: FitStatus
  /** One sentence naming the specific overlap. Empty for no_fit. */
  reasoning: string
  evidence: string[]
  /**
   * Has a PERSON read and signed off on this assessment. Nothing else sets this true:
   * only `npm run review`, one row at a time, after the sentence has actually been read.
   */
  reviewed: boolean
  /**
   * Has the assessment been through the automated adversarial check, a second model pass
   * whose only job was to find generic reasoning, fabricated claims and overreach, and
   * whose findings were applied. This is a real quality gate but it is NOT human review,
   * and the interface never presents it as one.
   */
  audited: boolean
}

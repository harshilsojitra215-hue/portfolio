import type { Lab } from '../types'

/**
 * The twelve labs. Names, URLs, domain descriptions and technology lists are taken from
 * the individual lab pages on tum-venture-labs.de, collected September 2026.
 * Descriptions follow their own wording. Nothing here is invented.
 *
 * Legal Tech Colab is a separate entity on its own domain, funded by the
 * Bavarian Ministry of Justice. It is noted in the interface and deliberately not scored.
 */
export const labs: Lab[] = [
  {
    id: 'additive',
    color: '#F03631',
    name: 'Additive Manufacturing',
    short: 'Additive Mfg',
    url: 'https://www.tum-venture-labs.de/labs/additive-manufacturing/',
    domain:
      'Fosters developments in disruptive materials, shapes and production processes, treating additive manufacturing as an enabler across healthcare, biotech, industry, construction and nutrition.',
    technologies: [
      'Laser powder bed fusion',
      'Stereolithography',
      'Fused filament fabrication',
      'Silicone processing',
      '3D bioprinting',
      'Food printing',
      'Dental',
      'Construction',
      'Electronics',
    ],
  },
  {
    id: 'quantum',
    color: '#FF7D3E',
    name: 'Quantum / Semicon',
    short: 'Quantum / Semicon',
    url: 'https://www.tum-venture-labs.de/labs/quantum/',
    domain:
      'The hub for physics and electrical engineering based ventures, on the position that quantum technology, photonics and semiconductors play a vital role in the development of future products.',
    technologies: [
      'Quantum computing',
      'Quantum sensing',
      'Photonics',
      'Semiconductors',
      'Chip design',
      'Hardware for AI',
      'RISC-V',
      '6G',
      'Data centres',
    ],
  },
  {
    id: 'mobility',
    color: '#FFB410',
    name: 'Mobility',
    short: 'Mobility',
    url: 'https://www.tum-venture-labs.de/labs/mobility/',
    domain:
      'Describes itself as Europe’s leading start-up hub for mobility ventures, giving tailored support to accelerate automotive innovation and the mobility transformation from idea to global scale.',
    technologies: [
      'Automotive',
      'Mobile robotics',
      'Supply chain and logistics',
      'Fuels and energy',
      'Smart and sustainable cities',
      'Manufacturing and industrialisation',
      'Defence mobility',
      'Water mobility',
    ],
  },
  {
    id: 'built',
    color: '#FAEA43',
    name: 'Built Environment',
    short: 'Built Env',
    url: 'https://www.tum-venture-labs.de/labs/built-environment/',
    domain:
      'Works with start-ups in civil and environmental engineering, architecture and design, with a stated focus on AI in the built world, decarbonisation of the building sector and the transformation of the construction industry.',
    technologies: [
      'AI in the built world',
      'Civil and environmental engineering',
      'Architecture and design',
      'Building decarbonisation',
      'Construction logistics',
      'BIM',
      'Digital reality capture',
      'Climate intelligence',
      'Construction robotics',
    ],
  },
  {
    id: 'fab',
    color: '#7DB713',
    name: 'Food / Agro / Biotech',
    short: 'Food / Agro / Biotech',
    url: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    domain:
      'One of Europe’s leading incubators supporting agri-, food- and biotech start-up teams, from innovative idea through to a working venture.',
    technologies: [
      'Agrifood',
      'Alternative proteins',
      'Biostimulants',
      'Bioprocess monitoring',
      'Food production compliance',
      'Supply chain resilience',
      'Precision agriculture',
      'Quality control AI',
      'Active ingredients',
    ],
  },
  {
    id: 'chembio',
    color: '#02C896',
    name: 'Chem / Biosystems',
    short: 'Chem / Biosystems',
    url: 'https://www.tum-venture-labs.de/labs/chem-biosystems/',
    domain:
      'Aims to become the leading European innovation centre for business ideas in drug design, protein assembly, catalysis and energy, supporting interdisciplinary innovation in chemistry, biochemistry and material science.',
    technologies: [
      'Drug design',
      'Catalysis',
      'Protein assembly',
      'Battery and solid electrolyte materials',
      'Renewable chemicals',
      'Plastic recycling',
      'Electrification of chemical processes',
      'Analytical sciences',
      'RNA therapies',
    ],
  },
  {
    id: 'healthcare',
    color: '#00B2BC',
    name: 'Healthcare',
    short: 'Healthcare',
    url: 'https://www.tum-venture-labs.de/labs/healthcare/',
    domain:
      'Supports early-stage ventures from research and hypotheses to commercialisation across three disciplines: digital health and AI in life science, medtech, and biotech and pharma.',
    technologies: [
      'Medical devices',
      'Digital health',
      'AI diagnostics',
      'Gene and cell therapy',
      'RNA therapies',
      'Immunotherapy',
      'Rare disease diagnostics',
      'Infection prevention',
      'Surgical navigation',
    ],
  },
  {
    id: 'robotics',
    color: '#6BAEDB',
    name: 'Robotics / AI',
    short: 'Robotics / AI',
    url: 'https://www.tum-venture-labs.de/labs/robotics-ai/',
    domain:
      'An early-stage incubator for robotics, artificial intelligence and communication technologies, supporting scalable start-ups with mentoring, facilities, funding routes and community.',
    technologies: [
      'Robotics',
      'Artificial intelligence',
      'Communication technology',
      '6G',
      'Autonomous systems',
      'Machine learning',
      'Exoskeletons',
      'Robotic avatars',
      'Test and measurement',
    ],
  },
  {
    id: 'climate',
    color: '#01B706',
    name: 'Climate / Circular',
    short: 'Climate / Circular',
    url: 'https://www.tum-venture-labs.de/labs/climate-circular/',
    domain:
      'Supports venture teams that strive for impact in climate action, resilience and resource management, from early discovery to incorporation and first external investment.',
    technologies: [
      'Renewable energy',
      'Energy storage',
      'Carbon capture',
      'Circular economy and recycling',
      'Sustainable materials',
      'ESG reporting technology',
      'Sustainable fuels',
      'Water and heavy-rain management',
      'Precision agriculture',
    ],
  },
  {
    id: 'aerospace',
    color: '#23308B',
    name: 'Aerospace / Defense',
    short: 'Aerospace / Defense',
    url: 'https://www.tum-venture-labs.de/labs/aerospace-defense/',
    domain:
      'Covers a community spanning launch services through to urban air mobility, working on aerospace and defence ventures inside the TUM ecosystem.',
    technologies: [
      'Launch services',
      'Satellite technology',
      'Urban air mobility',
      'Defence technology',
      'Sensors and radar',
      'Cybersecurity',
      'Autonomous systems',
      'Aviation',
      'Simulation and engineering software',
    ],
  },
  {
    id: 'sw-munich',
    color: '#A50184',
    name: 'Software & AI / Munich',
    short: 'Software & AI Munich',
    url: 'https://www.tum-venture-labs.de/labs/software-ai/',
    domain:
      'Supports innovations in software, foundation models and AI-native systems, with deep tech AI applications across healthcare, scientific discovery, autonomous systems, industrial automation and cybersecurity.',
    technologies: [
      'Foundation models',
      'Large vision models',
      'Natural language processing',
      'Data management and quality',
      'Medical imaging AI',
      'Industrial automation',
      'Cybersecurity',
      'Autonomous systems',
    ],
  },
  {
    id: 'sw-heilbronn',
    // Deviation, and the only one: TUM Venture Labs give both Software & AI labs the same
    // magenta. On a grid whose whole argument is that a sponsor in one lab is an opening in
    // another, two labs sharing a colour makes the Munich to Heilbronn hop invisible, and
    // that hop is one of the findings here. Munich keeps their magenta; Heilbronn is given a
    // violet that reads apart from it at 15 pixels.
    color: '#6D28D9',
    name: 'Software & AI / Heilbronn',
    short: 'Software & AI Heilbronn',
    url: 'https://www.tum-venture-labs.de/labs/software-ai-heilbronn/',
    domain:
      'The hub for science-based AI start-ups in Heilbronn, converting academic expertise into practical applications along personalised rather than standardised development paths.',
    technologies: [
      'Software engineering',
      'Machine learning',
      'Edge AI',
      'GPU computing',
      'Embedded systems',
      'Applied AI for industry',
    ],
  },
]

export const labById = Object.fromEntries(labs.map((l) => [l.id, l])) as Record<string, Lab>

/** Sits outside the map by design. Noted, not scored. */
export const outsideTheMap = {
  name: 'Legal Tech Colab',
  url: 'https://legaltechcolab.com/',
  note: 'A separate non-profit LegalTech, RegTech and TaxTech hub on its own domain, funded by the Bavarian Ministry of Justice and run in collaboration with it. It is not one of the twelve domain labs, so it is not scored here.',
}

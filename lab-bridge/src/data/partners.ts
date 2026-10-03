import type { Partner } from '../types'

/**
 * Partners collected from tum-venture-labs.de and the twelve individual lab pages,
 * September 2026. Every record links to the page it was found on.
 *
 * Inclusion rule: organisations that could plausibly be, or already are, a sponsor or
 * partner of a lab. That means corporates, foundations, public bodies and ecosystem
 * organisations.
 *
 * Deliberately excluded, and worth stating: TUM's own entities and UnternehmerTUM
 * (TUM.Additive, TUM E-Ship, MIRMI, TranslaTUM, TUM Klinikum, CirculaTUM), which are the
 * host rather than the sponsor; pure venue credits (Deutsches Museum, Messe München, the
 * Munich Urban Colab where it appears only as a room); other universities appearing as
 * event co-hosts; and Google, which appears on two lab pages only as the video-call
 * platform an event ran on and is not a partner.
 *
 * confidence: 'confirmed' means the organisation appears in a named Partners or Sponsors
 * section on that lab's page. 'inferred' means it appears in some other page context and
 * the association is our read, not their statement. 'alliance' means the only thing linking
 * them is a TUM-level alliance whose own founding-partner sentence names TUM Venture Labs
 * alongside them rather than above them, which is co-membership and not a lab relationship;
 * those are kept out of every engagement count and surface as openings instead.
 */
export const partners: Partner[] = [
  // ---------- corporates ----------
  {
    id: 'rohde-schwarz',
    name: 'Rohde & Schwarz',
    type: 'corporate',
    sectors: ['Test and measurement', 'Automotive radar and EMC test systems', 'Radio and broadcast', 'Secure communications', 'Radiomonitoring', 'Cybersecurity'],
    whatTheyDo:
      'Munich electronics group making test and measurement instruments, broadcast and radiomonitoring systems, secure communications and network cybersecurity equipment.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/robotics-ai/',
    currentLabs: [
      { labId: 'robotics', confidence: 'confirmed', context: 'listed under “Our Sponsor”' },
      { labId: 'aerospace', confidence: 'confirmed', context: 'listed under “Our Sponsors”' },
    ],
  },
  {
    id: 'infineon',
    name: 'Infineon Technologies',
    type: 'corporate',
    sectors: ['Semiconductors', 'Power electronics', 'Automotive chips', 'Security controllers', 'Sensors'],
    whatTheyDo:
      'German semiconductor manufacturer specialising in power systems, automotive electronics, sensors and hardware security controllers.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/quantum/',
    currentLabs: [
      { labId: 'quantum', confidence: 'confirmed', context: 'logo in the lab’s Sponsors and Partners section' },
    ],
  },
  {
    id: 'bmw',
    name: 'BMW Group',
    type: 'corporate',
    sectors: ['Automotive manufacturing', 'Electric vehicles', 'Battery systems', 'Production technology', 'Mobility services'],
    whatTheyDo:
      'Munich vehicle manufacturer producing cars and motorcycles, with in-house battery, production technology and circular materials programmes.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/climate-circular/',
    currentLabs: [
      { labId: 'climate', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'man',
    name: 'MAN',
    type: 'corporate',
    sectors: ['Commercial vehicles', 'Trucks and buses', 'Combustion and electric drivetrains', 'Logistics'],
    whatTheyDo:
      'Munich commercial vehicle manufacturer building trucks, buses and vans, including battery-electric heavy vehicles.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/mobility/',
    currentLabs: [
      { labId: 'mobility', confidence: 'confirmed', context: 'named sponsor with logo on the lab page' },
    ],
  },
  {
    id: 'wacker',
    name: 'Wacker Chemie',
    type: 'corporate',
    sectors: ['Speciality chemicals', 'Silicones', 'Polymers', 'Polysilicon', 'Biotech ingredients'],
    whatTheyDo:
      'Munich chemical group producing silicones, polymer binders, polysilicon for semiconductors and solar, and biotech-derived ingredients.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/chem-biosystems/',
    currentLabs: [
      { labId: 'chembio', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'giesecke-devrient',
    name: 'Giesecke+Devrient',
    type: 'corporate',
    sectors: ['Currency technology', 'Payment systems', 'Digital identity', 'Smart cards and SIM', 'Security printing'],
    whatTheyDo:
      'Munich security technology group covering banknote production and processing, payment cards, SIM and eSIM, and digital identity systems.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/software-ai/',
    currentLabs: [
      { labId: 'sw-munich', confidence: 'confirmed', context: 'logo in the Sponsors section' },
      { labId: 'chembio', confidence: 'inferred', context: 'named in event and content text on the lab page' },
    ],
  },
  {
    id: 'iabg',
    name: 'IABG',
    type: 'corporate',
    sectors: ['Engineering analysis and testing', 'Defence and security', 'Space systems', 'Mobility infrastructure', 'InfoCom'],
    whatTheyDo:
      'Independent German technology and analysis company running structural and environmental test facilities across automotive, aerospace, defence and infrastructure.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/software-ai/',
    currentLabs: [
      { labId: 'sw-munich', confidence: 'confirmed', context: 'logo in the Sponsors section' },
    ],
  },
  {
    id: 'hensoldt',
    name: 'HENSOLDT',
    type: 'corporate',
    sectors: ['Defence electronics', 'Radar', 'Optronics', 'Avionics', 'Electronic warfare'],
    whatTheyDo:
      'German sensor house for defence and security, building radar, optronics, avionics and electronic warfare systems.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'confirmed', context: 'logo under “Our Sponsors”' },
    ],
  },
  {
    id: 'general-dynamics',
    name: 'General Dynamics',
    type: 'corporate',
    sectors: ['Defence systems', 'Land vehicles', 'Mission systems', 'Secure communications', 'Aerospace'],
    whatTheyDo:
      'Global aerospace and defence group building combat vehicles, mission and communication systems, and business aircraft.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'confirmed', context: 'logo under “Our Sponsors”' },
    ],
  },
  {
    id: 'nemetschek',
    name: 'Nemetschek Group',
    type: 'corporate',
    sectors: ['AEC software', 'Building information modelling', 'Design and simulation software', 'Digital twins', 'Media and entertainment software'],
    whatTheyDo:
      'Munich software group for architecture, engineering, construction and media, whose brands cover design, BIM, simulation and building operation.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/built-environment/',
    currentLabs: [
      { labId: 'built', confidence: 'confirmed', context: 'listed under Platinum Sponsors and Affiliated Partners' },
    ],
  },
  {
    id: 'n-ventures',
    name: 'N VENTURES',
    type: 'corporate',
    sectors: ['Corporate venture capital', 'Construction technology', 'Building software', 'Digital twins'],
    whatTheyDo:
      'The Nemetschek Group’s venture arm, investing in early-stage companies across construction and building technology.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/built-environment/',
    currentLabs: [
      { labId: 'built', confidence: 'confirmed', context: 'listed under Platinum Sponsors and Affiliated Partners' },
    ],
  },
  {
    id: 'brainlab',
    name: 'Brainlab',
    type: 'corporate',
    sectors: ['Medical technology', 'Surgical navigation', 'Radiotherapy planning', 'Medical imaging software', 'Digital operating rooms'],
    whatTheyDo:
      'Munich medical technology company making image-guided surgical navigation, radiotherapy planning software and digital operating room systems.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/healthcare/',
    currentLabs: [
      { labId: 'healthcare', confidence: 'confirmed', context: 'logo under Platinum Sponsors' },
    ],
  },
  {
    id: 'baywa',
    name: 'BayWa',
    type: 'corporate',
    sectors: ['Agricultural trade and inputs', 'Renewable energy', 'Building materials', 'Agricultural machinery', 'Food supply chains'],
    whatTheyDo:
      'Munich group trading agricultural inputs and produce, distributing farm machinery and building materials, and developing solar and wind projects.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    currentLabs: [
      { labId: 'fab', confidence: 'confirmed', context: 'listed in the Partners section' },
    ],
  },
  {
    id: 'dr-oetker',
    name: 'Dr. Oetker',
    type: 'corporate',
    sectors: ['Packaged food manufacturing', 'Frozen food', 'Baking ingredients', 'Food processing', 'Consumer brands'],
    whatTheyDo:
      'German food manufacturer producing baking products, desserts and frozen pizza across European markets.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    currentLabs: [
      { labId: 'fab', confidence: 'confirmed', context: 'listed in the Partners section' },
    ],
  },
  {
    id: 'schaeffler',
    name: 'Schaeffler',
    type: 'corporate',
    sectors: ['Bearings and precision components', 'Automotive drivetrain', 'Industrial automation', 'Additive manufacturing', 'Hydrogen and electrolysis'],
    whatTheyDo:
      'German motion technology supplier making bearings, drivetrain and chassis components, industrial automation parts and hydrogen electrolyser components.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/additive-manufacturing/',
    currentLabs: [
      { labId: 'additive', confidence: 'inferred', context: 'named as sponsor of the 13th AMeetUp event' },
      { labId: 'chembio', confidence: 'inferred', context: 'named as sponsor of an AMeetUp event on the lab page' },
    ],
  },
  {
    id: 'dassault-systemes',
    name: 'Dassault Systèmes',
    type: 'corporate',
    sectors: ['Simulation software', 'Product lifecycle management', '3D design', 'Digital twins', 'Life sciences software'],
    whatTheyDo:
      'French software company behind the 3DEXPERIENCE platform, CATIA, SIMULIA and MEDIDATA, covering 3D design, simulation and product lifecycle management.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'confirmed', context: 'logo under “Our Partners”' },
      { labId: 'robotics', confidence: 'confirmed', context: 'logo in the Partners section as 3DExperience' },
    ],
  },
  {
    id: 'mathworks',
    name: 'MathWorks',
    type: 'corporate',
    sectors: ['Technical computing software', 'Control systems', 'Model-based design', 'Signal processing', 'Machine learning tooling'],
    whatTheyDo:
      'Maker of MATLAB and Simulink, used for modelling, control design, signal processing and algorithm development in engineering and research.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'confirmed', context: 'logo under “Our Partners”' },
    ],
  },
  {
    id: 'cadfem',
    name: 'CADFEM',
    type: 'corporate',
    sectors: ['Simulation services', 'Finite element analysis', 'Engineering consulting', 'Simulation training'],
    whatTheyDo:
      'German simulation specialist distributing and supporting Ansys software, with engineering consulting and training in numerical simulation.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'confirmed', context: 'logo under “Our Partners”' },
    ],
  },
  {
    id: 'neura-robotics',
    name: 'Neura Robotics',
    type: 'corporate',
    sectors: ['Cognitive robotics', 'Humanoid robots', 'Cobots', 'Robot perception', 'Industrial automation'],
    whatTheyDo:
      'German robotics manufacturer building cognitive cobots and humanoid robots with integrated perception for industrial and service use.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/robotics-ai/',
    currentLabs: [
      { labId: 'robotics', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'corporate',
    sectors: ['Foundation models', 'AI research', 'AI safety', 'Developer tooling', 'Enterprise AI'],
    whatTheyDo:
      'AI research company building the Claude family of foundation models and the developer and enterprise tooling around them.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/software-ai/',
    currentLabs: [
      { labId: 'sw-munich', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'corporate',
    sectors: ['Foundation models', 'AI research', 'Developer platform', 'Enterprise AI', 'Speech and vision models'],
    whatTheyDo:
      'AI research company building the GPT family of foundation models and the API and product surface around them.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/software-ai/',
    currentLabs: [
      { labId: 'sw-munich', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'burda-principal-investments',
    name: 'Burda Principal Investments',
    type: 'corporate',
    sectors: ['Growth capital', 'Digital media', 'Marketplaces', 'Software investment'],
    whatTheyDo:
      'The growth capital arm of Hubert Burda Media, investing in later-stage digital and technology companies in Europe and the US.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/software-ai/',
    currentLabs: [
      { labId: 'sw-munich', confidence: 'confirmed', context: 'logo in the Sponsors section' },
    ],
  },
  {
    id: 'bambu-lab',
    name: 'Bambu Lab',
    type: 'corporate',
    sectors: ['Desktop 3D printers', 'Multi-material printing', 'Consumer manufacturing hardware'],
    whatTheyDo:
      'Manufacturer of fast desktop 3D printers with automated multi-material and multi-colour printing.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/additive-manufacturing/',
    currentLabs: [
      { labId: 'additive', confidence: 'inferred', context: 'named in a news item about an H2D printer at the lab, not in a partner section' },
    ],
  },
  {
    id: 'osborne-clarke',
    name: 'Osborne Clarke',
    type: 'corporate',
    sectors: ['Legal services', 'Technology and life sciences law', 'Venture and corporate law', 'Regulatory advice'],
    whatTheyDo:
      'International law firm advising technology, life sciences and energy companies on corporate, venture and regulatory matters.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/chem-biosystems/',
    currentLabs: [
    ],
  },
  {
    id: 'orrick',
    name: 'Orrick',
    type: 'corporate',
    sectors: ['Legal services', 'Venture financing law', 'Technology and energy law', 'IP and regulatory advice'],
    whatTheyDo:
      'International law firm concentrated on technology, energy and infrastructure, widely used for venture financing rounds.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/software-ai/',
    currentLabs: [
      { labId: 'sw-munich', confidence: 'confirmed', context: 'logo in the Partners section as legal support partner' },
    ],
  },
  {
    id: 'reed-smith',
    name: 'Reed Smith',
    type: 'corporate',
    sectors: ['Legal services', 'Life sciences and health law', 'Regulatory advice', 'Data privacy law'],
    whatTheyDo:
      'International law firm with a life sciences and health industry practice covering regulation, data and commercial contracts.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/healthcare/',
    // The only occurrence on the page is the venue line of an event tile, the firm's office
    // address. That is a venue credit, which this collection excludes, so no association is
    // recorded. The lab fit below stands on the practice area alone.
    currentLabs: [],
  },

  // ---------- foundations ----------
  {
    id: 'heinz-nixdorf-stiftung',
    name: 'Heinz Nixdorf Stiftung',
    type: 'foundation',
    sectors: ['Charitable funding', 'Education and science', 'Medical research funding', 'Entrepreneurship promotion'],
    whatTheyDo:
      'German charitable foundation funding education, science, medicine and entrepreneurship projects.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/healthcare/',
    currentLabs: [
      { labId: 'healthcare', confidence: 'confirmed', context: 'logo under Platinum Sponsors' },
    ],
  },
  {
    id: 'viessmann-foundation',
    name: 'Viessmann Foundation',
    type: 'foundation',
    sectors: ['Climate philanthropy', 'Heating and building energy', 'Sustainability funding', 'Entrepreneurship promotion'],
    whatTheyDo:
      'Foundation of the Viessmann family, funding climate and sustainability initiatives and entrepreneurship, with roots in heating and building energy systems.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/climate-circular/',
    currentLabs: [
      { labId: 'climate', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },

  // ---------- public bodies ----------
  {
    id: 'stmgp',
    name: 'Bavarian State Ministry of Health and Care',
    type: 'public_body',
    sectors: ['Health policy', 'Care provision', 'Public health funding', 'Health innovation programmes'],
    whatTheyDo:
      'Bavarian state ministry responsible for health and care policy, public health, and funding programmes in the health sector.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/healthcare/',
    currentLabs: [
      { labId: 'healthcare', confidence: 'confirmed', context: 'logo under Platinum Sponsors' },
    ],
  },
  {
    id: 'stmwi',
    name: 'Bavarian State Ministry for Economic Affairs',
    type: 'public_body',
    sectors: ['Economic policy', 'Regional development', 'Energy policy', 'Start-up funding programmes', 'Industrial policy'],
    whatTheyDo:
      'Bavarian state ministry for economic affairs, regional development and energy, and the source of much of Bavaria’s start-up funding.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/robotics-ai/',
    currentLabs: [
      { labId: 'robotics', confidence: 'confirmed', context: 'logo in the Partners section, alongside the Gründerland Bayern programme' },
    ],
  },
  {
    id: 'city-of-munich',
    name: 'City of Munich',
    type: 'public_body',
    sectors: ['Municipal government', 'Urban development', 'Municipal climate policy', 'Local economic development'],
    whatTheyDo:
      'The municipal authority for Munich, responsible for urban development, local climate policy and city economic development.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/climate-circular/',
    currentLabs: [
      { labId: 'climate', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'dlr',
    name: 'DLR, German Aerospace Center',
    type: 'public_body',
    sectors: ['Aerospace research', 'Space programmes', 'Energy research', 'Transport research', 'Security research'],
    whatTheyDo:
      'Germany’s national aerospace, energy and transport research centre, and the national space agency administering Germany’s space programme.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'inferred', context: 'named as a co-partner of the ESA Business Accelerator Germany' },
    ],
  },
  {
    id: 'esa',
    name: 'European Space Agency',
    type: 'public_body',
    sectors: ['Space programmes', 'Earth observation', 'Satellite navigation', 'Launch systems', 'Space commercialisation'],
    whatTheyDo:
      'Europe’s intergovernmental space agency, running science, Earth observation, navigation and launcher programmes and commercialisation accelerators.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'inferred', context: 'named through the ESA Business Accelerator Germany programme partnership' },
    ],
  },

  // ---------- ecosystem ----------
  {
    id: 'campus-founders',
    name: 'Campus Founders',
    type: 'ecosystem',
    sectors: ['Start-up incubation', 'Entrepreneurship education', 'Regional innovation', 'Venture programmes'],
    whatTheyDo:
      'Heilbronn-based start-up and entrepreneurship centre running incubation, education and venture programmes on the Bildungscampus.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/software-ai-heilbronn/',
    currentLabs: [
      { labId: 'sw-heilbronn', confidence: 'confirmed', context: 'logo under the Sponsor section' },
    ],
  },
  {
    id: 'appliedai',
    name: 'appliedAI Initiative',
    type: 'ecosystem',
    sectors: ['Applied artificial intelligence', 'Industrial AI adoption', 'AI training', 'Trustworthy AI'],
    whatTheyDo:
      'European initiative for applied artificial intelligence, working with industry on AI adoption, trustworthy AI and training.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/software-ai-heilbronn/',
    currentLabs: [
      { labId: 'sw-heilbronn', confidence: 'confirmed', context: 'logo in the partner network section' },
    ],
  },
  {
    id: 'mqv',
    name: 'Munich Quantum Valley',
    type: 'ecosystem',
    sectors: ['Quantum computing', 'Quantum technologies research', 'Research infrastructure', 'Technology transfer'],
    whatTheyDo:
      'Bavarian initiative building quantum computing and quantum technology research infrastructure and transferring it toward industry.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/quantum/',
    currentLabs: [
      { labId: 'quantum', confidence: 'confirmed', context: 'logo in the Sponsors and Partners section' },
    ],
  },
  {
    id: 'biom',
    name: 'BioM',
    type: 'ecosystem',
    sectors: ['Biotechnology cluster', 'Life sciences networking', 'Start-up support', 'Regional innovation'],
    whatTheyDo:
      'The biotechnology cluster organisation for Munich and Bavaria, connecting life science companies, research institutes and investors.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    currentLabs: [
    ],
  },
  {
    id: 'eit-food',
    name: 'EIT Food',
    type: 'ecosystem',
    sectors: ['Agrifood innovation', 'EU innovation funding', 'Food system sustainability', 'Start-up acceleration'],
    whatTheyDo:
      'The European Institute of Innovation and Technology’s food arm, funding and accelerating agrifood innovation across Europe.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    currentLabs: [
      { labId: 'fab', confidence: 'confirmed', context: 'listed in the Partners section' },
    ],
  },
  {
    id: 'bayern-kapital',
    name: 'Bayern Kapital',
    type: 'ecosystem',
    sectors: ['Venture capital', 'Public investment', 'Deep tech financing', 'Life sciences investment'],
    whatTheyDo:
      'Bavaria’s public venture capital company, investing in high-technology start-ups across the state.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    currentLabs: [
      { labId: 'fab', confidence: 'inferred', context: 'named as a participant in a fundraising insights session' },
    ],
  },
  {
    id: 'htgf',
    name: 'High-Tech Gründerfonds',
    type: 'ecosystem',
    sectors: ['Seed venture capital', 'Deep tech financing', 'Life sciences investment', 'Industrial technology investment'],
    whatTheyDo:
      'Germany’s largest seed investor, backing early-stage technology companies across digital, industrial, chemistry and life sciences.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    currentLabs: [
      { labId: 'fab', confidence: 'inferred', context: 'named as a participant in a fundraising insights session' },
    ],
  },
  {
    id: 'uvc-partners',
    name: 'UVC Partners',
    type: 'ecosystem',
    sectors: ['Venture capital', 'Industrial technology investment', 'Enterprise software investment', 'Mobility investment'],
    whatTheyDo:
      'Munich early-stage venture firm investing in industrial technologies, enterprise software and mobility, associated with UnternehmerTUM.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    currentLabs: [
      { labId: 'fab', confidence: 'inferred', context: 'named as a participant in a fundraising insights session' },
    ],
  },
  {
    id: 'vorwerk-ventures',
    name: 'Vorwerk Ventures',
    type: 'ecosystem',
    sectors: ['Venture capital', 'Consumer investment', 'Food and health investment', 'Direct-to-consumer brands'],
    whatTheyDo:
      'European venture firm investing in consumer, food and health companies, originally the venture arm of the Vorwerk group.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    currentLabs: [
      { labId: 'fab', confidence: 'inferred', context: 'named as a participant in a fundraising insights session' },
    ],
  },
  {
    id: 'foodlabs',
    name: 'FoodLabs',
    type: 'ecosystem',
    sectors: ['Venture capital', 'Food system investment', 'Company building', 'Sustainability investment'],
    whatTheyDo:
      'Berlin venture studio and investor building and backing companies across food, health and sustainability.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    currentLabs: [
      { labId: 'fab', confidence: 'inferred', context: 'named as a participant in a fundraising insights session' },
    ],
  },
  {
    id: 'circular-republic',
    name: 'Circular Republic',
    type: 'ecosystem',
    sectors: ['Circular economy', 'Industrial collaboration', 'Sustainability programmes', 'Materials reuse'],
    whatTheyDo:
      'Munich initiative bringing corporates, start-ups and research together on circular economy projects and business models.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/climate-circular/',
    currentLabs: [
      { labId: 'climate', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'rig',
    name: 'Robotics Institute Germany',
    type: 'ecosystem',
    sectors: ['Robotics research network', 'AI research', 'Research infrastructure', 'Technology transfer'],
    whatTheyDo:
      'National German network of robotics research institutions, coordinating research and transfer in robotics and embodied AI.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/robotics-ai/',
    currentLabs: [
      { labId: 'robotics', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'six-g-life',
    name: '6G-life',
    type: 'ecosystem',
    sectors: ['6G research', 'Communication networks', 'Latency-critical systems', 'Sustainable networking'],
    whatTheyDo:
      'German research hub for 6G communication, focused on human-machine interaction, latency-critical networks and energy-efficient networking.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/robotics-ai/',
    currentLabs: [
      { labId: 'robotics', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'gate-garching',
    name: 'Gate Garching',
    type: 'ecosystem',
    sectors: ['Technology incubation', 'Start-up workspace', 'Regional innovation', 'Founder coaching'],
    whatTheyDo:
      'Technology and start-up centre in Garching offering incubation space and founder support next to the TUM campus.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/robotics-ai/',
    currentLabs: [
      { labId: 'robotics', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'utokyo-ipc',
    name: 'University of Tokyo IPC',
    type: 'ecosystem',
    sectors: ['University venture capital', 'Deep tech investment', 'Incubation programmes', 'International start-up exchange'],
    whatTheyDo:
      'The University of Tokyo’s investment and incubation company, funding and supporting university-originated deep tech ventures.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/robotics-ai/',
    currentLabs: [
      { labId: 'robotics', confidence: 'confirmed', context: 'logo in the Partners section' },
    ],
  },
  {
    id: 'push-quantum',
    name: 'PushQuantum',
    type: 'ecosystem',
    sectors: ['Quantum computing community', 'Student initiatives', 'Quantum education', 'Industry projects'],
    whatTheyDo:
      'Munich student-founded quantum computing initiative running education programmes and industry projects in quantum technology.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/quantum/',
    currentLabs: [
      { labId: 'quantum', confidence: 'confirmed', context: 'logo in the Network Partners section' },
    ],
  },
  {
    id: 'european-startup-prize',
    name: 'European StartUp Prize for Mobility',
    type: 'ecosystem',
    sectors: ['Mobility start-up competition', 'European scale-up support', 'Sustainable transport', 'Ecosystem building'],
    whatTheyDo:
      'European acceleration programme and prize for sustainable mobility start-ups, run with EU institutional backing.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/mobility/',
    currentLabs: [
      { labId: 'mobility', confidence: 'confirmed', context: 'described in a dedicated partnership section on the lab page' },
    ],
  },
  {
    id: 'nucleate',
    name: 'Nucleate',
    type: 'ecosystem',
    sectors: ['Life sciences entrepreneurship', 'Student and researcher networks', 'Biotech company formation'],
    whatTheyDo:
      'International student-run non-profit connecting academic life science researchers with the people and capital needed to found biotech companies.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/food-agro-biotech/',
    currentLabs: [
      { labId: 'fab', confidence: 'inferred', context: 'named as an event co-host on the lab page' },
    ],
  },

  // ---------- listed on the organisation-level partner wall, with no lab named ----------
  // These are the clearest illustration of the limitation this whole map runs into: the
  // relationship is real and publicly stated, but the page does not say which lab owns it.
  {
    id: 'durst',
    name: 'Durst Group',
    type: 'corporate',
    sectors: ['Industrial digital printing', 'Inkjet systems', 'Ceramics decoration', 'Textile printing', 'Label and packaging printing'],
    whatTheyDo:
      'South Tyrolean manufacturer of industrial digital inkjet printing systems for large format, textiles, ceramics, labels and packaging.',
    sourceUrl: 'https://www.tum-venture-labs.de/',
    currentLabs: [],
  },
  {
    // Deliberately carries no lab assessment. This ministry's connection to the ecosystem runs
    // through Legal Tech Colab, which is a separate non-profit on its own domain and is not one
    // of the twelve labs. Scoring it against the twelve would be inventing a relationship to
    // fill a row. `npm run validate` reports it as unscored rather than rejected, which is the
    // honest description.
    id: 'bavarian-ministry-justice',
    name: 'Bavarian State Ministry of Justice',
    type: 'public_body',
    sectors: ['Justice policy', 'Courts and legal system', 'Legal technology programmes', 'Regulatory affairs'],
    whatTheyDo:
      'Bavarian state ministry for justice, and the named funder of the separate Legal Tech Colab.',
    sourceUrl: 'https://www.tum-venture-labs.de/',
    currentLabs: [],
  },
  {
    id: 'bavarian-ministry-science',
    name: 'Bavarian State Ministry of Science and the Arts',
    type: 'public_body',
    sectors: ['Higher education policy', 'Research funding', 'Technology transfer', 'Arts and culture funding'],
    whatTheyDo:
      'Bavarian state ministry responsible for universities, research funding and technology transfer across the state.',
    sourceUrl: 'https://www.tum-venture-labs.de/',
    currentLabs: [],
  },

  // ---------- named as founding partners of the security and defence alliance ----------
  {
    id: 'sap',
    name: 'SAP',
    type: 'corporate',
    sectors: ['Enterprise software', 'ERP', 'Supply chain software', 'Cloud platforms', 'Business AI'],
    whatTheyDo:
      'German enterprise software group whose ERP, supply chain, procurement and analytics products run the operational backbone of large industrial companies.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/expanding-aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'alliance', context: 'founding partner of the TUM Security and Defense Alliance, a list that names TUM Venture Labs as a partner too' },
    ],
  },
  {
    id: 'airbus-ds',
    name: 'Airbus Defence and Space',
    type: 'corporate',
    sectors: ['Military aircraft', 'Satellites and space systems', 'Earth observation', 'Secure communications', 'Unmanned systems'],
    whatTheyDo:
      'The defence and space division of Airbus, building military aircraft, satellites, Earth observation systems, secure communications and unmanned systems.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/expanding-aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'alliance', context: 'founding partner of the TUM Security and Defense Alliance, a list that names TUM Venture Labs as a partner too' },
    ],
  },
  {
    id: 'mtu-aero-engines',
    name: 'MTU Aero Engines',
    type: 'corporate',
    sectors: ['Aircraft engines', 'Turbine components', 'Engine maintenance and overhaul', 'Additive manufacturing of engine parts', 'High-temperature materials'],
    whatTheyDo:
      'Munich aero engine manufacturer developing and servicing commercial and military engine modules, including additively manufactured turbine components.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/expanding-aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'alliance', context: 'founding partner of the TUM Security and Defense Alliance, a list that names TUM Venture Labs as a partner too' },
    ],
  },
  {
    id: 'diehl-defence',
    name: 'Diehl Defence',
    type: 'corporate',
    sectors: ['Guided missiles', 'Air defence systems', 'Ammunition', 'Defence electronics', 'Propulsion'],
    whatTheyDo:
      'German defence manufacturer producing guided missiles, air defence systems, ammunition and defence electronics.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/expanding-aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'alliance', context: 'founding partner of the TUM Security and Defense Alliance, a list that names TUM Venture Labs as a partner too' },
    ],
  },
  {
    id: 'helsing',
    name: 'Helsing',
    type: 'corporate',
    sectors: ['Defence artificial intelligence', 'Sensor fusion', 'Autonomous systems', 'Electronic warfare software', 'Strike drones'],
    whatTheyDo:
      'European defence technology company building AI software for sensor fusion, electronic warfare and autonomous aerial and underwater systems.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/expanding-aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'alliance', context: 'founding partner of the TUM Security and Defense Alliance, a list that names TUM Venture Labs as a partner too' },
    ],
  },
  {
    id: 'isar-aerospace',
    name: 'Isar Aerospace',
    type: 'corporate',
    sectors: ['Launch vehicles', 'Rocket propulsion', 'Small satellite launch', 'Additive manufacturing of engine parts', 'Composite structures'],
    whatTheyDo:
      'Munich launch company developing the Spectrum small satellite launch vehicle, with in-house engine production using additive manufacturing.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/expanding-aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'alliance', context: 'founding partner of the TUM Security and Defense Alliance, a list that names TUM Venture Labs as a partner too' },
    ],
  },
  {
    id: 'quantum-systems',
    name: 'Quantum Systems',
    type: 'corporate',
    sectors: ['Unmanned aerial systems', 'Electric VTOL drones', 'AI-based aerial reconnaissance', 'Edge computing on aircraft', 'Sensor payloads'],
    whatTheyDo:
      'Bavarian manufacturer of electric vertical take-off unmanned aerial systems with onboard AI for reconnaissance and mapping.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/expanding-aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'alliance', context: 'founding partner of the TUM Security and Defense Alliance, a list that names TUM Venture Labs as a partner too' },
    ],
  },
  {
    id: 'unibw-munich',
    name: 'University of the Bundeswehr Munich',
    type: 'ecosystem',
    sectors: ['Defence research', 'Cybersecurity research', 'Aerospace engineering', 'Mobility research', 'Technology transfer'],
    whatTheyDo:
      'Federal armed forces university in Neubiberg with research programmes in cybersecurity, aerospace, mobility and digitalisation.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/aerospace-defense/expanding-aerospace-defense/',
    currentLabs: [
      { labId: 'aerospace', confidence: 'alliance', context: 'founding partner of the TUM Security and Defense Alliance, a list that names TUM Venture Labs as a partner too' },
    ],
  },

  // ---------- foundations found through programme pages ----------
  {
    id: 'breakthrough-energy',
    name: 'Breakthrough Energy',
    type: 'ecosystem',
    sectors: ['Climate technology investment', 'Energy innovation', 'Policy advocacy', 'Deep tech commercialisation'],
    whatTheyDo:
      'Climate network founded to fund and commercialise energy and industrial decarbonisation technologies, combining investment with policy work.',
    sourceUrl: 'https://www.tum-venture-labs.de/labs/climate-circular/',
    currentLabs: [
    ],
  },
  {
    id: 'joachim-herz-stiftung',
    name: 'Joachim Herz Stiftung',
    type: 'foundation',
    sectors: ['Science education funding', 'Natural sciences promotion', 'Economic education', 'Personal development programmes'],
    whatTheyDo:
      'German charitable foundation funding natural science education, economic literacy and personal development programmes.',
    sourceUrl: 'https://www.tum-venture-labs.de/events/ammersee-venture-school/',
    currentLabs: [],
  },
  {
    id: 'karl-schlecht-stiftung',
    name: 'Karl Schlecht Stiftung',
    type: 'foundation',
    sectors: ['Leadership education', 'Applied ethics', 'Robotics and automation funding', 'Entrepreneurship promotion'],
    whatTheyDo:
      'Charitable foundation of the founder of construction machinery maker Putzmeister, funding leadership education, ethics and robotics research.',
    sourceUrl: 'https://www.tum-venture-labs.de/offerings/idealab-workshop/',
    currentLabs: [],
  },
]

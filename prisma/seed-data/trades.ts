/**
 * Seed-data: 12 vakgebieden voor Klushulpgids.nl.
 * Bron: Design concept/data.js (categories array), aangevuld met SEO templates
 * en omschrijvingen.
 *
 * SEO-templates gebruiken {city} als placeholder die in fase 4 vervangen wordt
 * door de stadsnaam. Toon van de teksten is bewust feitelijk en editorial —
 * geen "geen lead-fee"-claims of business-model-uitspraken (zie 00-overzicht.md
 * "Wat NIET hardcoderen").
 */

export type TradeSeed = {
  slug: string
  nameSingular: string
  namePlural: string
  iconName: string
  description: string
  seoTitleTemplate: string
  seoDescriptionTemplate: string
}

export const trades: TradeSeed[] = [
  {
    slug: 'loodgieters',
    nameSingular: 'Loodgieter',
    namePlural: 'Loodgieters',
    iconName: 'Wrench',
    description:
      'Loodgieters werken aan sanitair, lekkages, riolering, CV-ketels en watervoorzieningen. Ze zijn de eerste keus bij spoedklussen rondom water en gas, en bij badkamer- en keukeninstallaties.',
    seoTitleTemplate: 'Loodgieters in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Vergelijk loodgieters in {city}: tarieven, certificeringen, beschikbaarheid en reviews. Onafhankelijke gids zonder reclame.',
  },
  {
    slug: 'elektriciens',
    nameSingular: 'Elektricien',
    namePlural: 'Elektriciens',
    iconName: 'Zap',
    description:
      'Elektriciens leggen en repareren elektrische installaties: groepenkasten, stopcontacten, verlichting, laadpalen en domotica. Gecertificeerde elektriciens werken volgens NEN 1010.',
    seoTitleTemplate: 'Elektriciens in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Erkende elektriciens in {city} vergelijken: certificeringen, specialisaties, tarieven en klantbeoordelingen. Onafhankelijke gids.',
  },
  {
    slug: 'schilders',
    nameSingular: 'Schilder',
    namePlural: 'Schilders',
    iconName: 'PaintBucket',
    description:
      'Schilders verzorgen binnen- en buitenschilderwerk, behang, sauswerk en houtonderhoud. Goede schilders adviseren over verfsoorten, ondergrondvoorbereiding en duurzaamheid van het resultaat.',
    seoTitleTemplate: 'Schilders in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Schilders in {city} met reviews, prijsindicaties en certificeringen. Vergelijk vakmannen voor binnen- en buitenwerk.',
  },
  {
    slug: 'stukadoors',
    nameSingular: 'Stukadoor',
    namePlural: 'Stukadoors',
    iconName: 'Layers',
    description:
      'Stukadoors brengen pleisterwerk aan op wanden en plafonds: sausklaar, behangklaar of sierpleister. Specialismen lopen uiteen van renovatiewerk tot ambachtelijk siermetselwerk.',
    seoTitleTemplate: 'Stukadoors in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Erkende stukadoors in {city}: pleisterwerk, sierpleister, renovatie. Vergelijk tarieven en reviews.',
  },
  {
    slug: 'tegelzetters',
    nameSingular: 'Tegelzetter',
    namePlural: 'Tegelzetters',
    iconName: 'Grid3x3',
    description:
      'Tegelzetters leggen wand- en vloertegels, mozaïek en natuursteen. Ze werken vaak nauw samen met loodgieters bij badkamerverbouwingen en met aannemers bij renovaties.',
    seoTitleTemplate: 'Tegelzetters in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Tegelzetters in {city} vergelijken: badkamer, keuken, vloer en wand. Reviews, certificeringen en tarieven.',
  },
  {
    slug: 'timmerlieden',
    nameSingular: 'Timmerman',
    namePlural: 'Timmerlieden',
    iconName: 'Hammer',
    description:
      'Timmerlieden bouwen en repareren met hout: binnendeuren, vloeren, kozijnen, dakkapellen, inbouwkasten en verbouwingen. Voor grotere klussen werken ze samen met andere bouwers.',
    seoTitleTemplate: 'Timmerlieden in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Timmerlieden in {city} voor verbouwing, dakkapel, kozijnen en inbouw. Vergelijk vakmannen en lees klantbeoordelingen.',
  },
  {
    slug: 'dakdekkers',
    nameSingular: 'Dakdekker',
    namePlural: 'Dakdekkers',
    iconName: 'Home',
    description:
      'Dakdekkers leggen en onderhouden platte en hellende daken: bitumen, EPDM, dakpannen, zinkwerk en goten. Ook isolatie- en zonnepaneel-werk hoort vaak tot het pakket.',
    seoTitleTemplate: 'Dakdekkers in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Dakdekkers in {city} voor reparatie, vervanging en onderhoud. Bitumen, EPDM, dakpannen — vergelijk vakmannen.',
  },
  {
    slug: 'hoveniers',
    nameSingular: 'Hovenier',
    namePlural: 'Hoveniers',
    iconName: 'Trees',
    description:
      'Hoveniers ontwerpen, leggen aan en onderhouden tuinen: beplanting, bestrating, vijvers, beregening en hekwerk. Goede hoveniers adviseren over biodiversiteit en klimaatadaptatie.',
    seoTitleTemplate: 'Hoveniers in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Hoveniers in {city} voor tuinaanleg, bestrating en onderhoud. Reviews, certificeringen en specialisaties.',
  },
  {
    slug: 'klusbedrijven',
    nameSingular: 'Klusser',
    namePlural: 'Klusbedrijven',
    iconName: 'HardHat',
    description:
      'Klusbedrijven pakken uiteenlopende kleine en middelgrote klussen aan: van een hangend plafond tot een complete badkamer. Vaak generalisten met netwerk van specialisten.',
    seoTitleTemplate: 'Klusbedrijven in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Allround klusbedrijven in {city}: van losse klussen tot complete verbouwingen. Vergelijk vakmannen en reviews.',
  },
  {
    slug: 'cv-monteurs',
    nameSingular: 'CV-monteur',
    namePlural: 'CV-monteurs',
    iconName: 'Flame',
    description:
      'CV-monteurs installeren, onderhouden en repareren cv-ketels en warmtepompen. Bij gas- en F-gassen-werk is certificering verplicht.',
    seoTitleTemplate: 'CV-monteurs in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Erkende CV-monteurs in {city} voor onderhoud, vervanging en warmtepomp-installatie. Reviews en certificeringen.',
  },
  {
    slug: 'glaszetters',
    nameSingular: 'Glaszetter',
    namePlural: 'Glaszetters',
    iconName: 'Square',
    description:
      'Glaszetters plaatsen en repareren ramen, deuren en glasdaken. Ze werken aan isolatieglas, gelaagd glas en verbouwingsklussen — vaak ook bij spoedreparaties.',
    seoTitleTemplate: 'Glaszetters in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Glaszetters in {city} voor reparatie, vervanging en spoedklussen. Vergelijk vakmannen en lees beoordelingen.',
  },
  {
    slug: 'vloerenleggers',
    nameSingular: 'Vloerenlegger',
    namePlural: 'Vloerenleggers',
    iconName: 'Square',
    description:
      'Vloerenleggers leggen houten, laminaat-, PVC-, gietvloer- en tapijtvloeren. Ze adviseren over ondervloer, geluid en onderhoud, en werken vaak met vloerverwarming.',
    seoTitleTemplate: 'Vloerenleggers in {city} — Klushulpgids',
    seoDescriptionTemplate:
      'Vloerenleggers in {city}: hout, PVC, gietvloer, laminaat. Vergelijk vakmannen op reviews, prijs en specialisme.',
  },
]

#!/usr/bin/env python3
"""
Dry-run analyse van vakbedrijven_merged_enriched_openai_clean_qc.json:
- Past alle skip-regels toe (relevantie, bruikbaar, fuzzy_duplicate)
- Mapt categorie → 1 van de 12 vakgebieden
- Telt records per vakgebied + skip-reden
- GEEN database writes

Run: python3 scripts/dry-run-import.py
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

INPUT = Path("/Users/filip/Klushulpgids/vakbedrijven_merged_enriched_openai_clean_qc.json")

# Categorie-mapping van de 40+ LLM-categorieën naar onze 12 vakgebieden.
# None = SKIP (niet importeren — leveranciers, onderwijs, niet-vakman).
CATEGORIE_TO_VAKGEBIED: dict[str, str | None] = {
    # CV-monteurs
    "CV-installateur": "cv-monteurs",
    "Warmtepomp-installateur": "cv-monteurs",
    "Klimaattechniek": "cv-monteurs",
    "Airco-installateur": "cv-monteurs",
    "Koeltechniek": "cv-monteurs",
    "Koudetechniek": "cv-monteurs",
    "Ventilatiespecialist": "cv-monteurs",
    "Luchttechniek": "cv-monteurs",
    "Installatietechniek": "cv-monteurs",  # default voor broad installatie-bucket
    # Dakdekkers
    "Dakdekker": "dakdekkers",
    # Elektriciens
    "Elektricien": "elektriciens",
    "Beveiligingsinstallateur": "elektriciens",
    "Domotica": "elektriciens",
    "Domotica-installateur": "elektriciens",
    "Brandbeveiliging": "elektriciens",
    # Glaszetters
    "Glaszetter": "glaszetters",
    # Hoveniers
    "Hovenier": "hoveniers",
    "Boomverzorger": "hoveniers",
    # Klusbedrijven
    "Klusbedrijf": "klusbedrijven",
    "Verbouwbedrijf": "klusbedrijven",
    "Renovatiebedrijf": "klusbedrijven",
    "Onderhoudsbedrijf vastgoed": "klusbedrijven",
    "Onderhoudsbedrijf": "klusbedrijven",
    "Bouwbedrijf": "klusbedrijven",
    "Aannemer": "klusbedrijven",
    "Zonnepanelen-installateur": "klusbedrijven",
    "Isolatiebedrijf": "klusbedrijven",
    "Badkamerspecialist": "klusbedrijven",
    "Keukenmonteur": "klusbedrijven",
    "Restauratiebedrijf": "klusbedrijven",
    "Afbouwbedrijf": "klusbedrijven",
    "Montagebedrijf": "klusbedrijven",
    "Interieurbouw": "klusbedrijven",
    "Metselaar": "klusbedrijven",
    "Gevelrenovatie": "klusbedrijven",
    # Loodgieters
    "Loodgieter": "loodgieters",
    "Sanitair-installateur": "loodgieters",
    "Riolering": "loodgieters",
    "Riooltechniek": "loodgieters",
    "Rioolservice": "loodgieters",
    "Rioleringsbedrijf": "loodgieters",
    "Rioolontstopper": "loodgieters",
    "Riool": "loodgieters",
    "Rioolmonteur": "loodgieters",
    "Rioolbeheer": "loodgieters",
    # Schilders
    "Schilder": "schilders",
    "Behanger": "schilders",
    # Stukadoors
    "Stukadoor": "stukadoors",
    "Plafondspecialist": "stukadoors",
    "Gipsstelbedrijf": "stukadoors",
    "Plafond- en wandmonteur": "stukadoors",
    "Plafondmontagebedrijf": "stukadoors",
    # Tegelzetters
    "Tegelzetter": "tegelzetters",
    "Natuursteen-specialist": "tegelzetters",
    # Timmerlieden
    "Timmerman": "timmerlieden",
    # Vloerenleggers
    "Vloerenlegger": "vloerenleggers",
    "Gietvloeren": "vloerenleggers",
    "Gietvloerenbedrijf": "vloerenleggers",
    # SKIP — niet vakgebied-relevant
    "Leverancier": None,
    "Onderwijsinstituut": None,
    "Onbekend": None,
    "Witgoed": None,
    "Witgoedservice": None,
    "Witgoedbedrijf": None,
    "Schoonmaakbedrijf": None,
    "Keuringsbedrijf": None,
}


def split_compound(value: str) -> list[str]:
    """`Stukadoor + Vloerenlegger` → ['Stukadoor', 'Vloerenlegger']"""
    return [p.strip() for p in value.split("+") if p.strip()]


def map_record(rec: dict) -> tuple[str | None, str]:
    """
    Returns (vakgebied_slug | None, reason).

    `reason` is een korte tag: 'mapped:<src>', 'skip:<reason>', 'unmapped:<cat>'.
    """
    # 1. Skip-regels
    if rec.get("relevantie") == "niet_relevant":
        return (None, "skip:relevantie=niet_relevant")
    if rec.get("bruikbaar") is False:
        return (None, "skip:bruikbaar=false")
    if rec.get("fuzzy_duplicate_of"):
        return (None, "skip:fuzzy_duplicate")
    if not rec.get("bedrijfsnaam"):
        return (None, "skip:no_company_name")

    # 2. Categorie ophalen — primair LLM, fallback bron-categorie
    cat_primary = rec.get("categorie")
    cat_secondary = rec.get("categorie_uit_bron")

    candidates: list[str] = []
    if cat_primary:
        candidates.extend(split_compound(cat_primary))
    if cat_secondary:
        candidates.extend(split_compound(cat_secondary))

    if not candidates:
        return (None, "skip:no_categorie")

    # 3. Map elke candidate, kies eerste niet-None
    for cat in candidates:
        if cat in CATEGORIE_TO_VAKGEBIED:
            mapped = CATEGORIE_TO_VAKGEBIED[cat]
            if mapped is None:
                # Categorie is bewust SKIP-categorie
                return (None, f"skip:cat_blacklist:{cat}")
            return (mapped, f"mapped:{cat}")

    # Categorie niet bekend in onze mapping
    unknown = candidates[0]
    return (None, f"unmapped:{unknown}")


def main() -> int:
    print(f"📂 Reading {INPUT}…")
    with INPUT.open() as f:
        data = json.load(f)
    print(f"📊 {len(data)} records loaded\n")

    per_vakgebied: Counter[str] = Counter()
    per_reason: Counter[str] = Counter()
    unmapped_categorieen: Counter[str] = Counter()

    # Quality flag tellingen (alleen voor mapped records)
    flags = Counter()
    flags_combined = defaultdict(int)

    for rec in data:
        slug, reason = map_record(rec)
        per_reason[reason] += 1
        if slug:
            per_vakgebied[slug] += 1
            # Tel flags op de mapped records
            for f in ("review_nodig", "tel_invalide", "email_dns_invalide", "email_website_mismatch"):
                if rec.get(f):
                    flags[f] += 1
            ws = rec.get("website_status")
            if ws and ws != "ok":
                flags["website_status_not_ok"] += 1
            if rec.get("relevantie") == "waarschijnlijk":
                flags["relevantie_waarschijnlijk"] += 1
        else:
            if reason.startswith("unmapped:"):
                unmapped_categorieen[reason[len("unmapped:"):]] += 1

    # Report
    print("=" * 60)
    print("VAKGEBIED VERDELING (records die geïmporteerd worden)")
    print("=" * 60)
    total_mapped = sum(per_vakgebied.values())
    for slug in sorted(per_vakgebied.keys()):
        n = per_vakgebied[slug]
        pct = 100 * n / total_mapped if total_mapped else 0
        bar = "█" * int(pct / 2)
        print(f"  {slug:18s} {n:5d}  {pct:5.1f}%  {bar}")
    print(f"  {'TOTAAL':18s} {total_mapped:5d}  100.0%")

    print()
    print("=" * 60)
    print("SKIP REDENEN (records die NIET geïmporteerd worden)")
    print("=" * 60)
    skipped = 0
    for reason, n in sorted(per_reason.items(), key=lambda x: -x[1]):
        if reason.startswith("skip:") or reason.startswith("unmapped:"):
            print(f"  {reason:40s} {n:5d}")
            skipped += n
    print(f"  {'TOTAAL geskipt':40s} {skipped:5d}")

    if unmapped_categorieen:
        print()
        print("=" * 60)
        print("UNMAPPED CATEGORIEËN (komen niet in onze mapping voor)")
        print("=" * 60)
        for cat, n in unmapped_categorieen.most_common():
            print(f"  {cat:35s} {n}")

    print()
    print("=" * 60)
    print("QUALITY FLAGS (in records die wel geïmporteerd worden)")
    print("=" * 60)
    for f, n in sorted(flags.items(), key=lambda x: -x[1]):
        pct = 100 * n / total_mapped if total_mapped else 0
        print(f"  {f:32s} {n:5d}  {pct:5.1f}%")

    print()
    print("=" * 60)
    print("SAMENVATTING")
    print("=" * 60)
    print(f"  Bron records:          {len(data)}")
    print(f"  Wordt geïmporteerd:    {total_mapped}  ({100 * total_mapped / len(data):.1f}%)")
    print(f"  Wordt overgeslagen:    {skipped}  ({100 * skipped / len(data):.1f}%)")

    # Sanity check: should add up
    if total_mapped + skipped != len(data):
        print(f"\n⚠ INCONSISTENT: {total_mapped} + {skipped} = {total_mapped + skipped} != {len(data)}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

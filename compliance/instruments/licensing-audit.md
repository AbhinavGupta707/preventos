# Instrument licensing audit — WP10.4

> **DRAFT — 2026-06-12.** Desk research by agent; statuses verified against the sources
> linked per instrument. Owner actions in §3 must be executed before the affected
> instruments are marked `cleared` in the instrument registry (WP4.4). Gate: G3.
> Resolves plan open item **Q4 (SCI vs ISI)** — recommendation in §2.
>
> Context that drives every commercial-use judgement below: PreventOS is a **commercial
> consumer product** (real product, publicly launched — owner decision O1). "Free for
> research/clinical use" does NOT automatically cover us.

## 1. Summary table

| Instrument | Use in product | Copyright holder | Commercial-use position | Registry status | Owner action |
|------------|----------------|------------------|------------------------|-----------------|--------------|
| AUDIT / AUDIT-C | Steady intake + severity laddering (E17) | WHO ("public domain" as WHO-approved instrument) | Usable; conditions: unaltered, identified as WHO-approved, cited, **and users must not be charged a fee to complete it** | `cleared-with-conditions` | None now; re-verify if screening ever sits behind a paywall |
| HSI (2 items from FTND) | QuitKit dependence assessment | FTND © Taylor & Francis (Heatherton et al. 1991); standard usage note: "may be reproduced without permission" | Usable, low risk | `cleared-with-conditions` | None; keep citation |
| PHQ-2 / GAD-2 | Cross-vertical signpost-only mood/anxiety screens | Pfizer — placed in public domain, "no permission required" | Usable, unrestricted | `cleared` | None |
| **SCI** (Sleep Condition Indicator) | Nightshift outcome instrument (preferred per E19) | Espie et al.; validation paper CC BY-NC 3.0 (BMJ Open 2014); also listed on Mapi ePROVIDE | **NOT cleared for commercial use** — NC licence covers non-commercial only; commercial use needs permission | `blocked-pending-license` | **Execute SCI permission (§3.1) — the one real action in this audit** |
| ISI (Insomnia Severity Index) | Rejected alternative | © Charles M. Morin; distributed via Mapi Research Trust / ePROVIDE | Commercial licence required, fee-bearing, per-use agreements | `rejected` | None |
| TTFV index (time-to-first-vape) | Exhale dependence proxy | In-house derived measure (analogue of HSI's time-to-first-cigarette item) | No licence needed | `cleared` | None — but flag in evidence docs that it is not an externally validated instrument |

## 2. SCI vs ISI — recommendation (resolves Q4)

**Recommendation: keep SCI, execute a commercial permission now, and feature-flag the SCI
behind `licensing-status: cleared` until permission is in hand.** Diary-derived metrics
(SE/SOL/WASO) carry the sleep outcome story in the interim — they are computed from our own
diary, involve no third-party instrument, and are already primary in the product design.

Reasoning:
- **ISI does not avoid the problem.** It is unambiguously licensed (Morin / Mapi ePROVIDE),
  fee-bearing for commercial users, with per-use agreements. Switching to ISI swaps an
  ask-permission task for a definite negotiation + recurring cost.
- **SCI is the Sleepio-class instrument** (Espie is its author), DSM-5-aligned, free of
  per-administration fees in every observed deployment, with published normative values from
  200k adults. Its only obstacle is that the 2014 validation paper is CC BY-NC 3.0 —
  non-commercial — so our use needs explicit permission.
- **Worst case** (permission refused or priced): ship diary-derived outcomes only;
  re-open ISI negotiation with real usage volumes as leverage. No launch dependency.

VERIFY (clinical reviewer): SCI-02 (2-item short form) inherits the same licence position —
if we want it as the cross-vertical sleep screen, it rides on the same permission request.

## 3. Actions

### 3.1 SCI commercial permission — owner, start now (longest lead time)
Three routes, in recommended order:
1. **Author/Big Health direct**: Colin Espie (University of Oxford / co-founder & Chief
   Scientist, Big Health). A wellbeing app asking to use the SCI verbatim with attribution is
   a routine request; note Big Health is a potential competitor (Sleepio) — if that creates
   friction, fall back to route 2.
2. **Mapi ePROVIDE**: the SCI is listed at eprovide.mapi-trust.org — formal licensing channel.
3. **BMJ rights & permissions**: for reproduction rights stemming from the CC BY-NC paper.

Record the executed permission (or refusal) here and flip the registry status.

### 3.2 AUDIT conditions — engineering + owner awareness
- Render verbatim, unaltered, labelled "WHO-approved instrument", cite Saunders et al. (1993).
- **Never paywall the AUDIT itself** (WHO condition: respondents are not charged to complete
  it). If PreventOS adopts a subscription, intake screening must remain on the free tier.
  This constraint is now recorded; wire a comment into the instrument registry entry.

### 3.3 Registry wiring — engineering (WP4.4)
`packages/instruments` carries `licensing-status` per instrument:
`cleared` | `cleared-with-conditions` (conditions documented here) | `blocked-pending-license`
| `rejected`. Acceptance test: any instrument not `cleared*` is unreachable from any flow.

## 4. Sources

- SCI validation paper (CC BY-NC 3.0): [Espie et al. 2014, BMJ Open via PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3964344/) · [SCI on Mapi ePROVIDE](https://eprovide.mapi-trust.org/instruments/sleep-condition-indicator) · [SCI normative values (Sleepio)](https://www.sleepio.com/sleep-condition-indicator/)
- ISI licensing: [ISI on Mapi ePROVIDE](https://eprovide.mapi-trust.org/instruments/insomnia-severity-index) · [Mapi launch of ISI web distribution](https://www.mapi-trust.org/news-events/news/launch-of-odi-and-isi-web)
- AUDIT: [auditscreen.org FAQs](https://auditscreen.org/about/faqs) (public domain as WHO-approved; no-fee-to-respondent condition) · [WHO AUDIT guidelines](https://www.who.int/publications/i/item/WHO-MSD-MSB-01.6a)
- FTND/HSI: [NIH CDE record for FTND](https://cde.nlm.nih.gov/formView?tinyId=myLzkabPx) (© Taylor & Francis; "may be reproduced without permission") · [FTND vs HSI, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC2809067/)
- PHQ-2/GAD-2: [Pfizer press release — free public access, no permission required](https://www.pfizer.com/news/press-release/press-release-detail/pfizer_to_offer_free_public_access_to_mental_health_assessment_tools_to_improve_diagnosis_and_patient_care) · [PHQ/GAD-7 instruction manual](https://archive.thepcc.org/sites/default/files/resources/instructions.pdf)

## Sign-off block

| Role | Name | Date | Decision |
|------|------|------|----------|
| Owner | TBD | TBD | adopt recommendation §2 / override |
| Clinical reviewer | TBD | TBD | confirm instrument choices |

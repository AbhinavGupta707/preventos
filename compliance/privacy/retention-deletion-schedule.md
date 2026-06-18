# Retention and Deletion Schedule — Consumer Beta

> **DRAFT — 2026-06-18.** Proposed schedule for a UK adult consumer beta. Legal
> review must confirm retention periods before launch. This schedule favours
> short retention and deletion-by-default because the beta does not rely on a
> formal clinical-service record.

## Default rules

- Account deletion should be available in-app and from a public web URL.
- Primary systems should complete deletion or anonymisation within **30 days** of
  a verified request unless a listed carve-out applies.
- Backups should age out within **35 days** after primary deletion, subject to the
  final hosting provider's backup design.
- Processors must receive deletion requests within **30 days** where they hold
  account or programme data for PreventOS.
- Anonymous aggregate statistics may be retained indefinitely if they cannot
  reasonably identify a person.

## Schedule

| Data class | Examples | Beta retention | Deletion handling |
|------------|----------|----------------|-------------------|
| Marketing waitlist | Email, programme interest, join date | 24 months from signup or until beta invitation closes, whichever is sooner | Delete by email request; keep only aggregate counts. |
| Account identifiers | Email, auth provider ID, session metadata | Account life plus 30 days | Delete from identity store and app database; retain security logs only as below. |
| Consent ledger | Purpose grants/revocations, timestamps, policy version | Account life plus 6 years in pseudonymised audit form | Remove direct identifiers; retain minimal proof of consent/withdrawal for accountability. Legal to confirm period. |
| Programme records | Intake answers, cravings, vaping/smoking logs, plans, progress, savings inputs | Active account plus 24 months inactivity grace after notice | Delete or irreversibly anonymise on request; no sale or advertising use. |
| Validated instrument responses | HSI, TTFV, AUDIT-C where present in internal testing | Same as programme records | Delete/anonymise on request unless tied to safety record carve-out. |
| Coach messages and logs | User turns, AI outputs, policy decisions, provider/model metadata | 12 months for safety and quality review, then delete free text or anonymise | Delete free text on account deletion except safety carve-outs; keep non-identifying counts. |
| Event and decision records | App events, content selections, burden decisions | 24 months linked to account; aggregate/anonymise thereafter | Remove person link on deletion; retain aggregate metrics only. |
| Product analytics | App interactions, feature usage, consented analytics events | 13 months linked/pseudonymous | Delete linked identifiers on request; aggregate counts may remain. |
| Push tokens | Expo push token, device platform, notification status | Until permission revoked, account deletion, or 90 days inactive | Delete token immediately when revoked or account deleted. |
| Safety/escalation records | Risk trigger, scripted flow shown, escalation case, closure notes | 6 years from case closure, unless legal reviewer chooses a shorter defensible period | Minimise and lock access; explain carve-out in privacy policy; delete non-essential free text where possible. |
| Security logs | Auth events, admin access logs, abuse prevention records | 12 months; serious incident records up to 24 months | Retain only what is needed for security/accountability. |
| Backups | Encrypted database/file backups | Up to 35 days rolling | Not restored except disaster recovery; deleted data re-deleted if restored. |
| Processor copies | Auth, push, AI provider, hosting support data | Match primary retention where technically possible | Deletion request sent under DPA; record completion/exception. |
| Wearable data | HealthKit/Health Connect sleep or step aggregates | **Not collected in QuitKit + Exhale beta** | If later enabled: aggregates only, no raw samples, delete with account or consent revocation. |

## Deletion carve-outs

PreventOS may retain the minimum necessary data when required for:

- safety/escalation accountability;
- security, abuse prevention, fraud prevention, or incident investigation;
- legal claims, regulatory requests, or court orders;
- anonymised statistics that no longer identify a person.

These carve-outs must be explained in the user-facing privacy policy before beta.

## Operational checklist

- [ ] Public deletion URL available for Google Play and app users.
- [ ] In-app delete-account path present for App Store and Play compliance.
- [ ] Export-before-delete option available.
- [ ] Support process verifies requester identity without collecting excess data.
- [ ] Processor deletion tracking log exists.
- [ ] Backup restore runbook includes re-deletion of previously erased users.

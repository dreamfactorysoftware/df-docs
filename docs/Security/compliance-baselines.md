---
sidebar_position: 6.5
title: Compliance baselines
id: compliance-baselines
description: "Check DreamFactory settings against HIPAA, PCI DSS, GLBA, CJIS, GDPR, SOC 2 and ISO 27001 baselines, apply them, and export evidence as JSON or CSV."
keywords: [compliance baselines, HIPAA, PCI DSS, GLBA, CJIS, GDPR, SOC 2, ISO 27001, evidence export, data masking, audit, security baseline]
difficulty: intermediate
---

# Compliance baselines

A compliance baseline is a preset, a live checklist and an evidence export for one framework. DreamFactory has seven: HIPAA, PCI DSS, GLBA, CJIS, GDPR, SOC 2 and ISO 27001. Each baseline checks the DreamFactory settings that support the framework's requirements: whether [Data Masking](./data-masking/overview.md) is on and up to date, who sees real values, and platform settings such as HTTPS, session lifetime and request logging. **Apply** makes the changes DreamFactory can make for you, and **Export** downloads the results as evidence.

Opening the page, reading the checks and exporting evidence change nothing. Settings change only when you apply a baseline.

:::info[Licensing]
Compliance baselines require a DreamFactory commercial license (Gold). They ship with Data Masking in the `dreamfactory/df-masking` package. If **Security > Compliance** shows the upgrade page on a Gold instance, the package is not installed: contact DreamFactory support.
:::

:::note[Not a certification]
A baseline checks the DreamFactory settings that support these framework requirements. It is not a certification and does not cover controls outside DreamFactory. The framework references on each check show which requirement a setting supports. They are not legal advice: confirm scope and interpretation with your compliance team or auditor.
:::

## Quick reference

| Concept | Description |
|---|---|
| **Admin UI path** | **Security > Compliance** |
| **REST API** | `/api/v2/system/security_baseline` (full system admins only) |
| **Baseline ids** | `hipaa`, `pci_dss`, `glba`, `cjis`, `gdpr`, `soc2`, `iso27001` |
| **Check statuses** | Passes, Fails, Check manually, Not applicable |
| **Score** | Checks that pass, out of the checks that pass or fail. Manual and not-applicable checks are not counted. |
| **Apply** | Tightens settings and adds detection rules. Never loosens anything. Any full system admin can apply. |
| **Stop tracking** | Removes the Tracking mark. Every setting and rule stays as it is. |
| **Evidence export** | JSON or CSV. Contains no data values. |
| **CLI** | `php artisan df:masking baseline list` and `php artisan df:masking baseline apply ID [--mode=on]` |

## The seven baselines

| Baseline | id | Listed under | Maps to | Automated checks | Manual checks |
|---|---|---|---|---|---|
| HIPAA | `hipaa` | Healthcare | HIPAA Security Rule and HIPAA Privacy Rule (45 CFR 164) | 14 | 4 |
| PCI DSS | `pci_dss` | Payments | PCI DSS v4.0.1 | 17 | 3 |
| GLBA | `glba` | Banking | FTC Safeguards Rule, 16 CFR 314 (non-bank financial institutions), and the Interagency Guidelines Establishing Information Security Standards (banks: 12 CFR 30 App. B, 12 CFR 208 App. D-2, 12 CFR 364 App. B; credit unions: 12 CFR 748 App. A) | 13 | 4 |
| CJIS | `cjis` | Government | FBI CJIS Security Policy v6.1 | 14 | 3 |
| GDPR | `gdpr` | Privacy | EU GDPR (Regulation (EU) 2016/679) | 11 | 3 |
| SOC 2 | `soc2` | General | AICPA 2017 Trust Services Criteria (With Revised Points of Focus, 2022) | 15 | 3 |
| ISO 27001 | `iso27001` | General | ISO/IEC 27001:2022 | 15 | 3 |

Each check carries the references it supports, for example `45 CFR 164.312(b)`, `PCI DSS 3.4.1`, `16 CFR 314.4(c)(1)`, `CJIS AC-6`, `GDPR Art. 25(1)`, `SOC 2 CC6.1` or `ISO 27001 A.8.11`. CJIS references are control IDs such as AC-6, AU-11 and SC-28, which CJIS Security Policy v5.9.5 uses too.

The automated-check counts above are the most a score can show. A check that becomes **Check manually** or **Not applicable** on your instance drops out of the score, so the total can be lower. For example, with a MongoDB service, "All databases scanned in the last 30 days" becomes a manual check once every SQL database has been scanned in the last 30 days.

## The Compliance page

Open **Security > Compliance**, or press Ctrl/Cmd-K and type `compliance`. The **Compliance** card on the Security overview and the "Start from a baseline" chips on a new Data Masking page lead here too. The chips only select a baseline; they apply nothing.

![The Compliance page on a new instance: the baseline list grouped by vertical with scores (HIPAA 7/14, PCI DSS 10/17, GLBA 6/13, CJIS 9/14, GDPR 5/11, SOC 2 8/15, ISO 27001 8/15), and the HIPAA baseline open with 7 of 14, Export, Apply with a badge of 3, and failing checks such as "PHI is masked in API responses: Masking is off." with Fix links and 45 CFR references](/img/security/data-masking/compliance-first-run.png)

The page has two parts:

- **The baseline list** on the left, grouped under Healthcare, Payments, Banking, Government, Privacy and General. Each row shows a score as passing checks over checks that pass or fail (for example `7/14`), and a dot when the baseline is tracked. Scores show for every baseline, tracked or not. On a narrow screen the list becomes a **Baseline** select.
- **The baseline detail** on the right:
  - The title, such as "HIPAA baseline", with a **Tracking** badge once you have applied it. Hover the badge to see when tracking started.
  - The buttons **Stop tracking** (tracked baselines only), **Export** and **Apply**. **Apply** shows how many changes it would make, and it is shown while the baseline is not tracked, while there is something to change, or while a check that Apply fixes is failing.
  - The line "Mapped to HIPAA Security Rule, HIPAA Privacy Rule · Not a certification".
  - The score, for example "7 of 14", with a meter.
  - The automated checks in a fixed order, with not-applicable checks muted at the end.
  - **Manual checks**, a collapsed section that lists what DreamFactory cannot check for you.

Checks are evaluated live each time you open a baseline. While a scan runs, the page shows "Scanning databases…" with a percentage and re-reads the checks when the scan finishes. The URL keeps the selected baseline (`?baseline=hipaa`), so you can bookmark or share a baseline view.

### Check statuses

| Icon | Status | Meaning | In the score |
|---|---|---|---|
| Green check | Passes | The setting meets the check. | Yes |
| Red cross | Fails | The setting does not meet the check. A detail line says why, and many checks have a **Fix** link. | Yes |
| Empty circle | Check manually | DreamFactory cannot confirm it. Infrastructure and process items, and the scan check on instances with databases Data Masking cannot scan. | No |
| Circle with a minus | Not applicable | Nothing to check, for example "No SQL database services." | No |

The detail line shows under failing, manual and not-applicable checks. Passing checks show no detail on the page; the evidence export includes every detail. In the API and the JSON export, `score` has `pass`, `fail`, `manual` and `total`, where `total` counts manual checks but not not-applicable ones.

### Where Fix goes

**Fix** appears only on failing checks. It either opens the page that fixes the setting, or opens the **Apply** dialog.

| Failing check | Fix |
|---|---|
| Data is masked in API responses (for HIPAA, "PHI is masked in API responses") | Opens **Apply** with "Mask values now (masking On)" ticked, once a scan has found columns. Before that, it opens **Security > Data Masking**, where you start the scan. It also opens **Security > Data Masking** when masking is On but a database was never scanned. |
| All databases scanned in the last 30 days | Opens **Security > Data Masking**. |
| No columns waiting for review | Opens the **Columns** tab on **To review**. |
| No ... marked not sensitive | Opens the **Columns** tab on **Not sensitive**. |
| Mask format checks, AI and MCP sessions get masked values, Admins need a grant to see real values, Admin grants expire within N hours, Roles never see restricted real values | Opens **Apply**. |
| Admins unused for 90 days are disabled | Opens **Admin Settings > Admins**. |
| No CORS rule allows every origin | Opens **System > Config > CORS**. |
| API rate limits are active | Opens **Security > Rate Limiting**. |
| Reads from every SQL database are logged | Opens **System > Logstash**. |
| API served over HTTPS, Debug mode is off, Idle sessions require signing in again, A super admin approves real-value access, Open user registration is off, Masking activity kept for at least a year | No Fix button. These are server settings or commands; the detail line says what to change. |

Before the first scan has classified any column, the masking checks' Fix links all open **Security > Data Masking**.

## Walkthrough: apply the HIPAA baseline

This walkthrough uses Acme Health, the fictional healthcare group from [Get started](./data-masking/get-started.md). Acme Health has already scanned its databases, reviewed the one column to review, added two custom rules and turned masking On. On the Access tab, Jordan Lee has an 8-hour grant and the `support` role sees real values for all classes except restricted ones (see [Who sees real values](./data-masking/access.md)). Alex Rivera, the super admin, now applies HIPAA and collects evidence.

1. **Open the baseline.** Go to **Security > Compliance** and select **HIPAA** under Healthcare. It reads 11 of 14, and **Apply** shows 2 changes.

   ![The HIPAA baseline after masking was turned On: 11 of 14 with Export and Apply 2. The masking and access checks pass. API served over HTTPS, Idle sessions require signing in again after 60 minutes, and Reads from every SQL database are logged fail](/img/security/data-masking/compliance-baseline-detail.png)

   The access checks already pass. Admins see real values only with a grant, Jordan Lee's grant is within 8 hours, AI and MCP sessions are always masked, and the `support` role excludes restricted classes. The format check passes because Date of birth (Year only) and Age (Redact) use their default formats. Had Jordan Lee's grant been 7 days, Apply would also list "Limit Jordan Lee's access to real values to 8 hours (now 7 days left)."

2. **Read what Apply will change.** Click **Apply**. The dialog lists every change before anything happens. Here Apply only adds two HIPAA detection rules.

   ![The Apply HIPAA baseline? dialog listing two changes: "Add a detection rule: Medical record, patient and chart numbers are Health & special category." and "Add a detection rule: Health plan beneficiary and Medicare/Medicaid numbers are Health & special category.", with Cancel and Apply](/img/security/data-masking/compliance-apply-dialog.png)

   Masking is already On, so the dialog has no "Mask values now (masking On)" box. Click **Apply**. The toast reads "HIPAA baseline applied", and the Activity tab records "Applied the HIPAA baseline (2 changes)".

3. **Check the result.** The baseline now shows **Tracking**, **Stop tracking** and **Export**, and **Apply** is gone because there is nothing left to change. The score stays 11 of 14: the new rules mask one more column, but the three failing checks are server settings that Apply does not change.

   ![The HIPAA baseline after Apply, with a Tracking badge, 11 of 14, Stop tracking and Export. Three checks fail: API served over HTTPS, Idle sessions require signing in again after 60 minutes, and Reads from every SQL database are logged, which has a Fix link](/img/security/data-masking/compliance-baseline-tracking.png)

   On **Security > Data Masking > Detection**, the two rules appear as "Added by the HIPAA baseline". Name rules apply at once, without a scan. The second rule masks `patients.patients.insurance_member_id`, and the header now reads 31 masked.

   ![The Detection tab with four custom rules: Column name is member_ref, Column values look like AAA#########, and two rules Added by the HIPAA baseline (Medical record, patient and chart numbers; Health plan beneficiary and Medicare/Medicaid numbers), all masked as Health & special category with 1 match each. The header shows mode On and 31 masked](/img/security/data-masking/rules-baseline.png)

4. **Fix what Apply can't.** The three remaining failures are server settings, so you change them yourself.
   - **API served over HTTPS.** The detail reads "APP_URL does not use https. Serve DreamFactory over TLS and set APP_URL to the https address." Put DreamFactory behind TLS (see [CORS and SSL](../system-settings/config/cors-ssl.md)) and set `APP_URL` to the `https://` address. The check also passes when requests arrive over https while `APP_URL` still says http. It does not check certificates or TLS versions.
   - **Idle sessions require signing in again after 60 minutes.** The detail reads "Session tokens last 1440 minutes, and expired tokens can be renewed without signing in for 20160 minutes. Set DF_JWT_TTL and DF_JWT_REFRESH_TTL to 60 or less." Set both, in DreamFactory's `.env` file or as environment variables of your container:

     ```env
     DF_JWT_TTL=60
     DF_JWT_REFRESH_TTL=60
     ```

     Also leave `DF_ALLOW_FOREVER_SESSIONS` unset or `false`. Users then sign in again at least every 60 minutes, even while they are active.
   - **Reads from every SQL database are logged.** The detail starts "Only service changes are recorded (Service Reports)." Click **Fix** to open **System > Logstash**, create a Logstash service, and add a service event for every SQL database: `patients.*`, `billing.*`, `hr.*` and `db.*`. The built-in `db` service counts even when it is empty. See [ELK Stack and Logstash Integration](../system-settings/logstash.md) for the Logstash side.

   If you cache Laravel configuration (`php artisan config:cache`), rebuild the cache after you change these settings. Then reload the baseline to re-run the checks.

5. **Do the manual checks.** Expand **Manual checks**. For HIPAA they are: Encryption at rest on your databases, Business associate agreements in place, Emergency access procedure documented, and Ages over 89 and admission, discharge and death dates. DreamFactory cannot check these; keep your own evidence for them.

6. **Export the evidence.** Click **Export** and choose **JSON** or **CSV**. See [Evidence export](#evidence-export).

   ![The Export menu open on the tracked HIPAA baseline, offering JSON and CSV](/img/security/data-masking/compliance-export-menu.png)

## What Apply changes

Apply sets the DreamFactory settings the baseline requires, in one transaction, and marks the baseline as tracked. The dialog lists each change before you confirm. When nothing needs to change, it says "Your settings already match. Applying starts tracking this baseline." With the API, `GET /api/v2/system/security_baseline/{id}` returns the same list as `changes`.

Every baseline applies these rules:

| Setting | What Apply does | Change text |
|---|---|---|
| Masking mode | Raises Off to Preview. Raises to On only when you tick "Mask values now (masking On)". Never lowers the mode. | "Set masking to Preview (values unchanged)." / "Turn masking on (now Preview)." / "Turn masking on." |
| AI and MCP sessions | Sets **Same as admins** back to **Always masked**. | "Mask values for AI and MCP sessions (now the same as admins)." |
| Admins | Changes **All admins** to **Selected**. | "Admins see real values only with a time-limited grant (now all admins)." |
| Admin grants | Shortens grants that run longer than the baseline's limit, including **Until turned off** grants, to the strictest limit among all tracked baselines. Never removes a grant. | "Limit Jordan Lee's access to real values to 8 hours (now no end date)." |
| Roles | Narrows roles that see real values for **All classes** to **All except restricted**. SOC 2 and ISO 27001 leave roles alone. | "Role support: real values except restricted data (now all data)." |
| Mask formats | Changes a class's format only when the current one is not allowed, and picks one that also suits the other tracked baselines. | "Date of birth: mask as Year only (now Token)." |
| Detection rules | Adds each of the baseline's rules once. An identical rule from any source counts as present. | "Add a detection rule: Medical record, patient and chart numbers are Health & special category." |

What differs per baseline:

| Baseline | Grant limit | Roles | Mask formats | Detection rules added (all match column names) |
|---|---|---|---|---|
| HIPAA | 8 hours | All except restricted | Date of birth: Year only, Redact or Null (sets Year only). Age: Redact or Null (sets Redact). | "Medical record, patient and chart numbers" and "Health plan beneficiary and Medicare/Medicaid numbers", both as Health & special category |
| PCI DSS | 8 hours | All except restricted | Card number: Last 4, Redact or Null (sets Last 4) | "Card number abbreviations (pan, cc_num, card_no)" as Card number; "Card codes, track data and PIN blocks" as Card security code; "Card expiry fields" as Card expiry; "Cardholder names" as Person name |
| GLBA | 24 hours | All except restricted | None | "Account and loan numbers" as Bank account; "Balances, credit scores and income" as Personal financial |
| CJIS | 8 hours | All except restricted | None | "FBI, state ID, booking, arrest and warrant numbers", "Case, incident and citation numbers", "Criminal history fields" and "Biometric fields", all as Health & special category |
| GDPR | 24 hours | All except restricted | None | None |
| SOC 2 | 24 hours | Unchanged | None | None |
| ISO 27001 | 24 hours | Unchanged | None | None |

Apply never loosens a setting, clears masking, or removes an admin decision, grant, role setting or rule. A column an admin marked **Not sensitive** stays not sensitive even when a baseline rule matches its name. Rules a baseline added stay after you stop tracking it.

:::warning[Apply can change what apps and admins receive]
Settings are instance-wide, so one Apply changes every baseline's score and every caller. Narrowing a role to **All except restricted** means apps on that role get masked restricted values. Shortened grants end sooner. With "Mask values now (masking On)" ticked, apps, AI tools and admins without access start getting masked values. Read the list in the dialog before you click **Apply**.
:::

### Turning masking on with Apply

The "Mask values now (masking On)" box appears only after a scan has found columns and while masking is not On. Ticking it adds the mode change to the list, and the toast after Apply reads "HIPAA baseline applied. Masking is on." The API equivalent is `{"mode": "on"}`, and before a scan has found columns it fails with 409 `Scan your databases before turning masking on.` The **Fix** link on "PHI is masked in API responses" (and its equivalent in other baselines) opens the dialog with the box already ticked.

### Applying before the first scan

On an instance where no scan has found columns yet, Apply raises masking from Off to Preview and starts a scan of every database Data Masking covers. The toast reads "HIPAA baseline applied. Scanning…", the page shows "Scanning databases…", and Activity records "Scan started by the HIPAA baseline". Masking stays in Preview until you turn it On. See [Get started](./data-masking/get-started.md) for reviewing the scan.

### Tracking

A tracked baseline is marked as adopted, with who adopted it and when. Tracking does not lock settings. If someone later loosens a setting that Apply manages, the matching check fails and **Apply** reappears with a count. On the Access tab, grant durations longer than a tracked baseline allows are marked "Exceeds HIPAA" (or the baseline's name), but they can still be saved. Apply shortens them the next time it runs.

## Notable checks

- **Masking checks need a scan.** The mode, scan, review and "marked not sensitive" checks never pass before the first scan. The mask format check can, because it reads only the format settings. The review and "marked not sensitive" checks say "No database has been scanned yet, so no column is classified.", and the scan check lists the databases not scanned in the last 30 days. A database the last scan could not read counts as not scanned: "The last scan couldn't read Billing." Databases are named by their label, as on the Data Masking page.
- **Preview does not pass.** Every "is masked in API responses" check requires masking On. In Preview it fails with "Masking is in Preview: values are not masked yet." With masking On and a database that was never scanned, it fails with a detail such as "Masking is on, but 1 database has never been scanned: HR."
- **Databases Data Masking cannot scan make the scan check manual.** With a MongoDB, DynamoDB or Cassandra service, "All databases scanned in the last 30 days" becomes **Check manually** once every SQL database has been scanned in the last 30 days, and its detail ends with `Data Masking can't scan <name>: check it by hand.` Until then it fails as usual. CJIS has no scan or review check.
- **An unreadable scan history is not "never scanned".** If the system database cannot return the scan history, the masking checks fail with `Could not be checked: see the DreamFactory log.` and the JSON report includes `masking.inventory.scan_history_error`. Fix the system database, then reload.
- **"No ... marked not sensitive" counts confident detections only.** It fails only for columns that detection scored 70 or more and an admin then marked **Not sensitive**. Rejecting a to-review suggestion does not fail it. Each baseline protects different classes (table below).
- **Roles and restricted data.** "Roles never see restricted real values" (PCI DSS: "Roles never see full card data") fails when a role sees real values for **All classes**. Apply narrows the role. SOC 2 and ISO 27001 have no role check.
- **The super admin check.** "A super admin approves real-value access" passes when a df-compliance root admin is designated: "A super admin is designated: only they can give access to real values or lower the masking mode." Without one, every admin can do both. Designate one with `php artisan df:root_admin --admin_id=<id>`, a df-compliance command. Without df-compliance the check fails and asks you to install it. GDPR has no super admin check.
- **The logging check.** "Reads from every SQL database are logged" passes when the MongoDB request log is on (df-mongo-logs installed and `LOGSDB_ENABLED=true`). It also passes when an active Logstash service receives both read events, `<service>._table.{table_name}.get` and `<service>._table.{table_name}.{id}.get`, for every SQL database, or the wildcard `<service>.*`. DreamFactory only uses the wildcard for an event that no service subscribes to by its exact name. Service Reports record service changes only and do not count. With no SQL database services, the check is not applicable.
- **The idle-session check needs two settings.** DreamFactory renews an expired token without credentials until `DF_JWT_REFRESH_TTL` after sign-in (default 20160 minutes, 14 days). So the check needs `DF_JWT_TTL` and `DF_JWT_REFRESH_TTL` at or below the limit: 15 minutes for PCI DSS, 30 for CJIS, and 60 for HIPAA, GLBA and ISO 27001. `DF_ALLOW_FOREVER_SESSIONS` must not be true. The trade-off: users sign in again at least that often, even while active. GDPR and SOC 2 have no session check.
- **Other automatic checks.**
  - Admins unused for 90 days (PCI DSS, CJIS, SOC 2, ISO 27001). Admins who never signed in count from the day the account was created.
  - Open user registration (every baseline). It fails while any active service allows open registration.
  - Masking activity kept for at least a year (PCI DSS, CJIS). It passes when `DF_MASKING_ACTIVITY_RETENTION_DAYS` is 365 or more, or 0 (forever). The default, 400, passes.
  - Debug mode (PCI DSS, CJIS, SOC 2, ISO 27001) fails while `APP_DEBUG` is on.
  - CORS (SOC 2, ISO 27001) fails while an enabled CORS rule allows every origin (`*`).
  - API rate limits (SOC 2) fails when API limits are not installed or none is active.
- **Infrastructure and process controls are manual.** Encryption at rest, agreements, MFA, access reviews, backups and the like are listed under **Manual checks**.

### Checks per baseline

| Check (`control_id`) | HIPAA | PCI DSS | GLBA | CJIS | GDPR | SOC 2 | ISO 27001 |
|---|---|---|---|---|---|---|---|
| Data is masked in API responses (`masking.mode`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| All databases scanned in the last 30 days (`masking.scanned`) | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| No columns waiting for review (`masking.review`) | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| No protected data marked not sensitive (`masking.classes`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mask format (`masking.format`) | Dates of birth show the year at most, and ages are hidden | Card numbers show at most the last 4 digits | — | — | — | — | — |
| AI and MCP sessions get masked values (`access.ai`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admins need a grant to see real values (`access.admins_all`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin grants expire within (`access.grant_expiry`) | 8 hours | 8 hours | 24 hours | 8 hours | 24 hours | 24 hours | 24 hours |
| Roles never see restricted real values (`access.roles_restricted`) | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Admins unused for 90 days are disabled (`access.inactive_admins`) | — | ✓ | — | ✓ | — | ✓ | ✓ |
| API served over HTTPS (`platform.https`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Idle sessions require signing in again after (`platform.session_ttl`) | 60 minutes | 15 minutes | 60 minutes | 30 minutes | — | — | 60 minutes |
| Debug mode is off (`platform.debug`) | — | ✓ | — | ✓ | — | ✓ | ✓ |
| No CORS rule allows every origin (`platform.cors`) | — | — | — | — | — | ✓ | ✓ |
| API rate limits are active (`platform.rate_limit`) | — | — | — | — | — | ✓ | — |
| Reads from every SQL database are logged (`platform.audit`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Masking activity kept for at least a year (`platform.log_retention`) | — | ✓ | — | ✓ | — | — | — |
| A super admin approves real-value access (`platform.root_admin`) | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Open user registration is off (`platform.open_registration`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Automated checks** | **14** | **17** | **13** | **14** | **11** | **15** | **15** |

The titles of the `masking.mode` and `masking.classes` checks name each framework's data, for example "PHI is masked in API responses" and "No PHI identifiers marked not sensitive" for HIPAA, or "Card data is masked in API responses" and "No card data marked not sensitive" for PCI DSS.

### Protected classes

These are the classes that "No ... marked not sensitive" watches in each baseline. See [Classes and mask formats](./data-masking/classes-and-formats.md) for the classes.

| Baseline | Classes |
|---|---|
| HIPAA | Person name, Street address, Postal code, Precise location, Date of birth, Age, Phone, Email, National ID, Tax ID, Health & special category, Bank account, Card number, Driver's license, Passport number, IP address, Username, Free text with personal data |
| PCI DSS | Card number, Card security code |
| GLBA | Bank account, Card number, Card security code, National ID, Tax ID, Personal financial |
| CJIS | Health & special category, National ID, Driver's license, Passport number, Date of birth |
| GDPR | Person name, Email, Phone, Street address, Date of birth, IP address, Username, Precise location, Health & special category, National ID, Passport number, Driver's license, Tax ID, Bank account, Card number |
| SOC 2 and ISO 27001 | The nine Restricted classes: National ID, Tax ID, Passport number, Driver's license, Card number, Card security code, Bank account, Credential, Health & special category |

### Manual checks per baseline

| Baseline | Manual checks |
|---|---|
| HIPAA | Encryption at rest on your databases; Business associate agreements in place; Emergency access procedure documented; Ages over 89 and admission, discharge and death dates |
| PCI DSS | Stored card numbers are unreadable; No security codes or track data kept after authorization; User access reviewed every six months |
| GLBA | Multi-factor authentication for everyone with access; Customer information encrypted at rest; Yearly penetration test and twice-yearly vulnerability scans; Access controls reviewed periodically |
| CJIS | CJI encrypted at rest (FIPS 140-3, 256-bit keys); Multi-factor authentication for every user who reaches CJI; API logs kept for at least one year |
| GDPR | Encryption at rest on your databases; Records of processing activities kept; Impact assessment for high-risk processing |
| SOC 2 | Encryption at rest on your databases; User access reviewed periodically; Incident response plan in place |
| ISO 27001 | Encryption at rest on your databases; Access rights reviewed at planned intervals; Backups taken and restores tested |

Some manual items carry a useful note. PCI DSS reminds you that masking hides security codes and track data but does not remove them: delete them from your databases. SOC 2's incident response item points to `php artisan df:masking revoke --all` for removing every admin's real-value access at once. ISO 27001's backup item reminds you to include the DreamFactory system database, which holds the masking decisions and settings.

## Evidence export

Click **Export** and choose **JSON** or **CSV**. The admin app downloads the server's report unchanged, as `dreamfactory-<id>-baseline-YYYY-MM-DD.json` or `.csv`, for example `dreamfactory-hipaa-baseline-2026-11-16.csv`. The admin app uses your local date in the file name; the server's own download name uses the UTC date.

Neither format contains data values. Both carry the frameworks and the disclaimer.

| | CSV | JSON |
|---|---|---|
| **Use it for** | A checklist in a spreadsheet or GRC tool | A full evidence record |
| **Contents** | One row per check, manual checks included | Instance facts, the baseline and its tracking dates, the score, every check, pending changes, masking settings and column counts, who sees real values, and the masking activity of the last 90 days (up to 5,000 entries) |
| **Columns or keys** | `baseline_id`, `baseline`, `control_id`, `title`, `status`, `detail`, `references`, `generated_at`, `frameworks`, `disclaimer` | `report`, `generated_at`, `disclaimer`, `instance`, `baseline`, `score`, `controls`, `pending_changes`, `masking`, `access`, `activity` |

CSV details:

- `status` is `pass`, `fail`, `manual` or `na`.
- `references` and `frameworks` join several values with `; `.
- The file is RFC 4180 CSV with a header row. A cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage return gets a leading `'`, so spreadsheets do not run it as a formula.
- The `disclaimer` column repeats on every row, so a filtered row still carries it.

The JSON report has no data values, but it does name your admins with their email addresses (in `access.admin_grants`), and it includes the server's host name, `APP_URL` and license level. Treat it as internal.

From the API, request `GET /api/v2/system/security_baseline/{id}/report?format=json` or `format=csv`. The CSV always comes back as `text/csv; charset=utf-8` with an attachment header, whatever the `Accept` header says. The JSON is a normal DreamFactory response; add `download=true` for an attachment header.

```bash
curl -s "https://your-dreamfactory-instance.com/api/v2/system/security_baseline/hipaa/report?format=csv" \
  -H "X-DreamFactory-Session-Token: <admin session token>" \
  -o dreamfactory-hipaa-baseline.csv
```

There is no CLI command for the export. See the [API and CLI reference](./data-masking/api-and-cli.md) for every endpoint.

## Stop tracking

Click **Stop tracking** on a tracked baseline. It runs at once, with no confirmation, and the toast reads "Stopped tracking HIPAA". Activity records "Stopped tracking the HIPAA baseline (settings unchanged)".

Stop tracking undoes nothing. The mode, access settings, formats and rules that Apply changed stay as they are, and the baseline keeps its live score in the list. To reverse a change, make it yourself: loosening access or lowering the mode needs the super admin (see [Who sees real values](./data-masking/access.md)), and baseline rules can be deleted on the **Detection** tab. A deleted baseline rule shows up again in that baseline's Apply list.

From the API: `DELETE /api/v2/system/security_baseline/{id}`.

## Command line

The `df:masking` command lists and applies baselines on the server. Shell access makes you the operator, and changes are logged with the actor "Command line".

```bash
php artisan df:masking baseline list [--json]
php artisan df:masking baseline apply hipaa [--mode=on]
php artisan df:masking setup --baseline=hipaa [--mode=preview|on]
```

- `baseline list` prints a table with the columns `id`, `baseline`, `vertical`, `adopted` (`yes` or `no`) and `checks`, for example `11 pass, 3 fail, 4 manual`. Here the manual count is included, unlike the admin app's score.
- `baseline apply` prints what it changed and the new score. Run in the Acme Health state from step 1 of the walkthrough, before Apply, it prints:

  ```text
  HIPAA baseline adopted.
    - Add a detection rule: Medical record, patient and chart numbers are Health & special category.
    - Add a detection rule: Health plan beneficiary and Medicare/Medicaid numbers are Health & special category.
    Checks: 11 pass, 3 fail, 4 manual
  ```

  When nothing needs changing, it prints `Nothing needed changing.` instead of the list. On an instance where no scan has found columns, it also prints `First scan started: php artisan df:masking status`.
- `--mode=on` also turns masking on. Before a scan has found columns it prints `Scan your databases before turning masking on.` and exits 1.
- `setup --baseline=ID` creates the tables, scans every SQL database, then applies the baseline (step `3/4 Applying the hipaa baseline...`). See [Install and operate](./data-masking/operations.md).

There is no command to stop tracking. Use the admin app or the API. The [API and CLI reference](./data-masking/api-and-cli.md#dfmasking-baseline) lists every message and exit code.

## Who can use baselines

- Only full system administrators can open the page or call `system/security_baseline`. Restricted admins (admins with a role), and roles or API keys granted the `system` service, get 403 `Only a system administrator can view Compliance baselines.`
- Any full system admin can apply a baseline or stop tracking one, because Apply only tightens. Loosening a setting afterwards follows the normal Data Masking rules.
- AI and MCP sessions can read baselines but cannot apply or stop them (403 `AI sessions cannot change compliance baselines.`). The attempt is logged under Activity > **Blocked**.

## Related

- [Data Masking overview](./data-masking/overview.md): what the masking checks measure
- [Who sees real values](./data-masking/access.md): admins, grants, roles and AI sessions
- [Custom rules](./data-masking/custom-rules.md): baseline rules on the Detection tab
- [Activity log](./data-masking/activity.md): Apply and Stop tracking entries as evidence
- [API and CLI reference](./data-masking/api-and-cli.md): `system/security_baseline` in full
- [Troubleshooting and limits](./data-masking/troubleshooting.md)
- [Rate Limiting](./rate-limiting.md) and [Role-Based Access](./role-based-access.md)

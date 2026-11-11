# Choreo N Concept landing pages

- `/fees-timing/` Fees & Timing ad page (native lead form)
- `/wedding-choreography/` Wedding choreography ad page
- `/api/lead` Vercel function that emails every form submission to the studio

## Lead form setup (one time, in Vercel)

Import this repo into Vercel, then add these environment variables and redeploy:

| Name | Value |
| --- | --- |
| `SMTP_USER` | The sending mailbox, e.g. a Zoho address |
| `SMTP_PASS` | An app-specific password for that mailbox |
| `SMTP_HOST` | `smtp.zoho.in` (India accounts, default), `smtp.zoho.com` (US), `smtp.zoho.eu` (EU) |
| `LEAD_TO` | Optional. Defaults to `cncstudio45@gmail.com` |

Each email includes the form (Book a Trial or Request a Callback), name, email, phone, page, referrer and any UTM / fbclid / gclid values.

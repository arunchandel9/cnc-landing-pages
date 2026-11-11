# Choreo N Concept landing pages

- `/fees-timing/` Fees & Timing ad page (native lead form)
- `/wedding-choreography/` Wedding choreography ad page
- `/api/lead` Vercel function that emails every form submission to the studio

## Lead form setup (one time, in Vercel)

Import this repo into Vercel, then add these environment variables and redeploy:

| Name | Value |
| --- | --- |
| `GMAIL_USER` | `cncstudio45@gmail.com` |
| `GMAIL_APP_PASSWORD` | A Google App Password for that account (Google Account > Security > 2-Step Verification > App passwords) |
| `LEAD_TO` | Optional. Defaults to `cncstudio45@gmail.com` |
| `LEAD_WEBHOOK_URL` | Optional. Also sends each lead as JSON to this URL (e.g. a LeadPipeline inbound webhook) |

Each email includes the form (Book a Trial or Request a Callback), name, email, phone, page, referrer and any UTM / fbclid / gclid values.

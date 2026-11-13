# Replace the existing Astonishing Touch site

Prepared 12 November 2026. This is a verified migration plan, not a claim that the Wix cutover has occurred.

## Current state

- Existing public domain: `www.astonishingtouchhealthcare.org`; the legacy site is still serving from Wix.
- Authoritative DNS: `ns12.wixdns.net`, `ns13.wixdns.net`. DNS changes currently belong in Wix, regardless of the domain's registration provider. The user's reference to Monster has not been confirmed as a registrar.
- New application: Next.js frontend and server voice/assistant endpoints on the Astonishing Touch Vercel project. Only its `vercel.app` domain is attached.
- The new site's canonical origin already matches the existing public domain. `app/search-config.ts` deliberately keeps indexing disabled until the authorized domain launch.

## Keep the client on Wix: supported custom-frontend migration

Wix now supports replacing an Editor/Studio frontend with a coded Headless frontend on the existing site. This is different from embedding this site inside an iframe or uploading a Next.js ZIP to the classic Editor.

The owner/co-owner opens the existing site's **Settings → Headless Settings → Headless Migration → Start Migration**, reviews supported apps, and copies the site-specific migration prompt. Send that prompt to the developer. The current site remains live during building and preview.

The prompt and an authenticated Wix connection are the missing inputs. No Wix session, site ID, app support inventory or migration prompt has been supplied in this workspace. Do not guess a site ID, create a duplicate client site, or complete migration before the adapted site is verified.

Implementation work after receiving the prompt:

1. Adapt the current frontend into the Wix-supported project scaffold; preserve the approved assets, transparent header, heavy pills, sequential fades, service pages and original copy.
2. Configure the speech, live-token and assistant server endpoints in a supported backend. Keep provider keys server-side. If any endpoints remain externally hosted, implement explicit allowed origins and verify microphone permissions and spoken replies on the final domain. Do not silently replace Gemini with browser speech.
3. Connect any Wix forms, Contacts, Bookings and notification flows actually required. Existing dashboard data can remain, but old Editor form widgets do not automatically become working forms in a custom frontend.
4. Map every existing legacy URL, including Employment Opportunities, to an equivalent destination or a 301 redirect. Confirm analytics, privacy copy, contact details and mobile behavior.
5. Preview on Wix; verify voice dialogue, video playback, fades, keyboard/reduced-motion behavior, contact delivery and HTTPS. Complete Migration only when the intended new frontend is ready to replace the old one.
6. Enable public indexing for the launch build; verify robots, canonical URLs and sitemap, then submit the sitemap through the client's search accounts. Keep the rollback route available in Wix Headless Settings.

Wix says the existing plan/domain can remain during this process, and the owner can switch back. The particular account's eligibility and apps must still be checked.

## Alternative: publish the current build on the same domain from Vercel

This avoids porting the Next.js application, but it changes website hosting away from Wix. The domain registration and DNS can stay where they are. Do not treat this alternative as an instruction to change the client's hosting preference.

Attach both apex and `www` to the intended Vercel project, choose the `www` canonical destination, and get its current project-specific DNS/verification instructions. Edit only the required website A/CNAME records in Wix Domains → Domain Actions → Manage DNS records. Preserve MX, SPF, DKIM, DMARC, other TXT and unrelated subdomains. Do not change nameservers as a shortcut. Verify propagation, certificate, redirects, voice endpoints and forms before considering the cutover complete. Enable indexing on the domain launch build.

Read-only Vercel configuration inspection returned the following recommendations on 12 November 2026. These must be rechecked at actual connection time; they are not universal Vercel constants and no records have been changed:

| Host | Type | Observed project recommendation |
| --- | --- | --- |
| Apex (blank host in Wix) | A | Rank-one address set: `216.198.79.1`, `64.29.17.1` |
| `www` | CNAME | `e7c1e1d30af018f2.vercel-dns-017.com.` |

## Primary references

- https://support.wix.com/en/article/wix-headless-moving-your-site-to-a-custom-frontend
- https://dev.wix.com/docs/go-headless/self-managed-headless/about-self-managed-headless
- https://support.wix.com/en/article/managing-dns-records-in-your-wix-account
- https://vercel.com/docs/domains/set-up-custom-domain

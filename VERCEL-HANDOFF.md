# Vercel handoff — Astonishing Touch

This archive contains the complete source, brand files, images and cinematic videos for the Astonishing Touch website.

## What can be moved directly

- All React UI, pages, styling, video assets, images and SEO content.
- The `public/` directory, including the full-screen hero and nine service videos.
- `app/` content and service pages.

## What requires conversion before deployment

This is currently a Cloudflare Workers / D1 project, not a Vercel-native project. Do not deploy it to Vercel unchanged.

1. Replace the Cloudflare Vite plugin and Worker-specific configuration with a Vercel-compatible Next.js or Vite deployment configuration.
2. Port `app/api/inquiries` from D1 to Vercel Postgres, Supabase, or another database. Create the needed environment variables in Vercel.
3. Port the `app/api/assistant` runtime adapter and add its AI provider key as a Vercel environment variable. Do not add secrets to the repository.
4. Keep `app/search-config.ts` set to `publicIndexing=false` until the owner approves public indexing and the live domain is connected.
5. Test the full site, form submission and voice assistant after the conversion.

## Recommended Vercel route

Create a GitHub repository from this archive, import it into Vercel, then have a coding agent perform the small platform conversion above. The visual website and media assets should remain untouched.

## Existing project notes

- Use Node 22 or later.
- Install dependencies with `npm ci` (or `npm install` if no lockfile is present), then run `npm run build` after conversion.
- Production secrets were intentionally excluded from this archive.

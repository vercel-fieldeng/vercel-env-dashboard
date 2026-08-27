# Vercel Env Dashboard

A single place to see every environment variable assigned to every project in your Vercel team.

Vercel's own dashboard makes you click into each project, then into its settings, to see how it's configured. If your team has thirty projects, answering "which projects still point at the old database host?" or "did anyone set `LOG_LEVEL` on staging?" means thirty round trips. This app puts all of it behind one URL: pick a project, see its variables, filter, and read the values that Vercel allows to be read.

## What you get

- **Every project in the team, in one list** — name, framework, and when it was last updated. Click through to a project's variables.
- **All variables for a project on one screen** — key, environment (Production / Preview / Development), the Git branch it's scoped to, and when it last changed.
- **Filter while you look** — tabs for each environment and a live filter by variable name.
- **Reveal values on demand** — values are masked by default; click the eye icon to show one. Revealing a value automatically hides the previous one, so nothing stays exposed on screen while you're sharing it.
- **A shareable link per project** — `/project/<project-name>` goes straight to that project's variables.

## What it deliberately can't do

- **Secrets stay secret.** Variables that Vercel marks as sensitive or secret are encrypted and cannot be decrypted by anyone, including this app. They show a lock icon instead of a reveal button. Only plain and standard-encrypted configuration values can be read.
- **It's read-only.** There is no create, edit, or delete. The app never writes to your projects.
- **It's not public.** Every page and API route requires a verified [Vercel Passport](https://vercel.com/docs/passport) identity. Without one, the app renders an "Access required" screen and returns nothing.

## Deploy it to Vercel

You need a Vercel team on the Enterprise plan (Passport is an Enterprise feature) and Owner access to it.

### 1. Create the project

Import this repository into Vercel at [`vercel.new`](https://vercel.new) — it's a standard Next.js app and needs no build configuration. Deploy it as its own project in the team whose variables you want to inspect.

### 2. Set the environment variables

Add these under **Project Settings → Environment Variables**, for Production (and Preview, if you plan to use preview deployments):

| Variable | Required | Value |
| --- | --- | --- |
| `VERCEL_API_TOKEN` | Yes | A [Vercel API token](https://vercel.com/account/settings/tokens) scoped to the team, with read access to **all** its projects. |
| `VERCEL_TEAM_ID` | Yes | The slug or ID of the team to inspect, from **Team Settings → General**. |

Mark `VERCEL_API_TOKEN` as **Sensitive** so it can't be read back out of the dashboard. The app only ever calls Vercel's read endpoints.

If either variable is missing, the app loads but shows a "Connect Vercel access" message instead of your projects.

### 3. Enable Passport

This is not optional. The app has no login of its own; it relies entirely on Passport to decide who gets in.

1. Open **Project Settings → Passport**.
2. Turn the **Passport** toggle on.
3. Select an existing Vercel Connect application, or create one for your identity provider (Okta, Microsoft Entra ID, or any OpenID Connect provider). Your provider must allow `https://connect.vercel.com/callback` as a redirect URI.
4. Save.

With Passport on, Vercel authenticates visitors before a request ever reaches the app, and the app additionally checks the verified identity on every page and API route. With Passport off, that check finds no identity and the app refuses to show anything — it fails closed, but it's also useless, so turn it on.

See [Set up Passport with an identity provider](https://vercel.com/docs/passport/set-up-identity-provider) for the full provider walkthrough.

### 4. Redeploy

Environment variables are read at request time, but a redeploy after changing them is the reliable way to pick up new values. Open the deployment URL and sign in through your identity provider.

## Run it locally

```bash
pnpm install
pnpm dev
```

Put the same two variables in `.env.local`:

```bash
VERCEL_API_TOKEN=your_token
# Slug or team ID
VERCEL_TEAM_ID=team_xxxxxxxx
```

Passport doesn't run in front of a local dev server, so `getIdentity()` returns a stand-in development identity and the dashboard opens without signing in. To check the locked-out path, set `VERCEL_PASSPORT_DEV=0` in `.env.local`.

Open [http://localhost:3000](http://localhost:3000).

Built with Next.js and the Vercel Geist design system.

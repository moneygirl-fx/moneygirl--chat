# Money Girl Chat

Money Girl Chat is kept in its own repository, separate from Money Girl FX.

## Extension
- `manifest.json`
- `background.js`
- `content.js`
- `styles.css`
- `options.html`
- `options.js`

## Cloud backend
The extension is now cloud-ready.

- `worker/index.js` — Cloudflare Worker API
- `wrangler.toml` — Worker configuration
- `config.json` — central API URL used by installed extensions
- `.github/workflows/deploy-worker.yml` — automatic Worker deployment

The NoTrack key is **not committed to GitHub**. Store it as a Cloudflare secret named `NOTRACK_API_KEY`.

## How installed extensions find the backend
The background service worker checks:
1. a per-device API URL saved in the extension settings;
2. `config.json` from this GitHub repository;
3. localhost as a final fallback.

This means after the Cloudflare Worker is deployed, updating `config.json` once can point every installed copy at the online backend.

## Kiwi Browser
Download the repository ZIP, extract it, and load the folder as an unpacked extension in Kiwi Browser.

## Current next step
Deploy the Cloudflare Worker, get its `.workers.dev` URL, then put that URL into `config.json`.

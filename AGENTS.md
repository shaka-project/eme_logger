# EME Call and Event Logger - Agent Guide

A Chrome extension (Manifest V3) that intercepts and logs Encrypted Media
Extension (EME) API calls and events. It supports pluggable formatters via
`document.emeFormatters`.

## Attribution

Read [AGENT-ATTRIBUTION.md](AGENT-ATTRIBUTION.md) for attribution details.

## Directory Overview

| Path | Purpose |
|------|---------|
| `manifest.json` | Extension manifest |
| `content-script.js` | Injected into pages; intercepts EME calls |
| `service-worker.js` | Background service worker |
| `eme-trace-config.js` | Tracing configuration |
| `log-window.html/js` | Log viewer UI |
| `spec/` | Jasmine browser tests |
| `gulpfile.js` | Build script (packages extension as zip) |

## Workflows

Install dependencies (first time or after pulling):

```bash
npm ci
```

Lint:

```bash
npm run lint
npm run lint:fix   # auto-fix where possible
```

Test (downloads browser drivers on first run):

```bash
npm test
xvfb-run -a npm test   # headless on Linux
```

Build (produces `eme_logger-<version>.zip`):

```bash
npm run build
```

## Code Style

- Google JavaScript style (enforced by ESLint)
- 80-character line limit (URLs exempt)
- ES2022, module syntax

## Out of Scope

Publishing to the Chrome Web Store is restricted to project maintainers
and cannot be automated. Do not attempt to publish.

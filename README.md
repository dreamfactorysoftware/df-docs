# DreamFactory Documentation

Source for [https://docs.dreamfactory.com](https://docs.dreamfactory.com), the official DreamFactory docs site. Built with [Docusaurus 3](https://docusaurus.io/).

**Live site:** [https://docs.dreamfactory.com](https://docs.dreamfactory.com)
**Issues:** [github.com/dreamfactorysoftware/df-docs/issues](https://github.com/dreamfactorysoftware/df-docs/issues)

You only need a local build if you are changing the docs.

## Local development

Requires [Node.js](https://nodejs.org/) 18 or newer.

```bash
git clone https://github.com/dreamfactorysoftware/df-docs.git
cd df-docs
npm install
npm run start
```

`npm run start` opens `http://localhost:3000` with live reload.

```bash
npm run build    # production build into build/
npm run serve    # preview that build locally
```

## Repository layout

```
docs/                  Markdown pages (this is the published content)
static/img/            Images referenced as /img/...
docusaurus.config.ts   Site config, navbar, footer
sidebars.ts            Sidebar
scripts/shots.mjs      Optional Playwright capture of the live admin UI
```

## Contributing

1. Branch from `develop`.
2. Edit the Markdown under `docs/`.
3. `npm run build` and fix any broken-link warnings.
4. Open a pull request into `develop`. Verified work on `develop` is promoted to `main` in a single PR.

## Deployment

GitHub Pages publishes from the `gh-pages` branch. From a clean `main`:

```bash
GIT_USER=<your-github-username> USE_SSH=true yarn deploy
```

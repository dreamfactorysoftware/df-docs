# DreamFactory Documentation

Official documentation for [DreamFactory Platform](https://www.dreamfactory.com/) — an open-source REST API platform that auto-generates, secures, and manages APIs for any database, file storage, or external service.

**📖 Read the docs:** [https://docs.dreamfactory.com](https://docs.dreamfactory.com)
**💻 Contribute:** See [Contributing](#contributing-to-the-documentation) below
**🐛 Report issues:** [GitHub Issues](https://github.com/dreamfactorysoftware/df-docs/issues)

---

## About This Documentation

This repository contains the source code for the official DreamFactory documentation site, built using [Docusaurus 3](https://docusaurus.io/). The documentation covers:

- **API Reference** — Auto-generated API endpoints, request/response formats, and authentication
- **Integration Guides** — Step-by-step guides for connecting databases, file systems, and third-party services
- **Deployment & Hosting** — Self-hosted, Docker, and cloud deployment options
- **Administration** — User management, roles, security, and configuration

**Audience:** Developers integrating DreamFactory, API consumers, and DevOps engineers managing DreamFactory instances.

---

## Using the Documentation

The live documentation is available at: **[https://docs.dreamfactory.com](https://docs.dreamfactory.com)**

> **No need to build locally** — just visit the link above to read the docs.
>
> Only follow the steps below if you are contributing to or developing the documentation site itself.

---

## Documentation Structure

```
df-docs/
├── docs/
│   ├── api/          — API reference documentation
│   ├── guides/       — Step-by-step integration guides
│   └── deployment/   — Deployment and hosting guides
├── sidebars.js       — Sidebar navigation configuration
├── docusaurus.config.js — Site configuration
└── static/           — Static assets (images, files)
```

---

## Contributing to the Documentation

We welcome contributions! Whether you're fixing a typo, improving an explanation, or adding a new guide, here's how to get started:

1. **Fork** this repository
2. **Create a feature branch:**
   ```bash
   git checkout -b docs/add-my-section
   ```
3. **Make your changes** — see [Installation](#installation) and [Local Development](#local-development) below to preview them
4. **Commit your changes:**
   ```bash
   git commit -m "docs: add guide for X integration"
   ```
5. **Open a Pull Request** against the `main` branch

For larger changes, please [open an issue](https://github.com/dreamfactorysoftware/df-docs/issues) first to discuss your proposal.

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/dreamfactorysoftware/df-docs.git
cd df-docs
npm install
```

> **Prerequisites:** [Node.js](https://nodejs.org/) >= 18 and npm are required.

---

## Local Development

Start a local development server with live reload:

```bash
npm run start
```

This command starts a local development server and opens a browser window at `http://localhost:3000`. Most changes are reflected live without having to restart the server.

---

## Build

Generate a production-ready static build:

```bash
npm run build
```

This command generates static content into the `build/` directory, which can be served by any static hosting service. To preview the production build locally:

```bash
npm run serve
```

---

## Deployment

### GitHub Pages

If you are hosting on GitHub Pages, deploy with:

```bash
GIT_USER=<Your GitHub username> USE_SSH=true yarn deploy
```

This builds the site and pushes it to the `gh-pages` branch automatically.

### Other Hosting

The contents of the `build/` directory after running `npm run build` can be deployed to any static hosting provider (Netlify, Vercel, AWS S3, etc.).

---

## License

This documentation is licensed under the [MIT License](LICENSE). See the `LICENSE` file for details.
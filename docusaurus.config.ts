import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import localSearch from "@easyops-cn/docusaurus-search-local";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const structuredData = {
  softwareApplication: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DreamFactory",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, Windows, Docker, Kubernetes",
    description:
      "Auto-generate secure REST APIs from any database. Self-hosted, enterprise-grade, with built-in RBAC and API key management.",
    url: "https://www.dreamfactory.com",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Open-source community edition available free",
    },
    applicationSubCategory: "API Management Platform",
    downloadUrl: "https://github.com/dreamfactorysoftware/dreamfactory",
    softwareVersion: "7.0",
    author: {
      "@type": "Organization",
      name: "DreamFactory Software, Inc.",
      url: "https://www.dreamfactory.com",
    },
  },
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DreamFactory Software, Inc.",
    url: "https://www.dreamfactory.com",
    logo: "https://www.dreamfactory.com/hs-fs/hubfs/DreamFactory_Horizontal_Color.png",
    sameAs: [
      "https://github.com/dreamfactorysoftware",
      "https://twitter.com/dreamfactory",
      "https://www.linkedin.com/company/dreamfactory-software-inc",
      "https://www.youtube.com/@DreamfactorySoftware",
    ],
  },
  webSite: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DreamFactory Documentation",
    url: "https://docs.dreamfactory.com",
    publisher: {
      "@type": "Organization",
      name: "DreamFactory Software, Inc.",
    },
  },
};

const config: Config = {
  title: "DreamFactory Docs",
  tagline: "Governed API Access to Any Data Source",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://docs.dreamfactory.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "dreamfactorysoftware", // Usually your GitHub org/user name.
  projectName: "df-docs", // Usually your repo name.

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  headTags: [
    {
      tagName: "script",
      attributes: { type: "application/ld+json" },
      innerHTML: JSON.stringify(structuredData.softwareApplication),
    },
    {
      tagName: "script",
      attributes: { type: "application/ld+json" },
      innerHTML: JSON.stringify(structuredData.organization),
    },
    {
      tagName: "script",
      attributes: { type: "application/ld+json" },
      innerHTML: JSON.stringify(structuredData.webSite),
    },
  ],

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
        gtag: {
          trackingID: 'G-J8Y3DGXB4D',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    metadata: [
      { name: "description", content: "DreamFactory documentation — a self-hosted platform providing governed API access to any data source for enterprise apps and local LLMs." },
      { name: "keywords", content: "DreamFactory, API platform, governed API access, self-hosted, enterprise data access, RBAC, database API, LLM" },
    ],
    navbar: {
      title: "DreamFactory",
      logo: {
        alt: "DreamFactory Logo",
        src: "img/logo.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://github.com/dreamfactorysoftware/df-docs",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Documentation",
              to: "/introduction",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Github",
              href: "https://github.com/dreamfactorysoftware/dreamfactory",
            },
            {
              label: "Twitter",
              href: "https://twitter.com/dreamfactory",
            },
            {
              label: "Facebook",
              href: "https://www.facebook.com/dreamfactorysoftware",
            },
            {
              label: "LinkedIn",
              href: "https://www.linkedin.com/company/dreamfactory-software-inc",
            },
            {
              label: "YouTube",
              href: "https://www.youtube.com/@DreamfactorySoftware",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "DreamFactory Blog",
              to: "https://blog.dreamfactory.com",
            },
            {
              label: "Legacy Guide",
              to: "https://guide.dreamfactory.com/docs",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} DreamFactory Software, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
  plugins: [
    [
      localSearch,
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      {
        hashed: true,
        indexPages: true,
      },
    ],
    require.resolve('./src/plugins/lightboxPlugin.js'),
  ],
};

export default config;

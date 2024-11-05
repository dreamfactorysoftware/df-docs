// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

const { themes: prismThemes } = require("prism-react-renderer");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "DreamFactory Docs",
  tagline: "Instant API Generation",
  url: "https://dreamfactory-docs.netlify.app",
  baseUrl: "/",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "dreamfactorysoftware", // Usually your GitHub org/user name.
  projectName: "df-docs", // Usually your repo name.

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.js",
          editUrl: "https://github.com/dreamfactorysoftware/df-docs/tree/main/",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "DreamFactory",
        logo: {
          alt: "DreamFactory Logo",
          src: "img/logo.png",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "intro",
            position: "left",
            label: "Documentation",
          },
          {
            type: "html",
            position: "right",
            value: '<a href="/search" class="button button--primary">Search</a>',
          },
          // {
          //   type: "search",
          //   position: "right",
          // },
          {
            href: "https://github.com/dreamfactorysoftware/dreamfactory",
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
                to: "/intro",
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
                label: "Legacy Blog",
                to: "https://blog.dreamfactory.com",
              },
              {
                label: "Legacy Wiki",
                to: "https://wiki.dreamfactory.com",
              },
              {
                label: "Legacy Docs",
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
      algolia: {
        appId: "QGHNECBGGU",
        apiKey: "533cef8058b7e446e915ebb7a98d2ef2",
        indexName: "dreamfactory",
        contextualSearch: false,
        // externalUrlRegex: "external\\.com|domain\\.com",
        replaceSearchResultPathname: {
          from: "/intro/",
          to: "/",
        },
        searchParameters: {
          attributesToRetrieve: [
            "hierarchy.lvl0",
            "hierarchy.lvl1",
            "hierarchy.lvl2",
            "hierarchy.lvl3",
            "hierarchy.lvl4",
            "hierarchy.lvl5",
            "hierarchy.lvl6",
            "content",
          ],
          hitsPerPage: 10,
        },
        searchPagePath: "search",
      },
    }),
};

module.exports = config;

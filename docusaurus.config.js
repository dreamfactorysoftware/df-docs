const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
(module.exports = {
  title: 'DreamFactory Docs',
  tagline: 'Instant API Generation',
  url: 'https://dreamfactory.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'dreamfactorysoftware', // Usually your GitHub org/user name.
  projectName: 'df-docs', // Usually your repo name.

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', //this isn't working correctly
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/dreamfactorysoftware/df-docs',
        },
        blog: {
          showReadingTime: true,
          path: './blog',
          // Please change this to your repo.
          editUrl:
            'https://github.com/dreamfactorysofware/df-docs/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        // title: 'DreamFactory',
        logo: {
          alt: 'My Site Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Documentation',
          },
          {href:'https://blog.dreamfactory.com/', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/dreamfactorysoftware/dreamfactory',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Documentation',
                to: '/intro',
              },
              {
                label: 'Blog',
                to: '/blog',
              }
            ],
          },
          {
            title: 'Community',
            items: [
              {label: "Github", href: "https://github.com/dreamfactorysoftware/dreamfactory"},
              {
                label: 'Twitter',
                href: 'https://twitter.com/dreamfactory',
              },
              {
                label: 'Facebook',
                href: 'https://www.facebook.com/dreamfactorysoftware',
              },
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/company/dreamfactory-software-inc-',
              },
              {
                label: 'YouTube',
                href: 'https://www.youtube.com/channel/UCX0uK4kq8JxOpbPZpXbXN7w',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: 'https://blog.dreamfactory.com',
              }
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
});

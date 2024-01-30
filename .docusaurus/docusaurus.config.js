export default {
  "title": "DreamFactory Docs",
  "tagline": "Instant API Generation",
  "url": "https://dreamfactory.com",
  "baseUrl": "/",
  "onBrokenLinks": "throw",
  "onBrokenMarkdownLinks": "warn",
  "favicon": "img/favicon.ico",
  "organizationName": "dreamfactorysoftware",
  "projectName": "df-docs",
  "presets": [
    [
      "@docusaurus/preset-classic",
      {
        "docs": {
          "routeBasePath": "/",
          "sidebarPath": "/Users/jacobyi/Desktop/DreamFactory/df-docs/sidebars.js",
          "editUrl": "https://github.com/dreamfactorysoftware/df-docs"
        },
        "blog": {
          "showReadingTime": true,
          "path": "./blog",
          "editUrl": "https://github.com/dreamfactorysofware/df-docs/blog/"
        },
        "theme": {
          "customCss": "/Users/jacobyi/Desktop/DreamFactory/df-docs/src/css/custom.css"
        }
      }
    ]
  ],
  "themeConfig": {
    "navbar": {
      "title": "DreamFactory",
      "logo": {
        "alt": "My Site Logo",
        "src": "img/logo.svg"
      },
      "items": [
        {
          "type": "doc",
          "docId": "intro",
          "position": "left",
          "label": "Documentation"
        },
        {
          "to": "/blog",
          "label": "Blog",
          "position": "left"
        },
        {
          "href": "https://github.com/dreamfactorysoftware/dreamfactory",
          "label": "GitHub",
          "position": "right"
        }
      ],
      "hideOnScroll": false
    },
    "footer": {
      "style": "dark",
      "links": [
        {
          "title": "Documentation",
          "items": [
            {
              "label": "Documentation",
              "to": "/intro"
            },
            {
              "label": "Blog",
              "to": "/blog"
            }
          ]
        },
        {
          "title": "Community",
          "items": [
            {
              "label": "Github",
              "href": "https://github.com/dreamfactorysoftware/dreamfactory"
            },
            {
              "label": "Twitter",
              "href": "https://twitter.com/dreamfactory"
            },
            {
              "label": "Facebook",
              "href": "https://www.facebook.com/dreamfactorysoftware"
            },
            {
              "label": "LinkedIn",
              "href": "https://www.linkedin.com/company/dreamfactory-software-inc-"
            },
            {
              "label": "YouTube",
              "href": "https://www.youtube.com/channel/UCX0uK4kq8JxOpbPZpXbXN7w"
            }
          ]
        },
        {
          "title": "More",
          "items": [
            {
              "label": "Blog",
              "to": "https://blog.dreamfactory.com"
            }
          ]
        }
      ],
      "copyright": "Copyright © 2024 My Project, Inc. Built with Docusaurus."
    },
    "prism": {
      "theme": {
        "plain": {
          "color": "#393A34",
          "backgroundColor": "#f6f8fa"
        },
        "styles": [
          {
            "types": [
              "comment",
              "prolog",
              "doctype",
              "cdata"
            ],
            "style": {
              "color": "#999988",
              "fontStyle": "italic"
            }
          },
          {
            "types": [
              "namespace"
            ],
            "style": {
              "opacity": 0.7
            }
          },
          {
            "types": [
              "string",
              "attr-value"
            ],
            "style": {
              "color": "#e3116c"
            }
          },
          {
            "types": [
              "punctuation",
              "operator"
            ],
            "style": {
              "color": "#393A34"
            }
          },
          {
            "types": [
              "entity",
              "url",
              "symbol",
              "number",
              "boolean",
              "variable",
              "constant",
              "property",
              "regex",
              "inserted"
            ],
            "style": {
              "color": "#36acaa"
            }
          },
          {
            "types": [
              "atrule",
              "keyword",
              "attr-name",
              "selector"
            ],
            "style": {
              "color": "#00a4db"
            }
          },
          {
            "types": [
              "function",
              "deleted",
              "tag"
            ],
            "style": {
              "color": "#d73a49"
            }
          },
          {
            "types": [
              "function-variable"
            ],
            "style": {
              "color": "#6f42c1"
            }
          },
          {
            "types": [
              "tag",
              "selector",
              "keyword"
            ],
            "style": {
              "color": "#00009f"
            }
          }
        ]
      },
      "darkTheme": {
        "plain": {
          "color": "#F8F8F2",
          "backgroundColor": "#282A36"
        },
        "styles": [
          {
            "types": [
              "prolog",
              "constant",
              "builtin"
            ],
            "style": {
              "color": "rgb(189, 147, 249)"
            }
          },
          {
            "types": [
              "inserted",
              "function"
            ],
            "style": {
              "color": "rgb(80, 250, 123)"
            }
          },
          {
            "types": [
              "deleted"
            ],
            "style": {
              "color": "rgb(255, 85, 85)"
            }
          },
          {
            "types": [
              "changed"
            ],
            "style": {
              "color": "rgb(255, 184, 108)"
            }
          },
          {
            "types": [
              "punctuation",
              "symbol"
            ],
            "style": {
              "color": "rgb(248, 248, 242)"
            }
          },
          {
            "types": [
              "string",
              "char",
              "tag",
              "selector"
            ],
            "style": {
              "color": "rgb(255, 121, 198)"
            }
          },
          {
            "types": [
              "keyword",
              "variable"
            ],
            "style": {
              "color": "rgb(189, 147, 249)",
              "fontStyle": "italic"
            }
          },
          {
            "types": [
              "comment"
            ],
            "style": {
              "color": "rgb(98, 114, 164)"
            }
          },
          {
            "types": [
              "attr-name"
            ],
            "style": {
              "color": "rgb(241, 250, 140)"
            }
          }
        ]
      },
      "additionalLanguages": []
    },
    "colorMode": {
      "defaultMode": "light",
      "disableSwitch": false,
      "respectPrefersColorScheme": false,
      "switchConfig": {
        "darkIcon": "🌜",
        "darkIconStyle": {},
        "lightIcon": "🌞",
        "lightIconStyle": {}
      }
    },
    "docs": {
      "versionPersistence": "localStorage"
    },
    "metadatas": [],
    "hideableSidebar": false
  },
  "baseUrlIssueBanner": true,
  "i18n": {
    "defaultLocale": "en",
    "locales": [
      "en"
    ],
    "localeConfigs": {}
  },
  "onDuplicateRoutes": "warn",
  "customFields": {},
  "plugins": [],
  "themes": [],
  "titleDelimiter": "|",
  "noIndex": false
};
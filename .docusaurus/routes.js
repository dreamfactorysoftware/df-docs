
import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug','3d6'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config','914'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content','c28'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData','3cf'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata','31b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry','0da'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes','244'),
    exact: true
  },
  {
    path: '/blog',
    component: ComponentCreator('/blog','520'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive','f4c'),
    exact: true
  },
  {
    path: '/blog/first-blog-post',
    component: ComponentCreator('/blog/first-blog-post','6c7'),
    exact: true
  },
  {
    path: '/blog/long-blog-post',
    component: ComponentCreator('/blog/long-blog-post','f06'),
    exact: true
  },
  {
    path: '/blog/mdx-blog-post',
    component: ComponentCreator('/blog/mdx-blog-post','bee'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags','e13'),
    exact: true
  },
  {
    path: '/blog/tags/docusaurus',
    component: ComponentCreator('/blog/tags/docusaurus','ddf'),
    exact: true
  },
  {
    path: '/blog/tags/facebook',
    component: ComponentCreator('/blog/tags/facebook','ede'),
    exact: true
  },
  {
    path: '/blog/tags/hello',
    component: ComponentCreator('/blog/tags/hello','4c2'),
    exact: true
  },
  {
    path: '/blog/tags/hola',
    component: ComponentCreator('/blog/tags/hola','752'),
    exact: true
  },
  {
    path: '/blog/welcome',
    component: ComponentCreator('/blog/welcome','bfa'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page','be1'),
    exact: true
  },
  {
    path: '/tags',
    component: ComponentCreator('/tags','d7a'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/','ebb'),
    routes: [
      {
        path: '/DreamFactory Configuration/configuration',
        component: ComponentCreator('/DreamFactory Configuration/configuration','142'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/DreamFactory Configuration/Web Server Configuration/certbot',
        component: ComponentCreator('/DreamFactory Configuration/Web Server Configuration/certbot','0ae'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/DreamFactory Configuration/Web Server Configuration/iis',
        component: ComponentCreator('/DreamFactory Configuration/Web Server Configuration/iis','bcc'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/DreamFactory Configuration/Web Server Configuration/nginx',
        component: ComponentCreator('/DreamFactory Configuration/Web Server Configuration/nginx','4ea'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/DreamFactory Upgrades and Migrations/upgrades',
        component: ComponentCreator('/DreamFactory Upgrades and Migrations/upgrades','4ec'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/Installing DreamFactory/docker-installation',
        component: ComponentCreator('/Installing DreamFactory/docker-installation','d2d'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/Installing DreamFactory/installation',
        component: ComponentCreator('/Installing DreamFactory/installation','c05'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/Installing DreamFactory/linux-installation',
        component: ComponentCreator('/Installing DreamFactory/linux-installation','47d'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/Installing DreamFactory/windows-installation',
        component: ComponentCreator('/Installing DreamFactory/windows-installation','578'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/intro',
        component: ComponentCreator('/intro','283'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/tutorial-basics/congratulations',
        component: ComponentCreator('/tutorial-basics/congratulations','4b2'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/tutorial-basics/deploy-your-site',
        component: ComponentCreator('/tutorial-basics/deploy-your-site','317'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/tutorial-basics/generate-db-api',
        component: ComponentCreator('/tutorial-basics/generate-db-api','c1c'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/tutorial-basics/interacting-api',
        component: ComponentCreator('/tutorial-basics/interacting-api','845'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/tutorial-basics/secure-api',
        component: ComponentCreator('/tutorial-basics/secure-api','33f'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/tutorial-basics/test-api',
        component: ComponentCreator('/tutorial-basics/test-api','332'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/tutorial-extras/rotating-keys',
        component: ComponentCreator('/tutorial-extras/rotating-keys','44f'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/tutorial-extras/system-api',
        component: ComponentCreator('/tutorial-extras/system-api','86b'),
        exact: true,
        'sidebar': "tutorialSidebar"
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*')
  }
];

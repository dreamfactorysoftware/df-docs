
import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/',
    component: ComponentCreator('/','deb'),
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
    path: '/contact',
    component: ComponentCreator('/contact','244'),
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
    component: ComponentCreator('/','cd4'),
    routes: [
      {
        path: '/API Creation and Management/api-creation-management',
        component: ComponentCreator('/API Creation and Management/api-creation-management','40a'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/DreamFactory Configuration/configuration',
        component: ComponentCreator('/DreamFactory Configuration/configuration','142'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/DreamFactory Configuration/Laravel and PHP Configuration/laravel-config',
        component: ComponentCreator('/DreamFactory Configuration/Laravel and PHP Configuration/laravel-config','171'),
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
        path: '/Installing DreamFactory/manual-install',
        component: ComponentCreator('/Installing DreamFactory/manual-install','d93'),
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
        path: '/Security and Authentication/api-keys',
        component: ComponentCreator('/Security and Authentication/api-keys','e5b'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/Security and Authentication/limits',
        component: ComponentCreator('/Security and Authentication/limits','159'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/Security and Authentication/role-based-access',
        component: ComponentCreator('/Security and Authentication/role-based-access','9da'),
        exact: true,
        'sidebar': "tutorialSidebar"
      },
      {
        path: '/Security and Authentication/security-and-auth',
        component: ComponentCreator('/Security and Authentication/security-and-auth','94d'),
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

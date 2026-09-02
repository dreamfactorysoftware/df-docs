---
sidebar_position: 1
title: Installing DreamFactory
id: installing-dreamfactory
description: Install DreamFactory on Linux, Windows, Docker, Kubernetes, or Raspberry Pi. Self-hosted deployment for governed API access to your data.
keywords: [DreamFactory installation, self-hosted API platform, install DreamFactory, Docker, Kubernetes, Linux, Windows]
---

# Installing DreamFactory

Welcome to the installation guide for DreamFactory! This section covers deploying DreamFactory in your environment — on-prem or in your own cloud.

DreamFactory is a self-hosted enterprise data access platform. Whether you are running Linux, Windows, Docker, or Kubernetes, choose the deployment method that fits your infrastructure.

## Server hardware

DreamFactory runs on a 64-bit host with at least 4 GB of RAM. If the system database lives on the same server as the app, plan on 8 GB. That host also runs the OS, a web server (Nginx recommended, or Apache), and PHP-FPM. These are minimums; production traffic usually wants more, plus a shared cache (Redis or Memcached) and a dedicated system database.

Linux is the path the installers target. Windows Server and IIS are supported; see the Windows guide if that is the requirement.

## Installation methods

- [Linux Installation](/getting-started/installing-dreamfactory/linux-installation): Automated installer for Ubuntu, Debian, and RHEL-family distributions. Best default for production.

- [Docker Installation](/getting-started/installing-dreamfactory/docker-installation): Containerized setup for development and testing.

- [Windows Installation](/getting-started/installing-dreamfactory/windows-installation): Step-by-step IIS install. Use PHP 8.3 or newer (NTS).

- [Helm Installation](/getting-started/installing-dreamfactory/helm-installation): Kubernetes deployment with the official Helm chart.

- [Raspberry Pi Installation](/getting-started/installing-dreamfactory/raspberrypi-install): 64-bit Raspberry Pi OS on a Pi 4 with 4 GB RAM, for development or light loads.

- [Installing Additional Drivers](/getting-started/installing-dreamfactory/installing-additional-drivers): Oracle (oci8) and Simba Trino ODBC, which are not bundled by default.


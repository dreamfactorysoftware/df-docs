---
sidebar_position: 1
title: Installing DreamFactory
id: installing-dreamfactory
---

# Installing DreamFactory

Welcome to the comprehensive installation guide for DreamFactory! This section covers all supported installation methods and platforms to help you get DreamFactory up and running quickly.

DreamFactory is a powerful open-source REST API platform that allows you to quickly build and deploy secure and scalable applications. With support for multiple deployment options including native installations, containerized environments, and cloud orchestration, you can choose the method that best fits your infrastructure needs.

## Server Hardware Requirements

DreamFactory is surprisingly performant even under minimally provisioned servers. For optimal performance, we recommend installing DreamFactory on a 64-bit server with at least 4GB RAM. If you're planning on hosting the system database on the same server as DreamFactory, then we recommend at least 8GB RAM. This server will house not only the operating system and DreamFactory, but also a web server such as Nginx (recommended) or Apache, and PHP-FPM. Keep in mind these are the minimum RAM requirements; many customers do run DreamFactory in far larger production environments.

Under heavier loads you'll want to load balance DreamFactory across multiple servers, and take advantage of a shared caching (Redis or Memcached are typically used) and database layer (which houses the system database).

### Cloud Environment Minimum Server Requirements

| Cloud Environment | Minimum Server |
|-------------------|----------------|
| AWS | t2.large |
| Azure | D2 v3 |
| Oracle Cloud | VM.Standard.E2.1 |
| Digital Ocean | Standard 8/160/5 |
| Google Cloud | n1-standard-2 |

Although DreamFactory can run on Windows Server and IIS, we recommend instead using a popular Linux distribution such as Ubuntu, Debian, or CentOS in order to take advantage of our automated installers targeting those specific operating systems.

## Installation Methods

Choose the installation method that best suits your environment and technical requirements:

### Native Operating System Installation

- **[Linux Installation](/getting-started/installing-dreamfactory/linux-installation)**: Complete installation guide for various Linux distributions including Ubuntu, Debian, and CentOS. This method provides the most control and is recommended for production environments.

- **[Windows Installation](/getting-started/installing-dreamfactory/windows-installation)**: Step-by-step installation process for Windows servers. While supported, we recommend Linux for production deployments due to better performance and our automated installer support.

- **[Raspberry Pi Installation](/getting-started/installing-dreamfactory/raspberrypi-install)**: Specialized installation guide for Raspberry Pi 4 with 4GB RAM using Raspberry Pi OS 64-bit (Bookworm release 12). Perfect for development, testing, or lightweight production environments.

### Containerized and Orchestrated Deployments

- **[Docker Installation](/getting-started/installing-dreamfactory/docker-installation)**: Containerized setup using Docker Compose with Ubuntu 22.04, PHP 8.1, and NGINX web server. Includes all required PHP extensions and a sample PostgreSQL database - ideal for development and testing environments.

- **[Helm Installation](/getting-started/installing-dreamfactory/helm-installation)**: Kubernetes deployment using the official DreamFactory Helm chart. Perfect for cloud-native environments and production deployments requiring high availability and scalability.

### Post-Installation Configuration

- **[Installing Additional Drivers](/getting-started/installing-dreamfactory/installing-additional-drivers)**: Guide for enabling additional database drivers not included by default due to licensing restrictions, including Oracle (oci8) and Simba Trino ODBC drivers.

## Quick Start Recommendations

- **New to DreamFactory?** Start with the [Docker Installation](/getting-started/installing-dreamfactory/docker-installation) for the fastest setup and experimentation.
- **Production deployment?** Use the [Linux Installation](/getting-started/installing-dreamfactory/linux-installation) for maximum control and performance.
- **Cloud-native environment?** Deploy with [Helm](/getting-started/installing-dreamfactory/helm-installation) on your Kubernetes cluster.
- **Development on ARM?** Try the [Raspberry Pi Installation](/getting-started/installing-dreamfactory/raspberrypi-install) for an affordable development setup.

Each installation guide includes detailed prerequisites, step-by-step instructions, and troubleshooting tips to ensure a successful DreamFactory deployment.


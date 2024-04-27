---
sidebar_position: 3
---

# Docker Installation

Our Docker container includes everything you need to run DreamFactory including Ubuntu 22.04, PHP 8.1, and the NGINX web server. It also includes all of the required PHP extensions and a sample Postgres Database, meaning you should be able to begin experimenting with the latest DreamFactory version as quickly as you can spin up the container!

## Prerequisites

- Docker
  - See: https://docs.docker.com/installation
- Docker Compose
  - See: https://docs.docker.com/compose/install

## Overview

The DreamFactory docker application is setup to use docker-compose.

This will spin up 4 containers:
- df-docker-web
  - The DreamFactory application and web portal.
- mysql:5.7
  - A MySQL container for the system database.
- redis
  - A redis instance used for caching.
- aa8y/postgres-dataset
  - A Postgres Database with over 100k records for testing.

## Platform-Specific Instructions

The containerized application should be compatible with any platform that supports docker and docker-compose, but depending on your system configuration, you may need to edit the `docker-compose.yml` to meet your needs.

### Mac M-series Processors

The docker containers were built on amd64 architecture.  Docker Desktop for Mac allows you to specify the platform even if you are running an M-Series (M1/M2/M3) processor by adding `platform: linux/amd64` to each service in the`docker-compose.yml` file.

e.g. 
```
version: '3'
services:
  mysql:
    platform: linux/amd64
    environment:
    ...
    ...
    ...
  redis:
    platform: linux/amd64
    image: redis
  ...
  ...
  ...
  web:
    platform: linux/amd64
    depends_on:
      - mysql
    environment:
    ...
    ...
    ...
```

After adding the platform setting, you should be able to deploy the application on MacBook M-series processors.

## Installation

The latest container and install instructions can be found in the [df-docker GitHub repo](https://github.com/dreamfactorysoftware/df-docker).
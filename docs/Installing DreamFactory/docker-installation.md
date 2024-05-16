---
sidebar_position: 3
---

# Docker Installation

Our Docker container includes everything you need to run DreamFactory including Ubuntu 22.04, PHP 8.1, and the NGINX web server. It also includes all of the required PHP extensions and a sample Postgres Database, meaning you should be able to begin experimenting with the latest DreamFactory version as quickly as you can spin up the container!

## Prerequisites

- Git
  - See: https://www.github.com
- Docker
  - See: https://docs.docker.com/installation
- Docker Compose
  - See: https://docs.docker.com/compose/install

## Overview

The DreamFactory docker application is setup to use docker-compose.  To build and deploy the application, follow the following steps:

  1. Clone the [docker repo](https://github.com/dreamfactorysoftware/df-docker.git)

    ```
    cd ~/repos (or wherever you want the clone of the repo to be)
    git clone https://github.com/dreamfactorysoftware/df-docker.git
    cd df-docker
    ```
  
  2. Edit docker-compose.yml (optional)

    The docker-compose yaml file will have default settings for installing DreamFactory, but you may wish to edit the persistent or sample database details, usernames and passwords, or ports to access the application.  You should edit the docker-compose file prior to building and running DreamFactory.

  3. Build images with `docker-compose build`

    *Note*: Running this after an initial deployment will rebuild the entire application unless you save and re-use the APP_KEY as described below.

  4. Start containers with `docker-compose up -d`
  
    This will spin up 4 containers:
    ```
    df-docker-web
      - The DreamFactory application and web portal.
    mysql:5.7
      - A MySQL container for the system database.
    redis
      - A redis instance used for caching.
    aa8y/postgres-dataset
      - A Postgres Database with over 100k records for testing.
    ```

  5. Access the Admin UI
    By default, docker-compose will be on localhost port 80.  To access the application, open `http://localhost` or `http://127.0.0.1` in a browser window.
    
    The first time docker-compose is executed, it may take a few minutes to load and accept traffic.  If port 80 is taken by another application, you may edit the docker-compose yaml file to use a different port (e.g. 8080).

## Persisting System Database Configs

After you have spun up your DreamFactory instance, you should save the APP_KEY value from the .env file located in the web container's /opt/dreamfactory directory. This can be done with the following command while DreamFactory is running:

  `docker-compose exec web cat .env | grep APP_KEY`

Should you ever need to rebuild, set this value as the APP_KEY value in the docker-compose.yml file (line 28), wrapped in single quotes.  This will allow the new build to access the old encrypted settings and prevent receiving "The MAC is invalid" or "Invalid Cypher" errors in the application.

## Testing Data

We mount a Postgres container that contains over 100k records to test without connecting your own data sets. To utilize the container you will use the following connection details. For details on how to add a connection and generate a secure API, visit our tutorials section.

```
Host: The host can be found by running the following Docker command: docker inspect <container-id> | grep "IPAddress"
Port: 5432
Database Name: dellstore
Username: postgres
Password: root_pw
```

Use those settings to add a new Database API Connection.  This will generate a fully documented and secure API from the Postgres container.

## Adding a Commercial License

If you are a commercial customer and have a license key for DreamFactory, you should:
  
  1. Add the license files to the `df-docker` directory
  2. Uncomment lines 14 and 51 of the `Dockerfile`
  3. Add the license key to line 51 of `Dockerfile`
  4. continue with steps 2-5 above

## Upgrading Your Docker Instance

As enhancements and features get added to DreamFactory, you may wish to upgrade to a newer version.  To install a newer version of DreamFactory, you should:

  1. Backup your existing environment
    
    As a best practice, you should backup your files and system database before attempting to upgrade to a new version.  This includes extracting your `APP_KEY` from the existing docker container (see above).


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
  redis:
    platform: linux/amd64
    image: redis
    ...
    ...
  web:
    platform: linux/amd64
    depends_on:
      - mysql
    environment:
    ...
    ...
```

After adding the platform setting, you should be able to deploy the application on MacBook M-series processors using the instructions above.
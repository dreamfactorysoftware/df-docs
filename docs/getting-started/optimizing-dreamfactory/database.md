---
sidebar_position: 1
title: Database APIs
id: database-apis
---

# Database APIs

Ensuring the DreamFactory-generated database APIs are running at peak performance is accomplished by ensuring your database is properly configured, has been allocated appropriate hardware and network resources, and by turning on DreamFactory’s database caching feature. All of these tasks are covered in this topic.

## Index the database
For database-backed APIs, there is no more impactful task than properly indexing the database. Database indexing is what allows your database engine to quickly identify which rows match conditions defined by a where clause. Refer to the following resources for both general and database-specific indexing information:

- [Database Indexes Defined](https://en.wikipedia.org/wiki/Database_index)
- [Microsoft SQL Server](https://docs.microsoft.com/en-us/sql/relational-databases/indexes/indexes?view=sql-server-2017)
- [MongoDB](https://docs.mongodb.com/manual/indexes/)
- [MySQL](https://dev.mysql.com/doc/refman/5.7/en/optimization-indexes.html)
- [Oracle](https://docs.oracle.com/cd/E11882_01/server.112/e40540/indexiot.htm#CNCPT721)
- [PostgreSQL](https://www.postgresql.org/docs/9.1/indexes.html)


## Database API caching

Enable database API caching whenever practical, as it improves performance. Toggle **Data Retrieval Caching Enabled** and configure the **Cache Time To Live** setting in your database API overview.

![Example Database API Caching Configuration](/img/configuration/database-caching.png)

## Connection pooling

Connection pooling is not as prevelent in databases where connections are cheap (MySQL), but can be of increasing value with expensive connections such as Oracle. You may see performance improvements by setting up **Connection Pooling** to reduces the number of database connections being made. To do so with your DreamFactory Oracle connector, simple add `PDO::ATTR_PERSISTENT` to `true` as a driver option on the configuration tab of your Oracle dashboard or any database API Service.

## Adding Redis caching

One of DreamFactory’s great advantages is it is built on top of Laravel, which allows you to take advantage of Laravel’s support for shared caching solutions, among other things. This is beneficial because it means the caching solution has been extensively tested and proven in production environments.

To install the predis package:

1. Navigate to your project’s root directory and execute this command:

```
$ composer require predis/predis
```

2. Open your .env file and look for this section:
```
# CACHE_DRIVER options: apc, array, database, file, memcached, redis
CACHE_DRIVER=file
```

3. Change CACHE_DRIVER to:
```
CACHE_DRIVER=redis
```

4. Scroll down and uncomment these lines by removing the `#`, and then update the CACHE_HOST, CACHE_PORT, and (optionally) the CACHE_PASSWORD parameters to match your Redis environment:
```
# If CACHE_DRIVER = memcached or redis
#CACHE_HOST=
#CACHE_PORT=
#CACHE_PASSWORD=
```

5. To complete the process, scroll down to the following section and uncomment CACHE_DATABASE and REDIS_CLIENT:
```
# If CACHE_DRIVER = redis
#CACHE_DATABASE=2
# Which Redis client to use: predis or phpredis (PHP extension)
#REDIS_CLIENT=predis
```

You can leave CACHE_DATABASE set to 2. For the REDIS_CLIENT you can leave it set to predis if you’ve installed the predis/predis package (recommended). By default your Redis Database is set to 0, so be sure to SELECT whatever the number is you have set your CACHE_DATABASE equal to. Then you can start seeing the KEYS populate.

## Compiling the DreamFactory code with OPcache
You can achieve particularly high performance by compiling your DreamFactory application code using OPcache. The following resources provide more details on the process:

- [PHP’s OPcache Documentation](https://php.net/manual/en/book.opcache.php)
- [How to Make your Laravel App Fly](https://medium.com/appstract/make-your-laravel-app-fly-with-php-opcache-9948db2a5f93)

---
sidebar_position: 1
---

# Database APIs

Ensuring the DreamFactory-generated database APIs are running at peak performance is accomplished by ensuring your database is properly configured, has been allocated appropriate hardware and network resources, and turning on DreamFactory’s database caching feature. In this section we’ll talk more about all of these tasks.

## Index the Database
For database-backed APIs, there is no more impactful task one could take than properly indexing the database. Database indexing is what allows your database engine to quickly identify which rows match conditions defined by a where clause. Refer to the following resources for both general and database-specific indexing information:

- [Database Indexes Defined](https://en.wikipedia.org/wiki/Database_index)
- [Microsoft SQL Server](https://docs.microsoft.com/en-us/sql/relational-databases/indexes/indexes?view=sql-server-2017)
- [MongoDB](https://docs.mongodb.com/manual/indexes/)
- [MySQL](https://dev.mysql.com/doc/refman/5.7/en/optimization-indexes.html)
- [Oracle](https://docs.oracle.com/cd/E11882_01/server.112/e40540/indexiot.htm#CNCPT721)
- [PostgreSQL](https://www.postgresql.org/docs/9.1/indexes.html)


## Database API Caching

Enable database API caching whenever practical, as it will undoubtedly improve performance. Toggle "Data Retrieval Caching Enabled" and configure your Cache Time To Live in your database API overview.

![Example Database API Caching Configuration](/img/configuration/database-caching.png)

## Connection Pooling

This is not as prevelent in databases where connections are cheap (MySQL), but are of increasing value with expensive connections such as Oracle. ou may see performance improvements by setting up Connection Pooling. This should reduce the number of database connections being made. To do so with your DreamFactory Oracle connector, simple add PDO::ATTR_PERSISTENT true as a driver option on the configuration tab of your Oracle or any database API Service.

## Adding Redis Caching

One of DreamFactory’s great advantages is it is built atop Laravel, and as such, you can take advantage of Laravel’s support for shared caching solutions, among other things. This is great because it means the caching solution has been extensively tested and proven in production environments.

To install the predis package you just need to navigate to your project’s root directory and execute this command:

```
$ composer require predis/predis
```

Next, open your .env file and look for this section:
```
# CACHE_DRIVER options: apc, array, database, file, memcached, redis
CACHE_DRIVER=file
```

Change CACHE_DRIVER to:
```
CACHE_DRIVER=redis
```

Next, scroll down and uncomment these lines by removing the #, and then update the CACHE_HOST, CACHE_PORT, and (optionally) the CACHE_PASSWORD parameters to match your Redis environment:
```
# If CACHE_DRIVER = memcached or redis
#CACHE_HOST=
#CACHE_PORT=
#CACHE_PASSWORD=
```

Finally, scroll down to the following section and uncomment CACHE_DATABASE and REDIS_CLIENT:
```
# If CACHE_DRIVER = redis
#CACHE_DATABASE=2
# Which Redis client to use: predis or phpredis (PHP extension)
#REDIS_CLIENT=predis
```

You can leave CACHE_DATABASE set to 2. For the REDIS_CLIENT you can leave it set to predis if you’ve installed the predis/predis package (recommended). By default your Redis Database will be on 0, so be sure to SELECT whatever the number is you have set your CACHE_DATABASE equal to. Then you can start seeing the KEYS populate.

## Compiling the DreamFactory Code with OPcache
You can achieve particularly high performance by compiling your DreamFactory application code using OPcache. The following

- [PHP’s OPcache Documentation](https://php.net/manual/en/book.opcache.php)
- [How to Make your Laravel App Fly](https://medium.com/appstract/make-your-laravel-app-fly-with-php-opcache-9948db2a5f93)

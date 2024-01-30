---
sidebar_position: 1
---

# Basic Configuration

This page outlines the basic configuration settings for DreamFactory. For the most part, this will mean adding/changing parameers in the .env file located in the `dreamfactory` directory. Common tasks/procedures are outlined at the top of this page, and every parameter indiidually documented at the end of this page. 

:::info
For web server configurations, check the child pages of this section for your specific web server
:::

## Common Configuration Tasks/FAQ

### Changing Configuration

Any time configuration is changed in the .env file, at a minimum, the confguration cache must be cleared. This can be done by running `php artisan config:clear` in the `dreamfactory` directory. 

### Enable Debugging

Two parameters are used here:

- `APP_LOG_LEVEL` : Set to `debug` for debug mode. Other levels are described in the parameter listing below. 
- `APP_DEBUG` : Set to `true` to turn on the application debug messages. This will have DreamFactory return a payload with a trace for error(s). 

### Changing the System Database



### Caching settings

## Configuration Parameters

Below, the .env in its entirety is outlined and every parameter described. These parameters are listed in the order/section they would normally exist on a DreamFactory instance. 

### Application Settings

- `ASSET_URL`: Configures the asset URL host.
- `VIEW_COMPILED_PATH`: Location for compiled Blade templates.
- `BCRYPT_ROUNDS`: Options for Bcrypt password hashing.
- `APP_NAME`: Name of the application.
- `APP_CIPHER`: Encryption cipher options.
- `APP_DEBUG`: Debugging trace toggle in exceptions.
- `APP_ENV`: Environment type (local, production).
- `APP_KEY`: Application encryption key.
- `APP_LOCALE`: Default application locale.
- `LOG_CHANNEL`: Configuration for log channels.
- `APP_LOG_LEVEL`: Log level setting.
- `APP_LOG_MAX_FILES`: Max log files for 'daily' logging.
- `APP_TIMEZONE`: Timezone setting for PHP functions.
- `APP_URL`: External URL for the installation.
- `DF_LANDING_PAGE`: Default landing page URL.

### Database Settings

- `DB_CONNECTION`: Type of database connection.
- `DB_HOST`: Database host address.
- `DB_PORT`: Database port number.
- `DB_DATABASE`: Database name.
- `DB_USERNAME`: Database username.
- `DB_PASSWORD`: Database password.
- `DB_CHARSET`: Database character set.
- `DB_COLLATION`: Database collation setting.
- `DB_QUERY_LOG_ENABLED`: Toggle for database query logging.
- `DB_MAX_RECORDS_RETURNED`: Max records returned in queries.
- `DF_SQLITE_STORAGE`: Location for SQLite3 database files.
- `DF_FREETDS_SQLSRV`, `DF_FREETDS_SQLANYWHERE`, `DF_FREETDS_SYBASE`, `DF_FREETDS_DUMP`, `DF_FREETDS_DUMPCONFIG`: FreeTDS configuration settings.

### Cache Settings

- `CACHE_DRIVER`: Cache driver type.
- `CACHE_DEFAULT_TTL`: Default cache TTL in seconds.
- `CACHE_PREFIX`: Prefix for cache keys.
- `CACHE_PATH`: Cache path for 'file' driver.
- `CACHE_TABLE`: Cache table for 'database' driver.
- `CACHE_HOST`, `CACHE_PORT`, `CACHE_PASSWORD`, `CACHE_WEIGHT`, `CACHE_PERSISTENT_ID`, `CACHE_USERNAME`, `CACHE_DATABASE`: Cache settings for 'memcached' or 'redis'.

### Limit Cache Settings

- `LIMIT_CACHE_DRIVER`: Limit cache driver type.
- `LIMIT_CACHE_PREFIX`: Prefix for limit cache keys.
- `LIMIT_CACHE_PATH`: Path for 'file' limit cache.
- `LIMIT_CACHE_TABLE`: Table for 'database' limit cache.
- `LIMIT_CACHE_HOST`, `LIMIT_CACHE_PORT`, `LIMIT_CACHE_PASSWORD`, `LIMIT_CACHE_WEIGHT`, `LIMIT_CACHE_PERSISTENT_ID`, `LIMIT_CACHE_USERNAME`, `LIMIT_CACHE_DATABASE`: Limit cache settings for 'memcached' or 'redis'.

### Queuing Settings

- `QUEUE_CONNECTION`: Queue connection type.
- `QUEUE_NAME`: Name of the queue.
- `QUEUE_RETRY_AFTER`: Retry time for failed jobs.
- `QUEUE_TABLE`: Queue table for 'database' driver.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `SQS_PREFIX`: AWS SQS settings.
- `QUEUE_HOST`, `QUEUE_PORT`, `QUEUE_DATABASE`, `QUEUE_PASSWORD`: Queue settings for 'beanstalkd' or 'redis'.

### Event Broadcasting Settings

- `BROADCAST_DRIVER`: Broadcasting driver type.
- `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET`: Pusher settings.
- `BROADCAST_HOST`, `BROADCAST_PORT`, `BROADCAST_DATABASE`, `BROADCAST_PASSWORD`: Broadcast settings for 'redis'.

### DreamFactory Settings

- `DF_LOGIN_ATTRIBUTE`: User authentication attribute.
- `DF_ENABLE_ALTERNATE_AUTH`: Toggle for alternate authentication.
- `DF_ENABLE_WINDOWS_AUTH`: Windows authentication for AD SSO.
- `DF_CONFIRM_CODE_LENGTH`: Length of user confirmation code.
- `DF_CONFIRM_CODE_TTL`: TTL for confirmation code.
- `JWT_SECRET`: JWT encryption secret.
- `DF_JWT_TTL`, `DF_JWT_REFRESH_TTL`, `DF_ALLOW_FOREVER_SESSIONS`: JWT session settings.
- `DF_JWT_USER_CLAIM`: Custom JWT claim fields.
- `DF_CONFIRM_RESET_URL`, `DF_CONFIRM_INVITE_URL`, `DF_CONFIRM_REGISTER_URL`: URLs for user actions.

### Storage Settings

- `DF_FILE_CHUNK_SIZE`: Chunk size for downloadable files.

### Scripting Settings

- `DF_SCRIPTING_DISABLE`: Disables specific scripting languages.
- `DF_NODEJS_PATH`: Path to Node.js executable.
- `DF_PYTHON_PATH`: Path to Python executable.
- `DF_PYTHON3_PATH`: Path to Python3 executable.
- `DF_SCRIPTING_DEFAULT_PROTOCOL`: Default protocol for scripting calls.
- `DF_SCRIPT_INLINE_CHAR_LIMIT`: Inline script character limit.

### API Settings

- `DF_API_ROUTE_PREFIX`: Prefix for API routes.
- `DF_STATUS_ROUTE_PREFIX`: Prefix for status routes.
- `DF_STORAGE_ROUTE_PREFIX`: Prefix for storage routes.
- `DF_XML_ROOT`: Root tag for XML responses.
- `DF_ALWAYS_WRAP_RESOURCES`, `DF_RESOURCE_WRAPPER`: Resource wrapping settings.
- `DF_CONTENT_TYPE`: Default response content-type.
- `DF_LOOKUP_MODIFIERS`: Allowed lookup modifiers.
- `DF_PACKAGE_PATH`: Path for package import at launch.
- `DF_INSTALL`: Installation source.

### Managed Settings

- `DF_MANAGED`: Managed environment toggle.
- `DF_MANAGED_LOG_PATH`, `DF_MANAGED_CACHE_PATH`, `DF_MANAGED_LOG_ROTATE_COUNT`, `DF_MANAGED_LOG_FILE_NAME`, `DF_LIMITS_CACHE_STORE`, `DF_LIMITS_CACHE_PATH`: Managed environment settings.
- `SENDMAIL_DEFAULT_COMMAND`: Default sendmail command.
- `DF_REGISTER_CONTACT`: Registration contact information.

### LogsDB Settings

- `LOGSDB_ENABLED`: LogsDB enabled toggle.
- `LOGSDB_HOST`, `LOGSDB_PORT`, `LOGSDB_DATABASE`, `LOGSDB_USERNAME`, `LOGSDB_PASSWORD`: LogsDB settings.

### License Key

- `DF_LICENSE_KEY`: DreamFactory license key.

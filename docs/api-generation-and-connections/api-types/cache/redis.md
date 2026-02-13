---
sidebar_position: 2
title: Redis
id: redis
description: "Configure Redis caching in DreamFactory for high-performance API response caching and session storage"
keywords: [Redis, cache, caching, performance, session storage, in-memory database]
difficulty: "intermediate"
---

# Redis

Redis is a high-performance, in-memory data store that DreamFactory uses for caching, session storage, and rate limiting. It provides sub-millisecond response times and supports advanced data structures for complex caching scenarios.

---

## Use Cases

- **API response caching**: Store database query results for faster subsequent requests
- **Session storage**: Distribute user sessions across multiple DreamFactory instances
- **Rate limiting**: Track API request counts with automatic expiry
- **Queue backend**: Process background jobs asynchronously
- **Pub/Sub messaging**: Real-time event distribution (advanced)

---

## Prerequisites

### Redis Server

Install Redis on your server or use a managed service:

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**Managed Services:**
- AWS ElastiCache for Redis
- Azure Cache for Redis
- Google Cloud Memorystore
- Redis Cloud

### Verify Installation

```bash
redis-cli ping
# Expected response: PONG
```

---

## Configuring Redis in DreamFactory

### System Cache Configuration

Set Redis as the system cache backend in your DreamFactory environment file (`.env`):

```env
CACHE_DRIVER=redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
REDIS_DATABASE=0
```

### Configuration Options

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `CACHE_DRIVER` | Yes | `file` | Set to `redis` to enable |
| `REDIS_HOST` | Yes | `localhost` | Redis server hostname or IP |
| `REDIS_PORT` | No | `6379` | Redis server port |
| `REDIS_PASSWORD` | No | - | Redis authentication password |
| `REDIS_DATABASE` | No | `0` | Redis database number (0-15) |
| `REDIS_PREFIX` | No | `dreamfactory` | Key prefix for namespacing |

### Session Storage

To store sessions in Redis:

```env
SESSION_DRIVER=redis
```

### Queue Backend

To use Redis for background job queues:

```env
QUEUE_DRIVER=redis
```

---

## Creating a Redis Cache Service

In addition to system caching, you can create a Redis service for direct cache API access.

### Step 1: Navigate to API Generation

Log in to your DreamFactory instance and select **API Generation & Connections**. Set API Type to **Cache**.

### Step 2: Create New Service

Click the plus button and select **Redis**.

### Step 3: Configure Service Details

| Field | Description | Example |
| ----- | ----------- | ------- |
| Name | Service name (used in API URL) | `redis` |
| Label | Display name | `Redis Cache` |
| Description | Service description | `Application cache service` |

### Step 4: Configure Connection

| Field | Required | Default | Description |
| ----- | -------- | ------- | ----------- |
| Host | No | `127.0.0.1` | Redis server hostname or IP |
| Port | No | `6379` | Redis port number |
| Password | No | - | Authentication password |
| Database Index | No | `0` | Redis database number (0-15) |
| Default TTL | No | `300` | Time to live in minutes before cached values expire |

### Step 5: Save and Test

Save the service and use API Docs to test cache operations.

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/v2/{service}/` | List all keys (use sparingly) |
| `GET` | `/api/v2/{service}/{key}` | Get value by key |
| `POST` | `/api/v2/{service}` | Store one or more key-value pairs |
| `PUT` | `/api/v2/{service}/{key}` | Update existing key |
| `DELETE` | `/api/v2/{service}/{key}` | Delete a key |
| `DELETE` | `/api/v2/{service}` | Flush all keys (dangerous) |

---

## API Examples

### Store a Value

```bash
curl -X POST "https://example.com/api/v2/redis" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {
        "key": "user:123:profile",
        "value": {"name": "John Doe", "email": "john@example.com"},
        "ttl": 3600
      }
    ]
  }'
```

**Response:**
```json
{
  "resource": [
    {
      "key": "user:123:profile",
      "success": true
    }
  ]
}
```

### Store Multiple Values

```bash
curl -X POST "https://example.com/api/v2/redis" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {"key": "setting:theme", "value": "dark", "ttl": 86400},
      {"key": "setting:language", "value": "en", "ttl": 86400},
      {"key": "setting:timezone", "value": "UTC", "ttl": 86400}
    ]
  }'
```

### Retrieve a Value

```bash
curl -X GET "https://example.com/api/v2/redis/user:123:profile" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "key": "user:123:profile",
  "value": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Delete a Key

```bash
curl -X DELETE "https://example.com/api/v2/redis/user:123:profile" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

### Check if Key Exists

```bash
curl -X GET "https://example.com/api/v2/redis/user:123:profile?check_exist=true" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "key": "user:123:profile",
  "exists": true
}
```

---

## TTL (Time-To-Live)

Set expiration times when storing values:

| TTL Value | Behavior |
| --------- | -------- |
| Positive integer | Expire after N seconds |
| `0` | No expiration (persist indefinitely) |
| `-1` | Use default TTL from service config |

### Recommended TTL Values

| Data Type | TTL (seconds) | Duration |
| --------- | ------------- | -------- |
| Session data | 1800 | 30 minutes |
| User profiles | 300 | 5 minutes |
| Reference data | 86400 | 24 hours |
| Rate limit counters | 60 | 1 minute |
| Real-time data | 30 | 30 seconds |

---

## Redis Configuration Best Practices

### Security

**Bind to localhost or private network:**
```conf
# /etc/redis/redis.conf
bind 127.0.0.1
```

**Require authentication:**
```conf
requirepass your_strong_password_here
```

**Disable dangerous commands:**
```conf
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

### Memory Management

**Set memory limit:**
```conf
maxmemory 256mb
```

**Configure eviction policy:**
```conf
maxmemory-policy allkeys-lru
```

| Policy | Description |
| ------ | ----------- |
| `noeviction` | Return error when memory limit reached |
| `allkeys-lru` | Evict least recently used keys (recommended) |
| `volatile-lru` | Evict LRU keys with TTL set |
| `allkeys-random` | Random eviction |

### Persistence

**RDB snapshots (default):**
```conf
save 900 1    # Save if 1 key changed in 900 seconds
save 300 10   # Save if 10 keys changed in 300 seconds
save 60 10000 # Save if 10000 keys changed in 60 seconds
```

**AOF for durability:**
```conf
appendonly yes
appendfsync everysec
```

---

## High Availability

### Redis Sentinel

For automatic failover:

```env
REDIS_SENTINEL_HOST=sentinel1.example.com,sentinel2.example.com
REDIS_SENTINEL_PORT=26379
REDIS_SENTINEL_MASTER=mymaster
```

### Redis Cluster

For horizontal scaling, configure multiple Redis nodes with clustering enabled.

---

## Monitoring

### Key Metrics to Watch

| Metric | Description | Alert Threshold |
| ------ | ----------- | --------------- |
| `used_memory` | Current memory usage | > 80% of maxmemory |
| `connected_clients` | Active connections | > 80% of maxclients |
| `keyspace_hits` | Cache hit count | - |
| `keyspace_misses` | Cache miss count | High miss ratio |
| `evicted_keys` | Keys removed due to memory | Any eviction |

### Redis CLI Commands

```bash
# Check server status
redis-cli info

# Monitor memory
redis-cli info memory

# Check connected clients
redis-cli client list

# Get hit/miss ratio
redis-cli info stats | grep keyspace
```

---

## Common Errors

| Error Code | Message | Cause | Solution |
| ---------- | ------- | ----- | -------- |
| 400 | Bad Request | Invalid key or value | Check request format |
| 401 | Unauthorized | Missing API key | Add API key header |
| 404 | Not Found | Key does not exist | Handle cache miss |
| 500 | Connection refused | Redis server unreachable | Check Redis server status |
| 500 | NOAUTH | Authentication required | Add REDIS_PASSWORD to .env |

### Troubleshooting Connection Issues

```bash
# Test Redis connectivity
redis-cli -h localhost -p 6379 ping

# Test with password
redis-cli -h localhost -p 6379 -a your_password ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

---

## Performance Tuning

### Connection Pooling

Configure persistent connections in Laravel/DreamFactory:

```env
REDIS_CLIENT=phpredis
```

### Pipelining

For bulk operations, the API supports batch requests that are automatically pipelined.

### Key Design

- Use colons `:` as separators: `user:123:profile`
- Keep keys short but descriptive
- Use consistent naming conventions
- Avoid spaces and special characters

---

## Next Steps

- **[Cache Overview](./cache-overview)**: Compare caching backends
- **[Memcached](./memcached)**: Alternative caching option
- **[Performance Tuning](/administration/performance-tuning)**: Optimize DreamFactory

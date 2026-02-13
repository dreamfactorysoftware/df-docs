---
sidebar_position: 1
title: Cache Overview
id: cache-overview
description: "Supported cache services in DreamFactory - Redis, Memcached, and other caching backends for improved API performance"
keywords: [cache, Redis, Memcached, caching, performance, API cache, session storage]
difficulty: "beginner"
---

# Cache Services Overview

DreamFactory supports multiple caching backends to improve API performance. Caching stores frequently accessed data in memory, reducing database load and improving response times for read-heavy workloads.

---

## Supported Cache Services

| Service | Type | Use Case | Documentation |
| ------- | ---- | -------- | ------------- |
| **Redis** | In-memory store | Production caching, sessions, queues | [Redis Guide](./redis) |
| **Memcached** | In-memory cache | Simple key-value caching | [Memcached Guide](./memcached) |
| **Local** | File-based | Development, single-instance deployments | Built-in |
| **File** | File-based | Development, disk-based persistence | Built-in |
| **Database** | SQL-backed | Simple deployments without external cache | Built-in |

---

## Cache Use Cases in DreamFactory

### API Response Caching

Cache API responses to reduce database queries:

- **Per-service caching**: Enable caching on individual database or file services
- **TTL configuration**: Set expiration times based on data volatility
- **Cache invalidation**: Automatic clearing on write operations

### Session Storage

Store user sessions in a distributed cache:

- **Scalability**: Share sessions across multiple DreamFactory instances
- **Performance**: Faster session lookups than database
- **Persistence**: Redis can persist sessions across restarts

### Rate Limiting

Track API request counts per user or role:

- **Distributed counting**: Works across load-balanced instances
- **Atomic operations**: Accurate request tracking
- **Automatic expiry**: Counters reset after time windows

---

## Choosing a Cache Backend

### Redis vs Memcached

| Feature | Redis | Memcached |
| ------- | ----- | --------- |
| Data structures | Strings, lists, sets, hashes, sorted sets | Strings only |
| Persistence | Optional disk persistence | Memory only |
| Replication | Master-slave, clustering | None (client-side) |
| Pub/Sub | Yes | No |
| Lua scripting | Yes | No |
| Memory efficiency | Good | Excellent for simple data |
| Max key size | 512 MB | 1 MB |
| Use case | Feature-rich, sessions, queues | Simple caching |

### Recommendation

- **Production**: Use **Redis** for its flexibility, persistence options, and support for sessions
- **Development**: Use **Local** cache for simplicity
- **High-volume simple caching**: Use **Memcached** for maximum memory efficiency

---

## Cache Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Client    │────▶│   DreamFactory   │────▶│    Database     │
│                 │◀────│                  │◀────│                 │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                                 │ Cache check
                                 ▼
                        ┌─────────────────┐
                        │  Cache Backend  │
                        │  (Redis/Memcached)
                        └─────────────────┘
```

### Cache Flow

1. **Request arrives** at DreamFactory
2. **Cache check**: If cached response exists and is valid, return it
3. **Cache miss**: Query the database/service
4. **Store in cache**: Save response with configured TTL
5. **Return response** to client

### Cache Invalidation

DreamFactory automatically invalidates cache entries when:

- **POST/PUT/PATCH/DELETE** operations modify data
- **TTL expires** based on configured duration
- **Manual flush** via admin API

---

## Configuring Cache Services

### System-Wide Cache

Configure the default cache backend in DreamFactory's environment:

```env
CACHE_DRIVER=redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

### Per-Service Caching

Enable caching on individual services:

1. Navigate to the service configuration
2. Enable **Cache Enabled** option
3. Set **Cache TTL** in seconds
4. Save the service

---

## Cache API Endpoints

DreamFactory exposes a Cache API for direct cache operations:

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/v2/{cache_service}/{key}` | Get cached value |
| `POST` | `/api/v2/{cache_service}` | Store value in cache |
| `DELETE` | `/api/v2/{cache_service}/{key}` | Delete cached value |
| `DELETE` | `/api/v2/{cache_service}` | Flush all cached values |

### Example: Store a Value

```bash
curl -X POST "https://example.com/api/v2/cache" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user:123:profile",
    "value": {"name": "John", "email": "john@example.com"},
    "ttl": 3600
  }'
```

### Example: Retrieve a Value

```bash
curl -X GET "https://example.com/api/v2/cache/user:123:profile" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

---

## Performance Best Practices

### TTL Configuration

| Data Type | Recommended TTL | Rationale |
| --------- | --------------- | --------- |
| Static reference data | 24 hours | Rarely changes |
| User profiles | 5-15 minutes | Balances freshness and performance |
| Real-time data | 30-60 seconds | Frequently updated |
| Session data | 30 minutes - 2 hours | Matches session duration |

### Cache Key Design

Use structured, predictable key patterns:

```
{resource_type}:{id}:{sub_resource}
```

Examples:
- `user:123:profile`
- `product:456:inventory`
- `order:789:items`

### Memory Management

- **Monitor memory usage** to prevent eviction
- **Set appropriate TTLs** to expire stale data
- **Use Redis maxmemory-policy** for graceful eviction

---

## Common Errors

| Error Code | Message | Cause | Solution |
| ---------- | ------- | ----- | -------- |
| 400 | Bad Request | Invalid key or value format | Check request payload |
| 401 | Unauthorized | Missing API key | Add API key header |
| 404 | Not Found | Key does not exist | Handle cache miss in client |
| 503 | Service Unavailable | Cache backend unreachable | Check cache server status |

---

## Next Steps

- **[Redis](./redis)**: Configure Redis for production caching
- **[Memcached](./memcached)**: Configure Memcached for simple caching
- **[Performance Tuning](/administration/performance-tuning)**: Optimize DreamFactory performance

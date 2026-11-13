---
sidebar_position: 3
title: Memcached
id: memcached
description: "Configure Memcached caching in DreamFactory for simple, high-performance key-value caching"
keywords: [Memcached, cache, caching, performance, in-memory cache, key-value store]
difficulty: "intermediate"
---

# Memcached

Memcached is a high-performance, distributed memory caching system designed for simplicity and speed. DreamFactory supports Memcached as a caching backend for API response caching and general-purpose key-value storage.

---

## Use Cases

- **Simple key-value caching**: Store and retrieve data with minimal overhead
- **API response caching**: Cache database query results
- **Distributed caching**: Share cache across multiple application servers
- **High-throughput scenarios**: When raw speed matters more than features

---

## Memcached vs Redis

| Feature | Memcached | Redis |
| ------- | --------- | ----- |
| Data types | Strings only | Strings, lists, sets, hashes |
| Maximum key size | 250 bytes | 512 MB |
| Maximum value size | 1 MB (default) | 512 MB |
| Persistence | None | Optional |
| Replication | None | Master-slave |
| Memory efficiency | Excellent | Good |
| Threading | Multi-threaded | Single-threaded |
| Complexity | Simple | Feature-rich |

**Choose Memcached when:**
- You need simple key-value caching
- Maximum memory efficiency is critical
- You don't need persistence or advanced data structures
- Multi-threaded performance is beneficial

**Choose Redis when:**
- You need sessions, queues, or pub/sub
- Data persistence is required
- You use complex data structures

---

## Prerequisites

### Install Memcached

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install memcached libmemcached-tools
sudo systemctl enable memcached
sudo systemctl start memcached
```

**CentOS/RHEL:**
```bash
sudo yum install memcached
sudo systemctl enable memcached
sudo systemctl start memcached
```

### Verify Installation

```bash
echo "stats" | nc localhost 11211
```

### PHP Extension

DreamFactory requires the PHP Memcached extension:

```bash
sudo apt install php-memcached
sudo systemctl restart php-fpm
```

---

## Configuring Memcached in DreamFactory

### System Cache Configuration

Set Memcached as the system cache backend in your DreamFactory environment file (`.env`):

```env
CACHE_DRIVER=memcached
MEMCACHED_HOST=localhost
MEMCACHED_PORT=11211
```

### Configuration Options

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `CACHE_DRIVER` | Yes | `file` | Set to `memcached` to enable |
| `MEMCACHED_HOST` | Yes | `localhost` | Memcached server hostname |
| `MEMCACHED_PORT` | No | `11211` | Memcached server port |
| `MEMCACHED_PERSISTENT_ID` | No | - | Persistent connection identifier |
| `MEMCACHED_USERNAME` | No | - | SASL authentication username |
| `MEMCACHED_PASSWORD` | No | - | SASL authentication password |

### Multiple Servers

For distributed caching across multiple Memcached servers:

```env
MEMCACHED_HOST=server1.example.com:11211,server2.example.com:11211,server3.example.com:11211
```

---

## Creating a Memcached Cache Service

Create a Memcached service for direct cache API access.

### Step 1: Navigate to API Generation

Log in to your DreamFactory instance and select **API Generation & Connections**. Set API Type to **Cache**.

### Step 2: Create New Service

Click the plus button and select **Memcached**.

### Step 3: Configure Service Details

| Field | Description | Example |
| ----- | ----------- | ------- |
| Name | Service name (used in API URL) | `memcache` |
| Label | Display name | `Memcached` |
| Description | Service description | `Application cache` |

### Step 4: Configure Connection

| Field | Required | Default | Description |
| ----- | -------- | ------- | ----------- |
| Host | No | `127.0.0.1` | Memcached server hostname or IP |
| Port | No | `11211` | Memcached port number |
| Default TTL | No | `300` | Time to live in seconds, used when a request does not set `ttl` |

### Step 5: Save and Test

Save the service and use API Docs to test operations.

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/v2/{service}/{key}` | Get the value of one key |
| `POST` | `/api/v2/{service}` | Store one or more new keys. Fails if any key already exists |
| `POST` | `/api/v2/{service}/{key}` | Store one new key. Fails if the key already exists |
| `PUT` / `PATCH` | `/api/v2/{service}` | Store one or more keys, overwriting existing values |
| `PUT` / `PATCH` | `/api/v2/{service}/{key}` | Store one key, overwriting an existing value |
| `DELETE` | `/api/v2/{service}/{key}` | Delete one key |

Every request works on named keys. There is no endpoint to list keys, read several keys at once, or flush the whole cache. A request without a key, such as `GET /api/v2/{service}`, returns `400`.

| Query parameter | Applies to | Effect |
| --------------- | ---------- | ------ |
| `ttl` | `POST`, `PUT`, `PATCH` | Time to live in **seconds**. Defaults to the service's **Default TTL** |
| `forever` | `POST`, `PUT`, `PATCH` | `true` stores the value with no expiry |
| `default` | `GET` | Value to return when the key does not exist, instead of `404` |
| `pull` | `GET` | `true` returns the value and deletes the key |

---

## API Examples

### Store Several Values

Send the keys and values as one JSON object. The TTL goes in the query string, not in the body.

```bash
curl -X POST "https://example.com/api/v2/memcache?ttl=3600" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "setting:theme": "dark",
    "user:123:profile": {"name": "John Doe", "email": "john@example.com"}
  }'
```

**Response:**
```json
{"success": true}
```

If any of the keys already exists, `POST` stores nothing and returns `400`. Use `PUT` to overwrite.

### Store or Overwrite One Value

With the key in the path, the whole request body is the value.

```bash
curl -X PUT "https://example.com/api/v2/memcache/user:123:profile?ttl=300" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

**Response:**
```json
{"user:123:profile": {"name": "John Doe", "email": "john@example.com"}}
```

### Retrieve a Value

The response body is the stored value itself, not a wrapper object.

```bash
curl -X GET "https://example.com/api/v2/memcache/user:123:profile" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{"name": "John Doe", "email": "john@example.com"}
```

A missing key returns `404` with the message `No value found for key '...'`. Add `?default=...` to get a fallback value instead.

### Delete a Key

```bash
curl -X DELETE "https://example.com/api/v2/memcache/user:123:profile" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{"success": true}
```

---

## TTL (Time-To-Live)

TTL is always in **seconds**, both for the `ttl` query parameter and for the service's **Default TTL** setting.

| Request | Behavior |
| ------- | -------- |
| `?ttl=N` (N > 0) | Expires after N seconds |
| no `ttl` | Uses the service's Default TTL (300 seconds unless changed) |
| `?forever=true` | Never expires |
| `?ttl=0` or a negative value | **Nothing is stored.** Use `forever=true` for no expiry |

### Recommended TTL Values

| Data Type | TTL (seconds) | Duration |
| --------- | ------------- | -------- |
| Session data | 1800 | 30 minutes |
| User profiles | 300 | 5 minutes |
| Reference data | 86400 | 24 hours |
| Rate limit counters | 60 | 1 minute |
| Real-time data | 30 | 30 seconds |

### Calling the Cache from Scripts

Scripts call the cache service like any other service. In a Node.js script, `platform.api` takes `(verb, path, payload, options, callback)`:

```javascript
platform.api.call('PUT', 'memcache/my_key', { token: 'abc' },
  { parameters: { ttl: 3300 } },
  function (body, response) { /* response.statusCode */ });
```

To let a script use the cache without exposing it to API callers, give the role access to the cache service with requestor **SCRIPT** only.

---

## Memcached Configuration

### Server Configuration

Edit `/etc/memcached.conf`:

```conf
# Listen address (localhost only for security)
-l 127.0.0.1

# Port
-p 11211

# Memory limit (MB)
-m 256

# Maximum connections
-c 1024

# Run as user
-u memcached
```

### Memory Allocation

| Setting | Description |
| ------- | ----------- |
| `-m 256` | Allocate 256 MB for cache storage |
| `-I 2m` | Maximum item size (default 1 MB) |
| `-f 1.25` | Chunk size growth factor |

### Security

**Bind to localhost:**
```conf
-l 127.0.0.1
```

**SASL Authentication** (requires libmemcached with SASL):
```conf
-S
```

---

## Distributed Caching

### Consistent Hashing

When using multiple Memcached servers, DreamFactory uses consistent hashing to distribute keys. This minimizes cache invalidation when servers are added or removed.

### Server Weights

Assign weights to servers based on capacity:

```env
MEMCACHED_HOST=server1.example.com:11211:2,server2.example.com:11211:1
```

Server1 receives twice as many keys as server2.

### Failover Behavior

If a Memcached server becomes unavailable:
- Affected keys become cache misses
- Keys are redistributed to remaining servers
- No data is automatically replicated

---

## Monitoring

### Key Metrics

| Metric | Description | Concern Level |
| ------ | ----------- | ------------- |
| `curr_items` | Current cached items | - |
| `get_hits` | Successful cache hits | Higher is better |
| `get_misses` | Cache misses | High ratio indicates issues |
| `evictions` | Items evicted for memory | Any eviction may be concern |
| `bytes_read` | Network bytes read | - |
| `bytes_written` | Network bytes written | - |

### Memcached Stats

```bash
# Get all stats
echo "stats" | nc localhost 11211

# Get specific stats
echo "stats items" | nc localhost 11211
echo "stats slabs" | nc localhost 11211
```

### Calculate Hit Ratio

```
hit_ratio = get_hits / (get_hits + get_misses)
```

A healthy cache should have a hit ratio above 80%.

---

## Common Errors

| Error Code | Message | Cause | Solution |
| ---------- | ------- | ----- | -------- |
| 400 | Bad Request | Invalid key or value | Check key length (max 250 bytes) |
| 401 | Unauthorized | Missing API key | Add API key header |
| 404 | Not Found | Key does not exist | Handle cache miss |
| 500 | Connection refused | Server unreachable | Check Memcached status |
| 500 | SERVER_ERROR | Value too large | Increase `-I` setting |

### Troubleshooting

```bash
# Check if Memcached is running
sudo systemctl status memcached

# Test connection
echo "stats" | nc localhost 11211

# Check memory usage
echo "stats" | nc localhost 11211 | grep bytes

# View logs
sudo journalctl -u memcached
```

---

## Performance Tuning

### Slab Allocation

Memcached allocates memory in slabs. Monitor slab usage:

```bash
echo "stats slabs" | nc localhost 11211
```

If certain slab classes fill up while others are empty, adjust the growth factor:

```conf
-f 1.1  # Smaller chunks, more classes
```

### Connection Handling

```conf
# Increase max connections
-c 2048

# Enable TCP_NODELAY
-T
```

### UDP Mode

For read-heavy workloads in trusted networks:

```conf
-U 11211
```

:::warning
UDP mode is vulnerable to amplification attacks. Only use in secure networks.
:::

---

## Next Steps

- **[Cache Overview](./cache-overview)**: Compare caching backends
- **[Redis](./redis)**: Feature-rich alternative
- **[Performance Tuning](/getting-started/optimizing-dreamfactory/php-and-laravel)**: Optimize DreamFactory

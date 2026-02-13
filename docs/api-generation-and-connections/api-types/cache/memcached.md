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
| Default TTL | No | `300` | Time to live in minutes before cached values expire |

### Step 5: Save and Test

Save the service and use API Docs to test operations.

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/v2/{service}/{key}` | Get value by key |
| `POST` | `/api/v2/{service}` | Store one or more key-value pairs |
| `PUT` | `/api/v2/{service}/{key}` | Update existing key |
| `DELETE` | `/api/v2/{service}/{key}` | Delete a key |
| `DELETE` | `/api/v2/{service}` | Flush all keys |

:::note
Memcached does not support listing all keys. Use `GET` with specific keys only.
:::

---

## API Examples

### Store a Value

```bash
curl -X POST "https://example.com/api/v2/memcache" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {
        "key": "user:123:name",
        "value": "John Doe",
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
      "key": "user:123:name",
      "success": true
    }
  ]
}
```

### Store JSON Data

Values are automatically serialized:

```bash
curl -X POST "https://example.com/api/v2/memcache" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": [
      {
        "key": "config:app",
        "value": {
          "theme": "dark",
          "language": "en",
          "features": ["analytics", "reporting"]
        },
        "ttl": 86400
      }
    ]
  }'
```

### Retrieve a Value

```bash
curl -X GET "https://example.com/api/v2/memcache/user:123:name" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "key": "user:123:name",
  "value": "John Doe"
}
```

### Retrieve Multiple Values

```bash
curl -X GET "https://example.com/api/v2/memcache?keys=user:123:name,user:456:name" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

### Delete a Key

```bash
curl -X DELETE "https://example.com/api/v2/memcache/user:123:name" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

### Flush All Keys

```bash
curl -X DELETE "https://example.com/api/v2/memcache" \
  -H "X-DreamFactory-API-Key: YOUR_API_KEY"
```

:::warning
Flushing deletes all cached data. Use with caution in production.
:::

---

## TTL (Time-To-Live)

Set expiration times when storing values:

| TTL Value | Behavior |
| --------- | -------- |
| Positive integer (< 30 days) | Expire after N seconds |
| `0` | No expiration |
| Unix timestamp (> 30 days) | Expire at specific time |

### Memcached TTL Behavior

Memcached has a maximum TTL of 30 days (2592000 seconds). Values larger than this are interpreted as Unix timestamps.

```bash
# Expires in 1 hour
{"key": "temp:data", "value": "...", "ttl": 3600}

# Expires in 7 days
{"key": "weekly:report", "value": "...", "ttl": 604800}

# Expires at specific Unix timestamp
{"key": "event:data", "value": "...", "ttl": 1740000000}
```

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
- **[Performance Tuning](/administration/performance-tuning)**: Optimize DreamFactory

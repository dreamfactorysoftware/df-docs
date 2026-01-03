---
sidebar_position: 2
title: Logstash
id: logstash
draft: true
---
# DreamFactory ELK Stack & Grafana Integration Guide

This guide provides step-by-step instructions for installing and configuring Elasticsearch, Logstash, and Grafana to work with DreamFactory's Logstash connector for API activity monitoring and analytics.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
   - [Elasticsearch](#elasticsearch)
   - [Logstash](#logstash)
   - [Grafana](#grafana)
3. [Configuration](#configuration)
   - [Elasticsearch Configuration](#elasticsearch-configuration)
   - [Logstash Configuration](#logstash-configuration)
   - [Grafana Configuration](#grafana-configuration)
4. [DreamFactory Integration](#dreamfactory-integration)
5. [Dashboard Setup](#dashboard-setup)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Ubuntu Server (20.04 or later recommended)
- Root or sudo access
- Minimum 2GB RAM (4GB+ recommended)
- Java 11 or later
- DreamFactory instance with Logstash connector enabled

---

## Installation

### Elasticsearch

### Step 1: Install Java
```bash
sudo apt update
sudo apt install -y openjdk-11-jdk
```

### Step 2: Add Elasticsearch Repository
```bash
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list
sudo apt update
```

### Step 3: Install Elasticsearch
```bash
sudo apt install -y elasticsearch
```

### Step 4: Configure Elasticsearch Memory
For systems with limited RAM, reduce heap size:

```bash
sudo mkdir -p /etc/elasticsearch/jvm.options.d
sudo tee /etc/elasticsearch/jvm.options.d/heap.options << EOF
-Xms256m
-Xmx256m
EOF
```

### Step 5: Start and Enable Elasticsearch
```bash
sudo systemctl daemon-reload
sudo systemctl enable elasticsearch
sudo systemctl start elasticsearch
```

### Step 6: Verify Installation
Wait 30 seconds, then check status:
```bash
sudo systemctl status elasticsearch
```

Get the default password:
```bash
sudo /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic
```

Test connection:
```bash
curl -k -u elastic:YOUR_PASSWORD https://localhost:9200
```

---

### Logstash

### Step 1: Install Logstash
```bash
sudo apt install -y logstash
```

### Step 2: Configure Logstash Memory
```bash
sudo tee /etc/logstash/jvm.options << EOF
-Xms256m
-Xmx256m
EOF
```

### Step 3: Create Logstash Configuration
Create the DreamFactory configuration file:

```bash
sudo tee /etc/logstash/conf.d/dreamfactory.conf << 'EOF'
input {
  gelf {
    port => 12201
    type => "dreamfactory"
  }
}

filter {
  if [type] == "dreamfactory" {
    # Rename host field to avoid conflict with ECS (Elastic Common Schema) host object
    # Note: ECS is a vendor-neutral standard that works across all cloud providers and on-premise
    if [host] {
      mutate {
        rename => { "host" => "source_hostname" }
      }
    }
    
    # Add host information as object for ECS compatibility
    # This follows the ECS standard and works on AWS, Azure, GCP, on-premise, etc.
    mutate {
      add_field => { 
        "log_source" => "dreamfactory"
        "[host][name]" => "%{source_hostname}"
      }
    }
    
    # Parse log level if present
    if [level] {
      mutate {
        uppercase => [ "level" ]
      }
    }
    
    # Extract user_id from JWT session token
    ruby {
      code => '
        begin
          # Access nested field directly
          event_data = event.get("event")
          if event_data && event_data.is_a?(Hash)
            request_data = event_data["request"]
            if request_data && request_data.is_a?(Hash)
              headers = request_data["headers"]
              if headers && headers.is_a?(Hash)
                token = headers["x-dreamfactory-session-token"]
                if token && token.is_a?(String) && token.include?(".")
                  parts = token.split(".")
                  if parts.length >= 2
                    payload_b64 = parts[1]
                    # Add padding for base64 URL-safe decoding
                    padding = (4 - payload_b64.length % 4) % 4
                    payload_b64 += "=" * padding
                    # Decode and parse
                    require "base64"
                    require "json"
                    payload_json = Base64.urlsafe_decode64(payload_b64)
                    payload = JSON.parse(payload_json)
                    if payload["user_id"]
                      event.set("[user][id]", payload["user_id"])
                    end
                  end
                end
              end
            end
          end
        rescue => e
          # Silently fail
        end
      '
    }
  }
}

output {
  elasticsearch {
    hosts => ["https://localhost:9200"]
    user => "elastic"
    password => "YOUR_ELASTICSEARCH_PASSWORD"
    ssl_enabled => true
    ssl_verification_mode => "none"
    index => "logstash-dreamfactory-%{+YYYY.MM.dd}"
  }
}
EOF
```

**Important:** Replace `YOUR_ELASTICSEARCH_PASSWORD` with the password you obtained in Step 6 of Elasticsearch installation.

### Step 4: Set File Permissions
```bash
sudo chown logstash:logstash /etc/logstash/conf.d/dreamfactory.conf
sudo chmod 644 /etc/logstash/conf.d/dreamfactory.conf
```

### Step 5: Test Configuration
```bash
sudo /usr/share/logstash/bin/logstash --path.settings=/etc/logstash --config.test_and_exit
```

### Step 6: Start and Enable Logstash
```bash
sudo systemctl daemon-reload
sudo systemctl enable logstash
sudo systemctl start logstash
```

### Step 7: Verify Installation
```bash
sudo systemctl status logstash
sudo tail -f /var/log/logstash/logstash-plain.log
```

---

### Grafana

### Step 1: Install Dependencies
```bash
sudo apt install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
```

### Step 2: Add Grafana GPG Key
```bash
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt update
```

### Step 3: Install Grafana
```bash
sudo apt install -y grafana
```

### Step 4: Start and Enable Grafana
```bash
sudo systemctl daemon-reload
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

### Step 5: Access Grafana Web UI
Open your browser and navigate to:
```
http://YOUR_SERVER_IP:3000
```

Default credentials:
- Username: `admin`
- Password: `admin` (you'll be prompted to change it)

---

## Configuration

### Elasticsearch Configuration

### Basic Security Settings

Elasticsearch 8.x has security enabled by default. The default user is `elastic` with a randomly generated password.

### Index Management
Logs are automatically indexed with the pattern: `logstash-dreamfactory-YYYY.MM.dd`

View indices:
```bash
curl -k -u elastic:YOUR_PASSWORD https://localhost:9200/_cat/indices?v
```

---

### Logstash Configuration

### Key Configuration Points

1. **GELF Input**: Listens on UDP port 12201 for Graylog Extended Log Format (GELF) messages from DreamFactory
2. **JWT Extraction**: Extracts `user_id` from DreamFactory session tokens and adds it as `user.id` field
3. **Field Mapping**: Renames `host` to `source_hostname` to avoid Elasticsearch mapping conflicts
4. **ECS Compatibility**: Uses Elastic Common Schema (ECS) standard for `host.name` field - this is vendor-neutral and works across all cloud providers (AWS, Azure, GCP, etc.) and on-premise installations
5. **Index Pattern**: Creates daily indices for better performance and management

### Verify Logstash is Receiving Logs
```bash
sudo netstat -tlnp | grep 12201
```

### Check Logstash Logs
```bash
sudo tail -f /var/log/logstash/logstash-plain.log
```

---

### Grafana Configuration

### Step 1: Add Elasticsearch Data Source

1. Go to **Configuration** → **Data Sources**
2. Click **Add data source**
3. Select **Elasticsearch**
4. Configure:
   - **Name**: `DreamFactory Logs`
   - **URL**: `https://localhost:9200`
   - **Access**: Server (default)
   - **Basic Auth**: Enabled
     - **User**: `elastic`
     - **Password**: Your Elasticsearch password
   - **TLS/SSL Mode**: Skip TLS Verification
   - **Index name**: `logstash-dreamfactory-*`
   - **Time field**: `@timestamp`
   - **Version**: `8.0+`
5. Click **Save & Test**

### Step 2: Add Infinity Data Source (for User Enrichment)

**Prerequisites: Create a Least-Privilege API Key**

Before configuring the Infinity data source, create a DreamFactory API key with minimal permissions:

1. **Log into DreamFactory Admin Console**
2. **Navigate to Roles** → Create a new role (e.g., "Grafana Read-Only")
3. **Set Role Permissions** (see [Role-Based Access Control](/Security/role-based-access) for detailed information):
   - **Service**: `system`
   - **Component**: `user`
   - **Access**: `GET` only (read-only)
   - **Fields**: Allow access to: `id`, `first_name`, `last_name`, `email` (user/* in the Component section will give permission to view all user fields if needed)
4. **Create API Key**:
   - Go to **Users** → Select or create a user
   - Assign the "Grafana Read-Only" role to the user
   - Generate an API key for this user
   - **Note**: This API key will only have read access to user data, not full admin access

**Alternative: Use Existing Role with Limited Permissions**
- If you have a read-only role, you can use an existing API key with that role
- Ensure the role has GET access to `system/user` endpoint

**Configure Infinity Data Source**:

1. Install Infinity plugin (if not already installed):
   ```bash
   sudo grafana-cli plugins install yesoreyeram-infinity-datasource
   sudo systemctl restart grafana-server
   ```

2. Go to **Configuration** → **Data Sources**
3. Click **Add data source**
4. Select **Infinity**
5. Configure:
   - **Name**: `DreamFactory API`
   - **URL**: `http://localhost` (or your DreamFactory URL)
   - **Authentication**: API Key
     - Add header: `X-DreamFactory-API-Key` with your least-privilege API key (created in the Prerequisites section above)
     - **Security Note**: Use the read-only API key, not an admin key
6. Click **Save & Test**

---

## DreamFactory Integration

### Step 0: Create Least-Privilege API Key for Grafana

The Infinity data source only needs read access to user data. Create a minimal-permission API key:

#### Option 1: Create a Custom Read-Only Role (Recommended)

1. **Log into DreamFactory Admin Console**
2. **Navigate to**: **Roles** → **Create Role**
3. **Role Configuration**:
   - **Name**: `grafana-readonly` (or similar)
   - **Description**: `Read-only access for Grafana user enrichment`
4. **Set Service Access**:
   - **Service**: `system`
   - **Component**: `user`
   - **Access**: `GET` only
   - **Fields**: `id`, `first_name`, `last_name`, `email` (or leave blank for all fields)
5. **Save the role**

#### Option 2: Use Existing Read-Only Role

If you already have a read-only role with `system/user` GET access, you can use that.

#### Create API Key with the Role

1. **Navigate to**: **Users** → Select a user (or create a dedicated user like `grafana-service`)
2. **Assign Role**: Add the `grafana-readonly` role to the user
3. **Generate API Key**:
   - Go to the user's profile
   - Generate or copy the API key
   - **Store securely** - this key will be used in Grafana configuration

---

### Step 1: Enable Logstash Connector in DreamFactory

1. Log into DreamFactory Admin Console
2. Navigate to **Services** → **System** → **Logstash**
3. Enable the Logstash connector
4. Configure:
   - **Host**: `localhost` (or your Logstash server IP)
   - **Port**: `12201`
   - **Protocol**: `GELF (UDP)`
   - **Log Context**: `Request All`
   Service Event: (These are the Events necessary to integrate Logstash with our template Grafana Dashboard)
   - Event: user.* | Log level: INFO | Message: System Activity
   - Event: db.* | Log Level: INFO | Default Database Activity (db is a local SQLite database typically included with all DreamFactory installations)
   - Event: files.* | Log Level: INFO| File Activity
   - To add your own Database or other service connection start typing the name of your service and select the service followed by * or your specfic criteria

5. Save configuration

### Step 2: Verify Logs are Being Sent

Check if DreamFactory is sending logs: (Generate some API requests or logins to see them appear in the logs)
```bash
sudo tcpdump -i any -n udp port 12201
```

Or check Logstash logs:
```bash
sudo tail -f /var/log/logstash/logstash-plain.log | grep dreamfactory
```

### Step 3: Verify Logs in Elasticsearch

```bash
curl -k -u elastic:YOUR_PASSWORD "https://localhost:9200/logstash-dreamfactory-*/_search?size=1&pretty"
```

---

## Dashboard Setup

### Creating the User Activity Dashboard

### Panel 1: Total API Calls by User

**Purpose**: Shows the total number of API calls made by each user with email enrichment.

**Query Configuration**:
- **Data Source**: DreamFactory Logs (Elasticsearch)
- **Query Type**: Count
- **Query**: `user.id:* event.request.method:*`
- **Bucket Aggregations**:
  - **Terms**: `user.id` (Size: 50, Order: Desc by _count)
- **Time Field**: `@timestamp`

**Second Query** (for email enrichment):
- **Data Source**: DreamFactory API (Infinity)
- **Type**: JSON
- **URL**: `/api/v2/system/user?fields=id,first_name,last_name,email&limit=100`
- **Parser**: Backend
- **Root Selector**: `resource`

**Transformations**:
1. **Join by field**: Join query A and B on `user.id` (Mode: Outer)
2. **Organize fields**: 
   - Exclude: `first_name B`, `last_name B`, `user.id`, `user.id 1`, `user.id 2`
   - Rename: `Count` → `Total API Calls`, `email B` → `User Email`
3. **Filter data by values**: 
   - Field: `Total API Calls`
   - Condition: `IS NOT NULL`

**Field Mappings**:
- Map empty/null email values to "Admin User"

The Dashboard should end up looking similar to this:

<div className="image-container">
  <a href="#lightbox-grafana-dashboard">
    <img 
      src="/img/Logstash/GrafanaDashboardTemplate.png" 
      alt="Grafana Dashboard Template" 
      className="image-lightbox"
    />
  </a>
</div>

<a href="#" className="lightbox-overlay" id="lightbox-grafana-dashboard">
  <span className="lightbox-close">&times;</span>
  <img 
    src="/img/Logstash/GrafanaDashboardTemplate.png" 
    alt="Grafana Dashboard Template" 
    className="lightbox-content"
  />
</a>

When there are no calls in the selected time frame for a user the panels should all be empty as the filters we applied should remove any row with no calls.

---

### Panel 2: APIs Accessed by Each User

**Purpose**: Shows which specific API endpoints each user accessed with HTTP method details.

**Query Configuration**:
- **Data Source**: DreamFactory Logs (Elasticsearch)
- **Query Type**: Count
- **Query**: `user.id:* event.request.method:* event.request.uri:*`
- **Bucket Aggregations**:
  1. **Terms**: `user.id` (Size: 20, Order: Desc by _count)
  2. **Terms**: `event.request.method.keyword` (Size: 10, Order: Desc by _count)
  3. **Terms**: `event.request.uri.keyword` (Size: 25, Order: Desc by _count)
- **Time Field**: `@timestamp`

**Second Query** (for email enrichment):
- Same as Panel 1

**Transformations**:
1. **Join by field**: Join on `user.id` (Mode: Outer Tabular)
2. **Organize fields**:
   - Exclude: `first_name B`, `last_name B`, `user.id`, `user.id 1`, `user.id 2`
   - Rename: 
     - `email B` → `User Email`
     - `event.request.method.keyword` → `HTTP Method`
     - `event.request.uri.keyword` → `API Endpoint`
3. **Filter data by values**: 
   - Field: `Count` (or your count column)
   - Condition: `IS NOT NULL`

---

### Panel 3: User Access to Specific Services

**Purpose**: Shows which DreamFactory services each user accessed.

**Query Configuration**:
- **Data Source**: DreamFactory Logs (Elasticsearch)
- **Query Type**: Count
- **Query**: `user.id:* event.request.method:* event.request.service:*`
- **Bucket Aggregations**:
  1. **Terms**: `user.id` (Size: 20, Order: Desc by _count)
  2. **Terms**: `event.request.service.keyword` (Size: 15, Order: Desc by _count)
  3. **Terms**: `event.request.method.keyword` (Size: 10, Order: Desc by _count)
- **Time Field**: `@timestamp`

**Second Query** (for email enrichment):
- Same as Panel 1

**Transformations**:
1. **Join by field**: Join on `user.id` (Mode: Outer Tabular)
2. **Organize fields**:
   - Exclude: `first_name B`, `last_name B`, `user.id`, `user.id 1`, `user.id 2`
   - Rename:
     - `email B` → `User Email`
     - `event.request.method.keyword` → `HTTP Method`
     - `event.request.service.keyword` → `Service`
3. **Filter data by values**: 
   - Field: `Count`
   - Condition: `IS NOT NULL`

---

### Dashboard Settings

**Time Range**: Set to "Last 24 hours" (adjustable)
**Refresh Interval**: 1 minute (recommended)
**Tags**: `dreamfactory`, `users`, `api`, `activity`

---

## Dashboard Function and Use

### Overview

The dashboard provides comprehensive visibility into DreamFactory API usage by individual users, helping administrators:

1. **Monitor User Activity**: See which users are actively using the API
2. **Identify API Usage Patterns**: Understand which endpoints and services are most accessed
3. **Troubleshoot Issues**: Track user-specific API calls for debugging
4. **Security Auditing**: Monitor API access patterns for security analysis

### Key Features

### User Identification
- **User ID Extraction**: Automatically extracts user IDs from JWT session tokens
- **Email Enrichment**: Joins with DreamFactory user database to show email addresses
- **Admin User Handling**: Maps null/empty emails to "Admin User" for system-level operations

### Data Filtering
- **Method-Based Filtering**: Only shows users with actual HTTP method calls (GET, POST, etc.)
- **Complete Data Only**: Filters out rows with missing data using transformation filters
- **Real-Time Updates**: Refreshes every minute to show current activity

### Aggregation Levels
1. **User-Level**: Total calls per user
2. **Endpoint-Level**: Specific API endpoints accessed
3. **Service-Level**: DreamFactory services accessed (db, system, files, etc.)

### Use Cases

1. **Activity Monitoring**
   - Identify most active users
   - Track API usage trends
   - Monitor system load by user

2. **Troubleshooting**
   - Find which user made a specific API call
   - Track user-specific errors
   - Debug authentication issues

3. **Security Auditing**
   - Monitor unusual access patterns
   - Track service access by user
   - Identify potential security issues

4. **Capacity Planning**
   - Understand API usage patterns
   - Plan for user growth
   - Optimize service performance

### Interpreting the Data

- **Total API Calls**: Sum of all HTTP requests made by a user
- **HTTP Method**: Type of request (GET, POST, PUT, DELETE, etc.)
- **API Endpoint**: Specific DreamFactory API path accessed
- **Service**: DreamFactory service category (db, system, files, etc.)
- **User Email**: Email address from DreamFactory user database (or "Admin User" for system operations)

---

## Maintenance

### Regular Tasks

1. **Monitor Disk Space**: Elasticsearch indices can grow large
   ```bash
   curl -k -u elastic:YOUR_PASSWORD "https://localhost:9200/_cat/indices?v"
   ```

2. **Index Management**: Consider setting up index lifecycle management
   ```bash
   # Delete old indices (example: older than 30 days)
   curl -k -u elastic:YOUR_PASSWORD -X DELETE "https://localhost:9200/logstash-dreamfactory-2024.12.*"
   ```

3. **Log Rotation**: Monitor Logstash logs
   ```bash
   sudo logrotate -d /etc/logrotate.d/logstash
   ```

4. **Performance Monitoring**: Check Elasticsearch cluster health
   ```bash
   curl -k -u elastic:YOUR_PASSWORD "https://localhost:9200/_cluster/health?pretty"
   ```
---
If you have any issues or need help with a specifc Grafana dashboard panel please reach out to DreamFactory support!

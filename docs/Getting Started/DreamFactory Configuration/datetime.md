---
sidebar_position: 1
id: datetime
title: Date and Time Configuration
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Date and Time Configuration in DreamFactory

## Overview
Database vendors handle date and time values in different formats, making it challenging to maintain consistent behavior across multiple database types. Below are examples of default formats from popular databases:

:::info[Date and Time Formats by Database Type]
<Tabs>
  <TabItem value="mysql" label="MySQL">
    ```json
    {
      "lunch_time": "09:45:00",
      "birth_date": "2003-01-16",
      "last_contact": "2014-03-14 13:34:00",
      "last_modified_date": "2014-12-11 17:20:34"
    }
    ```
  </TabItem>
  <TabItem value="sqlserver" label="MS SQL Server">    
    ```json
    {
      "lunch_time": "09:45:00.0000000",
      "birth_date": "2003-01-16",
      "last_contact": "2014-03-14 13:34:00.0000000",
      "last_modified_date": "2014-12-11T14:11:27.3012644Z"
    }
    ```
  </TabItem>
</Tabs>
:::

While these formats can be configured at the database level or modified during transactions using vendor-specific conversions, such approaches are complex and inflexible. DreamFactory solves this by providing a "blending" API that allows you to standardize date and time formats across all connected database services, ensuring consistent data formatting for all clients.

## Configuration
Date and time format settings are managed in the `config/df.php` file in your DreamFactory installation's root directory:

```php
//-------------------------------------------------------------------------
//  Date and Time Format Options
//-------------------------------------------------------------------------
    // DB configs
    'db'                           => [
        //-------------------------------------------------------------------------
        //  Date and Time Format Options
        //  The default date and time formats used for in and out requests for
        //  all database services, including stored procedures and system service resources.
        //  Default values of null means no formatting is performed on date and time field values.
        //  Examples: 'm/d/y h:i:s A' or 'c' or DATE_COOKIE
        //-------------------------------------------------------------------------
        'time_format'            => null,
        'date_format'            => null,
        'datetime_format'     => null,
        'timestamp_format'  => null,
```

### Format Reference
For detailed information about available format options, refer to:
- [DateTime::createFromFormat() documentation](https://php.net/manual/en/datetime.createfromformat.php)
- [date() function documentation](https://php.net/manual/en/function.date.php)
- [DateTime constants](https://php.net/manual/en/class.datetime.php#datetime.constants.types)

### Example Formats
Here are example formats for each DreamFactory data type:

```php
'date_format'      => 'l jS \of F Y',    // "Thursday 16th of January 2003"
'time_format'      => 'h:i A',           // "09:45 AM"
'datetime_format'  => 'm/d/y h:i:s A',   // "03/14/14 01:34:00 PM"
'timestamp_format' => 'c',               // "2014-12-10T14:42:18-05:00"
```

The following shows how the same dataset would be formatted using these settings:

```json
{
    "lunch_time": "09:45 AM",
    "birth_date": "Thursday 16th of January 2003",
    "last_contact": "03/14/14 01:34:00 PM",
    "last_modified_date": "2014-12-10T14:42:18-05:00"
}
```

:::tip[Applying Changes]
After modifying these settings, clear the platform cache by running:
```bash
php artisan cache:clear
php artisan config:clear
```
:::

## Client Usage
The date and time format settings are available through the system environment API, allowing clients to maintain consistent formatting:

```http
GET https://{your-dreamfactory-url}/api/v2/system/environment
```

Response example:
```json
{
    "db": {
        "date_format": "l jS \\of F Y",
        "time_format": "h:i A",
        "datetime_format": "m/d/y h:i:s A",
        "timestamp_format": "l, d-M-Y H:i:s T",
        "max_records_returned": 1000
    }
}
```

:::important
When working with the API:
- These formats are used for both database record retrieval and stored procedure call responses
- Date and time values must use the same format for both retrieving and sending data
- You cannot retrieve a date as 'yyyy/mm/dd' and then update it using 'mm/dd/yyyy' format
:::
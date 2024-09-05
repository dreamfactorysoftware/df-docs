---
sidebar_position: 1
---

# Role Based Access

## Creating Role Based Access Controls

Over time your DreamFactory instance will likely manage multiple APIs. Chances are you're going to want to silo access to these APIs, creating one or several API keys for each. These API keys will be configured to allow access to one or some APIs, but in all likelihood not all of them. To accomplish this, you'll create a *role* which is associated with one or more services, and then assign that role to an *API Key*.

To create a role, click on the `Role Based Access` tab located on the left navbar:

<img src="/img/database-backed-api/role-navbar.png" width="400" alt="Creating a Role for your DreamFactory API" />

Click the purple + button to create a new Role and you'll be prompted to enter a role name and description. Unlike the service name, the role name is only used for human consumption so be sure to name it something descriptive such as `MySQL Role`. You'll notice an `Access Overview` section to identify the API(s) which should be associated with this service. The default interface looks like that presented in the below screenshot:

<img src="/img/database-backed-api/role-access-overview.png" width="800" alt="Name your Role" />

The `Service` select box contains all of the APIs you've defined this far, including a few which are automatically included with each DreamFactory instance (`system`, `api_docs`, etc). Select the `mysql` service. Now here's where things get really interesting. After selecting the `mysql` service, click on the `Component` select box. You'll see this select box contains a list of all assets exposed through this API! If you leave the `Component` select box set to `*`, then the role will have access to all of the APIs assets. However, you're free to restrict the role's access to one or several assets by choosing for instance `_table/employees/*`. This would limit this role's access to *just* performing CRUD operations on the `employees` table! Further, using the `Access` select box, you can restrict which methods can be used by the role, selecting only `GET`, only `POST`, or any combination thereof.

If you wanted to add access to another asset, or even to another service, just click the plus sign next to the `Advanced Filters` header, and you'll see an additional row added to the interface:

<img src="/img/database-backed-api/mysql-role-access.png" width="800" alt="Assign a Service to the Created Role" />

Use the new row to assign another service and/or already assigned service component to the role. In the screenshot you can see the role has been granted complete access to the `mysql` service's `employees` table, and read-only access to the `departments` table.

Once you are satisfied with the role's configuration, press the `Save` button to create the role. With that done, it's time to create a new API Key and attach it to this role.
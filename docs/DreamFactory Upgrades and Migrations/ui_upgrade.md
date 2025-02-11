---
id: upgrading-ui
title: Upgrading the DreamFactory UI
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Upgrading Your DreamFactory UI

This guide walks through the process of upgrading the DreamFactory UI interface to the latest version. The UI upgrade process is separate from the core DreamFactory upgrade process and can be performed independently. There are two ways to upgrade the UI:
1. Manually installing the latest development release from the [DreamFactory UI GitHub repository](https://github.com/dreamfactorysoftware/df-admin-interface/releases) and then running the below script to install it.
2. Using the automated script below to perform all of the below steps in one go.

## Prerequisites

Before beginning the upgrade process, ensure you have:
- Access to your DreamFactory installation
- Command line/terminal access
- `wget` installed
- Appropriate system permissions
- [Backup](/DreamFactory%20Upgrades%20and%20Migrations/migrating-dreamfactory#step-2-back-up-the-system-database) of your current installation (recommended)

## Method 1: Manual Upgrade

### 1. Download the Latest UI Release
```bash
wget https://github.com/dreamfactorysoftware/df-admin-interface/releases/download/1.3.5/dev-release.zip
```

### 2. Prepare the Release File
```bash
mv dev-release.zip release.zip
```

### 3. Get the Installation Script
```bash
wget https://gist.githubusercontent.com/nicdavidson/a69d2b6700cb2309c6f887077d2ccedd/raw/f86e99c96aa968fb9d560a919c7bff8e25ff629d/install_df_ui.sh
```

### 4. Make the Script Executable
```bash
chmod +x ./install_df_ui.sh
```

### 5. Run the Installation
Execute the installation script:
```bash
./install_df_ui.sh
```

When prompted, you'll see:
```bash
Do you want the script to download the latest DreamFactory UI release for you? (y/n)
```

Enter `n` since we've already downloaded the release file. The script will then proceed with the installation.

<details>
<summary>**View complete installation output**</summary>

```bash
Do you want the script to download the latest DreamFactory UI release for you? (y/n)
n
Using local file release.zip in the current directory.

Cleaning old UI files...
removed '/opt/dreamfactory/public/common.ab6cd462a37ab941.js'
removed '/opt/dreamfactory/public/1844.2f6acf7fb985ab07.js'
removed '/opt/dreamfactory/public/599.5e747b14ec916bc4.js'
removed '/opt/dreamfactory/public/5986.ddd3201fdea5a605.js'
removed '/opt/dreamfactory/public/1750.05c49b3e3fc9f280.js'
removed '/opt/dreamfactory/public/5313.62159151664b4253.js'
removed '/opt/dreamfactory/public/7415.82b6562e51f50ec3.js'
removed '/opt/dreamfactory/public/8525.19cc02a66cd7ac62.js'
removed '/opt/dreamfactory/public/6093.42dba1afc5b58b8e.js'
removed '/opt/dreamfactory/public/2596.a606b9e6abc49891.js'
removed '/opt/dreamfactory/public/1609.a4e38a7bfa38816e.js'
removed '/opt/dreamfactory/public/7653.922fb878ee27e76d.js'
removed '/opt/dreamfactory/public/7345.83e2a844b6422feb.js'
removed '/opt/dreamfactory/public/4104.5ae8ada24976acbe.js'
removed '/opt/dreamfactory/public/7532.b4b763fc4b02e4f6.js'
removed '/opt/dreamfactory/public/3656.c0773b75fc0d7bde.js'
removed '/opt/dreamfactory/public/4418.a9f43d6ffea1bc57.js'
removed '/opt/dreamfactory/public/6080.a66bf2f733c7e629.js'
removed '/opt/dreamfactory/public/2446.88a1214d0a73dc2a.js'
removed '/opt/dreamfactory/public/runtime.bda9c41a1922f789.js'
removed '/opt/dreamfactory/public/main.b78214dff25fbdd9.js'
removed '/opt/dreamfactory/public/4211.254ff8ca6c267379.js'
removed '/opt/dreamfactory/public/1269.3d94950afc54efb1.js'
removed '/opt/dreamfactory/public/5195.59370395ae857257.js'
removed '/opt/dreamfactory/public/5954.5490d2d3b74934c9.js'
removed '/opt/dreamfactory/public/3893.a258365755e1269a.js'
removed '/opt/dreamfactory/public/9488.6c46e3da9d9997d8.js'
removed '/opt/dreamfactory/public/6381.dba2c518fa116f1b.js'
removed '/opt/dreamfactory/public/7466.4692f508a20913e3.js'
removed '/opt/dreamfactory/public/2065.16a36ca155fb3f7c.js'
removed '/opt/dreamfactory/public/1514.6e9ef0db49a735a1.js'
removed '/opt/dreamfactory/public/8393.fb4ff876758c2446.js'
removed '/opt/dreamfactory/public/7345.c88c545cffb83642.js'
removed '/opt/dreamfactory/public/polyfills.def0190516b19e6b.js'
removed '/opt/dreamfactory/public/8542.d7c5965b05221582.js'
removed '/opt/dreamfactory/public/7771.f218e99b3290336a.js'
removed '/opt/dreamfactory/public/7313.26e57ec5d44ce7d2.js'
removed '/opt/dreamfactory/public/5381.c9ad2ceeaa1e506c.js'
removed '/opt/dreamfactory/public/5058.25e77924219a9dfe.js'
removed '/opt/dreamfactory/public/8941.649796145a11266c.js'
removed '/opt/dreamfactory/public/4418.23ecc8914ba16bec.js'
removed '/opt/dreamfactory/public/1155.501ded9e9ae5bdc8.js'
removed '/opt/dreamfactory/public/1361.8ee4871b102cc8ea.js'
removed '/opt/dreamfactory/public/8542.a7347f7c225c5045.js'
removed '/opt/dreamfactory/public/3517.ab5f5e249bf79f77.js'
removed '/opt/dreamfactory/public/7345.1aad35a605dde45c.js'
removed '/opt/dreamfactory/public/8372.6d086dc27ad52bbb.js'
removed '/opt/dreamfactory/public/4748.e223e803e57ec16a.js'
removed '/opt/dreamfactory/public/9043.636e757291ca9414.js'
removed '/opt/dreamfactory/public/9280.ae7034942d0d1d5a.js'
removed '/opt/dreamfactory/public/main.f321cb5815e68a89.js'
removed '/opt/dreamfactory/public/3438.e0f52d84511e1d50.js'
removed '/opt/dreamfactory/public/7993.422efc6bf8ee72a9.js'
removed '/opt/dreamfactory/public/6371.b6a47031bdea6fa6.js'
removed '/opt/dreamfactory/public/3893.95628c9d5106a5c3.js'
removed '/opt/dreamfactory/public/runtime.348ab2014987d834.js'
removed '/opt/dreamfactory/public/7823.6a9c08f06a6526a9.js'
removed '/opt/dreamfactory/public/runtime.3d71fdbe20fab77f.js'
removed '/opt/dreamfactory/public/runtime.e907cbbe10bb8d8d.js'
removed '/opt/dreamfactory/public/assets/ace-builds/theme-github.js'
removed '/opt/dreamfactory/public/assets/ace-builds/mode-yaml.js'
removed '/opt/dreamfactory/public/assets/ace-builds/worker-json.js'
removed '/opt/dreamfactory/public/assets/ace-builds/worker-javascript.js'
removed '/opt/dreamfactory/public/assets/ace-builds/mode-javascript.js'
removed '/opt/dreamfactory/public/assets/ace-builds/worker-php.js'
removed '/opt/dreamfactory/public/assets/ace-builds/worker-yaml.js'
removed '/opt/dreamfactory/public/assets/ace-builds/mode-php.js'
removed '/opt/dreamfactory/public/assets/ace-builds/theme-github_dark.js'
removed '/opt/dreamfactory/public/assets/ace-builds/mode-json.js'
removed '/opt/dreamfactory/public/assets/ace-builds/mode-text.js'
removed '/opt/dreamfactory/public/assets/ace-builds/mode-python.js'
removed '/opt/dreamfactory/public/5625.c3315a8b39f71f4c.js'
removed '/opt/dreamfactory/public/6509.0c6a567ac571d22e.js'
removed '/opt/dreamfactory/public/6355.4f256328a83084f4.js'
removed '/opt/dreamfactory/public/599.412d6548cad388d3.js'
removed '/opt/dreamfactory/public/6355.05c7f4a9a1d02001.js'
removed '/opt/dreamfactory/public/7345.2062af0e4c835cc9.js'
removed '/opt/dreamfactory/public/1472.a7b8b2c13610d300.js'
removed '/opt/dreamfactory/public/8393.bc4b21d6e133d5e0.js'
removed '/opt/dreamfactory/public/4796.aef0f7879dc9c4a7.js'
removed '/opt/dreamfactory/public/6580.8c5e8a4f7706dfb1.js'
removed '/opt/dreamfactory/public/4796.6e75881dbf0f3d52.js'
removed '/opt/dreamfactory/public/4630.b95aba20f12d90ba.js'
removed '/opt/dreamfactory/public/168.d8f4d2bc613c2175.js'
removed '/opt/dreamfactory/public/6255.18487d3dc79e1a89.js'
removed '/opt/dreamfactory/public/main.97306ea3f4e9630b.js'
removed '/opt/dreamfactory/public/styles.121f97b76c6935d4.css'
Removed old folder: /opt/dreamfactory/public/assets

Extracting release.zip...
Updating index file...

DreamFactory UI update complete!
```

</details>

### 6. Clear Cache and Restart Services
After the installation completes, run these commands:
```bash
php artisan optimize:clear
php artisan route:clear
sudo systemctl restart nginx
sudo systemctl restart php8.1-fpm
```
:::note
Your version of PHP may be different. If so, replace `php8.1-fpm` with the appropriate service name for your version of PHP.
:::

## Method 2: Automated Upgrade

### 1. Navigate to the DreamFactory root directory
:::info[Root Directory Location]
<Tabs>
  <TabItem value="linux" label="Linux">
    ```bash
    cd /opt/dreamfactory
    ```
  </TabItem>
  <TabItem value="docker" label="Docker">
    ```bash
    docker exec -it {container_id} bash
    ```
  </TabItem>
</Tabs>
:::

### 2. Download the Update Script
```bash
wget https://gist.githubusercontent.com/KonnorKurilla/169c85dbabca431d040d98d54e422619/raw/556472441a7a92c11e68d631a860b04a31f67564/df_ui_update.sh
```

### 3. Make the Script Executable
```bash
chmod +x ./df_ui_update.sh
```

### 4. Run the Update Script
```bash
sudo ./df_ui_update.sh
```

## Verification

Access your DreamFactory instance through your browser to verify the upgrade was successful. The UI should now be running the latest version.

## Troubleshooting

If you encounter issues during the upgrade:

- Check the logs for error messages
- Ensure all commands were run with appropriate permissions
- Verify all services restarted successfully
- Clear your browser cache if the UI appears outdated

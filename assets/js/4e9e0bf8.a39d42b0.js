"use strict";(self.webpackChunkdf_docs=self.webpackChunkdf_docs||[]).push([[868],{997:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>o,contentTitle:()=>r,default:()=>h,frontMatter:()=>i,metadata:()=>l,toc:()=>d});var s=t(4848),a=t(8453);const i={sidebar_position:2},r="Linux installation",l={id:"Installing DreamFactory/linux-installation",title:"Linux installation",description:"DreamFactory can be installed on most common Linux platforms using our automated installer. The installer is designed to deploy DreamFactory as the primary application on the server (the site is publised on port 80 of the local host).  This guide provides instructions for downloading and running the installer on a new Linux server. For custom installations or to install manually, follow the Manual Installation guide.",source:"@site/docs/Installing DreamFactory/linux-installation.md",sourceDirName:"Installing DreamFactory",slug:"/Installing DreamFactory/linux-installation",permalink:"/Installing DreamFactory/linux-installation",draft:!1,unlisted:!1,editUrl:"https://github.com/dreamfactorysoftware/df-docs/tree/main/docs/Installing DreamFactory/linux-installation.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"intro",previous:{title:"Installing DreamFactory",permalink:"/Installing DreamFactory/installation"},next:{title:"Docker installation",permalink:"/Installing DreamFactory/docker-installation"}},o={},d=[{value:"Supported operating Systems",id:"supported-operating-systems",level:2},{value:"Automated installer",id:"automated-installer",level:2},{value:"Using the installer",id:"using-the-installer",level:3},{value:"About The system database",id:"about-the-system-database",level:2},{value:"Supported system databases",id:"supported-system-databases",level:3}];function c(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",img:"img",li:"li",ol:"ol",p:"p",ul:"ul",...(0,a.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.header,{children:(0,s.jsx)(n.h1,{id:"linux-installation",children:"Linux installation"})}),"\n",(0,s.jsxs)(n.p,{children:["DreamFactory can be installed on most common Linux platforms using our automated installer. The installer is designed to deploy DreamFactory as the primary application on the server (the site is publised on port 80 of the local host).  This guide provides instructions for downloading and running the installer on a new Linux server. For custom installations or to install manually, follow the ",(0,s.jsx)(n.a,{href:"manual-installation.md",children:"Manual Installation"})," guide."]}),"\n",(0,s.jsx)(n.h2,{id:"supported-operating-systems",children:"Supported operating Systems"}),"\n",(0,s.jsx)(n.p,{children:"DreamFactory currently supports the following flavors of Linux:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"CentOS 7"}),"\n",(0,s.jsx)(n.li,{children:"RHEL 7/8"}),"\n",(0,s.jsx)(n.li,{children:"Oracle Linux 7/8"}),"\n",(0,s.jsx)(n.li,{children:"Debian 10/11"}),"\n",(0,s.jsx)(n.li,{children:"Fedora 36/37"}),"\n",(0,s.jsx)(n.li,{children:"Ubuntu 20/22"}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"automated-installer",children:"Automated installer"}),"\n",(0,s.jsxs)(n.p,{children:["The installer can be found in ",(0,s.jsx)(n.a,{href:"https://github.com/dreamfactorysoftware/dreamfactory/tree/master/installers",children:"DreamFactory's GitHub repository"}),"."]}),"\n",(0,s.jsx)(n.p,{children:"Follow these steps to execute the script on your Linux machine:"}),"\n",(0,s.jsxs)(n.ol,{children:["\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:"Download the script from GitHub:"}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.code,{children:"wget https://github.com/dreamfactorysoftware/dreamfactory/raw/master/installers/dfsetup.run"})}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:"Make the installer executeable:"}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.code,{children:"chmod +x dfsetup.run"})}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsx)(n.p,{children:"Run the installer as sudo:"}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.code,{children:"sudo ./dfsetup.run"})}),"\n"]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"using-the-installer",children:"Using the installer"}),"\n",(0,s.jsx)(n.p,{children:"Once the installer opens, an interactive menu displays:"}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.img,{alt:"linux installer start",src:t(5345).A+"",width:"1570",height:"832"})}),"\n",(0,s.jsxs)(n.p,{children:["A typical installation uses options 0, 5, and 7 for a default build of the latest version of DreamFactory with NGINX as a web server. MariaDB is installed and configured as the system database, and a debug log is available in the ",(0,s.jsx)(n.code,{children:"/tmp/"})," directory."]}),"\n",(0,s.jsxs)(n.p,{children:["The installer verifies the Linux platform is supported and then begins installing dependencies. As each dependency is installed, a progress bar (...) is visible along with any issues that are encountered. You can also tail the log file in the ",(0,s.jsx)(n.code,{children:"/tmp"})," directory if needed."]}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.img,{alt:"linux installer installing",src:t(8626).A+"",width:"1146",height:"488"})}),"\n",(0,s.jsx)(n.p,{children:"The rest of the installer's process provides prompts for you to enter the location of commercial license files, database settings, and initial admin user information. Ensure that you record the system DB details before closing the terminal."}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.img,{alt:"linux installer complete",src:t(5236).A+"",width:"1570",height:"930"})}),"\n",(0,s.jsx)(n.p,{children:"You can now access the DreamFactory UI from a web browser by pointing to the server IP address and using the credentials created during the installer process."}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.img,{alt:"DreamFactory login page",src:t(5793).A+"",width:"2446",height:"1154"})}),"\n",(0,s.jsx)(n.h2,{id:"about-the-system-database",children:"About The system database"}),"\n",(0,s.jsxs)(n.p,{children:["During the installation, you must point DreamFactory's installation to a system database. This database holds the entire configuration for your DreamFactory instance and can be used to replicate, restore, or upgrade an instance in the future. While the default configuration above can set up a system database on localhost, many users, especially those at scale, prefer the system database to be hosted elsewhere. This configuration can be (re)entered by running the following command from the ",(0,s.jsx)(n.code,{children:"/opt/dreamfactory/"})," directory:"]}),"\n",(0,s.jsx)(n.p,{children:(0,s.jsx)(n.code,{children:"php artisan df:env"})}),"\n",(0,s.jsxs)(n.p,{children:["The configuration can also be changed manually by editing ",(0,s.jsx)(n.code,{children:"/opt/dreamfactory/.env"}),". For more information, refer to our ",(0,s.jsx)(n.a,{href:"../DreamFactory%20Configuration/configuration",children:"DreamFactory Basic Configuration"})," documentation."]}),"\n",(0,s.jsx)(n.h3,{id:"supported-system-databases",children:"Supported system databases"}),"\n",(0,s.jsx)(n.p,{children:"Currently, the supported system database types are:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"SQLite"}),"\n",(0,s.jsx)(n.li,{children:"MySQL (MariaDB)"}),"\n",(0,s.jsx)(n.li,{children:"PostgreSQL"}),"\n",(0,s.jsx)(n.li,{children:"SQL Server"}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},5793:(e,n,t)=>{t.d(n,{A:()=>s});const s=t.p+"assets/images/df-login-page-14ebb8d074dabb0cef29857998193c7a.png"},5236:(e,n,t)=>{t.d(n,{A:()=>s});const s=t.p+"assets/images/df-linux-installer-complete-419e586047905ea037c76ef3c056e9b6.png"},8626:(e,n,t)=>{t.d(n,{A:()=>s});const s=t.p+"assets/images/df-linux-installer-installing-b012a4eaf40464151b2acfe735bd70e0.png"},5345:(e,n,t)=>{t.d(n,{A:()=>s});const s=t.p+"assets/images/df-linux-installer-start-31b47849e7a95b679735d9128d8f7964.png"},8453:(e,n,t)=>{t.d(n,{R:()=>r,x:()=>l});var s=t(6540);const a={},i=s.createContext(a);function r(e){const n=s.useContext(i);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:r(e.components),s.createElement(i.Provider,{value:n},e.children)}}}]);
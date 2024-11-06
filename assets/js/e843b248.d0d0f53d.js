"use strict";(self.webpackChunkdf_docs=self.webpackChunkdf_docs||[]).push([[995],{7732:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>i,contentTitle:()=>r,default:()=>h,frontMatter:()=>c,metadata:()=>a,toc:()=>l});var o=s(4848),n=s(8453);const c={sidebar_position:1},r="Role Based Access",a={id:"Security and Authentication/role-based-access",title:"Role Based Access",description:"Creating Role Based Access Controls",source:"@site/docs/Security and Authentication/role-based-access.md",sourceDirName:"Security and Authentication",slug:"/Security and Authentication/role-based-access",permalink:"/Security and Authentication/role-based-access",draft:!1,unlisted:!1,editUrl:"https://github.com/dreamfactorysoftware/df-docs/tree/main/docs/Security and Authentication/role-based-access.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"intro",previous:{title:"Interacting with the API",permalink:"/API Creation and Management/interacting-with-api"},next:{title:"API Keys",permalink:"/Security and Authentication/api-keys"}},i={},l=[{value:"Creating Role Based Access Controls",id:"creating-role-based-access-controls",level:2}];function d(e){const t={code:"code",em:"em",h1:"h1",h2:"h2",header:"header",p:"p",strong:"strong",...(0,n.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(t.header,{children:(0,o.jsx)(t.h1,{id:"role-based-access",children:"Role Based Access"})}),"\n",(0,o.jsx)(t.h2,{id:"creating-role-based-access-controls",children:"Creating Role Based Access Controls"}),"\n",(0,o.jsxs)(t.p,{children:["Over time your DreamFactory instance will likely manage multiple APIs. Chances are you're going to want to silo access to these APIs, creating one or several API keys for each. These API keys will be configured to allow access to one or some APIs, but in all likelihood not all of them. To accomplish this, you'll create a ",(0,o.jsx)(t.em,{children:"role"})," which is associated with one or more services, and then assign that role to an ",(0,o.jsx)(t.em,{children:"API Key"}),"."]}),"\n",(0,o.jsxs)(t.p,{children:["To create a role, in the left navbar click on the ",(0,o.jsx)(t.strong,{children:"Role Based Access"})," tab:"]}),"\n",(0,o.jsx)("img",{src:"/img/database-backed-api/role-navbar.png",width:"400",alt:"Creating a Role for your DreamFactory API"}),"\n",(0,o.jsxs)(t.p,{children:["Click the purple + button to create a new Role. You are prompted to enter a role name and description. Unlike the service name, the role name is only used for human consumption so be sure to give it a descriptive name such as ",(0,o.jsx)(t.code,{children:"MySQL Role"}),". There is an ",(0,o.jsx)(t.strong,{children:"Access Overview"})," section to identify the API(s) which should be associated with this service. The default interface looks like this:"]}),"\n",(0,o.jsx)("img",{src:"/img/database-backed-api/role-access-overview.png",width:"800",alt:"Name your Role"}),"\n",(0,o.jsxs)(t.p,{children:["The ",(0,o.jsx)(t.strong,{children:"Service"})," select box contains all of the APIs you've defined this far, including a few which are automatically included with each DreamFactory instance (",(0,o.jsx)(t.code,{children:"system"}),", ",(0,o.jsx)(t.code,{children:"api_docs"}),", etc). Select the ",(0,o.jsx)(t.code,{children:"mysql"})," service. Now here's where things get really interesting. After selecting the ",(0,o.jsx)(t.code,{children:"mysql"})," service, click the ",(0,o.jsx)(t.strong,{children:"Component"})," select box. This select box contains a list of all assets exposed through this API! If you leave the ",(0,o.jsx)(t.strong,{children:"Component"})," select box set to ",(0,o.jsx)(t.code,{children:"*"}),", then the role has access to all of the APIs assets. However, you're free to restrict the role's access to one or several assets by choosing for instance ",(0,o.jsx)(t.code,{children:"_table/employees/*"}),". This would limit this role's access to ",(0,o.jsx)(t.em,{children:"just"})," performing CRUD operations on the ",(0,o.jsx)(t.code,{children:"employees"})," table! Further, using the ",(0,o.jsx)(t.code,{children:"Access"})," select box, you can restrict which methods can be used by the role, selecting only ",(0,o.jsx)(t.code,{children:"GET"}),", only ",(0,o.jsx)(t.code,{children:"POST"}),", or any combination of methods."]}),"\n",(0,o.jsxs)(t.p,{children:["If you want to add access to another asset, or even to another service, just click the plus sign next to the ",(0,o.jsx)(t.strong,{children:"Advanced Filters"})," header, and an additional row is added to the interface:"]}),"\n",(0,o.jsx)("img",{src:"/img/database-backed-api/mysql-role-access.png",width:"800",alt:"Assign a Service to the Created Role"}),"\n",(0,o.jsxs)(t.p,{children:["Use the new row to assign another service and/or already assigned service component to the role. In the screenshot you can see the role has been granted complete access to the ",(0,o.jsx)(t.code,{children:"mysql"})," service's ",(0,o.jsx)(t.code,{children:"employees"})," table, and read-only access to the ",(0,o.jsx)(t.code,{children:"departments"})," table."]}),"\n",(0,o.jsxs)(t.p,{children:["Once you are satisfied with the role's configuration, click ",(0,o.jsx)(t.strong,{children:"Save"})," to create the role. With that done, it's time to create a new API Key and attach it to this role."]})]})}function h(e={}){const{wrapper:t}={...(0,n.R)(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(d,{...e})}):d(e)}},8453:(e,t,s)=>{s.d(t,{R:()=>r,x:()=>a});var o=s(6540);const n={},c=o.createContext(n);function r(e){const t=o.useContext(c);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:r(e.components),o.createElement(c.Provider,{value:t},e.children)}}}]);
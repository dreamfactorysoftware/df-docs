import React from "react";
import Head from "@docusaurus/Head";
import { useLocation } from "@docusaurus/router";

// HowTo schemas for installation pages.
// Each entry maps a URL path prefix to structured HowTo data.
const howToSchemas: Record<
  string,
  { name: string; description: string; steps: { name: string; text: string }[] }
> = {
  "/getting-started/installing-dreamfactory/docker-installation": {
    name: "Install DreamFactory with Docker",
    description:
      "Install DreamFactory using Docker and docker-compose with MySQL, Redis, and a sample PostgreSQL database.",
    steps: [
      {
        name: "Install prerequisites",
        text: "Install Git, Docker, and Docker Compose on your system.",
      },
      {
        name: "Clone the Docker repository",
        text: "Run: git clone https://github.com/dreamfactorysoftware/df-docker.git && cd df-docker",
      },
      {
        name: "Configure docker-compose.yml",
        text: "Optionally edit docker-compose.yml to change database credentials, ports, or persistent storage settings.",
      },
      {
        name: "Build the Docker images",
        text: "Run: docker-compose build",
      },
      {
        name: "Start DreamFactory",
        text: "Run: docker-compose up -d to start the web, MySQL, Redis, and sample PostgreSQL containers.",
      },
      {
        name: "Access DreamFactory",
        text: "Open http://localhost:80 in your browser and complete the setup wizard.",
      },
    ],
  },
  "/getting-started/installing-dreamfactory/linux-installation": {
    name: "Install DreamFactory on Linux",
    description:
      "Install DreamFactory on Ubuntu, RHEL, CentOS, Debian, or Fedora using the automated installer.",
    steps: [
      {
        name: "Download the installer",
        text: "Run: wget https://github.com/dreamfactorysoftware/dreamfactory/raw/master/installers/dfsetup.run",
      },
      {
        name: "Make the installer executable",
        text: "Run: chmod +x dfsetup.run",
      },
      {
        name: "Run the installer",
        text: "Run: sudo ./dfsetup.run and follow the interactive menu to select your installation options.",
      },
      {
        name: "Configure installation options",
        text: "Select options 0, 5, and 8 for a default build with NGINX and MariaDB as the system database.",
      },
      {
        name: "Access DreamFactory",
        text: "Open http://your-server-ip in your browser and complete the setup wizard.",
      },
    ],
  },
  "/getting-started/installing-dreamfactory/windows-installation": {
    name: "Install DreamFactory on Windows",
    description:
      "Install DreamFactory on Windows Server using IIS with PHP and SQL Server support.",
    steps: [
      {
        name: "Install prerequisites",
        text: "Install IIS, PHP 8.1+, and the required PHP extensions on Windows Server.",
      },
      {
        name: "Download DreamFactory",
        text: "Clone or download the DreamFactory repository from GitHub.",
      },
      {
        name: "Configure IIS",
        text: "Set up an IIS site pointing to the DreamFactory public directory with URL rewrite rules.",
      },
      {
        name: "Run Composer install",
        text: "Run: composer install --no-dev in the DreamFactory root directory.",
      },
      {
        name: "Complete setup",
        text: "Open the DreamFactory URL in your browser and complete the setup wizard.",
      },
    ],
  },
  "/getting-started/installing-dreamfactory/helm-installation": {
    name: "Install DreamFactory on Kubernetes with Helm",
    description:
      "Deploy DreamFactory on Kubernetes using the official Helm chart.",
    steps: [
      {
        name: "Install prerequisites",
        text: "Ensure you have kubectl and Helm 3 installed and configured for your cluster.",
      },
      {
        name: "Add the Helm repository",
        text: "Add the DreamFactory Helm chart repository and update.",
      },
      {
        name: "Configure values",
        text: "Create a values.yaml file with your database credentials, storage, and resource limits.",
      },
      {
        name: "Install the chart",
        text: "Run: helm install dreamfactory dreamfactory/dreamfactory -f values.yaml",
      },
      {
        name: "Verify deployment",
        text: "Check pod status with kubectl get pods and access DreamFactory via the configured ingress or service.",
      },
    ],
  },
};

// FAQ schemas for pages with question/answer content.
const faqSchemas: Record<
  string,
  { questions: { question: string; answer: string }[] }
> = {
  "/Security/security-faq": {
    questions: [
      {
        question: "What is the DreamFactory Platform?",
        answer:
          "DreamFactory is an on-premise platform for instantly creating and managing APIs, currently used across the healthcare, finance, telecommunications, banking, government, and manufacturing industries. The platform is designed with security in mind to create APIs that maintain confidentiality of customer data, allow for restricted access based on administrator-defined privilege levels, and provide uninterrupted availability of the data.",
      },
      {
        question:
          "Is DreamFactory certified to be in compliance with security frameworks such as FISMA and HIPAA?",
        answer:
          "The DreamFactory security policy framework is built on the Cloud Security Alliance's (CSA's) Consensus Assessments Initiative Questionnaire (CAIQ v3.0.1) which maps to other commonly utilized compliance frameworks including SOC, COBIT, FedRAMP, HITECH, ISO, and NIST. Our policies are designed in compliance with key privacy regulations such as GDPR, PIPEDA, COPPA, HIPAA and FERPA.",
      },
      {
        question: "How does DreamFactory prevent information compromise?",
        answer:
          "DreamFactory software uses an integrated defense in depth to provide customers configurable tools to secure their information. This includes individually generated access keys for each API, LDAP/Active Directory/SAML-based SSO, role-based access control, rate limiting, logging, and real-time traffic auditing through Elasticsearch, Logstash, and Kibana or Grafana dashboards.",
      },
      {
        question:
          "What is the method for DreamFactory Encryption for data at Rest?",
        answer:
          "DreamFactory does not by default store any API data as it passes through the platform. Some connectors offer an API data caching option which the administrator must explicitly enable. Should caching be enabled, data can be stored in supported caching solutions including Redis and Memcached.",
      },
      {
        question:
          "How does DreamFactory encrypt data in transit?",
        answer:
          "DreamFactory runs atop a standard web server such as Apache or Nginx, both of which support SSL-based communication. Provided HTTPS is enabled, all correspondence between DreamFactory and the respective clients will be encrypted.",
      },
      {
        question:
          "I lost my DreamFactory administrator password. How can I recover it?",
        answer:
          "DreamFactory uses one-way encryption for passwords. If email-based password recovery has not been configured, you can create a new administrator account by logging into the terminal console (php artisan tinker) and resetting the password via the User model.",
      },
    ],
  },
};

function buildHowToJsonLd(
  path: string,
  data: (typeof howToSchemas)[string],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: data.name,
    description: data.description,
    image: "https://docs.dreamfactory.com/img/logo.png",
    url: `https://docs.dreamfactory.com${path}`,
    step: data.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
    tool: {
      "@type": "HowToTool",
      name: "DreamFactory",
    },
  };
}

function buildFaqJsonLd(data: (typeof faqSchemas)[string]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

export default function Root({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  // Normalize path: remove trailing slash for matching
  const normalizedPath = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  // Check for HowTo schema match
  const howTo = howToSchemas[normalizedPath];

  // Check for FAQ schema match
  const faq = faqSchemas[normalizedPath];

  return (
    <>
      {howTo && (
        <Head>
          <script type="application/ld+json">
            {JSON.stringify(buildHowToJsonLd(normalizedPath, howTo))}
          </script>
        </Head>
      )}
      {faq && (
        <Head>
          <script type="application/ld+json">
            {JSON.stringify(buildFaqJsonLd(faq))}
          </script>
        </Head>
      )}
      {children}
    </>
  );
}

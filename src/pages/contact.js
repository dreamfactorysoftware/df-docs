import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./index.module.css";

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <main>
        <section className={styles.features}>
          <header className={clsx("hero hero--primary", styles.heroBanner)}>
            <div className="container">
              <h1 className="hero__title">Talk to an Engineer</h1>
            </div>
          </header>
          <div className="container contact-container" style={{ height: '750px' }}>
              <iframe
                src="https://calendly.com/dreamfactory-platform/dreamfactory-q-a-session-intro?embed_domain=www.dreamfactory.com&amp;embed_type=Inline"
                width="100%"
                height="100%"
                frameborder="0"
                title="Select a Date &amp; Time - Calendly"
                data-lf-form-tracking-inspected-yegkb8lyxyw7ep3z="true"
                data-lf-yt-playback-inspected-yegkb8lyxyw7ep3z="true"
                data-lf-vimeo-playback-inspected-yegkb8lyxyw7ep3z="true"
              ></iframe>
          </div>
        </section>
      </main>
    </Layout>
  );
}

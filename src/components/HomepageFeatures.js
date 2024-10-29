import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Customer Hosted',
    src: require('../../static/img/Server-Stack.gif').default,
    description: (
      <>
        DreamFactory is scalable, stateless, and portable. You can run it on bare metal, in a VM or in a container, but DreamFactory does not have a cloud offering.
      </>
    ),
  },
  {
    title: 'Database & Network API Generation',
    src: require('../../static/img/API.gif').default,
    description: (
      <>
        Integrate natively with over 20 different databases including big data services like Snowflake and Hadoop.
      </>
    ),
  },
  {
    title: 'API Security',
    src: require('../../static/img/Browser.gif').default,
    description: (
      <>
       Security is key. DreamFactory is security forward, so APIs are secured by default with an API Key and limited access. Instantly and easily roll your keys and reissue them as needed.
      </>
    ),
  },
  {
    title: 'API Scripting',
    src: require('../../static/img/Tools.gif').default,
    description: (
      <>
        Supporting four scripting engines (NodeJS, PHP, Python, and V8JS), custom logic can be used to validate input parameters, transform responses to suit client requirements, and even call other APIs.
      </>
    ),
  }
];

function Feature({src, title, description}) {
  return (
    <div className={clsx('col col--3')}>
      <div className="text--center">
        <img src={src} className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

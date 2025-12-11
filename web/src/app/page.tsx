import styles from "./page.module.css";

const pillars = [
  {
    title: "On-device capture",
    description:
      "LiDAR-first workflows with guided AR overlays, Neural Engine quality gates, and encrypted mesh export for privacy by default.",
  },
  {
    title: "Secure reconstruction",
    description:
      "Regional microservices handle SMPL fitting, measurements, and audit logging when device compute limits are reached.",
  },
  {
    title: "Tailor cockpit",
    description:
      "React + Three.js dashboard with slice tools, measurement assistant, and subscription controls for ateliers.",
  },
];

const walkingSkeleton = [
  {
    title: "Instrumentation-ready auth",
    description:
      "Passwordless email sign-in backed by Postgres so every session is attributable for analytics and audit trails.",
  },
  {
    title: "Capture intake API",
    description:
      "Health-checked endpoint for LiDAR uploads with background job stubs that will later call reconstruction workers.",
  },
  {
    title: "Tailor dashboard shell",
    description:
      "Server-rendered project list with empty states, feature flags, and environment-aware config.",
  },
];

const metrics = [
  { label: "Primary aha", value: "LiDAR capture → mesh < 3 min" },
  { label: "Error budget", value: "<0.5% reconstruction failures" },
  { label: "Latency", value: "p95 dashboard < 500 ms" },
  { label: "Retention", value: "55% week-one repeat tailors" },
];

const nextSteps = [
  "Emit PostHog + Sentry events from the capture session API to observe intake reliability.",
  "Mark capture sessions as uploaded once the mobile client confirms the signed PUT succeeds.",
  "Render a Tailor dashboard list view fed by capture session records for pilot ateliers.",
];

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>TailorMode build cockpit</h1>
        <p className={styles.heroCopy}>
          A privacy-first platform that turns LiDAR scans into metrically accurate measurement sets.
          This skeleton keeps the capture app, reconstruction pipeline, and tailor tools aligned as we
          graduate from prototype to private beta.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Architecture pillars</h2>
        <ul className={styles.list}>
          {pillars.map((pillar) => (
            <li key={pillar.title} className={styles.card}>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Walking skeleton focus</h2>
        <p>
          These are the minimum production-quality components that tie the mobile capture workflow to the
          tailor experience while keeping observability and compliance ready from day one.
        </p>
        <ul className={styles.list}>
          {walkingSkeleton.map((item) => (
            <li key={item.title} className={styles.card}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>North-star guardrails</h2>
        <div className={styles.metrics}>
          {metrics.map((metric) => (
            <div key={metric.label} className={styles.metric}>
              <span>{metric.label}</span>
              <span>{metric.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Immediate next steps</h2>
        <ol className={styles.nextSteps}>
          {nextSteps.map((step, index) => (
            <li key={`${index}-${step}`}>{step}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}

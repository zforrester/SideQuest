import type { CSSProperties } from "react";
import styles from "./page.module.scss";

type Swatch = {
  name: string;
  hex: string;
  colorVar: string;
};

const voltSwatches: Swatch[] = [
  { name: "volt-50", hex: "#F3EFFF", colorVar: "--color-volt-50" },
  { name: "volt-100", hex: "#E4DBFF", colorVar: "--color-volt-100" },
  { name: "volt-300", hex: "#A585FF", colorVar: "--color-volt-300" },
  { name: "volt-500 ★", hex: "#5B2BFF", colorVar: "--color-volt-500" },
  { name: "volt-700", hex: "#3A17B3", colorVar: "--color-volt-700" },
  { name: "volt-900", hex: "#1E0D5E", colorVar: "--color-volt-900" },
];

const emberSwatches: Swatch[] = [
  { name: "ember-50", hex: "#FFF4F1", colorVar: "--color-ember-50" },
  { name: "ember-100", hex: "#FFE3DB", colorVar: "--color-ember-100" },
  { name: "ember-300", hex: "#FF9780", colorVar: "--color-ember-300" },
  { name: "ember-500 ★", hex: "#FF5A36", colorVar: "--color-ember-500" },
  { name: "ember-700", hex: "#B33213", colorVar: "--color-ember-700" },
  { name: "ember-900", hex: "#591607", colorVar: "--color-ember-900" },
];

const neutralSwatches: Swatch[] = [
  { name: "neutral-50", hex: "#FAFAF9", colorVar: "--color-neutral-50" },
  { name: "neutral-200", hex: "#E7E5E4", colorVar: "--color-neutral-200" },
  { name: "neutral-400", hex: "#A8A29E", colorVar: "--color-neutral-400" },
  { name: "neutral-600", hex: "#57534E", colorVar: "--color-neutral-600" },
  { name: "neutral-800", hex: "#292524", colorVar: "--color-neutral-800" },
  { name: "neutral-950", hex: "#0C0A09", colorVar: "--color-neutral-950" },
];

const semanticSwatches: Swatch[] = [
  { name: "success", hex: "#12B981", colorVar: "--color-success" },
  { name: "warning", hex: "#F59E0B", colorVar: "--color-warning" },
  { name: "error", hex: "#EF4444", colorVar: "--color-error" },
  { name: "info", hex: "#3B82F6", colorVar: "--color-info" },
];

function swatchStyle(colorVar: string): CSSProperties {
  return { backgroundColor: `var(${colorVar})` };
}

function SwatchGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <>
      {swatches.map((swatch) => (
        <div key={swatch.name} className={styles.swatch}>
          <div className={styles.chip} style={swatchStyle(swatch.colorVar)} />
          <div className={styles.meta}>
            <span className={styles.name}>{swatch.name}</span>
            <span className={styles.hex}>{swatch.hex}</span>
          </div>
        </div>
      ))}
    </>
  );
}

export default function DesignPage() {
  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <div className={styles.version}>v0.1.0</div>
        <div className={styles.eyebrow}>Design System - Preview</div>
        <h1>Pulse.</h1>
        <p>
          A bold and expressive design system for web apps. Electric color,
          confident type, purposeful motion - all wired together by a lean
          token layer.
        </p>
        <div className={styles.featureStrip}>
          <div className={styles.featureItem}>
            <strong>36</strong>color tokens
          </div>
          <div className={styles.featureItem}>
            <strong>11</strong>type sizes
          </div>
          <div className={styles.featureItem}>
            <strong>16</strong>spacing steps
          </div>
          <div className={styles.featureItem}>
            <strong>6</strong>elevations + 2 glows
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.kicker}>01 - Foundations</div>
          <h2>Color</h2>
        </div>

        <div className={styles.rampLabel}>Volt - brand primary</div>
        <div className={`${styles.grid} ${styles.cols6}`}>
          <SwatchGrid swatches={voltSwatches} />
        </div>

        <div className={styles.rampLabel}>Ember - accent</div>
        <div className={`${styles.grid} ${styles.cols6}`}>
          <SwatchGrid swatches={emberSwatches} />
        </div>

        <div className={styles.rampLabel}>Neutral (warm)</div>
        <div className={`${styles.grid} ${styles.cols6}`}>
          <SwatchGrid swatches={neutralSwatches} />
        </div>

        <div className={styles.rampLabel}>Semantic</div>
        <div className={`${styles.grid} ${styles.cols4}`}>
          <SwatchGrid swatches={semanticSwatches} />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.kicker}>02 - Foundations</div>
          <h2>Typography</h2>
        </div>
        <div className={styles.card}>
          <div className={styles.typeRow}>
            <span className={styles.tag}>display / 5xl</span>
            <span className={`${styles.sample} ${styles.display5xl}`}>
              Designed for speed.
            </span>
            <span className={styles.size}>48 / 56</span>
          </div>
          <div className={styles.typeRow}>
            <span className={styles.tag}>display / 3xl</span>
            <span className={`${styles.sample} ${styles.display3xl}`}>
              Section headings.
            </span>
            <span className={styles.size}>30 / 36</span>
          </div>
          <div className={`${styles.typeRow} ${styles.bodyRow}`}>
            <span className={styles.tag}>body / base</span>
            <span className={styles.sample}>
              Default paragraph size for app content.
            </span>
            <span className={styles.size}>16 / 24</span>
          </div>
          <div className={`${styles.typeRow} ${styles.bodyRow}`}>
            <span className={styles.tag}>body / sm</span>
            <span className={styles.sample}>
              Secondary labels, helper text, table cells.
            </span>
            <span className={styles.size}>14 / 20</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.kicker}>03 - Foundations</div>
          <h2>Spacing, radius, elevation</h2>
        </div>
        <div className={`${styles.grid} ${styles.cols3}`}>
          <div className={styles.card}>
            <h4>Spacing</h4>
            <div className={styles.spacingViz}>
              <span className={styles.tag}>space-2</span>
              <div className={styles.bar2} />
            </div>
            <div className={styles.spacingViz}>
              <span className={styles.tag}>space-4</span>
              <div className={styles.bar4} />
            </div>
            <div className={styles.spacingViz}>
              <span className={styles.tag}>space-6</span>
              <div className={styles.bar6} />
            </div>
            <div className={styles.spacingViz}>
              <span className={styles.tag}>space-8</span>
              <div className={styles.bar8} />
            </div>
          </div>
          <div className={styles.card}>
            <h4>Radius</h4>
            <div className={styles.radiusDemo}>
              <div className={`${styles.box} ${styles.radiusSm}`}>sm</div>
              <div className={`${styles.box} ${styles.radiusMd}`}>md</div>
              <div className={`${styles.box} ${styles.radiusLg}`}>lg</div>
              <div className={`${styles.box} ${styles.radiusXl}`}>xl</div>
            </div>
          </div>
          <div className={styles.card}>
            <h4>Elevation</h4>
            <div className={styles.vrow}>
              <div className={styles.shadowDemo}>
                <div className={`${styles.shadowBox} ${styles.shadowSm}`} />
                shadow-sm
              </div>
              <div className={styles.shadowDemo}>
                <div className={`${styles.shadowBox} ${styles.shadowMd}`} />
                shadow-md
              </div>
              <div className={styles.shadowDemo}>
                <div className={`${styles.shadowBox} ${styles.shadowGlow}`} />
                shadow-glow-volt
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.kicker}>04 - Components</div>
          <h2>Buttons</h2>
        </div>
        <div className={styles.card}>
          <div className={styles.row}>
            <button className={`${styles.btn} ${styles.btnPrimary}`}>Ship it</button>
            <button className={`${styles.btn} ${styles.btnSecondary}`}>Secondary</button>
            <button className={`${styles.btn} ${styles.btnGhost}`}>Ghost</button>
            <button className={`${styles.btn} ${styles.btnDestructive}`}>
              Destructive
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Inputs and fields</h2>
        </div>
        <div className={styles.card}>
          <div className={`${styles.grid} ${styles.cols3}`}>
            <div className={styles.field}>
              <label>Email</label>
              <input className={styles.input} placeholder="you@company.com" />
              <span className={styles.helper}>
                We&apos;ll only email you about your account.
              </span>
            </div>
            <div className={styles.field}>
              <label>Workspace name</label>
              <input className={styles.input} defaultValue="Acme Robotics" />
              <span className={styles.helper}>3-30 characters.</span>
            </div>
            <div className={`${styles.field} ${styles.fieldError}`}>
              <label>Password</label>
              <input
                className={styles.input}
                type="password"
                defaultValue="abc"
              />
              <span className={styles.helper}>Must be at least 8 characters.</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Cards, badges, avatars</h2>
        </div>
        <div className={`${styles.grid} ${styles.cols3}`}>
          <div className={styles.demoCard}>
            <h4>Revenue</h4>
            <p>Monthly recurring revenue across all workspaces.</p>
            <div className={styles.statRow}>
              <div className={styles.statValue}>$84,210</div>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                <span className={styles.dot} />
                +12%
              </span>
            </div>
          </div>
          <div className={styles.demoCard}>
            <h4>Team</h4>
            <p>Invite members to your workspace.</p>
            <div className={styles.avatarGroup}>
              <div className={styles.avatar}>JL</div>
              <div className={`${styles.avatar} ${styles.avatarEmber}`}>SM</div>
              <div className={`${styles.avatar} ${styles.avatarMint}`}>RP</div>
              <div className={`${styles.avatar} ${styles.avatarNeutral}`}>+4</div>
            </div>
          </div>
          <div className={styles.demoCard}>
            <h4>Badges</h4>
            <p>Every variant, at a glance.</p>
            <div className={styles.row}>
              <span className={`${styles.badge} ${styles.badgeSolidVolt}`}>New</span>
              <span className={`${styles.badge} ${styles.badgeSoftVolt}`}>Beta</span>
              <span className={`${styles.badge} ${styles.badgeOutline}`}>Draft</span>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                <span className={styles.dot} />
                Live
              </span>
              <span className={`${styles.badge} ${styles.badgeWarning}`}>Review</span>
              <span className={`${styles.badge} ${styles.badgeError}`}>Failed</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Toasts and tabs</h2>
        </div>
        <div className={`${styles.grid} ${styles.cols2}`}>
          <div className={styles.vrow}>
            <div className={`${styles.toast} ${styles.toastSuccess}`}>
              <div className={styles.icon}>✓</div>
              <div>
                <div className={styles.title}>Deploy succeeded</div>
                <div className={styles.desc}>v1.24 is live in production.</div>
              </div>
            </div>
            <div className={`${styles.toast} ${styles.toastWarning}`}>
              <div className={styles.icon}>!</div>
              <div>
                <div className={styles.title}>Billing in 3 days</div>
                <div className={styles.desc}>Your next invoice is $84.</div>
              </div>
            </div>
            <div className={`${styles.toast} ${styles.toastError}`}>
              <div className={styles.icon}>x</div>
              <div>
                <div className={styles.title}>Build failed</div>
                <div className={styles.desc}>12 type errors in src/api/user.ts.</div>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${styles.tabActive}`}>Overview</button>
              <button className={styles.tab}>Activity</button>
              <button className={styles.tab}>Settings</button>
              <button className={styles.tab}>Billing</button>
            </div>
            <p className={styles.tabBody}>
              Tab content lives here. Selected tab uses text-brand with a 2px
              underline in volt-500.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Table</h2>
        </div>
        <table className={styles.data}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Plan</th>
              <th>MRR</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Orbital Mechanics</td>
              <td>Enterprise</td>
              <td>$2,400</td>
              <td>
                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                  <span className={styles.dot} />
                  Active
                </span>
              </td>
            </tr>
            <tr>
              <td>Northlight Studio</td>
              <td>Team</td>
              <td>$480</td>
              <td>
                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                  <span className={styles.dot} />
                  Active
                </span>
              </td>
            </tr>
            <tr>
              <td>Delta Labs</td>
              <td>Team</td>
              <td>$320</td>
              <td>
                <span className={`${styles.badge} ${styles.badgeWarning}`}>
                  Past due
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Modal</h2>
        </div>
        <div className={styles.modalPreview}>
          <h4>Delete this workspace?</h4>
          <p>
            This permanently removes the workspace, its members, and all project
            data. This action cannot be undone.
          </p>
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnGhost}`}>Cancel</button>
            <button className={`${styles.btn} ${styles.btnDestructive}`}>
              Delete workspace
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

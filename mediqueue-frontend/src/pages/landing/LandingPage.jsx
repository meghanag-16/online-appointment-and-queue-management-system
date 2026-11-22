import Icon from '../../components/ui/Icon'
import SiteHeader from '../../components/layout/SiteHeader'
import SiteFooter from '../../components/layout/SiteFooter'
import { SITE } from '../../config/site'
import './landing.css'

const TRUST = [
  { icon: 'clock', label: 'Live wait updates' },
  { icon: 'shield', label: 'Private, secure records' },
  { icon: 'building', label: 'Five specialist departments' },
]

const SERVICES = [
  {
    icon: 'calendar',
    tone: 'accent',
    title: 'Appointments on your terms',
    text: 'Choose your doctor and a time that suits you, from home and at any hour. No phone queues, no front-desk scramble.',
  },
  {
    icon: 'clock',
    tone: 'info',
    title: 'Know when it is your turn',
    text: 'Follow your place in line as it moves, so you can arrive when you are needed instead of waiting around.',
  },
  {
    icon: 'file',
    tone: 'purple',
    title: 'Your health, in one place',
    text: 'Prescriptions, lab results and past visits stay together, ready whenever you or your doctor need them.',
  },
  {
    icon: 'bell',
    tone: 'success',
    title: 'Reminders that keep you on track',
    text: 'A gentle nudge before every visit, and a note the moment your results or prescription are ready.',
  },
]

const VISIT_POINTS = [
  'Clear, upfront charges for every visit',
  'Prescriptions you can read, keep and refer back to',
  'Lab reports you can download whenever you like',
  'A direct line to raise a concern and hear back',
]

const DEPARTMENTS = [
  {
    icon: 'heart',
    name: 'Cardiology',
    text: 'Heart health checks, blood pressure care and long-term support for cardiac conditions.',
  },
  {
    icon: 'bone',
    name: 'Orthopedics',
    text: 'Treatment for joint pain, fractures, sports injuries and conditions of the spine.',
  },
  {
    icon: 'baby',
    name: 'Pediatrics',
    text: 'Gentle, attentive care for infants, children and teenagers as they grow.',
  },
  {
    icon: 'stethoscope',
    name: 'General Medicine',
    text: 'Your first stop for everyday illness, routine check-ups and ongoing health concerns.',
  },
  {
    icon: 'sparkle',
    name: 'Dermatology',
    text: 'Expert help for skin, hair and nail conditions, from allergies to chronic care.',
  },
]

const AUDIENCES = [
  {
    title: 'For doctors',
    lead: 'More time with patients, less time chasing paperwork.',
    points: ['A clear view of the day ahead', 'Patient history at a glance', 'Digital prescriptions in moments'],
  },
  {
    title: 'For patients',
    lead: 'Care that respects your time and keeps you informed.',
    points: [
      'Book, move or cancel visits yourself',
      'See your turn approach in real time',
      'Reports, bills and prescriptions together',
      'Reminders before every appointment',
    ],
    featured: true,
  },
  {
    title: 'For hospital teams',
    lead: 'A calmer front desk, lab and administration.',
    points: [
      'Fast bookings for walk-in patients',
      'Urgent cases seen first',
      'Reports shared the moment they are ready',
    ],
  },
]

const BEFORE_VISIT = [
  { icon: 'file', text: 'A photo ID and any earlier prescriptions' },
  { icon: 'flask', text: 'Recent test results or scans, if you have them' },
  { icon: 'clock', text: 'Arrive 10 minutes before your time' },
  { icon: 'calendar', text: 'Plans changed? Reschedule up to 2 hours before' },
]

/** Public landing page: who MediQueue is for and what it makes better. */
export default function LandingPage() {
  return (
    <div className="landing">
      <SiteHeader showAccount onLanding />

      <main>
        <section className="lp-hero" aria-labelledby="hero-title">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <h1 id="hero-title">
                Better hospital visits start with <span className="text-accent">less waiting.</span>
              </h1>
              <p className="lp-lead">
                See the right specialist at a time that suits you, know exactly when you will be called, and keep every
                prescription, report and bill close at hand. Your energy should go into getting better, not standing in
                line.
              </p>
              <ul className="lp-trust" aria-label="Highlights">
                {TRUST.map(t => (
                  <li key={t.label}>
                    <Icon name={t.icon} size={18} />
                    {t.label}
                  </li>
                ))}
              </ul>
            </div>

            <figure className="lp-hero-photo">
              <img
                src="/images/hero.jpg"
                alt="A doctor going over notes with a smiling patient"
                width="1400"
                height="933"
              />
              <figcaption className="lp-photo-chip">
                <span className="lp-chip-dot" aria-hidden="true" />
                <span>
                  <span className="block strong text-sm">Open for appointments</span>
                  <span className="block text-xs muted">{SITE.hours}</span>
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="services" className="lp-section lp-tinted" aria-labelledby="services-title">
          <div className="lp-container">
            <h2 id="services-title" className="lp-heading">
              Care that fits around your day
            </h2>
            <p className="lp-subheading">
              Everything that used to mean phone calls, paper slips and long waits, handled simply and in one place.
            </p>
            <div className="lp-services">
              {SERVICES.map(s => (
                <article key={s.title} className="lp-service">
                  <span className={`lp-icon-tile tone-${s.tone}`}>
                    <Icon name={s.icon} size={22} />
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="your-visit" className="lp-section" aria-labelledby="visit-title">
          <div className="lp-container lp-split">
            <div className="lp-split-art">
              <img
                className="lp-visit-photo"
                src="/images/visit.jpg"
                alt="A doctor smiling as she talks a patient through his results"
                width="1400"
                height="933"
                loading="lazy"
              />
              <aside className="lp-prep" aria-labelledby="prep-title">
                <h3 id="prep-title">Before your visit</h3>
                <ul>
                  {BEFORE_VISIT.map(b => (
                    <li key={b.text}>
                      <span className="lp-prep-icon">
                        <Icon name={b.icon} size={16} />
                      </span>
                      {b.text}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>

            <div className="lp-split-copy">
              <h2 id="visit-title" className="lp-heading lp-left">
                A calmer visit, from booking to recovery
              </h2>
              <p className="lp-subheading lp-left">
                A hospital visit is more than the few minutes with your doctor. We look after the moments before and
                after too, so nothing gets lost and you always know what comes next.
              </p>
              <ul className="lp-checklist">
                {VISIT_POINTS.map(p => (
                  <li key={p}>
                    <span className="lp-check">
                      <Icon name="check" size={14} strokeWidth={2.6} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="departments" className="lp-section" aria-labelledby="departments-title">
          <div className="lp-container">
            <h2 id="departments-title" className="lp-heading">
              Specialists under one roof
            </h2>
            <p className="lp-subheading">
              Experienced doctors across five departments, so the care you need is never far away.
            </p>
            <div className="lp-departments">
              {DEPARTMENTS.map(d => (
                <article key={d.name} className="lp-department">
                  <span className="lp-dept-icon">
                    <Icon name={d.icon} size={26} />
                  </span>
                  <h3>{d.name}</h3>
                  <p>{d.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-tinted" aria-labelledby="audience-title">
          <div className="lp-container">
            <h2 id="audience-title" className="lp-heading">
              Made for everyone in the building
            </h2>
            <p className="lp-subheading">
              When patients, doctors and staff share the same picture, the whole day runs more smoothly.
            </p>
            <div className="lp-audiences">
              {AUDIENCES.map(a => (
                <article key={a.title} className={`lp-audience ${a.featured ? 'is-featured' : ''}`.trim()}>
                  <h3>{a.title}</h3>
                  <p className="lp-audience-lead">{a.lead}</p>
                  <ul>
                    {a.points.map(p => (
                      <li key={p}>
                        <Icon name="check-circle" size={18} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

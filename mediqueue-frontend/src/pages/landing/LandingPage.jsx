import { Link } from 'react-router-dom'
import './landing.css'

const FEATURES = [
  {
    icon: '🗓️',
    title: 'Book in a minute',
    text: 'Find a doctor by department, name or day, pick an open slot, done. A taken slot suggests the nearest free ones.',
  },
  {
    icon: '⏱️',
    title: 'A live queue',
    text: 'Every booking joins the doctor’s queue for the day. High-priority patients move up and screens update on their own.',
  },
  {
    icon: '💊',
    title: 'Prescriptions & records',
    text: 'Doctors see the history of their own patients and issue digital prescriptions that land in the patient’s record.',
  },
  {
    icon: '🧪',
    title: 'Lab reports',
    text: 'The lab uploads PDF or image reports; the patient is notified and downloads them from their portal.',
  },
  {
    icon: '🧾',
    title: 'Fair billing',
    text: 'Bills are created at booking: standard, follow-up or emergency rates, voided or refunded if the visit is cancelled.',
  },
  {
    icon: '🔔',
    title: 'Notifications',
    text: 'Reminders before the visit, plus alerts when a report or prescription is ready or a complaint is answered.',
  },
]

const ROLES = [
  ['Patients', 'Book, cancel or reschedule, and keep prescriptions, reports and bills in one place.'],
  ['Doctors', 'Run the day’s queue: call next, start, finish, and prescribe.'],
  ['Front desk', 'Book for walk-ins, mark urgent cases high priority and collect payments.'],
  ['Lab', 'Find the appointment and attach the report in seconds.'],
  ['Administrators', 'Manage staff, departments and schedules, review complaints and the audit log.'],
]

const QUEUE = [
  { pos: 1, name: 'Ananya R.', time: '09:30', tag: 'In consultation', tone: 'purple' },
  { pos: 2, name: 'Karan M.', time: '10:00', tag: 'High priority', tone: 'accent' },
  { pos: 3, name: 'Priya S.', time: '09:45', tag: 'Waiting', tone: 'info' },
  { pos: 4, name: 'Rahul T.', time: '10:15', tag: 'Waiting', tone: 'info' },
]

/** Public landing page: what MediQueue does, with a CSS-only 3D illustration of a live queue. */
export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-brand">
          <span className="brand-mark" aria-hidden="true">
            M
          </span>
          MediQueue
        </span>
        <nav className="row" aria-label="Account">
          <Link to="/login" className="btn btn-ghost">
            Sign in
          </Link>
          <Link to="/register" className="btn btn-primary">
            Register
          </Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Online appointments & queue management</p>
            <h1>
              Less waiting room.
              <br />
              <span className="text-accent">More care.</span>
            </h1>
            <p className="landing-lead">
              MediQueue books doctor appointments, runs a live queue for every doctor and keeps prescriptions, lab
              reports, bills and complaints in one place, for patients, doctors, the front desk, the lab and
              administrators.
            </p>
            <div className="row">
              <Link to="/register" className="btn btn-primary btn-lg" data-testid="landing-register">
                Book an appointment
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg" data-testid="landing-login">
                Staff sign in
              </Link>
            </div>
          </div>

          <div className="scene" aria-hidden="true">
            <div className="scene-stage">
              <div className="panel panel-back">
                <p className="panel-label">Today</p>
                <p className="panel-big">24</p>
                <p className="panel-sub">appointments</p>
              </div>
              <div className="panel panel-main">
                <div className="panel-head">
                  <span className="strong">Dr. Mehta · Cardiology</span>
                  <span className="live-dot">Live</span>
                </div>
                {QUEUE.map(q => (
                  <div key={q.pos} className="queue-line">
                    <span className="queue-pos">{q.pos}</span>
                    <span className="queue-name">{q.name}</span>
                    <span className="queue-time">{q.time}</span>
                    <span className={`badge badge-${q.tone}`}>{q.tag}</span>
                  </div>
                ))}
              </div>
              <div className="panel panel-float">
                <p className="panel-label">🔔 Report ready</p>
                <p className="panel-sub">Lipid profile is ready to download</p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="features-title">
          <h2 id="features-title">Everything a clinic visit needs</h2>
          <div className="landing-grid">
            {FEATURES.map(f => (
              <article key={f.title} className="card feature-card">
                <span className="feature-icon" aria-hidden="true">
                  {f.icon}
                </span>
                <h3>{f.title}</h3>
                <p className="muted text-sm">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-steps" aria-labelledby="steps-title">
          <h2 id="steps-title">How a visit works</h2>
          <ol className="steps">
            <li>
              <strong>Book</strong>
              <span>Pick a doctor and an open time.</span>
            </li>
            <li>
              <strong>Queue</strong>
              <span>Arrive and follow your place in the live queue.</span>
            </li>
            <li>
              <strong>Consult</strong>
              <span>Your doctor sees your history and prescribes.</span>
            </li>
            <li>
              <strong>Follow up</strong>
              <span>Reports, bills and reminders arrive in your portal.</span>
            </li>
          </ol>
        </section>

        <section className="landing-section" aria-labelledby="roles-title">
          <h2 id="roles-title">One system, five roles</h2>
          <div className="landing-grid">
            {ROLES.map(([title, text]) => (
              <article key={title} className="card role-card">
                <h3>{title}</h3>
                <p className="muted text-sm">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <h2>Ready for your next visit?</h2>
          <p>Create a patient account and book in under a minute.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create patient account
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <span>MediQueue — online appointment and queue management</span>
        <Link to="/login">Sign in</Link>
      </footer>
    </div>
  )
}

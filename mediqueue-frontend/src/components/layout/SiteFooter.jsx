import { SITE } from '../../config/site'
import Icon from '../ui/Icon'
import Brand from './Brand'

const telHref = `tel:${SITE.phone.replace(/[^+\d]/g, '')}`

/**
 * Footer on every page: contact details, visiting hours and social links.
 * `compact` drops the large "get in touch" band (used inside the signed-in app).
 */
export default function SiteFooter({ compact = false }) {
  const year = new Date().getFullYear()
  return (
    <footer className={`site-footer ${compact ? 'is-compact' : ''}`.trim()} id="contact">
      <div className="site-footer-inner">
        {!compact && (
          <div className="footer-band">
            <div>
              <h2>We&apos;re here to help</h2>
              <p>Questions about an appointment, a bill or a report? Our help desk will point you the right way.</p>
            </div>
            <div className="footer-band-actions">
              <a className="footer-chip" href={telHref}>
                <Icon name="phone" size={18} />
                {SITE.phone}
              </a>
              <a className="footer-chip" href={`mailto:${SITE.email}`}>
                <Icon name="mail" size={18} />
                {SITE.email}
              </a>
            </div>
          </div>
        )}

        <div className="footer-grid">
          <div className="footer-about">
            <Brand inverted to={null} />
            <p>{SITE.tagline}</p>
          </div>

          <div>
            <h3 className="footer-title">Contact us</h3>
            <ul className="footer-list">
              <li>
                <Icon name="phone" size={16} />
                <a href={telHref}>{SITE.phone}</a>
              </li>
              <li>
                <Icon name="mail" size={16} />
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
              <li>
                <Icon name="pin" size={16} />
                <span>{SITE.address}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="footer-title">Visiting hours</h3>
            <ul className="footer-list">
              <li>
                <Icon name="clock" size={16} />
                <span>{SITE.hours}</span>
              </li>
              <li>
                <Icon name="heart" size={16} />
                <span>For emergencies, go straight to the nearest casualty ward.</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="footer-title">Follow us</h3>
            <ul className="footer-list">
              {SITE.social.map(s => (
                <li key={s.name}>
                  <Icon name={s.icon} size={16} />
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            &copy; {year} {SITE.name}. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}

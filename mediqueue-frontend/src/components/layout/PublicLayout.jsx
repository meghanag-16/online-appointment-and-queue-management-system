import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

/** Header + page + footer for pages outside the signed-in app (sign in, register, 404 ...). */
export default function PublicLayout({ children, showSections = true, compactFooter = false, centered = false }) {
  return (
    <div className="public-shell">
      <SiteHeader showSections={showSections} />
      <main className={`public-main ${centered ? 'is-centered' : ''}`.trim()}>{children}</main>
      <SiteFooter compact={compactFooter} />
    </div>
  )
}

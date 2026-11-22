import Sidebar from './Sidebar'
import Navbar from './Navbar'
import SiteFooter from './SiteFooter'
import AccessDeniedBanner from '../common/AccessDeniedBanner'

/**
 * Signed-in page: fixed header, then the menu and the page side by side, then a full-width footer.
 * The menu sticks below the header while the page scrolls and is pushed up when the footer arrives.
 */
export default function PageLayout({ children }) {
  return (
    <div className="page-layout">
      <Navbar />
      <div className="page-body">
        <Sidebar />
        <main className="page-content animate-in">
          <AccessDeniedBanner />
          {children}
        </main>
      </div>
      <SiteFooter compact />
    </div>
  )
}

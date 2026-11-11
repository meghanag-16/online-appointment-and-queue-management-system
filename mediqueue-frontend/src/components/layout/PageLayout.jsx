import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AccessDeniedBanner from '../common/AccessDeniedBanner'

export default function PageLayout({ children }) {
  return (
    <div className="page-layout">
      <Sidebar />
      <Navbar />
      <main className="page-content animate-in">
        <AccessDeniedBanner />
        {children}
      </main>
    </div>
  )
}

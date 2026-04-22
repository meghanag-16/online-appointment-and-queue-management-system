import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function PageLayout({ children }) {
  return (
    <div className="page-layout">
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1 }}>
        <Navbar />
        <main style={{
          paddingTop: 'calc(var(--navbar-h) + 32px)',
          padding: 'calc(var(--navbar-h) + 32px) 36px 48px',
          minHeight: '100vh',
        }} className="animate-in">
          {children}
        </main>
      </div>
    </div>
  )
}

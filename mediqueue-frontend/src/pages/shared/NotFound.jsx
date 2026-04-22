import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,background:'var(--color-bg)'}}>
      <div style={{fontSize:'6rem',fontFamily:'var(--font-display)',color:'var(--color-accent)',lineHeight:1}}>404</div>
      <h1 style={{fontFamily:'var(--font-display)',fontSize:'1.6rem',color:'var(--color-dark)',fontWeight:400}}>Page not found</h1>
      <p style={{color:'var(--color-text-muted)'}}>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  )
}

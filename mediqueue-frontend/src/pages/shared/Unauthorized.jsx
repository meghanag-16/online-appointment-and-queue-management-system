import { Link } from 'react-router-dom'
export default function Unauthorized() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,background:'var(--color-bg)'}}>
      <div style={{fontSize:'5rem',lineHeight:1}}>🔒</div>
      <h1 style={{fontFamily:'var(--font-display)',fontSize:'1.6rem',color:'var(--color-dark)',fontWeight:400}}>Access Denied</h1>
      <p style={{color:'var(--color-text-muted)'}}>You don't have permission to view this page.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  )
}

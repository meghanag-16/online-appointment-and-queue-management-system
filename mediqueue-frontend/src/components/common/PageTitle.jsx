export default function PageTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: '1.8rem',
        color: 'var(--color-dark)', fontWeight: 400,
      }}>{title}</h1>
      {subtitle && (
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: '0.9rem' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

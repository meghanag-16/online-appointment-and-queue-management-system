export default function Spinner({ size = 32 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
      <div
        data-testid="spinner"
        style={{
          width: `${size}px`, height: `${size}px`, borderRadius: '50%',
          border: `3px solid var(--color-border)`,
          borderTopColor: 'var(--color-accent)',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  )
}

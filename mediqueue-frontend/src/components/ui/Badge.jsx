/** A small coloured label. tone: neutral | success | warning | danger | info | accent | purple. */
export default function Badge({ tone = 'neutral', children, ...rest }) {
  return (
    <span className={tone === 'neutral' ? 'badge' : `badge badge-${tone}`} {...rest}>
      {children}
    </span>
  )
}

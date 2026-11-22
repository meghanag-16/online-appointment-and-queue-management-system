/**
 * Line icons drawn as inline SVG (24 x 24 grid, stroke = currentColor), used instead of emoji so
 * they follow the text colour and look the same on every device.
 */
const PATHS = {
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  pill: (
    <>
      <rect x="2.6" y="8.2" width="18.8" height="7.6" rx="3.8" transform="rotate(-45 12 12)" />
      <path d="M8.6 8.6l6.8 6.8" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6.2L4.6 18.4A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.6-2.6L14 9.2V3" />
      <path d="M7.2 15h9.6" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3h14v18l-2.3-1.5L14.3 21 12 19.5 9.7 21l-2.4-1.5L5 21z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  'bell-off': (
    <>
      <path d="M8.2 5.6A6 6 0 0 1 18 11v4M6 11v5l-1.5 2H17M10 20.5a2 2 0 0 0 4 0" />
      <path d="M3 3l18 18" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13l2.5-8h13L21 13v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19z" />
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.3l2.7 2.7L16 9.5" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V21M2.5 21h19" />
      <path d="M12 7.5v5M9.5 10h5M10 21v-4h4v4" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5 3v5a5 5 0 0 0 10 0V3" />
      <path d="M10 13v2.5a4.5 4.5 0 0 0 9 0V13" />
      <circle cx="19" cy="11" r="2" />
    </>
  ),
  message: <path d="M4 5h16v11H9l-5 4z" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8.5L19 7.5V21H6z" />
      <path d="M14 3v5h5M9 13h7M9 17h5" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />,
  pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />,
  bone: (
    <path d="M8.5 6.5a2.5 2.5 0 1 0-3.5 3.5 2.5 2.5 0 1 0 3.5 3.5l6.5 6.5a2.5 2.5 0 1 0 3.5-3.5 2.5 2.5 0 1 0-3.5-3.5z" />
  ),
  baby: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10.5h.01M15 10.5h.01M9.5 15a3.5 3.5 0 0 0 5 0" />
    </>
  ),
  sparkle: <path d="M12 3l2 6.5L20.5 12 14 14l-2 7-2-7-6.5-2L10 9.5z" />,
  phone: (
    <path d="M5 3.5h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.6 6.6l1.4-2.3 4.5 1.8V19a1.5 1.5 0 0 1-1.5 1.5A16.5 16.5 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6l8.5 7 8.5-7" />
    </>
  ),
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2.5H7.5v4H10V21h4v-6.5h3l.5-4H14V8.5a.5.5 0 0 1 .5-.5z" />,
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.2 6.8h.01" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M8 10.5V16M8 7.8v.01M11.5 16v-5.5M11.5 13a2.5 2.5 0 0 1 5 0v3" />
    </>
  ),
  x: <path d="M4.5 4h4l11 16h-4zM19.5 4l-6.3 7.2M4.5 20l6.3-7.2" />,
}

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = '', title, ...rest }) {
  const shape = PATHS[name]
  if (!shape) return null
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title && <title>{title}</title>}
      {shape}
    </svg>
  )
}

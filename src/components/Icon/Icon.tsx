import type { ReactElement, SVGProps } from 'react'

export type IconName =
  | 'search'
  | 'pin'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-left'
  | 'arrow-right'
  | 'user'
  | 'calendar'
  | 'clock'
  | 'heart'
  | 'check-circle'
  | 'lock'
  | 'ticket'
  | 'wallet'
  | 'pencil'
  | 'trash'
  | 'upload-cloud'
  | 'link'
  | 'copy'
  | 'mail'
  | 'instagram'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'whatsapp'

type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName
}

// Ícones de traço (viewBox 24x24) herdam a cor via currentColor.
const strokeIcons: Partial<Record<IconName, ReactElement>> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'arrow-left': <path d="M20 12H4m6-6-6 6 6 6" />,
  'arrow-right': <path d="M4 12h16m-6-6 6 6-6 6" />,
  user: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3.2" />
      <path d="M5.8 18.5a7 7 0 0 1 12.4 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4m8-4v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  heart: (
    <path d="M12 20.5S3.5 15 3.5 9a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2c0 6-8.5 11.5-8.5 11.5z" />
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.8 2.8 5.4-5.5" />
    </>
  ),
  lock: (
    <>
      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
      <path d="M5 10h14v11H5z" />
      <path d="M12 14v3" />
      <path d="m16 18 1.5 1.5L21 16" />
    </>
  ),
  ticket: (
    <path d="M3 7h18v3.5a1.5 1.5 0 0 0 0 3V17H3v-3.5a1.5 1.5 0 0 0 0-3z" />
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z" />
      <circle cx="16" cy="14" r="1" />
    </>
  ),
  pencil: <path d="m4 20 1-4L16.5 4.5a2 2 0 0 1 3 3L8 19zM14.5 6.5l3 3" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
      <path d="M10 11v6m4-6v6" />
    </>
  ),
  'upload-cloud': (
    <>
      <path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.8 3.8 0 0 1 17.5 18" />
      <path d="M12 21v-8m-3.5 3.5L12 13l3.5 3.5" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="13" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h3" />
    </>
  ),
  mail: (
    <>
      <path d="M3.5 5.5h17v13h-17z" />
      <path d="m4 6 8 7 8-7" />
    </>
  ),
}

// Logos de redes sociais (preenchidos).
const fillIcons: Partial<Record<IconName, ReactElement>> = {
  instagram: (
    <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.3-3.8a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
  ),
  facebook: (
    <path d="M12 2a10 10 0 0 0-1.6 19.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 12 2z" />
  ),
  x: (
    <path d="M17.8 3h3l-6.5 7.5L22 21h-6l-4.7-6.1L5.9 21h-3l7-8L2.5 3h6.1l4.2 5.6zm-1 16.2h1.7L7.7 4.7H5.9z" />
  ),
  linkedin: (
    <path d="M4.5 3A2 2 0 1 1 4.5 7 2 2 0 0 1 4.5 3zM3 9h3v12H3zm6 0h2.9v1.7c.5-.9 1.7-2 3.6-2 3.5 0 4.2 2.3 4.2 5.3V21h-3v-6c0-1.5 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V21H9z" />
  ),
  whatsapp: (
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.3 15.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 0 1 12 3.8zM8.7 7.4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.7.5-.1 1.5-.6 1.700-1.200.2-.6.2-1.1.2-1.2l-.3-.2-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.3-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.3 0-.4.1-.5l.4-.5.3-.4c.1-.2 0-.3 0-.4L10 8c-.2-.5-.4-.6-.6-.6z" />
  ),
}

function Icon({ name, ...props }: IconProps) {
  const filled = name in fillIcons

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {filled ? fillIcons[name] : strokeIcons[name]}
    </svg>
  )
}

export default Icon

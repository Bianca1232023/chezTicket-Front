import { useId } from 'react'
import './EventSocialIcon.scss'

export type SocialNetwork = 'instagram' | 'facebook' | 'x' | 'linkedin'

type EventSocialIconProps = {
  network: SocialNetwork
  className?: string
}

// Cores de marca de terceiros (Instagram, Facebook, X, LinkedIn).
function EventSocialIcon({ network, className }: EventSocialIconProps) {
  const gradientId = useId()
  const classes = [
    'event-social-icon',
    `event-social-icon--${network}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      className={classes}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      {network === 'instagram' && (
        <>
          <defs>
            <radialGradient
              id={gradientId}
              cx="0.3"
              cy="1.05"
              r="1.2"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0" stopColor="#FFD600" />
              <stop offset="0.25" stopColor="#FF7A00" />
              <stop offset="0.55" stopColor="#FF0069" />
              <stop offset="1" stopColor="#7638FA" />
            </radialGradient>
          </defs>
          <rect width="48" height="48" rx="11" fill={`url(#${gradientId})`} />
          <rect
            x="10"
            y="10"
            width="28"
            height="28"
            rx="8.5"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
          />
          <circle
            cx="24"
            cy="24"
            r="6.8"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
          />
          <circle cx="31.6" cy="16.4" r="1.9" fill="#fff" />
        </>
      )}
      {network === 'facebook' && (
        <>
          <rect width="48" height="48" fill="#1877F2" />
          <path
            d="M26 48V29h6.400l1-7.500H26v-4.800c0-2.200.6-3.600 3.700-3.600h3.900V6.400C33 6.300 30.800 6.200 28.300 6.200 22.800 6.200 19 9.500 19 15.600v5.900h-6.400V29H19v19z"
            fill="#fff"
          />
        </>
      )}
      {network === 'x' && (
        <>
          <rect width="48" height="48" rx="8" fill="#000" />
          <path
            transform="translate(9 9) scale(1.25)"
            d="M17.800 3h3l-6.500 7.500L22 21h-6l-4.700-6.100L5.900 21h-3l7-8L2.500 3h6.100l4.200 5.600zm-1 16.200h1.700L7.700 4.700H5.900z"
            fill="#fff"
          />
        </>
      )}
      {network === 'linkedin' && (
        <>
          <rect width="48" height="48" rx="4" fill="#0A66C2" />
          <path
            d="M9 18.500h6.500V39H9zM12.300 8.500a3.800 3.800 0 1 1 0 7.600 3.800 3.800 0 0 1 0-7.600zM19.800 18.500h6.200v2.800h.1c.9-1.700 3-3.400 6.200-3.400 6.600 0 7.800 4.300 7.800 10V39h-6.500v-9.600c0-2.300 0-5.200-3.200-5.200s-3.700 2.500-3.700 5V39h-6.500z"
            fill="#fff"
          />
        </>
      )}
    </svg>
  )
}

export default EventSocialIcon

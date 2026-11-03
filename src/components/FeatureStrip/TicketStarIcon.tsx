import type { SVGProps } from 'react'

function TicketStarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 24" aria-hidden="true" focusable="false" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M0 0h40v8.500a3.500 3.500 0 0 0 0 7V24H0v-8.500a3.500 3.500 0 0 0 0-7zm20 5.500 1.900 4.200 4.600.4-3.500 3 1.100 4.500L20 15.200l-4.100 2.400 1.100-4.500-3.500-3 4.600-.4z"
      />
    </svg>
  )
}

export default TicketStarIcon

import type { ReactNode, SVGProps } from 'react'

export type CategoryIconName = 'layers' | 'people' | 'bulb' | 'robot' | 'hacker'

const strokeIcons: Record<Exclude<CategoryIconName, 'hacker'>, ReactNode> = {
  layers: (
    <>
      <rect x="3.5" y="3.5" width="17" height="4.5" rx="1.5" />
      <rect x="3.5" y="9.75" width="17" height="4.5" rx="1.5" />
      <rect x="3.5" y="16" width="17" height="4.5" rx="1.5" />
      <path d="M7 5.75h1.5M7 12h1.5M7 18.25h1.5" />
    </>
  ),
  people: (
    <>
      <circle cx="12" cy="6.5" r="3" />
      <path d="M6.5 15.5a5.5 5.5 0 0 1 11 0v1.5h-11z" />
      <circle cx="4.8" cy="10.5" r="2.2" />
      <path d="M1.5 18.5v-1.2a3.3 3.3 0 0 1 3.3-3.3" />
      <circle cx="19.2" cy="10.5" r="2.2" />
      <path d="M22.5 18.5v-1.2a3.3 3.3 0 0 0-3.3-3.3" />
      <path d="M8 20.5h8" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 17.5h6M10 20.5h4" />
      <path d="M8.5 14.5C6.8 13.3 6 11.6 6 9.7a6 6 0 0 1 12 0c0 1.9-.8 3.6-2.500 4.800-.6.500-1 1.200-1 2H9.500c0-.8-.4-1.500-1-2z" />
      <path d="M12 9.500v3M10.500 12.500h3" />
      <path d="M12 1.500v1M3.500 5l.8.6M20.500 5l-.8.6M1.500 10h1.200M21.300 10h1.200" />
    </>
  ),
  robot: (
    <>
      <path d="M12 2.500v3" />
      <circle cx="12" cy="2.500" r="1" />
      <rect x="4" y="5.500" width="16" height="14" rx="4" />
      <path d="M2 11v4M22 11v4" />
      <circle cx="9" cy="12" r="1.300" />
      <circle cx="15" cy="12" r="1.300" />
      <path d="M9.500 16h5" />
    </>
  ),
}

type CategoryIconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: CategoryIconName
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  if (name === 'hacker') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor" {...props}>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2c-3.600 0-6.200 2.800-6.200 6.300 0 1.500.4 2.600 1 3.700-1.300 1-2.300 2.700-2.700 5.200L3.500 22h17l-.6-4.800c-.4-2.500-1.400-4.200-2.700-5.200.6-1.100 1-2.200 1-3.700C18.200 4.800 15.600 2 12 2zm0 4.200c2 0 3.400 1.200 3.400 3 0 2.300-1.500 3.800-3.400 3.800s-3.400-1.500-3.400-3.800c0-1.800 1.400-3 3.400-3z" />
        <path d="M10.200 9.600h1v1h-1zm2.600 0h1v1h-1z" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {strokeIcons[name]}
    </svg>
  )
}

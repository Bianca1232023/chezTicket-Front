import type { CSSProperties } from 'react'
import Icon from '../Icon/Icon'
import './ProfileBanner.scss'

type ProfileBannerProps = {
  name: string
  location: string
  actionLabel: string
  onAction?: () => void
  topImage: string
  baseImage: string
  compactImage: string
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

function ProfileBanner({
  name,
  location,
  actionLabel,
  onAction,
  topImage,
  baseImage,
  compactImage,
}: ProfileBannerProps) {
  const style = {
    '--banner-top': `url(${topImage})`,
    '--banner-base': `url(${baseImage})`,
    '--banner-compact': `url(${compactImage})`,
  } as CSSProperties

  return (
    <section className="profile-banner" style={style}>
      <div className="profile-banner__avatar" aria-hidden="true">
        {getInitials(name)}
        <span className="profile-banner__edit-badge">
          <Icon name="pencil" />
        </span>
      </div>

      <div className="profile-banner__info">
        <h1 className="profile-banner__name">{name}</h1>
        <p className="profile-banner__location">
          <Icon name="pin" />
          {location}
        </p>
      </div>

      <button className="profile-banner__action" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </section>
  )
}

export default ProfileBanner

import Icon from '../Icon/Icon'
import './ProfileEventCard.scss'

type ProfileEventCardProps = {
  title: string
  date: string
  location: string
  badge: string
  image: string
  compactImage?: string
  href?: string
}

function ProfileEventCard({
  title,
  date,
  location,
  badge,
  image,
  compactImage,
  href,
}: ProfileEventCardProps) {
  const content = (
    <>
      <picture className="profile-event-card__media">
        {compactImage && (
          <source media="(max-width: 760px)" srcSet={compactImage} />
        )}
        <img src={image} alt="" />
      </picture>
      <div className="profile-event-card__body">
        <h3 className="profile-event-card__title">{title}</h3>
        <p className="profile-event-card__meta">
          <Icon name="calendar" />
          {date}
        </p>
        <div className="profile-event-card__footer">
          <p className="profile-event-card__meta">
            <Icon name="pin" />
            {location}
          </p>
          <span className="profile-event-card__badge">{badge}</span>
        </div>
      </div>
    </>
  )

  return href ? (
    <a className="profile-event-card" href={href}>
      {content}
    </a>
  ) : (
    <article className="profile-event-card">{content}</article>
  )
}

export default ProfileEventCard

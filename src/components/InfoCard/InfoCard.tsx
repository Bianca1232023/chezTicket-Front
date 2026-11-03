import Icon, { type IconName } from '../Icon/Icon'
import './InfoCard.scss'

type InfoCardProps = {
  title: string
  description: string
  icon?: IconName
}

function InfoCard({ title, description, icon }: InfoCardProps) {
  return (
    <article className={`info-card${icon ? ' info-card--with-icon' : ''}`}>
      {icon && <Icon name={icon} className="info-card__icon" />}
      <div className="info-card__text">
        <h3 className="info-card__title">{title}</h3>
        <p className="info-card__description">{description}</p>
      </div>
    </article>
  )
}

export default InfoCard

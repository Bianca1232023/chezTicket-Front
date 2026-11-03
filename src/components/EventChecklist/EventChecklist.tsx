import Icon from '../Icon/Icon'
import './EventChecklist.scss'

type EventChecklistProps = {
  title: string
  items: { label: string; mobileOnly?: boolean }[]
  className?: string
}

function EventChecklist({ title, items, className }: EventChecklistProps) {
  const classes = ['event-checklist', className].filter(Boolean).join(' ')

  return (
    <section className={classes}>
      <h2 className="event-checklist__title">{title}</h2>
      <ul>
        {items.map((item) => (
          <li
            key={item.label}
            className={item.mobileOnly ? 'event-checklist__mobile-only' : undefined}
          >
            <Icon name="check-circle" />
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default EventChecklist

import './PartyCard.scss'

type PartyCardProps = {
  role: string
  name: string
  lines: string[]
}

function PartyCard({ role, name, lines }: PartyCardProps) {
  return (
    <section className="party-card">
      <h3 className="party-card__role">{role}</h3>
      <p className="party-card__name">{name}</p>
      {lines.map((line) => (
        <p className="party-card__line" key={line}>
          {line}
        </p>
      ))}
    </section>
  )
}

export default PartyCard

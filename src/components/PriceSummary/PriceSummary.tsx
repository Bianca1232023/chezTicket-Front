import './PriceSummary.scss'

type PriceSummaryRow = {
  label: string
  value: string
}

type PriceSummaryProps = {
  rows: PriceSummaryRow[]
}

function PriceSummary({ rows }: PriceSummaryProps) {
  return (
    <dl className="price-summary">
      {rows.map((row) => (
        <div className="price-summary__row" key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default PriceSummary

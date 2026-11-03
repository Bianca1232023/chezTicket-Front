import './DetailList.scss'

export type DetailItem = {
  label: string
  value: string
}

type DetailListProps = {
  items: DetailItem[]
}

function DetailList({ items }: DetailListProps) {
  return (
    <dl className="detail-list">
      {items.map((item) => (
        <div key={item.label} className="detail-list__row">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default DetailList

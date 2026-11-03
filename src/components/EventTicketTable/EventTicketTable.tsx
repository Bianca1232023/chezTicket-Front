import './EventTicketTable.scss'

type EventTicketRow = {
  type: string
  price: string
  available: string
}

type EventTicketTableProps = {
  rows: EventTicketRow[]
  className?: string
}

function EventTicketTable({ rows, className }: EventTicketTableProps) {
  const classes = ['event-ticket-table', className].filter(Boolean).join(' ')

  return (
    <table className={classes}>
      <thead>
        <tr>
          <th>Tipos</th>
          <th>Preço</th>
          <th>Disponíveis</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.type}>
            <td>{row.type}</td>
            <td>{row.price}</td>
            <td>{row.available}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default EventTicketTable

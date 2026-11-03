import type { ReactNode } from 'react'
import './DataTable.scss'

export type DataTableColumn = {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  mobileEmphasis?: boolean
}

type DataTableProps = {
  columns: DataTableColumn[]
  rows: Record<string, ReactNode>[]
  caption: string
  mobileHeaderBar?: boolean
  className?: string
}

// Em telas pequenas cada linha vira um cartão: a 1ª coluna é o título e as demais viram pares rótulo/valor.
function DataTable({
  columns,
  rows,
  caption,
  mobileHeaderBar,
  className,
}: DataTableProps) {
  const classes = [
    'data-table',
    mobileHeaderBar && 'data-table--header-bar',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <table className="data-table__table">
        <caption className="data-table__caption">{caption}</caption>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-label={column.header}
                  className={[
                    `data-table__cell--${column.align ?? 'center'}`,
                    column.mobileEmphasis && 'data-table__cell--emphasis',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable

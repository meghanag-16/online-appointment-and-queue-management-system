/**
 * A data table. `headers` are the column titles; rows go in `children`. When `empty` is set (and
 * there are no rows) a single row with that message is shown, so empty tables look the same everywhere.
 */
export function Table({ headers, empty, isEmpty, testId, children }) {
  return (
    <div className="table-wrapper">
      <table data-testid={testId}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty && empty ? (
            <tr>
              <td colSpan={headers.length} className="text-center muted">
                {empty}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  )
}

/** Main text with a smaller muted line under it, for table cells. */
export function Cell({ main, sub }) {
  return (
    <>
      {main}
      {sub != null && sub !== '' && <span className="cell-sub">{sub}</span>}
    </>
  )
}

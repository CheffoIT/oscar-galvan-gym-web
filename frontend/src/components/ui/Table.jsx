export default function Table({ columns, data, emptyMessage = 'No hay datos para mostrar.' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gym-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1F1F2E] border-b border-gym-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-gym-gray uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gym-border">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gym-gray">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row.id || idx}
                className="bg-gym-card hover:bg-gym-border/50 transition-colors duration-150"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gym-white">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

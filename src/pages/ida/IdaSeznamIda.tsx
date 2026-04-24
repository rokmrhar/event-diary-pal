export default function IdaSeznamVozil() {
  const rows = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Seznam IDA po vozilih
      </h1>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Vozilo</th>
              <th className="px-4 py-3 text-left font-semibold">IDA Aparat</th>
              <th className="px-4 py-3 text-left font-semibold">Opombe</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-t border-border hover:bg-muted/50">
                <td className="px-4 py-3">Vozilo {row}</td>
                <td className="px-4 py-3">/</td>
                <td className="px-4 py-3">/</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

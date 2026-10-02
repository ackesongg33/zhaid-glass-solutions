import { priceTable } from '@/data/pricing';
import { formatCurrency } from '@/lib/pricing';
import { Check, X } from 'lucide-react';

export default function PriceTable() {
  return (
    <section id="precios" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal text-center">
          <span className="chip">Referencial</span>
          <h2 className="section-title mt-4">Tabla de Precios</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-500">
            Precios referenciales por m². El costo final depende de medidas, espesor y complejidad de instalación.
          </p>
        </div>

        <div className="reveal mt-12 overflow-hidden rounded-2xl shadow-lg shadow-ink-900/5 ring-1 ring-ink-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-900 text-white">
                <tr>
                  <th className="px-5 py-4 font-semibold">Producto</th>
                  <th className="px-5 py-4 font-semibold">Espesor</th>
                  <th className="px-5 py-4 font-semibold">Precio por m²</th>
                  <th className="px-5 py-4 font-semibold">Instalación incluida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {priceTable.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-sky-50/50">
                    <td className="px-5 py-3.5 font-medium text-ink-900">{row.product}</td>
                    <td className="px-5 py-3.5 text-ink-500">{row.thickness}</td>
                    <td className="px-5 py-3.5 font-semibold text-sky-700">{formatCurrency(row.pricePerM2)}</td>
                    <td className="px-5 py-3.5">
                      {row.installationIncluded ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-600">
                          <Check className="h-3.5 w-3.5" /> Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500">
                          <X className="h-3.5 w-3.5" /> No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="reveal mt-4 text-center text-xs text-ink-400">* Precios en soles peruanos (S/), sujetos a cambios sin previo aviso.</p>
      </div>
    </section>
  );
}

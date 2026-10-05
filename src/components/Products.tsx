import { useState } from 'react';
import { products, type Product } from '@/data/products';
import { formatCurrency } from '@/lib/pricing';
import { ArrowRight, Clock, Layers, Palette, Ruler, X } from 'lucide-react';

interface ProductsProps {
  onRequestProduct: (productName: string) => void;
}

export default function Products({ onRequestProduct }: ProductsProps) {
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <section id="productos" className="bg-gradient-to-b from-ink-50 via-white to-ink-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="section-eyebrow">Catálogo destacado</span>
            <h2 className="section-title mt-4">Materiales que elevan cada espacio</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink-500 sm:text-right">
            Soluciones seleccionadas para proyectos residenciales, comerciales y arquitectónicos de alto nivel.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <article
              key={p.id}
              className="reveal card card-hover group flex flex-col overflow-hidden hover:ring-sky-100"
              style={{ transitionDelay: `${(i % 3) * 60}ms` }}
            >
              <div className="relative h-56 overflow-hidden">
                <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm ring-1 ring-white/70 backdrop-blur-md">{p.glassType}</span>
                <span className="absolute bottom-4 left-4 text-xs font-medium text-white/80">Disponible a medida</span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-xl font-bold text-ink-900">{p.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{p.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip"><Ruler className="h-3.5 w-3.5" /> {p.thicknesses[0]}+</span>
                  <span className="chip"><Clock className="h-3.5 w-3.5" /> {p.leadTime}</span>
                </div>
                <div className="mt-auto flex items-end justify-between border-t border-ink-100 pt-5">
                  <div>
                    <p className="text-xs text-ink-400">Precio referencial desde</p>
                    <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-sky-700">{formatCurrency(p.priceFrom)}<span className="ml-0.5 text-xs font-medium tracking-normal text-ink-400">/{p.unit}</span></p>
                  </div>
                  <button onClick={() => setSelected(p)} className="group/quote inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-600/20">
                    Cotizar <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/quote:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-scale-in" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white/85 p-2 text-ink-500 backdrop-blur-md hover:text-sky-700" aria-label="Cerrar"><X className="h-5 w-5" /></button>
            <div className="h-56 overflow-hidden"><img src={selected.image} alt={selected.name} className="h-full w-full object-cover" /></div>
            <div className="p-6">
              <span className="chip">{selected.glassType}</span>
              <h3 className="mt-3 font-display text-2xl font-extrabold text-ink-900">{selected.name}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">{selected.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Detail icon={<Layers className="h-4 w-4" />} label="Espesores" value={selected.thicknesses.join(', ')} />
                <Detail icon={<Palette className="h-4 w-4" />} label="Colores" value={selected.colors.join(', ')} />
                <Detail icon={<Clock className="h-4 w-4" />} label="Fabricación" value={selected.leadTime} />
                <Detail icon={<Ruler className="h-4 w-4" />} label="Desde" value={`${formatCurrency(selected.priceFrom)}/${selected.unit}`} />
              </div>
              <button onClick={() => { onRequestProduct(selected.name); setSelected(null); }} className="btn-primary mt-6 w-full">Solicitar este producto</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl bg-ink-50 p-3"><div className="flex items-center gap-1.5 text-sky-600">{icon}<span className="text-xs font-medium text-ink-400">{label}</span></div><p className="mt-1 text-sm font-semibold text-ink-900">{value}</p></div>;
}

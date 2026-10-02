import { frameTypes } from '@/data/pricing';

export default function Frames() {
  return (
    <section id="marcos" className="bg-ink-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal text-center">
          <span className="chip">Estructuras</span>
          <h2 className="section-title mt-4">Tipos de Marcos</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-500">
            Materiales disponibles para tus proyectos de vidrio.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {frameTypes.map((f, i) => (
            <article
              key={f.id}
              className="reveal group overflow-hidden rounded-2xl bg-white shadow-lg shadow-ink-900/5 ring-1 ring-ink-100 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl"
              style={{ transitionDelay: `${(i % 3) * 60}ms` }}
            >
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-sky-50 via-white to-ink-100">
                <img
                  src={f.image}
                  alt={`Marco de ${f.name}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5 pt-12">
                  <h3 className="font-display text-2xl font-bold text-white">{f.name}</h3>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Colores disponibles</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {f.colors.map((color) => (
                    <span key={color} className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-500">{color}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

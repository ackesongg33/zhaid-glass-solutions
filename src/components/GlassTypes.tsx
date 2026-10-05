import { glassTypes } from '@/data/pricing';
import { getWhatsAppLink } from '@/data/contact';
import { ShieldCheck, Layers, Square, Sun, Thermometer, EyeOff, Lock, Check, MessageCircle } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Layers,
  Square,
  Sun,
  Thermometer,
  EyeOff,
  Lock,
};

interface GlassTypesProps {
  onRequestQuote?: (glassName: string) => void;
}

export default function GlassTypes({ onRequestQuote }: GlassTypesProps) {
  void onRequestQuote;
  const whatsappMessageByType: Record<string, string> = {
    Templado: 'Hola Zhaid Glass Solutions 👋\n\nQuiero consultar por vidrio templado y me gustaría recibir información sobre disponibilidad, espesores y opciones recomendadas.',
    Laminado: 'Hola Zhaid Glass Solutions 👋\n\nQuiero consultar por vidrio laminado y me gustaría recibir información sobre disponibilidad, espesores y opciones recomendadas.',
    Crudo: 'Hola Zhaid Glass Solutions 👋\n\nQuiero consultar por vidrio crudo y me gustaría recibir información sobre disponibilidad, espesores y opciones recomendadas.',
  };

  return (
    <section id="tipos" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal text-center">
          <span className="chip">Conocimiento</span>
          <h2 className="section-title mt-4">Tipos de Vidrio</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-500">
            Cada proyecto necesita el vidrio correcto. Conoce las características, ventajas y usos recomendados de cada tipo.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {glassTypes.map((g, i) => {
            const Icon = iconMap[g.icon] ?? Square;
            return (
              <article
                key={g.id}
                className="reveal group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-ink-50 p-6 shadow-lg shadow-ink-900/5 ring-1 ring-ink-100 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl"
                style={{ transitionDelay: `${(i % 3) * 60}ms` }}
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-50 transition-transform duration-500 group-hover:scale-150" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-ink-900">Vidrio {g.name}</h3>
                  <p className="mt-2 text-sm text-ink-500">{g.description}</p>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Ventajas</p>
                    <ul className="mt-2 space-y-1.5">
                      {g.advantages.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-sm text-ink-500">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" /> {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Espesores</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {g.thicknesses.map((t) => (
                        <span key={t} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Colores</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {g.colors.map((c) => (
                        <span key={c} className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-500">{c}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Usos recomendados</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {g.uses.map((u) => (
                        <span key={u} className="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-500">{u}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end border-t border-ink-100 pt-4">
                    <a
                      href={getWhatsAppLink(whatsappMessageByType[g.name] ?? `Hola Zhaid Glass Solutions 👋\n\nQuiero consultar por vidrio ${g.name.toLowerCase()}.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800"
                    >
                      Consultar por WhatsApp <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

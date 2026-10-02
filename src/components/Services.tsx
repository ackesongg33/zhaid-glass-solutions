import { services } from '@/data/services';
import {
  ShieldCheck,
  ShowerHead,
  AppWindow,
  DoorOpen,
  Fence,
  Frame,
  Home,
  Columns3,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck,
  ShowerHead,
  AppWindow,
  DoorOpen,
  Fence,
  Frame,
  Home,
  Columns3,
};

interface ServicesProps {
  onMoreInfo: (serviceName: string) => void;
}

export default function Services({ onMoreInfo }: ServicesProps) {
  return (
    <section id="servicios" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal text-center">
          <span className="section-eyebrow">Servicios</span>
          <h2 className="section-title mt-4">Soluciones integrales en vidrio y aluminio</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-500">
            Diseñamos, fabricamos e instalamos cada producto a medida. Conoce nuestro catálogo de servicios.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => {
            const Icon = iconMap[s.icon] ?? ShieldCheck;
            return (
              <article
                key={s.id}
                className="reveal card card-hover group relative overflow-hidden p-6"
                style={{ transitionDelay: `${(i % 4) * 60}ms` }}
              >
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-sky-50 transition-transform duration-500 group-hover:scale-150" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-lg shadow-sky-500/30 transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{s.name}</h3>
                  <p className="mt-2 text-sm text-ink-500 line-clamp-3">{s.description}</p>
                  <button
                    onClick={() => onMoreInfo(s.name)}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700"
                  >
                    Más información <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

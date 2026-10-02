import { useEffect, useRef, useState } from 'react';
import { company, stats } from '@/data/company';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroProps {
  onQuoteClick: () => void;
}

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function Hero({ onQuoteClick }: HeroProps) {
  return (
    <section id="inicio" className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img
         src="/images/foto-portada.png"
         alt="Proyecto Zhaid Glass Solutions"
         className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pt-28 pb-32 sm:px-6">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-sky-300" />
            {company.experience} años transformando espacios con vidrio y aluminio
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl animate-fade-up">
            {company.name}
          </h1>

          <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {company.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <button onClick={onQuoteClick} className="btn-primary">
              Solicitar Cotización <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#productos" className="btn-ghost">
              Ver Productos
            </a>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-2xl animate-fade-up" style={{ animationDelay: '0.3s' }}>
            {stats.map((s) => (
              <div key={s.label} className="glass-dark rounded-2xl p-4 text-center">
                <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-float">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/40 p-1.5">
          <span className="h-2 w-1 rounded-full bg-white/70" />
        </div>
      </div>
    </section>
  );
}

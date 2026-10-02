import { company, whyChooseUs } from '@/data/company';
import { Award, Eye, Handshake, Sparkles, Check, Target, Telescope } from 'lucide-react';

const iconMap = { Award, Eye, Handshake, Sparkles };

export default function About() {
  return (
    <section id="nosotros" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="reveal relative">
            <div className="overflow-hidden rounded-[2rem] shadow-2xl shadow-ink-900/10"><img src="https://images.pexels.com/photos/12441654/pexels-photo-12441654.jpeg?auto=compress&cs=tinysrgb&h=900&w=1100" alt="Interior contemporáneo con vidrio" className="h-[520px] w-full object-cover" /></div>
            <div className="absolute -bottom-6 -right-4 rounded-3xl bg-ink-900 p-5 text-white shadow-xl sm:-right-6"><p className="font-display text-3xl font-extrabold text-sky-300">{company.experience}<span className="text-xl">+</span></p><p className="mt-1 text-xs text-white/60">años haciendo la diferencia</p></div>
          </div>
          <div className="reveal">
            <span className="section-eyebrow">Nosotros</span>
            <h2 className="section-title mt-4">La precisión de un trabajo bien hecho</h2>
            <p className="mt-5 text-base leading-7 text-ink-500">{company.history}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2"><InfoBlock icon={<Target className="h-5 w-5" />} title="Nuestra misión" text={company.mission} /><InfoBlock icon={<Telescope className="h-5 w-5" />} title="Nuestra visión" text={company.vision} /></div>
          </div>
        </div>
        <div className="mt-20 grid grid-cols-1 gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="reveal rounded-3xl bg-ink-900 p-7 text-white sm:p-9"><p className="text-xs font-semibold uppercase tracking-widest text-sky-300">Por qué elegirnos</p><h3 className="mt-3 font-display text-2xl font-bold">Confianza que se nota en cada detalle</h3><ul className="mt-7 space-y-3">{whyChooseUs.map((item) => <li key={item} className="flex items-start gap-3 text-sm text-white/75"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />{item}</li>)}</ul></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{company.values.map((value) => { const Icon = iconMap[value.icon as keyof typeof iconMap]; return <div key={value.title} className="reveal rounded-3xl bg-ink-50 p-6 ring-1 ring-ink-100 transition-colors hover:bg-sky-50 hover:ring-sky-100"><Icon className="h-6 w-6 text-sky-600" /><h3 className="mt-4 font-display text-lg font-bold text-ink-900">{value.title}</h3><p className="mt-2 text-sm leading-6 text-ink-500">{value.text}</p></div>; })}</div>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4"><div className="flex items-center gap-2 text-sky-600">{icon}<span className="text-xs font-bold uppercase tracking-wide text-ink-400">{title}</span></div><p className="mt-2 text-sm leading-6 text-ink-600">{text}</p></div>; }

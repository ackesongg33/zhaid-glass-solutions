import { company } from '@/data/company';
import { contact } from '@/data/contact';
import { socialLinks } from '@/data/site';
import { Facebook, Instagram, Mail, MapPin, Music2, Phone, Youtube } from 'lucide-react';

const socialIconMap = { Facebook, Instagram, Music2, Youtube };

export default function Footer() {
  return (
    <footer className="bg-ink-950 py-14 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.3fr_0.7fr_1fr]">
          <div><div className="flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1"><img src="/images/logo.png" alt="Logotipo de Zhaid Glass Solutions" className="h-full w-full object-contain" /></span><span className="font-display text-lg font-extrabold">{company.name}</span></div><p className="mt-5 max-w-md text-sm leading-6 text-white/60">{company.slogan} {company.description}</p><div className="mt-6 flex gap-2">{socialLinks.map((social) => { const Icon = socialIconMap[social.icon as keyof typeof socialIconMap]; return <a key={social.name} href={social.url} aria-label={social.name} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-sky-400 hover:bg-sky-400 hover:text-white"><Icon className="h-4 w-4" /></a>; })}</div></div>
          <div><p className="text-sm font-semibold text-white">Explora</p><ul className="mt-4 space-y-3 text-sm text-white/60"><li><a href="#productos" className="hover:text-sky-300">Productos</a></li><li><a href="#servicios" className="hover:text-sky-300">Servicios</a></li><li><a href="#galeria" className="hover:text-sky-300">Galería</a></li><li><a href="#nosotros" className="hover:text-sky-300">Nosotros</a></li><li><a href="#contacto" className="hover:text-sky-300">Contacto</a></li></ul></div>
          <div><p className="text-sm font-semibold text-white">Conversemos</p><ul className="mt-4 space-y-4 text-sm text-white/60"><li className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />{contact.phone}</li><li className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />{contact.email}</li><li className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />{contact.address}</li></ul><div className="mt-5 overflow-hidden rounded-2xl border border-white/10"><iframe title={`Ubicación ${company.name}`} src={contact.googleMapsUrl} className="h-28 w-full border-0 opacity-70 grayscale" loading="lazy" /></div></div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row"><p>© {new Date().getFullYear()} {company.name}. Todos los derechos reservados.</p><p>Desarrollado por EmiX</p></div>
      </div>
    </footer>
  );
}

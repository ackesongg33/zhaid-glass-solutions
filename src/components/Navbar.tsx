import { useEffect, useState } from 'react';
import { company } from '@/data/company';
import { contact, getWhatsAppLink } from '@/data/contact';
import { MessageCircle, Menu, X } from 'lucide-react';

interface NavbarProps {
  onQuoteClick: () => void;
}

const links = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Productos', href: '#productos' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Galería', href: '#galeria' },
  { label: 'Cotizador', href: '#medidas' },
  { label: 'IA Asistente', href: '#ia' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Contacto', href: '#contacto' },
];

export default function Navbar({ onQuoteClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const whatsappLink = getWhatsAppLink('Hola, quiero cotizar por WhatsApp.');

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/70 backdrop-blur-xl shadow-lg shadow-ink-900/5' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#inicio" className="flex items-center gap-2.5">
          <img
           src={company.logo}
           alt={company.name}
           className="h-12 w-32 object-contain bg-white rounded-lg shadow-lg"
/>
          <span className={`font-display text-lg font-extrabold tracking-tight transition-colors ${scrolled ? 'text-ink-900' : 'text-white'}`}>
            {company.name}
          </span>
        </a>

        <div className="hidden items-center gap-0.5 xl:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                scrolled ? 'text-ink-600 hover:bg-sky-50 hover:text-sky-700' : 'text-white/90 hover:bg-white/15 hover:text-white'
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="hidden btn-whatsapp !px-4 !py-2.5 text-xs sm:inline-flex">
            <MessageCircle className="h-4 w-4" /> Cotizar por WhatsApp
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`xl:hidden rounded-lg p-2 transition-colors ${scrolled ? 'text-ink-900 hover:bg-ink-100' : 'text-white hover:bg-white/15'}`}
            aria-label="Menú"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="xl:hidden bg-white/95 backdrop-blur-xl border-t border-ink-100 shadow-lg">
          <div className="flex flex-col px-4 py-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-sky-50 hover:text-sky-700"
              >
                {l.label}
              </a>
            ))}
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-whatsapp mt-2 !w-full">
              <MessageCircle className="h-4 w-4" /> Cotizar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

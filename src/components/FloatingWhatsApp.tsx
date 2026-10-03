import { getWhatsAppLink } from '@/data/contact';
import { MessageCircle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

type AiDraft = {
  context?: Record<string, string>;
  conversation?: string;
};

function getAiWhatsAppLink(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const draft = JSON.parse(window.localStorage.getItem('zhaid-ai-context') ?? 'null') as AiDraft | null;
    const context = draft?.context;
    if (!context && !draft?.conversation) return null;

    const lines = [
      'Hola, quisiera solicitar una cotización para un proyecto de Zhaid Glass Solutions.',
      '',
      ...(context?.product ? [`Proyecto: ${context.product}`] : []),
      ...(context?.environment ? [`Ambiente: ${context.environment}`] : []),
      ...(context?.quantity ? [`Cantidad: ${context.quantity}`] : []),
      ...(context?.material ? [`Material: ${context.material}`] : []),
      ...(context?.color ? [`Color: ${context.color}`] : []),
      ...(context?.glassType ? [`Tipo de vidrio: ${context.glassType}`] : []),
      ...(context?.glassThickness ? [`Espesor: ${context.glassThickness}`] : []),
      ...(context?.glassColor ? [`Color de vidrio: ${context.glassColor}`] : []),
      ...(context?.measures ? [`Medidas: ${context.measures}`] : []),
      ...(context?.need ? [`Necesidad: ${context.need}`] : []),
      ...(context?.climate ? [`Condición: ${context.climate}`] : []),
      '',
      'Detalles adicionales:',
      ...(context?.additionalDetails ? [context.additionalDetails] : []),
      ...(draft?.conversation ? ['', 'Resumen de la conversación:', draft.conversation] : []),
    ];

    return getWhatsAppLink(lines.join('\n'));
  } catch {
    return null;
  }
}

interface FloatingWhatsAppProps {
  onOpenAI: () => void;
}

export default function FloatingWhatsApp({ onOpenAI }: FloatingWhatsAppProps) {
  const whatsappLink = getWhatsAppLink();

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <button
        onClick={onOpenAI}
        className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-ink-800 to-ink-900 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-ink-900/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M12 2a7 7 0 00-7 7c0 1.5.5 2.9 1.3 4L5 21l4.2-1.3A7 7 0 1012 2z" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="hidden sm:inline">Zhaid IA</span>
        <span className="absolute right-1 top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-sky-300" />
      </button>

      <a
        href={whatsappLink}
        onClick={(event) => {
          const aiWhatsAppLink = getAiWhatsAppLink();
          if (aiWhatsAppLink) event.currentTarget.href = aiWhatsAppLink;
        }}
        target="_blank"
        rel="noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/40 transition-all hover:-translate-y-0.5 hover:bg-emerald-600"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}

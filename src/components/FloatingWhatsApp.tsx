
import { getWhatsAppLink } from '@/data/contact';
import { Bot } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

type AiDraft = {
  context?: Record<string, string>;
  conversation?: string;
};

function getAiWhatsAppLink(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const draft = JSON.parse(
      window.localStorage.getItem('zhaid-ai-context') ?? 'null'
    ) as AiDraft | null;

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
      ...(context?.glassThickness
        ? [`Espesor: ${context.glassThickness}`]
        : []),
      ...(context?.glassColor
        ? [`Color de vidrio: ${context.glassColor}`]
        : []),
      ...(context?.measures ? [`Medidas: ${context.measures}`] : []),
      ...(context?.need ? [`Necesidad: ${context.need}`] : []),
      ...(context?.climate ? [`Condición: ${context.climate}`] : []),
      '',
      'Detalles adicionales:',
      ...(context?.additionalDetails
        ? [context.additionalDetails]
        : []),
      ...(draft?.conversation
        ? ['', 'Resumen de la conversación:', draft.conversation]
        : []),
    ];

    return getWhatsAppLink(lines.join('\n'));
  } catch {
    return null;
  }
}

interface FloatingWhatsAppProps {
  onOpenAI: () => void;
}

export default function FloatingWhatsApp({
  onOpenAI,
}: FloatingWhatsAppProps) {
  const whatsappLink = getWhatsAppLink();

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6">
      <button
        onClick={onOpenAI}
        className="group relative flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-r from-ink-800 to-ink-950 px-3.5 pr-4 text-sm font-semibold text-white shadow-xl shadow-ink-900/25 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:shadow-ink-900/30"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/15 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
          <Bot className="h-4.5 w-4.5" />
        </span>

        <span className="hidden sm:inline">Zhaid IA</span>

        <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 animate-pulse rounded-full bg-sky-300 ring-2 ring-ink-900" />
      </button>

      <a
        href={whatsappLink}
        onClick={(event) => {
          const aiWhatsAppLink = getAiWhatsAppLink();

          if (aiWhatsAppLink) {
            event.currentTarget.href = aiWhatsAppLink;
          }
        }}
        target="_blank"
        rel="noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-white/80 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-emerald-600 hover:shadow-2xl hover:shadow-emerald-500/35"
        aria-label="WhatsApp"
      >
        <FaWhatsapp className="h-9 w-9" />
      </a>
    </div>
  );
}


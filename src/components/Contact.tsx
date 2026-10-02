import { useForm, ValidationError } from '@formspree/react';
import { useState } from 'react';
import { company } from '@/data/company';
import { contact, getWhatsAppLink } from '@/data/contact';
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';

interface ContactProps { onQuoteClick: () => void; }
type AiDraft = { context?: { product?: string; environment?: string; measures?: string; color?: string }; conversation?: string };

export default function Contact({ onQuoteClick }: ContactProps) {
  const [state, handleSubmit, reset] = useForm('xvkgnypb');
  const [aiDraft] = useState<AiDraft | null>(() => {
    if (typeof window === 'undefined') return null;

    try {
      return JSON.parse(window.localStorage.getItem('zhaid-ai-context') ?? 'null') as AiDraft | null;
    } catch {
      return null;
    }
  });
  const whatsappLink = getWhatsAppLink('Hola, me gustaría cotizar un proyecto.');
  const callLink = `tel:${contact.phoneRaw}`;
  const aiContext = aiDraft?.context;
  const aiConversation = aiDraft?.conversation ?? '';
  const defaultProjectType = /mampara/.test(aiContext?.product ?? '') ? 'Mampara de baño' : /ventana/.test(aiContext?.product ?? '') ? 'Ventanas' : /puerta/.test(aiContext?.product ?? '') ? 'Puertas' : /baranda/.test(aiContext?.product ?? '') ? 'Barandas' : /espejo/.test(aiContext?.product ?? '') ? 'Espejos' : '';
  const draftMessage = aiConversation ? `Información recopilada con Zhaid IA:\n\n${aiConversation}\n\nMensaje adicional:\n` : undefined;

  return (
    <section id="contacto" className="bg-ink-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal text-center"><span className="section-eyebrow">Contacto</span><h2 className="section-title mt-4">Hagamos realidad tu proyecto</h2><p className="mx-auto mt-3 max-w-2xl text-ink-500">Cuéntanos qué tienes en mente. Nuestro equipo te asesorará con una propuesta clara y a la medida.</p></div>
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="reveal space-y-4"><a href={callLink} className="flex items-center gap-4 rounded-3xl bg-ink-900 p-5 text-white shadow-xl shadow-ink-900/15 transition-transform hover:-translate-y-1"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400"><Phone className="h-5 w-5" /></span><div><p className="text-xs text-white/50">Llámanos directamente</p><p className="mt-1 font-display text-lg font-bold">{contact.phone}</p></div></a><a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-3xl bg-emerald-500 p-5 text-white shadow-xl shadow-emerald-500/15 transition-transform hover:-translate-y-1"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><MessageCircle className="h-5 w-5" /></span><div><p className="text-xs text-white/70">Escríbenos por WhatsApp</p><p className="mt-1 font-display text-lg font-bold">Respuesta rápida</p></div></a><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><InfoCard icon={<MapPin className="h-4 w-4" />} title="Dirección" value={contact.address} /><InfoCard icon={<Clock className="h-4 w-4" />} title="Horario" value={contact.schedule} /><InfoCard icon={<Mail className="h-4 w-4" />} title="Correo" value={contact.email} /><InfoCard icon={<Phone className="h-4 w-4" />} title="Teléfono" value={contact.phone} /></div><div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-ink-100"><iframe title={`Ubicación ${company.name}`} src={contact.googleMapsUrl} className="h-52 w-full border-0" loading="lazy" /></div></div>
          <div className="reveal rounded-3xl bg-white p-6 shadow-xl shadow-ink-900/5 ring-1 ring-ink-100 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-sky-600">Cotización gratuita</p><h3 className="mt-2 font-display text-2xl font-bold text-ink-900">Cuéntanos sobre tu proyecto</h3></div><div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 sm:flex"><Send className="h-5 w-5" /></div></div>
            {state.succeeded ? (
              <div className="flex min-h-[330px] flex-col items-center justify-center text-center"><CheckCircle2 className="h-14 w-14 text-emerald-500" /><h3 className="mt-5 font-display text-2xl font-bold text-ink-900">¡Solicitud enviada correctamente!</h3><p className="mt-2 max-w-sm text-sm leading-6 text-ink-500">Gracias por escribirnos. Un especialista se pondrá en contacto contigo para revisar los detalles.</p><button onClick={reset} className="btn-outline mt-6 !px-5 !py-2.5 text-xs">Enviar otra consulta</button></div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2"><Field name="name" label="Nombre" placeholder="Tu nombre" required /><Field name="phone" label="Teléfono" placeholder={contact.phone} required /></div>
                <div className="grid gap-4 sm:grid-cols-2"><Field name="email" label="Correo electrónico" placeholder="tu@email.com" type="email" required /><Field name="projectType" label="Tipo de proyecto" placeholder="Selecciona una opción" defaultValue={defaultProjectType} select options={['Mampara de baño', 'Ventanas', 'Puertas', 'Barandas', 'Espejos', 'Otro']} required /></div>
                  <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink-600">Cuéntanos más</span><textarea name="message" required rows={4} defaultValue={draftMessage} placeholder="Medidas aproximadas, tipo de vidrio o cualquier detalle..." className="w-full resize-none rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-800 outline-none transition-colors placeholder:text-ink-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-400/10" /></label>
                <input type="hidden" name="ai_context" value={JSON.stringify(aiContext ?? {})} readOnly />
                <div className="grid gap-1"><ValidationError prefix="Nombre" field="name" errors={state.errors} /><ValidationError prefix="Teléfono" field="phone" errors={state.errors} /><ValidationError prefix="Correo electrónico" field="email" errors={state.errors} /><ValidationError prefix="Tipo de proyecto" field="projectType" errors={state.errors} /><ValidationError prefix="Mensaje" field="message" errors={state.errors} /></div>
                {state.errors && <ValidationError prefix="Formulario" errors={state.errors} />}
                <button type="submit" disabled={state.submitting} className="btn-primary w-full">{state.submitting ? 'Enviando...' : 'Enviar solicitud'} <Send className="h-4 w-4" /></button>
                <button type="button" onClick={onQuoteClick} className="w-full text-center text-xs font-semibold text-sky-700 hover:text-sky-800">O prueba nuestro cotizador inteligente</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) { return <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100"><div className="flex items-center gap-2 text-sky-600">{icon}<span className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{title}</span></div><p className="mt-1.5 text-xs font-semibold leading-5 text-ink-900">{value}</p></div>; }
function Field({ name, label, placeholder, type = 'text', select = false, options = [], required = false, defaultValue = '' }: { name: string; label: string; placeholder: string; type?: string; select?: boolean; options?: string[]; required?: boolean; defaultValue?: string }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink-600">{label}</span>{select ? <select name={name} required={required} defaultValue={defaultValue} className="w-full rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-800 outline-none transition-colors focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-400/10"><option value="" disabled>{placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input name={name} required={required} type={type} defaultValue={defaultValue} placeholder={placeholder} className="w-full rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-800 outline-none transition-colors placeholder:text-ink-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-400/10" />}</label>; }

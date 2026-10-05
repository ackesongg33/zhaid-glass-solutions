import { useMemo, useState } from 'react';
import { calculateWindowPrice, glassTypes, frameTypes, windowSystems, type GlassType } from '@/data/pricing';
import { calculateQuote, formatCurrency, type QuoteResult } from '@/lib/pricing';
import { Ruler, Calculator, Sparkles } from 'lucide-react';

interface CustomMeasurementsProps {
  onSendToAI: (result: QuoteResult, input: CustomInput) => void;
}

export interface CustomInput {
  widthCm: number;
  heightCm: number;
  glassType: GlassType;
  thickness: string;
  frameId: string;
  quantity: number;
  systemId: string;
}

const flexibleDimensionToCm = (raw: string): number => {
  const trimmed = raw.trim();
  if (!trimmed) return 0;

  const value = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return 0;

  // Formatos aceptados automáticamente:
  // 100  -> 100 cm
  // 1.00 -> 1.00 m -> 100 cm
  // 300  -> 300 cm
  // 3.00 -> 3.00 m -> 300 cm
  // También aceptamos "3" como 3 m para que sea natural al escribir.
  // Regla práctica para evitar ambigüedades peligrosas:
  // hasta 10 se interpreta como metros; más de 10, como centímetros.
  // Así 1.00 = 1 m, 3.00 = 3 m, 100 = 100 cm y 300 = 300 cm.
  const shouldTreatAsMeters = value <= 10;

  return shouldTreatAsMeters ? value * 100 : value;
};

export default function CustomMeasurements({ onSendToAI }: CustomMeasurementsProps) {
  const [input, setInput] = useState<CustomInput>({
    widthCm: 120,
    heightCm: 90,
    glassType: 'Templado',
    thickness: '8mm',
    frameId: 'aluminio',
    quantity: 1,
    systemId: 'serie-25',
  });
  const [widthValue, setWidthValue] = useState('120');
  const [heightValue, setHeightValue] = useState('90');

  const updateFlexibleDimension = (dimension: 'widthCm' | 'heightCm', raw: string) => {
    // Dejamos escribir números enteros o decimales con punto/coma sin pelear con el usuario.
    if (raw && !/^\d*(?:[.,]\d*)?$/.test(raw)) return;

    if (dimension === 'widthCm') setWidthValue(raw);
    else setHeightValue(raw);

    setInput((current) => ({
      ...current,
      [dimension]: flexibleDimensionToCm(raw),
    }));
  };

  const result = useMemo(() => {
    const baseQuote = calculateQuote(input);
    const system = calculateWindowPrice(input.systemId, input.widthCm / 100, input.heightCm / 100);

    if (!system) return baseQuote;

    return {
      ...baseQuote,
      systemName: system.name,
      systemPrice: system.price,
      systemUnit: system.unit,
      total: Number((system.total * input.quantity).toFixed(2)),
    };
  }, [input]);

  const thicknesses = glassTypes.find((g) => g.name === input.glassType)?.pricePerM2
    ? ['4mm', '5mm', '6mm', '6.38mm', '8mm', '8.38mm', '10mm', '10.38mm', '12mm']
    : ['6mm', '8mm', '10mm', '12mm'];

  return (
    <section id="medidas" className="relative overflow-hidden bg-ink-950 py-20 sm:py-28">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #38a8f0 0, transparent 40%), radial-gradient(circle at 80% 70%, #5ac2ff 0, transparent 40%)' }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            <Ruler className="h-3.5 w-3.5" /> Medidas personalizadas
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-white sm:text-4xl">Cotiza a tu medida</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">
            Ingresa las medidas de tu proyecto y obtén una cotización estimada al instante.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="reveal lg:col-span-3 glass-dark rounded-3xl p-6 sm:p-8">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
              <Calculator className="h-5 w-5 text-sky-300" /> Datos del proyecto
            </h3>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Field label="Ancho (cm o m)">
                <input
                  type="text"
                  inputMode="decimal"
                  value={widthValue}
                  onChange={(e) => updateFlexibleDimension('widthCm', e.target.value)}
                  className="input-dark"
                  aria-label="Ancho en centímetros o metros"
                />
                <span className="mt-1 block text-[10px] text-white/45">100 o 1.00 = 1 metro</span>
              </Field>
              <Field label="Alto (cm o m)">
                <input
                  type="text"
                  inputMode="decimal"
                  value={heightValue}
                  onChange={(e) => updateFlexibleDimension('heightCm', e.target.value)}
                  className="input-dark"
                  aria-label="Alto en centímetros o metros"
                />
                <span className="mt-1 block text-[10px] text-white/45">120 o 1.20 = 1.20 metros</span>
              </Field>
              <Field label="Tipo de vidrio">
                <select value={input.glassType} onChange={(e) => setInput({ ...input, glassType: e.target.value as GlassType })} className="input-dark">
                  {glassTypes.map((g) => (
                    <option key={g.id} value={g.name} className="bg-ink-900">Vidrio {g.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Producto / serie">
                <select value={input.systemId} onChange={(e) => setInput({ ...input, systemId: e.target.value })} className="input-dark">
                  {windowSystems.map((system) => (
                    <option key={system.id} value={system.id} className="bg-ink-900">{system.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Espesor">
                <select value={input.thickness} onChange={(e) => setInput({ ...input, thickness: e.target.value })} className="input-dark">
                  {thicknesses.map((t) => (
                    <option key={t} value={t} className="bg-ink-900">{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo de marco">
                <select value={input.frameId} onChange={(e) => setInput({ ...input, frameId: e.target.value })} className="input-dark">
                  {frameTypes.map((f) => (
                    <option key={f.id} value={f.id} className="bg-ink-900">{f.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Cantidad">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={input.quantity}
                  onChange={(e) => setInput({ ...input, quantity: Math.max(1, Number(e.target.value)) })}
                  className="input-dark"
                />
              </Field>
            </div>

            <button
              onClick={() => onSendToAI(result, input)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:bg-sky-600 hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" /> Enviar a Zhaid IA
            </button>
          </div>

          <div className="reveal lg:col-span-2 glass rounded-3xl p-6 sm:p-8">
            <h3 className="font-display text-lg font-bold text-ink-900">Cotización estimada</h3>
            <div className="mt-4 space-y-3 text-sm">
              {result.systemName && <Row label="Producto / serie" value={result.systemName} />}
              {result.systemPrice !== undefined && result.systemUnit && <Row label={`Precio por ${result.systemUnit}`} value={formatCurrency(result.systemPrice)} />}
              <Row label="Tipo de vidrio" value={`Vidrio ${result.glassType}`} />
              <Row label="Área calculada" value={`${result.areaM2} m²`} />
              <Row label="Precio por m²" value={formatCurrency(result.pricePerM2)} />
              <Row label="Costo del vidrio" value={formatCurrency(result.glassCost)} />
              <Row label="Costo del marco" value={result.frameCost > 0 ? formatCurrency(result.frameCost) : "Pendiente"} />
              <Row label="Instalación" value="Gratis" />
              {input.quantity > 1 && <Row label={`Subtotal x${input.quantity}`} value={formatCurrency(result.subtotal)} />}
            </div>
            <div className="mt-5 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 p-5 text-white shadow-lg shadow-sky-500/30">
              <p className="text-xs uppercase tracking-wide text-white/70">Total aproximado</p>
              <p className="mt-1 font-display text-3xl font-extrabold">{formatCurrency(result.total)}</p>
              <p className="mt-1 text-xs text-white/70">Referencia de serie/producto · instalación gratis · marco/accesorios pueden requerir confirmación</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .input-dark {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .input-dark:focus { border-color: #5ac2ff; background: rgba(255,255,255,0.1); }
      `}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/70">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 pb-2.5">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}

import { glassTypes, frameTypes } from '@/data/pricing';

export type GlassType = (typeof glassTypes)[number]['name'];

export interface QuoteInput {
  widthCm: number;
  heightCm: number;
  glassType: GlassType;
  thickness: string;
  frameId: string;
  quantity: number;
}

export interface QuoteResult {
  glassType: GlassType;
  areaM2: number;
  pricePerM2: number;
  glassCost: number;
  frameCost: number;
  installationCost: number;
  subtotal: number;
  total: number;
  leadTime: string;
  systemName?: string;
  systemPrice?: number;
  systemUnit?: 'pie' | 'm²';
}

import { thicknessMultiplier } from '@/data/pricing';

export function calculateQuote(input: QuoteInput): QuoteResult {
  const glass = glassTypes.find((g) => g.name === input.glassType) ?? glassTypes[0];
  const frame = frameTypes.find((f) => f.id === input.frameId) ?? frameTypes[0];

  const areaM2 = (input.widthCm * input.heightCm) / 10000;
  const multiplier = thicknessMultiplier[input.thickness] ?? 1.12;
  const pricePerM2 = Math.round((glass.pricePerM2 * multiplier) / 5) * 5;

  const glassCost = pricePerM2 * areaM2;
  const perimeterM = (2 * (input.widthCm + input.heightCm)) / 100;
  const frameCost = (frame.pricePerMeter ?? 0) * perimeterM;
  const installationCost = 0;
  const subtotal = glassCost + frameCost;
  const total = subtotal * input.quantity;

  return {
    glassType: input.glassType,
    areaM2: Number(areaM2.toFixed(2)),
    pricePerM2,
    glassCost: Number(glassCost.toFixed(2)),
    frameCost: Number(frameCost.toFixed(2)),
    installationCost: Number(installationCost.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    total: Number(total.toFixed(2)),
    leadTime: '5-10 días hábiles',
  };
}

export function formatCurrency(value: number): string {
  return 'S/ ' + value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

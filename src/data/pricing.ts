export interface GlassTypeInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  advantages: string[];
  uses: string[];
  thicknesses: string[];
  colors: string[];
  pricePerM2: number;
}

export interface FrameType {
  id: string;
  name: string;
  image: string;
  colors: string[];
  pricePerMeter?: number;
  resistance?: string;
}

export interface PriceRow {
  product: string;
  thickness: string;
  pricePerM2: number;
  installationIncluded: boolean;
}

export const glassTypes: GlassTypeInfo[] = [
  {
    id: 'gt-crudo',
    name: 'Crudo',
    icon: 'Square',
    description: 'Vidrio base con claridad y versatilidad para proyectos generales.',
    advantages: ['Alta claridad', 'Versátil en uso general', 'Aplica en proyectos estándar'],
    uses: ['Ventanas', 'Divisiones', 'Aplicaciones generales'],
    thicknesses: ['6mm', '8mm'],
    colors: ['Transparente', 'Bronce', 'Azul claro', 'Azul electra'],
    pricePerM2: 180,
  },
  {
    id: 'gt-laminado',
    name: 'Laminado',
    icon: 'Layers',
    description: 'Vidrio compuesto con capas que aportan mayor seguridad y continuidad ante impactos.',
    advantages: ['Mayor seguridad', 'Mejor protección', 'Versión recomendada para exteriores'],
    uses: ['Ventanas', 'Fachadas', 'Cerramientos'],
    thicknesses: ['6mm', '8mm'],
    colors: ['Transparente', 'Bronce', 'Azul claro', 'Azul electra'],
    pricePerM2: 220,
  },
  {
    id: 'gt-templado',
    name: 'Templado',
    icon: 'ShieldCheck',
    description: 'Vidrio tratado que ofrece mayor resistencia y seguridad en uso frecuente.',
    advantages: ['Mayor resistencia', 'Mayor seguridad', 'Ideal para uso exigente'],
    uses: ['Puertas', 'Mamparas', 'Barandas', 'Fachadas'],
    thicknesses: ['6mm', '8mm'],
    colors: ['Transparente', 'Bronce', 'Azul claro', 'Azul electra'],
    pricePerM2: 180,
  },
];

export type GlassType = (typeof glassTypes)[number]['name'];

export const frameTypes: FrameType[] = [
  {
    id: 'aluminio',
    name: 'Aluminio',
    image: '/images/frames/aluminio/aluminio.png',
    colors: ['Natural', 'Negro', 'Blanco', 'Color madera'],
  },
  {
    id: 'pvc',
    name: 'PVC',
    image: '/images/frames/pvc/marco pvc.png',
    colors: ['Natural', 'Negro', 'Blanco', 'Color madera'],
  },
];

export const priceTable: PriceRow[] = [
  { product: 'Vidrio Templado', thickness: '6mm', pricePerM2: 180, installationIncluded: true },
  { product: 'Vidrio Templado', thickness: '10mm', pricePerM2: 220, installationIncluded: true },
  { product: 'Vidrio Laminado', thickness: '6.38mm', pricePerM2: 240, installationIncluded: true },
  { product: 'Vidrio Flotado', thickness: '5mm', pricePerM2: 120, installationIncluded: true },
  { product: 'Vidrio Esmerilado', thickness: '6mm', pricePerM2: 160, installationIncluded: true },
  { product: 'Vidrio Reflectivo', thickness: '8mm', pricePerM2: 260, installationIncluded: true },
  { product: 'Vidrio Insulado', thickness: '4+12+4', pricePerM2: 310, installationIncluded: true },
  { product: 'Espejo', thickness: '5mm', pricePerM2: 140, installationIncluded: true },
  { product: 'Mampara de Baño', thickness: '8mm', pricePerM2: 320, installationIncluded: true },
  { product: 'Puerta de Vidrio', thickness: '10mm', pricePerM2: 380, installationIncluded: true },
];

export const thicknessMultiplier: Record<string, number> = {
  '4mm': 1.0,
  '5mm': 1.05,
  '6mm': 1.12,
  '6.38mm': 1.18,
  '8mm': 1.25,
  '8.38mm': 1.3,
  '10mm': 1.4,
  '10.38mm': 1.45,
  '12mm': 1.55,
  '4+12+4': 1.8,
};
export interface WindowSystem {
  id: string;
  name: string;
  category: string;
  unit: 'pie' | 'm²';
  price: number;
}


export const windowSystems: WindowSystem[] = [

  {
    id: 'sistema-directo',
    name: 'Ventana sistema directo',
    category: 'Sistema directo',
    unit: 'pie',
    price: 13,
  },

  {
    id: 'serie-25',
    name: 'Serie 25',
    category: 'Serie Nacional',
    unit: 'pie',
    price: 35,
  },

  {
    id: 'serie-62',
    name: 'Serie 62',
    category: 'Serie Nacional',
    unit: 'm²',
    price: 500,
  },

  {
    id: 'serie-80',
    name: 'Serie 80',
    category: 'Serie Nacional',
    unit: 'm²',
    price: 600,
  },

  {
    id: 'serie-35',
    name: 'Serie 35',
    category: 'Serie Nacional',
    unit: 'm²',
    price: 480,
  },

  {
    id: 'serie-42',
    name: 'Serie 42',
    category: 'Serie Nacional',
    unit: 'm²',
    price: 450,
  },

  {
    id: 'style-50',
    name: 'Style 50',
    category: 'Serie Española',
    unit: 'pie',
    price: 40,
  },

  {
    id: 'style-60',
    name: 'Style 60',
    category: 'Serie Española',
    unit: 'm²',
    price: 550,
  },

  {
    id: 'style-70',
    name: 'Style 70',
    category: 'Serie Española',
    unit: 'm²',
    price: 650,
  },

  {
    id: 'alfa-60',
    name: 'Alfa 60',
    category: 'Serie Española',
    unit: 'm²',
    price: 900,
  },

  {
    id: 'alfa-65',
    name: 'Alfa 65',
    category: 'Serie Española',
    unit: 'm²',
    price: 1400,
  },

  {
    id: 'vl-46',
    name: 'VL 46',
    category: 'Serie Española',
    unit: 'm²',
    price: 580,
  },

  {
    id: 'ml-46',
    name: 'ML 46',
    category: 'Serie Española',
    unit: 'm²',
    price: 640,
  },
];


// CALCULO AUTOMÁTICO DE VENTANAS

export function calculateWindowPrice(
  systemId: string,
  width: number,
  height: number
) {
  const system = windowSystems.find(
    (item) => item.id === systemId
  );

  if (!system) return null;

  const area = width * height;
  const perimeterM = 2 * (width + height);

  // "pie" se maneja como pie lineal usando el perímetro exterior.
  // Las demás series registradas se calculan por m².
  const total =
    system.unit === 'pie'
      ? (perimeterM / 0.3048) * system.price
      : area * system.price;

  return {
    name: system.name,
    area,
    unit: system.unit,
    price: system.price,
    total,
  };
}

export function resolveFrameFromSystem(systemId: string): FrameType {
  const system = windowSystems.find((item) => item.id === systemId);

  if (!system) {
    return frameTypes[0];
  }

  return {
    id: system.id,
    name: system.name,
    image: '',
    pricePerMeter: system.unit === 'pie' ? system.price : undefined,
    colors: ['No especificado'],
    resistance: 'Resistencia basada en la serie recomendada',
  };
}

export function resolveDefaultSystem(
  product: string,
  environment: string,
  need?: string,
  climate?: string
): string {
  const normalizedProduct = String(product || '').trim().toLowerCase();
  const normalizedEnvironment = String(environment || '').trim().toLowerCase();
  const normalizedNeed = String(need || '').trim().toLowerCase();
  const normalizedClimate = String(climate || '').trim().toLowerCase();

  if (normalizedProduct === 'mampara') {
    if (['baño', 'division', 'división'].includes(normalizedEnvironment)) return 'serie-25';
    if (['balcon', 'terraza', 'cerramiento'].includes(normalizedEnvironment)) return 'serie-62';
    if (['seguridad', 'proteccion', 'protección'].includes(normalizedNeed)) return 'serie-62';
    if (normalizedClimate && ['viento', 'lluvia', 'sol', 'exterior'].includes(normalizedClimate)) return 'serie-62';
    return 'serie-25';
  }

  if (normalizedProduct === 'ventana') {
    if (['dormitorio', 'sala', 'cocina'].includes(normalizedEnvironment)) return 'serie-25';
    if (['oficina', 'local', 'comercial'].includes(normalizedEnvironment)) return 'serie-35';
    if (normalizedEnvironment === 'fachada' || normalizedEnvironment === 'exterior' || normalizedClimate) return 'serie-80';
    return 'serie-25';
  }

  if (
    normalizedProduct === 'fachada' ||
    normalizedEnvironment === 'fachada' ||
    normalizedEnvironment === 'exterior'
  ) {
    if (['premium', 'arquitectonico', 'arquitectónico'].includes(normalizedNeed)) return 'alfa-60';
    return 'serie-80';
  }

  if (normalizedProduct === 'puerta') {
    if (['entrada', 'terraza', 'oficina', 'local'].includes(normalizedEnvironment)) return 'serie-35';
    return 'serie-25';
  }

  if (
    ['vidrio', 'espejo', 'aluminio'].includes(normalizedProduct)
  ) {
    if (normalizedEnvironment === 'fachada' || normalizedEnvironment === 'exterior' || normalizedClimate) return 'serie-80';
    return 'serie-25';
  }

  return 'serie-25';
}
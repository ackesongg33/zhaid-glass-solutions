import { useEffect, useRef, useState } from 'react';
import { products, type Product } from '@/data/products';
import { frameTypes, glassTypes, priceTable, thicknessMultiplier, windowSystems } from '@/data/pricing';
import { formatCurrency, type QuoteResult } from '@/lib/pricing';
import type { CustomInput } from '@/components/CustomMeasurements';
import { Bot, Send, Sparkles, X, MessageCircle } from 'lucide-react';
import { getWhatsAppLink } from '@/data/contact';

type ConversationContext = {
  product: string;
  series: string;
  environment: string;
  need: string;
  measures: string;
  climate: string;
  color: string;
  quantity: string;
  material: string;
  glassType: string;
  glassThickness: string;
  glassColor: string;
  additionalDetails: string;
  updatedAt: string;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  quote?: QuoteResult;
  quoteReady?: boolean;
  quoteContext?: ConversationContext;
  waLink?: string;
}

interface SaidAIProps {
  open: boolean;
  onClose: () => void;
  pendingQuote: { result: QuoteResult; input: CustomInput } | null;
  clearPending: () => void;
  initialProduct?: string | null;
}

const suggestions = [
  '¿Qué es la Serie Nacional 25?',
  '¿Cuánto cuesta la Serie Nacional 25?',
  '¿Qué opciones de la Serie Española tienen disponibles?',
  '¿Qué materiales trabajan?',
  '¿Puedo cotizar según mis medidas?',
];

const officialStructureMaterials = ['Aluminio', 'PVC'];
const officialGlassTypes = ['Vidrio crudo', 'Vidrio laminado', 'Vidrio templado'];
const officialGlassThicknesses = ['6 mm', '8 mm'];
const officialGlassColors = ['Transparente', 'Bronce', 'Azul claro', 'Azul electra'];
const officialStructureColors = ['Natural', 'Negro', 'Blanco', 'Color madera'];

const normalizeForMatch = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

type ProjectSectorId =
  | 'educacion'
  | 'salud'
  | 'residencial'
  | 'corporativo'
  | 'comercial'
  | 'hotelero'
  | 'industrial'
  | 'deportivo'
  | 'institucional'
  | 'publico';

type ProjectSectorProfile = {
  id: ProjectSectorId;
  label: string;
  keywords: RegExp;
  zones: string;
  priorities: string;
};

const projectSectorProfiles: ProjectSectorProfile[] = [
  {
    id: 'educacion',
    label: 'colegio, escuela, instituto o universidad',
    keywords: /\b(colegio|escuela|universidad|instituto|academia|campus|centro educativo|institucion educativa|nido|jardin infantil)\b/i,
    zones: 'aulas, laboratorios, biblioteca, pasillos, oficinas administrativas, accesos y fachadas',
    priorities: 'seguridad, alto tránsito, ventilación, iluminación natural, mantenimiento y control de ruido',
  },
  {
    id: 'salud',
    label: 'clínica, hospital o centro de salud',
    keywords: /\b(clinica|hospital|centro medico|centro de salud|consultorio|policlinico)\b/i,
    zones: 'recepción, consultorios, pasillos, oficinas, divisiones interiores y accesos',
    priorities: 'seguridad, fácil mantenimiento, circulación, iluminación y privacidad según el ambiente',
  },
  {
    id: 'residencial',
    label: 'edificio, condominio o proyecto residencial',
    keywords: /\b(edificio|torre|condominio|residencial|departamento|departamentos|multifamiliar|vivienda|casa)\b/i,
    zones: 'departamentos, balcones, áreas comunes, accesos, ventanas, mamparas y fachadas',
    priorities: 'seguridad, clima, ventilación, iluminación, ruido y durabilidad',
  },
  {
    id: 'corporativo',
    label: 'oficina o proyecto corporativo',
    keywords: /\b(oficina|oficinas|corporativo|coworking|centro empresarial)\b/i,
    zones: 'oficinas, salas de reunión, recepciones, divisiones, puertas y fachadas',
    priorities: 'iluminación, imagen, privacidad, circulación y aislamiento acústico',
  },
  {
    id: 'comercial',
    label: 'local o proyecto comercial',
    keywords: /\b(local|tienda|comercial|centro comercial|retail|showroom|vitrina|supermercado|mercado)\b/i,
    zones: 'fachadas, vitrinas, accesos, puertas, divisiones y ventanas',
    priorities: 'seguridad, visibilidad, alto tránsito, imagen y facilidad de mantenimiento',
  },
  {
    id: 'hotelero',
    label: 'hotel, hospedaje o restaurante',
    keywords: /\b(hotel|hostal|hospedaje|restaurante|cafeteria|cafe|bar)\b/i,
    zones: 'recepción, habitaciones, baños, terrazas, divisiones, accesos y fachadas',
    priorities: 'diseño, seguridad, mantenimiento, privacidad y confort',
  },
  {
    id: 'industrial',
    label: 'planta, fábrica, almacén o taller',
    keywords: /\b(fabrica|planta|industrial|almacen|deposito|taller|nave industrial)\b/i,
    zones: 'oficinas internas, divisiones, accesos, ventanas, cerramientos y áreas de supervisión',
    priorities: 'durabilidad, seguridad, mantenimiento, circulación y exposición ambiental',
  },
  {
    id: 'deportivo',
    label: 'gimnasio, club o centro deportivo',
    keywords: /\b(gimnasio|gym|club|polideportivo|centro deportivo|academia deportiva)\b/i,
    zones: 'salas de entrenamiento, espejos, divisiones, accesos, ventanas y fachadas',
    priorities: 'seguridad, impacto, limpieza, amplitud visual y alto tránsito',
  },
  {
    id: 'institucional',
    label: 'proyecto institucional',
    keywords: /\b(institucion|institucional)\b/i,
    zones: 'accesos, oficinas, ventanas, puertas, divisiones y fachadas',
    priorities: 'seguridad, circulación, iluminación, mantenimiento y durabilidad',
  },
  {
    id: 'publico',
    label: 'institución pública o equipamiento urbano',
    keywords: /\b(municipalidad|municipio|ministerio|institucion publica|entidad publica|biblioteca publica|terminal)\b/i,
    zones: 'atención al público, oficinas, accesos, divisiones, ventanas y fachadas',
    priorities: 'seguridad, alto tránsito, accesibilidad, mantenimiento y durabilidad',
  },
];

const detectProjectSector = (value: string): ProjectSectorProfile | null => {
  const normalized = normalizeForMatch(value);
  return projectSectorProfiles.find((profile) => profile.keywords.test(normalized)) ?? null;
};

const detectEnvironmentFromText = (value: string): string => {
  const normalized = normalizeForMatch(value);
  const orderedMatches: Array<[RegExp, string]> = [
    [/\b(aula|aulas|salon de clases|salones de clase)\b/, 'aula'],
    [/\b(laboratorio|laboratorios)\b/, 'laboratorio'],
    [/\b(biblioteca|bibliotecas)\b/, 'biblioteca'],
    [/\b(pasillo|pasillos|corredor|corredores)\b/, 'pasillo'],
    [/\b(recepcion|recepción)\b/, 'recepción'],
    [/\b(consultorio|consultorios)\b/, 'consultorio'],
    [/\b(sala de reuniones|sala de reunion)\b/, 'sala de reuniones'],
    [/\b(area comun|areas comunes)\b/, 'área común'],
    [/\b(vitrina|vitrinas)\b/, 'vitrina'],
    [/\b(universidad|campus)\b/, 'universidad'],
    [/\b(colegio|escuela|instituto|centro educativo|nido)\b/, 'colegio'],
    [/\b(hospital|clinica|centro medico|centro de salud|consultorio)\b/, 'salud'],
    [/\b(edificio|torre|condominio|residencial|multifamiliar)\b/, 'edificio'],
    [/\b(hotel|hostal|hospedaje)\b/, 'hotel'],
    [/\b(restaurante|cafeteria|cafe|bar)\b/, 'restaurante'],
    [/\b(gimnasio|gym|club|polideportivo)\b/, 'gimnasio'],
    [/\b(fabrica|planta|industrial|almacen|deposito|taller)\b/, 'industrial'],
    [/\b(centro comercial|tienda|showroom|local comercial|local)\b/, 'local'],
    [/\b(oficina|oficinas|corporativo|coworking)\b/, 'oficina'],
    [/\b(bano|ducha)\b/, 'baño'],
    [/\b(terraza)\b/, 'terraza'],
    [/\b(balcon)\b/, 'balcón'],
    [/\b(dormitorio|habitacion|cuarto|cuartos)\b/, 'dormitorio'],
    [/\b(sala|living)\b/, 'sala'],
    [/\b(cocina)\b/, 'cocina'],
    [/\b(entrada principal|ingreso principal|acceso principal)\b/, 'entrada'],
    [/\b(interior|interiores)\b/, 'interior'],
    [/\b(fachada)\b/, 'fachada'],
    [/\b(techo|cubierta)\b/, 'techo'],
    [/\b(division|separacion de ambientes)\b/, 'división'],
    [/\b(casa|vivienda|departamento)\b/, 'vivienda'],
  ];

  return orderedMatches.find(([pattern]) => pattern.test(normalized))?.[1] ?? '';
};

const detectGenericProjectContext = (value: string): string => {
  const match = value.match(/(?:proyecto\s+para|es\s+para|lo\s+(?:quiero|necesito)\s+para)\s+(?:un|una|el|la)?\s*([a-záéíóúñ][a-záéíóúñ0-9\s-]{2,45})/i);
  if (!match?.[1]) return '';
  return match[1]
    .split(/[,.!?;]/)[0]
    .replace(/\s+(?:y|pero|con)\s+.*$/i, '')
    .trim()
    .toLowerCase();
};

const detectProductFromText = (value: string, currentProduct = ''): string => {
  const normalized = normalizeForMatch(value);
  if (/\b(baranda|pasamanos)\b/.test(normalized)) return 'baranda';
  if (/\b(mampara|mamparas)\b/.test(normalized)) return 'mampara';
  if (/\b(ventana|ventanas|ventanal|ventanales)\b/.test(normalized)) return 'ventana';
  if (/\b(puerta|puertas)\b/.test(normalized)) return 'puerta';
  if (/\b(espejo|espejos)\b/.test(normalized)) return 'espejo';
  if (/\b(fachada|fachadas|muro cortina|curtain wall)\b/.test(normalized)) return 'fachada';
  if (/\b(techo|techos|cubierta|cubiertas)\b/.test(normalized)) return 'techo';
  if (/\b(cerramiento|cerramientos)\b/.test(normalized)) return 'cerramiento';
  if (/\b(vitrina|vitrinas)\b/.test(normalized)) return 'vidrio';
  if (/\b(division|divisiones|separacion|separaciones|separacion de ambientes|pared de vidrio|pared divisoria|muro divisorio)\b/.test(normalized)) return 'división';
  if (/\b(proyecto especial|estructura personalizada|estructura de vidrio|estructura en vidrio)\b/.test(normalized)) return 'proyecto especial';

  const asksAboutGlass = /\b(que vidrio|tipo de vidrio|vidrio recomiendas|vidrios tienen|vidrio tienen)\b/.test(normalized);
  const explicitGlassSwitch = /\b(cotizar|comprar|proyecto de)\s+(?:un\s+)?(?:vidrio|cristal)\b/.test(normalized);

  // Respuestas como "vidrio templado" dentro de una ventana/mampara son especificaciones, no un cambio de producto.
  if (currentProduct && /\b(crudo|laminado|templado)\b/.test(normalized) && !explicitGlassSwitch) return '';

  const explicitGlassProject = explicitGlassSwitch
    || (!currentProduct && (/^(vidrio|cristal)\b/.test(normalized) || /\b(necesito|quiero)\s+(?:un\s+)?(?:vidrio|cristal)\b/.test(normalized)));
  if (explicitGlassProject && !asksAboutGlass) return 'vidrio';

  // "aluminio" y "PVC" son materiales de estructura, no deben borrar el producto actual.
  if (currentProduct && /\b(aluminio|pvc)\b/.test(normalized)) return '';
  return '';
};

const detectNeedFromText = (value: string): string => {
  const normalized = normalizeForMatch(value);

  if (/\b(ruido|sonido|acustic|aislar|aislada|aislado|insonorizar|insonorizacion)\b/.test(normalized)) return 'aislamiento';
  if (/\b(rompio|rompieron|quebro|quebraron|golpe|golpes|impacto|proteccion|seguridad)\b/.test(normalized)) return 'seguridad';
  if (/\b(resistente|resistencia|durable|durabilidad|alto transito|mucho uso|uso frecuente|mantenimiento)\b/.test(normalized)) return 'durabilidad';
  if (/\b(privacidad|privado|que no se vea|que no vean)\b/.test(normalized)) return 'privacidad';
  if (/\b(ventilar|ventilacion|aire)\b/.test(normalized)) return 'ventilación';
  if (/\b(iluminacion|luz natural|mas luz|que entre luz)\b/.test(normalized)) return 'iluminación';
  if (/\b(control solar|mucho sol|sol directo|calor por el sol|clima)\b/.test(normalized)) return 'clima';
  if (/\b(diseno|moderno|elegante|bonito|estetica|estetico)\b/.test(normalized)) return 'diseño';

  const match = normalized.match(/\b(privacidad|seguridad|diseno|aislamiento|ruido|acustico|clima|ventilacion|iluminacion|control solar|durabilidad|mantenimiento|resistencia|alto transito)\b/);
  if (!match) return '';
  if (match[1] === 'diseno') return 'diseño';
  if (match[1] === 'acustico' || match[1] === 'ruido') return 'aislamiento';
  if (match[1] === 'control solar') return 'clima';
  if (match[1] === 'mantenimiento' || match[1] === 'resistencia' || match[1] === 'alto transito') return 'durabilidad';
  return match[1];
};

const detectClimateFromText = (value: string): string => {
  const normalized = normalizeForMatch(value);
  const match = normalized.match(/(lluvia(?:\s+fuerte|\s+constante)?|viento(?:\s+fuerte|\s+constante)?|mucho\s+(?:sol|viento|lluvia)|sol\s+(?:directo|fuerte)|clima\s+(?:lluvioso|ventoso|soleado)|expuesto\s+(?:al\s+)?(?:sol|viento|clima)|zona\s+(?:muy\s+)?(?:lluviosa|ventosa|soleada)|entra\s+(?:mucho\s+)?viento|le\s+cae\s+lluvia)/i);
  return match?.[0] ?? '';
};

const detectColorFromText = (value: string): string => {
  const normalized = normalizeForMatch(value);
  if (/\bcolor madera\b/.test(normalized)) return 'madera';
  return normalized.match(/\b(negro|blanco|natural|madera)\b/)?.[1] ?? '';
};

const detectMaterialFromText = (value: string): string => normalizeForMatch(value).match(/\b(aluminio|pvc)\b/)?.[1] ?? '';
const detectGlassTypeFromText = (value: string): string => normalizeForMatch(value).match(/\b(templado|laminado|crudo)\b/)?.[1] ?? '';
const detectThicknessFromText = (value: string): string => {
  const match = normalizeForMatch(value).match(/\b(6|8)\s*mm\b/);
  return match ? `${match[1]}mm` : '';
};
const detectGlassColorFromText = (value: string): string => normalizeForMatch(value).match(/\b(transparente|bronce|azul claro|azul electra)\b/)?.[1] ?? '';

const extractMeasuresFromText = (value: string): string => {
  const match = value.match(/\d+(?:[.,]\d+)?\s*(?:mm|cm|m)?\s*(?:x|×|por)\s*\d+(?:[.,]\d+)?\s*(?:mm|cm|m)?/i);
  return match?.[0]?.trim() ?? '';
};

type ParsedCatalogMeasure = {
  widthCm: string;
  heightCm: string;
  display: string;
};

const parseCatalogMeasures = (value: string): ParsedCatalogMeasure | null => {
  const pair = value.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?\s*(?:x|×|por)\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i);
  if (pair) {
    const rawA = Number(pair[1].replace(',', '.'));
    const rawB = Number(pair[3].replace(',', '.'));
    const inferUnit = (raw: number): 'm' | 'cm' => raw <= 10 ? 'm' : 'cm';
    const unitA = (pair[2] || inferUnit(rawA)).toLowerCase();
    const unitB = (pair[4] || inferUnit(rawB)).toLowerCase();
    const toCm = (raw: string, unit: string) => {
      const number = Number(raw.replace(',', '.'));
      if (!Number.isFinite(number) || number <= 0) return NaN;
      if (unit === 'm') return number * 100;
      if (unit === 'mm') return number / 10;
      return number;
    };
    const widthCm = toCm(pair[1], unitA);
    const heightCm = toCm(pair[3], unitB);
    if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm)) return null;
    return {
      widthCm: String(widthCm),
      heightCm: String(heightCm),
      display: pair[0].trim(),
    };
  }

  const explicitWidth = value.match(/(?:ancho|width)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i);
  const explicitHeight = value.match(/(?:alto|height)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/i);
  if (!explicitWidth || !explicitHeight) return null;

  const rawWidth = Number(explicitWidth[1].replace(',', '.'));
  const rawHeight = Number(explicitHeight[1].replace(',', '.'));
  const inferUnit = (raw: number): 'm' | 'cm' => raw <= 10 ? 'm' : 'cm';
  const toCm = (raw: string, unit: string) => {
    const number = Number(raw.replace(',', '.'));
    if (!Number.isFinite(number) || number <= 0) return NaN;
    if (unit === 'm') return number * 100;
    if (unit === 'mm') return number / 10;
    return number;
  };
  const widthCm = toCm(explicitWidth[1], (explicitWidth[2] || inferUnit(rawWidth)).toLowerCase());
  const heightCm = toCm(explicitHeight[1], (explicitHeight[2] || inferUnit(rawHeight)).toLowerCase());
  if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm)) return null;
  return {
    widthCm: String(widthCm),
    heightCm: String(heightCm),
    display: `${explicitWidth[0]} · ${explicitHeight[0]}`,
  };
};

type RegisteredWindowSystem = (typeof windowSystems)[number];

type SeriesPriceEstimate = {
  system: RegisteredWindowSystem;
  total: number;
  areaM2: number | null;
  linearFeet: number | null;
  quantity: number;
  quoteUnit: string;
};

const isRegisteredQuoteSeries = (system: RegisteredWindowSystem): boolean =>
  system.category === 'Serie Nacional' || system.category === 'Serie Española';

const getSeriesCatalogProduct = (system: RegisteredWindowSystem): Product | null =>
  products.find((product) => product.id === system.id) ?? null;

const getSeriesQuoteUnit = (system: RegisteredWindowSystem): string => {
  // products.ts es la fuente más específica de la unidad comercial.
  // En pricing.ts algunas series antiguas aparecen como "m", pero en el
  // catálogo oficial están registradas por m². Para la cotización de Zhaid
  // usamos la unidad del producto cuando existe.
  const catalogUnit = normalizeForMatch(String(getSeriesCatalogProduct(system)?.unit ?? '')).replace(/\s+/g, '');
  if (catalogUnit) return catalogUnit;

  const legacyUnit = normalizeForMatch(String(system.unit ?? '')).replace(/\s+/g, '');
  if (legacyUnit === 'm') return 'm²';
  return legacyUnit;
};


const getSeriesCatalogCategoryForProduct = (product: string): string | null => {
  const normalized = normalizeForMatch(product);
  if (/ventana/.test(normalized)) return 'Sistemas de aluminio';
  if (/mampara/.test(normalized)) return 'Mamparas';
  if (/techo|cubierta/.test(normalized)) return 'Techos de vidrio';
  return null;
};

const isSeriesCompatibleWithContext = (
  system: RegisteredWindowSystem,
  context: ConversationContext
): boolean => {
  const targetCategory = getSeriesCatalogCategoryForProduct(context.product);
  if (!targetCategory) return false;

  const catalogProduct = getSeriesCatalogProduct(system);
  if (!catalogProduct) return false;
  return catalogProduct.category === targetCategory;
};

const hasSeriesOptionsForContext = (context: ConversationContext): boolean =>
  windowSystems
    .filter(isRegisteredQuoteSeries)
    .some((system) => isSeriesCompatibleWithContext(system, context));

const calculateRegisteredSeriesEstimate = (
  system: RegisteredWindowSystem,
  measures: string,
  quantity: string
): SeriesPriceEstimate | null => {
  const quantityValue = Number(quantity);
  if (!Number.isFinite(quantityValue) || quantityValue <= 0) return null;

  const unit = getSeriesQuoteUnit(system);
  const price = Number(system.price);
  if (!Number.isFinite(price) || price < 0) return null;

  if (unit === 'm²' || unit === 'm2' || unit === 'm^2' || unit === 'm') {
    const parsed = parseCatalogMeasures(measures);
    if (!parsed) return null;
    const widthCm = Number(parsed.widthCm);
    const heightCm = Number(parsed.heightCm);
    if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) return null;

    const areaM2 = (widthCm * heightCm) / 10000;
    return {
      system,
      total: price * areaM2 * quantityValue,
      areaM2,
      linearFeet: null,
      quantity: quantityValue,
      quoteUnit: 'm²',
    };
  }

  // Las series registradas por "pie" se interpretan como PIE LINEAL.
  // Para un estimado inicial se usa el perímetro exterior de la pieza.
  if (unit === 'pie') {
    const parsed = parseCatalogMeasures(measures);
    if (!parsed) return null;
    const widthCm = Number(parsed.widthCm);
    const heightCm = Number(parsed.heightCm);
    if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) return null;

    const perimeterM = (2 * (widthCm + heightCm)) / 100;
    const linearFeet = perimeterM / 0.3048;
    return {
      system,
      total: price * linearFeet * quantityValue,
      areaM2: null,
      linearFeet,
      quantity: quantityValue,
      quoteUnit: 'pie lineal',
    };
  }

  if (unit === 'und' || unit === 'unidad' || unit === 'unidades') {
    return {
      system,
      total: price * quantityValue,
      areaM2: null,
      linearFeet: null,
      quantity: quantityValue,
      quoteUnit: 'und',
    };
  }

  return null;
};

const selectSeriesRecommendation = (
  context: ConversationContext,
  estimates: SeriesPriceEstimate[]
): { estimate: SeriesPriceEstimate; reason: string } | null => {
  if (!estimates.length) return null;

  const normalized = normalizeForMatch(
    `${context.environment} ${context.need} ${context.climate} ${context.additionalDetails}`
  );
  const sector = detectProjectSector(`${context.environment} ${context.additionalDetails}`);
  const wantsBudget = /\b(economico|economica|barato|barata|presupuesto|ahorrar|precio bajo|mas barato)\b/.test(normalized);

  if (wantsBudget) {
    const estimate = [...estimates].sort((a, b) => a.total - b.total)[0];
    return { estimate, reason: 'es la alternativa de menor importe entre las opciones compatibles registradas' };
  }

  const scored = estimates.map((estimate) => {
    const product = getSeriesCatalogProduct(estimate.system);
    const haystack = normalizeForMatch(
      `${product?.description ?? ''} ${(product?.features ?? []).join(' ')} ${(product?.materials ?? []).join(' ')} ${product?.glassType ?? ''}`
    );
    const glass = normalizeForMatch(String(product?.glassType ?? ''));
    let score = 0;
    const reasons: string[] = [];

    const needsIsolation = /\b(aislamiento|ruido|acustico|sonido)\b/.test(normalized);
    const needsSafety = /\b(seguridad|durabilidad|impacto|golpe|resistencia|alto transito)\b/.test(normalized)
      || ['educacion', 'salud', 'comercial', 'deportivo', 'publico', 'institucional'].includes(sector?.id ?? '');
    const exposed = /\b(viento|lluvia|exterior|fachada|terraza|balcon|clima)\b/.test(normalized);
    const wantsDesign = /\b(diseno|moderno|elegante|premium|estetica)\b/.test(normalized)
      || ['corporativo', 'hotelero'].includes(sector?.id ?? '');
    const wantsLight = /\b(iluminacion|luz|claridad|luminoso)\b/.test(normalized);

    if (needsIsolation) {
      const specificallyAcoustic = /\b(ruido|acustico|sonido)\b/.test(normalized);
      if (specificallyAcoustic && /acustic/.test(haystack)) {
        score += 12;
        reasons.push('tiene una característica acústica registrada y encaja mejor con tu prioridad de ruido');
      } else if (/aislamiento/.test(haystack)) {
        score += 7;
        reasons.push('tiene características registradas orientadas al aislamiento');
      }
      if (glass === 'laminado') score += 3;
    }

    if (needsSafety) {
      if (glass === 'templado') score += 6;
      if (glass === 'laminado') score += 5;
      if (glass === 'crudo') score -= 5;
      if (/segur|resistencia|estable|cierre seguro|uso exigente/.test(haystack)) {
        score += 4;
        reasons.push('encaja mejor con una prioridad de seguridad y uso frecuente');
      }
    }

    if (exposed) {
      if (glass === 'laminado') score += 4;
      if (/fachada|gran abertura/.test(haystack)) {
        score += 8;
        reasons.push('está mejor orientada a fachadas o grandes aberturas expuestas');
      } else if (/resistencia|exterior/.test(haystack)) {
        score += 5;
        reasons.push('tiene características registradas útiles para una zona expuesta');
      } else if (/termico/.test(haystack)) {
        score += 2;
      }
    }

    if (wantsDesign) {
      if (/premium|acabado|contemporaneo|refinad|estetica/.test(haystack)) {
        score += 3;
        reasons.push('ofrece una propuesta de acabado más orientada a diseño');
      }
    }

    if (wantsLight) {
      if (/claridad|luz|luminos/.test(haystack)) {
        score += 4;
        reasons.push('prioriza claridad e iluminación');
      }
      if (glass === 'crudo' && !needsSafety) score += 1;
    }

    if (!normalized.trim() || (!needsIsolation && !needsSafety && !exposed && !wantsDesign && !wantsLight)) {
      if (estimate.system.id === 'serie-25') score += 2;
    }

    return { estimate, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score || a.estimate.total - b.estimate.total);
  const best = scored[0];
  const reason = best.reasons[0]
    ?? 'es la opción que mejor encaja como primera referencia con los datos que me diste';

  return { estimate: best.estimate, reason };
};

const buildRegisteredSeriesEstimate = (
  context: ConversationContext,
  userText = ''
): string | null => {
  const currentMeasures = extractMeasuresFromText(userText) || context.measures;
  const currentQuantity = detectQuantityFromText(userText) || context.quantity;
  const normalizedMeasures = normalizeForMatch(currentMeasures);
  const normalizedQuantity = normalizeForMatch(currentQuantity);

  if (
    !currentMeasures ||
    !currentQuantity ||
    /por confirmar|por definir|pendiente/.test(normalizedMeasures) ||
    /por confirmar|por definir|pendiente/.test(normalizedQuantity)
  ) {
    return null;
  }

  const allRegisteredSystems = windowSystems.filter(isRegisteredQuoteSeries);
  const compatibleSystems = allRegisteredSystems.filter((system) => isSeriesCompatibleWithContext(system, context));
  if (!allRegisteredSystems.length) return null;

  const normalizedText = normalizeForMatch(userText);
  const normalizedContextSeries = normalizeForMatch(context.series);
  const exactSystem = getSystemFromQuestion(userText)
    ?? allRegisteredSystems.find((system) => normalizeForMatch(system.name) === normalizedContextSeries)
    ?? null;

  let candidateSystems: RegisteredWindowSystem[] = exactSystem
    ? [exactSystem]
    : (compatibleSystems.length ? compatibleSystems : allRegisteredSystems);

  if (!exactSystem) {
    const asksNational = /\bserie nacional\b|\bnacional(?:es)?\b/.test(normalizedText);
    const asksEuropean = /\bserie espanola\b|\bespanola(?:s)?\b|\bserie europea\b|\beuropea(?:s)?\b/.test(normalizedText);
    if (asksNational && !asksEuropean) {
      candidateSystems = candidateSystems.filter((system) => system.category === 'Serie Nacional');
    } else if (asksEuropean && !asksNational) {
      candidateSystems = candidateSystems.filter((system) => system.category === 'Serie Española');
    }
  }

  const estimates = candidateSystems
    .map((system) => calculateRegisteredSeriesEstimate(system, currentMeasures, currentQuantity))
    .filter((estimate): estimate is SeriesPriceEstimate => Boolean(estimate));

  if (!estimates.length) return null;

  const footer = '✅ Instalación: gratis. 🔧 Los materiales, accesorios o trabajos adicionales sin precio registrado se confirman con el asesor.';

  if (estimates.length === 1) {
    const estimate = estimates[0];
    const areaText = estimate.areaM2 !== null
      ? ` (${estimate.areaM2.toFixed(2)} m² × ${estimate.quantity} und.)`
      : estimate.linearFeet !== null
        ? ` (${estimate.linearFeet.toFixed(2)} pies lineales × ${estimate.quantity} und.; base por perímetro)`
        : ` (${estimate.quantity} und.)`;

    const catalogProduct = getSeriesCatalogProduct(estimate.system);
    const expectedCategory = getSeriesCatalogCategoryForProduct(context.product);
    const mismatchNote = catalogProduct && expectedCategory && catalogProduct.category !== expectedCategory
      ? `\nℹ️ ${estimate.system.name} está registrada en el catálogo como ${catalogProduct.category}; puedo calcularla porque la pediste, pero para tu ${context.product} conviene confirmar la aplicación con el asesor.`
      : '';

    return `💰 Aproximado con ${estimate.system.name}: ${formatCurrency(estimate.total)}${areaText}.${mismatchNote}\n${footer}`;
  }

  const recommendation = selectSeriesRecommendation(context, estimates);
  const lines = estimates.map((estimate) => {
    const basis = estimate.areaM2 !== null
      ? `${estimate.areaM2.toFixed(2)} m² por unidad`
      : estimate.linearFeet !== null
        ? `${estimate.linearFeet.toFixed(2)} pies lineales por unidad, base por perímetro`
        : `${estimate.quantity} unidad(es)`;
    const categoryLabel = estimate.system.category === 'Serie Española' ? 'Serie Española/Europea' : 'Serie Nacional';
    const mark = recommendation?.estimate.system.id === estimate.system.id ? ' ⭐' : '';
    return `• ${estimate.system.name}${mark} (${categoryLabel}): aprox. ${formatCurrency(estimate.total)} · ${basis}`;
  });

  const recommendationLine = recommendation
    ? `\n⭐ Como primera referencia te recomendaría ${recommendation.estimate.system.name}, porque ${recommendation.reason}.`
    : '';

  return `💰 Cotización aproximada según tus medidas y cantidad:
${lines.join('\n')}${recommendationLine}
${footer}`;
};

type CatalogProductPriceEstimate = {
  product: Product;
  total: number;
  areaM2: number | null;
  linearFeet: number | null;
  quantity: number;
};

const calculateCatalogProductEstimate = (
  product: Product,
  measures: string,
  quantity: string
): CatalogProductPriceEstimate | null => {
  if (isStructureCatalogProduct(product)) return null;

  const price = Number(product.priceFrom ?? product.price ?? 0);
  const quantityValue = Number(quantity);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(quantityValue) || quantityValue <= 0) return null;

  const unit = normalizeForMatch(String(product.unit ?? '')).replace(/\s+/g, '');

  if (unit === 'm²' || unit === 'm2' || unit === 'm^2') {
    const parsed = parseCatalogMeasures(measures);
    if (!parsed) return null;
    const widthCm = Number(parsed.widthCm);
    const heightCm = Number(parsed.heightCm);
    if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) return null;
    const areaM2 = (widthCm * heightCm) / 10000;
    return { product, total: price * areaM2 * quantityValue, areaM2, linearFeet: null, quantity: quantityValue };
  }

  if (unit === 'pie') {
    const parsed = parseCatalogMeasures(measures);
    if (!parsed) return null;
    const widthCm = Number(parsed.widthCm);
    const heightCm = Number(parsed.heightCm);
    if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) return null;
    const perimeterM = (2 * (widthCm + heightCm)) / 100;
    const linearFeet = perimeterM / 0.3048;
    return { product, total: price * linearFeet * quantityValue, areaM2: null, linearFeet, quantity: quantityValue };
  }

  if (unit === 'und' || unit === 'unidad' || unit === 'unidades') {
    return { product, total: price * quantityValue, areaM2: null, linearFeet: null, quantity: quantityValue };
  }

  return null;
};

const getCatalogProductsForContext = (context: ConversationContext): Product[] => {
  const productKey = normalizeForMatch(context.product);
  const glassKey = normalizeForMatch(context.glassType);

  const patterns: Array<[RegExp, RegExp]> = [
    [/mampara/, /mampara/],
    [/puerta/, /puerta/],
    [/espejo/, /espejo/],
    [/fachada/, /fachada|muro cortina/],
    [/baranda/, /baranda|pasamanos/],
    [/techo/, /techo|cubierta/],
    [/cerramiento/, /cerramiento/],
    [/division/, /division|separacion/],
    [/vidrio/, /vidrio|cristal|templado|laminado|crudo/],
  ];

  const matcher = patterns.find(([contextPattern]) => contextPattern.test(productKey))?.[1];
  if (!matcher) return [];

  return products.filter((product) => {
    if (isStructureCatalogProduct(product)) return false;

    const haystack = normalizeForMatch(
      `${product.name} ${product.category} ${product.id} ${product.glassType ?? ''}`
    );
    if (!matcher.test(haystack)) return false;

    if (glassKey) {
      const productGlass = normalizeForMatch(String(product.glassType ?? ''));
      if (productGlass && !productGlass.includes(glassKey) && !haystack.includes(glassKey)) {
        return false;
      }
    }

    return true;
  });
};

type GenericReferenceEstimate = {
  label: string;
  total: number;
  areaM2: number;
  unitPrice: number;
};

const calculatePriceTableReference = (
  context: ConversationContext,
  measures: string,
  quantity: string
): GenericReferenceEstimate | null => {
  const parsed = parseCatalogMeasures(measures);
  const quantityValue = Number(quantity);
  if (!parsed || !Number.isFinite(quantityValue) || quantityValue <= 0) return null;

  const widthCm = Number(parsed.widthCm);
  const heightCm = Number(parsed.heightCm);
  if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) return null;

  const areaM2 = (widthCm * heightCm) / 10000;
  const productKey = normalizeForMatch(context.product);
  const glassKey = normalizeForMatch(context.glassType);
  const thicknessKey = normalizeForMatch(context.glassThickness).replace(/\s+/g, '');

  let candidates = priceTable.filter((row) => {
    const name = normalizeForMatch(row.product);
    if (/espejo/.test(productKey)) return /espejo/.test(name);
    if (/puerta/.test(productKey)) return /puerta de vidrio/.test(name);
    if (/mampara/.test(productKey) && normalizeForMatch(context.environment) === 'bano') return /mampara de bano/.test(name);
    if (/templado/.test(glassKey)) return /vidrio templado/.test(name);
    if (/laminado/.test(glassKey)) return /vidrio laminado/.test(name);
    if (/crudo/.test(glassKey)) return /vidrio flotado/.test(name);
    return false;
  });

  if (thicknessKey && candidates.length) {
    const sameThickness = candidates.filter((row) =>
      normalizeForMatch(row.thickness).replace(/\s+/g, '') === thicknessKey
    );
    if (sameThickness.length) candidates = sameThickness;
    else if (!/espejo/.test(productKey)) candidates = [];
  }

  const row = candidates[0];
  if (!row) return null;

  return {
    label: `${row.product}${row.thickness ? ` ${row.thickness}` : ''}`,
    total: row.pricePerM2 * areaM2 * quantityValue,
    areaM2,
    unitPrice: row.pricePerM2,
  };
};

const calculateGenericGlassReference = (
  context: ConversationContext,
  measures: string,
  quantity: string
): GenericReferenceEstimate | null => {
  if (!hasConfirmedValue(context.glassType)) return null;

  const parsed = parseCatalogMeasures(measures);
  const quantityValue = Number(quantity);
  if (!parsed || !Number.isFinite(quantityValue) || quantityValue <= 0) return null;

  const widthCm = Number(parsed.widthCm);
  const heightCm = Number(parsed.heightCm);
  if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) return null;

  const normalizedGlass = normalizeForMatch(context.glassType);
  const glass = glassTypes.find((item) => normalizeForMatch(item.name) === normalizedGlass);
  if (!glass) return null;

  const thickness = normalizeForMatch(context.glassThickness).replace(/\s+/g, '');
  const multiplier = thickness && thicknessMultiplier[thickness] ? thicknessMultiplier[thickness] : 1;
  const unitPrice = Math.round((glass.pricePerM2 * multiplier) / 5) * 5;
  const areaM2 = (widthCm * heightCm) / 10000;

  return {
    label: `Vidrio ${glass.name}${hasConfirmedValue(context.glassThickness) ? ` ${context.glassThickness}` : ''}`,
    total: unitPrice * areaM2 * quantityValue,
    areaM2,
    unitPrice,
  };
};

const buildCatalogProductEstimate = (context: ConversationContext, userText = ''): string | null => {
  const measures = extractMeasuresFromText(userText) || context.measures;
  const quantity = detectQuantityFromText(userText) || context.quantity;
  if (!hasConfirmedValue(measures) || !hasConfirmedValue(quantity)) return null;

  const estimates = getCatalogProductsForContext(context)
    .map((product) => calculateCatalogProductEstimate(product, measures, quantity))
    .filter((estimate): estimate is CatalogProductPriceEstimate => Boolean(estimate));

  if (estimates.length) {
    const unique = new Map<string, CatalogProductPriceEstimate>();
    for (const estimate of estimates) {
      const key = normalizeForMatch(estimate.product.id || estimate.product.name);
      if (!unique.has(key)) unique.set(key, estimate);
    }

    const lines = [...unique.values()].slice(0, 8).map((estimate) => {
      const basis = estimate.areaM2 !== null
        ? `${estimate.areaM2.toFixed(2)} m² × ${estimate.quantity} und.`
        : estimate.linearFeet !== null
          ? `${estimate.linearFeet.toFixed(2)} pies lineales × ${estimate.quantity} und.; base por perímetro`
          : `${estimate.quantity} und.`;
      return `• ${estimate.product.name}: aprox. ${formatCurrency(estimate.total)} (${basis})`;
    });

    return `💰 Cotización aproximada con las opciones registradas:
${lines.join('\n')}
✅ Instalación: gratis.
🔧 Accesorios, estructura u otros conceptos sin precio registrado se confirman con el asesor.`;
  }

  const reference = calculatePriceTableReference(context, measures, quantity)
    ?? calculateGenericGlassReference(context, measures, quantity);

  if (!reference) return null;

  const quantityValue = Number(quantity);
  return `💰 Cotización aproximada del componente con precio registrado:
• ${reference.label}: aprox. ${formatCurrency(reference.total)}
  ${reference.areaM2.toFixed(2)} m² por unidad × ${quantityValue} und. · referencia ${formatCurrency(reference.unitPrice)}/m²
✅ Instalación: gratis.
🔧 Estructura, perfilería, accesorios u otros conceptos sin precio registrado se confirman con el asesor.`;
};

const buildApproximateQuote = (context: ConversationContext, userText = ''): string | null => {
  if (hasConfirmedValue(context.series) || hasSeriesOptionsForContext(context)) {
    return buildRegisteredSeriesEstimate(context, userText);
  }
  return buildCatalogProductEstimate(context, userText);
};

const buildBudgetSeriesRecommendation = (context: ConversationContext): string => {
  const estimates = windowSystems
    .filter(isRegisteredQuoteSeries)
    .filter((system) => isSeriesCompatibleWithContext(system, context))
    .map((system) => calculateRegisteredSeriesEstimate(system, context.measures, context.quantity))
    .filter((estimate): estimate is SeriesPriceEstimate => Boolean(estimate));

  if (!estimates.length) {
    return 'Puedo recomendarte una serie, pero primero necesito medidas y cantidad para comparar las opciones registradas. 📐';
  }

  const recommendation = selectSeriesRecommendation(context, estimates);
  if (!recommendation) return 'Puedo mostrarte las series registradas y sus aproximados para que elijas la que prefieras.';

  const best = recommendation.estimate;
  const detail = best.areaM2 !== null
    ? `${best.areaM2.toFixed(2)} m² por unidad`
    : best.linearFeet !== null
      ? `${best.linearFeet.toFixed(2)} pies lineales por unidad como base por perímetro`
      : `${best.quantity} unidad(es)`;

  return `Por lo que me contaste, usaría ${best.system.name} como primera referencia 👍, porque ${recommendation.reason}. Con tus medidas queda aprox. en ${formatCurrency(best.total)} (${detail}). ¿La usamos como referencia para esta cotización?`;
};

const detectQuantityFromText = (value: string): string => {
  const normalized = normalizeForMatch(value);
  const numeric = normalized.match(/(?:cantidad|necesito|quiero|serian|seran|son)\s*[:=]?\s*(\d+)\b/i)
    ?? normalized.match(/\b(\d+)\s+(?:ventanas?|mamparas?|puertas?|vidrios?|espejos?|barandas?|piezas?|unidades?|und|uds)\b/i);
  if (numeric?.[1]) return numeric[1];

  const word = normalized.match(/\b(una?|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)(?:\s+(?:ventanas?|mamparas?|puertas?|vidrios?|espejos?|barandas?|piezas?|unidades?))?\b/i)?.[1];
  const words: Record<string, string> = {
    un: '1', una: '1', uno: '1', dos: '2', tres: '3', cuatro: '4', cinco: '5',
    seis: '6', siete: '7', ocho: '8', nueve: '9', diez: '10',
  };
  return word ? words[word] ?? '' : '';
};

const detectOpeningPreference = (value: string): string => {
  const normalized = normalizeForMatch(value);
  if (/\b(corrediza|corredizo|corredera)\b/.test(normalized)) return 'corrediza';
  if (/\b(abatible|batiente)\b/.test(normalized)) return 'abatible';
  if (/\b(fija|fijo)\b/.test(normalized)) return 'fija';
  if (/\b(plegable|plegadiza)\b/.test(normalized)) return 'plegable';
  if (/apertura[^\n]*(?:por confirmar|por definir)/.test(normalized)) return 'por confirmar';
  return '';
};

const appendAdditionalDetails = (previous: string, value: string): string => {
  const next = value.trim();
  if (!next) return previous;
  if (!previous) return next;
  if (normalizeForMatch(previous).includes(normalizeForMatch(next))) return previous;
  return `${previous}\n${next}`.slice(-1600);
};

const isFramePriceQuestion = (value: string): boolean => {
  const normalized = normalizeForMatch(value);
  return /\b(precio|cuanto cuesta|costo|valor)\b/.test(normalized)
    && /\b(marco|estructura|perfil|perfileria|aluminio|pvc)\b/.test(normalized);
};

const getQuoteSubtotalWithoutFrame = (quote: QuoteResult): number => {
  const glassCost = Number.isFinite(quote.glassCost) ? Math.max(0, quote.glassCost) : 0;
  // La instalación es gratis para Zhaid Glass Solutions. Aunque una cotización
  // antigua traiga installationCost, no se suma ni se muestra como cargo.
  return glassCost;
};

const getProductAdvice = (product: string, sector?: ProjectSectorProfile | null): string => {
  const sectorText = sector ? ` en ${sector.label}` : '';
  const advice: Record<string, string> = {
    ventana: `Para ventanas${sectorText}, priorizaría seguridad, ventilación y fácil mantenimiento.`,
    puerta: `Para puertas${sectorText}, priorizaría seguridad, tránsito y un sistema de apertura cómodo.`,
    mampara: `Para mamparas${sectorText}, conviene equilibrar seguridad, apertura y privacidad según el uso.`,
    vidrio: `Para vidrio a medida${sectorText}, la mejor opción depende del uso, la medida y la seguridad que necesites.`,
    fachada: `Para fachadas${sectorText}, hay que priorizar seguridad, viento, sol y el sistema de fijación.`,
    baranda: `Para barandas${sectorText}, la seguridad y el sistema de anclaje son lo primero.`,
    techo: `Para techos o cubiertas${sectorText}, hay que validar soporte, seguridad y exposición al clima.`,
    espejo: `Para espejos${sectorText}, podemos definir medida, cantidad y acabado según el ambiente.`,
    cerramiento: `Para cerramientos${sectorText}, primero definimos apertura, clima y nivel de protección.`,
    'división': `Para divisiones${sectorText}, podemos priorizar iluminación, privacidad y circulación.`,
    'proyecto especial': `Para un proyecto especial${sectorText}, te voy guiando dato por dato hasta dejarlo listo para cotizar.`,
  };
  return advice[product] ?? `Te ayudo a definirlo paso a paso${sectorText} hasta dejarlo listo para cotizar.`;
};

type GlassRecommendation = {
  glassType: 'crudo' | 'laminado' | 'templado';
  reason: string;
  technicalCheck?: boolean;
};

const pickStableVariant = <T,>(seed: string, options: T[]): T => {
  const normalized = normalizeForMatch(seed);
  const score = [...normalized].reduce((total, character) => total + character.charCodeAt(0), 0);
  return options[score % options.length];
};

const getContextualGlassRecommendation = (
  context: ConversationContext,
  productOverride = ''
): GlassRecommendation => {
  const product = normalizeProductContext(productOverride || context.product);
  const environment = normalizeForMatch(context.environment);
  const need = normalizeForMatch(context.need);
  const climate = normalizeForMatch(context.climate);
  const details = normalizeForMatch(context.additionalDetails);
  const sector = detectProjectSector(`${context.environment} ${context.additionalDetails}`);

  const exposedToWeather = Boolean(climate) || /\b(exterior|fachada|balcon|terraza|viento|lluvia|expuesto)\b/.test(`${environment} ${details}`);
  const wantsIsolation = /\b(aislamiento|ruido|acustic|termic)\b/.test(`${need} ${details}`);
  const wantsSecurity = /\b(seguridad|proteccion|impacto)\b/.test(`${need} ${details}`);
  const isSafetyCritical = /^(fachada|baranda|techo)$/.test(product);

  if (isSafetyCritical) {
    return {
      glassType: 'laminado',
      reason: 'en este tipo de elemento conviene priorizar que el vidrio permanezca unido si llega a romperse',
      technicalCheck: true,
    };
  }

  if (environment === 'baño' || /\b(ducha|mampara de bano)\b/.test(details)) {
    return {
      glassType: 'templado',
      reason: 'es una opción muy práctica para mamparas y zonas de uso diario',
    };
  }

  if (sector?.id === 'educacion') {
    if (wantsIsolation || (exposedToWeather && product === 'ventana')) {
      return {
        glassType: 'laminado',
        reason: 'ayuda a priorizar seguridad y confort en ventanas expuestas o cuando también importa el ruido',
      };
    }
    return {
      glassType: 'templado',
      reason: 'encaja muy bien en zonas de uso frecuente como aulas, puertas y divisiones',
    };
  }

  if (sector?.id === 'corporativo' || environment === 'oficina' || environment === 'sala de reuniones') {
    if (wantsIsolation && product === 'ventana') {
      return {
        glassType: 'laminado',
        reason: 'para una ventana de oficina da una mejor base cuando también importa el aislamiento',
      };
    }
    return {
      glassType: 'templado',
      reason: 'funciona muy bien en puertas, mamparas y divisiones de oficina por su uso frecuente y acabado limpio',
    };
  }

  if (sector?.id === 'salud') {
    if (wantsIsolation) {
      return {
        glassType: 'laminado',
        reason: 'es una buena base cuando además se busca separar mejor ambientes y reducir ruido',
      };
    }
    return {
      glassType: 'templado',
      reason: 'es una opción práctica para puertas y divisiones interiores de uso frecuente',
    };
  }

  if (sector?.id === 'comercial' || environment === 'local' || environment === 'vitrina') {
    if (wantsSecurity && /ventana|fachada|cerramiento/.test(product)) {
      return {
        glassType: 'laminado',
        reason: 'para un frente comercial con prioridad en seguridad partiría de una solución laminada',
      };
    }
    return {
      glassType: 'templado',
      reason: 'es una alternativa muy versátil para accesos, vitrinas, puertas y divisiones de alto uso',
    };
  }

  if (sector?.id === 'hotelero') {
    if (environment === 'baño' || /mampara|puerta|división/.test(product)) {
      return {
        glassType: 'templado',
        reason: 'va muy bien en baños, puertas y divisiones donde se busca seguridad y una apariencia limpia',
      };
    }
    if (wantsIsolation || exposedToWeather) {
      return {
        glassType: 'laminado',
        reason: 'es una mejor base cuando el proyecto también necesita protección exterior o confort acústico',
      };
    }
  }

  if (sector?.id === 'deportivo') {
    return {
      glassType: 'templado',
      reason: 'en zonas deportivas e interiores de alto uso conviene una opción resistente y fácil de integrar',
    };
  }

  if (sector?.id === 'industrial') {
    if (exposedToWeather || wantsSecurity) {
      return {
        glassType: 'laminado',
        reason: 'para exposición o prioridad de seguridad partiría de una solución laminada',
      };
    }
    return {
      glassType: 'templado',
      reason: 'para puertas y divisiones interiores ofrece una solución práctica para uso frecuente',
    };
  }

  if (sector?.id === 'residencial') {
    if (environment === 'baño' || /mampara|puerta/.test(product)) {
      return {
        glassType: 'templado',
        reason: 'es una muy buena opción para mamparas y puertas de uso cotidiano',
      };
    }
    if (environment === 'balcón' || environment === 'terraza' || exposedToWeather || wantsIsolation || wantsSecurity) {
      return {
        glassType: 'laminado',
        reason: 'para ventanas o cerramientos expuestos aporta una base más orientada a protección y confort',
      };
    }
  }

  if (/mampara|puerta|división/.test(product) || environment === 'cocina') {
    return {
      glassType: 'templado',
      reason: 'por el tipo de uso, es la opción que primero evaluaría por resistencia y practicidad',
    };
  }

  if (exposedToWeather || wantsIsolation || wantsSecurity) {
    return {
      glassType: 'laminado',
      reason: wantsIsolation
        ? 'encaja mejor cuando también quieres mejorar el confort frente al ruido'
        : 'es una buena base cuando la prioridad es protección o exposición exterior',
    };
  }

  if (product === 'vidrio' && /\b(interior|decorativo|mueble)\b/.test(`${environment} ${details}`)) {
    return {
      glassType: 'crudo',
      reason: 'para un uso interior sencillo puede ser suficiente si no hay una exigencia especial de seguridad',
    };
  }

  if (product === 'ventana') {
    return {
      glassType: 'laminado',
      reason: 'como punto de partida para una ventana ofrece un buen equilibrio entre seguridad y uso diario',
    };
  }

  return {
    glassType: 'templado',
    reason: 'por el uso que describes, es la opción que primero evaluaría antes de afinar los demás detalles',
  };
};

const buildHumanGlassRecommendation = (
  context: ConversationContext,
  productOverride = ''
): string => {
  const recommendation = getContextualGlassRecommendation(context, productOverride);
  const seed = `${context.product}|${context.environment}|${context.need}|${context.climate}|${productOverride}`;
  const intro = pickStableVariant(seed, [
    'Para este caso, yo me iría primero por',
    'Por el uso que me describes, mi primera opción sería',
    'Aquí empezaría evaluando',
    'En este proyecto me inclinaría por',
  ]);
  const technicalNote = recommendation.technicalCheck
    ? ' El espesor y la configuración final sí deben validarse técnicamente.'
    : '';

  return `${intro} vidrio ${recommendation.glassType} 🪟, porque ${recommendation.reason}.${technicalNote} ¿Lo dejamos como ${recommendation.glassType}?`;
};


const wantsGuidance = (value: string): boolean => {
  const normalized = normalizeForMatch(value);
  return /\b(no se|no sabria|no estoy seguro|no tengo claro|ayudame|recomiend\w*|aconsej\w*|orient\w*|que me conviene|cual me conviene|que elegir|cual elegir|elige tu|tu elige|tu cual|tu que elegirias|cual pondrias|que pondrias|cual es mejor|que es mejor)\b/.test(normalized)
    || /\b(diferencia|diferencias)\b/.test(normalized);
};

// Cuando el cliente responde "recomiéndame", "ayúdame a elegir", etc.,
// damos prioridad a la decisión que Zhaid IA acaba de preguntar. Esto evita
// que el flujo vuelva a formular exactamente la misma pregunta.
const buildRecommendationForLastPrompt = (
  userText: string,
  lastAssistantText: string,
  context: ConversationContext
): string | null => {
  if (!wantsGuidance(userText)) return null;

  const prompt = normalizeForMatch(lastAssistantText);
  if (!prompt) return null;
  const user = normalizeForMatch(userText);
  const asksDifference = /\b(diferencia|diferencias|comparar|comparacion)\b/.test(user);

  // Orden específico: primero las decisiones más concretas.
  if (/\b(que vidrio|vidrio prefieres|crudo.*laminado.*templado)\b/.test(prompt) && !hasConfirmedValue(context.glassType)) {
    if (asksDifference) {
      const rec = getContextualGlassRecommendation(context);
      return `Rápido: crudo es la opción más simple; templado prioriza resistencia; laminado mantiene los fragmentos unidos al romperse y puede ayudar cuando buscas más protección o aislamiento. 🪟 Para tu caso yo empezaría con ${rec.glassType}, porque ${rec.reason}. ¿Lo dejamos así?`;
    }
    return buildHumanGlassRecommendation(context);
  }

  if (/\b(espesor|6\s*mm|8\s*mm)\b/.test(prompt) && !hasConfirmedValue(context.glassThickness)) {
    if (asksDifference) {
      const rec = getContextualThicknessRecommendation(context);
      return `6 mm es más ligero; 8 mm aporta más espesor y robustez. ✨ Para este proyecto yo empezaría con ${rec.value}, porque ${rec.reason}. ¿Lo dejamos en ${rec.value}?`;
    }
    return buildHumanThicknessRecommendation(context);
  }

  if (/\b(vidrio transparente|bronce|azul claro|azul electra|color del vidrio)\b/.test(prompt) && !hasConfirmedValue(context.glassColor)) {
    if (asksDifference) {
      const rec = getContextualGlassColorRecommendation(context);
      return `Transparente mantiene una apariencia neutra; bronce, azul claro y azul electra cambian la estética y la entrada visual de luz. 🎨 Para tu caso elegiría ${rec.value}, porque ${rec.reason}. ¿Lo dejamos ${rec.value}?`;
    }
    return buildHumanGlassColorRecommendation(context);
  }

  if (/\b(aluminio o pvc|estructura.*prefieres|material.*prefieres)\b/.test(prompt) && !hasConfirmedValue(context.material)) {
    if (asksDifference) {
      const rec = getContextualMaterialRecommendation(context);
      return `En corto: aluminio es una opción muy versátil para distintos sistemas; PVC lo evaluaría especialmente cuando el aislamiento pesa más en la decisión. 🔧 Para tu caso empezaría por ${rec.value}, porque ${rec.reason}. ¿Lo dejamos en ${rec.value}?`;
    }
    return buildHumanMaterialRecommendation(context);
  }

  if (/\b(que color|color prefieres|natural.*negro.*blanco|color madera)\b/.test(prompt) && !hasConfirmedValue(context.color)) {
    if (asksDifference) {
      const rec = getContextualStructureColorRecommendation(context);
      const label = rec.value === 'madera' ? 'color madera' : rec.value;
      return `Negro se ve más moderno, blanco más luminoso, natural es versátil y color madera se siente más cálido. 🎨 Para tu proyecto elegiría ${label}, porque ${rec.reason}. ¿Lo dejamos en ${label}?`;
    }
    return buildHumanStructureColorRecommendation(context);
  }

  if (/\b(como la prefieres|corrediza.*fija.*abatible|corrediza o abatible)\b/.test(prompt) && !detectOpeningPreference(context.additionalDetails)) {
    if (asksDifference) {
      const rec = getContextualOpeningRecommendation(context);
      return `Corrediza ahorra espacio al abrir; fija prioriza luz porque no abre; abatible gira y puede dar más ventilación. 🚪 Para tu caso empezaría con ${rec.value}, porque ${rec.reason}. ¿La dejamos ${rec.value}?`;
    }
    return buildHumanOpeningRecommendation(context);
  }

  if (/\b(que quieres priorizar|seguridad.*diseno|privacidad.*ventilacion|aislamiento)\b/.test(prompt) && !hasConfirmedValue(context.need)) {
    return buildHumanNeedRecommendation(context);
  }

  if (/\b(serie|nacional|espanola|europea)\b/.test(prompt) && !hasConfirmedValue(context.series)) {
    return buildBudgetSeriesRecommendation(context);
  }

  if (/\b(medida|ancho x alto|ancho.*alto)\b/.test(prompt) && !hasConfirmedValue(context.measures)) {
    return 'La medida sí prefiero no inventarla 📐. Si todavía no la tienes, la dejamos por confirmar y seguimos con el resto.';
  }

  if (/\b(cuantas|cuantos|cantidad|unidades|piezas)\b/.test(prompt) && !hasConfirmedValue(context.quantity)) {
    return 'La cantidad depende de tu proyecto 🔢. Si aún no la sabes, la podemos dejar por confirmar y continuar.';
  }

  return null;
};

const getContextualNeedRecommendation = (context: ConversationContext): { value: string; reason: string } => {
  const product = normalizeProductContext(context.product);
  const environment = normalizeForMatch(context.environment);
  const details = normalizeForMatch(context.additionalDetails);
  const sector = detectProjectSector(`${context.environment} ${context.additionalDetails}`);

  if (/\b(ruido|sonido|acustic)\b/.test(details) || environment === 'dormitorio') {
    return { value: 'aislamiento', reason: 'por el contexto, el confort frente al ruido parece lo más importante' };
  }
  if (environment === 'cocina') return { value: 'ventilación', reason: 'en cocina suele ser muy útil priorizar ventilación y practicidad' };
  if (environment === 'sala') return { value: 'iluminación', reason: 'en sala normalmente conviene aprovechar la luz y la amplitud visual' };
  if (environment === 'baño') return { value: 'privacidad', reason: 'en baño suele pesar más la privacidad, sin perder seguridad' };
  if (/baranda|fachada|techo/.test(product)) return { value: 'seguridad', reason: 'en este tipo de elemento conviene empezar por la seguridad' };
  if (sector?.id === 'educacion') return { value: 'seguridad', reason: 'en espacios educativos hay uso frecuente y conviene priorizar seguridad' };
  if (sector?.id === 'salud') return { value: product === 'división' ? 'privacidad' : 'seguridad', reason: 'en salud conviene priorizar seguridad y privacidad según el ambiente' };
  if (sector?.id === 'corporativo') return { value: product === 'división' ? 'privacidad' : 'diseño', reason: 'en oficina suele importar mucho el equilibrio entre imagen y privacidad' };
  if (sector?.id === 'comercial') return { value: 'seguridad', reason: 'en un proyecto comercial empezaría cuidando seguridad y uso frecuente' };
  if (sector?.id === 'hotelero') return { value: environment === 'baño' ? 'privacidad' : 'diseño', reason: 'en hotelería suele buscarse una combinación de presentación y privacidad' };
  if (sector?.id === 'industrial') return { value: 'durabilidad', reason: 'en un entorno industrial empezaría por durabilidad y uso continuo' };
  if (sector?.id === 'deportivo') return { value: 'seguridad', reason: 'en zonas deportivas conviene priorizar seguridad y resistencia al uso' };
  return { value: 'seguridad', reason: 'si todavía no tienes una prioridad clara, es el punto de partida más prudente' };
};

const buildHumanNeedRecommendation = (context: ConversationContext): string => {
  const recommendation = getContextualNeedRecommendation(context);
  return `Por lo que me cuentas, yo priorizaría ${recommendation.value} 🎯, porque ${recommendation.reason}. ¿Lo dejamos como ${recommendation.value}?`;
};

const getContextualOpeningRecommendation = (context: ConversationContext): { value: 'corrediza' | 'fija' | 'abatible'; reason: string } => {
  const product = normalizeProductContext(context.product);
  const environment = normalizeForMatch(context.environment);
  const need = normalizeForMatch(context.need);
  const details = normalizeForMatch(context.additionalDetails);

  if (/ventilacion/.test(need) && product === 'ventana') return { value: 'abatible', reason: 'si quieres priorizar ventilación, una apertura abatible es la primera que evaluaría' };
  if (/iluminacion/.test(need) && !/ventilacion/.test(`${need} ${details}`) && product === 'ventana') return { value: 'fija', reason: 'si lo principal es luz y no necesitas apertura, una fija es una opción muy limpia' };
  if (product === 'mampara' || /terraza|balcon/.test(environment)) return { value: 'corrediza', reason: 'aprovecha bien el espacio y suele ser cómoda para mamparas y terrazas' };
  if (product === 'puerta') return { value: 'abatible', reason: 'para una puerta, empezaría evaluando una apertura abatible por su uso directo y sencillo' };
  return { value: 'corrediza', reason: 'es una alternativa práctica cuando quieres apertura sin ocupar demasiado espacio' };
};

const buildHumanOpeningRecommendation = (context: ConversationContext): string => {
  const recommendation = getContextualOpeningRecommendation(context);
  return `Para tu caso, yo empezaría con una ${recommendation.value} 🚪, porque ${recommendation.reason}. ¿La dejamos ${recommendation.value}?`;
};

const getContextualMaterialRecommendation = (context: ConversationContext): { value: 'aluminio' | 'pvc'; reason: string } => {
  const product = normalizeProductContext(context.product);
  const need = normalizeForMatch(context.need);
  const sector = detectProjectSector(`${context.environment} ${context.additionalDetails}`);

  if (/aislamiento|ruido|acustic/.test(`${need} ${normalizeForMatch(context.additionalDetails)}`)) {
    return { value: 'pvc', reason: 'como punto de partida, lo evaluaría primero cuando el aislamiento es una prioridad' };
  }
  if (/mampara|puerta|fachada|división|cerramiento/.test(product) || ['comercial', 'corporativo', 'educacion'].includes(sector?.id ?? '')) {
    return { value: 'aluminio', reason: 'para este uso lo tomaría como primera alternativa por su versatilidad dentro del proyecto' };
  }
  return { value: 'aluminio', reason: 'si no hay una exigencia especial de aislamiento, es la primera alternativa que evaluaría' };
};

const buildHumanMaterialRecommendation = (context: ConversationContext): string => {
  const recommendation = getContextualMaterialRecommendation(context);
  return `Con lo que ya me dijiste, yo empezaría por ${recommendation.value} 🔧, porque ${recommendation.reason}. ¿Lo dejamos en ${recommendation.value}?`;
};

const getContextualStructureColorRecommendation = (context: ConversationContext): { value: 'natural' | 'negro' | 'blanco' | 'madera'; reason: string } => {
  const need = normalizeForMatch(context.need);
  const environment = normalizeForMatch(context.environment);
  const sector = detectProjectSector(`${context.environment} ${context.additionalDetails}`);

  if (/diseno|moderno|elegante/.test(`${need} ${normalizeForMatch(context.additionalDetails)}`) || ['corporativo', 'comercial'].includes(sector?.id ?? '')) {
    return { value: 'negro', reason: 'da una apariencia moderna y definida' };
  }
  if (sector?.id === 'salud' || /cocina|baño/.test(environment)) return { value: 'blanco', reason: 'da una apariencia clara y limpia' };
  if (sector?.id === 'hotelero' || /sala|dormitorio/.test(environment)) return { value: 'madera', reason: 'aporta un acabado más cálido y decorativo' };
  return { value: 'natural', reason: 'es versátil y combina fácilmente con distintos ambientes' };
};

const buildHumanStructureColorRecommendation = (context: ConversationContext): string => {
  const recommendation = getContextualStructureColorRecommendation(context);
  const label = recommendation.value === 'madera' ? 'color madera' : recommendation.value;
  return `Yo me inclinaría por ${label} 🎨, porque ${recommendation.reason}. ¿Lo dejamos en ${label}?`;
};

type ThicknessRecommendation = { value: '6 mm' | '8 mm'; reason: string; technicalCheck?: boolean };
const getContextualThicknessRecommendation = (context: ConversationContext, productOverride = ''): ThicknessRecommendation => {
  const product = normalizeProductContext(productOverride || context.product);
  const need = normalizeForMatch(context.need);
  const environment = normalizeForMatch(context.environment);
  const details = normalizeForMatch(context.additionalDetails);
  const sector = detectProjectSector(`${context.environment} ${context.additionalDetails}`);
  const safetyCritical = /fachada|baranda|techo/.test(product);
  const demandingUse = /seguridad|durabilidad|impacto|golpe|resistente|alto transito|uso frecuente/.test(`${need} ${details}`)
    || /mampara|puerta|división/.test(product)
    || environment === 'vitrina'
    || ['educacion', 'comercial', 'deportivo', 'industrial'].includes(sector?.id ?? '');

  if (safetyCritical) return { value: '8 mm', reason: 'entre las dos opciones disponibles, partiría de la mayor; aun así, este elemento necesita validación técnica', technicalCheck: true };
  if (demandingUse) return { value: '8 mm', reason: 'entre 6 y 8 mm, para este uso prefiero empezar por la opción más robusta' };
  return { value: '6 mm', reason: 'para un uso menos exigente, 6 mm puede ser un buen punto de partida dentro de las opciones registradas' };
};

const buildHumanThicknessRecommendation = (context: ConversationContext, productOverride = ''): string => {
  const recommendation = getContextualThicknessRecommendation(context, productOverride);
  const extra = recommendation.technicalCheck ? ' La medida, soporte y configuración final deben revisarse técnicamente.' : '';
  return `Entre 6 y 8 mm, para este caso me inclinaría por ${recommendation.value} ✨, porque ${recommendation.reason}.${extra} ¿Lo dejamos en ${recommendation.value}?`;
};

const getContextualGlassColorRecommendation = (context: ConversationContext): { value: 'transparente' | 'bronce' | 'azul claro' | 'azul electra'; reason: string } => {
  const climate = normalizeForMatch(context.climate);
  const details = normalizeForMatch(context.additionalDetails);
  if (/mucho sol|sol directo|solead|control solar/.test(`${climate} ${details}`)) {
    return { value: 'bronce', reason: 'si hay bastante exposición al sol, es la primera opción de color que evaluaría' };
  }
  return { value: 'transparente', reason: 'si no hay una necesidad especial de color, conserva una apariencia limpia y luminosa' };
};

const buildHumanGlassColorRecommendation = (context: ConversationContext): string => {
  const recommendation = getContextualGlassColorRecommendation(context);
  return `Para este proyecto elegiría ${recommendation.value} 🎨, porque ${recommendation.reason}. ¿Lo dejamos ${recommendation.value}?`;
};

const hasCasualGreeting = (value: string): boolean => {
  const normalized = normalizeForMatch(value);
  return /\b(hola|que tal|oye|oe|bro|causa|mano|amigo|una consulta|buenas)\b/.test(normalized);
};

const addConversationalLead = (assistantText: string, userText: string): string => {
  const response = addFriendlyTone(assistantText);
  if (!hasCasualGreeting(userText)) return response;
  const normalizedResponse = normalizeForMatch(response);
  if (/\b(hola|que tal)\b/.test(normalizedResponse.slice(0, 35))) return response;
  return `¡Qué tal! 😄 ${response}`;
};

const hasConfirmedValue = (value: string): boolean => Boolean(value) && !/por confirmar|por definir|pendiente/i.test(value);

const getSectorIcon = (sector: ProjectSectorProfile): string => {
  const icons: Record<ProjectSectorId, string> = {
    educacion: '🏫',
    salud: '🏥',
    residencial: '🏢',
    corporativo: '🏢',
    comercial: '🏬',
    hotelero: '🏨',
    industrial: '🏭',
    deportivo: '🏟️',
    institucional: '🏛️',
    publico: '🏛️',
  };
  return icons[sector.id];
};

const buildSectorProjectResponse = (sector: ProjectSectorProfile, context: ConversationContext): string => {
  const icon = getSectorIcon(sector);
  const environmentBelongsToSector = context.environment && detectProjectSector(context.environment)?.id === sector.id;
  const projectLabel = environmentBelongsToSector ? context.environment : sector.label;
  if (context.product) {
    return `¡Buenísimo! ${icon} ${getProductAdvice(context.product, sector)}

Sigamos con la cotización. ¿Qué es lo más importante para ti: seguridad, diseño, privacidad, ventilación o aislamiento?`;
  }

  return `¡Buenísimo! ${icon} Para ${projectLabel} podemos trabajar ventanas, puertas, mamparas/divisiones, fachadas, cerramientos y vidrio a medida.

¿Qué deseas cotizar primero?`;
};

const normalizeAiResponse = (text: string): string => text
  .replace(/vidrio\s+flotado/gi, 'vidrio crudo')
  .replace(/perfil(?:ería|eria)\s+de\s+aluminio/gi, 'estructura de aluminio')
  .replace(/aluminio\s+negro/gi, 'aluminio en color negro');

const addFriendlyTone = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (['😊', '👍', '✨', '🙌', '🙂', '😄', '🔥', '💰', '📐', '🎨', '🪟', '🔧', '🔢', '🏫', '🏢', '🏥', '🏬', '🏨', '🏭', '🏟️', '🏛️', '✅'].some((emoji) => trimmed.includes(emoji))) return trimmed;

  const emoji = /cotiz|precio|presupuesto/i.test(trimmed)
    ? '💰'
    : /medida|ancho|alto/i.test(trimmed)
    ? '📐'
    : /color|negro|blanco|natural|madera/i.test(trimmed)
    ? '🎨'
    : /vidrio|espesor|templado|laminado|crudo/i.test(trimmed)
    ? '🪟'
    : /material|aluminio|pvc/i.test(trimmed)
    ? '🔧'
    : /cantidad|pieza|unidad/i.test(trimmed)
    ? '🔢'
    : '😄';

  return `${emoji} ${trimmed}`;
};

const getSystemFromQuestion = (question: string) => {
  const normalized = normalizeForMatch(question);

  const exact = windowSystems.find((system) => {
    const name = normalizeForMatch(system.name);
    const id = normalizeForMatch(system.id.replace(/-/g, ' '));
    return normalized.includes(name) || normalized.includes(id);
  });
  if (exact) return exact;

  const requestedNumber = normalized.match(/\b(?:serie|style|alfa|vl|ml)?\s*(25|35|42|46|50|60|62|65|70|80)\b/)?.[1];
  if (!requestedNumber) return undefined;

  const sameNumber = windowSystems.filter((system) => system.name.match(/\d+/)?.[0] === requestedNumber);
  if (sameNumber.length === 1) return sameNumber[0];

  if (/\bstyle\b/.test(normalized)) return sameNumber.find((system) => /^style/i.test(system.name));
  if (/\balfa\b/.test(normalized)) return sameNumber.find((system) => /^alfa/i.test(system.name));
  if (/\bvl\b/.test(normalized)) return sameNumber.find((system) => /^vl/i.test(system.name));
  if (/\bml\b/.test(normalized)) return sameNumber.find((system) => /^ml/i.test(system.name));
  if (/\bnacional\b/.test(normalized)) return sameNumber.find((system) => system.category === 'Serie Nacional');
  if (/\b(espanola|europea)\b/.test(normalized)) return sameNumber.find((system) => system.category === 'Serie Española');

  return undefined;
};

const isStructureCatalogProduct = (product: Product): boolean => {
  const normalized = normalizeForMatch(`${product.name} ${product.category} ${product.id}`);
  return /\b(aluminio|pvc|marco|perfil|perfileria|serie nacional|serie espanola)\b/.test(normalized);
};

const resolveSelectedProduct = (value: string | null | undefined): Product | null => {
  if (!value) return null;

  const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return null;

  return (
    products.find((product) => {
      const haystack = `${product.name} ${product.category} ${product.id}`.toLowerCase();
      return haystack.includes(normalized) || normalized.includes(product.name.toLowerCase()) || normalized.includes(product.id.toLowerCase());
    }) ?? null
  );
};

const normalizeProductContext = (value: string): string => {
  const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (/puerta/.test(normalized)) return 'puerta';
  if (/ventana/.test(normalized)) return 'ventana';
  if (/mampara/.test(normalized)) return 'mampara';
  if (/baranda/.test(normalized)) return 'baranda';
  if (/espejo/.test(normalized)) return 'espejo';
  if (/techo|cubierta/.test(normalized)) return 'techo';
  if (/vidrio|templado|laminado|crudo/.test(normalized)) return 'vidrio';
  if (/fachada/.test(normalized)) return 'fachada';
  if (/aluminio/.test(normalized)) return 'aluminio';
  if (/cerramiento|estructura|especial|proyecto/.test(normalized)) return 'proyecto especial';
  return normalized;
};

const buildQuoteWhatsAppLink = (context?: ConversationContext): string => {
  const lines = [
    '¡Hola!',
    '',
    'Datos del proyecto:',
    ...(context?.product ? [`Producto: ${context.product}`] : []),
    ...(context?.series ? [`Serie/modelo: ${context.series}`] : []),
    ...(context?.quantity ? [`Cantidad: ${context.quantity}`] : []),
    ...(context?.measures ? [`Medidas: ${context.measures}`] : []),
    ...(context?.material ? [`Material de estructura: ${context.material}`] : []),
    ...(context?.color ? [`Color de estructura: ${context.color}`] : []),
    ...(context?.glassType ? [`Tipo de vidrio: ${context.glassType}`] : []),
    ...(context?.glassThickness ? [`Espesor del vidrio: ${context.glassThickness}`] : []),
    ...(context?.glassColor ? [`Color del vidrio: ${context.glassColor}`] : []),
    ...(context?.environment ? [`Ambiente: ${context.environment}`] : []),
    ...(context?.need ? [`Necesidad: ${context.need}`] : []),
    ...(context?.climate ? [`Condición: ${context.climate}`] : []),
    ...(context?.additionalDetails ? ['', 'Detalles adicionales:', context.additionalDetails] : []),
    '',
    'Instalación: gratis.',
    'Quisiera saber cuánto me costaría. ¡Gracias!',
  ];

  return getWhatsAppLink(lines.join('\n'));
};


const buildKnowledgeContext = (text: string, context: ConversationContext): ConversationContext => {
  const detectedProduct = detectProductFromText(text, context.product);
  const detectedEnvironment = detectEnvironmentFromText(text) || detectGenericProjectContext(text);
  const detectedNeed = detectNeedFromText(text);
  const detectedClimate = detectClimateFromText(text);

  return {
    ...context,
    product: detectedProduct || context.product,
    environment: detectedEnvironment || context.environment,
    need: detectedNeed || context.need,
    climate: detectedClimate || context.climate,
    additionalDetails: [context.additionalDetails, text].filter(Boolean).join(' | '),
  };
};

const describeSectorApplications = (sector: ProjectSectorProfile): string => {
  const applications: Partial<Record<ProjectSectorId, string>> = {
    educacion: 'ventanas para aulas, puertas, divisiones, cerramientos y fachadas',
    salud: 'ventanas, puertas, divisiones interiores, accesos y cerramientos',
    residencial: 'ventanas, mamparas, puertas, balcones, cerramientos y fachadas',
    corporativo: 'ventanas, puertas, mamparas/divisiones y fachadas',
    comercial: 'vitrinas, puertas, ventanas, divisiones, cerramientos y fachadas',
    hotelero: 'ventanas, mamparas de baño, puertas, divisiones, terrazas y fachadas',
    industrial: 'ventanas, divisiones, accesos, cerramientos y áreas de supervisión',
    deportivo: 'espejos, divisiones, ventanas, puertas y fachadas',
    institucional: 'ventanas, puertas, divisiones, accesos y fachadas',
    publico: 'ventanas, puertas, divisiones, accesos y fachadas',
  };
  return applications[sector.id] ?? 'ventanas, puertas, mamparas/divisiones, cerramientos y vidrio a medida';
};

const buildVidrieriaKnowledgeResponse = (text: string, context: ConversationContext): string | null => {
  const q = normalizeForMatch(text);
  if (!q) return null;

  const smartContext = buildKnowledgeContext(text, context);
  const product = normalizeProductContext(smartContext.product);
  const sector = detectProjectSector(`${text} ${smartContext.environment} ${smartContext.additionalDetails}`);

  // SITUACIONES REALES CONTADAS EN LENGUAJE NORMAL.
  if (/\b(gato|perro|mascota|nino|niño).*(rompio|quebro|golpeo|tiro|romper).*\b(vitrina|vidrio|cristal)\b|\b(vitrina).*(resistente|aguante|golpes|romper)\b/.test(q)) {
    const storyContext: ConversationContext = {
      ...smartContext,
      product: smartContext.product || 'vidrio',
      environment: smartContext.environment || 'vitrina',
      need: smartContext.need || 'seguridad',
    };
    const glass = getContextualGlassRecommendation(storyContext);
    const thickness = getContextualThicknessRecommendation(storyContext);
    return `Vaya susto 😅. Para una vitrina que pueda recibir golpes, yo empezaría con vidrio ${glass.glassType}; y entre 6 y 8 mm, evaluaría primero ${thickness.value}. La medida y el soporte también importan para confirmarlo. ¿Qué medida aproximada tiene la vitrina?`;
  }

  if (/\b(mampara|division).*(ruido|sonido|acustic|aislar|aislada|insonor)\b|\b(ruido|sonido|acustic|aislar|aislada|insonor).*(mampara|division)\b/.test(q)) {
    const acousticContext: ConversationContext = { ...smartContext, product: smartContext.product || 'mampara', need: 'aislamiento' };
    const glass = getContextualGlassRecommendation(acousticContext);
    return `Si quieres reducir sonido, yo empezaría evaluando vidrio ${glass.glassType} 🪟. El resultado también depende del sistema y del sellado, no solo del vidrio. ¿En qué ambiente irá la mampara?`;
  }

  // CONOCIMIENTO DE VIDRIOS
  if (/\b(que tipos? de vidrio|que vidrios trabajan|que vidrios manejan|que vidrios tienen|tipos? de cristal)\b/.test(q)) {
    return `Trabajamos con vidrio crudo, laminado y templado 🪟, en ${officialGlassThicknesses.join(' y ')}. Dime dónde irá y te recomiendo el más adecuado.`;
  }

  if (/\b(diferencia|diferencias).*\b(templado).*\b(laminado)\b|\b(templado).*\b(o|vs|versus).*\b(laminado)\b/.test(q)) {
    return 'El templado destaca por resistencia y va muy bien en puertas, mamparas y divisiones. El laminado mantiene los fragmentos unidos al romperse y conviene cuando buscas más protección o aislamiento. ¿Para qué lo necesitas? 🪟';
  }

  if (/\b(vidrio crudo|cristal crudo).*\b(para que|sirve|uso|usar)\b|\b(para que|donde).*\b(vidrio crudo|cristal crudo)\b/.test(q)) {
    return 'El vidrio crudo puede servir en aplicaciones interiores sencillas donde no haya una exigencia especial de seguridad. Si me dices dónde irá, revisamos si realmente te conviene.';
  }

  if (/\b(no se|no tengo claro).*\b(vidrio|cristal)\b|\b(que|cual).*\b(vidrio|cristal).*\b(recomiend|conviene|mejor|ideal)\b|\b(recomiend\w*).*\b(vidrio|cristal)\b/.test(q)) {
    if (product && !smartContext.environment && !sector && /ventana|mampara|puerta/.test(product)) {
      return `¡Te recomiendo uno con gusto! 🪟 Antes dime dónde irá la ${product}, porque el ambiente sí cambia la recomendación.`;
    }
    if (product || smartContext.environment || sector) return buildHumanGlassRecommendation(smartContext);
    return '¡Te ayudo! 🪟 La recomendación cambia según el uso. ¿Es para ventana, mampara, puerta, división, fachada u otro proyecto?';
  }

  if (/\b(que vidrio|cual vidrio).*\b(colegio|escuela|universidad|instituto|aula)\b/.test(q)) {
    if (product) return buildHumanGlassRecommendation(smartContext);
    return 'En educación, para puertas, divisiones y zonas de uso frecuente empezaría evaluando templado; si hablamos de ventanas con prioridad en ruido o protección, también puede convenir laminado. ¿Qué elemento necesitas? 🏫';
  }

  if (/\b(que vidrio|cual vidrio).*\b(oficina|corporativo|sala de reuniones)\b/.test(q)) {
    if (product) return buildHumanGlassRecommendation(smartContext);
    return 'En oficina, templado suele funcionar muy bien en puertas y divisiones; para ventanas donde importa más el aislamiento, puede convenir laminado. ¿Qué vas a instalar? 🏢';
  }

  if (/\b(que vidrio|cual vidrio).*\b(bano|ducha|mampara de bano)\b/.test(q)) {
    return 'Para una mampara de baño, mi primera opción sería vidrio templado 🪟 por su resistencia y uso frecuente. ¿Quieres que sigamos con el tipo de apertura?';
  }

  // NECESIDADES DEL CLIENTE
  if (/\b(mucho ruido|ruido afuera|ruido exterior|reducir ruido|aislamiento acustico)\b/.test(q)) {
    return 'Si el ruido es prioridad, empezaría evaluando vidrio laminado y un buen sistema de ventana 🪟. ¿En qué ambiente se instalará?';
  }

  if (/\b(mucho sol|demasiado sol|sol directo|controlar.*sol|calor por el sol)\b/.test(q)) {
    return `Podemos revisar el color del vidrio y la configuración del proyecto para manejar mejor la exposición ☀️. Tenemos ${officialGlassColors.join(', ').toLowerCase()}. ¿Es ventana, mampara o fachada?`;
  }

  if (/\b(privacidad).*\b(luz|iluminacion|claridad)\b|\b(luz|iluminacion).*\b(privacidad)\b/.test(q)) {
    return 'Podemos buscar un equilibrio entre privacidad e iluminación 👍. Dime primero dónde irá el vidrio y te oriento con las opciones reales disponibles.';
  }

  // APERTURAS Y ELECCIONES ENTRE OPCIONES.
  if (/\b(diferencia|diferencias).*(corrediza|fija|abatible)|\b(corrediza|fija|abatible).*(vs|o|versus).*(corrediza|fija|abatible)\b/.test(q)) {
    if (product && /ventana|mampara|puerta/.test(product)) {
      const recommendation = getContextualOpeningRecommendation(smartContext);
      return `Corrediza ahorra espacio al abrir; fija no abre y prioriza luz; abatible abre con giro y puede dar más ventilación. Para tu caso, yo empezaría con ${recommendation.value} 🚪 porque ${recommendation.reason}. ¿La dejamos ${recommendation.value}?`;
    }
    return 'Corrediza ahorra espacio al abrir; fija no abre y prioriza luz; abatible abre con giro y puede dar más ventilación. Si me dices qué estás haciendo, te recomiendo una. 🚪';
  }

  if (/\b(diferencia|diferencias).*(negro|blanco|natural|madera)|\b(negro|blanco|natural|madera).*(vs|o|versus).*(negro|blanco|natural|madera)\b/.test(q)) {
    if (product || smartContext.environment || sector) return buildHumanStructureColorRecommendation(smartContext);
    return 'Negro se ve más moderno, blanco más luminoso, natural es versátil y color madera da un acabado más cálido 🎨. Si me cuentas el estilo del proyecto, elijo uno contigo.';
  }

  if (/\b(diferencia|diferencias).*(transparente|bronce|azul claro|azul electra)|\b(transparente|bronce|azul claro|azul electra).*(vs|o|versus).*(transparente|bronce|azul claro|azul electra)\b/.test(q)) {
    if (product || smartContext.environment || sector) return buildHumanGlassColorRecommendation(smartContext);
    return `Tenemos ${officialGlassColors.join(', ').toLowerCase()} 🎨. Transparente mantiene una apariencia neutra; los tonos cambian la estética y la entrada visual de luz. Dime dónde irá y te recomiendo uno.`;
  }

  // MATERIALES Y ACABADOS
  if (/\b(trabajan|tienen|manejan).*\b(aluminio)\b|^aluminio\?$/.test(q)) {
    return `Sí 🔧 trabajamos estructuras de aluminio. Los colores registrados son ${officialStructureColors.join(', ').toLowerCase()}. ¿Para qué producto lo necesitas?`;
  }

  if (/\b(trabajan|tienen|manejan).*\b(pvc)\b|^pvc\?$/.test(q)) {
    return 'Sí 🔧 también trabajamos PVC. Dime qué deseas fabricar y te voy guiando con el proyecto.';
  }

  if (/\b(aluminio).*\b(o|vs|versus).*\b(pvc)\b|\b(que es mejor|cual es mejor|que conviene|cual conviene).*\b(aluminio|pvc)\b/.test(q)) {
    if (product && smartContext.need) return buildHumanMaterialRecommendation(smartContext);
    return 'Depende del proyecto 😊. Si me dices qué estás haciendo y qué priorizas, te digo cuál de los dos elegiría para ese caso.';
  }

  if (/\b(que colores|colores disponibles|acabados).*\b(estructura|aluminio|pvc)\b/.test(q)) {
    return `Para estructura tenemos ${officialStructureColors.join(', ').toLowerCase()} 🎨. Si me dices el estilo del proyecto, te recomiendo uno.`;
  }

  if (/\b(que color|cual color).*\b(recomiend|conviene|mejor)|\b(recomiend\w*).*\b(color|acabado)\b/.test(q)) {
    return 'Negro da un acabado moderno, blanco se siente más luminoso, natural es muy versátil y color madera aporta calidez 🎨. ¿Qué estilo buscas?';
  }

  if (/\b(colores? de vidrio|colores? del vidrio|que colores.*vidrio)\b/.test(q)) {
    return `Tenemos vidrio ${officialGlassColors.join(', ').toLowerCase()} 🪟. Si me dices el ambiente, te ayudo a escoger.`;
  }

  // ESPESORES
  if (/\b(6\s*mm).*\b(o|vs|versus).*\b(8\s*mm)\b|\b(8\s*mm).*\b(o|vs|versus).*\b(6\s*mm)\b|\b(que espesor|cual espesor).*\b(6|8)\b|\b(diferencia|diferencias).*\b(6|8).*mm\b/.test(q)) {
    if (product || smartContext.environment || sector) {
      const recommendation = getContextualThicknessRecommendation(smartContext, product);
      const technical = recommendation.technicalCheck ? ' En este tipo de elemento la configuración final debe validarse técnicamente.' : '';
      return `6 mm es una opción más ligera; 8 mm aporta más espesor y robustez. Para tu caso, entre esas dos yo empezaría con ${recommendation.value}, porque ${recommendation.reason}.${technical} ¿Lo dejamos en ${recommendation.value}?`;
    }
    return `6 mm es una opción más ligera y 8 mm aporta más espesor y robustez. Para recomendarte una de las dos necesito saber qué vas a fabricar. 🪟`;
  }

  // MEDIDAS Y CANTIDADES
  if (/\b(puedo|puedo mandar|puedo dar|te paso).*\b(mis medidas|medidas)\b/.test(q)) {
    return '¡Sí! 📐 Puedes indicarme ancho × alto y la cantidad. Voy a conservar tus medidas tal como me las des.';
  }

  if (/\b(no tengo|aun no tengo|todavia no tengo|sin).*\b(medidas)\b/.test(q)) {
    return 'No pasa nada 😊. Podemos definir primero el producto, material y vidrio, y dejar las medidas pendientes para después.';
  }

  if (/\b(diferentes|distintas|varias).*\b(medidas)\b|\b(medidas).*\b(diferentes|distintas)\b/.test(q)) {
    return 'Sin problema 📐. Podemos trabajarlas por grupos: me das una medida y cuántas unidades corresponden a esa medida, y luego seguimos con la siguiente.';
  }

  if (/\b(iguales|misma medida|mismo tamano)\b.*\b(ventanas|mamparas|puertas|piezas|unidades)\b/.test(q)) {
    return '¡Perfecto! 🔢 Si son iguales, basta con una medida y la cantidad total. Así dejamos la cotización más ordenada.';
  }

  // PROYECTOS Y CAPACIDADES
  if (/\b(proyecto completo|todo el proyecto|proyecto integral)\b/.test(q)) {
    return 'Sí 😊 podemos orientarte con ventanas, mamparas, puertas, vidrios, fachadas y cerramientos. ¿Qué tipo de inmueble es?';
  }

  if (/\b(proyecto personalizado|proyectos personalizados|algo personalizado|diseno personalizado)\b/.test(q)) {
    return 'Sí 😊 podemos evaluar proyectos especiales en vidrio y estructura. Cuéntame brevemente qué quieres lograr y te guío paso a paso.';
  }

  if (/\b(tengo|cuento con).*\b(plano|planos|diseno|diseño)\b/.test(q)) {
    return 'Perfecto 👍 un plano o diseño ayuda como referencia. Para la cotización final, los detalles técnicos y medidas deben validarse con un asesor.';
  }

  if (sector && /\b(que pueden hacer|que hacen|que ofrecen|que puedo hacer|opciones|soluciones)\b/.test(q)) {
    return `Para ${sector.label} podemos trabajar ${describeSectorApplications(sector)} ${getSectorIcon(sector)}. ¿Qué quieres revisar primero?`;
  }

  // PRECIOS: SI NO EXISTE EL DATO, NO SE INVENTA.
  if (/\b(cuanto cuesta|precio|costo).*\b(marco|aluminio|pvc|estructura)\b/.test(q)) {
    return 'Ese precio todavía está pendiente de actualización 🔧. Puedo avanzar con todos los demás datos y dejar ese componente pendiente.';
  }

  if (/\b(dame|quiero|puedes darme).*\b(precio|monto|aproximado).*\b(aunque|sin).*\b(datos|informacion|todo)\b/.test(q)) {
    return 'Puedo calcular solo con los precios que estén registrados 💰. Si falta algún componente, lo marco como pendiente en vez de inventarlo.';
  }

  if (/\b(cuanto cuesta|precio de).*\b(ventana|mampara|puerta|fachada|cerramiento)\b/.test(q) && !getSystemFromQuestion(q)) {
    return 'El precio depende de medidas, cantidad, vidrio, espesor y sistema 💰. Si quieres, lo cotizamos juntos paso a paso.';
  }

  // CLIENTE QUE NO DOMINA EL RUBRO.
  // Si ya existe un proyecto en curso, NO interceptamos frases como
  // "ayúdame a elegir" aquí: dejamos que buildAdvisorResponse vea en qué
  // paso está la conversación y recomiende justo esa decisión (material,
  // color, vidrio, espesor, apertura, etc.). Así evitamos bucles y preguntas
  // genéricas en mitad de una cotización.
  if (!product && /\b(no entiendo|no se nada|no conozco).*\b(vidrio|vidrios|cristal|vidrieria)\b|\b(ayudame|guiame).*\b(desde cero|elegir|vidrio)\b/.test(q)) {
    return '¡Para eso estoy! 😄 No necesitas saber términos técnicos. Dime qué quieres hacer y dónde irá, y yo te voy guiando.';
  }

  if (/\b(no se que quiero|no tengo claro que quiero|no se exactamente que necesito)\b/.test(q)) {
    return 'No hay problema 😊. Cuéntame qué espacio quieres mejorar y qué buscas lograr: seguridad, privacidad, iluminación, ventilación o diseño.';
  }

  if (/\b(que me recomiendas tu|tu que recomiendas|que harias tu)\b/.test(q)) {
    // Si ya hay un producto en curso, dejamos que el flujo normal decida cuál es el siguiente dato.
    // Así una pregunta genérica no salta accidentalmente hasta la elección del vidrio.
    if (product) return null;
    if (sector) return `Para ${sector.label}, primero definiría qué elemento necesitas y qué prioridad tienes. ${describeSectorApplications(sector)}. ¿Con cuál empezamos?`;
    return 'Te recomiendo en función del uso, no con una respuesta genérica 😊. Dime qué quieres instalar y dónde, y te doy una opción concreta.';
  }

  // Respuestas naturales para ambientes comunes sin convertirlas en interrogatorios largos.
  if (!product && /\b(que me recomiendas|que puedo hacer|que pondrias).*\b(cocina)\b/.test(q)) {
    return 'En cocina buscaría iluminación, ventilación y facilidad de limpieza 😊. ¿Quieres una ventana, puerta o división?';
  }

  if (!product && /\b(que me recomiendas|que puedo hacer|que pondrias).*\b(sala)\b/.test(q)) {
    return 'En sala priorizaría buena iluminación y amplitud visual ✨. ¿Quieres trabajar una ventana, mampara o puerta?';
  }

  if (!product && /\b(cerrar|cerramiento).*\b(balcon|terraza)\b/.test(q)) {
    return '¡Buena idea! 😊 Podemos evaluar una mampara o cerramiento. ¿Buscas más protección del clima, seguridad o mantener la vista?';
  }

  return null;
};

const buildAdvisorResponse = (text: string, context: ConversationContext): string | null => {
  const question = normalizeForMatch(text);
  const hasProject = Boolean(context.product);
  const sectorFromMessage = detectProjectSector(text);
  const sector = sectorFromMessage ?? detectProjectSector(`${context.environment} ${context.additionalDetails}`);
  const askedSystem = getSystemFromQuestion(question);
  const asksQuoteByMeasures = /\b(cotizar.*medidas|cotizacion.*medidas|segun mis medidas)\b/.test(question);
  const asksForQuote = !askedSystem && !asksQuoteByMeasures && /(cotiz\w*|presupuesto|cuanto me costaria|solicitar una cotizacion)/.test(question);
  const asksForGlass = /\b(que vidrio|tipo de vidrio|vidrios tienen|que vidrios|vidrio recomiendas)\b/.test(question);
  const asksForColors = /\b(que colores|colores disponibles|colores tienen|acabados disponibles)\b/.test(question);
  const asksForMaterials = /\b(que materiales|materiales trabajan|aluminio o pvc|materiales disponibles)\b/.test(question);
  const doesNotKnow = wantsGuidance(question);

  // Las preguntas predeterminadas se responden en generateResponse con su lógica original.
  if (askedSystem || asksQuoteByMeasures) return null;

  if (isFramePriceQuestion(text)) {
    return 'El precio del marco de aluminio/PVC todavía está pendiente. 🔧 Mientras tanto, puedo dejar toda la cotización preparada con tus datos.';
  }

  // Capa adicional de conocimiento: amplía lo que entiende sin alterar el flujo conversacional actual.
  const knowledgeResponse = buildVidrieriaKnowledgeResponse(text, context);
  if (knowledgeResponse) return knowledgeResponse;

  if (asksForGlass) {
    return `Trabajamos con ${officialGlassTypes.map((type) => type.toLowerCase()).join(', ')} en ${officialGlassThicknesses.join(' y ')}. 🪟 ¿Para qué proyecto lo necesitas?`;
  }

  if (asksForColors) {
    return `Estructura: ${officialStructureColors.join(', ').toLowerCase()}. 🎨 Vidrio: ${officialGlassColors.join(', ').toLowerCase()}. ¿Qué estás cotizando?`;
  }

  if (asksForMaterials) {
    return `Trabajamos con ${officialStructureMaterials.join(' y ').toLowerCase()}, más vidrio crudo, laminado y templado en ${officialGlassThicknesses.join(' y ')}. 🔧 ¿Para qué tipo de proyecto lo buscas?`;
  }

  if (sectorFromMessage && !hasProject) {
    return buildSectorProjectResponse(sectorFromMessage, context);
  }

  if (asksForQuote && !hasProject) {
    if (sector) return buildSectorProjectResponse(sector, context);
    return '¡Vamos a cotizar! 💰 ¿Qué necesitas: ventana, mampara, puerta, vidrio, espejo, fachada u otro proyecto?';
  }

  if (doesNotKnow && !hasProject) {
    return '¡Yo te guío! 😄 ¿Para qué tipo de proyecto lo buscas?';
  }

  if (!hasProject) return null;

  if (!context.environment) {
    return `¡Perfecto! 😄 ¿Para qué espacio o proyecto necesitas la ${context.product}?`;
  }

  if (!context.need && !/espejo/.test(context.product)) {
    if (doesNotKnow) return buildHumanNeedRecommendation(context);
    const sectorHints: Partial<Record<ProjectSectorId, string>> = {
      educacion: 'seguridad, ventilación o iluminación',
      salud: 'seguridad, privacidad o mantenimiento',
      residencial: 'seguridad, ventilación o aislamiento',
      corporativo: 'diseño, privacidad o aislamiento',
      comercial: 'seguridad, diseño o iluminación',
      hotelero: 'diseño, privacidad o seguridad',
      industrial: 'durabilidad, seguridad o clima',
      deportivo: 'seguridad, durabilidad o diseño',
      institucional: 'seguridad, durabilidad o iluminación',
      publico: 'seguridad, durabilidad o iluminación',
    };
    const sectorHint = sector ? sectorHints[sector.id] : undefined;
    return `¡Vamos bien! 🔥 ¿Qué quieres priorizar: ${sectorHint ?? 'seguridad, diseño, privacidad, ventilación o aislamiento'}? Si no sabes, te recomiendo una.`;
  }

  const openingPreference = detectOpeningPreference(context.additionalDetails);
  if (!openingPreference && /ventana|mampara|puerta/.test(context.product)) {
    if (doesNotKnow) return buildHumanOpeningRecommendation(context);
    const openingOptions = context.product === 'puerta' ? 'corrediza o abatible' : 'corrediza, fija o abatible';
    return `¿Cómo la prefieres: ${openingOptions}? 🚪 Si no sabes, te recomiendo una según el uso.`;
  }

  if (!context.material && /ventana|mampara|puerta|cerramiento|fachada|división/.test(context.product)) {
    if (doesNotKnow) return buildHumanMaterialRecommendation(context);
    return '¿La estructura la prefieres en aluminio o PVC? 🔧 Si no sabes cuál, te ayudo a elegir.';
  }

  if (!context.color && context.material && /aluminio|pvc/.test(context.material)) {
    if (doesNotKnow) return buildHumanStructureColorRecommendation(context);
    return `¡Perfecto! 🎨 ¿Qué color prefieres: natural, negro, blanco o color madera? Si quieres, te recomiendo uno.`;
  }

  if (!context.measures) {
    if (doesNotKnow) return 'La medida sí prefiero no inventarla 📐. Si aún no la tienes, podemos dejarla “por confirmar” y seguir con lo demás.';
    return 'Ahora sí, vamos con la medida 📐 ¿Cuánto tiene de ancho x alto?';
  }

  if (!context.quantity) {
    if (doesNotKnow) return 'No hay problema 🔢. Si todavía no sabes la cantidad, podemos dejarla “por confirmar” y seguir.';
    return '¡Anotado! 🔢 ¿Cuántas unidades necesitas?';
  }

  const requiresGlassDefinition = /ventana|mampara|puerta|vidrio|fachada|baranda|techo|cerramiento|división/.test(context.product);
  const safetyCritical = /fachada|baranda|techo/.test(context.product);

  if (doesNotKnow && requiresGlassDefinition && !context.glassType) {
    return buildHumanGlassRecommendation(context);
  }

  if (requiresGlassDefinition && !context.glassType) {
    return '¿Qué vidrio prefieres: crudo, laminado o templado? 🪟 Si no sabes, dime “recomiéndame”.';
  }

  if (requiresGlassDefinition && !safetyCritical && !context.glassThickness) {
    if (doesNotKnow || /\b(6|8)\s*mm\b/.test(question) || /\bdiferencia\b/.test(question)) return buildHumanThicknessRecommendation(context);
    return `¡Casi listo! ✨ ¿Espesor de ${officialGlassThicknesses.join(' o ')}? Si no sabes cuál, te recomiendo uno.`;
  }

  if (requiresGlassDefinition && !context.glassColor) {
    if (doesNotKnow) return buildHumanGlassColorRecommendation(context);
    return `Último detalle 🎨 ¿Vidrio transparente, bronce, azul claro o azul electra? Si quieres, te recomiendo uno.`;
  }

  if (safetyCritical && !context.glassThickness) {
    return 'Por seguridad, el espesor lo dejamos para validación técnica. ✅ Ya puedo preparar la solicitud de cotización.';
  }

  if (/mampara/.test(context.product) && normalizeForMatch(context.glassType) === 'crudo') {
    return 'Para las mamparas con serie que tenemos registradas, el vidrio asociado es templado 🪟. Con vidrio crudo no te asignaría una serie compatible. Te recomiendo templado; ¿lo dejamos como templado?';
  }

  if (hasSeriesOptionsForContext(context) && !hasConfirmedValue(context.series)) {
    const normalized = normalizeForMatch(text);
    const asksNational = /\b(serie nacional|nacional)\b/.test(normalized);
    const asksEuropean = /\b(serie espanola|serie europea|espanola|europea)\b/.test(normalized);

    if (doesNotKnow || /\b(recomiend|aconsej|conviene|mejor)\w*/.test(normalized)) {
      return buildBudgetSeriesRecommendation(context);
    }

    if (asksNational || asksEuropean) {
      const category = asksEuropean ? 'Serie Española' : 'Serie Nacional';
      const options = windowSystems
        .filter((system) => system.category === category)
        .filter((system) => isSeriesCompatibleWithContext(system, context))
        .map((system) => {
          const estimate = calculateRegisteredSeriesEstimate(system, context.measures, context.quantity);
          return estimate
            ? `• ${system.name}: aprox. ${formatCurrency(estimate.total)}`
            : `• ${system.name}: ${formatCurrency(system.price)} por ${system.unit}`;
        });
      return `${asksEuropean ? 'Serie Española/Europea' : 'Serie Nacional'} 👍 Estas son las opciones registradas para tu ${context.product} y tus medidas:
${options.join('\n')}

Si ya tienes una serie, dime cuál. Si no, puedo recomendarte una como referencia.`;
    }
  }

  const approximateQuote = buildApproximateQuote(context, text);
  return `¡Listo! ✅ Ya tengo lo principal de tu ${context.product}${sector ? ` para ${sector.label}` : ''}. La cotización aproximada está lista.${approximateQuote ? `\n\n${approximateQuote}` : '\n\n💰 No encontré un precio registrado aplicable para este producto o componente. El asesor confirma ese valor.\n✅ Instalación: gratis.'}`;
};
function generateResponse(
  text: string,
  selectedProduct: string,
  _customerNeed: string,
  conversationContext: ConversationContext
): {
  text: string;
  quote?: QuoteResult;
  input?: CustomInput;
} {
  const product = conversationContext.product || normalizeProductContext(selectedProduct);
  const environment = conversationContext.environment;
  const measures = conversationContext.measures;
  const color = conversationContext.color;
  const quantity = conversationContext.quantity;
  const material = conversationContext.material;
  const glassType = conversationContext.glassType;
  const glassThickness = conversationContext.glassThickness;
  const q = normalizeForMatch(text);
  const sector = detectProjectSector(`${text} ${environment} ${conversationContext.additionalDetails}`);

  const askedAboutSystem = getSystemFromQuestion(q);
  if (askedAboutSystem && /\b(que es|informacion|caracteristica|como es)\b/.test(q)) {
    const catalogProduct = products.find((item) => item.id === askedAboutSystem.id);
    const shortDescription = (catalogProduct?.description ?? 'Es un sistema disponible en Zhaid Glass Solutions.').split('. ')[0];
    return {
      text: `${askedAboutSystem.name} pertenece a ${askedAboutSystem.category}. ${shortDescription}.

Vidrio: ${catalogProduct?.glassType ? `vidrio ${catalogProduct.glassType.toLowerCase()}` : 'según proyecto'} · Espesores: ${officialGlassThicknesses.join(' y ')} · Unidad: ${askedAboutSystem.unit}.\n\n¿Quieres cotizarla? 😊`
    };
  }

  // Se conserva la respuesta original de precio y, si ya hay medidas + cantidad,
  // se agrega el cálculo aproximado usando únicamente el precio registrado de la serie.
  if (askedAboutSystem && /\b(cuanto cuesta|precio|precios|valor|costo)\b/.test(q)) {
    const estimate = buildRegisteredSeriesEstimate(conversationContext, text);
    return {
      text: `${askedAboutSystem.name}: ${formatCurrency(askedAboutSystem.price)} por ${askedAboutSystem.unit}. 💰${estimate ? `\n\n${estimate}` : ' El total depende de medidas y cantidad. ¿Quieres cotizarla?'}`
    };
  }

  if (/diferencia.*serie nacional.*serie espanola|serie nacional.*serie espanola.*diferencia/.test(q)) {
    const nationalSystems = windowSystems.filter((system) => system.category === 'Serie Nacional').map((system) => system.name).join(', ');
    const spanishSystems = windowSystems.filter((system) => system.category === 'Serie Española').map((system) => system.name).join(', ');
    return {
      text: `Serie Nacional: ${nationalSystems || 'por confirmar'}.
Serie Española: ${spanishSystems || 'por confirmar'}.

La mejor opción depende del proyecto, medidas y vidrio.`
    };
  }

  // Se conserva la pregunta predeterminada y su respuesta con las opciones/precios registrados.
  if (/opciones.*serie espanola|serie espanola.*disponible|serie espanola.*opciones/.test(q)) {
    const spanishSystems = windowSystems.filter((system) => system.category === 'Serie Española');
    return {
      text: `Tenemos estas opciones de Serie Española:
${spanishSystems.length ? spanishSystems.map((system) => `• ${system.name}: ${formatCurrency(system.price)} por ${system.unit}`).join('\n') : '• Información por confirmar'}

¿Quieres cotizar alguna? 😊`
    };
  }

  if (/\b(que materiales|materiales trabajan|materiales disponibles)\b/.test(q)) {
    return { text: `Trabajamos con ${officialStructureMaterials.join(' y ').toLowerCase()} para estructuras, y vidrio crudo, laminado y templado en ${officialGlassThicknesses.join(' y ')}. 🔧 ¿Para qué proyecto lo buscas?` };
  }

  if (/\b(cotizar.*medidas|cotizacion.*medidas|segun mis medidas)\b/.test(q)) {
    return { text: '¡Sí! 📐 Puedes cotizar según tus medidas en “Cotiza a tu medida”. Si lo hacemos aquí, te pregunto todo uno por uno. ¿Qué deseas cotizar?' };
  }

  if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|saludos|que tal|hola que tal|oye bro|oe bro|bro que tal)$/.test(q)) {
    return {
      text: '¡Hola! 😄 Todo bien por aquí. Soy Zhaid IA. Cuéntame qué quieres hacer con vidrio, ventanas, mamparas, puertas o algún proyecto, y te voy guiando.'
    };
  }

  if (/\b(gracias|muchas gracias|perfecto gracias)\b/.test(q)) {
    return { text: '¡Con gusto! 🙌 Tengo guardado el contexto, así que podemos seguir desde donde quedamos.' };
  }

  if (isFramePriceQuestion(text)) {
    return { text: 'El precio del marco de aluminio/PVC todavía está pendiente. 🔧 Puedo dejar el resto de la cotización listo.' };
  }

  const openingPreference = detectOpeningPreference(text);
  if (product && openingPreference) {
    const nextStep = buildAdvisorResponse('', conversationContext);
    return {
      text: `¡Perfecto! 🚪 Queda ${openingPreference}. ${nextStep ?? ''}`.trim()
    };
  }

  if (product && /(recomiend\w*|conviene|mejor|ideal|opcion)/.test(q)) {
    const nextStep = buildAdvisorResponse('', conversationContext);
    return { text: `${getProductAdvice(product, sector)} ${nextStep ?? ''}`.trim() };
  }

  if (product && measures) {
    const summary = [
      `${product}`,
      measures,
      quantity ? `${quantity} und.` : '',
      material || '',
      color || '',
      glassType ? `vidrio ${glassType}` : '',
      glassThickness || '',
    ].filter(Boolean).join(' · ');
    const nextStep = buildAdvisorResponse('', conversationContext);
    return { text: `¡Anotado! ✅ ${summary}.${nextStep ? `

${nextStep}` : ''}` };
  }

  if (product) {
    const nextStep = buildAdvisorResponse('', conversationContext);
    return { text: nextStep ?? `¡Perfecto! 😄 Sigamos con tu ${product}.` };
  }

  if (sector) {
    return { text: buildSectorProjectResponse(sector, conversationContext) };
  }

  if (!product && environment) {
    return { text: `¡Buenísimo! 😄 Para ${environment} puedo ayudarte con ventanas, puertas, mamparas/divisiones, fachadas, cerramientos y vidrio a medida. ¿Qué deseas cotizar primero?` };
  }

  if (/^(si|sí|claro|ok|correcto|de acuerdo|adelante)$/.test(q)) {
    if (!product && conversationContext.series) {
      return { text: `¡Vamos! 💰 ¿Qué deseas cotizar con ${conversationContext.series}?` };
    }
    if (!product) {
      return { text: '¡Perfecto! 😄 ¿Qué producto o serie quieres cotizar?' };
    }
    return { text: '¡Perfecto! 😄 Sigamos con el siguiente dato.' };
  }

  if (/^(no|no gracias|todavia no|aun no)$/.test(q)) {
    return { text: 'Sin problema 🙂 Cuéntame qué prefieres y ajustamos la opción.' };
  }

  return {
    text: '¡Te sigo! 😄 Cuéntame qué quieres cotizar o para qué tipo de proyecto lo necesitas.'
  };
}

export default function SaidAI({ open, onClose, pendingQuote, clearPending, initialProduct }: SaidAIProps) {
  const initialContext: ConversationContext = {
    product: '',
    series: '',
    environment: '',
    need: '',
    measures: '',
    climate: '',
    color: '',
    quantity: '',
    material: '',
    glassType: '',
    glassThickness: '',
    glassColor: '',
    additionalDetails: '',
    updatedAt: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      text: '¡Hola! 😊 Soy Zhaid IA, tu asistente vidriero virtual. Estoy listo para ayudarte con precios, recomendaciones o cotizaciones.',
    },
  ]);
  const [input, setInput] = useState('');
  const [conversationContext, setConversationContext] = useState<ConversationContext>(initialContext);
  const [pendingProduct, setPendingProduct] = useState<string | null>(initialProduct ?? null);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<Product | null>(null);
  const [catalogStep, setCatalogStep] = useState<'intro' | 'measures' | 'quantity' | 'color' | 'glass' | 'thickness' | 'details' | 'summary'>('intro');
  const [catalogData, setCatalogData] = useState({ width: '', height: '', measureText: '', color: '', quantity: '', glassType: '', thickness: '', projectType: '', observations: '' });
  const [productFlowInitialized, setProductFlowInitialized] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    const conversation = messages
      .map((message) => `${message.role === 'user' ? 'Cliente' : 'Zhaid IA'}: ${message.text}`)
      .join('\n\n');

    window.localStorage.setItem('zhaid-ai-context', JSON.stringify({ context: conversationContext, conversation }));
  }, [open, messages, conversationContext]);

  useEffect(() => {
    if (!open) {
      setSelectedCatalogProduct(null);
      setCatalogStep('intro');
      setCatalogData({ width: '', height: '', measureText: '', color: '', quantity: '', glassType: '', thickness: '', projectType: '', observations: '' });
      setProductFlowInitialized(false);
      setPendingProduct(null);
      return;
    }

    const productMatch = resolveSelectedProduct(initialProduct ?? pendingProduct ?? null);
    if (productMatch) {
      setSelectedCatalogProduct(productMatch);
      setCatalogStep('measures');
      setCatalogData({ width: '', height: '', measureText: '', color: '', quantity: '', glassType: '', thickness: '', projectType: '', observations: '' });
    } else {
      setSelectedCatalogProduct(null);
      setCatalogStep('intro');
      setCatalogData({ width: '', height: '', measureText: '', color: '', quantity: '', glassType: '', thickness: '', projectType: '', observations: '' });
      setProductFlowInitialized(false);
    }

    if (initialProduct) {
      setPendingProduct(initialProduct);
    }

    if (!open || !initialProduct) return;

    const productNameFromContext = resolveSelectedProduct(initialProduct ?? pendingProduct ?? null)?.name ?? initialProduct;
    const shouldUseCatalogQuote = Boolean(resolveSelectedProduct(initialProduct ?? pendingProduct ?? null));

    if (shouldUseCatalogQuote) {
      if (productFlowInitialized) return;

      const product = resolveSelectedProduct(initialProduct ?? pendingProduct ?? null)!;
      const productPrice = Number(product.priceFrom ?? product.price ?? 0);
      const productPriceLabel = productPrice > 0 && !isStructureCatalogProduct(product) ? formatCurrency(productPrice) : 'Pendiente de confirmación';

      setProductFlowInitialized(true);
      setMessages((m) => {
        const hasInitialPrompt = m.some(
          (msg) =>
            msg.role === 'assistant' &&
            msg.text.toLowerCase().includes(productNameFromContext.toLowerCase())
        );

        if (hasInitialPrompt) return m;

        return [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: `¡Vamos a cotizar ${product.name}! 💰
Referencia: ${productPriceLabel} por ${product.unit}.

Primero, ¿qué medida necesitas? 📐 (ancho x alto)`,
          },
        ];
      });
      return;
    }

    setMessages((m) => {
      const hasInitialPrompt = m.some(
        (msg) =>
          msg.role === 'assistant' &&
          msg.text.toLowerCase().includes(`para ayudarte con ${initialProduct.toLowerCase()}`)
      );

      if (hasInitialPrompt) return m;

      return [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `¡Perfecto! 😄 Vamos a cotizar ${initialProduct}. ¿Para qué espacio o proyecto lo necesitas?`,
        },
      ];
    });
  // productFlowInitialized intentionally acts as a guard inside this initialization effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialProduct, pendingProduct]);

  useEffect(() => {
    if (pendingQuote) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'user',
          text: `Cotización: ${pendingQuote.result.systemName ?? 'Producto no especificado'}; medidas ${pendingQuote.input.widthCm} × ${pendingQuote.input.heightCm} cm; cantidad ${pendingQuote.input.quantity}; vidrio ${pendingQuote.input.glassType}; espesor ${pendingQuote.input.thickness}; marco ${frameTypes.find((frame) => frame.id === pendingQuote.input.frameId)?.name ?? pendingQuote.input.frameId}; subtotal visible de vidrio ${formatCurrency(getQuoteSubtotalWithoutFrame(pendingQuote.result))}.`,
        },
      ]);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: '¡Listo! 😊 Este es el subtotal disponible. El marco/estructura sigue pendiente:',
            quote: pendingQuote.result,
          },
        ]);
      }, 900);
      clearPending();
    }
  }, [pendingQuote, clearPending]);

  const send = (text: string) => {
    if (!text.trim()) return;

    const lastAssistantText = [...messages].reverse().find((message) => message.role === 'assistant')?.text ?? '';
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text
    };

    setMessages((m) => [...m, userMsg]);
    setInput('');

    if (selectedCatalogProduct) {
      const lower = normalizeForMatch(text);
      const parsedMeasures = parseCatalogMeasures(text);
      const explicitQuantity = text.match(/(?:cantidad|qty|unidades?|piezas?)\s*[:=]?\s*(\d+)/i)
        ?? text.match(/\b(\d+)\s*(?:und|uds|unidades?|piezas?)\b/i);
      const bareQuantity = text.trim().match(/^\d+$/)?.[0] ?? '';
      const quantityFromMessage = explicitQuantity?.[1] ?? bareQuantity;
      const productUnit = selectedCatalogProduct.unit;
      const productPrice = Number(selectedCatalogProduct.priceFrom ?? selectedCatalogProduct.price ?? 0);
      const isRegisteredSeriesProduct = windowSystems.some((system) => system.id === selectedCatalogProduct.id);
      const hasKnownProductPrice = Number.isFinite(productPrice) && productPrice > 0
        && (isRegisteredSeriesProduct || !isStructureCatalogProduct(selectedCatalogProduct));

      if (catalogStep === 'measures') {
        if (!parsedMeasures) {
          setMessages((m) => [...m, {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: '📐 Escríbeme ancho x alto. Ejemplo: 120 x 90 cm o 1.20 x 0.90 m.',
          }]);
          return;
        }

        setCatalogData((prev) => ({
          ...prev,
          width: parsedMeasures.widthCm,
          height: parsedMeasures.heightCm,
          measureText: parsedMeasures.display,
        }));
        setCatalogStep('quantity');
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `¡Perfecto! 📐 Guardé ${parsedMeasures.display}. ¿Cuántas unidades necesitas? 🔢`,
        }]);
        return;
      }

      if (catalogStep === 'quantity') {
        if (!quantityFromMessage || Number(quantityFromMessage) <= 0) {
          setMessages((m) => [...m, {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: '🔢 ¿Cuántas unidades necesitas? Puedes responder solo con el número.',
          }]);
          return;
        }

        setCatalogData((prev) => ({ ...prev, quantity: quantityFromMessage }));
        setCatalogStep('color');
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: '¡Anotado! 🎨 ¿Qué color prefieres: natural, negro, blanco, color madera u otro?',
        }]);
        return;
      }

      if (catalogStep === 'color') {
        const detectedColor = detectColorFromText(text);
        const wantsRecommendation = wantsGuidance(text);
        const recommendedColor = wantsRecommendation ? getContextualStructureColorRecommendation(conversationContext) : null;
        const normalizedColor = detectedColor
          ? detectedColor === 'madera' ? 'Color madera' : detectedColor.charAt(0).toUpperCase() + detectedColor.slice(1)
          : recommendedColor
          ? recommendedColor.value === 'madera' ? 'Color madera' : recommendedColor.value.charAt(0).toUpperCase() + recommendedColor.value.slice(1)
          : lower.includes('otro') ? text.trim() : '';

        if (!normalizedColor) {
          setMessages((m) => [...m, {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: '🎨 Elige un color: natural, negro, blanco, color madera u otro. Si no sabes, te recomiendo uno.',
          }]);
          return;
        }

        setCatalogData((prev) => ({ ...prev, color: normalizedColor }));
        setCatalogStep('glass');
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: recommendedColor
            ? `Yo elegiría ${normalizedColor.toLowerCase()} 🎨 porque ${recommendedColor.reason}. Lo dejo anotado. Ahora, ¿qué vidrio prefieres: crudo, laminado o templado?`
            : '¡Buenísimo! 🪟 ¿Qué vidrio prefieres: crudo, laminado o templado? Si no sabes, te recomiendo uno.',
        }]);
        return;
      }

      if (catalogStep === 'glass') {
        const detectedGlass = detectGlassTypeFromText(text);
        const wantsRecommendation = /no se|recomiend|que me conviene|cual me conviene/.test(lower);
        if (!detectedGlass && !/por confirmar/.test(lower) && !wantsRecommendation) {
          setMessages((m) => [...m, {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: '🪟 Puedes elegir crudo, laminado o templado. Si no sabes, escribe “recomiéndame”.',
          }]);
          return;
        }

        const catalogProductContext = detectProductFromText(
          `${selectedCatalogProduct.name} ${selectedCatalogProduct.category}`,
          conversationContext.product
        ) || conversationContext.product;
        const recommendation = wantsRecommendation
          ? getContextualGlassRecommendation(conversationContext, catalogProductContext)
          : null;
        const glassValue = detectedGlass || recommendation?.glassType || 'Por confirmar';
        setCatalogData((prev) => ({ ...prev, glassType: glassValue }));
        setCatalogStep('thickness');
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: recommendation
            ? `Yo elegiría vidrio ${recommendation.glassType} 🪟 porque ${recommendation.reason}. Lo dejo como ${recommendation.glassType}. ✨ ¿Espesor de ${officialGlassThicknesses.join(' o ')}?`
            : `¡Perfecto! ✨ ¿Espesor de ${officialGlassThicknesses.join(' o ')}? También puedes decir “por confirmar”.`,
        }]);
        return;
      }

      if (catalogStep === 'thickness') {
        const detectedThickness = detectThicknessFromText(text);
        const wantsRecommendation = wantsGuidance(text) || /\b(diferencia|6\s*mm.*8\s*mm|8\s*mm.*6\s*mm)\b/.test(lower);
        const catalogProductContext = detectProductFromText(
          `${selectedCatalogProduct.name} ${selectedCatalogProduct.category}`,
          conversationContext.product
        ) || conversationContext.product;
        const recommendation = wantsRecommendation
          ? getContextualThicknessRecommendation(conversationContext, catalogProductContext)
          : null;

        if (!detectedThickness && !/por confirmar/.test(lower) && !recommendation) {
          setMessages((m) => [...m, {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: `✨ Elige ${officialGlassThicknesses.join(' o ')}, o dime “recomiéndame”.`,
          }]);
          return;
        }

        const thicknessValue = detectedThickness || recommendation?.value || 'Por confirmar';
        setCatalogData((prev) => ({ ...prev, thickness: thicknessValue }));
        setCatalogStep('details');
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: recommendation
            ? `Entre 6 y 8 mm, yo elegiría ${recommendation.value} ✨ porque ${recommendation.reason}. Lo dejo anotado. ¿Algún accesorio u observación? Si no, escribe “ninguno”.`
            : '¡Último detalle! 😄 ¿Algún accesorio u observación? Si no, escribe “ninguno”.',
        }]);
        return;
      }

      if (catalogStep === 'details') {
        const observations = text.trim() || 'Ninguno';
        const widthValue = Number(catalogData.width || '0');
        const heightValue = Number(catalogData.height || '0');
        const quantityValue = Number(catalogData.quantity || '0');
        const colorValue = catalogData.color || 'No indicado';
        const glassTypeValue = catalogData.glassType || 'Por confirmar';
        const thicknessValue = catalogData.thickness || 'Por confirmar';
        const accessoriesValue = /^(ninguno|ninguna|no|sin accesorios)$/i.test(observations) ? 'Sin accesorios indicados' : observations;

        const dimensionsValid = Number.isFinite(widthValue) && widthValue > 0 && Number.isFinite(heightValue) && heightValue > 0;
        const quantityValid = Number.isFinite(quantityValue) && quantityValue > 0;
        let estimatedTotal: number | null = null;

        if (hasKnownProductPrice && dimensionsValid && quantityValid && (productUnit === 'm²' || productUnit === 'm')) {
          const areaM2 = (widthValue * heightValue) / 10000;
          estimatedTotal = productPrice * areaM2 * quantityValue;
        } else if (hasKnownProductPrice && dimensionsValid && quantityValid && productUnit === 'pie') {
          const perimeterM = (2 * (widthValue + heightValue)) / 100;
          const linearFeet = perimeterM / 0.3048;
          estimatedTotal = productPrice * linearFeet * quantityValue;
        } else if (hasKnownProductPrice && quantityValid && productUnit === 'und') {
          estimatedTotal = productPrice * quantityValue;
        }

        const unitPriceLine = hasKnownProductPrice
          ? `${formatCurrency(productPrice)} por ${productUnit}`
          : 'Pendiente de confirmación';
        const totalLine = estimatedTotal !== null
          ? formatCurrency(estimatedTotal)
          : 'Pendiente de confirmación';
        const measureLabel = catalogData.measureText || `${catalogData.width} x ${catalogData.height} cm`;

        const summaryText = `¡Cotización preparada! ✅

${selectedCatalogProduct.name}
📐 ${measureLabel} · 🔢 ${catalogData.quantity} und.
🎨 ${colorValue}
🪟 ${glassTypeValue} · ${thicknessValue}
💰 Estimado: ${totalLine}
✅ Instalación: gratis
🔧 Marco aluminio/PVC: pendiente

Puedes enviarla por WhatsApp.`;

        setCatalogData((prev) => ({ ...prev, observations }));
        setCatalogStep('summary');
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: summaryText,
            waLink: getWhatsAppLink(`Hola Zhaid Glass Solutions 👋

Quiero solicitar una cotización.

Producto: ${selectedCatalogProduct.name}
Categoría: ${selectedCatalogProduct.category}
Medidas: ${measureLabel}
Cantidad: ${catalogData.quantity || 'N/A'}
Color: ${colorValue}
Tipo de vidrio: ${glassTypeValue}
Espesor: ${thicknessValue}
Accesorios/observaciones: ${accessoriesValue}
Precio unitario registrado: ${unitPriceLine}
Cotización estimada: ${totalLine}
Instalación: gratis.
Precio de estructura aluminio/PVC: pendiente de actualización.

Gracias.`),
          },
        ]);
        return;
      }

      if (catalogStep === 'summary') {
        const normalizedReply = normalizeForMatch(text);
        if (/\b(nueva|otra|reiniciar|otra cotizacion)\b/.test(normalizedReply)) {
          setCatalogStep('measures');
          setCatalogData({ width: '', height: '', measureText: '', color: '', quantity: '', glassType: '', thickness: '', projectType: '', observations: '' });
          setMessages((m) => [...m, {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: '¡Vamos otra vez! 🔥 ¿Qué medida necesitas? (ancho x alto)',
          }]);
          return;
        }
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: '✅ Ya está lista. Puedes enviarla por WhatsApp o escribir “nueva cotización”.',
        }]);
        return;
      }

      return;
    }

    const lower = normalizeForMatch(text);
    const previousContext = conversationContext;
    console.log('contexto anterior', previousContext);

    const isGeneralKnowledgeQuestion = /\b(que vidrios|tipo de vidrio|vidrios tienen|que materiales|materiales trabajan|que colores|colores disponibles)\b/.test(lower);
    const detectedProduct = isGeneralKnowledgeQuestion ? '' : detectProductFromText(text, conversationContext.product);
    const detectedMeasures = extractMeasuresFromText(text);
    const hasMeasurementOnlyReply = Boolean(detectedMeasures) && !detectedProduct;
    const flowProduct = normalizeProductContext((pendingProduct ?? initialProduct ?? conversationContext.product ?? '').toString());
    const systemMatch = getSystemFromQuestion(lower);

    let nextProduct = detectedProduct || flowProduct;
    if (hasMeasurementOnlyReply && flowProduct) nextProduct = flowProduct;

    if (hasMeasurementOnlyReply && pendingProduct) {
      setPendingProduct(null);
    }

    const knownEnvironment = detectEnvironmentFromText(text);
    const genericEnvironment = !knownEnvironment ? detectGenericProjectContext(text) : '';
    const assistantAskedProjectContext = /para que tipo de proyecto|para que espacio o proyecto|para que lo buscas/.test(normalizeForMatch(lastAssistantText));
    const bareEnvironmentReply = !knownEnvironment && !genericEnvironment && !detectedProduct && assistantAskedProjectContext && text.trim().length <= 60
      ? text.trim().toLowerCase()
      : '';
    const detectedEnvironment = knownEnvironment || genericEnvironment || bareEnvironmentReply;
    const nextEnvironment = detectedEnvironment || conversationContext.environment;
    const detectedNeedFromMessage = detectNeedFromText(text);
    const detectedClimate = detectClimateFromText(text);
    const nextClimate = detectedClimate || conversationContext.climate;

    const normalizedLastAssistant = normalizeForMatch(lastAssistantText);
    const explicitPendingReply = /\b(por confirmar|por definir|cualquiera)\b/.test(lower);
    const affirmativeReply = /^(si|sí|claro|ok|okay|correcto|de acuerdo|adelante|dale|va|de una|perfecto|si bro|sí bro)$/.test(text.trim().toLowerCase());
    const suggestedGlass = normalizedLastAssistant.match(/lo dejamos como (crudo|laminado|templado)/)?.[1] ?? '';
    const suggestedNeed = normalizedLastAssistant.match(/lo dejamos como (seguridad|diseno|privacidad|ventilacion|iluminacion|aislamiento|durabilidad|clima)/)?.[1] ?? '';
    const suggestedOpening = normalizedLastAssistant.match(/la dejamos (corrediza|fija|abatible)/)?.[1] ?? '';
    const suggestedMaterial = normalizedLastAssistant.match(/lo dejamos en (aluminio|pvc)/)?.[1] ?? '';
    const suggestedStructureColor = normalizedLastAssistant.match(/lo dejamos en (natural|negro|blanco|color madera|madera)/)?.[1] ?? '';
    const suggestedThickness = normalizedLastAssistant.match(/lo dejamos en (6|8)\s*mm/)?.[1] ?? '';
    const suggestedGlassColor = normalizedLastAssistant.match(/lo dejamos (transparente|bronce|azul claro|azul electra)/)?.[1] ?? '';
    const suggestedSeries = windowSystems.find((system) =>
      isRegisteredQuoteSeries(system) &&
      normalizedLastAssistant.includes(normalizeForMatch(system.name)) &&
      /como referencia|la usamos como referencia/.test(normalizedLastAssistant)
    )?.name ?? '';
    const confirmedSuggestedGlass = affirmativeReply ? suggestedGlass : '';
    const confirmedSuggestedNeed = affirmativeReply ? suggestedNeed : '';
    const confirmedSuggestedOpening = affirmativeReply ? suggestedOpening : '';
    const confirmedSuggestedMaterial = affirmativeReply ? suggestedMaterial : '';
    const confirmedSuggestedStructureColor = affirmativeReply ? suggestedStructureColor : '';
    const confirmedSuggestedThickness = affirmativeReply && suggestedThickness ? `${suggestedThickness}mm` : '';
    const confirmedSuggestedGlassColor = affirmativeReply ? suggestedGlassColor : '';
    const confirmedSuggestedSeries = affirmativeReply ? suggestedSeries : '';
    const nextSeries = systemMatch?.name || confirmedSuggestedSeries || conversationContext.series;
    const assistantAskedNeed = /que quieres priorizar|lo dejamos como/.test(normalizedLastAssistant);
    const assistantAskedColor = /que color|color prefieres|lo dejamos en (natural|negro|blanco|color madera)/.test(normalizedLastAssistant);
    const assistantAskedMaterial = /aluminio o pvc|estructura.*prefieres|lo dejamos en (aluminio|pvc)/.test(normalizedLastAssistant);
    const assistantAskedGlass = /que vidrio|vidrio prefieres|lo dejamos como (crudo|laminado|templado)/.test(normalizedLastAssistant);
    const assistantAskedThickness = /espesor|6 y 8 mm|6 o 8 mm/.test(normalizedLastAssistant);
    const assistantAskedGlassColor = /vidrio transparente|azul electra|lo dejamos (transparente|bronce|azul claro|azul electra)/.test(normalizedLastAssistant);
    const assistantAskedOpening = /como la prefieres|corrediza.*fija.*abatible|la dejamos (corrediza|fija|abatible)/.test(normalizedLastAssistant);
    const assistantAskedMeasures = /medida|ancho x alto/.test(normalizedLastAssistant);
    const assistantAskedQuantity = /cuantas|cuantos|cantidad|unidades/.test(normalizedLastAssistant);

    const detectedColor = detectColorFromText(text)
      || (confirmedSuggestedStructureColor ? (confirmedSuggestedStructureColor === 'color madera' ? 'madera' : confirmedSuggestedStructureColor) : '')
      || (explicitPendingReply && assistantAskedColor ? 'por confirmar' : '');
    const nextColor = detectedColor || conversationContext.color;
    const detectedMaterial = detectMaterialFromText(text) || confirmedSuggestedMaterial || (explicitPendingReply && assistantAskedMaterial ? 'por confirmar' : '');
    const nextMaterial = detectedMaterial || conversationContext.material;
    const detectedGlassType = detectGlassTypeFromText(text) || confirmedSuggestedGlass || (explicitPendingReply && assistantAskedGlass ? 'por confirmar' : '');
    const nextGlassType = detectedGlassType || conversationContext.glassType;
    const detectedThickness = detectThicknessFromText(text) || confirmedSuggestedThickness || (explicitPendingReply && assistantAskedThickness ? 'por confirmar' : '');
    const nextGlassThickness = detectedThickness || conversationContext.glassThickness;
    const detectedGlassColor = detectGlassColorFromText(text) || confirmedSuggestedGlassColor || (explicitPendingReply && assistantAskedGlassColor ? 'por confirmar' : '');
    const nextGlassColor = detectedGlassColor || conversationContext.glassColor;
    const detectedNeed = detectedNeedFromMessage || (confirmedSuggestedNeed === 'diseno' ? 'diseño' : confirmedSuggestedNeed) || (explicitPendingReply && assistantAskedNeed ? 'por confirmar' : '');
    const nextNeed = detectedNeed || conversationContext.need;
    const detectedMeasuresFinal = detectedMeasures || (explicitPendingReply && assistantAskedMeasures ? 'por confirmar' : '');
    const nextMeasures = detectedMeasuresFinal || conversationContext.measures;
    const expectsQuantity = /(?:cuantas|cuantos|cantidad|piezas|unidades)/.test(normalizeForMatch(lastAssistantText));
    const bareQuantity = expectsQuantity ? text.trim().match(/^\d+$/)?.[0] ?? '' : '';
    const detectedQuantity = detectQuantityFromText(text) || bareQuantity || (explicitPendingReply && assistantAskedQuantity ? 'por confirmar' : '');
    const nextQuantity = detectedQuantity || conversationContext.quantity;
    const openingPreference = detectOpeningPreference(text) || confirmedSuggestedOpening || (explicitPendingReply && assistantAskedOpening ? 'por confirmar' : '');
    const sectorFromMessage = detectProjectSector(text);

    console.log('datos nuevos', {
      detectedProduct: detectedProduct || null,
      detectedEnvironment: detectedEnvironment || null,
      detectedNeed: detectedNeed || null,
      detectedMeasures: detectedMeasuresFinal || null,
      detectedClimate: detectedClimate || null,
      detectedColor: detectedColor || null,
      detectedMaterial: detectedMaterial || null,
      detectedGlassType: detectedGlassType || null,
      detectedThickness: detectedThickness || null,
      detectedQuantity: detectedQuantity || null,
      openingPreference: openingPreference || null,
      pendingProduct,
      nextProduct,
      hasMeasurementOnlyReply,
    });

    const shouldResetProductSpecificContext = Boolean(conversationContext.product && nextProduct && conversationContext.product !== nextProduct);

    const newContext: ConversationContext = {
      product: nextProduct,
      series: shouldResetProductSpecificContext ? (systemMatch?.name ?? '') : nextSeries,
      environment: shouldResetProductSpecificContext ? detectedEnvironment : nextEnvironment,
      need: shouldResetProductSpecificContext ? detectedNeed : nextNeed,
      measures: shouldResetProductSpecificContext ? detectedMeasuresFinal : nextMeasures,
      climate: shouldResetProductSpecificContext ? detectedClimate : nextClimate,
      color: shouldResetProductSpecificContext ? detectedColor : nextColor,
      quantity: shouldResetProductSpecificContext ? detectedQuantity : nextQuantity,
      material: shouldResetProductSpecificContext ? detectedMaterial : nextMaterial,
      glassType: shouldResetProductSpecificContext ? detectedGlassType : nextGlassType,
      glassThickness: shouldResetProductSpecificContext ? detectedThickness : nextGlassThickness,
      glassColor: shouldResetProductSpecificContext ? detectedGlassColor : nextGlassColor,
      additionalDetails: shouldResetProductSpecificContext
        ? (openingPreference === 'por confirmar' ? `${text.trim()}\napertura: por confirmar` : text.trim())
        : appendAdditionalDetails(
            conversationContext.additionalDetails,
            openingPreference === 'por confirmar' ? `${text.trim()}\napertura: por confirmar` : text
          ),
      updatedAt: new Date().toISOString(),
    };

    console.log('contexto final', newContext);
    setConversationContext(newContext);
    setTyping(true);

    setTimeout(() => {
      const lastAssistantPrompt = normalizeForMatch(lastAssistantText).replace(/[¿?¡!]/g, '').trim();
      const normalizedUserReply = normalizeForMatch(text).replace(/[.,;:!?]/g, ' ').replace(/\s+/g, ' ').trim();
      const isWhatsAppConfirmationQuestion = lastAssistantPrompt.includes('whatsapp');
      const isDirectWhatsAppConfirmation = /^(si|si quiero|quiero|claro|adelante|ok|de acuerdo|correcto)$/.test(normalizedUserReply);
      const hasNewProjectInfo = Boolean(
        detectedProduct || detectedEnvironment || detectedMeasures || detectedColor || detectedClimate || detectedNeed ||
        detectedMaterial || detectedGlassType || detectedThickness || detectedGlassColor || detectedQuantity ||
        openingPreference || sectorFromMessage || systemMatch
      );
      const wantsWhatsapp = isWhatsAppConfirmationQuestion && isDirectWhatsAppConfirmation && !hasNewProjectInfo;

      if (wantsWhatsapp) {
        window.open(buildQuoteWhatsAppLink(newContext), '_blank', 'noopener,noreferrer');
        setMessages((m) => [...m, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: '¡Listo! ✅ Abrí WhatsApp con los datos del proyecto. El marco de aluminio/PVC queda como precio pendiente.'
        }]);
        setTyping(false);
        return;
      }

      const lastPromptRecommendation = buildRecommendationForLastPrompt(text, lastAssistantText, newContext);
      const advisorResponse = lastPromptRecommendation ?? buildAdvisorResponse(text, newContext);
      const res = advisorResponse
        ? { text: advisorResponse }
        : generateResponse(text, newContext.product, newContext.need, newContext);
      const requiresGlassForQuote = /ventana|mampara|puerta|vidrio|fachada|baranda|techo|cerramiento|división/.test(newContext.product);
      const safetyCriticalQuote = /fachada|baranda|techo/.test(newContext.product);
      const requiresSeriesForQuote = hasSeriesOptionsForContext(newContext);
      const quoteReady = Boolean(
        newContext.product &&
        hasConfirmedValue(newContext.measures) &&
        hasConfirmedValue(newContext.quantity) &&
        (!requiresGlassForQuote || hasConfirmedValue(newContext.glassType)) &&
        (!requiresGlassForQuote || hasConfirmedValue(newContext.glassColor)) &&
        (!requiresGlassForQuote || safetyCriticalQuote || hasConfirmedValue(newContext.glassThickness)) &&
        (!requiresSeriesForQuote || hasConfirmedValue(newContext.series))
      );

      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: addConversationalLead(normalizeAiResponse(res.text), text),
          quote: res.quote,
          quoteReady,
          quoteContext: quoteReady ? newContext : undefined
        }
      ]);

      setTyping(false);
    }, 700 + Math.random() * 500);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-end p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm sm:hidden" onClick={onClose} />
      <div className="relative flex h-[100dvh] w-full flex-col bg-white shadow-2xl sm:h-[640px] sm:max-w-md sm:rounded-3xl sm:ring-1 sm:ring-ink-200 animate-fade-up">
        <div className="flex items-center justify-between bg-gradient-to-r from-ink-800 to-ink-950 px-5 py-4 text-white sm:rounded-t-3xl">
          <div className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
              <Bot className="h-6 w-6" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-950 bg-sky-400" />
            </span>
            <div>
              <p className="font-display text-base font-bold">Zhaid IA</p>
              <p className="text-xs text-white/70">Asistente vidriero · en línea</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-ink-50 p-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white rounded-br-sm'
                    : 'bg-white text-ink-700 shadow-sm ring-1 ring-ink-100 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                {m.quoteReady && (
                  <a
                    href={buildQuoteWhatsAppLink(m.quoteContext)}
                    onClick={onClose}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Continuar con la cotización
                  </a>
                )}
                  {m.quote && <QuoteCard quote={m.quote} input={pendingQuote?.input} />}
                {m.waLink && (
                  <a
                    href={m.waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar solicitud por WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-ink-100">
                <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {!pendingProduct && !initialProduct && messages.length <= 2 && (
          <div className="flex flex-wrap gap-2 border-t border-ink-100 bg-white px-4 py-3">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-ink-100 bg-white p-3 sm:rounded-b-3xl"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 rounded-full bg-ink-100 px-4 py-2.5 text-sm text-ink-700 outline-none transition-colors focus:bg-ink-50 focus:ring-2 focus:ring-sky-300"
          />
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-700 hover:-translate-y-0.5"
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function QuoteCard({ quote, input }: { quote: QuoteResult; input?: CustomInput }) {
  const frameName = input ? frameTypes.find((frame) => frame.id === input.frameId)?.name ?? input.frameId : 'No especificado';
  const subtotalWithoutFrame = getQuoteSubtotalWithoutFrame(quote);
  const quoteMessage = input
    ? `Hola, quisiera consultar una cotización realizada en la página web de Zhaid Glass Solutions.\n\nDatos de mi cotización:\n\nSerie/producto: ${quote.systemName ?? 'No especificado'}\nMedidas: ${input.widthCm} × ${input.heightCm} cm\nCantidad: ${input.quantity}\nTipo de vidrio: ${input.glassType}\nEspesor: ${input.thickness}\nMarco/estructura: ${frameName} (precio pendiente)\nInstalación: gratis\nSubtotal visible de vidrio: ${formatCurrency(subtotalWithoutFrame)}\n\nQuisiera confirmar la cotización y los detalles con el proveedor.`
    : `Hola, quisiera consultar esta cotización realizada en la página web de Zhaid Glass Solutions.\n\nSubtotal visible de vidrio: ${formatCurrency(subtotalWithoutFrame)}\nInstalación: gratis\nPrecio de marco/estructura: pendiente.\n\nQuisiera confirmar la cotización y los detalles con el proveedor.`;

  return (
    <div className="mt-3 rounded-xl bg-gradient-to-br from-sky-50 to-white p-3 ring-1 ring-sky-100">
      <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
        <Sparkles className="h-4 w-4" />
        Cotización estimada
      </div>

      <div className="mt-3 space-y-1 text-xs text-ink-500">
        {quote.systemName && <Line label="Producto / serie" value={quote.systemName} />}
        <Line 
          label="Vidrio"
          value={`Vidrio ${quote.glassType}`}
        />
        <Line
          label="Área"
          value={`${quote.areaM2} m²`}
        />
        <Line
          label="Precio m²"
          value={formatCurrency(quote.pricePerM2)}
        />
        <Line
          label="Vidrio"
          value={formatCurrency(quote.glassCost)}
        />
        <Line label="Marco / estructura" value="Precio pendiente" />
        <Line
          label="Instalación"
          value="Gratis"
        />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-sky-600 px-3 py-2 text-white">
        <span className="text-xs font-medium">
          Subtotal visible de vidrio
        </span>
        <span className="font-display text-sm font-extrabold">
          {formatCurrency(subtotalWithoutFrame)}
        </span>
      </div>

      <a
        href={getWhatsAppLink(quoteMessage)}
        target="_blank"
        rel="noreferrer"
        className="
        mt-3
        flex
        w-full
        items-center
        justify-center
        gap-2
        rounded-xl
        bg-emerald-500
        px-4
        py-2.5
        text-sm
        font-semibold
        text-white
        hover:bg-emerald-600
        "
      >
        <MessageCircle className="h-4 w-4"/>
        Consultar por WhatsApp
      </a>
    </div>
  );
}

function Line({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>
        {label}
      </span>
      <span className="font-semibold text-ink-900">
        {value}
      </span>
    </div>
  );
}

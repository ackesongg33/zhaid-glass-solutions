import { useEffect, useRef, useState } from 'react';
import { products, type GlassType, type Product } from '@/data/products';
import { frameTypes, resolveDefaultSystem, resolveFrameFromSystem, windowSystems } from '@/data/pricing';
import { calculateQuote, formatCurrency, type QuoteResult } from '@/lib/pricing';
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

const normalizeAiResponse = (text: string): string => text
  .replace(/vidrio\s+flotado/gi, 'vidrio crudo')
  .replace(/vidrio\s+(?:esmerilado|reflectivo|insulado|satinado|tonalizado|ahumado)/gi, 'vidrio crudo')
  .replace(/herrajes(?:\s+de\s+acero\s+inoxidable|\s+premium|\s+resistentes\s+a\s+humedad)?/gi, 'accesorios de instalación')
  .replace(/acero\s+inoxidable/gi, 'aluminio o PVC')
  .replace(/perfil(?:ería|eria)\s+de\s+aluminio/gi, 'estructura')
  .replace(/estructura\s+de\s+aluminio/gi, 'material de estructura: aluminio')
  .replace(/aluminio\s+negro/gi, 'aluminio en color negro');

const addFriendlyTone = (text: string): string => {
  const trimmed = text.trim();
  if (/[😊👍✨🙌🙂]/u.test(trimmed)) return trimmed;
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
    : '🙂';

  if (/^(¡|Perfecto|Excelente|Claro|Buenísimo|No te preocupes|Puedo ayudarte)/i.test(trimmed)) return `${trimmed} ${emoji}`;
  return `¡Claro! ${emoji}\n\n${trimmed}`;
};

const getSystemFromQuestion = (question: string) => {
  const normalized = question.toLowerCase();
  return windowSystems.find((system) => {
    const number = system.name.match(/\d+/)?.[0];
    return number && normalized.includes(number) && (
      normalized.includes(system.name.toLowerCase().split(' ')[0]) ||
      normalized.includes(system.id.replace('-', ' '))
    );
  });
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
  if (/vidrio|templado|laminado|reflectivo|esmerilado|insulado/.test(normalized)) return 'vidrio';
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
    'Quisiera saber cuánto me costaría. ¡Gracias!',
  ];

  return getWhatsAppLink(lines.join('\n'));
};

const buildAdvisorResponse = (text: string, context: ConversationContext): string | null => {
  const question = text.toLowerCase();
  const hasProject = Boolean(context.product);
  const asksForQuote = !getSystemFromQuestion(question) && /cotiz|presupuesto|cuánto me costaría|cuanto me costaria|cuánto cuesta|cuanto cuesta|solicitar una cotización|solicitar una cotizacion/.test(question);
  const asksForGlass = /qué vidrio|que vidrio|tipo de vidrio|vidrios tienen|qué vidrios|que vidrios/.test(question);
  const asksForColors = /qué colores|que colores|colores disponibles|colores tienen/.test(question);
  const asksForMaterials = /qué materiales|que materiales|materiales trabajan|aluminio o pvc/.test(question);
  const doesNotKnow = /no sé|no se|no estoy seguro|no tengo claro|ayúdame a elegir|ayudame a elegir/.test(question);

  if (asksForQuote && !hasProject) {
    return '¡Claro! 😊 Te ayudo a preparar la cotización. ¿Qué deseas cotizar: una ventana, mampara, puerta, vidrio u otro proyecto?';
  }

  if (asksForGlass) {
    return `Trabajamos con ${officialGlassTypes.map((type) => type.toLowerCase()).join(', ')}. Los espesores disponibles son ${officialGlassThicknesses.join(' y ')}, según el tipo de vidrio. ${hasProject ? `¿Lo necesitas para tu ${context.product} o quieres revisar una opción específica?` : '¿Lo necesitas para una ventana, mampara, puerta u otro proyecto?'}`;
  }
  if (asksForColors) {
    return `Para los vidrios manejamos ${officialGlassColors.join(', ').toLowerCase()}. Para estructuras, los colores disponibles son ${officialStructureColors.join(', ').toLowerCase()}. ¿Qué tipo de proyecto tienes pensado hacer?`;
  }
  if (asksForMaterials && !hasProject) {
    return `Trabajamos con ${officialStructureMaterials.join(' y ').toLowerCase()} para las estructuras. También manejamos ${officialGlassTypes.map((type) => type.toLowerCase()).join(', ')} en ${officialGlassThicknesses.join(' y ')}. ¿Para qué tipo de proyecto estás buscando una opción?`;
  }
  if (doesNotKnow && !hasProject) {
    return 'No te preocupes, te ayudo a elegir. Primero cuéntame qué deseas fabricar: ¿una ventana, mampara, puerta u otro proyecto?';
  }
  if (!hasProject) return null;
  if (!context.environment && /ventana|mampara|puerta|espejo/.test(context.product)) {
    return `Claro, te ayudo con tu ${context.product}. ¿Para qué ambiente sería: dormitorio, sala, cocina, oficina u otro?`;
  }
  if (!context.material && /ventana|mampara|puerta|cerramiento/.test(context.product)) {
    return 'Perfecto, ya entendí el proyecto. ¿Prefieres estructura de aluminio o PVC?';
  }
  if (!context.color && context.material && /aluminio|pvc/.test(context.material)) {
    return `Buenísimo, trabajaremos con ${context.material}. ¿Qué color prefieres: natural, negro, blanco o color madera?`;
  }
  if (!context.measures) {
    return 'Perfecto, ya tenemos la idea principal. ¿Qué medida aproximada tendría? Puedes indicarme ancho por alto, por ejemplo 2 x 1.50 m.';
  }
  if (!context.quantity) {
    return 'Con esa medida ya avanzamos. ¿Sería una sola pieza o necesitas varias?';
  }
  if (!context.glassType) {
    return 'Ya tengo casi todo. ¿Qué tipo de vidrio prefieres: crudo, laminado o templado? Si no estás seguro, te ayudo a elegir según el uso.';
  }
  if (!context.glassThickness) {
    return `Perfecto, usaríamos vidrio ${context.glassType}. ¿Qué espesor necesitas: 6 mm u 8 mm?`;
  }
  return `Perfecto 👍 Ya tengo los datos principales de tu ${context.product}. Podemos pasar a la cotización para completar tus datos de contacto.`;
};

function generateResponse(
  text: string,
  selectedProduct: string,
  customerNeed: string,
  conversationContext: ConversationContext
): {
  text: string;
  quote?: QuoteResult;
  input?: CustomInput;
} {

  const { 
  product, 
  environment, 
  need, 
  measures, 
  climate, 
  color 
} = conversationContext;
const colorRecommendation =
  color === 'negro'
    ? 'Acabado negro: recomendado para diseños modernos y elegantes.'
    : color === 'blanco'
    ? 'Acabado blanco: recomendado para espacios luminosos y minimalistas.'
    : color === 'natural'
    ? 'Acabado natural: opción clásica y versátil.'
    : color === 'gris'
    ? 'Acabado gris: recomendado para estilos contemporáneos.'
    : color === 'madera'
    ? 'Acabado madera: aporta apariencia cálida y decorativa.'
    : color === 'champagne'
    ? 'Acabado champagne: opción elegante para interiores.'
    : '';

  const q = text.toLowerCase();
  const showClimateInfo = Boolean(climate && climate.trim().length > 0);

  const askedAboutSystem = getSystemFromQuestion(q);
  if (askedAboutSystem && /(qué es|que es|información|informacion|característica|caracteristica|cómo es|como es)/.test(q)) {
    const product = products.find((item) => item.id === askedAboutSystem.id);
    return {
      text: `${askedAboutSystem.name} pertenece a ${askedAboutSystem.category}. ${product?.description ?? 'Es un sistema disponible en Zhaid Glass Solutions.'}\n\nMaterial de estructura: ${officialStructureMaterials.join(', ')}\nTipo de vidrio registrado: ${product?.glassType ? `Vidrio ${product.glassType.toLowerCase()}` : 'Información por confirmar'}\nEspesores disponibles: ${officialGlassThicknesses.join(', ')}\nUnidad de referencia: ${askedAboutSystem.unit}.`
    };
  }

  if (askedAboutSystem && /(cuánto cuesta|cuanto cuesta|precio|precios|valor)/.test(q)) {
    return {
      text: `El precio registrado para ${askedAboutSystem.name} es ${formatCurrency(askedAboutSystem.price)} por ${askedAboutSystem.unit}.\n\nEl total de una cotización depende de tus medidas y cantidad. Si me indicas ancho, alto y cantidad, puedo orientarte con el cotizador.`
    };
  }

  if (/diferencia.*serie nacional.*serie española|serie nacional.*serie española.*diferencia/.test(q)) {
    const nationalSystems = windowSystems.filter((system) => system.category === 'Serie Nacional').map((system) => system.name).join(', ');
    const spanishSystems = windowSystems.filter((system) => system.category === 'Serie Española').map((system) => system.name).join(', ');
    return {
      text: `En los datos actuales del negocio aparecen como categorías distintas:\n\nSerie Nacional: ${nationalSystems}.\nSerie Española: ${spanishSystems}.\n\nLas características técnicas específicas de cada proyecto deben confirmarse según medidas, vidrio y aplicación.`
    };
  }

  if (/opciones.*serie española|serie española.*disponible|serie española.*opciones/.test(q)) {
    const spanishSystems = windowSystems.filter((system) => system.category === 'Serie Española');
    return {
      text: `Tenemos disponibles estas opciones de la Serie Española:\n\n${spanishSystems.map((system) => `• ${system.name}: ${formatCurrency(system.price)} por ${system.unit}`).join('\n')}\n\nEl precio final depende de las medidas y la cantidad.`
    };
  }

  if (/qué materiales|que materiales|materiales trabajan|materiales disponibles/.test(q)) {
    return {
      text: `Trabajamos con ${officialStructureMaterials.join(' y ').toLowerCase()} para las estructuras. También manejamos ${officialGlassTypes.map((type) => type.toLowerCase()).join(', ')} en ${officialGlassThicknesses.join(' y ')}. ¿Para qué tipo de proyecto estás buscando una opción?`
    };
  }

  if (/colores.*aluminio|aluminio.*colores|acabados.*aluminio/.test(q)) {
    const aluminumFrame = frameTypes.find((frame) => frame.id === 'aluminio');
    return {
      text: `Para marcos de aluminio tenemos registrados estos colores: ${aluminumFrame?.colors.join(', ') ?? 'Información por confirmar'}.\n\nLa disponibilidad final puede variar según la serie y el producto seleccionado.`
    };
  }

  if (/cotizar.*medidas|cotización.*medidas|cotizacion.*medidas|según mis medidas|segun mis medidas/.test(q)) {
    return {
      text: '¡Sí, claro! 😊 Puedes cotizar según tus medidas en la sección “Cotiza a tu medida”. Indica ancho, alto, cantidad, tipo de vidrio, espesor, marco y serie o producto para obtener un cálculo estimado.'
    };
  }

  // SALUDO
  if (/^(hola|buenas|saludos)$/.test(q.trim())) {
    return {
      text: '¡Hola! 😊 Soy Zhaid IA, tu asistente de Zhaid Glass Solutions. Puedo ayudarte con mamparas, ventanas, puertas, vidrios y cotizaciones.'
    };
  }

  // MAMPARAS
  if (product === 'mampara') {
    if (environment && measures) {
      if (environment === 'balcón' && !climate) {
        return {
          text: `Perfecto 😊 Tengo registradas las medidas de ${measures} para tu mampara de balcón.\n\nPara recomendarte el sistema adecuado y darte una cotización necesito saber:\n\n🌧 ¿La zona recibe lluvia o viento fuerte?`
        };
      }
      const resolvedFrameId =
        color === 'blanco' ? 'aluminio-blanco' :
        color === 'negro' ? 'aluminio-negro' :
        color === 'natural' ? 'aluminio-natural' :
        color === 'anodizado' ? 'aluminio-anodizado' :
        'aluminio-negro';

      const recommendedSystemId = resolveDefaultSystem(product, environment, need, climate);
      const recommendedSystemName = windowSystems.find((system) => system.id === recommendedSystemId)?.name ?? recommendedSystemId;
      const recommendedFrame = resolveFrameFromSystem(recommendedSystemId);
      const estimate = calculateQuote({
        widthCm: Number((measures.match(/(\d+)\s*(?:x|×|por)\s*(\d+)/i)?.[1] ?? '120')),
        heightCm: Number((measures.match(/(\d+)\s*(?:x|×|por)\s*(\d+)/i)?.[2] ?? '90')),
        glassType: 'Templado',
        thickness: '8mm',
        frameId: recommendedFrame.id,
        quantity: 1,
      }).total;

      return {
        text: `Perfecto 😊 Con los datos que me brindaste:

📌 Producto: ${product}
${environment ? `📍 Ambiente: ${environment}
` : ''}${measures ? `📐 Medidas: ${measures}
` : ''}${showClimateInfo && climate ? `🌧 Condición: ${climate}
` : ''}${color ? `🎨 Color: ${color}
` : ''}${need ? `🎯 Prioridad: ${need}
` : ''}

💰 Cotización referencial:
💵 Precio aproximado: ${formatCurrency(estimate)}

✓ Sistema recomendado: ${recommendedSystemName}
✓ Vidrio recomendado: según seguridad y uso
${colorRecommendation ? `
✓ ${colorRecommendation}` : ''}

Nota: El precio mostrado por la IA es referencial. La cotización final debe ser validada por un asesor, considerando medidas exactas, accesorios, instalación y detalles del proyecto.

¿Deseas que un asesor te envíe una cotización exacta por WhatsApp? 😊`
      };
    }

    if (environment === 'balcón') {
      if (need === 'diseño') {
        return {
          text: `Excelente 😊 Para una mampara de balcón con diseño podemos crear una solución moderna y funcional.\n\nOpciones:\n\n▪ Vidrio transparente para conservar la vista.\n▪ Vidrio tonalizado para mayor estilo y control solar.\n▪ Perfilería negra para acabado moderno.\n\nPara continuar necesito:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿El balcón es de vivienda, oficina o edificio?\n\n3️⃣ ¿Prefieres más diseño, privacidad o seguridad?`
        };
      }
      if (climate && !measures) {
        return {
          text: `Perfecto 😊 Para una mampara de balcón expuesta al clima debemos considerar:\n\n▪ Vidrio laminado para mayor protección.\n▪ Sistemas con buen sellado.\n▪ Aluminio resistente para exteriores.\n\nPara recomendarte la mejor opción necesito:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿Deseas cerramiento completo o protección parcial?`
        };
      }
      
      return {
        text: `Perfecto 😊 Te ayudo con la cotización de tu mampara de balcón.\n\nPara recomendarte el sistema adecuado necesito algunos datos:\n\n📐 1. ¿Cuáles son las medidas aproximadas?  \n(Ejemplo: 200 x 180 cm)\n\n${!climate ? '🌧 2. ¿La zona recibe lluvia o viento?\n\n🚪 3. ¿La quieres corrediza, fija o todavía no estás seguro?' : '🚪 2. ¿La quieres corrediza, fija o todavía no estás seguro?'}\n\nCon esos datos puedo recomendarte el vidrio y sistema adecuado.`
      };
    }

    if (environment === 'baño') {
      if (need === 'seguridad') {
        return {
          text: `Perfecto 😊 Para una mampara de baño donde la prioridad es seguridad recomendamos:\n\n▪ Vidrio templado de seguridad:\nMayor resistencia para uso diario.\n\n▪ Vidrio templado de mayor espesor:\nMayor sensación de firmeza.\n\n▪ Herrajes resistentes a humedad.\n\nPara recomendarte correctamente necesito:\n\n1️⃣ Medidas aproximadas del espacio.\n\n2️⃣ ¿La deseas corrediza, fija o abatible?\n\n3️⃣ ¿Color de herrajes?\n\n▪ Negro mate\n▪ Acero inoxidable`
        };
      }
      if (need === 'diseño') {
        return {
          text: `Excelente 😊 Para una mampara de baño con enfoque en diseño podemos trabajar:\n\n▪ Vidrio transparente estilo moderno.\n▪ Vidrio esmerilado para un acabado elegante.\n▪ Perfilería negra estilo industrial.\n\nPara continuar necesito:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿El baño tiene un estilo moderno, clásico o minimalista?\n\n3️⃣ ¿Prefieres sin marco o con estructura de aluminio?`
        };
      }
      if (need === 'privacidad') {
        return {
          text: `Perfecto 😊 Para privacidad en una mampara de baño recomendamos:\n\n▪ Vidrio esmerilado:\nPermite iluminación manteniendo privacidad.\n\n▪ Vidrio satinado:\nAcabado elegante y uniforme.\n\n▪ Diseño personalizado con diferentes niveles de opacidad.\n\nPara continuar:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿Deseas privacidad total o parcial?\n\n3️⃣ ¿Prefieres sistema corredizo o abatible?`
        };
      }
      return {
        text: `Excelente 😊 Para una mampara de baño necesito:\n\n1️⃣ Medidas del espacio (ancho x alto)\n\n2️⃣ ¿La quieres corrediza, fija o abatible?\n\n3️⃣ ¿Prefieres vidrio transparente, esmerilado o con mayor privacidad?\n\nPara baños normalmente recomendamos vidrio templado de 8mm o 10mm por seguridad.`
      };
    }

    if (environment === 'terraza') {
      if (need === 'privacidad') {
        return {
          text: `Excelente 😊 Para una mampara de terraza donde buscas privacidad podemos recomendar:\n\n▪ Vidrio esmerilado:\nPermite iluminación manteniendo mayor privacidad.\n\n▪ Vidrio reflectivo:\nReduce la visibilidad desde el exterior y ayuda al control solar.\n\n▪ Vidrio laminado:\nAporta seguridad y mayor protección.\n\nPara recomendarte correctamente necesito:\n\n1️⃣ Medidas aproximadas de la terraza.\n\n2️⃣ ¿La terraza está completamente expuesta al exterior?\n\n3️⃣ ¿Buscas privacidad total o mantener la vista hacia afuera?`
        };
      }
      if (need === 'diseño') {
        return {
          text: `Perfecto 😊 Para una mampara de terraza con diseño moderno podemos trabajar:\n\n▪ Sistemas corredizos panorámicos.\n▪ Vidrio transparente para mantener la vista.\n▪ Perfilería negra o acabados arquitectónicos.\n\nPara continuar necesito:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿Deseas cerrar completamente la terraza?\n\n3️⃣ ¿Qué estilo prefieres?\n\n▪ Moderno\n▪ Minimalista\n▪ Elegante`
        };
      }
      return {
        text: `Excelente 😊 Para una mampara de terraza necesito algunos datos:\n\n1️⃣ ¿La terraza es abierta o deseas cerrarla completamente?\n\n2️⃣ ¿Qué medidas aproximadas tiene?\n(Ancho x Alto en centímetros)\n\n${!climate ? '3️⃣ ¿Buscas principalmente protección contra viento y lluvia o un diseño más decorativo?\n\n' : '3️⃣ ¿Buscas un diseño decorativo?\n\n'}Para terrazas normalmente evaluamos vidrio templado de 8mm, 10mm o vidrio laminado de seguridad según el proyecto.`
      };
    }

    if (environment === 'división') {
      return {
        text: `Perfecto 😊 Para una división de ambientes necesito:\n\n1️⃣ ¿Qué espacios deseas separar?\n(Ejemplo: sala, oficina, dormitorio)\n\n2️⃣ Medidas aproximadas\n\n3️⃣ ¿Buscas privacidad o mantener iluminación?\n\nPodemos trabajar con vidrio templado, laminado o esmerilado según el diseño.`
      };
    }

    if (need === 'privacidad') {
      return {
        text: `Perfecto 😊 Si buscas mayor privacidad en tu mampara, tenemos varias alternativas:\n\n▪ Vidrio esmerilado:\nPermite el paso de luz pero limita la visibilidad.\n\n▪ Vidrio laminado con acabado especial:\nMayor seguridad y privacidad.\n\n▪ Vidrio tonalizado:\nReduce la transparencia y ayuda al control solar.\n\nPara recomendarte la mejor opción necesito:\n\n1️⃣ ¿En qué ambiente irá la mampara?\n(Baño, balcón, terraza o división de ambientes)\n\n2️⃣ Medidas aproximadas (ancho x alto en cm)\n\n3️⃣ ¿Prefieres mantener mucha iluminación o priorizar privacidad?`
      };
    }
    if (need === 'seguridad') {
      return {
        text: `Excelente 😊 Si tu prioridad es seguridad recomendamos:\n\n▪ Vidrio templado:\nAlta resistencia a golpes y uso frecuente.\n\n▪ Vidrio laminado:\nMayor protección porque mantiene los fragmentos unidos ante rotura.\n\n▪ Herrajes de acero inoxidable:\nMayor duración y acabado premium.\n\nPara continuar necesito:\n\n1️⃣ ¿Dónde será instalada la mampara?\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿Será para uso residencial o comercial?`
      };
    }
    if (need === 'diseño') {
      return {
        text: `Perfecto 😊 Podemos crear una mampara con enfoque decorativo y moderno.\n\nOpciones:\n\n▪ Vidrio transparente:\nEstilo minimalista y elegante.\n\n▪ Vidrio tonalizado:\nMayor diseño y control visual.\n\n▪ Perfilería negra:\nAcabado moderno tipo industrial.\n\nNecesito conocer:\n\n1️⃣ Ambiente donde se instalará.\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ Color de aluminio o acabado preferido.`
      };
    }
    if (climate) {
      return {
        text: `Para protección contra clima recomendamos evaluar:\n\n▪ Vidrio laminado:\nMayor seguridad y aislamiento.\n\n▪ Sistemas corredizos con buen sellado.\n\n▪ Perfiles de aluminio resistentes.\n\nPara recomendar correctamente necesito:\n\n1️⃣ Ubicación de la instalación.\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿Está totalmente expuesta al exterior?`
      };
    }

    if (q.includes('otro')) {
      return {
        text: `Perfecto 😊 Cuéntame un poco más sobre tu proyecto:\n\n1️⃣ ¿Dónde deseas instalar la mampara?\n\n2️⃣ Medidas aproximadas (ancho x alto)\n\n3️⃣ ¿Qué función debe cumplir?\n- Seguridad\n- Privacidad\n- Decoración\n- Protección contra clima\n\nCon esa información te recomendaré la mejor opción.`
      };
    }

    return {
      text: `Perfecto 😊 ${measures ? `Tengo registradas las medidas de ${measures}. ` : ''}Tenemos mamparas fabricadas a medida.\n\nAntes de recomendarte una opción necesito conocer el ambiente donde será instalada:\n\n▪ Baño\n▪ Terraza\n▪ Balcón\n▪ División de ambientes\n▪ Otro espacio\n\nIndícame cuál es y te ayudaré con la mejor alternativa de vidrio, sistema y precio aproximado.`
    };
  }

  // VENTANAS
  if (product === 'ventana') {
    if (environment && measures) {
      return {
        text: `Perfecto 😊 Con los datos que me brindaste:\n\n📌 Producto: Ventana para ${environment}\n📐 Medidas: ${measures}\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\n💰 Cotización referencial:\n\n💵 Precio aproximado: desde S/ 450\n✓ Sistema recomendado: Corredizo de aluminio\n✓ Vidrio recomendado: Incoloro o Laminado\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\nEl precio final depende del espesor, color de aluminio y diseño.\n\n¿Deseas que un asesor te envíe una cotización exacta por WhatsApp? 😊`
      };
    }

   if (environment === 'dormitorio') {
  return {
    text: `Excelente 😊 Para un dormitorio buscamos iluminación, ventilación y confort.

${color ? `🎨 Color: ${color}\n\n` : ''}

Podemos trabajar:

▪ Vidrio flotado (opción económica)
▪ Vidrio laminado (mayor seguridad y reducción de ruido)

Para continuar necesito:

1️⃣ Medidas aproximadas (ancho x alto en cm)

2️⃣ ¿Buscas más ventilación o mayor aislamiento?

3️⃣ ¿Qué color de aluminio prefieres?

▪ Natural
▪ Blanco
▪ Negro`
  };
}
  

    if (environment === 'oficina') {
      return { text: `Perfecto 😊 Para oficinas recomendamos soluciones que combinen diseño, iluminación y confort.\n\nOpciones:\n\n▪ Vidrio laminado para reducir ruido.\n▪ Vidrio reflectivo para control solar.\n▪ Sistemas de aluminio arquitectónico.\n\nNecesito:\n\n1️⃣ Medidas aproximadas.\n\n${!climate ? '2️⃣ ¿Recibe mucho sol?\n\n3️⃣ ¿Buscas privacidad o mayor iluminación?' : '2️⃣ ¿Buscas privacidad o mayor iluminación?'}` };
    }
    
    if (environment === 'sala') {
      return { text: `Perfecto 😊 Para una ventana de sala buscamos principalmente iluminación, amplitud visual y diseño.\n\nPodemos trabajar:\n\n▪ Vidrio templado para mayor seguridad.\n▪ Vidrio laminado para reducir ruido.\n▪ Vidrio reflectivo para controlar el ingreso de sol.\n\nPara continuar necesito:\n\n1️⃣ Medidas aproximadas (ancho x alto en cm)\n\n${!climate ? '2️⃣ ¿La sala recibe sol directo durante el día?\n\n3️⃣ ¿Qué prefieres?\n\n▪ Mayor iluminación\n▪ Mayor aislamiento\n▪ Diseño moderno' : '2️⃣ ¿Qué prefieres?\n\n▪ Mayor iluminación\n▪ Mayor aislamiento\n▪ Diseño moderno'}` };
    }
    if (environment === 'cocina') {
      return { text: `Excelente 😊 Para una ventana de cocina buscamos ventilación, iluminación y facilidad de limpieza.\n\nOpciones recomendadas:\n\n▪ Vidrio flotado (opción económica)\n▪ Vidrio templado (mayor resistencia)\n▪ Aluminio con buen sellado contra humedad\n\nPara recomendarte el sistema correcto necesito:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿Buscas más ventilación o más iluminación?\n\n3️⃣ Color de aluminio:\n\n▪ Natural\n▪ Blanco\n▪ Negro` };
    }
    if (environment === 'local') {
      return { text: `Perfecto 😊 Para un local comercial buscamos seguridad, resistencia y una buena presentación.\n\nPodemos trabajar:\n\n▪ Vidrio templado de seguridad.\n▪ Vidrio laminado anti impacto.\n▪ Sistemas de aluminio comercial.\n\nPara continuar necesito:\n\n1️⃣ ¿Será para vitrina, ventana o cerramiento?\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿Buscas principalmente seguridad, diseño o ambas?` };
    }
    if (q.includes('otro')) {
      return { text: `Perfecto 😊 Cuéntame un poco más sobre el espacio donde deseas instalar la ventana.\n\nNecesito conocer:\n\n1️⃣ ¿Qué ambiente es?\n\nEjemplo:\n▪ Escalera\n▪ Baño\n▪ Fachada\n▪ Almacén\n▪ Otro espacio\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿Qué deseas conseguir?\n\n▪ Más iluminación\n▪ Más ventilación\n▪ Privacidad\n▪ Aislamiento del ruido\n\nCon esa información te recomendaré la mejor solución.` };
    }
    
    return {
      text: `Perfecto 😊 ${measures ? `Tengo registradas las medidas de ${measures}. ` : ''}Fabricamos ventanas de aluminio y vidrio a medida.\n\nAntes de recomendarte un sistema necesito conocer:\n\n¿Dónde deseas instalar la ventana?\n\n▪ Dormitorio\n▪ Sala\n▪ Cocina\n▪ Oficina\n▪ Local comercial\n▪ Otro espacio`
    };
  }

  // PUERTAS DE VIDRIO
  if (product === 'puerta') {
    if (environment && measures) {
      return {
        text: `Perfecto 😊 Con los datos que me brindaste:\n\n📌 Producto: Puerta de ${environment}\n📐 Medidas: ${measures}\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\n💰 Cotización referencial:\n\n💵 Precio aproximado: desde S/ 950\n✓ Sistema recomendado: Abatible con bisagras o freno\n✓ Vidrio recomendado: Templado de seguridad 10mm\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\nEl precio final depende del sistema y accesorios.\n\n¿Deseas que un asesor te envíe una cotización exacta por WhatsApp? 😊`
      };
    }

    if (environment === 'entrada') {
      return { text: `Excelente 😊 Para una puerta de entrada principal buscamos seguridad, resistencia y una buena presentación.\n\nPodemos trabajar:\n\n▪ Vidrio templado de seguridad.\n▪ Vidrio laminado para mayor protección.\n▪ Herrajes de alta resistencia.\n\nPara continuar necesito:\n\n1️⃣ Medidas aproximadas (ancho x alto en cm)\n\n2️⃣ ¿La deseas abatible o corrediza?\n\n3️⃣ ¿Prefieres vidrio:\n\n▪ Transparente\n▪ Ahumado\n▪ Esmerilado` };
    }
    if (environment === 'oficina') {
      return { text: `Perfecto 😊 Para oficinas buscamos una solución elegante, funcional y con buena iluminación.\n\nOpciones recomendadas:\n\n▪ Vidrio templado para diseño moderno.\n▪ Vidrio laminado para reducir ruido.\n▪ Sistemas con aluminio o herrajes premium.\n\nNecesito:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿Buscas privacidad o mantener transparencia?\n\n3️⃣ ¿Será una puerta de uso frecuente?` };
    }
    if (environment === 'local') {
      return { text: `Excelente 😊 Para locales comerciales priorizamos seguridad, resistencia y estética.\n\nPodemos trabajar:\n\n▪ Puertas de vidrio templado.\n▪ Sistemas corredizos.\n▪ Puertas con herrajes reforzados.\n\nPara recomendarte:\n\n1️⃣ ¿Es para ingreso principal, vitrina o división?\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ Nivel de seguridad requerido:\n\n▪ Estándar\n▪ Alto tránsito\n▪ Mayor protección` };
    }
    if (environment === 'interior') {
      return { text: `Perfecto 😊 Para interiores buscamos principalmente diseño, iluminación y aprovechamiento del espacio.\n\nPodemos trabajar:\n\n▪ Vidrio transparente.\n▪ Vidrio esmerilado para privacidad.\n▪ Vidrio decorativo.\n\nNecesito:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿Qué ambientes deseas conectar?\n\nEjemplo:\nSala, comedor, dormitorio u oficina.\n\n3️⃣ ¿Buscas privacidad o amplitud visual?` };
    }
    if (environment === 'terraza') {
      return { text: `Excelente 😊 Para una puerta de terraza debemos considerar exposición al exterior, seguridad y comodidad.\n\nPodemos trabajar:\n\n▪ Puertas corredizas de vidrio.\n▪ Sistemas de aluminio.\n▪ Vidrio templado o laminado.\n\nPara continuar:\n\n1️⃣ Medidas aproximadas.\n\n${!climate ? '2️⃣ ¿Está expuesta a lluvia o viento?\n\n3️⃣ ¿Deseas apertura corrediza o abatible?' : '2️⃣ ¿Deseas apertura corrediza o abatible?'}` };
    }

    return {
      text: `Perfecto 😊 ${measures ? `Tengo registradas las medidas de ${measures}. ` : ''}Fabricamos puertas de vidrio y aluminio a medida.\n\nAntes de recomendarte una opción necesito conocer:\n\n¿Dónde deseas instalar la puerta?\n\n▪ Entrada principal\n▪ Oficina\n▪ Local comercial\n▪ Interior de vivienda\n▪ Terraza\n▪ Otro espacio`
    };
  }

  // VIDRIOS
  if (product === 'vidrio') {
    if (measures) {
      return {
        text: `Perfecto 😊 Con los datos que me brindaste:\n\n📌 Producto: Vidrio a medida\n📐 Medidas: ${measures}\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\n💰 Cotización referencial:\n\n💵 Precio aproximado: desde S/ 150\n✓ Recomendación: Templado o Laminado según aplicación\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\nEl precio final depende del espesor, tipo de cristal y proceso.\n\n¿Deseas que un asesor te envíe una cotización exacta por WhatsApp? 😊`
      };
    }

    if (q.includes('templado')) {
      return { text: `Excelente 😊 El vidrio templado es una opción segura y resistente, ideal para espacios donde se requiere mayor protección.\n\nSe utiliza principalmente en:\n\n▪ Mamparas\n▪ Puertas de vidrio\n▪ Divisiones de ambientes\n▪ Cerramientos\n\nPara recomendarte el espesor adecuado necesito:\n\n1️⃣ ¿Dónde será instalado?\n\n2️⃣ Medidas aproximadas (ancho x alto en cm)\n\n3️⃣ ¿Será interior o exterior?\n\nPodemos trabajar diferentes espesores según el proyecto.` };
    }
    if (q.includes('laminado')) {
      return { text: `Perfecto 😊 El vidrio laminado está diseñado para brindar mayor seguridad, ya que mantiene sus fragmentos unidos en caso de rotura.\n\nEs recomendado para:\n\n▪ Fachadas\n▪ Ventanas con mayor seguridad\n▪ Zonas expuestas\n▪ Lugares donde se busca reducir ruido\n\nNecesito:\n\n1️⃣ Ubicación del vidrio.\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿Buscas seguridad, aislamiento acústico o ambos?` };
    }
    if (q.includes('esmerilado') || q.includes('mate')) {
      return { text: `Excelente 😊 El vidrio esmerilado es ideal cuando se busca privacidad sin perder iluminación.\n\nUsos comunes:\n\n▪ Baños\n▪ Oficinas\n▪ Divisiones interiores\n▪ Puertas decorativas\n\nPara recomendarte:\n\n1️⃣ ¿Dónde será instalado?\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿Quieres privacidad total o parcial?` };
    }
    if (q.includes('reflectivo') || q.includes('control solar')) {
      return { text: `Perfecto 😊 El vidrio reflectivo ayuda a controlar el ingreso de radiación solar y mejora el confort térmico.\n\nEs recomendado para:\n\n▪ Fachadas\n▪ Oficinas\n▪ Grandes ventanales\n▪ Ambientes con mucho sol\n\nNecesito:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿Recibe sol directo durante el día?\n\n3️⃣ ¿Buscas reducir calor, mejorar privacidad o ambas?` };
    }
    if (q.includes('insulado') || q.includes('acústico')) {
      return { text: `Excelente 😊 El vidrio insulado está formado por una cámara de aire entre vidrios, ayudando al aislamiento térmico y acústico.\n\nIdeal para:\n\n▪ Oficinas\n▪ Viviendas premium\n▪ Zonas con mucho ruido exterior\n\nPara recomendarte:\n\n1️⃣ Ubicación del proyecto.\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿El principal objetivo es reducir ruido o temperatura?` };
    }

    return {
      text: `Perfecto 😊 Trabajamos diferentes tipos de vidrio según la necesidad del proyecto.\n\nPara recomendarte el vidrio correcto necesito conocer:\n\n¿Para qué lo necesitas?\n\n▪ Seguridad\n▪ Privacidad\n▪ Decoración\n▪ Control de sol\n▪ Reducción de ruido\n▪ Otro uso`
    };
  }

  // ESPEJOS
  if (product === 'espejo') {
    if (environment && measures) {
      return {
        text: `Perfecto 😊 Con los datos que me brindaste:\n\n📌 Producto: Espejo para ${environment}\n📐 Medidas: ${measures}\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\n💰 Cotización referencial:\n\n💵 Precio aproximado: desde S/ 250\n✓ Sistema recomendado: Canto pulido o Biselado\n✓ Vidrio recomendado: Espejo 4mm o 6mm\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\nEl precio final depende de los acabados y si requiere luz LED.\n\n¿Deseas que un asesor te envíe una cotización exacta por WhatsApp? 😊`
      };
    }

    if (environment === 'baño') {
      return { text: `Excelente 😊 Para baños recomendamos espejos resistentes a la humedad y con acabados modernos.\n\nPodemos trabajar:\n\n▪ Espejo tradicional a medida.\n▪ Espejo con iluminación LED.\n▪ Espejo con marco decorativo.\n\nPara continuar necesito:\n\n1️⃣ Medidas aproximadas (ancho x alto en cm)\n\n2️⃣ ¿Lo deseas con luz LED?\n\n3️⃣ ¿Prefieres diseño:\n\n▪ Moderno\n▪ Minimalista\n▪ Clásico` };
    }
    if (environment === 'dormitorio') {
      return { text: `Perfecto 😊 Para dormitorios buscamos un espejo funcional que combine con el diseño del ambiente.\n\nOpciones:\n\n▪ Espejo de cuerpo completo.\n▪ Espejo decorativo.\n▪ Espejo con marco personalizado.\n\nNecesito:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿Será colocado en pared, puerta o mueble?\n\n3️⃣ ¿Buscas algo decorativo o funcional?` };
    }
    if (q.includes('decorativo') || q.includes('decoración')) {
      return { text: `Excelente 😊 Los espejos decorativos ayudan a ampliar visualmente los espacios y mejorar el diseño interior.\n\nPodemos realizar:\n\n▪ Diseños personalizados.\n▪ Espejos con formas especiales.\n▪ Espejos biselados.\n▪ Combinaciones con iluminación.\n\nPara recomendarte:\n\n1️⃣ ¿En qué ambiente será instalado?\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿Tienes algún diseño de referencia?` };
    }
    if (environment === 'local') {
      return { text: `Perfecto 😊 Para espacios comerciales buscamos espejos resistentes, funcionales y con buena presentación.\n\nUsos comunes:\n\n▪ Gimnasios.\n▪ Salones de belleza.\n▪ Tiendas.\n▪ Locales comerciales.\n\nNecesito:\n\n1️⃣ Medidas aproximadas del área.\n\n2️⃣ Cantidad de espejos requeridos.\n\n3️⃣ ¿La instalación será sobre pared completa o piezas individuales?` };
    }
    if (q.includes('otro')) {
      return { text: `Perfecto 😊 Cuéntame un poco más sobre el espacio donde deseas instalar el espejo.\n\nNecesito:\n\n1️⃣ ¿En qué ambiente será?\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿Qué buscas principalmente?\n\n▪ Decoración\n▪ Amplitud visual\n▪ Funcionalidad\n▪ Diseño personalizado\n\nCon esos datos te recomendaré la mejor alternativa.` };
    }

    return {
      text: `Perfecto 😊 ${measures ? `Tengo registradas las medidas de ${measures}. ` : ''}Fabricamos espejos a medida con diferentes acabados y diseños.\n\nAntes de recomendarte una opción necesito conocer:\n\n¿Dónde deseas instalar el espejo?\n\n▪ Baño\n▪ Dormitorio\n▪ Decorativo\n▪ Local comercial\n▪ Gimnasio\n▪ Otro espacio`
    };
  }

  // FACHADAS
  if (product === 'fachada' || environment === 'fachada' || q.includes('fachada')) {
    if (measures) {
      return {
        text: `Perfecto 😊 Con los datos que me brindaste:\n\n📌 Producto: Fachada de vidrio\n📐 Medidas: ${measures}\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\n💰 Cotización referencial:\n\n💵 Precio aproximado: según proyecto\n✓ Sistema recomendado: Muro Cortina o Sistema Nova\n✓ Vidrio recomendado: Templado o Laminado Reflectivo\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\nEl costo varía según la complejidad estructural y el tipo de cristal.\n\n¿Deseas que un asesor evalúe tu proyecto para darte una cotización por WhatsApp? 😊`
      };
    }

    if (q.includes('vivienda') || q.includes('casa')) {
      return { text: `Perfecto 😊 Para una fachada de vivienda buscamos diseño, iluminación natural, seguridad y confort.\n\nPodemos trabajar con:\n\n▪ Vidrio templado.\n▪ Vidrio laminado de seguridad.\n▪ Vidrio reflectivo si recibe mucho sol.\n▪ Estructuras de aluminio arquitectónico.\n\nPara continuar necesito:\n\n1️⃣ Medidas aproximadas del área.\n\n${!climate ? '2️⃣ ¿La fachada recibe mucho sol durante el día?\n\n3️⃣ ¿Qué buscas principalmente?\n\n▪ Diseño moderno\n▪ Mayor iluminación\n▪ Privacidad\n▪ Control de calor' : '2️⃣ ¿Qué buscas principalmente?\n\n▪ Diseño moderno\n▪ Mayor iluminación\n▪ Privacidad\n▪ Control de calor'}` };
    }
    if (q.includes('oficina')) {
      return { text: `Excelente 😊 Para fachadas de oficina normalmente buscamos una combinación de diseño, control solar y confort interior.\n\nOpciones recomendadas:\n\n▪ Vidrio reflectivo para controlar radiación solar.\n▪ Vidrio laminado para mayor seguridad.\n▪ Sistemas de aluminio arquitectónico.\n\nNecesito:\n\n1️⃣ Medidas aproximadas de la fachada.\n\n2️⃣ ¿Cuántos niveles tiene el proyecto?\n\n3️⃣ ¿Buscas principalmente:\n\n▪ Control solar\n▪ Aislamiento\n▪ Diseño\n▪ Mayor iluminación?` };
    }
    if (q.includes('local') || q.includes('comercial')) {
      return { text: `Perfecto 😊 Para un local comercial buscamos una fachada que combine visibilidad, seguridad y una buena imagen.\n\nPodemos trabajar:\n\n▪ Vidrio templado.\n▪ Vidrio laminado.\n▪ Vidrio reflectivo.\n▪ Sistemas de aluminio comercial.\n\nPara recomendarte correctamente necesito:\n\n1️⃣ Medidas aproximadas del frente.\n\n2️⃣ ¿Será solo fachada o también incluirá puertas y vitrinas?\n\n3️⃣ ¿Buscas mayor:\n\n▪ Visibilidad\n▪ Seguridad\n▪ Diseño\n▪ Protección solar?` };
    }
    if (q.includes('edificio') || q.includes('torre')) {
      return { text: `Excelente 😊 Para fachadas de edificios debemos considerar seguridad, exposición al viento, altura y desempeño térmico.\n\nPodemos evaluar:\n\n▪ Vidrio laminado de seguridad.\n▪ Vidrio reflectivo.\n▪ Vidrio insulado.\n▪ Sistemas de fachada tipo curtain wall.\n\nPara continuar necesito:\n\n1️⃣ Área aproximada de la fachada.\n\n2️⃣ Número de pisos.\n\n${!climate ? '3️⃣ ¿El proyecto está muy expuesto al sol o viento?\n\n4️⃣ ¿Qué prioridad tiene?\n\n▪ Seguridad\n▪ Control térmico\n▪ Aislamiento acústico\n▪ Diseño arquitectónico' : '3️⃣ ¿Qué prioridad tiene?\n\n▪ Seguridad\n▪ Control térmico\n▪ Aislamiento acústico\n▪ Diseño arquitectónico'}` };
    }
    if (q.includes('otro')) {
      return { text: `Perfecto 😊 Cuéntame un poco más sobre el proyecto de fachada.\n\nNecesito conocer:\n\n1️⃣ Tipo de inmueble.\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ Altura del proyecto.\n\n4️⃣ ¿Qué buscas principalmente?\n\n▪ Diseño\n▪ Seguridad\n▪ Iluminación\n▪ Control solar\n▪ Aislamiento\n\nCon esos datos te recomendaré el sistema de vidrio y aluminio más adecuado.` };
    }

    return {
      text: `Excelente 😊 Trabajamos fachadas de vidrio y aluminio para proyectos residenciales, comerciales y arquitectónicos.\n\nAntes de recomendarte un sistema necesito conocer:\n\n¿Para qué tipo de proyecto es?\n\n▪ Vivienda\n▪ Oficina\n▪ Local comercial\n▪ Edificio\n▪ Otro proyecto`
    };
  }

  // ALUMINIO
  if (product === 'aluminio' || q.includes('aluminio')) {
    if (measures && product === 'aluminio') {
      return {
        text: `Perfecto 😊 Con los datos que me brindaste:\n\n📌 Producto: Proyecto en Aluminio\n📐 Medidas: ${measures}\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\n💰 Cotización referencial:\n\n💵 Precio aproximado: según proyecto\n✓ Material: Aluminio arquitectónico o comercial\n${climate ? `🌧 Condición: ${climate}\n` : ''}${color ? `🎨 Color: ${color}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\nEl precio final dependerá del tipo de perfilería y color elegido.\n\n¿Deseas que un asesor te envíe una cotización exacta por WhatsApp? 😊`
      };
    }

    if (q.includes('ventana')) {
      return { text: `Excelente 😊 Las ventanas de aluminio ofrecen resistencia, bajo mantenimiento y diferentes opciones de diseño.\n\nPodemos trabajar:\n\n▪ Sistemas corredizos.\n▪ Sistemas abatibles.\n▪ Aluminio con vidrio simple o de seguridad.\n\nPara continuar necesito:\n\n1️⃣ Medidas aproximadas (ancho x alto en cm)\n\n2️⃣ ¿Dónde será instalada?\n\n▪ Dormitorio\n▪ Sala\n▪ Oficina\n▪ Otro ambiente\n\n3️⃣ ¿Qué color de aluminio prefieres?\n\n▪ Natural\n▪ Blanco\n▪ Negro` };
    }
    if (q.includes('puerta')) {
      return { text: `Perfecto 😊 Las puertas de aluminio son una solución resistente y funcional para interiores y exteriores.\n\nPodemos trabajar:\n\n▪ Puertas corredizas.\n▪ Puertas abatibles.\n▪ Sistemas con vidrio integrado.\n\nNecesito:\n\n1️⃣ Lugar de instalación.\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿Será para uso interior o exterior?\n\n4️⃣ Color de aluminio:\n\n▪ Natural\n▪ Blanco\n▪ Negro` };
    }
    if (q.includes('mampara')) {
      return { text: `Excelente 😊 Las mamparas de aluminio combinan estructura resistente con diseño moderno.\n\nSon ideales para:\n\n▪ Terrazas.\n▪ Balcones.\n▪ Separación de ambientes.\n▪ Cerramientos.\n\nPara recomendarte:\n\n1️⃣ Medidas aproximadas.\n\n2️⃣ ¿El espacio está expuesto a lluvia o viento?\n\n3️⃣ ¿Buscas:\n\n▪ Mayor iluminación\n▪ Privacidad\n▪ Protección climática` };
    }
    if (q.includes('cerramiento')) {
      return { text: `Perfecto 😊 Los cerramientos de aluminio permiten proteger espacios manteniendo iluminación y diseño.\n\nPodemos realizar:\n\n▪ Cerramientos de terrazas.\n▪ Divisiones exteriores.\n▪ Sistemas corredizos.\n\nNecesito:\n\n1️⃣ Área aproximada del espacio.\n\n2️⃣ Medidas.\n\n3️⃣ ¿Cuál es tu objetivo principal?\n\n▪ Proteger del clima\n▪ Ganar espacio\n▪ Mejorar diseño` };
    }
    if (q.includes('otro')) {
      return { text: `Perfecto 😊 Cuéntame un poco más sobre tu proyecto en aluminio.\n\nNecesito conocer:\n\n1️⃣ ¿Qué deseas fabricar?\n\n2️⃣ Lugar donde será instalado.\n\n3️⃣ Medidas aproximadas.\n\n4️⃣ ¿Qué buscas principalmente?\n\n▪ Diseño\n▪ Seguridad\n▪ Durabilidad\n▪ Protección del clima\n\nCon esa información te recomendaré la mejor alternativa.` };
    }

    return {
      text: `Perfecto 😊 Trabajamos sistemas de aluminio para diferentes aplicaciones.\n\nPara recomendarte la mejor opción necesito conocer:\n\n¿Qué necesitas realizar?\n\n▪ Ventana de aluminio\n▪ Puerta de aluminio\n▪ Mampara de aluminio\n▪ Cerramiento\n▪ Otro proyecto`
    };
  }

  // PROYECTOS ESPECIALES, CERRAMIENTOS, TECHOS Y DIVISIONES
  if (
    q.includes('especial') ||
    q.includes('personalizado') ||
    q.includes('estructura') ||
    environment === 'techo' ||
    q.includes('arquitectonico') ||
    q.includes('arquitectónico') ||
    q.includes('cerramiento') ||
    q.includes('división') ||
    q.includes('division') ||
    q.includes('cubierta') ||
    ['cerramiento', 'techo', 'estructura', 'proyecto especial', 'división'].includes(product)
  ) {
    if (measures) {
      let tipoProyecto = 'Proyecto Especial';
      if (q.includes('cerramiento') || product === 'cerramiento') tipoProyecto = 'Cerramiento';
      else if (q.includes('techo') || q.includes('cubierta') || environment === 'techo' || product === 'techo') tipoProyecto = 'Techo o Cubierta';
      else if (q.includes('división') || q.includes('division') || product === 'división') tipoProyecto = 'División de ambientes';
      else if (q.includes('estructura') || product === 'estructura') tipoProyecto = 'Estructura personalizada';

      return {
        text: `Perfecto 😊 Con los datos que me brindaste:\n\n📌 Producto: ${tipoProyecto}\n📐 Medida registrada: ${measures}\n${climate ? `🌧 Condición: ${climate}\n` : ''}${need ? `🎯 Prioridad: ${need}\n` : ''}\n\nAl ser un proyecto personalizado o estructural, requerimos evaluar los detalles técnicos, de anclaje y seguridad para brindarte una cotización precisa.\n\n¿Deseas que un asesor especializado revise tus medidas y te contacte por WhatsApp? 😊`
      };
    }

    if (q.includes('cerramiento') || product === 'cerramiento') {
      return { text: `Excelente 😊 Para un cerramiento personalizado necesitamos evaluar el espacio, el uso y la exposición al exterior.\n\nPara continuar necesito:\n\n1️⃣ ¿Dónde será instalado?\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿El espacio está expuesto a lluvia, viento o sol?\n\n4️⃣ ¿Qué buscas principalmente?\n\n▪ Protección climática\n▪ Seguridad\n▪ Privacidad\n▪ Diseño` };
    }
    if (q.includes('división') || q.includes('division') || product === 'división') {
      return { text: `Perfecto 😊 Podemos diseñar divisiones especiales en vidrio y aluminio según el ambiente.\n\nPara recomendarte una solución necesito:\n\n1️⃣ ¿Qué espacios deseas separar?\n\n2️⃣ Medidas aproximadas.\n\n3️⃣ ¿Qué nivel de privacidad necesitas?\n\n▪ Transparencia total\n▪ Privacidad parcial\n▪ Privacidad alta\n\n4️⃣ ¿Prefieres un sistema fijo, corredizo o mixto?` };
    }
    if (q.includes('estructura') || product === 'estructura') {
      return { text: `Excelente 😊 Podemos desarrollar estructuras personalizadas combinando vidrio y aluminio.\n\nPara evaluar tu proyecto necesito:\n\n1️⃣ ¿Qué deseas construir?\n\n2️⃣ Lugar de instalación.\n\n3️⃣ Medidas aproximadas.\n\n4️⃣ ¿Será interior o exterior?\n\n5️⃣ ¿Qué prioridad tiene el proyecto?\n\n▪ Seguridad\n▪ Diseño\n▪ Durabilidad\n▪ Iluminación` };
    }
    if (environment === 'techo' || q.includes('cubierta') || product === 'techo') {
      return { text: `Perfecto 😊 Para techos o cubiertas de vidrio debemos considerar seguridad, peso, clima y estructura de soporte.\n\nNormalmente evaluamos:\n\n▪ Vidrio laminado de seguridad\n▪ Vidrio templado laminado\n▪ Estructura de aluminio\n\nPara continuar necesito:\n\n1️⃣ Medidas aproximadas del área.\n\n2️⃣ ¿Es interior o exterior?\n\n3️⃣ ¿Recibe lluvia o sol directo?\n\n4️⃣ ¿Buscas principalmente iluminación natural, protección o diseño?` };
    }
    if (q.includes('arquitectónico') || q.includes('arquitectonico')) {
      return { text: `Excelente 😊 Podemos ayudarte con soluciones arquitectónicas personalizadas en vidrio y aluminio.\n\nPara entender el proyecto necesito:\n\n1️⃣ Tipo de inmueble.\n\n2️⃣ Área aproximada.\n\n3️⃣ Ubicación del elemento dentro del proyecto.\n\n4️⃣ ¿Tienes plano, referencia o diseño previo?\n\n5️⃣ ¿Qué buscas principalmente?\n\n▪ Diseño moderno\n▪ Seguridad\n▪ Control solar\n▪ Aislamiento\n▪ Mayor iluminación` };
    }

    return {
      text: `Perfecto 😊 También realizamos proyectos especiales en vidrio y aluminio hechos a medida.\n\nPara entender bien tu idea necesito conocer:\n\n¿Qué tipo de proyecto deseas realizar?\n\n▪ Cerramiento personalizado\n▪ División especial\n▪ Estructura en vidrio y aluminio\n▪ Techo o cubierta\n▪ Proyecto arquitectónico\n▪ Otro diseño`
    };
  }

  // AMBIENTES GENÉRICOS (CUANDO AÚN NO HAY PRODUCTO ESCOGIDO)
  if (environment === 'terraza') {
    return { text: `Excelente 😊 Para una mampara de terraza necesito algunos datos:\n\n1️⃣ ¿La terraza es abierta o deseas cerrarla completamente?\n\n2️⃣ ¿Qué medidas aproximadas tiene?\n(Ancho x Alto en centímetros)\n\n${!climate ? '3️⃣ ¿Buscas principalmente protección contra viento y lluvia o un diseño más decorativo?' : '3️⃣ ¿Buscas un diseño decorativo?'}\n\nPara terrazas normalmente evaluamos vidrio templado de 8mm, 10mm o vidrio laminado de seguridad según el proyecto.` };
  }
  if (environment === 'balcón') {
    return { text: `Perfecto 😊 Para una mampara de balcón necesito conocer:\n\n1️⃣ Medidas aproximadas (ancho x alto en cm)\n\n${!climate ? '2️⃣ ¿El balcón está expuesto al viento o lluvia?\n\n3️⃣ ¿Deseas un sistema corredizo, fijo o una combinación?' : '2️⃣ ¿Deseas un sistema corredizo, fijo o una combinación?'}\n\nSegún el uso podemos recomendar vidrio templado o laminado de seguridad.` };
  }
  if (environment === 'baño') {
    return { text: `Excelente 😊 Para una mampara de baño necesito:\n\n1️⃣ Medidas del espacio (ancho x alto)\n\n2️⃣ ¿La quieres corrediza, fija o abatible?\n\n3️⃣ ¿Prefieres vidrio transparente, esmerilado o con mayor privacidad?\n\nPara baños normalmente recomendamos vidrio templado de 8mm o 10mm por seguridad.` };
  }
  if (environment === 'división') {
    return { text: `Perfecto 😊 Para una división de ambientes necesito:\n\n1️⃣ ¿Qué espacios deseas separar?\n(Ejemplo: sala, oficina, dormitorio)\n\n2️⃣ Medidas aproximadas\n\n3️⃣ ¿Buscas privacidad o mantener iluminación?\n\nPodemos trabajar con vidrio templado, laminado o esmerilado según el diseño.` };
  }
  if (q.includes('otro')) {
    return { text: `Perfecto 😊 Cuéntame un poco más sobre tu proyecto:\n\n1️⃣ ¿Dónde deseas instalar la mampara?\n\n2️⃣ Medidas aproximadas (ancho x alto)\n\n3️⃣ ¿Qué función debe cumplir?\n- Seguridad\n- Privacidad\n- Decoración\n- Protección contra clima\n\nCon esa información te recomendaré la mejor opción.` };
  }

  // RESPUESTA GENERAL
  return {
    text: `Puedo ayudarte con:

✓ Mamparas
✓ Ventanas de aluminio
✓ Puertas de vidrio
✓ Vidrios templados y laminados
✓ Proyectos especiales y fachadas
✓ Cotizaciones personalizadas

Cuéntame qué producto necesitas y te voy guiando paso a paso 😊`
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
  const [catalogStep, setCatalogStep] = useState<'intro' | 'measures' | 'color' | 'details' | 'summary'>('intro');
  const [catalogData, setCatalogData] = useState({ width: '', height: '', color: '', quantity: '', projectType: '', observations: '' });
  const [productFlowInitialized, setProductFlowInitialized] = useState(false);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const resetQuoteSession = () => {
    console.log('reinicio de cotización', {
      messages: [],
      previousContext: conversationContext,
      pendingQuote: null,
    });

    setMessages([
      {
        id: 'intro',
        role: 'assistant',
        text: '¡Hola! 😊 Soy Zhaid IA, tu asistente vidriero virtual. Estoy listo para ayudarte con precios, recomendaciones o cotizaciones.',
      },
    ]);
    setInput('');
    setTyping(false);
    setConversationContext(initialContext);
    clearPending();
  };

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
      setCatalogData({ width: '', height: '', color: '', quantity: '', projectType: '', observations: '' });
      setProductFlowInitialized(false);
      setPendingProduct(null);
      return;
    }

    const productMatch = resolveSelectedProduct(initialProduct ?? pendingProduct ?? null);
    if (productMatch) {
      setSelectedCatalogProduct(productMatch);
      setCatalogStep('measures');
      setCatalogData({ width: '', height: '', color: '', quantity: '', projectType: '', observations: '' });
    } else {
      setSelectedCatalogProduct(null);
      setCatalogStep('intro');
      setCatalogData({ width: '', height: '', color: '', quantity: '', projectType: '', observations: '' });
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
      const productPrice = product.priceFrom ?? product.price ?? 0;

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
            text: `Resumen del producto:\n\nProducto: ${product.name}\nCategoría: ${product.category}\nPrecio: S/ ${productPrice}.00\nUnidad: ${product.unit}\n\nPara poder calcular tu cotización necesito algunos datos:\n- Medidas aproximadas\n- Ancho\n- Alto\n- Cantidad`,
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
          text: `Perfecto. Para ayudarte con ${initialProduct}, necesito que me indiques las medidas aproximadas del proyecto para poder cotizarlo correctamente.`,
        },
      ];
    });
  }, [open, initialProduct, pendingProduct]);

  useEffect(() => {
    if (pendingQuote) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'user',
          text: `Cotización: ${pendingQuote.result.systemName ?? 'Producto no especificado'}; medidas ${pendingQuote.input.widthCm} × ${pendingQuote.input.heightCm} cm; cantidad ${pendingQuote.input.quantity}; vidrio ${pendingQuote.input.glassType}; espesor ${pendingQuote.input.thickness}; marco ${frameTypes.find((frame) => frame.id === pendingQuote.input.frameId)?.name ?? pendingQuote.input.frameId}; total ${formatCurrency(pendingQuote.result.total)}.`,
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
            text: '¡Listo! 😊 Aquí tienes tu cotización estimada basada en las medidas ingresadas:',
            quote: pendingQuote.result,
          },
        ]);
      }, 900);
      clearPending();
    }
  }, [pendingQuote, clearPending]);

  const send = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text
    };

    setMessages((m) => [...m, userMsg]);
    setInput('');

    if (selectedCatalogProduct) {
      const lower = text.toLowerCase();
      const widthMatch = text.match(/(?:ancho|width)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i) ?? text.match(/(\d+(?:[.,]\d+)?)\s*(?:x|×|por)\s*(\d+(?:[.,]\d+)?)/i);
      const heightMatch = text.match(/(?:alto|height)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i) ?? text.match(/\d+(?:[.,]\d+)?\s*(?:x|×|por)\s*(\d+(?:[.,]\d+)?)/i);
      const quantityMatch = text.match(/(?:cantidad|qty|unidades?)\s*[:=]?\s*(\d+)/i) ?? text.match(/(\d+)\s*(?:und|uds|unidades?)?$/i);
      const colorMatch = lower.match(/(negro|blanco|otro)/i);

      const productUnit = selectedCatalogProduct.unit;
      const productPrice = selectedCatalogProduct.priceFrom ?? selectedCatalogProduct.price ?? 0;

      if (catalogStep === 'measures') {
        const width = widthMatch ? (widthMatch[1] ?? widthMatch[2] ?? '').replace(',', '.') : '';
        const height = heightMatch ? (heightMatch[1] ?? heightMatch[2] ?? '').replace(',', '.') : '';
        const quantity = quantityMatch ? quantityMatch[1].replace(',', '.') : '';

        if (!width || !height || !quantity) {
          setMessages((m) => [
            ...m,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              text: `Necesito las medidas para continuar:\n\n- Ancho\n- Alto\n- Cantidad\n\nEjemplo: ancho 120, alto 90, cantidad 2`,
            },
          ]);
          return;
        }

        setCatalogData((prev) => ({ ...prev, width, height, quantity }));
        setCatalogStep('color');
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: `Perfecto. Tengo estas medidas: ${width} x ${height} cm y cantidad ${quantity}.\n\n2) ¿Qué color o acabado prefieres?\n- Negro\n- Blanco\n- Otro (especificar)`,
          },
        ]);
        return;
      }

      if (catalogStep === 'color') {
        const normalizedColor = lower.includes('blanco') ? 'Blanco' : lower.includes('negro') ? 'Negro' : lower.includes('otro') ? 'Otro' : '';

        if (!normalizedColor) {
          setMessages((m) => [
            ...m,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              text: `Selecciona el acabado/color:\n\n- Negro\n- Blanco\n- Otro (especificar)`,
            },
          ]);
          return;
        }

        setCatalogData((prev) => ({ ...prev, color: normalizedColor }));
        setCatalogStep('details');
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: `3) Necesito estos detalles adicionales:\n- Tipo de vidrio\n- Espesor\n- Accesorios si aplica`,
          },
        ]);
        return;
      }

      if (catalogStep === 'details') {
        if (!text.trim()) {
          setMessages((m) => [
            ...m,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              text: `Necesito estos detalles para completar la cotización:\n\n- Tipo de vidrio\n- Espesor\n- Accesorios si aplica`,
            },
          ]);
          return;
        }

        const observations = text.trim();
        const widthValue = Number(catalogData.width || '0');
        const heightValue = Number(catalogData.height || '0');
        const quantityValue = Number(catalogData.quantity || '0');
        const colorValue = catalogData.color || 'No indicado';
        const glassTypeValue = /tipo\s*de\s*vidrio[^:]*[:\-]?\s*([^\n;]+)|vidrio[^:]*[:\-]?\s*([^\n;]+)/i.exec(observations)?.[1]?.trim() || /vidrio[^:]*[:\-]?\s*([^\n;]+)/i.exec(observations)?.[2]?.trim() || 'No indicado';
        const thicknessValue = /espesor[^:]*[:\-]?\s*([^\n;]+)|grosor[^:]*[:\-]?\s*([^\n;]+)/i.exec(observations)?.[1]?.trim() || /espesor[^:]*[:\-]?\s*([^\n;]+)/i.exec(observations)?.[2]?.trim() || 'No indicado';
        const accessoriesValue = /accesorios[^:]*[:\-]?\s*([^\n;]+)|accesorio[^:]*[:\-]?\s*([^\n;]+)/i.exec(observations)?.[1]?.trim() || /accesorios[^:]*[:\-]?\s*([^\n;]+)/i.exec(observations)?.[2]?.trim() || 'No indicado';

        let estimatedTotal = Number(productPrice) * quantityValue;

        if (productUnit === 'm²') {
          const areaM2 = (widthValue * heightValue) / 10000;
          estimatedTotal = Number(productPrice) * areaM2 * quantityValue;
        }

        if (productUnit === 'pie') {
          estimatedTotal = Number(productPrice) * quantityValue;
        }

        if (productUnit === 'und') {
          estimatedTotal = Number(productPrice) * quantityValue;
        }

        const summaryText = `Resumen de cotización:\n\nProducto: ${selectedCatalogProduct.name}\nMedidas: ${catalogData.width || 'N/A'} x ${catalogData.height || 'N/A'} cm\nCantidad: ${catalogData.quantity || 'N/A'}\nColor: ${colorValue}\nTipo de vidrio: ${glassTypeValue}\nEspesor: ${thicknessValue}\nAccesorios: ${accessoriesValue}\nPrecio referencial: S/ ${productPrice}.00\nUnidad de venta: ${productUnit}\nObservaciones: ${observations}\n\nLa cotización es referencial y puede variar según medidas mínimas de fabricación, instalación y accesorios.\n\nCotización estimada: S/ ${estimatedTotal.toFixed(2)}`;

        setCatalogData((prev) => ({ ...prev, observations }));
        setCatalogStep('summary');
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: summaryText,
            waLink: getWhatsAppLink(`Hola Zhaid Glass Solutions 👋\n\nQuiero solicitar una cotización del producto ${selectedCatalogProduct.name}.\n\nProducto: ${selectedCatalogProduct.name}\nCategoría: ${selectedCatalogProduct.category}\nMedidas: ${catalogData.width || 'N/A'} x ${catalogData.height || 'N/A'} cm\nCantidad: ${catalogData.quantity || 'N/A'}\nColor: ${colorValue}\nTipo de vidrio: ${glassTypeValue}\nEspesor: ${thicknessValue}\nAccesorios: ${accessoriesValue}\nPrecio referencial: S/ ${productPrice}.00\nUnidad de venta: ${productUnit}\nObservaciones: ${observations}\n\nCotización estimada: S/ ${estimatedTotal.toFixed(2)}\n\nLa cotización es referencial y puede variar según medidas mínimas de fabricación, instalación y accesorios.\n\nGracias.`),
          },
        ]);
        return;
      }

      if (catalogStep === 'summary') {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: 'La cotización quedó lista. Puedes enviarla por WhatsApp o continuar con más detalles.',
          },
        ]);
        return;
      }

      return;
    }

    const lower = text.toLowerCase();
    const isKnowledgeQuestion = Boolean(
      /serie nacional|serie española|materiales|colores?.*aluminio|aluminio.*colores|cotizar.*medidas|según mis medidas|segun mis medidas|cuánto cuesta|cuanto cuesta|precio/.test(lower)
    );

    const previousContext = conversationContext;
    console.log('contexto anterior', previousContext);

    const isGeneralKnowledgeQuestion = /qué vidrios|que vidrios|tipo de vidrio|vidrios tienen|qué materiales|que materiales|materiales trabajan|qué colores|que colores|colores disponibles/.test(lower);
    const productMatch = isGeneralKnowledgeQuestion
      ? lower.match(/(mampara|ventana|puerta|espejo|fachada|techo|cubierta|cerramiento|división|division|estructura|especial|proyecto|baranda)/)
      : lower.match(/(mampara|ventana|puerta|espejo|vidrio|fachada|techo|cubierta|aluminio|cerramiento|división|division|estructura|especial|proyecto|baranda)/);
    const hasMeasurementOnlyReply = Boolean(text.match(/\d+\s*(?:x|×|por)\s*\d+/i)) && !productMatch;
    const flowProduct = normalizeProductContext((pendingProduct ?? initialProduct ?? conversationContext.product ?? '').toString());
    const systemMatch = getSystemFromQuestion(lower);
    const nextSeries = systemMatch?.name ?? conversationContext.series;

    let nextProduct = productMatch ? normalizeProductContext(productMatch[0]) : flowProduct;
    
    if (['cubierta'].includes(nextProduct)) nextProduct = 'techo';
    if (['division'].includes(nextProduct)) nextProduct = 'división';
    if (['especial', 'proyecto'].includes(nextProduct)) nextProduct = 'proyecto especial';

    if (hasMeasurementOnlyReply && flowProduct) {
      nextProduct = flowProduct;
    }

    if (hasMeasurementOnlyReply && pendingProduct) {
      setPendingProduct(null);
    }

    const envMatch = lower.match(/(baño|ducha|terraza|balcón|balcon|dormitorio|habitacion|habitación|sala|living|oficina|cocina|local|comercial|entrada|principal|interior|casa|vivienda|division|división|ambiente|fachada|techo)/);
    let nextEnvironment = envMatch ? envMatch[0] : conversationContext.environment;
    
    if (nextEnvironment) {
      if (['ducha'].includes(nextEnvironment)) nextEnvironment = 'baño';
      if (['balcon'].includes(nextEnvironment)) nextEnvironment = 'balcón';
      if (['habitacion', 'habitación'].includes(nextEnvironment)) nextEnvironment = 'dormitorio';
      if (['living'].includes(nextEnvironment)) nextEnvironment = 'sala';
      if (['comercial'].includes(nextEnvironment)) nextEnvironment = 'local';
      if (['principal'].includes(nextEnvironment)) nextEnvironment = 'entrada';
      if (['casa', 'vivienda'].includes(nextEnvironment)) nextEnvironment = 'interior';
      if (['division', 'división', 'ambiente'].includes(nextEnvironment)) nextEnvironment = 'división';
    }

    const needMatch = lower.match(/(privacidad|seguridad|diseño|aislamiento|clima)/);
    const nextNeed = needMatch ? needMatch[0] : conversationContext.need;

    const measuresMatch = text.match(
  /\d+(?:[.,]\d+)?\s*(?:x|×|por)\s*\d+(?:[.,]\d+)?/i
);
    const nextMeasures = measuresMatch ? measuresMatch[0].toLowerCase() : conversationContext.measures;

    const climateMatch = lower.match(
      /(lluvia(?:\s+fuerte|\s+constante)?|viento(?:\s+fuerte|\s+constante)?|mucho\s+(?:sol|viento|lluvia)|sol\s+(?:directo|fuerte)|clima\s+(?:lluvioso|ventoso|soleado)|expuesto\s+(?:al\s+)?(?:sol|viento|clima)|zona\s+(?:muy\s+)?(?:lluviosa|ventosa|soleada))/i
    );

    const nextClimate = climateMatch ? climateMatch[0] : conversationContext.climate;
    
    const colorMatch = lower.match(
      /(negro|blanco|natural|gris|madera|champagne|anodizado)/i
    );

    const nextColor = colorMatch
      ? colorMatch[0]
      : conversationContext.color;

    const materialMatch = lower.match(/(aluminio|pvc)/i);
    const nextMaterial = materialMatch ? materialMatch[0].toLowerCase() : conversationContext.material;
    const glassTypeMatch = lower.match(/(templado|laminado|crudo)/i);
    const nextGlassType = glassTypeMatch ? glassTypeMatch[0].toLowerCase() : conversationContext.glassType;
    const thicknessMatch = lower.match(/(6|8)\s*mm/i);
    const nextGlassThickness = thicknessMatch ? `${thicknessMatch[1]}mm` : conversationContext.glassThickness;
    const glassColorMatch = lower.match(/(transparente|bronce|azul claro|azul electra)/i);
    const nextGlassColor = glassColorMatch ? glassColorMatch[0].toLowerCase() : conversationContext.glassColor;
    const quantityMatch = lower.match(/(?:cantidad|necesito|quiero)\s*(\d+)\b/i) ?? lower.match(/\b(\d+)\s+(?:ventanas?|mamparas?|puertas?|piezas?|unidades?)/i);
    const quantityWordMatch = lower.match(/\b(una?|dos|tres|cuatro|cinco)(?:\s+(?:ventanas?|mamparas?|puertas?|piezas?|unidades?))?\b/i);
    const quantityWords: Record<string, string> = { una: '1', un: '1', uno: '1', dos: '2', tres: '3', cuatro: '4', cinco: '5' };
    const nextQuantity = quantityMatch
      ? (quantityMatch[1] ?? quantityMatch[2])
      : quantityWordMatch
        ? quantityWords[quantityWordMatch[1].toLowerCase()]
        : conversationContext.quantity;

    console.log('datos nuevos', {
      productMatch: productMatch?.[0] ?? null,
      envMatch: envMatch?.[0] ?? null,
      needMatch: needMatch?.[0] ?? null,
      measuresMatch: measuresMatch?.[0] ?? null,
      climateMatch: climateMatch?.[0] ?? null,
      colorMatch: colorMatch?.[0] ?? null,
      pendingProduct,
      nextProduct,
      hasMeasurementOnlyReply,
    });

    const shouldResetProductSpecificContext =
      Boolean(conversationContext.product) &&
      Boolean(nextProduct) &&
      conversationContext.product !== nextProduct;

    const newContext: ConversationContext = {
      product: nextProduct,
      series: shouldResetProductSpecificContext ? '' : nextSeries,
      environment: shouldResetProductSpecificContext ? '' : nextEnvironment,
      need: shouldResetProductSpecificContext ? '' : nextNeed,
      measures: shouldResetProductSpecificContext ? '' : nextMeasures,
      climate: shouldResetProductSpecificContext ? '' : nextClimate,
      color: shouldResetProductSpecificContext ? '' : nextColor,
      quantity: shouldResetProductSpecificContext ? '' : nextQuantity,
      material: shouldResetProductSpecificContext ? '' : nextMaterial,
      glassType: shouldResetProductSpecificContext ? '' : nextGlassType,
      glassThickness: shouldResetProductSpecificContext ? '' : nextGlassThickness,
      glassColor: shouldResetProductSpecificContext ? '' : nextGlassColor,
      additionalDetails: shouldResetProductSpecificContext ? '' : text.trim(),
      updatedAt: new Date().toISOString(),
    };

    console.log('contexto final', newContext);
    setConversationContext(newContext);

    setTyping(true);

    setTimeout(() => {
      const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
      const lastAssistantPrompt = (lastAssistantMessage?.text ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[¿?¡!]/g, '')
        .trim();
      const isWhatsAppConfirmationQuestion =
        lastAssistantPrompt.includes('deseas que un asesor te envie una cotizacion exacta por whatsapp') ||
        lastAssistantPrompt.includes('deseas que un asesor te envie una cotizacion exacta por whatsapp');
      const normalizedUserReply = lower
        .replace(/[.,;:!?]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const hasNewProjectInfo = Boolean(
        productMatch ||
        envMatch ||
        measuresMatch ||
        colorMatch ||
        climateMatch ||
        needMatch
      );
      const isDirectWhatsAppConfirmation = /^(si|si quiero|quiero|claro|adelante|ok|sí)$/i.test(normalizedUserReply);
      const wantsWhatsapp =
        isWhatsAppConfirmationQuestion &&
        isDirectWhatsAppConfirmation &&
        !hasNewProjectInfo;

      if (wantsWhatsapp) {
        const recommendedSystemId = resolveDefaultSystem(newContext.product, newContext.environment, newContext.need, newContext.climate);
        const recommendedSystemName = windowSystems.find((system) => system.id === recommendedSystemId)?.name ?? recommendedSystemId;

        const whatsappLines = [
          'Hola, quisiera solicitar una cotizacion para mi proyecto.',
          '',
          'Producto: ' + (newContext.product || 'No especificado'),
          'Ambiente: ' + (newContext.environment || 'No especificado'),
          'Medidas aproximadas: ' + (newContext.measures || 'No especificado'),
          'Sistema recomendado: ' + (recommendedSystemName || 'No especificado'),
          ...(newContext.climate ? ['Condicion: ' + newContext.climate] : ['Condicion: No especificado']),
          ...(newContext.color ? ['Color: ' + newContext.color] : ['Color: No especificado']),
          ...(newContext.need ? ['Necesidad: ' + newContext.need] : ['Necesidad: No especificado']),
          '',
          'Me gustaria que puedan revisar mi proyecto y brindarme una cotizacion.',
        ];

        const mensaje = encodeURIComponent(whatsappLines.join('\n'));

        window.open(
          `https://wa.me/51995973129?text=${mensaje}`,
          '_blank'
        );

        setTyping(false);
        return;
      }

      const hasProjectInfo = Boolean(
        productMatch ||
        envMatch ||
        measuresMatch ||
        colorMatch ||
        climateMatch ||
        needMatch
      );
      const advisorResponse = buildAdvisorResponse(text, newContext);

      if (!hasProjectInfo && !isKnowledgeQuestion && !advisorResponse) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: 'No pude identificar una solicitud de cotización. Por favor indícame qué producto deseas cotizar y sus medidas aproximadas.'
          }
        ]);
        setTyping(false);
        return;
      }

      // LLAMA A GENERATERESPONSE CON EL CONTEXTO YA FUSIONADO Y ACTUALIZADO
      const res = advisorResponse
        ? { text: advisorResponse }
        : generateResponse(text, newContext.product, newContext.need, newContext);
      const quoteReady = Boolean(
        newContext.product &&
        newContext.measures &&
        newContext.quantity &&
        newContext.glassType &&
        newContext.glassThickness
      );

      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: addFriendlyTone(normalizeAiResponse(res.text)),
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
  const quoteMessage = input
    ? `Hola, quisiera consultar una cotización realizada en la página web de Zhaid Glass Solutions.\n\nDatos de mi cotización:\n\nSerie/producto: ${quote.systemName ?? 'No especificado'}\nMedidas: ${input.widthCm} × ${input.heightCm} cm\nCantidad: ${input.quantity}\nTipo de vidrio: ${input.glassType}\nEspesor: ${input.thickness}\nMarco: ${frameName}\nTotal estimado: ${formatCurrency(quote.total)}\n\nQuisiera confirmar la cotización y los detalles con el proveedor.`
    : `Hola, quisiera consultar esta cotización realizada en la página web de Zhaid Glass Solutions.\n\nTotal estimado: ${formatCurrency(quote.total)}\n\nQuisiera confirmar la cotización y los detalles con el proveedor.`;

  return (
    <div className="mt-3 rounded-xl bg-gradient-to-br from-sky-50 to-white p-3 ring-1 ring-sky-100">
      <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
        <Sparkles className="h-4 w-4" />
        Cotización estimada
      </div>

      <div className="mt-3 space-y-1 text-xs text-ink-500">
        {quote.systemName && <Line label="Producto / serie" value={quote.systemName} />}
        {quote.systemPrice !== undefined && quote.systemUnit && <Line label={`Precio por ${quote.systemUnit}`} value={formatCurrency(quote.systemPrice)} />}
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
        <Line
          label="Marco"
          value={formatCurrency(quote.frameCost)}
        />
        <Line
          label="Instalación"
          value={formatCurrency(quote.installationCost)}
        />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-sky-600 px-3 py-2 text-white">
        <span className="text-xs font-medium">
          Total aprox.
        </span>
        <span className="font-display text-sm font-extrabold">
          {formatCurrency(quote.total)}
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

export interface Service {
  id: string;
  name: string;
  description: string;
  image: string;
  features: string[];
  featured: boolean;
  icon: string;
}

export const services: Service[] = [
  {
    id: 'svc-templados',
    name: 'Vidrios Templados',
    description:
      'Vidrio de seguridad 5x más resistente, ideal para áreas de alto tránsito y aplicaciones donde la seguridad es prioritaria.',
    image: '',
    features: ['Tratamiento térmico', '5x más resistente', 'Fragmentación segura'],
    featured: true,
    icon: 'ShieldCheck',
  },
  {
    id: 'svc-mamparas',
    name: 'Mamparas',
    description:
      'Mamparas de baño en vidrio templado con herrajes de acero inoxidable. Diseños fijos, corredizos y abatibles.',
    image: '',
    features: ['Vidrio templado', 'Herrajes de acero inoxidable', 'Diseños fijos, corredizos y abatibles'],
    featured: true,
    icon: 'ShowerHead',
  },
  {
    id: 'svc-ventanas',
    name: 'Ventanas',
    description:
      'Ventanas de aluminio con sistema de doble contacto y vidrio flotado. Excelente sellado térmico y acústico.',
    image: '',
    features: ['Sistema de doble contacto', 'Sellado térmico y acústico', 'Vidrio flotado'],
    featured: true,
    icon: 'AppWindow',
  },
  {
    id: 'svc-puertas',
    name: 'Puertas',
    description: 'Puertas de vidrio templado con bisagras de alta resistencia para interiores y exteriores.',
    image: '',
    features: ['Vidrio templado', 'Bisagras de alta resistencia', 'Para interiores y exteriores'],
    featured: true,
    icon: 'DoorOpen',
  },
  {
    id: 'svc-barandas',
    name: 'Barandas',
    description:
      'Barandas de vidrio laminado templado para escaleras, balcones y terrazas con fijación superior o inferior.',
    image: '',
    features: ['Vidrio laminado templado', 'Fijación superior o inferior', 'Para escaleras, balcones y terrazas'],
    featured: true,
    icon: 'Fence',
  },
  {
    id: 'svc-espejos',
    name: 'Espejos',
    description: 'Espejos con tratamiento antimancha, bordes pulidos y opciones decorativas a medida.',
    image: '',
    features: ['Tratamiento antimancha', 'Bordes pulidos', 'Opciones decorativas a medida'],
    featured: false,
    icon: 'Frame',
  },
  {
    id: 'svc-techos',
    name: 'Techos',
    description: 'Techos acristalados con vidrio laminado templado y estructura de aluminio para patios y terrazas.',
    image: '',
    features: ['Vidrio laminado templado', 'Estructura de aluminio', 'Para patios y terrazas'],
    featured: false,
    icon: 'Home',
  },
  {
    id: 'svc-divisiones',
    name: 'Divisiones de Oficina',
    description:
      'Divisiones de vidrio para oficinas con perfiles de aluminio en colores a elección y cierre hermético.',
    image: '',
    features: ['Perfiles de aluminio', 'Colores a elección', 'Cierre hermético'],
    featured: false,
    icon: 'Columns3',
  },
];

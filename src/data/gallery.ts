export type GalleryCategory =
  | 'Mamparas'
  | 'Ventanas'
  | 'Puertas'
  | 'Espejos'
  | 'Fachadas'
  | 'Aluminio'
  | 'Proyectos especiales';

export type GalleryType = 'image' | 'video';

export interface GalleryItem {
  id: string;
  type: GalleryType;
  title: string;
  description: string;
  category: GalleryCategory;
  src: string;
  thumbnail: string;
  featured: boolean;
}

export const galleryCategories: GalleryCategory[] = [
  'Mamparas',
  'Puertas',
  'Ventanas',
  'Espejos',
  'Aluminio',
  'Fachadas',
  'Proyectos especiales',
];

export const galleryItems: GalleryItem[] = [

  // MAMPARAS
  {
    id: 'g1',
    type: 'image',
    title: 'Mampara de vidrio templado',
    description: 'Sistema de mampara fabricado a medida con vidrio de seguridad y acabados modernos.',
    category: 'Mamparas',
    src: '/images/gallery/mampara-01.jpeg',
    thumbnail: '/images/gallery/mampara-01.jpeg',
    featured: true,
  },
  {
    id: 'g2',
    type: 'image',
    title: 'Mampara corrediza moderna',
    description: 'Cerramiento elegante para interiores con perfiles de aluminio y vidrio.',
    category: 'Mamparas',
    src: '/images/gallery/mampara-02.jpeg',
    thumbnail: '/images/gallery/mampara-02.jpeg',
    featured: false,
  },
  {
    id: 'g3',
    type: 'image',
    title: 'Mampara residencial premium',
    description: 'Diseño personalizado para optimizar iluminación y distribución de espacios.',
    category: 'Mamparas',
    src: '/images/gallery/mampara-03.jpeg',
    thumbnail: '/images/gallery/mampara-03.jpeg',
    featured: false,
  },


  // PUERTAS
  {
    id: 'g4',
    type: 'image',
    title: 'Puerta de vidrio templado',
    description: 'Puerta arquitectónica con vidrio de seguridad y herrajes de alta resistencia.',
    category: 'Puertas',
    src: '/images/gallery/puerta-01.jpeg',
    thumbnail: '/images/gallery/puerta-01.jpeg',
    featured: true,
  },
  {
    id: 'g5',
    type: 'image',
    title: 'Puerta corrediza de aluminio',
    description: 'Sistema corredizo fabricado para espacios residenciales y comerciales.',
    category: 'Puertas',
    src: '/images/gallery/puerta-02.jpeg',
    thumbnail: '/images/gallery/puerta-02.jpeg',
    featured: false,
  },
  {
    id: 'g6',
    type: 'image',
    title: 'Puerta personalizada',
    description: 'Solución fabricada según requerimientos del cliente.',
    category: 'Puertas',
    src: '/images/gallery/puerta-03.jpeg',
    thumbnail: '/images/gallery/puerta-03.jpeg',
    featured: false,
  },


  // VENTANAS
  {
    id: 'g7',
    type: 'image',
    title: 'Ventana de aluminio',
    description: 'Sistema de ventana en aluminio con excelente acabado y durabilidad.',
    category: 'Ventanas',
    src: '/images/gallery/ventana-01.jpeg',
    thumbnail: '/images/gallery/ventana-01.jpeg',
    featured: true,
  },
  {
    id: 'g8',
    type: 'image',
    title: 'Ventana corrediza de aluminio',
    description: 'Diseño funcional para iluminación y ventilación natural.',
    category: 'Ventanas',
    src: '/images/gallery/ventana-02.jpeg',
    thumbnail: '/images/gallery/ventana-02.jpeg',
    featured: false,
  },
  {
    id: 'g9',
    type: 'image',
    title: 'Ventana arquitectónica',
    description: 'Fabricación personalizada en aluminio y vidrio.',
    category: 'Ventanas',
    src: '/images/gallery/ventana-03.jpeg',
    thumbnail: '/images/gallery/ventana-03.jpeg',
    featured: false,
  },
  {
    id: 'g10',
    type: 'image',
    title: 'Ventana especial',
    description: 'Proyecto desarrollado con medidas y acabados personalizados.',
    category: 'Ventanas',
    src: '/images/gallery/ventana-04.jpeg',
    thumbnail: '/images/gallery/ventana-04.jpeg',
    featured: false,
  },


  // ESPEJOS
  {
    id: 'g11',
    type: 'image',
    title: 'Espejo decorativo a medida',
    description: 'Espejo instalado para ambientes modernos con acabado elegante.',
    category: 'Espejos',
    src: '/images/gallery/espejo-01.jpeg',
    thumbnail: '/images/gallery/espejo-01.jpeg',
    featured: true,
  },
  {
    id: 'g12',
    type: 'image',
    title: 'Espejo residencial',
    description: 'Solución decorativa para ampliar visualmente los espacios.',
    category: 'Espejos',
    src: '/images/gallery/espejo-02.jpeg',
    thumbnail: '/images/gallery/espejo-02.jpeg',
    featured: false,
  },
  {
    id: 'g13',
    type: 'image',
    title: 'Espejo personalizado',
    description: 'Fabricación e instalación de espejos según diseño del cliente.',
    category: 'Espejos',
    src: '/images/gallery/espejo-03.jpeg',
    thumbnail: '/images/gallery/espejo-03.jpeg',
    featured: false,
  },


  // ALUMINIO
  {
    id: 'g14',
    type: 'image',
    title: 'Estructura de aluminio',
    description: 'Sistema fabricado en aluminio para soluciones arquitectónicas.',
    category: 'Aluminio',
    src: '/images/gallery/aluminio-01.jpeg',
    thumbnail: '/images/gallery/aluminio-01.jpeg',
    featured: true,
  },
  {
    id: 'g15',
    type: 'image',
    title: 'Cerramiento de aluminio',
    description: 'Trabajo personalizado con perfiles de aluminio.',
    category: 'Aluminio',
    src: '/images/gallery/aluminio-02.jpeg',
    thumbnail: '/images/gallery/aluminio-02.jpeg',
    featured: false,
  },
  {
    id: 'g16',
    type: 'image',
    title: 'Proyecto en aluminio',
    description: 'Solución resistente y funcional para exteriores.',
    category: 'Aluminio',
    src: '/images/gallery/aluminio-04.jpeg',
    thumbnail: '/images/gallery/aluminio-04.jpeg',
    featured: false,
  },


  // PROYECTOS ESPECIALES
  {
    id: 'g17',
    type: 'image',
    title: 'Proyecto especial arquitectónico',
    description: 'Desarrollo personalizado en vidrio y aluminio.',
    category: 'Proyectos especiales',
    src: '/images/gallery/proyecto-especial-01.jpeg',
    thumbnail: '/images/gallery/proyecto-especial-01.jpeg',
    featured: true,
  },
  {
    id: 'g18',
    type: 'image',
    title: 'Solución especial en vidrio',
    description: 'Proyecto desarrollado según requerimientos del espacio.',
    category: 'Proyectos especiales',
    src: '/images/gallery/proyecto-especial-02.jpeg',
    thumbnail: '/images/gallery/proyecto-especial-02.jpeg',
    featured: false,
  },
  {
    id: 'g19',
    type: 'image',
    title: 'Instalación personalizada',
    description: 'Proyecto especial de fabricación e instalación.',
    category: 'Proyectos especiales',
    src: '/images/gallery/proyecto-especial-03.jpeg',
    thumbnail: '/images/gallery/proyecto-especial-03.jpeg',
    featured: false,
  },

  //fACHADAS
  {
  id: 'g20',
  type: 'image',
  title: 'Fachada arquitectónica en vidrio y aluminio',
  description: 'Sistema de fachada diseñado para proyectos comerciales y residenciales.',
  category: 'Fachadas',
  src: '/images/gallery/fachada-01.jpeg',
  thumbnail: '/images/gallery/fachada-01.jpeg',
  featured: false,
},

];
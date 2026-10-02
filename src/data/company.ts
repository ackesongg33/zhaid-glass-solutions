export interface CompanyValue {
  title: string;
  text: string;
  icon: string;
}

export interface CompanyStat {
  value: number;
  suffix: string;
  label: string;
}

export const company = {
  name: 'Zhaid Glass Solutions',
  shortName: 'Zhaid Glass',
  description:
    'Venta e instalación profesional de vidrios, espejos y estructuras de aluminio. Diseñamos, fabricamos e instalamos soluciones a medida con garantía y acabados premium.',
  slogan: 'Calidad y transparencia en cada proyecto.',
  history:
    'Zhaid Glass Solutions nació hace más de 10 años con una misión clara: entregar soluciones en vidrio y aluminio que combinen estética, seguridad y durabilidad. Hoy somos un equipo de especialistas que ha llevado esa promesa a hogares, oficinas y comercios en toda la ciudad.',
  experience: 10,
  mission:
  'Ofrecer soluciones integrales en diseño, corte e instalación de cristales y aluminios, satisfaciendo las necesidades estéticas y de seguridad de los clientes con calidad y puntualidad.',
 vision:
  'Ser la empresa líder e innovadora del sector en la región, reconocida por la máxima calidad en acabados arquitectónicos, innovación en diseños de cristal y una capacidad de respuesta insuperable en proyectos residenciales y comerciales, destacando por su excelencia en el servicio y compromiso sostenible.',
  values: [
    { title: 'Calidad', text: 'Materiales certificados y control de calidad en cada lote.', icon: 'Award' },
    { title: 'Transparencia', text: 'Cotizaciones claras y precios sin sorpresas.', icon: 'Eye' },
    { title: 'Compromiso', text: 'Cumplimos plazos y respaldamos cada instalación.', icon: 'Handshake' },
    { title: 'Innovación', text: 'Soluciones modernas con tecnología y diseño de vanguardia.', icon: 'Sparkles' },
  ],
  specialties: [
    'Vidrios templados',
    'Mamparas de baño',
    'Ventanas de aluminio',
    'Puertas de vidrio',
    'Barandas de cristal',
    'Espejos decorativos',
    'Techos acristalados',
    'Divisiones de oficina',
  ],
  serviceAreas: ['Trujillo', 'La Libertad'],
  address: 'Jr. Francisco de Zela 420, Trujillo, Perú',
  phone: '995 973 129',
  phoneRaw: '51995973129',
  whatsapp: '51995973129',
  email: 'contacto@zhaidglasssolutions.com',
  schedule: 'Lun - Sáb: 8:30 am - 7:00 pm',
  googleMapsUrl:
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d293.5765490549031!2d-79.0204179080879!3d-8.113751928283802!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91ad3d806f38ade5%3A0x345b78fb3a190079!2sFrancisco%20de%20Zela%20420%2C%20Trujillo%2013006!5e0!3m2!1ses-419!2spe!4v1789334468810!5m2!1ses-419!2spe',
  instagram: '#',
  tiktok: '#',
  youtube: '#',
  logo: '/images/logo.png',
  favicon: '/images/logo.png',
};

export const stats: CompanyStat[] = [
  { value: 10, suffix: '+', label: 'Años de experiencia' },
  { value: 300, suffix: '+', label: 'Proyectos completados' },
  { value: 500, suffix: '+', label: 'Clientes satisfechos' },
  { value: 100, suffix: '%', label: 'Garantía' },
];

export const whyChooseUs = [
  '10 años de experiencia comprobable',
  'Garantía escrita de 1 años en cada instalación',
  'Equipo técnico propio y certificado',
  'Materiales de primera línea certificados ISO',
  'Cotización gratuita y sin compromiso',
  'Instalación profesional y puntual',
];

export interface SocialLink {
  name: string;
  icon: string;
  url: string;
}

export const site = {
  siteName: 'Zhaid Glass Solutions',
  title: 'Zhaid Glass Solutions — Especialistas en Vidrios y Aluminio',
  description:
    'Zhaid Glass Solutions: venta e instalación profesional de vidrios, espejos y estructuras de aluminio. Cotiza al instante con Zhaid IA.',
  keywords: [
    'vidrios',
    'aluminio',
    'mamparas',
    'barandas',
    'espejos',
    'puertas de vidrio',
    'ventanas',
    'fachadas',
    'Zhaid Glass Solutions',
  ],
  logo: '/images/logo.png',
  favicon: '/images/logo.png',
  socialLinks: [
    { name: 'Facebook', icon: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61594666064836' },
    { name: 'Instagram', icon: 'Instagram', url: 'https://www.instagram.com/zhaidglass' },
    { name: 'TikTok', icon: 'Music2', url: 'https://www.tiktok.com/@marioramoscardena' },
  ] as SocialLink[],
};

export const socialLinks: SocialLink[] = site.socialLinks;

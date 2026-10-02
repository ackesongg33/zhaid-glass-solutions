export const contact = {
  whatsapp: "51995973129",
  phone: "995 973 129",
  phoneRaw: "51995973129",
  email: "contacto@zhaidglasssolutions.com",
  address: "Jr. Francisco de Zela 420, Trujillo, Perú",
  schedule: "Lunes a Sábado, 8:30 a.m. – 7:00 p.m.",
  googleMapsUrl:
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d293.5765490549031!2d-79.0204179080879!3d-8.113751928283802!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91ad3d806f38ade5%3A0x345b78fb3a190079!2sFrancisco%20de%20Zela%20420%2C%20Trujillo%2013006!5e0!3m2!1ses-419!2spe!4v1789334468810!5m2!1ses-419!2spe",
  whatsappMessage:
    "Hola, me gustaría solicitar una cotización con Zhaid Glass Solutions.",
};

export function getWhatsAppLink(message?: string): string {
  const text = encodeURIComponent(message ?? contact.whatsappMessage ?? contact.whatsappMessage);
  return `https://wa.me/${contact.whatsapp}?text=${text}`;
}

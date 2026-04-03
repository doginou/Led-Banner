/** Libellés en français dans l’UI ; texte affiché sur la bannière (suédois / anglais selon le preset). */
export type SwedenPreset = {
  id: string;
  labelFr: string;
  bannerText: string;
};

export const SWEDEN_PRESETS: SwedenPreset[] = [
  {
    id: "vacker",
    labelFr: "Tu es très belle",
    bannerText: "Du är väldigt vacker",
  },
  {
    id: "kyss",
    labelFr: "Embrasse-moi",
    bannerText: "Kyss mig",
  },
  {
    id: "blonde",
    labelFr: "Je cherche ma blonde aux yeux bleus",
    bannerText: "Jag söker min blonda med blå ögon",
  },
  {
    id: "fr-sv",
    labelFr: "Garçon français cherche fille suédoise",
    bannerText: "Fransk kille söker svensk tjej",
  },
  {
    id: "saknar",
    labelFr: "Tu me manques",
    bannerText: "Jag saknar dig",
  },
  {
    id: "dejt",
    labelFr: "Rendez-vous romantique",
    bannerText: "Romantisk dejt?",
  },
  {
    id: "hjarta",
    labelFr: "Mon cœur bat pour toi",
    bannerText: "Mitt hjärta slår för dig",
  },
  {
    id: "kom",
    labelFr: "Viens avec moi",
    bannerText: "Kom med mig",
  },
];

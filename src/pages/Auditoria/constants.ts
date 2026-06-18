export const AUDIT_CATEGORIES = [
  {
    category_name: "Área Externa",
    items: [
      { name: "Fachada", min_photos: 1 },
      { name: "LED / Letreiro", min_photos: 1 },
      { name: "Portão", min_photos: 1 },
      { name: "Pintura (Externa)", min_photos: 1 },
      { name: "Limpeza (Externa/Calçada)", min_photos: 1 },
      { name: "Banner", min_photos: 1 },
    ]
  },
  {
    category_name: "Recepção",
    items: [
      { name: "Balcão e Gaveta", min_photos: 2 },
      { name: "Banner QR Code PIX", min_photos: 1 },
      { name: "TVs e Som", min_photos: 1 },
      { name: "Sofás e Cadeiras", min_photos: 1 },
      { name: "Bebedouros", min_photos: 2 },
      { name: "Informática/Equipamentos", min_photos: 6 }, // PC, Monitor, Impressora, etc.
      { name: "Ar Condicionado e Tomadas", min_photos: 1 },
      { name: "Lixeira", min_photos: 1 },
    ]
  },
  {
    category_name: "Sala Comercial",
    items: [
      { name: "Mobiliário", min_photos: 1 },
      { name: "Equipamentos", min_photos: 1 },
      { name: "Conforto", min_photos: 1 },
      { name: "Infraestrutura", min_photos: 1 },
    ]
  },
  {
    category_name: "Oficina / Pátio",
    items: [
      { name: "Infraestrutura Geral", min_photos: 3 }, // Telhado, calha, pintura
      { name: "Armazenamento e Descartes", min_photos: 2 },
      { name: "Segurança (Extintores)", min_photos: 1 },
      { name: "Ar e Climatização", min_photos: 2 }, // Exige múltiplos ventiladores
      { name: "Mobiliário da Oficina", min_photos: 2 },
      { name: "Ferramentas e Máquinas", min_photos: 5 }, // Elevadores, prensa
      { name: "Equipamentos de Apoio", min_photos: 3 }, // Pistolas, calibrador
    ]
  },
  {
    category_name: "Banheiros e Tanque",
    items: [
      { name: "Banheiro", min_photos: 4 }, // Pia, porta, lâmpada, tomada
      { name: "Área do Tanque", min_photos: 1 },
    ]
  },
  {
    category_name: "Cozinha",
    items: [
      { name: "Geladeira e Freezer", min_photos: 2 },
      { name: "Micro-ondas", min_photos: 2 },
      { name: "Mobiliário e Pia", min_photos: 2 },
      { name: "Eletros e Utilidades", min_photos: 1 },
    ]
  }
];

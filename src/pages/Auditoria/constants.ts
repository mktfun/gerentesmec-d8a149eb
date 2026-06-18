// Schema Version for Cache Invalidation
export const SCHEMA_VERSION = 'v2_granular';

export const AUDIT_CATEGORIES = [
  {
    category_name: "Externo",
    items: [
      { name: "Fachada", min_photos: 1 },
      { name: "LED/Letreiro da Fachada", min_photos: 1 },
      { name: "Portão", min_photos: 1 },
      { name: "Pintura (Externa)", min_photos: 1 },
      { name: "Limpeza (Calçada)", min_photos: 1 },
      { name: "Banner", min_photos: 1 },
    ]
  },
  {
    category_name: "Recepção",
    items: [
      { name: "Balcão de Atendimento", min_photos: 1 },
      { name: "Gaveta", min_photos: 1 },
      { name: "Banner QR Code PIX", min_photos: 1 },
      { name: "TVs", min_photos: 1 },
      { name: "Som", min_photos: 1 },
      { name: "Sofás e Cadeiras", min_photos: 1 },
      { name: "Bebedouros", min_photos: 2 },
      { name: "Computador", min_photos: 1 },
      { name: "Monitor", min_photos: 1 },
      { name: "Impressora", min_photos: 1 },
      { name: "Tablet", min_photos: 1 },
      { name: "Telefone", min_photos: 1 },
      { name: "Ar Condicionado", min_photos: 1 },
      { name: "Lixeira", min_photos: 1 },
    ]
  },
  {
    category_name: "Sala Comercial",
    items: [
      { name: "Mesa", min_photos: 1 },
      { name: "Cadeira", min_photos: 1 },
      { name: "Armário", min_photos: 1 },
      { name: "TV", min_photos: 1 },
      { name: "Computador", min_photos: 1 },
      { name: "Celular", min_photos: 1 },
      { name: "Impressora", min_photos: 1 },
      { name: "Frigobar", min_photos: 1 },
      { name: "Ar Condicionado", min_photos: 1 },
      { name: "Cafeteira", min_photos: 1 },
      { name: "Moedor", min_photos: 1 },
      { name: "Tomadas da mesa", min_photos: 1 },
    ]
  },
  {
    category_name: "Loja/Pátio da Oficina",
    items: [
      { name: "Iluminação", min_photos: 2 },
      { name: "Telhado", min_photos: 1 },
      { name: "Calha", min_photos: 1 },
      { name: "Valeta", min_photos: 1 },
      { name: "Pintura", min_photos: 1 },
      { name: "Lixeiras", min_photos: 2 },
      { name: "Dispensa Produtos de Limpeza", min_photos: 1 },
      { name: "Tambores de descarte", min_photos: 1 },
      { name: "Tanque de óleo", min_photos: 1 },
      { name: "Extintores", min_photos: 2 },
      { name: "Dutos de Ar", min_photos: 1 },
      { name: "Ventiladores", min_photos: 4 },
      { name: "Compressor", min_photos: 1 },
      { name: "Prateleiras", min_photos: 2 },
      { name: "Mesa de Trabalho", min_photos: 1 },
      { name: "Armário dos Mecânicos", min_photos: 1 },
      { name: "Armário de Ferramentas", min_photos: 1 },
      { name: "Esmeril", min_photos: 1 },
      { name: "Elevadores", min_photos: 2 },
      { name: "Prensa Hidráulica", min_photos: 1 },
      { name: "Balanceadora", min_photos: 1 },
      { name: "Rampa de balanceamento", min_photos: 1 },
      { name: "Carrinho da rampa", min_photos: 1 },
      { name: "Alinhamento", min_photos: 1 },
      { name: "Desmontadora", min_photos: 1 },
      { name: "Cavalete", min_photos: 1 },
      { name: "Pistola de ar", min_photos: 2 },
      { name: "Teste de bico", min_photos: 1 },
      { name: "Calibrador", min_photos: 1 },
      { name: "Carrinhos de ferramentas", min_photos: 3 },
      { name: "Lâmpadas LED", min_photos: 5 },
    ]
  },
  {
    category_name: "Banheiros e Tanque",
    items: [
      { name: "Pia (Banheiro)", min_photos: 1 },
      { name: "Torneira (Banheiro)", min_photos: 1 },
      { name: "Fechadura da porta", min_photos: 1 },
      { name: "Lâmpada", min_photos: 1 },
      { name: "Tomadas", min_photos: 1 },
      { name: "Pia (Tanque)", min_photos: 1 },
      { name: "Torneira (Tanque)", min_photos: 1 },
      { name: "Área de lavar peça", min_photos: 1 },
    ]
  },
  {
    category_name: "Cozinha",
    items: [
      { name: "Geladeira (Dentro)", min_photos: 1 },
      { name: "Geladeira (Fora)", min_photos: 1 },
      { name: "Freezer", min_photos: 1 },
      { name: "Micro-ondas (Dentro)", min_photos: 1 },
      { name: "Micro-ondas (Fora)", min_photos: 1 },
      { name: "Mesa", min_photos: 1 },
      { name: "Cadeira", min_photos: 1 },
      { name: "Armário", min_photos: 1 },
      { name: "Pia", min_photos: 1 },
      { name: "Torneira", min_photos: 1 },
      { name: "Cafeteira", min_photos: 1 },
      { name: "Tomadas", min_photos: 1 },
      { name: "Lixo", min_photos: 1 },
    ]
  }
];

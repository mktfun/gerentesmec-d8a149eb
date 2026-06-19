// Schema Version for Cache Invalidation
export const SCHEMA_VERSION = 'v3_granular';

export interface AuditItemTemplate {
  name: string;
  min_photos: number;
  instruction?: string;
}

export interface AuditCategoryTemplate {
  category_name: string;
  items: AuditItemTemplate[];
}

export const AUDIT_CATEGORIES: AuditCategoryTemplate[] = [
  {
    category_name: "Externo",
    items: [
      { name: "Fachada", min_photos: 1, instruction: "Mostre a fachada inteira da loja a partir da calçada oposta." },
      { name: "LED/Letreiro da Fachada", min_photos: 1, instruction: "Foque no letreiro para comprovar que todas as letras estão acesas." },
      { name: "Portão", min_photos: 1, instruction: "Verifique o estado da pintura e se há amassados visíveis no portão." },
      { name: "Pintura (Externa)", min_photos: 1, instruction: "Mostre o estado geral da pintura das paredes externas." },
      { name: "Limpeza (Calçada)", min_photos: 1, instruction: "A foto deve comprovar se a calçada está varrida e sem lixo." },
      { name: "Banner", min_photos: 1, instruction: "Foque no banner para confirmar legibilidade e estado de conservação." },
    ]
  },
  {
    category_name: "Recepção",
    items: [
      { name: "Balcão de Atendimento", min_photos: 1, instruction: "Visão geral do balcão evidenciando organização e limpeza." },
      { name: "Gaveta", min_photos: 1, instruction: "Abra a gaveta de documentos para mostrar a organização interna." },
      { name: "Banner QR Code PIX", min_photos: 1, instruction: "Foto nítida do display do QR Code sobre o balcão." },
      { name: "TVs", min_photos: 1, instruction: "A foto deve mostrar a TV ligada e com a tela funcionando." },
      { name: "Som", min_photos: 1, instruction: "Mostre o equipamento de som do ambiente." },
      { name: "Sofás e Cadeiras", min_photos: 1, instruction: "Foque no assento para provar se há rasgos ou sujeira excessiva." },
      { name: "Bebedouros", min_photos: 2, instruction: "1 Foto frontal e 1 foto do ralo/bandeja para atestar limpeza." },
      { name: "Computador", min_photos: 1, instruction: "Foto da tela ligada mostrando a área de trabalho ou sistema da loja." },
      { name: "Monitor", min_photos: 1, instruction: "Visão da traseira e cabos do monitor." },
      { name: "Impressora", min_photos: 1, instruction: "Mostre a bandeja com papel e as luzes de painel acesas." },
      { name: "Tablet", min_photos: 1, instruction: "Tela ligada mostrando o app ou sistema." },
      { name: "Telefone", min_photos: 1, instruction: "Visão geral do aparelho sobre a mesa." },
      { name: "Ar Condicionado", min_photos: 1, instruction: "Foto do aparelho na parede (verifique luz ligada se aplicável)." },
      { name: "Lixeira", min_photos: 1, instruction: "Mostre o interior para comprovar o uso de saco de lixo." },
    ]
  },
  {
    category_name: "Loja/Pátio da Oficina",
    items: [
      { name: "Iluminação", min_photos: 2, instruction: "Tire 2 fotos em ângulos diferentes mostrando todas as luminárias." },
      { name: "Telhado", min_photos: 1, instruction: "Foque na estrutura para verificação de vazamentos ou danos visíveis." },
      { name: "Calha", min_photos: 1, instruction: "Mostre as descidas de água se não houver entupimentos visíveis." },
      { name: "Valeta", min_photos: 1, instruction: "Verifique o fundo da valeta para poças de óleo." },
      { name: "Pintura", min_photos: 1, instruction: "Foto geral da parede do pátio apontando desgastes." },
      { name: "Lixeiras", min_photos: 2, instruction: "Mostre o interior para comprovar o uso de saco de lixo padrão." },
      { name: "Dispensa Produtos de Limpeza", min_photos: 1, instruction: "Foto geral atestando se os produtos estão organizados." },
      { name: "Tambores de descarte", min_photos: 1, instruction: "Foto da área de tambores (não devem estar vazando)." },
      { name: "Tanque de óleo", min_photos: 1, instruction: "Foque na base do tanque para checar vazamentos." },
      { name: "Extintores", min_photos: 2, instruction: "A foto deve focar no manômetro, validade e lacre intacto." },
      { name: "Dutos de Ar", min_photos: 1, instruction: "Visão dos dutos para checar amassados ou vazamentos de ar." },
      { name: "Ventiladores", min_photos: 4, instruction: "Tire fotos que mostrem o estado das hélices e grades de proteção." },
      { name: "Compressor", min_photos: 1, instruction: "Mostre o compressor e o estado das mangueiras conectadas." },
      { name: "Prateleiras", min_photos: 2, instruction: "Visão das prateleiras para provar estoque alinhado e organizado." },
      { name: "Mesa de Trabalho", min_photos: 1, instruction: "Bancada deve estar sem excesso de peças ou lixo." },
      { name: "Armário dos Mecânicos", min_photos: 1, instruction: "Visão frontal dos armários." },
      { name: "Armário de Ferramentas", min_photos: 1, instruction: "Abra as portas e mostre a organização interna das chaves." },
      { name: "Esmeril", min_photos: 1, instruction: "Ateste se o botão de ligar/desligar e proteções estão íntegros." },
      { name: "Elevadores", min_photos: 2, instruction: "Foto das sapatas e braços do elevador." },
      { name: "Prensa Hidráulica", min_photos: 1, instruction: "Foto geral focada no manômetro e limpeza da base." },
      { name: "Balanceadora", min_photos: 1, instruction: "Tela ligada e painel em funcionamento." },
      { name: "Rampa de balanceamento", min_photos: 1, instruction: "Foto geral atestando a limpeza da prancha." },
      { name: "Carrinho da rampa", min_photos: 1, instruction: "Foque nas rodas do carrinho (não podem estar travadas/quebradas)." },
      { name: "Alinhamento", min_photos: 1, instruction: "Câmeras e cabeças de alinhamento em seus devidos suportes." },
      { name: "Desmontadora", min_photos: 1, instruction: "Mostre a unha e os pedais de acionamento." },
      { name: "Cavalete", min_photos: 1, instruction: "Cavalete posicionado de forma segura sem avarias estruturais." },
      { name: "Pistola de ar", min_photos: 2, instruction: "Pistola engatada, foque no conector." },
      { name: "Teste de bico", min_photos: 1, instruction: "Máquina com provetas limpas." },
      { name: "Calibrador", min_photos: 1, instruction: "Display ligado e legível." },
      { name: "Carrinhos de ferramentas", min_photos: 3, instruction: "Abra as gavetas principais para mostrar a organização das chaves e se faltam moldes." },
      { name: "Lâmpadas LED", min_photos: 5, instruction: "Foque individualmente em 5 pontos críticos de iluminação do pátio." },
    ]
  },
  {
    category_name: "Banheiro Clientes (Feminino)",
    items: [
      { name: "Pia", min_photos: 1, instruction: "Mostre a limpeza da cuba e bancada." },
      { name: "Torneira", min_photos: 1, instruction: "A foto deve mostrar a torneira aberta com fluxo normal." },
      { name: "Vaso", min_photos: 1, instruction: "Levante a tampa e comprove o asseio do vaso sanitário." },
      { name: "Lâmpada", min_photos: 1, instruction: "Tire a foto da lâmpada acesa." },
      { name: "Fechadura", min_photos: 1, instruction: "Foto de perto do trinco/fechadura intacto." },
      { name: "Lixeira", min_photos: 1, instruction: "Mostre o interior para comprovar o uso de saco de lixo." },
    ]
  },
  {
    category_name: "Banheiro Clientes (Masculino)",
    items: [
      { name: "Pia", min_photos: 1, instruction: "Mostre a limpeza da cuba e bancada." },
      { name: "Torneira", min_photos: 1, instruction: "A foto deve mostrar a torneira aberta com fluxo normal." },
      { name: "Vaso / Mictório", min_photos: 1, instruction: "Comprove o asseio do mictório ou vaso sanitário." },
      { name: "Lâmpada", min_photos: 1, instruction: "Tire a foto da lâmpada acesa." },
      { name: "Fechadura", min_photos: 1, instruction: "Foto de perto do trinco/fechadura intacto." },
      { name: "Lixeira", min_photos: 1, instruction: "Mostre o interior para comprovar o uso de saco de lixo." },
    ]
  },
  {
    category_name: "Banheiro dos Mecânicos",
    items: [
      { name: "Pia", min_photos: 1, instruction: "Mostre a limpeza da cuba e ausência de crostas pesadas." },
      { name: "Torneira", min_photos: 1, instruction: "A foto deve mostrar a torneira aberta com fluxo normal." },
      { name: "Vaso / Mictório", min_photos: 1, instruction: "Comprove o asseio sanitário mínimo exigido." },
      { name: "Lâmpada", min_photos: 1, instruction: "Tire a foto da lâmpada acesa." },
      { name: "Fechadura", min_photos: 1, instruction: "Foto de perto do trinco/fechadura intacto." },
      { name: "Lixeira", min_photos: 1, instruction: "Mostre o interior para comprovar o uso de saco de lixo." },
    ]
  },
  {
    category_name: "Área de Lavagem (Tanque)",
    items: [
      { name: "Pia / Cuba", min_photos: 1, instruction: "Foto focada no ralo provando que não há entupimento por estopa ou peças." },
      { name: "Torneira", min_photos: 1, instruction: "Mostre o jato de água contínuo (torneira sem vazamentos na base)." },
      { name: "Visão da área de lavar peça", min_photos: 1, instruction: "Abra o ângulo e mostre o piso e as paredes ao redor do tanque." },
    ]
  },
  {
    category_name: "Cozinha",
    items: [
      { name: "Pia", min_photos: 1, instruction: "Pia deve estar sem louça suja acumulada." },
      { name: "Torneira", min_photos: 1, instruction: "Mostre fluxo d'água sem vazamentos na base." },
      { name: "Geladeira (Dentro)", min_photos: 1, instruction: "Abra a porta e mostre as prateleiras internas e ausência de lixo perecível abandonado." },
      { name: "Geladeira (Fora)", min_photos: 1, instruction: "Foto da porta e laterais para comprovar estado." },
      { name: "Mesa", min_photos: 1, instruction: "Mesa de refeição limpa." },
      { name: "Cadeira", min_photos: 1, instruction: "Mostre cadeiras alinhadas e sem estofados rasgados." },
      { name: "Lixeira", min_photos: 1, instruction: "Mostre o interior para comprovar o uso de saco de lixo e tampa funcional." },
      { name: "Lâmpada", min_photos: 1, instruction: "Tire a foto da lâmpada acesa iluminando o cômodo." },
      { name: "Tomadas", min_photos: 1, instruction: "Aponte as tomadas para provar se não há espelhos quebrados ou fiação exposta." },
    ]
  }
];

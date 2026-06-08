export interface ChecklistItem {
  id: string;
  category: string;
  name: string;
  description: string;
}

export const CHECKLIST_TEMPLATE: ChecklistItem[] = [
  // 1. Recepção e Conforto do Cliente
  {
    id: 'rec_fachada',
    category: 'Recepção e Conforto do Cliente',
    name: 'Fachada da Unidade',
    description: 'Limpeza, letreiro inteiro e sem lixo na porta.',
  },
  {
    id: 'rec_sofas',
    category: 'Recepção e Conforto do Cliente',
    name: 'Sofás/Poltronas',
    description: 'Tirar foto geral do estado e limpeza.',
  },
  {
    id: 'rec_bebedouro',
    category: 'Recepção e Conforto do Cliente',
    name: 'Bebedouro e Café',
    description: 'Foto dos copos abastecidos e área limpa.',
  },
  {
    id: 'rec_climatizacao',
    category: 'Recepção e Conforto do Cliente',
    name: 'Climatização e TV',
    description: 'Foto mostrando os equipamentos ligados e ambiente organizado.',
  },
  {
    id: 'rec_banheiro',
    category: 'Recepção e Conforto do Cliente',
    name: 'Banheiro de Clientes',
    description: 'Foto da pia limpa e espelho, provando que há insumos (papel/sabonete).',
  },

  // 2. Área de Vivência (Copa/Cozinha e Banheiro dos Funcionários)
  {
    id: 'viv_geladeira',
    category: 'Área de Vivência',
    name: 'Geladeira',
    description: 'Foto do interior (checar se não há marmita velha/sujeira).',
  },
  {
    id: 'viv_microondas',
    category: 'Área de Vivência',
    name: 'Micro-ondas',
    description: 'Foto do interior aberto (checar respingos).',
  },
  {
    id: 'viv_pia',
    category: 'Área de Vivência',
    name: 'Pia e Mesas',
    description: 'Foto provando ausência de louça acumulada.',
  },
  {
    id: 'viv_banheiro',
    category: 'Área de Vivência',
    name: 'Banheiro dos Funcionários',
    description: 'Foto do estado geral (vaso e lixeiras).',
  },

  // 3. Oficina (Infraestrutura e Limpeza)
  {
    id: 'ofi_piso',
    category: 'Oficina (Infraestrutura e Limpeza)',
    name: 'Piso do Pátio',
    description: 'Foto ampla do galpão mostrando a limpeza geral.',
  },
  {
    id: 'ofi_elevadores',
    category: 'Oficina (Infraestrutura e Limpeza)',
    name: 'Elevadores Automotivos',
    description: 'Foto de cada elevador (checar se não há manchas de óleo na base).',
  },
  {
    id: 'ofi_bancadas',
    category: 'Oficina (Infraestrutura e Limpeza)',
    name: 'Bancadas de Trabalho',
    description: 'Foto comprovando desobstrução e organização.',
  },
  {
    id: 'ofi_residuos',
    category: 'Oficina (Infraestrutura e Limpeza)',
    name: 'Descarte de Resíduos',
    description: 'Foto dos tambores de óleo e área de sucata organizados.',
  },
  {
    id: 'ofi_extintores',
    category: 'Oficina (Infraestrutura e Limpeza)',
    name: 'Extintores',
    description: 'Foto mostrando acesso livre e lacre.',
  },

  // 4. Ferramental e Equipamentos de Diagnóstico
  {
    id: 'fer_scanners',
    category: 'Ferramental e Equipamentos',
    name: 'Scanners',
    description: 'Foto do estojo aberto com o scanner e cabos guardados.',
  },
  {
    id: 'fer_carrinhos',
    category: 'Ferramental e Equipamentos',
    name: 'Carrinhos de Ferramentas',
    description: 'Foto das gavetas principais abertas (para provar que as chaves estão lá e organizadas).',
  },
  {
    id: 'fer_apoio',
    category: 'Ferramental e Equipamentos',
    name: 'Equipamentos de Apoio',
    description: 'Foto dos macacos jacaré, cavaletes e girafas em seu local de guarda.',
  },
];

const ids = [244, 228, 273];
const falhas_all = [
  "Faltou ser cordial/respeitoso (-8)",
  "Faltou registrar resumo do acordado (-10)",
  "Faltou enviar link do checklist (-8)",
  "Faltou enviar vídeo do defeito (-10)",
  "Faltou enviar link do orçamento (-8)",
  "Faltou explicar consequências (-9)",
  "Faltou obter aprovação explícita (-10)",
  "Faltou checklist complementar (-8)",
  "Faltou vídeo do extra (-8)",
  "Faltou explicar serviços extras (-8)",
  "Faltou agradecimento padrão (-5)",
  "Faltou pedir avaliação no Google (-8)"
];
const result = ids.map(id => ({
  id,
  score: 0,
  falhas: falhas_all
}));
console.log(JSON.stringify(result, null, 2));

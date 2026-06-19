# Tasks: Layout Carousel Imersivo (Spec 055)

- [ ] Criar `src/components/Auditoria/AuditoriaItemCard.tsx`:
  - Fundo dinâmico borrado (`backdrop-blur`) usando as fotos tiradas.
  - Botão gigante de Câmera central (caso vazio) em vez do `CameraCapture` genérico.
  - Botões inferiores gigantes (Conforme, Inconforme, N/A).
  - Usar Lightbox (`react-medium-image-zoom`) se tiver múltiplas fotos e usuário clicar.
- [ ] Refatorar `src/pages/Auditoria/index.tsx`:
  - Calcular o `totalItems` achatando as categorias.
  - Estado `currentGlobalIndex` em vez de step de categorias.
  - Ocultar o Header/Stepper antigo e usar uma Navbar minimalista + Barra de Progresso (`Etapa X de Y`).
  - No `currentGlobalIndex === totalItems`, mostrar a Tela Final de Resumo (Checkout) com o botão Sincronizar.
- [ ] Rodar o build para validar ausência de bugs.

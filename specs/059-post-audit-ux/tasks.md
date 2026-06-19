# Tasks: Polimento de UX (Spec 059)

- [ ] Corrigir `tailwind.config.ts`:
  - Injetar o keyframe `gradientShift`.
  - Injetar a animation `gradient-shift`.
- [ ] Atualizar `src/pages/Auditoria/index.tsx`:
  - Adicionar state `isSuccess` que é marcado como `true` após o sucesso do `handleSync`.
  - Importar `useNavigate` do `react-router-dom`.
  - Na tela final (checkoutPhase), renderizar:
    - Se `isSuccess`: Botão verde brilhante "Ver Histórico de Auditorias" que chama `navigate('/historico-auditorias')`.
    - No `useEffect`, setar um timeout de 5s para rodar o mesmo `navigate('/historico-auditorias')` caso `isSuccess` vire true.
- [ ] Rodar o build para validar que as animações processaram e as rotas estão corretas.

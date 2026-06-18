# Global Constraints

- **Tolerância Zero para Fraudes**: O aplicativo de auditoria deve bloquear upload de galeria (input file restrito à câmera nativa `capture="environment"`).
- **Metadados Invioláveis**: Horário UTC, Data, Usuário e Lat/Long devem ser registrados no background de cada ação de checklist e foto, sem possibilidade de edição.
- **Validação Rigorosa (All-or-Nothing)**: O botão de Sincronizar só pode ser habilitado se 100% da árvore de inspeção estiver preenchida. Submissões parciais são proibidas.
- **Offline-First**: Uso de localForage / IndexedDB para armazenar as fotos em Base64/Blob localmente junto com os metadados JSON antes de despachar.
- **N/A Documentado**: Opções marcadas como "Não se aplica" exigem uma foto geral do ambiente para atestar a ausência do item.

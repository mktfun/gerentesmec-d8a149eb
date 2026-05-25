# Design & UI/UX

## Correção da Tipografia
A instrução de usar fontes muito grandes (`text-[8rem]`) estourou limites de grid em telas não-4K.
Vamos usar classes padronizadas do Tailwind, limitando o crescimento máximo e adicionando breakpoints:
- Em vez de `text-[8rem]`, utilizaremos `text-7xl md:text-8xl lg:text-9xl` acompanhado de `tracking-tighter`.
- Ajustar os espaçamentos internos dos cartões (`p-10` pode estar muito grande em telas menores, vamos usar `p-6 lg:p-10`).
- O gráfico circular do Score Global no painel Executivo estava com `scale-150`, o que pode causar overflow. Vamos aumentar o tamanho base do SVG em vez de escalar por CSS, garantindo que caiba no contêiner.

## Acesso pela Sidebar
Na `Sidebar.tsx`, vamos adicionar um novo grupo "Dashboards de TV":
- **Ícone de TV (MonitorPlay)** para o grupo.
- Dois links estilizados como botões sutis ("TV Operacional" e "TV Executivo") na parte inferior da sidebar (perto de Configurações), com atributo `target="_blank"` para não fechar o CRM da tela atual.

## Cores e Contrastes
As cores de fundo das telas de TV serão ajustadas. O vermelho (`rose-600/20`) estava muito escuro e com baixo contraste em monitores de TV ruins. Vamos clarear a tipografia para `text-rose-400` e aumentar a opacidade dos textos secundários para evitar perda de legibilidade (de `text-white/30` para `text-white/60`).

# Revisão responsiva — filtros e densidade

Issue: #19  
Branch: `ux/p2-responsive-filters`

## Objetivo da revisão

Reduzir carga cognitiva e evitar que ações essenciais dependam de rolagem horizontal ou textos operacionais de 9–10 px.

## Matriz de comportamento

| Cenário | Comportamento protegido |
| --- | --- |
| 1366 / notebook | Período, Turma, Professor e Busca ficam no primeiro nível; Etapa e Oferta/Matriz ficam em **Mais filtros**. |
| 1024 px | Filtros principais reorganizam em duas linhas; busca ocupa a linha inferior; botão Limpar continua explícito. |
| 768 px | Alvos interativos passam a no mínimo 40 px; filtros se reorganizam sem barra horizontal; tabelas semanais removem colunas secundárias. |
| 490 px | Campos principais empilham progressivamente; alvos de toque chegam a 44 px; textos operacionais sobem para pelo menos 11–11,5 px. |
| 390 px | Chips de filtros ativos ocupam largura disponível; ações do topo podem quebrar linha; navegação principal permanece em grade. |
| Zoom 200% | A redução efetiva do viewport aciona os breakpoints de 1040/800/600 px, fazendo os controles quebrarem linha em vez de exigir largura fixa. |
| Reduced motion | A regra global `prefers-reduced-motion: reduce` permanece preservada. |

## Priorização de tabelas no mobile

Quando a tabela continua larga, são ocultadas apenas colunas secundárias em telas estreitas:

- histórico semanal: registros, dias avaliados e horário de importação;
- diário abaixo do mínimo: previsto bruto e percentual;
- diário sem base: coluna “Antes”.

Permanecem visíveis os identificadores, estado atual, valores acionáveis e ações.

## Filtros ativos

Filtros não padrão aparecem como chips removíveis individualmente:

- etapa;
- oferta/matriz;
- turma;
- professor;
- busca.

A remoção de um chip não executa um “limpar tudo”; as dependências são novamente validadas pelo mesmo `syncFilterOptions()`.

## Acessibilidade estrutural

- `<details>/<summary>` nativo para **Mais filtros**;
- foco visível reforçado em botões, summary, inputs, selects, textarea e regiões de tabela;
- alvos de toque ampliados nos breakpoints móveis;
- `aria-label` em cada chip removível;
- menu principal continua sem overflow horizontal.

## Evidência automatizada

`tests/responsive-filters.js` protege a arquitetura acima e integra `npm test`.

> Esta revisão documenta os comportamentos responsivos codificados e testáveis. Capturas visuais de navegador não são produzidas pelo GitHub Actions atual.

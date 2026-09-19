# Plano Operacional de UX — DED em Foco

Este documento consolida a trilha de melhorias de UX/UI e Arquitetura da Informação do DED em Foco.

## Status de execução

**Trilha #12–#20 concluída em 19/09/2026.**

Checkpoint funcional consolidado em `main`:
`152d76141da6214f5a42addec2c145cf768055d1`

- [x] #12 — Importações seguras
- [x] #13 — Feedback, erros persistentes e restauração
- [x] #14 — Navegação por tarefa
- [x] #15 — Central de Atenção da EEB
- [x] #16 — Período e atualidade dos dados
- [x] #17 — Histórico semanal navegável
- [x] #18 — Diários sem base suficiente
- [x] #19 — Filtros, mobile e tipografia
- [x] #20 — Rastreabilidade de calendário e referências

A Issue #1 permanece como trilha metodológica/curricular independente e **não é encerrada por esta reestruturação de UX**.

## Fonte de verdade desta trilha

- Épico: #6
- Auditoria curricular/metodológica: #1
- Branch-base de implementação: `main`

## Ordem executada

### Etapa 1 — Segurança operacional

#### ✅ #12 — Importações seguras
Branch sugerida: `ux/p0-safe-imports`

Objetivo:
- impedir substituição silenciosa de T1/T2;
- impedir substituição silenciosa de snapshot semanal;
- criar prévia;
- criar ponto de restauração;
- permitir desfazer.

Gate:
- só avançar quando nenhuma importação crítica alterar dados sem confirmação.

#### ✅ #13 — Feedback, erros persistentes e restauração
Branch sugerida: `ux/p1-processing-recovery`

Depende de #12.

Objetivo:
- estados visuais de processamento;
- impedir duplo clique/importação duplicada;
- erros persistentes;
- restaurar backups com validação e prévia.

Gate:
- operações de dados precisam ter começo, processamento, resultado e recuperação visíveis.

---

### Etapa 2 — Arquitetura da informação

#### ✅ #14 — Navegação por tarefa
Branch sugerida: `ux/p1-navigation-ia`

Arquitetura-alvo:
1. Visão geral
2. Acompanhamento
3. 3º trimestre
4. Dados
5. Configurações

Mudanças:
- Professores, Turmas, Notas e Pendências viram subáreas de Acompanhamento;
- Comparar turmas vira ação contextual dentro de Turmas;
- Consolidado 1º + 2º deixa de ser destino principal e passa a ser período/visão;
- Atualizar planilhas passa a Dados;
- Calendário/Matriz passa a Configurações.

Gate:
- nenhuma função atual pode desaparecer;
- navegação mobile não pode depender de descobrir itens por rolagem horizontal.

#### ✅ #15 — Central de Atenção da EEB
Branch sugerida: `ux/p1-attention-center`

Depende preferencialmente de #14.

Pergunta central:
> Onde preciso atuar agora?

Categorias:
- acompanhamento semanal;
- fechamento;
- notas;
- referências incompletas;
- integridade dos dados.

Gate:
- cada cartão precisa levar ao recorte correspondente;
- nenhuma categoria pode misturar conceitos;
- não criar ranking docente.

#### ✅ #16 — Período e atualidade dos dados
Branch sugerida: `ux/p1-data-freshness-period`

Objetivo:
- distinguir claramente acumulado de semanal;
- mostrar última leitura;
- remover estado inicial fixo no 2º trimestre;
- tratar consolidado como período.

Exemplos esperados:
- `3º trimestre — acumulado até 18/09/2026`
- `Semana 10/09/2026 → 18/09/2026 — novos lançamentos`

Gate:
- nenhum KPI semanal pode aparecer sem intervalo explícito.

---

### Etapa 3 — Rotina semanal

#### ✅ #17 — Histórico semanal navegável
Branch sugerida: `ux/p1-weekly-history`

Depende de #12.

Objetivo:
- abrir semanas anteriores;
- imprimir/exportar o snapshot selecionado;
- corrigir data;
- substituir arquivo;
- excluir snapshot;
- recalcular intervalos afetados.

Gate:
- qualquer mudança num snapshot intermediário precisa mostrar impacto antes de aplicar.

#### ✅ #18 — Diários sem base suficiente
Branch sugerida: `ux/p1-weekly-unassessed`

Objetivo:
- mostrar simultaneamente diário abaixo de 80% e diário sem base;
- impedir que “sem base” seja tratado como zero;
- refletir isso também na impressão.

Gate:
- um professor só aparece como regular quando todos os diários avaliáveis atendem ao critério e não há base incompleta relevante.

---

### Etapa 4 — Refinamento

#### ✅ #19 — Filtros, mobile e tipografia
Branch sugerida: `ux/p2-responsive-filters`

Preferencialmente após #14.

Objetivo:
- reduzir filtros expostos simultaneamente;
- usar “Mais filtros”;
- evidenciar filtros ativos;
- melhorar mobile;
- elevar legibilidade de textos operacionais.

Gate visual:
- 390 px
- 768 px
- 1024/1366 px
- zoom 200%
- teclado
- prefers-reduced-motion

#### ✅ #20 — Rastreabilidade de calendário e referências
Branch sugerida: `ux/p2-reference-auditability`

Relacionado à #1.

Objetivo:
- motivo e fonte para ajustes de calendário;
- motivo e fonte para carga semanal ajustada;
- preservar valor original;
- permitir restauração da referência original;
- exportar rastreabilidade junto aos parâmetros.

Gate:
- ajuste local nunca pode parecer fonte oficial.

---

## Regras de implementação

Cada issue deve ser implementada isoladamente.

Fluxo padrão:

1. atualizar `main`;
2. criar a branch indicada;
3. implementar somente o escopo da issue;
4. manter funções novas modularizadas;
5. executar `npm test`;
6. testar manualmente os cenários da issue;
7. revisar desktop e mobile quando houver UI;
8. registrar evidências;
9. abrir PR com `Closes #<issue>`;
10. revisar regressões metodológicas antes do merge.

## Regras metodológicas que nenhuma issue pode alterar

- diferença entre previsto e registrado é alerta de conferência, não prova de aula não ministrada;
- não inferir carga sem fonte documental válida;
- pontuação agregada não equivale a quantidade de estudantes;
- um diário abaixo de 80% não é compensado por outro acima;
- “sem base” nunca deve ser convertido em zero;
- dados identificáveis não devem ser publicados no repositório público.

## Ordem executada

1. #12
2. #13
3. #14
4. #15
5. #16
6. #17
7. #18
8. #19
9. #20

## Gate final da trilha

Status consolidado:

- [x] importações seguras e reversíveis;
- [x] erros importantes persistentes e acionáveis;
- [x] navegação organizada por tarefa;
- [x] Visão Geral responde “onde atuar agora?”;
- [x] acumulado e semanal semanticamente distintos;
- [x] atualidade dos dados visível;
- [x] histórico semanal consultável;
- [x] insuficiência de base explícita;
- [x] filtros e mobile simplificados;
- [x] ajustes de calendário/matriz rastreáveis;
- [x] regressões funcionais e metodológicas verdes.

### Evidência de encerramento

O gate mais recente da trilha foi executado no PR da #20:

- workflow: **DED regression**;
- run: **#33**;
- resultado: **SUCCESS**;
- incluiu regressões curriculares, backup/restauração, navegação, Central de Atenção, contexto temporal, histórico semanal, insuficiência de base, filtros responsivos e rastreabilidade de referências.

O encerramento desta trilha não declara resolvidos os gates documentais ainda abertos na Issue #1.

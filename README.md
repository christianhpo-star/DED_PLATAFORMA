# DED Plataforma

Repositório-matriz do **DED em Foco**, ferramenta local/offline de acompanhamento pedagógico dos Relatórios de Lançamentos do Professor da SEE/MG.

## Objetivo

Transformar os relatórios do DED em instrumentos de conferência para EEB/gestão, preservando a diferença entre:

- aulas previstas/referenciadas;
- aulas registradas no DED;
- fechamento de diários;
- lançamento de notas;
- alertas para conferência;
- conclusão pedagógica, que nunca deve ser inferida automaticamente apenas por uma diferença numérica.

## Regra metodológica central

**Diferença entre previsto e registrado é um alerta para conferência, não prova de aula não ministrada.**

Toda previsão precisa guardar sua fonte e seu nível de confiança. Componentes sem referência documental válida permanecem como `sem referência documental`; não recebem carga inferida por analogia.

## Estrutura

- `docs/auditoria/` — decisões metodológicas, calendário, matrizes e histórico de correções.
- `docs/fontes/` — mapa das fontes normativas/documentais usadas.
- `src/` — código genérico do painel, sem dados identificáveis de escola.
- `instances/` — **não versionado**; reservado para cópias locais de escolas.

## Dados e privacidade

Este repositório é público. Não devem ser versionados:

- planilhas `.xlsx/.xls/.csv` com dados escolares;
- cópias HTML preenchidas;
- nomes de docentes ou estudantes;
- códigos de turma/escola associados a dados internos;
- exportações e backups locais.

Cada escola deve usar o código genérico e carregar seus dados localmente no navegador.

## Situação da auditoria 2026

A revisão curricular em andamento separa, no mínimo:

1. Ensino Médio Regular noturno;
2. EMTI Profissional — coorte/matriz aplicável;
3. Formação Geral Básica e atividades integradoras;
4. Formação Técnica Específica, que só recebe carga por componente quando houver documento técnico aplicável, grade oficial do parceiro ou horário homologado.

Para as turmas técnicas iniciadas em 2025, não se aplica automaticamente a matriz de entrada de 2026. O cenário antigo de aproximadamente `-110 aulas`, produzido por hipótese de carga técnica sem fonte documental suficiente, não é tratado como déficit confirmado.

## Acompanhamento

A migração e as correções de 2026 estão registradas na Issue #1 deste repositório.

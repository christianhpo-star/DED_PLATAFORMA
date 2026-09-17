# 04 — Histórico da auditoria DED em Foco

Data: 17/09/2026.

## Passo 1 — separar projetos

O trabalho do DED em Foco havia sido documentado por engano no repositório `christianhpo-star/Hilton_rocha`, que pertence a outro projeto.

O repositório correto passa a ser:

`christianhpo-star/DED_PLATAFORMA`

O PR antigo do repositório Hilton Rocha deve ser encerrado somente após a conferência de que todo o conteúdo necessário foi migrado.

## Passo 2 — separar modalidade, oferta e coorte

Confirmado que um cálculo confiável não pode usar uma única matriz para:

- Ensino Médio Regular noturno;
- EMTI Profissional;
- coortes técnicas iniciadas em anos distintos;
- Formação Geral/Atividades Integradoras e Formação Técnica Específica.

## Passo 3 — corrigir a escolha da matriz

Critério final:

> usar a matriz oficialmente aplicável à oferta **e à trajetória/coorte** da turma.

A Resolução SEE nº 5.212/2025 organiza as matrizes de 2026, mas a orientação complementar do Memorando-Circular nº 326/2025/SEE/SB preserva as matrizes dos cursos técnicos iniciados em 2024/2025 e aplica as novas matrizes do EMTI Profissional às turmas de entrada em 2026.

## Passo 4 — investigar o saldo aproximado de -110

O saldo foi matematicamente reproduzido ao atribuir uma carga hipotética de 6 A/S + 6 A/S a dois componentes técnicos.

A reprodução do número não valida a hipótese curricular.

## Passo 5 — conferir a matriz oficial 2026 dos cursos

A inspeção da Resolução SEE nº 5.212/2025 confirmou:

- Anexo LXXXV — Fabricação Mecânica;
- Anexo XC — Sistemas de Energia Renovável.

Nos dois casos, o bloco de Formação Técnica Específica não discrimina componentes/cargas. Portanto, a versão anterior do painel não podia usar esses anexos para preencher automaticamente componentes técnicos específicos.

## Passo 6 — bloquear previsão técnica sem fonte

Para a coorte Trilhas/SENAI iniciada em 2025, componentes técnicos do 2º ano permanecem `sem referência documental` até recuperação da grade/matriz/plano aplicável ou do horário homologado.

Esses componentes:

- continuam visíveis com seus lançamentos registrados;
- não recebem previsão inventada;
- não entram em percentuais de atingimento dependentes da previsão;
- não geram déficit automático.

## Passo 7 — revisar o calendário

A Resolução SEE nº 5.222/2025 fixa os trimestres de 2026 e exige compatibilização do calendário com eventos municipais.

Para Belo Horizonte, 08/12/2026 é feriado municipal. O painel deve usar a data de recomposição homologada pela escola/SRE; não pode escolher uma reposição automaticamente.

## Passo 8 — preservar a regra de responsabilidade docente

No consolidado T1 + T2:

- `turma + componente` é um único diário lógico;
- troca de professor entre trimestres acumula os registros e exibe o responsável atual do T2;
- duplicidade idêntica não é somada duas vezes;
- dois nomes simultâneos no período atual permanecem `A confirmar`.

## Passo 9 — proteção de dados

`DED_PLATAFORMA` é público. O repositório deve conter somente:

- código genérico;
- metodologia;
- regras de processamento;
- documentação normativa;
- testes sintéticos/anonimizados.

Não versionar planilhas escolares nem HTML preenchido com dados identificáveis.

## Passo 10 — próximos gates

1. recuperar a documentação técnica da coorte TFE/SENAI 2025 para Fabricação Mecânica e Sistemas de Energia Renovável;
2. registrar a recomposição de 08/12 a partir do calendário homologado da unidade;
3. migrar/sanitizar o código genérico do painel para `src/`;
4. criar testes de regressão para impedir retorno de previsões inferidas sem fonte;
5. validar as regras de importação e consolidação antes de publicar uma versão estável.

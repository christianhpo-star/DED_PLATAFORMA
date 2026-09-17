# 03 — Auditoria das turmas técnicas

Data da revisão: 17/09/2026.

## Problema investigado

A versão anterior do painel chegou a apresentar diferença de aproximadamente **-110 aulas** em componentes técnicos do 2º ano de Sistemas de Energia Renovável.

A causa metodológica foi isolada: o cálculo usava uma hipótese de carga semanal técnica sem documento suficiente para comprovar aquela distribuição por componente.

## O cenário matemático

Se `Sistemas de Energia Renovável III` e `IV` forem artificialmente definidos como 6 A/S cada, o cálculo reproduz um saldo consolidado próximo do observado na auditoria.

Isso prova apenas que a hipótese **reproduz o número**. Não prova que 6+6 A/S seja a matriz correta.

## O que a Resolução SEE nº 5.212/2025 mostra

A resolução oficial de 2026 contém:

- **Anexo LXXXV** — EMTI Profissional, Técnico em Fabricação Mecânica;
- **Anexo XC** — EMTI Profissional, Técnico em Sistemas de Energia Renovável.

Nos dois anexos, a Formação Geral Básica e as Atividades Integradoras possuem distribuição registrada, enquanto o bloco **Formação Técnica Específica** não apresenta componentes/cargas discriminados.

Fonte oficial:
https://www.educacao.mg.gov.br/wp-content/uploads/2025/11/Resolucao-SEE-no-5.212_2025.pdf

Portanto, a resolução 2026 não fornece base para preencher automaticamente `Fabricação Mecânica III/IV` ou `Sistemas de Energia Renovável III/IV`.

## Continuidade da coorte 2025

O Trilhas de Futuro nas Escolas foi lançado para estudantes ingressantes no 1º ano do EMTI em 2025, em parceria com o SENAI.

Fonte SEE/MG:
https://www.educacao.mg.gov.br/governo-de-minas-lanca-trilhas-de-futuro-nas-escolas-com-96-mil-vagas-em-cursos-de-alta-tecnologia/

A orientação complementar registrada no Memorando-Circular nº 326/2025/SEE/SB determina a continuidade das matrizes de Educação Profissional iniciadas em 2024/2025. Assim, a coorte 2025, hoje no 2º ano em 2026, exige a referência técnica adotada no início de sua trajetória — não a distribuição nova da entrada 2026.

## Regra corrigida

Para turmas de 2º ano do Trilhas/SENAI iniciadas em 2025:

1. não aplicar automaticamente o anexo de entrada 2026;
2. não inferir A/S técnico por analogia;
3. não transformar o volume de aulas registradas no DED em suposta matriz;
4. buscar a matriz/grade/plano técnico aplicável à coorte 2025 ou o horário homologado;
5. enquanto a fonte não for encontrada, mostrar `sem referência documental`;
6. excluir esses componentes de percentuais e alertas que dependam de uma previsão numérica;
7. manter o valor registrado no DED visível, mas sem rotulá-lo como abaixo/acima da previsão.

## Controle global

O total de jornada pode ser usado como **controle de integridade**, desde que a fonte seja aplicável à coorte, mas não pode ser redistribuído automaticamente por componente.

Um saldo global serve para indicar que a organização da turma precisa ser conferida. Ele não identifica, sozinho, qual componente ou professor gerou a diferença.

## Consolidação de docentes

No consolidado T1 + T2:

- `turma + componente` representa um único diário lógico;
- se o professor mudou entre os trimestres, as aulas são acumuladas;
- o responsável exibido é o professor atual do T2;
- duplicidades idênticas dentro do mesmo período não são somadas duas vezes;
- se o relatório atual traz dois responsáveis simultâneos para o mesmo diário lógico, o total é contado uma única vez e a responsabilidade fica `A confirmar`.

## Gate documental

Para reativar previsão técnica por componente no 2º ano, localizar um dos seguintes documentos aplicáveis à coorte 2025:

- matriz/grade oficial TFE/SENAI;
- plano de curso com distribuição por período/módulo;
- documento institucional equivalente do parceiro;
- horário homologado da turma que permita reconstrução documentada da carga.

Até esse gate ser cumprido, **não existe déficit técnico confirmado por componente**.

# Monitoramento semanal do DED — 3º trimestre

## Objetivo

Permitir que a EEB importe semanalmente o Relatório de Lançamentos do Professor do 3º trimestre e verifique, por diário, se os lançamentos do período atingiram pelo menos 80% da referência esperada.

Este documento descreve somente a regra funcional genérica. Dados identificáveis de escola, turma codificada ou pessoas não devem ser versionados.

## Primeira importação

A primeira planilha do 3º trimestre é comparada com base zero desde o início do 3º trimestre, em **10/09/2026**, até a data de referência escolhida. A primeira execução já produz o relatório semanal.

## Importações seguintes

Cada nova planilha é cumulativa. Para cada diário lógico:

`lançado no período = total atual no DED - total da extração anterior`

O diário lógico continua sendo identificado por turma + componente.

## Previsão do período

`previsto = aulas semanais × dias letivos do intervalo ÷ 5`

Feriados e dias removidos do calendário reduzem os dias efetivos. Recomposições cadastradas aumentam os dias efetivos. A carga semanal da matriz não deve ser alterada para representar feriado, reposição ou compensação.

## Critério de 80%

`mínimo = teto(previsto × 0,80)`

Exemplos em uma semana de cinco dias: 5 A/S → 4; 4 A/S → 4; 3 A/S → 3; 2 A/S → 2; 1 A/S → 1.

Em um intervalo com quatro dias letivos, 5 A/S resultam em previsto 4 e mínimo 4.

## Regra por professor

Não há compensação entre turmas ou componentes. Um professor entra na lista **Abaixo do mínimo de 80%** quando pelo menos um de seus diários avaliáveis fica abaixo do mínimo.

Abaixo do nome são exibidos somente os diários que não atingiram 80%, com turma, componente, previsto, mínimo, lançado, percentual e quantidade que falta para o mínimo.

Se houver diário sem carga semanal ou sem quantidade comparável, o professor não deve ser classificado automaticamente como regular apenas com base nos demais.

## Impressão

O acompanhamento oferece resumo semanal, impressão individual e impressão em lote. Na impressão em lote, cada professor é renderizado em uma página separada. A folha individual não inclui informações de outros professores.

## Limite interpretativo

O monitoramento mede atualização de registros no DED entre extrações. Ficar abaixo do mínimo indica necessidade de conferência do lançamento; isoladamente, não comprova que aulas deixaram de ser ministradas.

# 03 — Auditoria das turmas técnicas de 2º ano

Data da revisão: 17/09/2026.

## Problema investigado

Foi observado saldo de aproximadamente **-110 aulas** no 2º ano de Sistemas de Energia Renovável. A auditoria reproduziu a origem do número: uma regra local havia assumido, sem documento comprobatório, 6 A/S para `Sistemas de Energia Renovável III` e 6 A/S para `IV`.

Com 66 dias no T1, essa hipótese produz 158 previstas para III+IV contra 62 registradas: -96. Com 68 dias no T2, produz 164 previstas contra 150 registradas: -14. Somadas: **-110**.

A hipótese foi removida. O -110 não é evidência de 110 aulas não ministradas; é artefato de uma referência curricular não documentada.

## Nova fonte normativa: Resolução SEE nº 5.146/2025

A Resolução SEE nº 5.146/2025, que organiza o Projeto Trilhas de Futuro nas Escolas, estabelece que a matriz curricular do curso é única e implementada ao longo dos três anos, em conformidade com o calendário da escola estadual. A execução da formação técnica e seus registros no DED+ envolvem o provedor da formação profissional.

Isso reforça que a carga exata dos componentes técnicos da coorte iniciada em 2025 não pode ser reconstruída por analogia com uma matriz genérica ou por simples divisão uniforme entre trimestres.

## Conferência da Resolução SEE nº 5.212/2025

A norma de matrizes 2026 contém anexos específicos para as ofertas:

- Anexo LXXXV — Técnico em Fabricação Mecânica;
- Anexo XC — Técnico em Sistemas de Energia Renovável.

Esses anexos são relevantes para as novas matrizes 2026, mas não fornecem uma distribuição preenchida das unidades de **Formação Técnica Específica** que permita determinar, por exemplo, quantas A/S correspondem a `III` ou `IV` na turma TFE/SENAI de continuidade 2025.

Portanto, eles não autorizam preencher automaticamente os componentes técnicos do 2º ano atual.

## O que os relatórios realmente comprovam

O painel passa a mostrar somente os valores observados, sem criar referência global ou por componente para essas duas turmas enquanto a matriz técnica 2025/horário homologado não estiver disponível.

| Turma | T1 total registrado | T1 técnico III+IV | T2 total registrado | T2 técnico III+IV |
|---|---:|---:|---:|---:|
| 2º Sistemas de Energia Renovável | 481 | 62 | 606 | 150 |
| 2º Fabricação Mecânica | 574 | 162 | 606 | 168 |

## Evidência de organização modular

A distribuição mensal do próprio relatório mostra que a formação técnica não funciona, necessariamente, como uma disciplina uniforme durante todo o trimestre.

### 1º trimestre

- Sistemas de Energia Renovável III: 4 + 10 + 6 + 24 = **44**;
- Sistemas de Energia Renovável IV: 0 + 0 + 0 + 18 = **18** — começa a aparecer somente em maio;
- Fabricação Mecânica III: 12 + 30 + 18 + 18 = **78**;
- Fabricação Mecânica IV: 12 + 30 + 24 + 18 = **84**.

### 2º trimestre

- Sistemas de Energia Renovável III = **72**;
- Sistemas de Energia Renovável IV = **78**;
- Fabricação Mecânica III = **90**;
- Fabricação Mecânica IV = **78**.

Esse padrão modular é incompatível com a antiga suposição de que cada componente deveria necessariamente acumular a mesma carga semanal proporcional desde o primeiro dia do trimestre.

## Segunda correção: retirada do comparativo global de 45 A/S

Uma versão intermediária da auditoria ainda comparava o total da turma a `45 A/S × dias/5` como controle global. Esse indicador também foi retirado para os 2º anos TFE/SENAI de 2025.

Motivo: sem a matriz técnica da coorte/provedor e sem o horário homologado, o painel não deve transformar uma referência geral de jornada em um **saldo de conformidade**. A interface agora exibe somente totais observados e subtotais técnicos.

## O que ainda precisa ser obtido para calcular o previsto técnico

Uma destas fontes é necessária:

1. matriz/plano de execução SENAI/TFE da coorte 2025-2027;
2. horário homologado da turma por período;
3. cronograma oficial do provedor com início e carga dos blocos técnicos.

Até então, o estado correto é **Sem referência**, e não déficit.

## Regra implementada no painel

1. nenhuma carga técnica III/IV é inferida por analogia;
2. o antigo `-110` não aparece como déficit curricular;
3. não há mais saldo global automático de 45 A/S para essas duas turmas;
4. o painel mostra apenas dados observados e evidencia a organização modular;
5. uma previsão específica só poderá ser ativada com fonte identificada.

## Docentes

A consolidação continua usando um único diário lógico por turma + componente. Troca de professor entre T1 e T2 preserva as aulas de ambos os períodos, mas o responsável exibido é o docente atual do T2. Duplicidades simultâneas no relatório atual não são somadas duas vezes e ficam `A confirmar` quando a escola precisa escolher o responsável.

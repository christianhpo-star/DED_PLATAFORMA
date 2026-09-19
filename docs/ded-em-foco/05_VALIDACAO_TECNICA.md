# 05 — Validação técnica da versão auditada

Data: 17/09/2026.

## Testes executados

### Sintaxe

O JavaScript executável do HTML local foi extraído e verificado com `node --check`.

Resultado: **aprovado**.

### Regressão em Chromium/Playwright

A aplicação foi carregada em Chromium e foram exercitadas as 10 telas:

1. Visão geral;
2. Professores;
3. Por turma;
4. Comparar turmas;
5. Pendências;
6. Notas;
7. Total 1º + 2º Tri;
8. Acompanhamento semanal;
9. Atualizar planilhas;
10. Calendário / Matriz.

Resultado do carregamento inicial:

- 171 registros lógicos;
- 24 docentes;
- 9 turmas.

### Gates da auditoria

Foram verificados na interface:

- auditoria global das turmas técnicas;
- T1 do 2º SER = 481;
- referência global T1 = 594;
- decomposição do bloco técnico com diferença comparativa de 100 aulas;
- calendário 3º trimestre = 65/66 antes da reposição;
- regra de transição 2025/2026 visível;
- referência ao art. 54 da Resolução 5.212/2025 visível.

### Teste de recomposição

Em sessão descartável, foi adicionada uma data de reposição válida. O painel passou de **65/66 para 66/66**, comprovando que o calendário efetivo incorpora a recomposição sem alterar o modelo-base.

### Reimportação das bases

As planilhas originais de T1 e T2 foram reimportadas no navegador. Após as duas operações, o painel continuou com:

- 171 registros;
- 24 docentes;
- 9 turmas.

### Erros

Erros JavaScript / `pageerror` / console capturados: **0**.

## Integridade das cargas automáticas

Soma das referências habilitadas:

| Bucket | Soma A/S |
|---|---:|
| REG 1º | 21 |
| REG 2º | 21 |
| REG 3º | 21 |
| EMTI Profissional 1º | 45 |
| EMTI 3º Informática | 45 |
| EMTI 3º Segurança do Trabalho | 45 |

Os 2º anos TFE/SENAI permanecem sem distribuição automática por componente enquanto faltar a fonte específica do curso/horário.

## Limite de publicação

O teste foi feito sobre a versão local com dados da escola. Este repositório é público; portanto o HTML preenchido, nomes de docentes e planilhas não são incluídos no GitHub. Apenas resultados agregados e metodologia são registrados aqui.

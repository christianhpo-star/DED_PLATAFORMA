# Plano de homologação institucional — Consolidados / Apps Script (PR #37)

> **Status inicial:** aguardando execução por pessoa autorizada na instalação institucional. Esta documentação não autoriza deploy em produção. A PR #37 é dependente da PR #36 e permanece em rascunho.

## Objetivo e limites

Confirmar que o pacote `apps-script/` preserva corretamente os Consolidados de Turma por escola, turma, ano e trimestre em uma planilha privada da SEE/MG, mantendo o monitoramento de aulas e as referências oficiais independentes.

- **Dado individual:** nome, nota e falta só no ambiente privado. Não publicar XLSX, HTML com dados, captura de tela, e-mails, IDs ou backup institucional neste repositório público.
- **Escrituração:** notas/faltas de Consolidados **não** são usadas como aulas registradas, ausência de nota não é zero e falta sem denominador não constitui percentual de frequência.
- **Matrizes:** nenhuma carga/hora é inferida de um Consolidado; `OFFICIAL_WEEKLY` permanece inalterado.
- **Sessão:** executar como usuário que acessa; domínio e allowlist obrigatórios. Não flexibilizar autenticação para passar um teste.
- **Portões:** #36 precisa ser homologada no ambiente privado antes de integrar à `main`; esta PR precisa concluir autenticação, permissões e prova institucional de persistência antes de merge/deploy.

## Gate 1 — conferência automatizada (somente dados sintéticos)

| Ensaio | Como conferir | Resultado esperado |
|---|---|---|
| Regressão | `npm test` | PASS |
| Build | `npm run build` | Sem erro; `dist/` e `apps-script/` reproduzidos |
| Consistência | `git diff --exit-code -- dist/DED_em_Foco_MultiEscola_2026.html apps-script/Index.html apps-script/ConsolidatedCore.gs` | Sem diferença |
| Chromium REG | `node tests/browser-reg-matrix.js` | PASS |
| Chromium Consolidados | `node tests/browser-consolidated.js` | PASS |
| Paginação de impressão | `node tests/browser-print-pagination.js` (Chromium e poppler-utils) | Sem página vazia/rodapé isolado; professores separados |
| CI | GitHub Actions no HEAD da PR | Todas as execuções concluídas com SUCCESS |

> Não declarar PASS de homologação institucional por aprovação da CI. Uma falha ou execução inconclusa bloqueia o gate.

## Gate 2 — instalação segura no ambiente de homologação

1. Criar **projeto Apps Script e planilha privados de homologação**, com conta e compartilhamento institucional autorizados. Uma escola por instância; não vincular planilha de produção.
2. Conferir o pacote **gerado**, não editar diretamente `Index.html` ou `ConsolidatedCore.gs`. No editor do Apps Script, incluir `Code.gs`, `ConsolidatedCore.gs`, `Index.html` e o manifesto `appsscript.json`.
3. Definir as propriedades obrigatórias **somente no Apps Script**: `DED_SPREADSHEET_ID`, `DED_SCHOOL_CODE` e `DED_ALLOWED_EMAILS`. Não registrar seus valores no GitHub, logs ou capturas.
4. Autorizar os escopos restritos a Sheets e identificação do usuário. Executar `setupStorage_` no editor; verificar `DED_Manifestos` e `DED_Blocos`, seus cabeçalhos e ausência de exclusão de abas.
5. Implantar **apenas o ambiente de teste**, com execução como **usuário que acessa** e acesso restrito ao domínio institucional; nunca opção pública/anônima.
6. Garantir que cada autorizado possui acesso **apenas ao arquivo privado daquela escola** e aceita OAuth na própria conta. Testar dois perfis: autorizado e não autorizado.
7. Confirmar que identidade sem e-mail e usuário fora da allowlist recebem **acesso recusado**, sem dados de estudantes nem alteração de armazenamento. Não usar execução como proprietário para contornar indisponibilidade de e-mail.
8. Registrar *somente* `PASS/FAIL`, horário, commit e tipo de falha anonimizado. IDs, contas e telas nominais ficam na guarda institucional.

**Bloqueio imediato:** conteúdo exposto a conta não autorizada, permissões excessivas ou falha no confinamento de escola.

## Gate 3 — integridade dos Consolidados

Executar primeiro com documentos sintéticos, depois com **originais reais autorizados** (sem enviá-los ao GitHub):

| Cenário | Critério |
|---|---|
| Prévia / cancelamento | Cancelar não altera revisão nem registros persistidos |
| Novo T1/T2 e T3 quando disponível | Escola, turma, ano, trimestre, extração, componentes, notas e faltas conferem com o arquivo original |
| Repetição do mesmo arquivo | Não duplica documento ou revisão |
| Substituição de extração | Solicita confirmação, avisa se antiga, preserva versão anterior |
| Arquivo inválido ou outra escola | Recusa sem alterar base |
| Nota ausente vs. 0 | Continua `null` vs. zero e não cria reprovação automática |
| Sem T3 original | Exibe indisponibilidade, sem inventar dados |
| Fonte sem matrícula | Não funde homônimos nem vincula pessoas entre períodos |
| Tabela e paginação de nomes | Todos os estudantes em conferência aparecem uma vez, sem páginas vazias |
| Reabertura em sessão autorizada | Revisão e agregados persistem |
| Backup e restauração | Exportação privada válida; restaurar revisão anterior cria revisão nova, preservando histórico |
| Concorrência / resposta perdida | Revisão antiga é recusada; atualizar lista não duplica dados |
| Integridade Sheets | Leitura confere hash; corrupção intencional em cópia de teste é recusada sem reconstrução silenciosa |

Conferir indicadores agregados por cálculo independente. **Não adotar limiares inéditos** de nota/frequência ou equiparar notas de trimestres sem escala documentada.

## Gate 4 — coexistência e comportamento de impressão

- [ ] Relatórios de Lançamentos do Professor permanecem no fluxo local; Consolidados não alteram `DATA.raw` ou horas previstas.
- [ ] Configurações locais não sobrescrevem referências normativas no modo institucional.
- [ ] Impressão de visão geral e resumos não gera folha final somente com rodapé.
- [ ] Relatórios individuais de dois professores iniciam em páginas separadas; tabelas longas mantêm legibilidade, cabeçalhos e assinaturas.
- [ ] Impressão/exportação não expõe dados individuais além da seleção deliberada pelo usuário autorizado.
- [ ] Cenários mobile (390 px), teclado e mensagens de erro são revisados.

O teste automatizado usa apenas documentos sintéticos. A inspeção visual final deve ocorrer também no visualizador PDF usado pela unidade, com identificação pessoal protegida.

## Evidências e GO/NO-GO

| Gate | Estado inicial | Aprovação necessária |
|---|---|---|
| PR #36 — matrizes REG | **BLOQUEADO** documental | Horário/grade/ato aplicável + conferência operacional privada |
| 1. QA técnica PR #37 | Verificar execução no último commit | CI e impressão sem falhas |
| 2. Autenticação/permissões | **PENDENTE** | Usuários permitidos/negados testados na instância real |
| 3. Persistência institucional | **PENDENTE** | Teste real, backup, restauração e confronto independente |
| 4. Impressão/UX | **PENDENTE** revisão visual institucional | PDF legível e sem conteúdo órfão |
| 5. Liberação | **NÃO AUTORIZADA** | Aprovação humana explícita dos gates anteriores |

Registro mínimo de evidência **anonimizada** em comentário de PR: `data | HEAD | Gate | PASS/FAIL/BLOCKED | motivo sem identificadores | responsável autorizado (somente em documento privado)`. Não copiar dado pessoal ao comentário.

Em caso de falha: interromper novas importações, manter a revisão atual, conservar cópia administrativa privada e reverter código da implantação de teste sem apagar `DED_Blocos`/`DED_Manifestos`. Nunca executar limpeza/recriação de planilha para tentar corrigir uma atualização. Só promover produção depois de revisão humana expressa.

**Referências:** `docs/PLANO_TRANSICAO_GOOGLE_APPS_SCRIPT_CONSOLIDADOS.md`, `docs/QA_HOMOLOGACAO_PR36_MATRIZES_REG.md`, `apps-script/README.md`.

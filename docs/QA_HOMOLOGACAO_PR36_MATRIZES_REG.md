# Homologação privada — matrizes REG por turma (PR #36)

## Escopo

Verificar a seleção e a restauração das matrizes de Ensino Médio Regular diurno/noturno no DED em Foco **sem comprometer bases reais**.

Implementação: branch `fix/matriz-regular-por-turma`; PR https://github.com/christianhpo-star/DED_PLATAFORMA/pull/36

## Gate A — QA automatizado, somente dados fictícios

- `npm test`: regressões curriculares, privacidade, calendário, interface, backup, rastreabilidade e suporte multiescola.
- `npm run build`: gera o HTML autônomo.
- `node tests/browser-reg-matrix.js` (com `playwright-core` e Chrome): executa o cenário sintético.
- Workflow: `.github/workflows/browser-reg-matrix.yml` (primeiro testes baratos, depois navegador).
- Evidência do teste: logs PASS/FAIL. Captura de tela somente em caso de falha, contendo apenas dados fictícios.

Cenários automatizados: REG manhã → diurno; REG noite → noturno; Ensino Fundamental não recebe seletor EM; cancelar/ESC não persiste; confirmar exige fonte e justificativa; recarregar mantém a decisão e todas as semanas históricas; restaurar remove a seleção e reclassifica histórico; seletor acessível em 390px.

Cenário adicional: uma turma REG encontrada **somente em semana histórica**, ausente dos arquivos correntes T1/T2 e da última semana, deve permanecer no seletor, com aviso de origem histórica. É possível confirmar uma matriz documentada para ela e manter essa decisão ao recarregar. O teste é exclusivamente sintético.

**Este gate não comprova que as matrizes reais de cada escola foram homologadas.**

## Gate B — homologação operacional privada (pendente)

1. Faça cópia de segurança antes de testar: na versão atual, **Dados → Baixar backup JSON**, **Configurações → Exportar parâmetros** e **Salvar cópia HTML**. Guarde esses arquivos fora de repositórios públicos.
2. Abra o HTML de teste do PR #36 em perfil privado/isolado do navegador, separado da versão em uso. Não substitua o arquivo de produção.
3. Carregue os relatórios de teste T1/T2 e, quando aplicável, os arquivos semanais do T3 usando as prévias e confirmações existentes. Se optar por restaurar um backup JSON, respeite a validação do `datasetId`; **nunca altere identificadores para forçar importação**.
4. Em **Configurações**, confira a lista de turmas e compare a matriz sugerida com a **matriz, grade ou horário homologado aplicável à turma**. Registre somente ajustes sustentados por esses documentos.
5. Confira pelo menos uma turma regular matutina, uma vespertina e uma noturna (quando existirem), verificando os componentes, as aulas previstas e os filtros após a classificação.
6. Troque temporariamente a opção de uma turma de teste, **cancele** e verifique que a matriz e os resultados permanecem inalterados. Repita com **Esc**.
7. Em uma turma cuja seleção alternativa seja documentalmente justificável, confirme o ajuste com motivo e fonte; confira o histórico, os indicadores e as referências utilizadas. Reabra o painel e verifique a persistência.
8. Compare semanas anteriores do T3, uma impressão e uma exportação para verificar que não foi introduzida divergência de referência curricular entre períodos.
   - Se houver turma encontrada somente em semana antiga, confira se ela aparece identificada no seletor e se a referência aplicável é a do período/coorte documentada; não atribua uma matriz por analogia.
9. Em **cópia de teste**, execute a restauração geral das referências depois de exportar os parâmetros. **Atenção:** essa ação restaura também outros ajustes locais (como A/S e calendário); não a execute na produção sem revisão.
10. Garanta que turmas do Ensino Fundamental, EMTI e componentes técnicos sem fonte documental não mudaram indevidamente.

## Critérios de bloqueio do merge

- Qualquer dado alterado antes da confirmação, ou persistido depois de cancelar.
- Divergência de matriz/previsto entre visão atual e históricos após recarga/restauração.
- Carga horária inventada para turma/coorte sem matriz ou horário aplicável.
- Falha de backup/restauração ou de reabertura sem perda de dados.
- Regressões de acessibilidade críticas ou testes automatizados com falha.
- Evidência real de escola ainda não conferida por pessoa autorizada.

## Privacidade e evidências

O repositório é **público**. Não publicar HTML preenchido, XLSX, backups, screenshots com nomes, códigos internos de escola, diários ou estudantes. Registrar no PR apenas o resultado anonimizado (PASS/FAIL), versão/commit, data e descrição de eventuais discrepâncias, mantendo evidência nominal em armazenamento institucional autorizado.

## Evidência técnica atual

- Workflow de regressão e teste de Chromium com dados sintéticos: PASS (confirmar o commit e as execuções atualizadas na conversa do PR).
- Teste adicional de turma presente apenas no histórico: PASS.
- Nenhuma dessas verificações corresponde à conferência das matrizes homologadas de uma unidade real.

## Status

- Gate A: verificar o resultado atual da GitHub Action antes do merge.
- Gate B: **pendente de execução em navegador com dados reais, em ambiente privado**.
- Produção e `main`: não publicar/mesclar até concluir o Gate B.

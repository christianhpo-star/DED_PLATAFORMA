# Integração dos Consolidados ao DED — implementação e instalação

Implementado em `feature/consolidados-apps-script`, baseado no head b35aa18 do PR #36. É uma branch separada e dependente daquele PR; não mescla ou publica a main. A orientação curricular de 10/11/2026 dispensa horário individual para cargas já estabelecidas na norma estadual: Regular Noturno 2026 usa Anexo XII, LP 4 A/S, Física 1 A/S no 3º ano, total presencial 21 A/S. Diferenças históricas não viram erro docente nem alteração automática de carga. Exceções dependem de ato SEE/MG aplicável ao ano/modalidade/coorte, incorporado e testado pelo mantenedor.

## Arquitetura implementada

A mesma interface e os mesmos módulos 01–21 continuam responsáveis pelo monitoramento de aulas. Os módulos 22 (contrato puro, compartilhado com GAS) e 23 (adaptador XLSX e interface) acrescentam Consolidados em **Dados → Notas e faltas por turma**, com acesso também pela visão geral, turma e Central de Atenção.

O XLSX é selecionado no navegador. O leitor ZIP/XML existente é reutilizado com limites adicionais, relações entre abas, strings compartilhadas/inline e cabeçalhos de componentes divididos em mais de uma linha. O navegador envia o contrato normalizado ao Apps Script apenas para a prévia; a persistência depende de confirmação. Não há leitura direta do Windows pela nuvem, upload do arquivo binário ao Drive, dependência de Drive API, API avançada, token no código ou clasp.

Sem GAS, há armazenamento local independente dos diários de aulas, backup JSON e histórico. No HTML Service, os Consolidados ficam no Sheets privado: não são guardados em localStorage e os detalhes individuais são consultados sob demanda. As importações dos Relatórios de Lançamentos continuam locais nesta etapa; não se afirma que essas bases foram migradas ao Sheets. O backup de aulas continua separado do backup de Consolidados.

## Pacote e funções exatas

`npm run build` gera `dist/DED_em_Foco_MultiEscola_2026.html`, `apps-script/Index.html` e `apps-script/ConsolidatedCore.gs`. O código de backend exato está em `apps-script/Code.gs`; deve ser copiado integralmente, sem reescrita manual. `apps-script/appsscript.json` declara V8, fuso America/Sao_Paulo, identidade do usuário que acessa, domínio institucional e somente os escopos Sheets e e-mail da sessão. O HTML institucional protege referências oficiais e ignora overrides curriculares locais.

Funções públicas, todas com verificação de identidade/allowlist:

| Função | Uso |
|---|---|
| `doGet` | Entrega a interface após autorização |
| `dedListConsolidated` | Índice e agregados sem nomes individuais |
| `dedGetConsolidated(key)` | Detalhes de uma escola/turma/ano/trimestre |
| `dedPreviewConsolidated(documents)` | Valida contratos/escola/lote e informa novos, repetidos, substituições e extrações antigas |
| `dedCommitConsolidated(request)` | Confere digest/revisão/confirmado, grava blocos imutáveis e publica manifesto final |
| `dedRestoreConsolidated(request)` | Cria nova revisão apontando para snapshot anterior, sem apagar histórico |

`google.script.run.withSuccessHandler(...).withFailureHandler(...)[method](request)` é a ponte usada por `gasConsolidated` no módulo 23. Falha de rede não troca a base local em memória; atualizar a lista resolve o caso de resposta perdida após commit. Repetir o mesmo arquivo não duplica registros.

## Contrato e fontes dos indicadores

Cada documento tem `schemaVersion`, `sourceType=DED_CLASS_CONSOLIDATED`, `school{code,name}`, `class{code,name,shift}`, `year`, `term`, `extractedAt` com offset e `source{fileName,sha256,sheet}`. Cada registro contém `studentKey`, `studentId` opcional, `studentName`, `identityScope`, `sourceRow`, `component`, `componentKey`, `grade:number|null` e `absences:integer|null`. A origem/data pertence ao documento e vale para seus registros. Auditoria de importação contém revisão, data, autor autenticado e operação.

Chave de documento: escola|ano|código da turma|trimestre. Chave de registro: studentKey|componente normalizado. Sem matrícula, studentKey é a linha do relatório e identityScope=report: não estabelece identidade entre períodos ou versões. Nomes repetidos sem matrícula são recusados para conferência, em vez de fundir homônimos. Não há correspondência aproximada de nomes. Arquivos de uma mesma turma/período no mesmo lote são recusados: selecionar uma versão ou importar sequencialmente com confirmação.

Campos vazios/traços viram `null`; zero é preservado. Notas textuais/conceitos não numéricos, fórmulas, cabeçalhos incompatíveis, metadados incompletos e rodapés desconhecidos são recusados, sem apagar dados. A estrutura encontrada traz notas e faltas; não traz aulas ministradas, escala de pontuação explícita, matrícula nem denominador confiável de frequência. Por isso, a integração mostra médias das notas preenchidas, cobertura de notas, faltas e cobertura de faltas; não calcula percentual de frequência/escrituração ou limiar novo de desempenho. Comparação entre trimestres é agregada e lado a lado, sem presumir mesma escala ou vínculo individual. Casos sem nota são encaminhados para conferência, sem inferir causa.

Componente desconhecido é preservado com carga indisponível; ano diferente de 2026 não recebe matriz 2026. A/S oficial presencial, aulas efetivamente registradas e informação não homologada são distintos. Atividades complementares não são convertidas em A/S presencial por analogia.

## Armazenamento e recuperação

Criar uma planilha privada exclusiva para a escola. O setup não limpa abas existentes e recusa cabeçalhos incompatíveis. Duas abas têm finalidade definida:

| Aba | Colunas exatas | Finalidade |
|---|---|---|
| DED_Manifestos | revisao, manifesto_json, data_iso, autor, operacao | Auditoria e ponteiro do snapshot ativo; última linha válida define revisão |
| DED_Blocos | hash, parte, json | Blocos de até 30.000 caracteres para documentos e manifestos; nenhuma célula precisa exceder o limite do Sheets |

`manifesto_json` contém `{start,count,hash}` para os blocos do manifesto. O manifesto contém revisão e índice por escola/turma/ano/trimestre, com ponteiros de dados, origem e agregados. Consultas individuais leem somente os blocos endereçados; a lista lê só o manifesto, sem varrer todos os registros. Não há cache compartilhado de dados pessoais. O backend verifica SHA-256 ao ler e valida novamente o contrato ao persistir.

`LockService` e revisão esperada impedem confirmação concorrente obsoleta. Novos blocos são gravados antes de publicar o ponteiro final. Uma falha anterior deixa blocos órfãos, sem substituir a versão ativa. Falha de resposta após commit exige atualizar a lista antes de repetir. Revisões/blocos anteriores não são removidos; restauração é uma nova revisão, inclusive revisão zero (base vazia) mediante confirmação. Sem garantia transacional física entre abas: o manifesto final é o ponto de commit lógico. Não editar abas manualmente; corrupção do índice causa recusa, não reconstrução silenciosa.

Limites: 20 arquivos/documentos por lote, 10 MB por XLSX, 30 MB descompactados, 500 entradas ZIP, 20.000 registros por documento, 2 MB de JSON por lote, 200 turmas/períodos ativos por instalação. Detalhes individuais são paginados em grupos de 100; listas/agregados ficam no índice. O histórico aumenta o consumo de células: monitorar quotas do Google e fazer cópia administrativa antes de manutenção. Não há purga automática.

## Instalação manual institucional (não executada)

1. Criar planilha privada e projeto Apps Script institucional. Restringir compartilhamento aos responsáveis autorizados.
2. Adicionar os arquivos do diretório `apps-script`: Code.gs, ConsolidatedCore.gs e Index.html. Exibir o manifesto no editor e copiar appsscript.json.
3. Em Configurações do projeto → Propriedades do script, definir `DED_SPREADSHEET_ID` (ID real da planilha), `DED_SCHOOL_CODE` (código numérico sem zeros iniciais) e `DED_ALLOWED_EMAILS` (endereços institucionais autorizados, separados por vírgula). Não colocar esses valores no Git.
4. Autorizar apenas Sheets e identificação do usuário; executar `setupStorage_` pelo editor. A função privada terminada em `_` não pode ser chamada pela ponte do navegador. Conferir as duas abas e cabeçalhos.
5. Para homologação, criar implantação de teste de Web App, executando como **usuário que acessa** e limitada ao domínio institucional. Não selecionar acesso anônimo/público. A allowlist continua obrigatória. Se a sessão não devolver e-mail, o acesso é recusado; não trocar por usuário efetivo ou retirar a checagem.
6. Cada usuário autorizado precisa de acesso à planilha privada e deve consentir no fluxo OAuth institucional. Testar também conta fora da allowlist e identidade indisponível.
7. Abrir Dados → Notas e faltas por turma. Selecionar originais, conferir prévia e confirmar. Reabrir a aplicação; exportar backup e testar restauração de revisão em ambiente de homologação.
8. Somente após validação humana, autenticação institucional e autorização explícita de Christian poderá haver implantação em produção. Nenhum deploy foi realizado por este trabalho.

Atualização: antes de substituir o código, exportar backup/cópia privada da planilha. Copiar os arquivos atualizados, executar testes e conferir `schemaVersion=1`. Nunca recriar planilha, renomear abas ou rodar limpeza para atualizar código. Não há migração destrutiva nesta versão; esquemas incompatíveis falham preservando dados. O HTML standalone e o Index são gerados do mesmo fonte; não editar os bundles à mão.

## Checklist de homologação

- Prévia sem escrita; cancelar preserva base; repetição não duplica; substituição preserva versão; extração mais antiga sinalizada.
- Reabrir conserva dados; backup privado válido; restauração sob confirmação; revisão concorrente recusada.
- T1/T2/T3 sintéticos, T3 ausente, modalidade mista e componente desconhecido; null diferente de zero.
- Somente Consolidados carregados mantém aulas registradas vazias; nenhum percentual de escrituração é derivado de notas/faltas.
- 3º REG noturno mantém LP 4, Física 1 e soma 21; ajustes locais não mudam as referências institucionais.
- Contas permitidas/negadas no Web App real, permissões da planilha, quotas/volume e restauração após falha.
- Consolidado real de T2/T3 quando disponível, sem usar planejamento do período como substituto.

## Validação técnica disponível

`npm test` inclui contrato e servidor GAS emulado; `npm run build` gera ambos os destinos; `npm run test:consolidated-browser` cobre fluxo de arquivos, confirmação, versões, backup, recarga, 390px e ponte GAS emulada. GitHub Actions usa somente dados sintéticos. As evidências e o inventário nominais ficam fora do repositório. Validação na conta institucional e implantação de teste dependem de autorização/manual OAuth, não são substituídas pela emulação.

Referências técnicas primárias: [Session e identidade](https://developers.google.com/apps-script/reference/base/session), [google.script.run](https://developers.google.com/apps-script/guides/html/reference/run), [Web Apps](https://developers.google.com/apps-script/guides/web), [LockService](https://developers.google.com/apps-script/reference/lock/lock-service). Não usar execução como proprietário para contornar e-mail de sessão ausente.

Fontes curriculares consultadas: Resolução SEE 5.212/2025 e Anexo XII conferidos no projeto; [Resolução SEE 5.167/2025](https://www.educacao.mg.gov.br/wp-content/uploads/2025/06/RESOLUCAO-SEE-No-5.167-DE-10-DE-JUNHO-DE-2025.pdf), que define Educação Híbrida como abordagem complementar; [catálogo oficial do Ensino Médio](https://portalpedagogico.educacao.mg.gov.br/estrutura-curricular-e-ensino/ensino-medio/principais-legislacoes-ensino-medio/), que lista o Documento Orientador 2026. O catálogo não disponibilizou link de conteúdo no acesso textual: não foi usado para inventar critérios/limiares ou exceções. A implementação mantém as constantes normativas existentes; não infere novas cargas a partir de notas/faltas ou do catálogo.

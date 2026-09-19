# 04 — Histórico da auditoria DED em Foco

Data: 17/09/2026.

## Passo 1 — separar modalidade e série

Confirmado na base: 9 turmas, sendo 3 REG/NOITE e 6 INT/INTEGRAL. O cálculo não compartilha uma única matriz entre esses grupos.

## Passo 2 — revisar a escolha da matriz

A regra foi refinada para **matriz mais recente oficialmente aplicável à série/oferta**, combinando norma geral e regras de transição.

- Resolução SEE nº 5.212/2025: matrizes 2026;
- formação SEE/MG/SRE-C de 03/06/2026: 1º ano EMTI usa referência 2026; 2º e 3º anos usam referência 2025;
- Resolução SEE nº 5.146/2025: nas ofertas Trilhas de Futuro nas Escolas a matriz do curso é única ao longo dos três anos e a execução da formação técnica envolve o provedor.

## Passo 3 — investigar o saldo técnico de ~110

A antiga hipótese de 6 A/S para SER III + 6 A/S para SER IV reproduz exatamente o saldo -110: -96 no T1 e -14 no T2. Como não foi localizada fonte que autorize essa distribuição para a turma atual, a regra foi retirada.

## Passo 4 — conferir as matrizes 2026 dos cursos técnicos

A Resolução SEE nº 5.212/2025 contém:

- Anexo LXXXV — Técnico em Fabricação Mecânica;
- Anexo XC — Técnico em Sistemas de Energia Renovável.

Esses anexos de 2026 não fornecem uma distribuição preenchida da Formação Técnica Específica que permita inferir os componentes III/IV da turma de continuidade 2025. Portanto, não foram usados para preencher cargas ausentes.

## Passo 5 — analisar o padrão real de lançamento

Totais técnicos observados:

- 2º SER: 62 no T1 e 150 no T2;
- 2º Fabricação: 162 no T1 e 168 no T2.

O lançamento mensal evidencia organização modular. Em SER IV, o T1 apresenta 0/0/0/18: o componente só começa a registrar aulas em maio. Isso invalida a ideia de distribuir uma carga uniforme desde o início do trimestre sem conhecer o cronograma do provedor.

## Passo 6 — remover também o falso saldo global

Uma etapa intermediária comparava os 2º anos TFE/SENAI a `45 A/S × dias/5`. A auditoria final retirou também esse indicador de conformidade. Sem matriz técnica 2025 ou horário homologado, o painel agora mostra apenas totais observados e subtotais técnicos, sem classificar déficit global.

## Passo 7 — revisar o calendário

O calendário estadual fornecido possui 200 dias-alvo, com 66/68/66 por trimestre e sábados letivos de 27/06 e 12/09.

08/12 é feriado municipal em Belo Horizonte. O sistema registra **199 datas localizadas + 1 dia pendente de recomposição homologada**; não inventa data para fechar os 200 dias.

## Passo 8 — validar responsabilidade docente

- turma + componente = um diário lógico;
- troca entre T1/T2: responsável atual = docente do T2;
- duplicidade idêntica: contagem única;
- dois nomes simultâneos no T2: responsável fica `A confirmar`.

## Passo 9 — validação técnica da revisão final

- JavaScript incorporado: `node --check` sem erro;
- teste estático reproduzível: 171 registros lógicos em T1 e T2, 9 turmas, cargas técnicas de 2º ano sem referência automática, calendário local 66/68/65 antes da recomposição, ausência da comparação `45 A/S × dias/5` e reprodução histórica do antigo -110;
- tentativa de regressão headless da revisão final: o ambiente bloqueou navegação `file://` e `http://127.0.0.1` com `ERR_BLOCKED_BY_ADMINISTRATOR`, portanto essa revisão específica não é declarada como validada visualmente em navegador aqui.

Uma revisão anterior havia passado regressão em navegador; como o código mudou novamente, o gate correto é considerar a revisão final aprovada por sintaxe e invariantes estáticos, deixando a abertura visual do HTML como conferência final no navegador do usuário.

## Privacidade

O `index.html` preenchido não é publicado neste repositório porque o repositório é público e o arquivo contém nomes de docentes e dados internos. Apenas documentação metodológica sem dados nominais é versionada.

## Branch e PR

- branch: `audit/ded-em-foco-curriculo-2026`;
- PR: `#1 — Auditoria DED em Foco — matrizes e calendário 2026`;
- estado: rascunho; não fazer merge até concluir os gates documentais ou decidir formalmente manter esses itens como parâmetros manuais.

## Commits desta rodada final

- `48ac841` — elimina falso saldo global nas turmas TFE 2025 e documenta organização modular;
- `5a41d54` — incorpora Resolução SEE nº 5.146/2025 e regra de matriz mais recente aplicável.

## Gates antes de concluir o PR

- [ ] obter matriz/plano SENAI/TFE 2025 ou horário homologado do 2º ano para habilitar previsto técnico;
- [ ] confirmar data homologada da recomposição de 08/12;
- [x] executar validação sintática;
- [x] executar validação estática dos dados/regras;
- [x] eliminar referência automática 6+6 e o falso -110;
- [x] eliminar também saldo global automático sem fonte;
- [x] manter dados nominais fora do repositório público;
- [ ] abrir a revisão final do HTML em navegador desktop e conferir visualmente a aba Calendário/Matriz.

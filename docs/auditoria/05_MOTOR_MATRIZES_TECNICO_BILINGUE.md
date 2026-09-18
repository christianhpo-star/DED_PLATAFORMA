# 05 — Motor multidimensional de matrizes — técnico + bilíngue

Data da revisão: 18/09/2026.

## Objetivo

Preparar o DED em Foco para escolas que combinam Ensino Médio regular noturno, Ensino Médio em Tempo Integral, cursos técnicos e oferta intercultural/bilíngue, sem criar uma matriz única artificial.

## Dimensões classificadas

O importador passa a tratar separadamente:

1. ano/série;
2. REG/INT e turno compatível;
3. curso técnico, quando expresso no nome da turma;
4. perfil bilíngue, detectado pela presença de componentes curriculares bilíngues na própria turma.

Uma turma pode possuir mais de uma característica ao mesmo tempo. O filtro **Oferta / matriz** permite recortes sobrepostos, por exemplo `Integral · bilíngue` e `Técnico · Automação Industrial`.

## Cursos reconhecidos pelo classificador

- Automação Industrial;
- Desenvolvimento de Sistemas;
- Fabricação Mecânica;
- Química / Produção Industrial;
- Sistemas de Energia Renovável;
- Informática;
- Segurança do Trabalho.

## Segurança metodológica

- REG/NOITE e INT/INTEGRAL continuam validados na importação;
- coortes técnicas em continuidade não recebem automaticamente a matriz de entrada 2026;
- componentes bilíngues sem carga documentada ficam `sem referência documental`;
- componentes técnicos legados com nomenclatura incompatível com a matriz 2026 também ficam fora da base comparável;
- dados identificáveis de escola continuam proibidos no repositório público.


## Regra de leitura da matriz semanal da escola

Quando a matriz escolar está organizada por colunas de turma, o valor confiável para o motor é o **número no início de cada célula da coluna da turma**. Esse número representa as aulas semanais daquele componente naquela turma. O texto posterior corresponde à distribuição docente e não é persistido no JSON anonimizado.

A coluna `T. AULAS` não é usada como teto ou soma de validação quando aparece repetida por linha de componente. O total semanal é derivado pela soma das cargas de cada componente da própria coluna.

Consequências observadas na matriz 2026 anonimizada:

- seis turmas de 1º ano: 45 A/S;
- quatro turmas de 2º ano vinculadas ao SENAI: 33 A/S acompanhadas pela escola + 12 A/S externas, não monitoradas;
- 2INT2 e 2INT3: 46 A/S pela soma das células;
- 3INT2: 47 A/S pela soma das células;
- 3INF1 e 3QUI1: 46 A/S, incluindo os componentes técnicos detalhados pela própria escola.

O previsto por período segue `carga semanal × dias letivos efetivos ÷ 5`, com arredondamento por período. Feriados locais e reposições devem alterar os dias letivos efetivos, não a carga semanal da matriz.

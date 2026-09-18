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

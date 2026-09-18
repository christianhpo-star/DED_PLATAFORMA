# 01 — Critério de matrizes curriculares — 2026

Data da revisão: 17/09/2026.

## Regra central

O DED em Foco não escolhe uma matriz apenas pelo ano/série atual da turma. Para cada oferta, é obrigatório identificar a **matriz oficialmente aplicável à coorte e ao curso** no ano letivo de 2026.

Uma matriz nova não substitui automaticamente a matriz de uma coorte técnica em continuidade quando a orientação da SEE/MG determina preservação da trajetória formativa.

## Fontes verificadas

### Fonte oficial primária

- **Resolução SEE nº 5.212, de 19/11/2025** — organização e implementação das matrizes curriculares da rede estadual para 2026.
  - Portal oficial: https://www.educacao.mg.gov.br/wp-content/uploads/2025/11/Resolucao-SEE-no-5.212_2025.pdf
  - A resolução contém os anexos do EMTI Profissional, inclusive:
    - Anexo LXXXV — Técnico em Fabricação Mecânica;
    - Anexo XC — Técnico em Sistemas de Energia Renovável.

### Orientação complementar de continuidade

- **Memorando-Circular nº 326/2025/SEE/SB**, de 26/11/2025 — orientação complementar às Resoluções SEE nº 5.212/2025 e nº 5.214/2025.
- O documento estabelece que cursos técnicos iniciados em 2024 e/ou 2025 permanecem vinculados às matrizes adotadas no ano de início e que as novas matrizes do EMTI Profissional valem para as turmas de entrada em 2026.
- Nesta auditoria, o texto do memorando foi conferido em cópia pública que informa SEI nº 128158370, Processo nº 1260.01.0217004/2025-50 e CRC 78114B3D. Como o arquivo não foi recuperado diretamente de URL pública oficial da SEE, o repositório registra essa limitação e não trata a cópia hospedada por terceiro como fonte primária equivalente à resolução oficial.

### Evidência oficial sobre o Trilhas de Futuro nas Escolas

A SEE/MG informa que o projeto foi implantado para estudantes que ingressaram no 1º ano do EMTI em 2025, em parceria com o SENAI, com formação técnica integrada ao longo do Ensino Médio.

- https://www.educacao.mg.gov.br/governo-de-minas-lanca-trilhas-de-futuro-nas-escolas-com-96-mil-vagas-em-cursos-de-alta-tecnologia/
- Resolução SEE nº 5.146/2025: https://www.educacao.mg.gov.br/wp-content/uploads/2025/04/SEI_111242803_Resolucao_SEE_N__5.146_2025.pdf

## Aplicação

### Ensino Médio Regular noturno

Usa a matriz de Ensino Médio Noturno aplicável em 2026. REG/NOITE não compartilha automaticamente referências com EMTI/INTEGRAL.

### EMTI Profissional — entrada em 2026

As turmas que ingressam no 1º ano do EMTI Profissional em 2026 seguem a matriz 2026 da Resolução SEE nº 5.212/2025.

### EMTI Profissional — coortes iniciadas em 2024/2025

A referência deve preservar a matriz adotada no ano de início da oferta técnica, salvo norma posterior específica que determine substituição.

Para a coorte do **Trilhas de Futuro nas Escolas iniciada em 2025**, a turma que está no 2º ano em 2026 não deve receber automaticamente a nova distribuição criada para a entrada de 2026.

## Achado crítico nos anexos 2026

Nos anexos LXXXV (Fabricação Mecânica) e XC (Sistemas de Energia Renovável), a Formação Geral Básica e as Atividades Integradoras possuem cargas preenchidas, mas o bloco **Formação Técnica Específica** aparece sem componentes/cargas discriminados.

Consequência: esses anexos **não autorizam inferir**, por exemplo, que `Fabricação Mecânica III/IV` ou `Sistemas de Energia Renovável III/IV` tenham 6 A/S cada.

## Hierarquia de referência para o painel

Para cada turma/componente, usar nesta ordem:

1. matriz oficial específica da coorte/curso;
2. grade/plano oficial do parceiro técnico aplicável à coorte;
3. horário homologado da turma/escola;
4. somente para componentes cuja carga semanal está documentada: projeção proporcional pelo calendário;
5. sem uma dessas fontes, exibir `sem referência documental`.

## Regra de segurança

Nunca completar lacunas de Formação Técnica Específica por analogia com outro curso, outra coorte, outra escola ou com o próprio volume registrado no DED.


## Oferta intercultural/bilíngue

O perfil bilíngue não substitui a modalidade nem o curso técnico. O motor deve registrar dimensões independentes: ano/série, turno/modalidade, curso técnico e presença de componentes bilíngues.

Assim, uma turma pode ser classificada como **integral + técnica + bilíngue** sem ser forçada a uma categoria única. Componentes como Estudos Interculturais, Língua Estrangeira e componentes aplicados em língua estrangeira identificam o perfil, mas permanecem sem A/S automática quando a carga específica da oferta não estiver documentalmente disponível.

Nomes de oferta com hífen interno também precisam ser preservados pelo importador. Somente o sufixo de endereço/localização deve ser removido quando reconhecido como tal; o hífen que integra o nome do curso não pode determinar o corte do nome da turma.

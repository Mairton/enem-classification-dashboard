# Uma rede pública precisa de IA paga para classificar seu próprio material?

Painel de dados que compara **sete configurações de classificação automática** na mesma tarefa:
associar o enunciado de um item do ENEM a uma das 30 habilidades candidatas da sua área, medindo
o acerto contra a atribuição oficial do INEP.

**Painel:** https://mairton.github.io/enem-classification-dashboard/

Arquivo único, autocontido. Abre no navegador sem internet e não lê arquivos externos.

---

## A pergunta e a resposta

Um modelo de pesos abertos rodando na infraestrutura da própria rede alcança **71,6%** do acerto
do modelo proprietário na primeira posição e **77,4%** entre as cinco primeiras. Em troca, nenhum
dado sai da rede, não há contrato de API e o custo por item é zero.

A resposta curta: não precisa pagar, mas abre mão de 11,6 pontos percentuais na primeira posição
e 17,6 pontos entre as cinco.

## A bancada

Tarefa idêntica para todas as famílias: dado o enunciado de um item e as 30 habilidades candidatas
da sua área, devolver as cinco mais pertinentes em ordem. Janela canônica: **ENEM 2023, n = 178
itens**, única edição em que todas as configurações rodaram.

| Configuração | 1ª posição | 5 primeiras |
|---|---|---|
| Acaso (piso) | 3,3% | 16,7% |
| Lexical TF-IDF, sem IA | 11,8% | 32,6% |
| Vetorial `bge-m3`, Forma A | 15,7% | 43,8% |
| Vetorial `bge-m3`, Forma B | 15,7% | 41,6% |
| Vetorial `bge-m3`, Forma C | 19,7% | 60,7% |
| Generativa local `qwen3:8b` | 23,4% | 51,4% |
| Generativa local `qwen3:14b` | 29,4% | 60,5% |
| Generativa proprietária `gpt-5.5` | 41,0% | 78,1% |

## Fontes

- BRASIL. Inep. **Microdados do ENEM**, edições 2020 a 2025, arquivo `ITENS_PROVA`.
  Campo `CO_HABILIDADE` como gabarito.
- BRASIL. Inep. **Matriz de Referência do ENEM**, estrutura vigente desde 2009.
  5 eixos cognitivos, 4 áreas, 30 competências, 120 habilidades, 35 objetos de conhecimento.
- BRASIL. **Decreto nº 12.915, de 30 de março de 2026**, que integra o ENEM ao Saeb.
- BRASIL. **Lei nº 15.388, de 14 de abril de 2026**, Plano Nacional de Educação 2026 a 2036.
- BRASIL. Inep. **Nota Informativa do Ideb 2025**.
- BRASIL. MEC. **Portaria nº 382, de 22 de maio de 2025**.

Cadeia normativa verificada em fonte oficial em 12 de outubro de 2026.

## Como o painel foi construído

A pasta `build/` traz o pipeline. **Nenhum número foi digitado à mão no HTML.**

| Arquivo | Papel |
|---|---|
| `build/dados.json` | agregados extraídos por script dos arquivos de resultado dos experimentos |
| `build/head.html` | tokens de cor e folha de estilo, com tema claro e escuro |
| `build/icons.html` | 30 ícones autorais em SVG inline |
| `build/body.html` | a narrativa e os diagramas estáticos |
| `build/script.js` | os oito gráficos, gerados em SVG a partir do `dados.json` |

Cada número citado na prosa é preenchido em tempo de execução a partir do mesmo `dados.json` que
desenha os gráficos, pelo atributo `data-f`. Texto e gráfico não podem divergir.

Sem bibliotecas externas: SVG gerado em JavaScript puro, dados embutidos, fontes do sistema.
A paleta foi verificada por script para daltonismo e contraste nos modos claro e escuro.

## O que esta bancada não permite dizer

- **Não é padrão-ouro sobre material didático.** Mede itens de prova, que são outro objeto.
- **Não mede utilidade pedagógica.** Mede concordância com uma atribuição documental.
- **Não autoriza ranquear fornecedores.** Uma tarefa, uma edição, um conjunto de candidatas,
  modelos em snapshots datados.
- **Não há inferência causal.** A ordem das configurações é o que se observou nesta bancada.
- **Não antecipa a regra de transição** do ENEM no Saeb nem a fórmula do índice sucessor do Ideb:
  ambas estão em definição.
- **A Forma C não é comparável ponto a ponto** com as demais: é a única que constrói centroides a
  partir de itens, e por isso é medida com edição retida.

---

Trabalho final da disciplina **Storytelling de Dados e Business Intelligence Aplicado ao Setor
Público**, Mestrado Profissional em Administração Pública, IDP.
Autor: Mairton Damasceno.

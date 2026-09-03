# Fontes do site

O site usa duas fontes compradas — **Dreaming Outloud Sans** (fonte principal, usada em quase tudo) e **Fabello** (usada só no texto corrido dos capítulos do livro). Como são fontes pagas, os arquivos não vêm neste projeto — você precisa adicionar os seus, que já têm licença para uso web.

Enquanto os arquivos não estiverem aqui, o site usa **Quicksand** e **EB Garamond** (gratuitas, via Google Fonts) como substitutas temporárias, então nada quebra — só o visual final muda quando você adicionar as fontes de verdade.

## Onde colocar os arquivos

```
assets/fonts/
├── DreamingOutloudSans/
│   ├── DreamingOutloudSans-Regular.woff2
│   ├── DreamingOutloudSans-Regular.woff   (opcional, reforço de compatibilidade)
│   └── DreamingOutloudSans-Bold.woff2
└── Fabello/
    └── Fabello-Regular.woff2
```

Os nomes dos arquivos precisam ser exatamente esses — eles já estão referenciados em `assets/css/style.css` (procure por `@font-face`).

## Como conseguir os arquivos `.woff2`

Se você só tem o `.ttf` ou `.otf` da fonte (formato comum quando se compra numa loja como Creative Fabrica ou Fontspring), pode converter para `.woff2` gratuitamente em um conversor como [cloudconvert.com/ttf-to-woff2](https://cloudconvert.com/ttf-to-woff2) — só confira se a licença da fonte permite uso em web (a maioria das lojas vende uma licença separada "web font").

## Sobre a Fabello no texto do livro

A Fabello é uma fonte manuscrita/script. Ela fica muito bonita em títulos e trechos curtos, mas em parágrafos longos pode cansar a leitura — por isso o site já aumenta um pouco o espaçamento entre linhas nas páginas do livro para compensar. Vale abrir o site depois de colocar a fonte de verdade e ler um capítulo inteiro para sentir se o tamanho está confortável; se precisar, ajuste `font-size` em `.page-inner` no `style.css`.

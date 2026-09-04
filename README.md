# Fontes do site

O site usa uma fonte comprada — **Dreaming Outloud Sans** — como fonte principal (títulos, botões, navegação, praticamente tudo). Como é uma fonte paga, o arquivo não vem neste projeto — você precisa adicionar o seu, que já tem licença para uso web.

Enquanto o arquivo não estiver aqui, o site usa **Quicksand** (gratuita, via Google Fonts) como substituta temporária, então nada quebra — só o visual final muda quando você adicionar a fonte de verdade.

Os três livros (principal, anotações e ilustrações) são todos em PDF, então o texto de dentro deles usa a fonte que estiver no próprio arquivo PDF — não depende de nada aqui.

## Onde colocar o arquivo

```
assets/fonts/
└── DreamingOutloudSans/
    ├── DreamingOutloudSans-Regular.woff2
    ├── DreamingOutloudSans-Regular.woff   (opcional, reforço de compatibilidade)
    └── DreamingOutloudSans-Bold.woff2
```

Os nomes dos arquivos precisam ser exatamente esses — eles já estão referenciados em `assets/css/style.css` (procure por `@font-face`).

## Como conseguir os arquivos `.woff2`

Se você só tem o `.ttf` ou `.otf` da fonte (formato comum quando se compra numa loja como Creative Fabrica ou Fontspring), pode converter para `.woff2` gratuitamente em um conversor como [cloudconvert.com/ttf-to-woff2](https://cloudconvert.com/ttf-to-woff2) — só confira se a licença da fonte permite uso em web (a maioria das lojas vende uma licença separada "web font").

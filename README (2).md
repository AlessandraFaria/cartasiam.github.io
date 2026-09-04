# Pasta `illustrations/`

Coloque aqui os arquivos PDF das ilustrações do livro.

Depois de adicionar um PDF, cadastre-o em `manifest.json` nesta mesma pasta, na ordem em que deve aparecer no livro:

```json
[
  { "id": "ilustracao-01", "title": "Capa alternativa", "file": "ilustracao-01.pdf" },
  { "id": "mapa-do-mundo", "title": "Mapa do mundo da história", "file": "mapa-do-mundo.pdf" }
]
```

- `id`: identificador único, sem espaços — usado na URL (`ilustracoes.html#ilustracao-01`).
- `title`: nome que aparece no seletor de documentos.
- `file`: nome exato do arquivo PDF dentro desta pasta.

Cada página do PDF vira uma página do livro folheável automaticamente — não precisa converter nada.

# Pasta `notes/`

Coloque aqui os arquivos PDF das anotações da autora.

Depois de adicionar um PDF, cadastre-o em `manifest.json` nesta mesma pasta, na ordem em que deve aparecer no livro:

```json
[
  { "id": "caderno-01", "title": "Caderno de ideias", "file": "caderno-01.pdf" },
  { "id": "carta-leitores", "title": "Carta para quem está lendo", "file": "carta-leitores.pdf" }
]
```

- `id`: identificador único, sem espaços — usado na URL (`anotacoes.html#caderno-01`).
- `title`: nome que aparece no seletor de documentos.
- `file`: nome exato do arquivo PDF dentro desta pasta.

Cada página do PDF vira uma página do livro folheável automaticamente — não precisa converter nada.

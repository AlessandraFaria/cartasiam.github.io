# Pasta `book/`

Coloque aqui o arquivo PDF do livro "Cartas para Iam".

Depois de adicionar o PDF, cadastre-o em `manifest.json` nesta mesma pasta:

```json
[
  { "id": "cartas-para-iam", "title": "Cartas para Iam", "file": "cartas-para-iam.pdf" }
]
```

- `id`: identificador único, sem espaços — usado na URL (`livro.html#cartas-para-iam`).
- `title`: nome que aparece no seletor, caso você adicione mais de um arquivo (por exemplo, separar o livro em volumes).
- `file`: nome exato do arquivo PDF dentro desta pasta.

Cada página do PDF vira uma página do livro folheável automaticamente — não precisa converter nada. Os comentários dos leitores ficam por página (a pessoa comenta a página que está lendo, e o comentário aparece pra quem abrir essa mesma página depois).

Se o seu PDF já tem uma página de capa como primeira página, ela vai aparecer normalmente como a primeira página do livro — não precisa fazer nada especial.

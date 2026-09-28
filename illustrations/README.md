# Pasta `illustrations/`

Coloque aqui os arquivos PDF das ilustrações do livro. Diferente do livro e dos cadernos, as ilustrações aparecem como uma **galeria**: todas as páginas de todos os PDFs cadastrados juntas numa grade só, na página `ilustracoes.html`. Clicar numa miniatura abre ela ampliada, com zoom e navegação entre as ilustrações.

Você pode colocar cada ilustração como um PDF de uma página só, ou juntar várias num único PDF — os dois formatos funcionam, porque cada página de cada PDF vira uma miniatura separada na galeria.

Depois de adicionar um PDF, cadastre-o em `manifest.json` nesta mesma pasta, na ordem em que deve aparecer na galeria:

```json
[
  { "id": "ilustracao-01", "title": "Capa alternativa", "file": "ilustracao-01.pdf" },
  { "id": "mapa-do-mundo", "title": "Mapa do mundo da história", "file": "mapa-do-mundo.pdf" }
]
```

- `id`: identificador único, sem espaços.
- `title`: usado só como texto alternativo da imagem (acessibilidade), não aparece na tela.
- `file`: nome exato do arquivo PDF dentro desta pasta.

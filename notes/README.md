# Pasta `notes/`

Aqui ficam os cadernos de anotações da autora — um arquivo PDF por caderno. Cada um vira uma capa clicável na estante de "Anotações da Autora"; a pessoa clica na capa pra abrir aquele caderno específico.

É pra você ir adicionando aos poucos: sempre que tiver um caderno novo, é só repetir os dois passos abaixo.

1. Coloque o arquivo `.pdf` nesta pasta.
2. Cadastre-o em `manifest.json`, na ordem em que os cadernos devem aparecer na estante:

```json
[
  { "id": "caderno-01", "title": "Caderno de ideias", "file": "caderno-01.pdf" },
  { "id": "carta-leitores", "title": "Carta para quem está lendo", "file": "carta-leitores.pdf" }
]
```

- `id`: identificador único, sem espaços — usado na URL (`anotacoes.html#caderno-01`).
- `title`: o nome que aparece escrito na capa do caderno, na estante.
- `file`: nome exato do arquivo PDF dentro desta pasta.

Cada página do PDF vira uma página folheável (com rolagem e zoom) dentro daquele caderno — não precisa converter nada. Pra voltar pra estante de cadernos, tem um link "← cadernos" no topo, dentro de qualquer caderno aberto.

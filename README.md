# Cartas para Iam — site

Um livro que se folheia no navegador, com dois volumes ao lado: as anotações da autora e as ilustrações, ambos em PDF. Qualquer pessoa pode selecionar um trecho do texto (ou uma página de PDF) e deixar um comentário público e anônimo, que fica visível para quem visitar depois.

Feito para ser hospedado de graça no **GitHub Pages** — não precisa de servidor próprio.

## Identidade visual

- **Cor de fundo**: `#F1C9D2` (o rosa da arte da página inicial) — é o fundo do site inteiro, inclusive dentro dos leitores. As páginas do livro em si continuam num papel creme (`#FFFDD0`), pra parecer um livro de verdade pousado sobre o fundo rosa.
- **Imagem de topo da página inicial**: `assets/img/hero-capa.jpg` — a arte com o título, o laço e os elementos decorativos. Pra trocar, substitua o arquivo (mesmo nome) ou atualize o `src` em `index.html`. O título e o subtítulo também existem como texto real (invisível, sobre a imagem) para acessibilidade e buscadores — atualize os dois em conjunto se mudar o texto.
- **Capa do livro**: a imagem real está em `assets/img/capa-livro.jpg`.
- **Acentos**: bordô `#540418` (títulos, botões, capa), rust `#9C4C33` (caderno de anotações) e dourado `#B8925A` (frisos), todos tirados das referências que você mandou.
- **Fontes**: Dreaming Outloud Sans (principal, usada em quase tudo) e Fabello (só no texto corrido dos capítulos). Como são fontes pagas, veja `assets/fonts/README.md` para o passo a passo de como adicioná-las — até lá, o site usa Quicksand e EB Garamond como visual temporário, então nada quebra.

## Estrutura das pastas

```
├── index.html              → estante com os três volumes
├── livro.html               → leitor do livro principal
├── anotacoes.html            → leitor das anotações da autora (PDF)
├── ilustracoes.html          → leitor das ilustrações (PDF)
│
├── chapters/                 ← VOCÊ EDITA: capítulos do livro principal
│   ├── manifest.json          (lista os capítulos, em ordem)
│   ├── 01-prologo.md
│   └── 02-capitulo-um.md
│
├── notes/                    ← VOCÊ EDITA: PDFs das anotações da autora
│   ├── manifest.json
│   └── (seus arquivos .pdf aqui)
│
├── illustrations/            ← VOCÊ EDITA: PDFs das ilustrações
│   ├── manifest.json
│   └── (seus arquivos .pdf aqui)
│
├── assets/                   (css, javascript, bibliotecas — não precisa mexer)
└── firestore.rules           (regras de segurança do banco de comentários)
```

## Como adicionar um capítulo ao livro principal

1. Crie um arquivo `.md` dentro de `chapters/`, escrito em Markdown normal (`##` para título, parágrafos separados por linha em branco, `*itálico*`, `**negrito**`, `> citação`).
2. Adicione uma linha em `chapters/manifest.json` apontando pra ele, na ordem em que deve aparecer:
   ```json
   { "id": "capitulo-dois", "title": "Capítulo Dois", "file": "03-capitulo-dois.md" }
   ```
3. Pronto — o site divide o texto em páginas automaticamente, não importa o tamanho do capítulo.

## Como adicionar PDFs (anotações ou ilustrações)

1. Coloque o arquivo `.pdf` dentro de `notes/` ou `illustrations/`.
2. Cadastre-o no `manifest.json` da mesma pasta. Veja o `README.md` dentro de cada uma delas para o formato exato.

Cada página do PDF vira uma página folheável — nenhuma conversão manual é necessária.

## Configurar o banco de comentários

Os comentários são anônimos (sem login) e públicos — para isso funcionar em um site estático como este, eles precisam de um banco de dados à parte. Usamos o **Firebase Firestore**, que tem um plano gratuito generoso e não exige cartão de crédito para começar.

### Passo 1 — criar o projeto
1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e clique em **"Adicionar projeto"**.
2. Dê um nome e conclua a criação (pode desativar o Google Analytics, não é necessário).

### Passo 2 — ativar o Firestore
1. No menu à esquerda, vá em **Build → Firestore Database**.
2. Clique em **"Criar banco de dados"**.
3. Escolha **modo de produção** e a região mais próxima de você.

### Passo 3 — colar as regras de segurança
1. Ainda no Firestore, abra a aba **"Regras"**.
2. Apague o conteúdo e cole o de `firestore.rules` (está neste projeto).
3. Clique em **"Publicar"**.

Essas regras permitem que qualquer visitante leia e crie comentários, mas ninguém pode editar ou apagar o comentário de outra pessoa.

### Passo 4 — pegar as chaves do projeto
1. Clique na engrenagem (⚙) → **"Configurações do projeto"**.
2. Em **"Seus apps"**, clique no ícone `</>` (Web) para registrar um app.
3. Dê um apelido qualquer e clique em **"Registrar app"**.
4. Copie o objeto `firebaseConfig` que aparece.

### Passo 5 — colar no site
Abra `assets/js/firebase-config.js` e substitua os valores de exemplo pelos que você copiou:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Salve, suba pro GitHub, e os comentários já funcionam.

> **Enquanto isso não for preenchido**, o site funciona normalmente para leitura, mas os comentários mostram um aviso de que o banco ainda não foi configurado.

### Sobre spam e moderação
As regras do passo 3 limitam o tamanho do texto e impedem edição/exclusão por terceiros, mas não têm um filtro de conteúdo — qualquer pessoa com o link pode comentar. Se o livro for ficar público por muito tempo, vale considerar mais adiante:
- Ativar o **Firebase App Check** (reduz comentários de bots/scripts).
- Apagar comentários indesejados manualmente pelo painel do Firestore (Console → Firestore Database → coleção `comments`).

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e suba todos os arquivos deste projeto (a raiz do repositório deve conter `index.html`).
2. No repositório, vá em **Settings → Pages**.
3. Em **"Source"**, selecione a branch principal (`main`) e a pasta `/ (root)`.
4. Salve. Em alguns minutos o site estará em `https://seu-usuario.github.io/nome-do-repositorio/`.

Sempre que você adicionar um capítulo ou um PDF, basta enviar (`git push`) as mudanças — o GitHub Pages atualiza sozinho.

## Como funciona (por trás dos panos)

- **Folhear páginas**: biblioteca `page-flip`, incluída localmente em `assets/vendor/`.
- **Markdown → texto do livro**: biblioteca `marked`, também local.
- **PDFs → páginas**: `pdf.js`, renderiza cada página do PDF como imagem no navegador de quem visita — não precisa de conversão prévia.
- **Comentários**: cada trecho selecionado é salvo com a posição exata dentro do parágrafo (não o texto inteiro da seleção), então o grifo reaparece no lugar certo para todo mundo, em qualquer tamanho de tela.
- Nenhuma dessas bibliotecas depende de internet além do próprio GitHub Pages — só as fontes (Google Fonts) e o Firebase precisam de conexão externa.

## Limitações conhecidas
- Se dois trechos idênticos aparecerem no mesmo parágrafo, o grifo pode ir para o primeiro deles.
- Comentários em PDF são por página inteira (não por trecho específico da página), já que PDFs viram imagem.
- Não há painel de moderação além do Console do Firebase.

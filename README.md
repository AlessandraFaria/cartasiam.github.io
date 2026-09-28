# Cartas para Iam — site

Três volumes que abrem no navegador — o livro principal, os cadernos de anotações da autora e a galeria de ilustrações — todos a partir de PDFs. Qualquer pessoa pode comentar a página (ou ilustração) que está vendo, e o comentário fica público e visível para quem visitar depois.

Feito para ser hospedado de graça no **GitHub Pages** — não precisa de servidor próprio.

## Como é cada volume

- **Livro** (`livro.html`): leitor de rolagem contínua com zoom, como um leitor de PDF simples — vai descendo pelas páginas do livro.
- **Anotações da autora** (`anotacoes.html`): uma **estante de cadernos**. Cada PDF cadastrado em `notes/` vira uma capa clicável; clicar abre aquele caderno no mesmo leitor de rolagem com zoom do livro. É pensado pra você ir adicionando cadernos novos aos poucos.
- **Ilustrações** (`ilustracoes.html`): uma **galeria**. Todas as páginas de todos os PDFs cadastrados em `illustrations/` aparecem juntas numa grade de miniaturas; clicar numa delas abre um visualizador ampliado com zoom e navegação entre as ilustrações.

## Identidade visual

- **Cor de fundo**: `#F1C9D2` (o rosa da arte da página inicial) — é o fundo do site inteiro, inclusive dentro dos leitores.
- **Imagem de topo da página inicial**: `assets/img/hero-capa.jpg` — a arte com o título, o laço e os elementos decorativos. Pra trocar, substitua o arquivo (mesmo nome) ou atualize o `src` em `index.html`. O título e o subtítulo também existem como texto real (invisível, sobre a imagem) para acessibilidade e buscadores — atualize os dois em conjunto se mudar o texto.
- **Capa do livro** (usada só na estante da página inicial): a imagem real está em `assets/img/capa-livro.jpg`.
- **Acentos**: bordô `#540418` (títulos, botões, capa), rust `#9C4C33` (cadernos de anotações) e dourado `#B8925A` (frisos), todos tirados das referências que você mandou.
- **Fonte**: Dreaming Outloud Sans (principal, usada em quase tudo, ainda precisa dos arquivos — veja `assets/fonts/README.md`). O texto de dentro dos PDFs usa a fonte que estiver em cada arquivo.

## Estrutura das pastas

```
├── index.html                → estante com os três volumes
├── livro.html                 → leitor do livro principal (rolagem + zoom)
├── anotacoes.html              → estante de cadernos de anotações
├── ilustracoes.html            → galeria de ilustrações
│
├── book/                      ← VOCÊ EDITA: PDF do livro principal
│   ├── manifest.json
│   └── (seu arquivo .pdf aqui)
│
├── notes/                     ← VOCÊ EDITA: um PDF por caderno de anotações
│   ├── manifest.json
│   └── (seus arquivos .pdf aqui)
│
├── illustrations/             ← VOCÊ EDITA: PDFs das ilustrações (viram a galeria)
│   ├── manifest.json
│   └── (seus arquivos .pdf aqui)
│
├── assets/                    (css, javascript, bibliotecas — não precisa mexer)
└── firestore.rules            (regras de segurança do banco de comentários)
```

## Como adicionar um PDF (livro, cadernos ou ilustrações)

1. Coloque o arquivo `.pdf` dentro de `book/`, `notes/` ou `illustrations/`, dependendo de qual dos três volumes é.
2. Cadastre-o no `manifest.json` da mesma pasta. Veja o `README.md` dentro de cada uma delas para o formato exato.

Cada página do PDF vira uma página (ou, no caso das ilustrações, uma miniatura na galeria) automaticamente — nenhuma conversão manual é necessária.

## Como funcionam os comentários

Em qualquer um dos três volumes, quem estiver lendo pode escrever um comentário sobre a página (ou ilustração) em que está — o comentário aparece pra todo mundo que abrir essa mesma página depois (não precisa de login, é público e anônimo). O botão **"margens"** na lateral direita abre o painel de comentários. Na galeria de ilustrações, esse botão só aparece com uma ilustração aberta no visualizador ampliado.

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

Sempre que você adicionar ou trocar um PDF, basta enviar (`git push`) as mudanças — o GitHub Pages atualiza sozinho.

## Como funciona (por trás dos panos)

- **PDFs → imagens**: `pdf.js`, renderiza cada página do PDF no navegador de quem visita — não precisa de conversão prévia.
- **Rolagem com zoom** (livro e cadernos): `assets/js/reader-scroll-core.js` — um núcleo compartilhado entre o livro e cada caderno individual.
- **Galeria** (ilustrações): `assets/js/reader-gallery.js` — junta as páginas de todos os PDFs cadastrados numa grade só.
- Nenhuma dessas bibliotecas depende de internet além do próprio GitHub Pages — só as fontes (Google Fonts) e o Firebase precisam de conexão externa.

## Limitações conhecidas
- Comentários são por página inteira (não por trecho específico dela), já que os PDFs viram imagem.
- Não há painel de moderação além do Console do Firebase.

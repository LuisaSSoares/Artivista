// --- Função para selecionar elementos do dom -> simplifica o querySelector
// qs (querySelector) recebe um seletor CSS (classes, ids, tags) e o root(basicamente onde o elemento está sendo procurado, chamando o elemento raíz (divs, sections...)) 
// Se o root não é informado, a função usa o document, ou seja, busca em todas as páginas que tem o elemento.
const qs = (sel, root = document) => root.querySelector(sel);
let page //identifica e página atual . Foi usado principalmente para aplicar o efeito da navBar e menu (se user tiver no index.html ou no feed, "home" ainda estará destacada porque o feed é uma parte da página principal).Páginas dentro de um identificador único
document.addEventListener('DOMContentLoaded', () => { 
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase() //pega caminho da url e as divide em partes pelo / (se arquivo tiver dentro de uma pasta, ele separa a pasta do arquivo por esse caractere). Se não tiver nada, retorna index.html como padrão. transforma o resultado em letras minusculas
    page =
    (file === 'index.html' || file === 'feed.html') ? 'home' : //verifica se file é igual a index.html ou feed.html. "?" (optional change) é basicamente um atalho de if/else, no qual significa que, se a condição atribuída for verdadeira, o resultado vai ser "home". ":" determina o que acontece caso for falso.
    file.includes('eventosecursos') ? 'eventos' :
    file.includes('contrateartista') ? 'contrate' :
    file.includes('perfil') ? 'perfil' :
    file.includes('conversas') ? 'conversas' :
    file.includes('configuracoes') ? 'configuracoes' :
    'home'

    //Mostra o botão de add conteúdo apenas aos artistas. É recuperado da variável "usuários" dentro do localStorage salvo após o cadastro/login as informações do usuário. Se seu tipo for "artista", o botão é visível.
      const infosUser = JSON.parse(localStorage.getItem('usuario'));
      if (infosUser && infosUser.userType === 'artista') {
        const addContent = document.getElementById('addContent')
        if (addContent) addContent.style.visibility = 'visible'
      }

      
      //Recebe "filename", que é o nome atribuído a configuração no arquivo multer.js do backend
      //O Multer é responsável por salvar as fotos no servidor, e o nome do arquivo é guardado no banco de dados
      //Se filename existir, ele retorna o caminho em que ele foi salvo. Caso contrário, permanece com o icone padrão de perfil (arquivo svg)
      const buildProfileUrl = (filename) =>
      filename ? `http://localhost:3520/uploads/profile/${filename}` : './icons/person-circle.svg';

      // --- Função que vai receber a url completa do endereço da imagem e inseri-la no menu (barra lateral)
      function setSideProfileIcon(url){
      const secPerfil = Array.from(document.querySelectorAll('.navSections')) //pega todas as seções do menu lateral (navSection) e as salva em um Array, para poder usar o .find
        .find(sec => sec.querySelector('a[href$="perfil.html"]')); //procura e devolve a primeira página da seção que tenha perfil.html ($=atributo do href). Como resultado, secPerfil é a primeira sessão que recebe perfil.html
      const imgMenu = secPerfil?.querySelector('div > img');  //busca o campo de img na div apenas se secPerfil existir. Como resultado, imgMenu é a img do avatar do menu
      if (!imgMenu) return; //se não for encontrada nenhuma imagem salva nessa variável, é saído da função para não correr riscos de acabar mexendo em algo inexistente
      imgMenu.src = url; //Coloca a URL recebida no src da imagem para exibi-la no menu
      if (url && !/person-circle\.svg$/i.test(url)) { //
        imgMenu.classList.add('avatarIcon');  //Caso a URL existir e não for a do ícone padrão, adiciona a classe avatarIcon para aplicar o estilo de foto real. (o i ignora as letras mauisculas e minusculas). A condicional vai continuar se existir url que não termine com o nome do svg
      } else {
        imgMenu.classList.remove('avatarIcon'); //se não existir, é removido a classe
      }
      }
       setSideProfileIcon(buildProfileUrl(infosUser?.profileImage)); //Chama a função novamente, que recebe a url a partir do  profileImage (filename) do localStorage e envia para exibição
      

       // --- Função para mudar texto de inicio conforme pagina que o usuário está
      const inicioLink = document.querySelector('.navSections a[href="./index.html"]') 
      if (inicioLink) {
        const isCriacao = file.includes('criacaoconteudo') //Se user tiver em uma pagina que inclua "criação conteudo", o texto do link do menu altera para "Voltar ao início"
        inicioLink.textContent = isCriacao ? 'Voltar ao início' : 'Início'
      }

      //Atributos e condicional para entrar na plataforma sem login (ao clicar no link correspondente, é salvo localStorage que o tipo do user é guess, e é removido qualquer associação ao usuário anterior)
      const meuPerfilLink = document.querySelector('a[href="./perfil.html"]');
      const userType = localStorage.getItem('userType');
  
      if (meuPerfilLink) {
        meuPerfilLink.addEventListener('click', function(event) {
          if (userType === 'guest') {
            event.preventDefault(); // Impede o redirecionamento
            // Exibe o modal
            const guestLoginModal = new bootstrap.Modal(document.getElementById('guestLoginModal'));
            guestLoginModal.show(); //Modal para fazer login ou cadastro é exibido
          }
        });
      }

    //Recupera valor de page pra adicionar o efeito de exibição da página, aplicando o efeito correspondente a presença nela (estilização de menu ativo é adicionada)
    const menuLinks = document.querySelectorAll('.navSections a');
    if (menuLinks.length) { //verifica se menuLinks não está vazio
      // 0=Início, 1=Minha conta, 2=Conversas, 3=Notificações, 4=Configurações
      menuLinks.forEach(a => a.classList.remove('active')); //percorre por todos os links encontrados (variável "a" representa cada link individualmente), remove o active de todos para que mantenha o fluxo de apenas uma página (a que está aberta)
  
      if (['home', 'eventos', 'contrate'].includes(page)) {
        // Se 'page' for 'home', 'eventos' ou 'contrate', adiciona a classe 'active'
        menuLinks[0]?.classList.add('active'); //Primeiro link do menu (início) é destacado (como forma padrão)
      } else if (page === 'perfil') {
        menuLinks[1]?.classList.add('active');
      } else if (page === 'conversas') {
        menuLinks[2]?.classList.add('active');
      } else if (page === 'configuracoes') {
        menuLinks[3]?.classList.add('active');
      }
    }

    //Seções correspondentes a de um perfil comum e de artista na página de perfil
    const secComum   = document.getElementById('perfilComum');
    const secArtista = document.getElementById('perfilArtista');
  
    if (secComum || secArtista) { //se o perfil de um dos dois existir, pega o id da URL, caso não tenha, pega o id do usuário logado no localStorage
      const viewedId =
        new URLSearchParams(location.search).get('id') ||
        (infosUser && infosUser.id);
  
      const setText = (el, txt) => { if (el) el.textContent = txt; }; //Função arrow que  armaneza um elemento (el) e o texto que quero inserir (txt). Se elemento existir, altera o conteúdo de texto desse elemento usando .textContent = txt
      const imgSrc = (filename) =>
        filename ? `http://localhost:3520/uploads/profile/${filename}` : './icons/person-circle.svg'; //Busca a filename (nome do arquivo). Se ele existir, retorna a URL completa para buscar a imagem no servidor
  
      const plataformaNome = {  //objeto de mapeamento para exibir apenas o nome do site/plataforma/aplicativo ao invés do seu link
        "instagram.com": "Instagram",
        "youtube.com": "YouTube", "youtu.be": "YouTube",
        "behance.net": "Behance",
        "facebook.com": "Facebook",
        "twitter.com": "Twitter", "x.com": "Twitter (X)",
        "linkedin.com": "LinkedIn",
        "soundcloud.com": "SoundCloud",
        "tiktok.com": "TikTok",
        "vimeo.com": "Vimeo",
        "bandcamp.com": "Bandcamp",
        "artstation.com": "ArtStation",
        "pinterest.com": "Pinterest", "br.pinterest.com": "Pinterest",
        "deviantart.com": "DeviantArt",
        "github.io": "Portfólio",
        "medium.com": "Medium",
        "notion.so": "Notion",
        "cargocollective.com": "Cargo",
        "wordpress.com": "WordPress",
        "canva.com": "Canva",
        "spotify.com": "Spotify",
        "apple.com": "Apple Music", "music.apple.com": "Apple Music",
        "deezer.com": "Deezer",
        "tidal.com": "Tidal",
        "amazon.com": "Amazon Music", "music.amazon.com": "Amazon Music",
        "audible.com": "Audible",
        "napster.com": "Napster",
        "youtube-music.com": "YouTube Music",
        "music.youtube.com": "YouTube Music",
        "wattpad.com": "Wattpad",
        "scribd.com": "Scribd",
        "smashwords.com": "Smashwords",
        "lulu.com": "Lulu",
        "kdp.amazon.com": "KDP",
        "bookfunnel.com": "BookFunnel",
        "inkitt.com": "Inkitt",
        "dribbble.com": "Dribbble",
        "coroflot.com": "Coroflot",
        "carbonmade.com": "Carbonmade",
        "portfolio.adobe.com": "Adobe Portfolio",
        "fabrik.io": "Fabrik",
        "crevado.com": "Crevado"
      };

      // --- Função que recebe uma host da url completa
      function nomeDaPlataforma(url) { 
        try {
          const host = new URL(url).hostname.replace(/^www\./, ''); //transformando de uma string URL em um objeto URL para extrair partes dela. Com o hostname (recuperado da função de obter o nome da plataforma no artista.js), ele remove o www do incio dela usando regex (^)
          return plataformaNome[host] || host; //Verifica se o domínio (host) existe como chave no objeto plataformaNome. Se existir, retorna o nome amigável (salvo no mapeamento)
        } catch {
          return "Link externo"; //Se der erro, retorna como "link externo"
        }
      }

      //--- Função que monta a exibição de links externos do perfil com ícone e nome da plataforma) dentro do container de infos do perfil. 
      function renderLinksExternos(root, links = []) { //root é o perfil dos artista e links são os links externos (array)
        const wrap = qs('#externalLinksContainer', root); //recupera o elemento que armazena o seletor externaLlinksContainer (o perfil do artista)
        if (!wrap) return; //Saída rápida: se o contêiner não existe, não faz nada (evita erro).
  
        wrap.innerHTML = '';  //Zera o conteúdo atual do contêiner para evitar itens duplicados
        links.forEach(url => { //dentro de links, procura uma por uma url. Se não achar, a função sai.
          if (!url) return;

          //cria elemento a (link) dentro do JS 
          const a = document.createElement('a'); 
          a.href = url; //aponta para a URL.
          a.target = '_blank'; //abre em nova aba.
          a.rel = 'noopener noreferrer'; //segurança (evita “tabnabbing” e vazamento de window.opener), de modo a evitar que sites externos mexam ou roubem informações da aba original.
          a.className = 'linkItem'; //aplica estilo via CSS (classe linkItem)

          //cria elemento img (imagem) dentro do JS 
          const img = document.createElement('img'); 
          img.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`; //efine o endereço da imagem (src), usando o serviço do Google que retorna o favicon (ícone) de qualquer site, passando o domínio do link, garantido que seja passada em formato seguro. 
          img.alt = ''; //alt como atributo vazio

          //estilizações
          img.style.width = '16px'; 
          img.style.height = '16px';
          img.style.marginRight = '8px';
  
          const span = document.createElement('span'); //cria texto com o nome amigável da plataforma
          span.textContent = nomeDaPlataforma(url); //chama função e armazena url

          //Coloca a imagem (ícone) dentro do link <a>
          //Coloca o texto (nome da plataforma) dentro do link <a>, logo após a imagem
          //Insere o link completo (<a> com ícone e texto) dentro do container #externalLinksContainer 
          a.appendChild(img); 
          a.appendChild(span);
          wrap.appendChild(a);
        });
      }
      
      // --- Função para renderizar perfil entre comum e artista com base nas infos do perfil (data)
      function renderProfile(data) {
        const isArtist = data?.userType === 'artista' || data?.activity1 || data?.activity2; //guarda tipo de user artista ou suas atividades

        //Se as duas seções existirem, é escondido o container de user comum no isArtist. Se a seção for de artista, não é escondido o container.
        if (secComum && secArtista) {
          secComum.hidden   = isArtist;
          secArtista.hidden = !isArtist;
        }

        //Define a "raiz" (root) onde os elementos serão preenchidos. Se for artista, usa o container do artista, se não usa o do user comum
        const root = isArtist ? secArtista : secComum;
        if (!root) return; //Se não encontrar o container, para a função

        // Preenche o nome, username e bio.
        setText(qs('#nomeUsuario', root), data?.name || 'Usuário'); //Busca dentro do root o ID, pega o nome do user logado no data e substitui o texto. Caso não existir, mantém o 'Usuário"
        setText(qs('#username', root), data?.userName ? '@' + data.userName : '@usuario'); 
        setText(qs('#bio', root), data?.bio || 'Nenhuma bio adicionada');
  
        const foto = qs('#perfilPhoto', root); //Busca dentro do root o ID e salva na const "fotos"
        const urlFoto = imgSrc(data?.profileImage);  // Monta a URL ou usa padrão
        if (foto) foto.src = urlFoto
        setSideProfileIcon(urlFoto); // Atualiza ícone lateral

        // Se for artista, preenche áreas de atuação e links externos
        if (isArtist) {
          const tag1 = qs('#atuacaoTag .tag--1', root); 
          const tag2 = qs('#atuacaoTag .tag--2', root);
          if (tag1) {
            if (data?.activity1) { //Se existir atividade, coloca o texto da tag salva no data e a deixa visível
               tag1.textContent = data.activity1; tag1.hidden = false; }
            else { tag1.textContent = ''; tag1.hidden = true; }
          }
          if (tag2) {
            if (data?.activity2) 
            { tag2.textContent = data.activity2; tag2.hidden = false; }
            else { tag2.textContent = ''; tag2.hidden = true; }
          }

          //Manda links externos para a função que cria os elementos na tela
          const links = (data?.links && Array.isArray(data.links)) ? data.links : [];
          renderLinksExternos(root, links); 
        }

        //Exibe texto da história da arte //ELEMENTO AINDA A SER APLICADO
        const histP = root.querySelector('.historyContainer p');
        if (histP) {
          histP.textContent = (data?.historia_arte && data.historia_arte.trim())? data.historia_arte: 'Compartilhe sua história com a arte';
          }
          inicializarHistoriaComArte();
        
      }
  
      if (infosUser) { //Se o objeto do localStorage existir, envia todas as chaves dele para a função renderProfile e exibe as informações no perfil.
        renderProfile({
          ...infosUser,
          activity1: infosUser.activity1,
          activity2: infosUser.activity2,
          links: infosUser.links
        });
      }

  
      //Atualiza com dados da API, se houver id para buscar
      if (viewedId) {
        fetch(`http://localhost:3520/profile/${viewedId}`) //Faz uma requisição GET para buscar o perfil do usuário com o ID especificado
          .then(r => r.json()) //converte para JSON 
          .then(json => {
            if (!json?.success || !json?.data) return; //Verifica se a API retornou sucesso e se existe o campo "data". aso contrário, encerra a execução.
            const data = json.data; //Guarda os dados do perfil retornados pela API em uma variável local
            renderProfile({ //chama a função e exibe
              id: data.id,
              name: data.name,
              userName: data.userName,
              email: data.email,
              userType: data.userType,
              bio: data.bio,
              historia_arte: data.historia_arte,
              profileImage: data.profileImage,
              activity1: data.activity1,
              activity2: data.activity2,
              links: [data.link1, data.link2, data.link3].filter(Boolean) //Junta os links externos em um array, removendo valores nulos/vazios
            });
          })
          .catch(err => console.warn('Falha ao carregar perfil:', err));
      }
      if (viewedId) {
        carregarPostagensUsuario(parseInt(viewedId));
        atualizarPostagensCurtidas();
        atualizarComentariosFeitos();
        atualizarContagemFavoritosPorSecao();
      }
    }
// --- Exibe postagens do usuário logado na aba "Postagens" ---
async function carregarPostagensUsuario(userId) {
  const container = document.getElementById('userPostsContainer');
  if (!container) return;

  //Recupera o ID do usuário logado para verificar a propriedade do post
  const infosUser = JSON.parse(localStorage.getItem('usuario'));
  // Converte para número, se existir
  const loggedInUserId = infosUser ? parseInt(infosUser.id) : null;
  // Verifica se o usuário logado é o dono do perfil que está sendo visualizado
  const isOwner = loggedInUserId === userId;

  try {
    const res = await fetch('http://localhost:3520/feed/list');
    const data = await res.json();

    if (!data.success || !data.posts.length) {
      container.innerHTML = `
        <div class="noPublicationSpan">
          <img src="./icons/emoji-frown.svg" alt="">
          <span>Ainda sem postagens.</span>
        </div>`;
      return;
    }

    const postsUsuario = data.posts.filter(p => p.artist.id === userId);

    if (!postsUsuario.length) {
      container.innerHTML = `
        <div class="noPublicationSpan">
          <img src="./icons/brush.svg" alt="">
          <span>Você não tem nenhuma publicação ainda.</span>
        </div>`; // Usei a mensagem e ícone de "perfil.html"
      return;
    }

    container.innerHTML = '';
    // Adiciona a classe photoGrid para garantir o layout correto dos posts do usuário
    container.classList.add('photoGrid'); 

    const videoExtensions = ['mp4', 'mov', 'webm', 'avi'];

    postsUsuario.forEach(post => {
      const previewDesc =
        post.description.length > 80
          ? post.description.slice(0, 80) + '...'
          : post.description;

      const dataFormatada = new Date(post.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      
      const card = document.createElement('div');
      card.classList.add('photoCard');

      let actionButtons = '';
      if (isOwner) {
        actionButtons = `
          <div class="post-actions">
            <button class="edit-post-btn" onclick="editarPost(${post.id}, '${post.title.replace(/'/g, "\\'")}', '${post.description.replace(/'/g, "\\'")}', '${post.artSection}')">
              <img src="./icons/pencil-square.svg" alt="Editar Postagem">
            </button>
            <button class="delete-post-btn" data-post-id="${post.id}" onclick="abrirModalExcluir(${post.id}, '${post.title.replace(/'/g, "\\'")}')">
              <img src="./icons/trash.svg" alt="Excluir Postagem">
            </button>
          </div>
        `;
      }

      // Lógica para posts com carrossel ou mídia única (adaptada do feed.js)
      if (post.media.length === 1) {
          // Caso de Mídia Única
          const file = post.media[0];
          // O .some em `videoExtensions` não é ideal para verificar o final da string, 
          // mas seguiremos a lógica adaptada do feed.js para compatibilidade.
          const isVideo = videoExtensions.some(ext => file.toLowerCase().includes(`.${ext}`));

          card.innerHTML = `
            <div class="mediaContainer">
              ${actionButtons} ${isVideo
                ? `<video src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" controls muted></video>`
                : `<img src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" alt="midia">`}
            </div>
            <div class="photoInfo">
              <span class="dataPost" style="color: #DCEEC8; font-size: 10px">Publicado em ${dataFormatada}</span>
              <h4>${post.title}</h4>
              <p>${previewDesc}</p>
              <div class="postReactPerfil">
              <button class="btn-like" data-id="${post.id}">
                <img src="./icons/heart.svg" class="heart-icon" alt="Curtir">
                <p class="contadorLikes"></p>
              </button>

              <button class="btn-comment" data-id="${post.id}">
              <img src="./icons/chat-dots.svg" class="comment-icon" alt="">
              <p class="contadorComentarios"></p>
              </button>

              <button class="btn-favorite" data-id="${post.id}">
              <img src="./icons/bookmark-star.svg" alt="Favoritar">
              </button>
            </div>
          </div>
            </div>
          `;
      } else {
          // Caso de Múltiplas Mídias (Carrossel)
          const carouselId = `carousel-${post.id}`;
          const midias = post.media
            .map((file, i) => {
              const isVideo = videoExtensions.some(ext => file.toLowerCase().includes(`.${ext}`));
              return `
                <div class="carousel-item ${i === 0 ? 'active' : ''}">
                  ${isVideo
                    ? `<video src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" controls muted></video>`
                    : `<img src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" alt="midia">`}
                </div>`;
            })
            .join('');

          card.innerHTML = `
            <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
            ${actionButtons}<div class="carousel-inner">${midias}</div>
              <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon"></span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                <span class="carousel-control-next-icon"></span>
              </button>
            </div>
            <div class="photoInfo">
            <span class="dataPost" style="color: #DCEEC8; font-size: 10px">Publicado em ${dataFormatada}</span>
              <h4>${post.title}</h4>
              <p>${previewDesc}</p>
              <div class="postReactPerfil">
              <button class="btn-like" data-id="${post.id}">
                <img src="./icons/heart.svg" class="heart-icon" alt="Curtir">
                <p class="contadorLikes"></p>
              </button>
              <button class="btn-comment" data-id="${post.id}">
              <img src="./icons/chat-dots.svg" class="comment-icon" alt="">
              <p class="contadorComentarios"></p>
              </button>

              <button class="btn-favorite" data-id="${post.id}">
              <img src="./icons/bookmark-star.svg" alt="Favoritar">
              </button>
            </div>
          </div>
            </div>
          `;
      }
      // Fim da lógica de carrossel/mídia única
      
      container.appendChild(card);
      // Atualiza contador de postagens na aba "Postagens"
      const postCountEl = document.getElementById('postCount');
      if (postCountEl) {
        postCountEl.textContent = `(${postsUsuario.length})`;
      }
    });
    if (container.querySelectorAll('.photoCard').length) {
      ativarCurtidasPerfil(); // só ativa curtidas quando os cards já existem no DOM
      atualizarContadoresComentariosPerfil(); // conta comentários de cada post
      atualizarComentariosFeitos(); // conta comentários feitos pelo próprio usuário
      marcarFavoritosPerfil();
      ativarFavoritosPerfil()
    }
  } catch (err) {
    console.error('Erro ao carregar postagens do usuário:', err);
    container.innerHTML = `<p>Erro ao carregar postagens.</p>`;
  }
}


async function ativarCurtidasPerfil() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario.id) return;

  // Buscar posts curtidos pelo usuário logado
  let likedPosts = [];
  try {
    const res = await fetch(`http://localhost:3520/user/${usuario.id}/liked-posts`);
    const data = await res.json();
    if (data.success) likedPosts = data.posts.map(p => p.id);
  } catch (err) {
    console.error("Erro ao carregar curtidas do usuário:", err);
  }

  // Pega todos os botões de curtir do perfil
  const likeButtons = document.querySelectorAll(".btn-like");

  likeButtons.forEach(async (button) => {
    const postId = button.getAttribute("data-id");
    const heartIcon = button.querySelector(".heart-icon");
    const likeCountEl = button.querySelector(".contadorLikes");

    // Atualiza contador de likes
    async function atualizarContador() {
      try {
        const res = await fetch(`http://localhost:3520/post/likes/${postId}`);
        const data = await res.json();
        if (data.success) {
          likeCountEl.textContent = data.likes || 0;
        } else {
          likeCountEl.textContent = "0";
        }
      } catch (err) {
        console.error("Erro ao atualizar contador:", err);
        likeCountEl.textContent = "0";
      }
    }

    // Estado inicial do botão (caso o próprio usuário tenha curtido)
    if (likedPosts.includes(parseInt(postId))) {
      button.classList.add("liked");
    }

    await atualizarContador();

    // Clique no botão
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!usuario || !usuario.id) {
        alert("Você precisa estar logado para curtir postagens.");
        return;
      }

      const isLiked = button.classList.contains("liked");
      heartIcon.classList.add("animate");
      setTimeout(() => heartIcon.classList.remove("animate"), 200);

      try {
        if (isLiked) {
          // Descurtir
          const res = await fetch("http://localhost:3520/post/unlike", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, userId: usuario.id }),
          });
          const data = await res.json();
          if (data.success) {
            button.classList.remove("liked");
            heartIcon.src = "./icons/heart.svg";
            // 🔥 Atualiza imediatamente os dados do perfil
            atualizarPostagensCurtidas();
          }
        } else {
          const res = await fetch("http://localhost:3520/post/like", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, userId: usuario.id }),
          });
          const data = await res.json();
          if (data.success) {
            button.classList.add("liked");
            heartIcon.src = "./icons/heart-fill.svg";
            // 🔥 Atualiza imediatamente os dados do perfil
            atualizarPostagensCurtidas();
          }
        }
      } catch (err) {
        console.error("Erro ao curtir/descurtir:", err);
      }

      atualizarContador();
      atualizarPostagensCurtidas();
    });
  });
}

async function atualizarPostagensCurtidas() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario.id) return;

  try {
    const res = await fetch(`http://localhost:3520/user/${usuario.id}/liked-posts`);
    const data = await res.json();

    if (data.success) {
      const qtdCurtidas = data.posts.length;
      const camposCurtidas = document.querySelectorAll(".activityContainer .postsReact div:first-child p");
      camposCurtidas.forEach(p => p.textContent = `${qtdCurtidas} post${qtdCurtidas !== 1 ? 'agens' : 'agem'} curtid${qtdCurtidas !== 1 ? 'as' : 'a'}`);
    }
  } catch (err) {
    console.error("Erro ao contar postagens curtidas:", err);
  }
}
//Função que conta o numero de comentarios em um post (no perfil do artista)
async function atualizarContadoresComentariosPerfil() {
  const posts = document.querySelectorAll(".photoCard");

  for (const post of posts) {
    const postId = post.querySelector(".btn-comment")?.getAttribute("data-id");
    const contadorEl = post.querySelector(".contadorComentarios");
    if (!postId || !contadorEl) continue;

    try {
      const res = await fetch(`http://localhost:3520/comments/${postId}`);
      const data = await res.json();

      if (data.success) {
        const total = data.comments.length;
        contadorEl.textContent = total; // sempre mostra 0 se não houver comentários
      } else {
        contadorEl.textContent = "0";
      }
    } catch (err) {
      console.error("Erro ao contar comentários:", err);
      contadorEl.textContent = "0";
    }
  }
}
// --- Atualiza a quantidade total de comentários feitos pelo usuário ---
async function atualizarComentariosFeitos() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario.id) return;

  try {
    const res = await fetch(`http://localhost:3520/comments/user/${usuario.id}`);
    const data = await res.json();
    if (!data.success) return;

    const qtd = data.comments.length; // <- total de comentários (sem deduplicar por post)

    if (qtd > 0) {
      const camposComentarios = document.querySelectorAll(".activityContainer .postsReact div:nth-child(2) p");
      camposComentarios.forEach(p => {
        p.textContent = `${qtd} comentário${qtd !== 1 ? 's' : ''} feito${qtd !== 1 ? 's' : ''}`;
      });
    }
    // se qtd === 0, não mexe no texto (mantém o que já está na tela)
  } catch (err) {
    console.error("Erro ao contar comentários feitos:", err);
  }
}
    const nav = document.querySelector('.navBar');
    if (!nav) return;
    if (nav.dataset.scope === 'perfil') {  //Se se essa navBar for a do perfil (tem data-scope="perfil"), recupera a dataTab (os links de navegação do perfil) e as tabPanel (a seção de conteúdo delas)
        const links = Array.from(nav.querySelectorAll('a[data-tab]'));
        const panels = Array.from(document.querySelectorAll('.tabPanel'));
      
        // Armazena a linha verde debaixo da navBar pra fazer a animação dela pelo espaço
        let indicator = nav.querySelector('.indicator');
        if (!indicator) { //Se não existir, ele cria e salva no elemento filho
          indicator = document.createElement('span');
          indicator.className = 'indicator';
          nav.appendChild(indicator);
        }
      
        // Função que move a barrinha "indicator" para baixo do link da aba informada
        function moveIndicatorTo(link) {
          if (!link) return;
          const navRect = nav.getBoundingClientRect(); // Pega as dimensões/posições da nav e do link relativo à viewport
          const linkRect = link.getBoundingClientRect();
          const left = (linkRect.left - navRect.left) + nav.scrollLeft; // Calcula a posição horizontal do link relativa à nav: (link.left - nav.left) dá o deslocamento do link dentro da nav e nav.scrollLeft corrige caso a nav tenha scroll horizontal
          const width = linkRect.width; // Largura da barrinha deve bater com a largura da aba ativa
          
          // Garante que a barrinha seja posicionada assim que a página carregar
          requestAnimationFrame(() => {
            indicator.style.left = left + 'px';
            indicator.style.width = width + 'px';
          });
        }
      // --- Função para deixar ativo a tab delecionada e atualizar o conteúdo
        function setActive(tabName) {
          // ativa/desativa links
          links.forEach(a => a.classList.toggle('active', a.dataset.tab === tabName));
          // ativa/desativa sessões
          panels.forEach(p => p.hidden = p.dataset.tab !== tabName);
          // move barrinha
          const link = links.find(a => a.dataset.tab === tabName) || links[0];
          moveIndicatorTo(link);

          // --- FECHA curtidos e favoritos ao mudar de aba ---
          const perfilRoot = document.querySelector('#perfilArtista:not([hidden])')
            || document.querySelector('#perfilComum:not([hidden])');
          if (perfilRoot) {
            const likedContainer = perfilRoot.querySelector("#likedPostsContainer");
            const favoritosContainer = perfilRoot.querySelector("#favoritosPorSecaoContainer");
            const aboutProfile = perfilRoot.querySelector(".aboutProfile");

            // Se curtidos estiver aberto, fecha e restaura "sobre"
            if (likedContainer && !likedContainer.hidden) {
              likedContainer.hidden = true;
              if (aboutProfile) aboutProfile.hidden = false;
            }

            // Se favoritos estiver aberto, fecha e restaura "sobre"
            if (favoritosContainer && !favoritosContainer.hidden) {
              favoritosContainer.hidden = true;
              if (aboutProfile) aboutProfile.hidden = false;
            }

            // --- 🔄 Atualiza conteúdo da aba "Sobre" quando ela for reaberta ---
            if (tabName === "sobre") {
              if (typeof atualizarPostagensCurtidas === 'function') atualizarPostagensCurtidas();
              if (typeof atualizarComentariosFeitos === 'function') atualizarComentariosFeitos();
              if (typeof atualizarContagemFavoritosPorSecao === 'function') atualizarContagemFavoritosPorSecao();

              if (favoritosContainer) favoritosContainer.hidden = true;
              if (likedContainer) likedContainer.hidden = true;
              if (aboutProfile) aboutProfile.hidden = false;
            }
          }

        }
        
        // clique nas abas
        nav.addEventListener('click', (e) => {
          const a = e.target.closest('a[data-tab]');  // Pega o elemento "a" mais próximo com atributo data-tab, mesmo que tenha clicado em um filho (ícone, texto etc.)
          if (!a) return;
          e.preventDefault();
          history.replaceState(null, '', '#' + a.dataset.tab); // Atualiza a URL no navegador adicionando a hash da aba clicada (#nomeDaAba), sem recarregar a página (history é um objeto global, conhecido como window.history)
          setActive(a.dataset.tab);  // Ativa visualmente a aba que foi clicada e mostra o conteúdo correspondente
        });
      
        // --- Função que define aba inicial pela URL ou padrão 
        function setFromHash() {
          const tab = (location.hash || '#postagens').slice(1); //Pega a hash atual da URL (ex.: "#postagens"), ou usa "#postagens" se não existir (slice remove o caractere # do início)
          setActive(tab); // Ativa a aba que corresponde ao nome encontrado
        }
      //Mantém a aba ativa atualizada conforme a navegação
        window.addEventListener('hashchange', setFromHash); // Quando o hash da URL muda, atualiza a aba ativa
        requestAnimationFrame(() => requestAnimationFrame(setFromHash)); // Chama setFromHash duas vezes para garantir alinhamento visual no carregamento
        window.addEventListener('resize', setFromHash); // Reposiciona a barrinha caso haja resize na tela
        return; 
      }
      
    const links = Array.from(nav.querySelectorAll('a')); // Pega as navBar de outras páginas
    if (!links.length) return;
    
    //Define qual nav do link vai ser marcado como ativo, baseado na variável 'page'  
    const activeIndex =
      page === 'home' ? 0 :
      page === 'eventos' ? 1 :
      page === 'contrate' ? 2 : 0;
  
    links.forEach((a, i) => a.classList.toggle('active', i === activeIndex)); // Percorre todos os links e adiciona a classe 'active' apenas no link cujo índice é igual a 'activeIndex'

    // Garante a existencia da barrinha no restante das páginas que tenham nav (mesma aplicação da nav do perfil)
    let indicator = nav.querySelector('.indicator');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'indicator';
      nav.appendChild(indicator);
    }
  // --- Função que posiciona a barrinha pra baixo (em paginas que não seja a do perfil)
    function placeIndicator() {
      const link = links[activeIndex]; // Link ativo
      if (!link) return;
      indicator.style.left = link.offsetLeft + 'px';
      indicator.style.width = link.offsetWidth + 'px';
    }
  // Garante que a barrinha seja posicionada assim que a página carregar 
    requestAnimationFrame(() => requestAnimationFrame(placeIndicator));
    window.addEventListener('resize', placeIndicator);

    // --- Função assíncrona para buscar artistas na página de contratação
    const fetchArtists = async () => {
      try {
          const infosUser = JSON.parse(localStorage.getItem('usuario'));
          let url = 'http://localhost:3520/artists/list';
  
          if (infosUser && infosUser.userType === 'artista') {
              url += `?excludeUserId=${infosUser.id}`; //Se o usuário logado também for artista, adiciona parâmetro para não exibir ele mesmo
          }
          const response = await fetch(url);
          const data = await response.json();
  
          if (data.success) {
              const listaContrateArtista = document.getElementById('listaContrateArtista');     
              if (listaContrateArtista) {
                  listaContrateArtista.innerHTML = '';
                  data.data.forEach(artist => { // Para cada artista retornado pela API, retorna seus atributos no card. 
                      const profileImageUrl = artist.profileImage ?
                          `http://localhost:3520/uploads/profile/${artist.profileImage}` :
                          './icons/person-circle.svg';
                      const activity1Html = artist.activity1 ? `<span class="tag tag--1">${artist.activity1}</span>` : '';
                      const activity2Html = artist.activity2 ? `<span class="tag tag--2">${artist.activity2}</span>` : '';
                      const artistCard = `
                          <li>
                              <div class="contrateArtista">
                                  <img class="profileImage" src="${profileImageUrl}" alt="">
                                  <div>
                                    <p class="nomeArtista">${artist.name}</p>
                                    <p class="nomeUserArtista">@${artist.userName || 'nomeusuario'}</p>                                  
                                  </div>
                                  <div class="bioProfileContainer">
                                    <div class="artistAreas">
                                    ${activity1Html}
                                    ${activity2Html}                                    
                                    </div>
                                    <p class="bioArtista">${artist.bio || 'Sem biografia.'}</p>
                                    <button id="perfilArtistButton">
                                    <p>Ver perfil</p>
                                    <img src="./icons/arrow-right-short.svg" alt="">
                                    </button>
                                  </div>
                              </div>
                          </li>
                      `;
                      listaContrateArtista.innerHTML += artistCard; //Adiciona card na lista
                  });
              } else {
                  console.error("Erro: O elemento com o ID 'listaContrateArtista' não foi encontrado na página.");
              }
          } else {
              console.error("Erro ao carregar artistas:", data.message);
          }
      } catch (error) {
          console.error("Erro na requisição:", error);
          const artistSection = qs('.categorySection'); 
          const noPubSpan = qs('.noPublicationSpan'); // Exibe mensagem "sem publicação" caso dê erro
          if (artistSection) artistSection.innerHTML = '';
          if (noPubSpan) noPubSpan.removeAttribute('hidden');
      }
  }
  
  if (page === 'contrate') {
      fetchArtists(); //Se pagina for contrate, a função é chamada
  }
  });
  //Modal Editar Perfil
const editButton = document.querySelector('.editProfile');
const modal = document.getElementById('ModalScreen');
const closeModal = document.getElementById('sair')

//--- Função de exibição de mensagens em balões padrões do próprio navegador
function showFieldError(el, msg) { 
  if (!el) return;
  el.setCustomValidity(msg); // Define a mensagem de erro personalizada que será exibida pelo navegador.
  el.reportValidity(); // Solicita ao navegador que exiba imediatamente o balão de erro.
  el.focus();  // Coloca o foco no campo com erro.

  // limpamos a mensagem quando o usuário digitar de novo
  const clear = () => { el.setCustomValidity(''); el.removeEventListener('input', clear); };
  el.addEventListener('input', clear);
}


if (editButton) {
  editButton.addEventListener('click', editarPerfil);
}

closeModal?.addEventListener('click', () => { //Se x for clicado, modal é fechado
  modal?.setAttribute('aria-hidden', 'true');
});

if(closeModal) { //fecha o modal quando o usuário clica fora da janela (no fundo)
  modal.setAttribute('aria-hidden', 'true')
  window.onclick = (e) => { if (e.target === modal) modal.setAttribute('aria-hidden', 'true'); };
}
//Campos de edição do modal
const newName = document.getElementById('ModifyName');
const newUsername = document.getElementById('ModifyUserName');
const newBio  = document.getElementById('ModifyBio');
const newProfileImg  = document.getElementById('previewProfileImg');
const newPassword = document.getElementById('ModifyPassword');       
const newConfirmPassword = document.getElementById('confirmPassword');
const fileInput = document.getElementById('profileImage');
fileInput?.addEventListener('change', (e) => { //Quando o usuário escolher uma imagem no input de arquivo, é exibido uma prévia dele no newprofileImg
  const f = e.target.files?.[0]; // Pega o primeiro arquivo selecionado
  if (f && newProfileImg) newProfileImg.src = URL.createObjectURL(f); // Cria uma URL temporária para exibir a imagem sem precisar enviar ao servidor.
});

// --- Função para preencher os campos do modal com os dados do usuário
  function preencherDados(data = {}) {
    if (newName) newName.value = data?.name || '';
    if (newUsername) newUsername.value = data?.userName || '';
    if (newBio)  newBio.value  = data?.bio || '';
    if (newProfileImg)  newProfileImg.src    = data?.profileImage ? `http://localhost:3520/uploads/profile/${data.profileImage}` : '';
    if (newPassword) newPassword.value = '';
    if (newConfirmPassword) newConfirmPassword.value = '';
    modal?.setAttribute('aria-hidden', 'false');
  }

  //Função para abrir o modal e preencher com dados salvos no localStorage
  function editarPerfil() {
    const dadosUser = JSON.parse(localStorage.getItem('usuario') || '{}') 
    preencherDados(dadosUser)
    modal?.setAttribute('aria-hidden', 'false') 
  }

const confirmBtn = document.getElementById('Confirm');

confirmBtn?.addEventListener('click', async (e) => {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem('usuario') || '{}'); // Busca os dados do usuário salvos no localStorage
  if (!user?.id) return alert('Usuário não encontrado.');

  // Pega os valores preenchidos no formulário e remove espaços extras
  const name = (newName?.value || '').trim();
  const userName = (newUsername?.value || '').trim();
  const bio = (newBio?.value || '').trim();
  const pwd     = (newPassword?.value || '').trim();    
  const confInp = (newConfirmPassword?.value || '').trim(); 

  if (confInp && !pwd) {
    showFieldError(newPassword, 'Digite a nova senha para confirmar.');
    return;
  }
  if (pwd && pwd !== confInp) {
    showFieldError(newConfirmPassword, 'As senhas não coincidem.');
    return;
  }

  const payload = { name, userName, bio};
  if (pwd) payload.password = pwd; // Só adiciona a senha se for alterada

  try {
    const response = await fetch(`http://localhost:3520/user/edit/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!response.ok || json?.success === false) {
      return alert(json?.message || 'Erro ao atualizar dados.');
    }

    let newProfileImage = user.profileImage; // Mantém a imagem antiga do perfil até saber se o usuário enviou uma nova
    const file = fileInput?.files?.[0]; // Verifica se o usuário selecionou uma nova foto de perfil
    if (file) {
      const formData = new FormData(); //Envia o id do user (string) e o profileImage (file)
      formData.append('id', user.id);
      formData.append('profileImage', file);

      const response2 = await fetch('http://localhost:3520/user/uploadProfile', { 
        method: 'PUT',
        body: formData
      });
      const json2 = await response2.json();
      if (!response2.ok || !json2?.success) {
        return alert(json2?.message || 'Erro ao enviar foto de perfil.');
      }
      newProfileImage = json2.profileImage; 
    }

    const atualizado = { ...user, ...payload, profileImage: newProfileImage }; //Cria objeto atualizado com todas as alterações
    localStorage.setItem('usuario', JSON.stringify(atualizado));
    if (typeof renderProfile === 'function') renderProfile(atualizado); // Se existir função renderProfile, atualiza a exibição do perfil na página

    modal?.setAttribute('aria-hidden', 'true');
    alert('Perfil atualizado!');
  } catch (err) {
    console.error(err);
    alert('Não foi possível atualizar. Tente novamente.');
  }
});

// Função pra abrir modal de exclusão de posts no perfil
let postSelecionado = null;

function abrirModalExcluir(postId, titulo) {
  postSelecionado = postId;
  const modal = document.getElementById("modalExcluirPost");
  const tituloEl = document.getElementById("tituloPostModal");

  if (tituloEl) tituloEl.textContent = titulo || "";

  // Mostra modal com classe .show (CSS controla a visibilidade)
  modal.classList.add("show");
}

// === Botão CANCELAR ===
document.getElementById("cancelarExclusao")?.addEventListener("click", () => {
  const modal = document.getElementById("modalExcluirPost");
  modal.classList.remove("show"); // esconde o modal
  postSelecionado = null;
});

// === Botão CONFIRMAR EXCLUSÃO ===
document.getElementById("confirmarExclusao")?.addEventListener("click", async () => {
  if (!postSelecionado) return;

  try {
    const resposta = await fetch(`http://localhost:3520/feed/delete/${postSelecionado}`, {
      method: "DELETE"
    });
    const json = await resposta.json();

    if (json.success) {
      alert("Postagem excluída com sucesso!");
      // Remove o card visualmente
      document.querySelector(`[data-post-id="${postSelecionado}"]`)?.closest('.photoCard')?.remove();
    } else {
      alert("Erro ao excluir postagem: " + (json.message || ""));
    }
  } catch (e) {
    console.error("Erro ao excluir postagem:", e);
    alert("Erro ao excluir postagem.");
  }

  // Esconde o modal e limpa seleção
  const modal = document.getElementById("modalExcluirPost");
  modal.classList.remove("show");
  postSelecionado = null;
});

function editarPost(id) {
  fetch(`http://localhost:3520/feed/list`)
    .then(r => r.json())
    .then(({ posts }) => {
      const post = posts.find(p => p.id === id);
      if (!post) return alert("Postagem não encontrada.");

      // salva TUDO que a página de edição precisa
      localStorage.setItem("postEdicao", JSON.stringify({
        id: post.id,
        title: post.title,
        description: post.description,
        artSection: post.artSection,
        media: post.media.map(m => `http://localhost:3520/uploads/feed/${m}`)
      }));

      // abre a tela de criação (que vai entrar no modo edição)
      window.location.href = "criarPost.html";
    })
    .catch(err => {
      console.error("Erro ao buscar post:", err);
      alert("Erro ao carregar post para edição.");
    });
}

function inicializarHistoriaComArte() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario.id) return;

  const root = document.querySelector('#perfilArtista:not([hidden]), #perfilComum:not([hidden])');
  if (!root) return;

  const textHistory = root.querySelector('#textHistory');
  const plusButtons = Array.from(root.querySelectorAll('#btnAddHistory'));
  const container =
    plusButtons[0]?.closest('.historyContent') || textHistory?.closest('.historyContent');

  if (!container || !textHistory) return;

  // Limpeza defensiva (idempotente)
  container.querySelector("#btnSaveHistory")?.remove();
  container.querySelector(".counter")?.remove();
  container.querySelector(".historyActions")?.remove();

  const historiaSalva = typeof usuario.historia_arte === "string" && usuario.historia_arte.trim() !== "";

  if (historiaSalva) {
    plusButtons.forEach(btn => btn.remove());
    textHistory.textContent = usuario.historia_arte;
    if (!container.querySelector(".historyActions")) montarAcoes(textHistory);
  } else {
    textHistory.textContent = "Compartilhe sua história com a arte";

    let btnAdd = container.querySelector("#btnAddHistory");
    if (!btnAdd) {
      btnAdd = document.createElement("button");
      btnAdd.id = "btnAddHistory";
      btnAdd.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#DCEEC8" class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0V8H10a.5.5 0 0 0 0-1H8.5z"/>
        </svg>`;
      container.prepend(btnAdd);
    }
    if (!btnAdd.dataset.listenerAdded) {
      btnAdd.dataset.listenerAdded = "true";
      btnAdd.addEventListener("click", () => montarEditor(""));
    }
  }

  // Watchdog para impedir que o "+" reapareça quando há história
  if (historiaSalva && !container.__historyObserverAttached) {
    const obs = new MutationObserver(() => {
      container.querySelectorAll("#btnAddHistory").forEach(b => b.remove());
      dedupUi();
    });
    obs.observe(container, { childList: true, subtree: true });
    container.__historyObserverAttached = true;
  }

  function dedupUi() {
    const actions = container.querySelectorAll(".historyActions");
    actions.forEach((n, i) => { if (i > 0) n.remove(); });
    const counters = container.querySelectorAll(".counter");
    counters.forEach((n, i) => { if (i > 0) n.remove(); });
    const saves = container.querySelectorAll("#btnSaveHistory");
    saves.forEach((n, i) => { if (i > 0) n.remove(); });
  }

  function limparUiEdicao() {
    // remove tudo que possa estar sobrando da edição anterior
    container.querySelectorAll("#btnSaveHistory, .counter, input[data-history-input]").forEach(el => el.remove());
    // não remove .historyActions aqui (quem chama decide)
  }

  function montarEditor(valor = "") {
    // limpar antes de montar
    limparUiEdicao();
    container.querySelectorAll("#btnAddHistory").forEach(b => b.remove());
    container.querySelector(".historyActions")?.remove();

    // resolve o <p> ATUAL na hora de editar (nada de variável “fechada”)
    const currentP = container.querySelector('#textHistory');

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 255;
    input.placeholder = "Compartilhe sua história com a arte";
    input.value = valor;
    input.setAttribute('data-history-input', 'true');

    const counter = document.createElement("span");
    counter.className = "counter";
    const atualizarContador = () => {
      const len = input.value.replace(/\s/g, "").length;
      counter.textContent = `${len}/255`;
    };
    atualizarContador();
    input.addEventListener("input", atualizarContador);

    const btnSave = document.createElement("button");
    btnSave.id = "btnSaveHistory";
    btnSave.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="#DCEEC8" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06l2.75 2.75a.75.75 0 0 0 1.08-.02l3.9-4.9a.75.75 0 0 0-.02-1.08z"/>
      </svg>`;

    if (currentP) {
      currentP.replaceWith(input);
    } else {
      // se por algum motivo não houver <p>, insere no topo
      container.prepend(input);
    }
    container.append(counter, btnSave);
    dedupUi();

    btnSave.addEventListener("click", async () => {
      const historia = input.value.trim();
      if (!historia) return alert("Digite sua história antes de salvar!");

      try {
        const res = await fetch(`http://localhost:3520/user/edit/${usuario.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: usuario.name,
            userName: usuario.userName,
            bio: usuario.bio || "",
            historia_arte: historia
          }),
        });
        const data = await res.json();
        if (!data.success) return alert("Erro ao salvar história.");

        // Atualiza estado local
        usuario.historia_arte = historia;
        localStorage.setItem("usuario", JSON.stringify(usuario));

        // Limpa UI de edição e substitui pelo <p> novo (sem duplicar)
        limparUiEdicao();

        // se sobrou algum #textHistory antigo (não deveria), remove
        container.querySelectorAll('#textHistory').forEach((el, i) => { if (i > 0) el.remove(); });

        const existente = container.querySelector('#textHistory');
        if (existente) existente.remove();

        const novoP = document.createElement("p");
        novoP.id = "textHistory";
        novoP.textContent = historia;
        container.append(novoP);

        montarAcoes(novoP);

        // Estado “tem história”: remova qualquer "+"
        container.querySelectorAll("#btnAddHistory").forEach(b => b.remove());
        if (!container.__historyObserverAttached) {
          const obs2 = new MutationObserver(() => {
            container.querySelectorAll("#btnAddHistory").forEach(b => b.remove());
            dedupUi();
          });
          obs2.observe(container, { childList: true, subtree: true });
          container.__historyObserverAttached = true;
        }
      } catch (err) {
        console.error("Erro ao salvar história:", err);
        alert("Erro ao salvar história.");
      }
    });
  }

  function montarAcoes(pRef) {
    if (container.querySelector(".historyActions")) return; // evita duplicar
    const actions = document.createElement("div");
    actions.className = "historyActions";

    const btnEdit = document.createElement("button");
    btnEdit.className = "btnEditHistory";
    btnEdit.title = "Editar";
    btnEdit.innerHTML = `<img src="./icons/pencil-square.svg" alt="Editar">`;

    const btnDelete = document.createElement("button");
    btnDelete.className = "btnDeleteHistory";
    btnDelete.title = "Excluir";
    btnDelete.innerHTML = `<img src="./icons/trash.svg" alt="Excluir">`;

    actions.append(btnEdit, btnDelete);
    container.append(actions);

    btnEdit.addEventListener("click", () => {
      actions.remove();
      // resolve o texto atual do <p> no momento do clique
      const atual = container.querySelector('#textHistory')?.textContent || usuario.historia_arte || "";
      montarEditor(atual);
    });

    btnDelete.addEventListener("click", async () => {
      if (!confirm("Tem certeza que deseja excluir sua história?")) return;
      try {
        const res = await fetch(`http://localhost:3520/user/edit/${usuario.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: usuario.name,
            userName: usuario.userName,
            bio: usuario.bio || "",
            historia_arte: "",
          }),
        });
        const data = await res.json();
        if (!data.success) return alert("Erro ao excluir história.");

        // Atualiza localStorage
        usuario.historia_arte = "";
        localStorage.setItem("usuario", JSON.stringify(usuario));

        // Reset visual completo e limpo
        actions.remove();
        // remove qualquer input/botão/contador pendente
        limparUiEdicao();
        // remove qualquer <p> #textHistory que exista
        container.querySelectorAll('#textHistory').forEach(el => el.remove());

        // Cria novamente o <p> padrão
        const novoTexto = document.createElement("p");
        novoTexto.id = "textHistory";
        novoTexto.textContent = "Compartilhe sua história com a arte";
        container.append(novoTexto);

        // Recria o botão "+"
        let novoPlus = container.querySelector("#btnAddHistory");
        if (!novoPlus) {
          novoPlus = document.createElement("button");
          novoPlus.id = "btnAddHistory";
          novoPlus.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#DCEEC8"
              class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0V8H10a.5.5 0 0 0 0-1H8.5z"/>
            </svg>`;
          container.prepend(novoPlus);
        }
        if (!novoPlus.dataset.listenerAdded) {
          novoPlus.dataset.listenerAdded = "true";
          novoPlus.addEventListener("click", () => montarEditor(""));
        }

        // Não reinicializa a função toda; apenas limpa a flag do observer
        if (container.__historyObserverAttached) {
          delete container.__historyObserverAttached;
        }
      } catch (err) {
        console.error("Erro ao excluir história:", err);
        alert("Erro ao excluir história.");
      }
    });
  }
}

// --- Contagem de postagens favoritas por seção ---
async function atualizarContagemFavoritosPorSecao() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const viewedId = new URLSearchParams(location.search).get('id') || usuario.id;
  if (!viewedId) return;

  // contador base para cada seção
  const cont = {
    musicaAudiovisual: 0,
    artesPlasticas: 0,
    artesCenicas: 0,
    literatura: 0
  };

  try {
    const res = await fetch(`http://localhost:3520/user/${viewedId}/favorites`);
    const json = await res.json();
    if (!json?.success || !Array.isArray(json.posts)) return;

    // mapeamento entre o formato da API (kebab-case) e o DOM (camelCase)
    const mapApiToDom = {
      'musica-audiovisual': 'musicaAudiovisual',
      'artes-plasticas': 'artesPlasticas',
      'artes-cenicas': 'artesCenicas',
      'literatura': 'literatura'
    };

    // percorre os posts favoritos e soma por seção
    json.posts.forEach(post => {
      const rawSec = (post.artSection || '').trim().toLowerCase();
      const sec = mapApiToDom[rawSec] || rawSec;
      if (Object.prototype.hasOwnProperty.call(cont, sec)) {
        cont[sec]++;
      }
    });

    // atualiza o texto dentro das seções do perfil
    const atualizarUI = () => {
      const roots = document.querySelectorAll('#perfilComum, #perfilArtista');
      roots.forEach(root => {
        root.querySelectorAll('.gpItem[data-section]').forEach(item => {
          const sec = item.dataset.section;
          const qtd = cont[sec] || 0;
          item.dataset.count = qtd;
          const p = item.querySelector('p');
          if (p) {
            p.textContent = (qtd === 1)
              ? '1 postagem favoritada'
              : `${qtd} postagens favoritadas`;
          }
        });
      });
    };

    // garante que o DOM esteja pronto
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      atualizarUI();
    } else {
      document.addEventListener('DOMContentLoaded', atualizarUI, { once: true });
    }

    // debug opcional: ver os valores no console
    console.log('Favoritos por seção:', cont);

  } catch (err) {
    console.error('Erro ao contar favoritos por seção:', err);
  }
}
//Função pra marcar os posts favoritos no perfil (ficar amarelo)
async function marcarFavoritosPerfil() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario?.id) return;

  try {
    const res = await fetch(`http://localhost:3520/user/${usuario.id}/favorites`);
    const data = await res.json();

    if (!data.success || !data.posts) return;
    const favoritos = data.posts.map(p => p.id);
    document.querySelectorAll('.btn-favorite').forEach(btn => {
      const postId = parseInt(btn.dataset.id);
      const img = btn.querySelector('img');
      if (favoritos.includes(postId)) {
        btn.classList.add('favorited');
        img.src = './icons/bookmark-star-fill.svg'; // amarelo “por dentro”
      } else {
        btn.classList.remove('favorited');
        img.src = './icons/bookmark-star.svg'; // cinza padrão
      }
    });
  } catch (err) {
    console.error('Erro ao carregar favoritos:', err);
  }
}

function ativarFavoritosPerfil() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario?.id) return;

  // estado inicial (icones amarelos para o que já está favoritado)
  marcarFavoritosPerfil();

  document.querySelectorAll('.btn-favorite').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const postId = btn.getAttribute('data-id'); // precisa do data-id (ver item 2)
      const img = btn.querySelector('img');
      const isFavorited = btn.classList.contains('favorited');

      // animação opcional
      img.classList.add('animate');
      setTimeout(() => img.classList.remove('animate'), 200);

      try {
        if (isFavorited) {
          const res = await fetch('http://localhost:3520/favorites/remove', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, userId: usuario.id })
          });
          const data = await res.json();
          if (data.success) {
            btn.classList.remove('favorited');
            img.src = './icons/bookmark-star.svg';
            // 🔥 Atualiza contagem imediatamente
            atualizarContagemFavoritosPorSecao();
          }
        } else {
  const res = await fetch('http://localhost:3520/favorites/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, userId: usuario.id })
  });
  const data = await res.json();
  if (data.success) {
    btn.classList.add('favorited');
    img.src = './icons/bookmark-star-fill.svg';
    // 🔥 Atualiza contagem imediatamente
    atualizarContagemFavoritosPorSecao();
  }
}
      } catch (err) {
        console.error('Erro ao favoritar/desfavoritar:', err);
      }
    });
  });
}
// --- Exibir posts curtidos ---
// oberva qual seção de perfil está visível agora (comum ou artista)
function getPerfilRootVisivel() {
  return document.querySelector('#perfilArtista:not([hidden])')
      || document.querySelector('#perfilComum:not([hidden])')
      || document; // fallback
}

// render dos cards dos posts curtidos (reuso do padrão do feed/perfil)
function renderCardsCurtidos(container, posts) {
  container.innerHTML = '';
  const videoExtensions = ['mp4', 'mov', 'webm', 'avi'];

  posts.forEach(post => {
    const card = document.createElement('div');
    card.classList.add('photoCard');

    const dataFormatada = new Date(post.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    if (post.media.length === 1) {
      const file = post.media[0];
      const isVideo = videoExtensions.some(ext => file.toLowerCase().includes(`.${ext}`));
      card.innerHTML = `
        <div class="mediaContainer">
          ${isVideo
            ? `<video src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" controls muted></video>`
            : `<img src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" alt="midia">`}
        </div>
        <div class="photoInfo">
          <span class="dataPost" style="color:#DCEEC8;font-size:10px">Publicado em ${dataFormatada}</span>
          <h4>${post.title}</h4>
          <p>${post.description?.length > 80 ? post.description.slice(0,80) + '…' : (post.description || '')}</p>
          <div class="postReactPerfil">
          <button class="btn-like" data-id="${post.id}">
            <img src="./icons/heart.svg" class="heart-icon" alt="Curtir">
            <p class="contadorLikes"></p>
          </button>
          <button class="btn-comment" data-id="${post.id}">
          <img src="./icons/chat-dots.svg" class="comment-icon" alt="">
          <p class="contadorComentarios"></p>
          </button>

          <button class="btn-favorite" data-id="${post.id}">
          <img src="./icons/bookmark-star.svg" alt="Favoritar">
          </button>
        </div>
        </div>
      `;
    } else {
      const carouselId = `carousel-liked-${post.id}`;
      const midias = post.media.map((file, i) => {
        const isVideo = videoExtensions.some(ext => file.toLowerCase().includes(`.${ext}`));
        return `
          <div class="carousel-item ${i === 0 ? 'active' : ''}">
            ${isVideo
              ? `<video src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" controls muted preload="metadata" loop></video>`
              : `<img src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" alt="midia">`}
          </div>`;
      }).join('');
      card.innerHTML = `
        <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
          <div class="carousel-inner">${midias}</div>
          <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
            <span class="carousel-control-prev-icon"></span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
            <span class="carousel-control-next-icon"></span>
          </button>
        </div>
        <div class="photoInfo">
          <span class="dataPost" style="color:#DCEEC8;font-size:10px">Publicado em ${dataFormatada}</span>
          <h4>${post.title}</h4>
          <p>${post.description?.length > 80 ? post.description.slice(0,80) + '…' : (post.description || '')}</p>
          <div class="postReactPerfil">
          <button class="btn-like" data-id="${post.id}">
            <img src="./icons/heart.svg" class="heart-icon" alt="Curtir">
            <p class="contadorLikes"></p>
          </button>
          <button class="btn-comment" data-id="${post.id}">
          <img src="./icons/chat-dots.svg" class="comment-icon" alt="">
          <p class="contadorComentarios"></p>
          </button>

          <button class="btn-favorite" data-id="${post.id}">
          <img src="./icons/bookmark-star.svg" alt="Favoritar">
          </button>
        </div>
        </div>
      `;
    }

    container.appendChild(card);
  });
}

// --- Funções auxiliares para a aba de curtidos ---
async function marcarCurtidasAbaCurtidos() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario.id) return;

  try {
    const res = await fetch(`http://localhost:3520/user/${usuario.id}/liked-posts`);
    const data = await res.json();
    if (!data.success) return;

    const likedIds = data.posts.map(p => p.id);

    const cards = document.querySelectorAll("#likedFeedContainer .photoCard");
    for (const card of cards) {
      const btnLike = card.querySelector(".btn-like");
      const heartIcon = btnLike?.querySelector(".heart-icon");
      const countEl = btnLike?.querySelector(".contadorLikes");
      const postId = btnLike?.dataset.id;
      if (!postId) continue;

      // marca visualmente se o usuário curtiu
      if (likedIds.includes(parseInt(postId))) {
        btnLike.classList.add("liked");
        heartIcon.src = "./icons/heart-fill.svg";
      } else {
        btnLike.classList.remove("liked");
        heartIcon.src = "./icons/heart.svg";
      }

      // atualiza contador de curtidas
      try {
        const resLikes = await fetch(`http://localhost:3520/post/likes/${postId}`);
        const likesData = await resLikes.json();
        countEl.textContent = likesData.success ? likesData.likes : "0";
      } catch {
        countEl.textContent = "0";
      }
    }

    // --- comportamento de clique (curtir/descurtir) ---
    const likeButtons = document.querySelectorAll("#likedFeedContainer .btn-like");

    likeButtons.forEach((button) => {
      const postId = button.dataset.id;
      const heartIcon = button.querySelector(".heart-icon");
      const countEl = button.querySelector(".contadorLikes");

      button.addEventListener("click", async (e) => {
        e.preventDefault();

        if (!usuario || !usuario.id) {
          alert("Você precisa estar logado para curtir postagens.");
          return;
        }

        const isLiked = button.classList.contains("liked");
        heartIcon.classList.add("animate");
        setTimeout(() => heartIcon.classList.remove("animate"), 200);

        try {
          if (isLiked) {
            // --- DESCURTIR (mantém o post na tela, apenas visualmente muda) ---
            const res = await fetch("http://localhost:3520/post/unlike", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postId, userId: usuario.id }),
            });
            const data = await res.json();
            if (data.success) {
              button.classList.remove("liked");
              heartIcon.src = "./icons/heart.svg";
            }
          } else {
            // --- CURTIR NOVAMENTE ---
            const res = await fetch("http://localhost:3520/post/like", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postId, userId: usuario.id }),
            });
            const data = await res.json();
            if (data.success) {
              button.classList.add("liked");
              heartIcon.src = "./icons/heart-fill.svg";
            }
          }
        } catch (err) {
          console.error("Erro ao curtir/descurtir:", err);
        }

        // atualiza contador de likes do post
        try {
          const res = await fetch(`http://localhost:3520/post/likes/${postId}`);
          const data = await res.json();
          countEl.textContent = data.success ? data.likes : "0";
        } catch {
          countEl.textContent = "0";
        }
      });
    });

    // mantém a função original para compatibilidade
    ativarCurtidasPerfil();
  } catch (err) {
    console.error("Erro ao marcar curtidas na aba curtidos:", err);
  }
}

async function atualizarComentariosAbaCurtidos() {
  const cards = document.querySelectorAll("#likedFeedContainer .photoCard");

  for (const card of cards) {
    const postId = card.querySelector(".btn-comment")?.dataset.id;
    const contadorEl = card.querySelector(".contadorComentarios");
    if (!postId || !contadorEl) continue;

    try {
      const res = await fetch(`http://localhost:3520/comments/${postId}`);
      const data = await res.json();
      contadorEl.textContent = data.success ? data.comments.length : "0";
    } catch {
      contadorEl.textContent = "0";
    }
  }
}

async function marcarFavoritosAbaCurtidos() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario?.id) return;

  try {
    const res = await fetch(`http://localhost:3520/user/${usuario.id}/favorites`);
    const data = await res.json();
    if (!data.success) return;

    const favoritos = data.posts.map(p => p.id);
    document.querySelectorAll("#likedFeedContainer .btn-favorite").forEach(btn => {
      const postId = parseInt(btn.dataset.id);
      const img = btn.querySelector("img");
      if (favoritos.includes(postId)) {
        btn.classList.add("favorited");
        img.src = "./icons/bookmark-star-fill.svg";
      } else {
        btn.classList.remove("favorited");
        img.src = "./icons/bookmark-star.svg";
      }
    });

    // reativa a função padrão de favoritar/desfavoritar
    ativarFavoritosPerfil();
  } catch (err) {
    console.error("Erro ao marcar favoritos na aba curtidos:", err);
  }
}

async function atualizarAbaCurtidos() {
  await marcarCurtidasAbaCurtidos();
  await atualizarComentariosAbaCurtidos();
  await marcarFavoritosAbaCurtidos();
}


// abre a telinha "Meus posts curtidos"
async function exibirPostsCurtidos() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario || !usuario.id) return;

  const root = getPerfilRootVisivel();
  const aboutProfile = root.querySelector('.aboutProfile');
  const likedWrap     = root.querySelector('#likedPostsContainer');
  const grid          = root.querySelector('#likedFeedContainer');
  const countHeader   = root.querySelector('#likedCountHeader');

  if (!likedWrap || !grid) return;

  // troca de telas
  if (aboutProfile) aboutProfile.hidden = true;
  likedWrap.hidden = false;
  grid.innerHTML = `<p>Carregando…</p>`;

  try {
    const res = await fetch(`http://localhost:3520/user/${usuario.id}/liked-posts`);
    const data = await res.json();

    if (!data.success || !data.posts?.length) {
      countHeader.textContent = '0';
      grid.innerHTML = `
        <div class="noPublicationSpan">
          <img src="./icons/emoji-frown.svg" alt="">
          <span>Você ainda não curtiu nenhuma postagem.</span>
        </div>`;
      return;
    }

    countHeader.textContent = data.posts.length;
    renderCardsCurtidos(grid, data.posts);
    atualizarAbaCurtidos()
  } catch (err) {
    console.error('Erro ao carregar posts curtidos:', err);
    grid.innerHTML = `<p>Erro ao carregar posts curtidos.</p>`;
  }
}

// volta para o aboutProfile
function voltarParaAbout() {
  const root = getPerfilRootVisivel();
  const aboutProfile = root.querySelector('.aboutProfile');
  const likedWrap     = root.querySelector('#likedPostsContainer');
  if (aboutProfile) aboutProfile.hidden = false;
  if (likedWrap) likedWrap.hidden = true;
}

// listeners globais
document.addEventListener('click', (e) => {
  // abrir curtidos
  if (e.target.closest('.likedPostsTrigger')) {
    e.preventDefault();
    exibirPostsCurtidos();
  }
  // voltar
  if (e.target.closest('#btnVoltarAbout')) {
    e.preventDefault();
    voltarParaAbout();
  }
});

// --- helper: normaliza nome de seção do dataset/BD para a chave canônica
function normalizarSecao(valor) {
  if (!valor) return '';
  const v = valor.toString().trim().toLowerCase();

  // aceita variações com espaço/hífen/acentos
  const mapas = [
    { keys: ['musica e audiovisual','música e audiovisual','musica-audiovisual','música-audiovisual','musicaaudiovisual'], canon: 'musicaAudiovisual' },
    { keys: ['artes plasticas','artes plásticas','artes-plasticas','artes-plásticas','artesplasticas'], canon: 'artesPlasticas' },
    { keys: ['artes cenicas','artes cênicas','artes-cenicas','artes-cênicas','artescenicas'], canon: 'artesCenicas' },
    { keys: ['literatura'], canon: 'literatura' },
  ];

  for (const m of mapas) {
    if (m.keys.includes(v)) return m.canon;
  }
  // se já vier canônico
  if (['musicaaudiovisual','artesplasticas','artescenicas','literatura'].includes(v.replace(/[^a-z]/g,''))) {
    const s = v.replace(/[^a-z]/g,'');
    if (s === 'musicaaudiovisual') return 'musicaAudiovisual';
    if (s === 'artesplasticas')    return 'artesPlasticas';
    if (s === 'artescenicas')      return 'artesCenicas';
    return 'literatura';
  }
  return valor; // fallback
}

// --- mapa para exibir bonito no cabeçalho
const NOMES_SECOES = {
  musicaAudiovisual: 'Música e Audiovisual',
  artesPlasticas: 'Artes Plásticas',
  artesCenicas: 'Artes Cênicas',
  literatura: 'Literatura'
};

// --- Exibe os posts favoritos por seção (Galeria Pessoal) ---
// --- Exibe os posts favoritos por seção (Galeria Pessoal) ---
async function exibirFavoritosPorSecao(secaoBruto) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario?.id) return;

  const root = document.querySelector("#perfilArtista:not([hidden])")
            || document.querySelector("#perfilComum:not([hidden])");
  if (!root) return;

  const containerFavoritos = root.querySelector("#favoritosPorSecaoContainer");
  const containerAbout = root.querySelector(".aboutProfile");
  const feedContainer = containerFavoritos.querySelector("#favoritosFeedContainer");
  const titleHeader = containerFavoritos.querySelector(".likedHeader h3");

  const secao = normalizarSecao(secaoBruto);
  const nomeLegivel = NOMES_SECOES[secao] || secaoBruto;

  titleHeader.innerHTML = `Postagens favoritadas em ${nomeLegivel}: <span id="favoritosCountHeader">0</span>`;
  const countHeader = containerFavoritos.querySelector("#favoritosCountHeader");

  containerAbout.hidden = true;
  containerFavoritos.hidden = false;
  feedContainer.innerHTML = `
    <div class="noPublicationSpan">
      <img src="./icons/brush.svg" alt="">
      <span>Carregando postagens...</span>
    </div>
  `;

  try {
    const res = await fetch(`http://localhost:3520/user/${usuario.id}/favorites`);
    const data = await res.json();
    if (!data.success) throw new Error("Falha ao buscar favoritos.");

    const postsSecao = data.posts.filter(p => normalizarSecao(p.artSection) === secao);
    countHeader.textContent = postsSecao.length;

    if (!postsSecao.length) {
      feedContainer.innerHTML = `
        <div class="noPublicationSpan">
          <img src="./icons/emoji-frown.svg" alt="">
          <span>Nenhum post favoritado nesta seção.</span>
        </div>`;
      return;
    }

    // Reuso total da renderização dos curtidos
    renderCardsCurtidos(feedContainer, postsSecao);

    // Deixa todos os favoritos já ativados (são posts favoritados)
    feedContainer.querySelectorAll(".btn-favorite").forEach(btn => {
      btn.classList.add("favorited");
      const img = btn.querySelector("img");
      if (img) img.src = "./icons/bookmark-star-fill.svg";
    });

    // --- Alias temporário do container ---
    const prevId = feedContainer.id;
    feedContainer.id = "likedFeedContainer";

    // --- Reutiliza funções já existentes ---
    await marcarCurtidasAbaCurtidos();             // atualiza curtidas
    await atualizarComentariosAbaCurtidos();       // atualiza comentários
    await marcarFavoritosAbaCurtidos();            // atualiza favoritos

    // --- Restaura id original ---
    feedContainer.id = prevId;

  } catch (err) {
    console.error("Erro ao exibir favoritos por seção:", err);
    feedContainer.innerHTML = `
      <div class="noPublicationSpan">
        <img src="./icons/emoji-frown.svg" alt="">
        <span>Erro ao carregar postagens.</span>
      </div>`;
  }
}

// --- Clique nas seções da galeria pessoal ---
document.addEventListener('click', (e) => {
  const item = e.target.closest('.gpItem');
  if (item) {
    e.preventDefault();
    const secao = item.dataset.section;
    exibirFavoritosPorSecao(secao);
  }

  if (e.target.closest('#btnVoltarGaleria')) {
    const root = document.querySelector('#perfilArtista:not([hidden])') 
              || document.querySelector('#perfilComum:not([hidden])');
    const containerFavoritos = root.querySelector('#favoritosPorSecaoContainer');
    const containerAbout = root.querySelector('.aboutProfile');
    if (containerFavoritos) containerFavoritos.hidden = true;
    if (containerAbout) containerAbout.hidden = false;

    if (typeof atualizarContagemFavoritosPorSecao === 'function') {
      atualizarContagemFavoritosPorSecao();
    }
  }
});

// Função auxiliar para manter sincronia entre perfil e galeria
async function sincronizarFavoritosGlobais() {
  try {
    // 1️⃣ Atualiza os contadores nas caixinhas de seção (ex: Artes Plásticas, Música etc.)
    if (typeof atualizarContagemFavoritosPorSecao === 'function') {
      await atualizarContagemFavoritosPorSecao();
    }

    // 2️⃣ Atualiza a renderização dos posts curtidos/favoritos dentro do perfil do artista
    const root = document.querySelector('#perfilArtista:not([hidden])') 
              || document.querySelector('#perfilComum:not([hidden])');
    if (root) {
      const containerFavoritos = root.querySelector('#favoritosPorSecaoContainer');
      const containerAbout = root.querySelector('.aboutProfile');

      // Se o container de favoritos estiver aberto, força atualização dele
      if (!containerFavoritos?.hidden && typeof exibirFavoritosPorSecao === 'function') {
        const secaoAberta = sessionStorage.getItem('secaoFavoritosAberta');
        if (secaoAberta) await exibirFavoritosPorSecao(secaoAberta);
      }

      // Se não estiver aberto, apenas atualiza a seção "sobre" com os novos números
      if (containerAbout && typeof atualizarContagemFavoritosPorSecao === 'function') {
        await atualizarContagemFavoritosPorSecao();
      }
    }
  } catch (err) {
    console.error('Erro ao sincronizar favoritos globais:', err);
  }
}

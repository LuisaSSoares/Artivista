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
    file.includes('notificacoes') ? 'notificacoes' :
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
      } else if (page === 'notificacoes') {
        menuLinks[3]?.classList.add('active');
      } else if (page === 'configuracoes') {
        menuLinks[4]?.classList.add('active');
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
      }
    }
// --- Exibe postagens do usuário logado na aba "Postagens" ---
async function carregarPostagensUsuario(userId) {
  const container = document.getElementById('userPostsContainer');
  if (!container) return;

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
          <img src="./icons/emoji-frown.svg" alt="">
          <span>Você ainda não publicou nada.</span>
        </div>`;
      return;
    }

    container.innerHTML = '';
    container.classList.add('photoGrid');

    postsUsuario.forEach(post => {
      const previewDesc =
        post.description.length > 80
          ? post.description.slice(0, 80) + '...'
          : post.description;

      const carouselId = `carousel-${post.id}`;
      const midias = post.media
        .map((file, i) => {
          const ext = file.split('.').pop().toLowerCase();
          const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(ext);
          return `
            <div class="carousel-item ${i === 0 ? 'active' : ''}">
              ${isVideo
                ? `<video src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" controls muted></video>`
                : `<img src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" alt="midia">`}
            </div>`;
        })
        .join('');

      const card = document.createElement('div');
      const dataFormatada = new Date(post.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      card.classList.add('photoCard');
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
        <span class="dataPost" style="color: #DCEEC8; font-size: 10px">Publicado em ${dataFormatada}</span>
          <h4>${post.title}</h4>
          <p>${previewDesc}</p>
          <div class="photoInfo">
        </div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Erro ao carregar postagens do usuário:', err);
    container.innerHTML = `<p>Erro ao carregar postagens.</p>`;
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
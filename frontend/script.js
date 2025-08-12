const qs = (sel, root = document) => root.querySelector(sel);
document.addEventListener('DOMContentLoaded', () => {
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase()
    const page =
      (file === 'index.html' || file === 'feed.html') ? 'home' :
      file.includes('eventosecursos') ? 'eventos' :
      file.includes('contrateartista') ? 'contrate' :
      file.includes('perfil') ? 'perfil' :
      file.includes('conversas') ? 'conversas' :
      file.includes('notificacoes') ? 'notificacoes' :
      file.includes('configuracoes') ? 'configuracoes' :
      'home'

      const infosUser = JSON.parse(localStorage.getItem('usuario'));
      if (infosUser && infosUser.userType === 'artista') {
        const addContent = document.getElementById('addContent')
        if (addContent) addContent.style.visibility = 'visible'
      }
      
      
      const inicioLink = document.querySelector('.navSections a[href="./index.html"]')
      if (inicioLink) {
        const isCriacao = file.includes('criacaoconteudo')
        inicioLink.textContent = isCriacao ? 'Voltar ao início' : 'Início'
      }

    const menuLinks = document.querySelectorAll('.navSections a');
    if (menuLinks.length) {
      // 0=Início, 1=Minha conta, 2=Conversas, 3=Notificações, 4=Configurações
      menuLinks.forEach(a => a.classList.remove('active'));
  
      if (['home', 'eventos', 'contrate'].includes(page)) {
        // Início fica em negrito nessas páginas
        menuLinks[0]?.classList.add('active');
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
    const secComum   = document.getElementById('perfilComum');
    const secArtista = document.getElementById('perfilArtista');
  
    if (secComum || secArtista) {
      const viewedId =
        new URLSearchParams(location.search).get('id') ||
        (infosUser && infosUser.id);
  
      const setText = (el, txt) => { if (el) el.textContent = txt; };
      const imgSrc = (filename) =>
        filename ? `http://localhost:3520/uploads/profile/${filename}` : './icons/person-circle.svg';
  
      const plataformaNome = {
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
  
      function nomeDaPlataforma(url) {
        try {
          const host = new URL(url).hostname.replace(/^www\./, '');
          return plataformaNome[host] || host;
        } catch {
          return "Link externo";
        }
      }
  
      function renderLinksExternos(root, links = []) {
        const wrap = qs('#externalLinksContainer', root);
        if (!wrap) return;
  
        wrap.innerHTML = '';
        links.forEach(url => {
          if (!url) return;
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = 'linkItem';
  
          const img = document.createElement('img');
          img.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
          img.alt = '';
          img.style.width = '16px';
          img.style.height = '16px';
          img.style.marginRight = '8px';
  
          const span = document.createElement('span');
          span.textContent = nomeDaPlataforma(url);
  
          a.appendChild(img);
          a.appendChild(span);
          wrap.appendChild(a);
        });
      }
  
      function renderProfile(data) {
        const isArtist = data?.userType === 'artista' || data?.activity1 || data?.activity2;
  
        if (secComum && secArtista) {
          secComum.hidden   = isArtist;
          secArtista.hidden = !isArtist;
        }
  
        const root = isArtist ? secArtista : secComum;
        if (!root) return;
  
        setText(qs('#nomeUsuario', root), data?.name || 'Usuário');
        setText(qs('#username',    root), data?.userName ? '@' + data.userName : '@usuario');
        setText(qs('#bio',         root), data?.bio || 'Nenhuma bio adicionada');
  
        const foto = qs('#perfilPhoto', root);
        if (foto) foto.src = imgSrc(data?.profileImage);
  
        if (isArtist) {
          const tag1 = qs('#atuacaoTag .tag--1', root);
          const tag2 = qs('#atuacaoTag .tag--2', root);
          if (tag1) {
            if (data?.activity1) { tag1.textContent = data.activity1; tag1.hidden = false; }
            else { tag1.textContent = ''; tag1.hidden = true; }
          }
          if (tag2) {
            if (data?.activity2) { tag2.textContent = data.activity2; tag2.hidden = false; }
            else { tag2.textContent = ''; tag2.hidden = true; }
          }
  
          const links = (data?.links && Array.isArray(data.links)) ? data.links : [];
          renderLinksExternos(root, links);
        }
      }
  
      // 1) Fallback com localStorage (evita “piscada”)
      if (infosUser) {
        renderProfile({
          ...infosUser,
          activity1: infosUser.activity1,
          activity2: infosUser.activity2,
          links: infosUser.links
        });
      }

  
      // 2) Atualiza com dados da API, se houver id
      if (viewedId) {
        fetch(`http://localhost:3520/profile/${viewedId}`)
          .then(r => r.json())
          .then(json => {
            if (!json?.success || !json?.data) return;
            const d = json.data;
            renderProfile({
              id: d.id,
              name: d.name,
              userName: d.userName,
              email: d.email,
              userType: d.userType,
              bio: d.bio,
              historia_arte: d.historia_arte,
              profileImage: d.profileImage,
              activity1: d.activity1,
              activity2: d.activity2,
              links: [d.link1, d.link2, d.link3].filter(Boolean)
            });
          })
          .catch(err => console.warn('Falha ao carregar perfil:', err));
      }
    }

    
    const nav = document.querySelector('.navBar');
    if (!nav) return;
    if (nav.dataset.scope === 'perfil') {
        const links = Array.from(nav.querySelectorAll('a[data-tab]'));
        const panels = Array.from(document.querySelectorAll('.tabPanel'));
      
        // garante que exista o indicator
        let indicator = nav.querySelector('.indicator');
        if (!indicator) {
          indicator = document.createElement('span');
          indicator.className = 'indicator';
          nav.appendChild(indicator);
        }
      
        function moveIndicatorTo(link) {
          if (!link) return;
          const navRect = nav.getBoundingClientRect();
          const linkRect = link.getBoundingClientRect();
          const left = (linkRect.left - navRect.left) + nav.scrollLeft;
          const width = linkRect.width;
      
          requestAnimationFrame(() => {
            indicator.style.left = left + 'px';
            indicator.style.width = width + 'px';
          });
        }
      
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
          const a = e.target.closest('a[data-tab]');
          if (!a) return;
          e.preventDefault();
          history.replaceState(null, '', '#' + a.dataset.tab);
          setActive(a.dataset.tab);
        });
      
        // define aba inicial pela hash ou padrão
        function setFromHash() {
          const tab = (location.hash || '#postagens').slice(1);
          setActive(tab);
        }
      
        window.addEventListener('hashchange', setFromHash);
        requestAnimationFrame(() => requestAnimationFrame(setFromHash));
        window.addEventListener('resize', setFromHash);
      
        return; 
      }
      
    const links = Array.from(nav.querySelectorAll('a'));
    if (!links.length) return;
    
      
    const activeIndex =
      page === 'home' ? 0 :
      page === 'eventos' ? 1 :
      page === 'contrate' ? 2 : 0;
  
    links.forEach((a, i) => a.classList.toggle('active', i === activeIndex));
  

    let indicator = nav.querySelector('.indicator');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'indicator';
      nav.appendChild(indicator);
    }
  
    function placeIndicator() {
      const link = links[activeIndex];
      if (!link) return;
      indicator.style.left = link.offsetLeft + 'px';
      indicator.style.width = link.offsetWidth + 'px';
    }
  
    // posiciona após layout (2 rAF para garantir fontes/medidas)
    requestAnimationFrame(() => requestAnimationFrame(placeIndicator));
    // reajusta quando redimensionar
    window.addEventListener('resize', placeIndicator);
  });
  
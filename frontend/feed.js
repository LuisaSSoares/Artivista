document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let tab = urlParams.get("tab");
  
    // Normaliza o formato para camelCase (para bater com o HTML)
    const tabMap = {
      "musica-audiovisual": "musicaAudiovisual",
      "artes-plasticas": "artesPlasticas",
      "artes-cenicas": "artesCenicas",
      "literatura": "literatura"
    };
    tab = tabMap[tab] || tab;
  
    // Mostra apenas a seção correspondente
    const allSections = document.querySelectorAll("section[data-tab]");
    allSections.forEach(sec => sec.hidden = true);
    const feedSection = document.querySelector(`section[data-tab="${tab}"]`);
    if (!feedSection) {
      console.warn("Seção não encontrada:", tab);
      return;
    }
    feedSection.hidden = false;
  
    const feedContainer = feedSection.querySelector(".feedContainer");
  
    try {
      const res = await fetch("http://localhost:3520/feed/list");
      const data = await res.json();
  
      if (!data.success || !data.posts.length) {
        feedContainer.innerHTML = `
          <div class="noPublicationSpan">
            <img src="./icons/emoji-frown.svg" alt="">
            <span>Ainda sem postagens.</span>
          </div>`;
        return;
      }
  
      // Filtra por categoria
      const postsFiltrados = data.posts.filter(p => tabMap[p.artSection] === tab);
      if (postsFiltrados.length === 0) {
        feedContainer.innerHTML = `
          <div class="noPublicationSpan">
            <img src="./icons/emoji-frown.svg" alt="">
            <span>Nenhuma postagem nesta categoria.</span>
          </div>`;
        return;
      }
  
      // Renderiza posts
      feedContainer.innerHTML = "";
      for (const post of postsFiltrados) {
        const postCard = document.createElement("div");
        postCard.classList.add("postCard");
  
        // monta o carrossel
        const carouselId = `carousel-${post.id}`;
        const dataFormatada = new Date(post.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
          });
        const carouselItems = post.media.map((file, i) => {
          const ext = file.split('.').pop().toLowerCase();
          const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(ext);
          return `
            <div class="carousel-item ${i === 0 ? 'active' : ''}">
              ${isVideo
                ? `<video src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" controls muted></video>`
                : `<img src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" alt="midia">`}
            </div>`;
        }).join('');
  
        postCard.innerHTML = `
          <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">${carouselItems}</div>
            <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
              <span class="carousel-control-prev-icon"></span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
              <span class="carousel-control-next-icon"></span>
            </button>
          </div>
  
          <div class="postContent">
            <div class="postHeader">
              <img src="${post.artist.profileImage 
                ? `http://localhost:3520/uploads/profile/${post.artist.profileImage}`
                : './icons/person-circle.svg'}" id="profileImage" alt="">
              <div class="postUser">
                <div class="nameAndData">
                <p id="name">${post.artist.name}</p>
                <p class="dataPost">Publicado em ${dataFormatada}</p>   
                </div>
                <p id="username">@${post.artist.userName}</p>
                <div class="tagsFeed">
                  <span class="tag tag--1">${post.artist.activity1 || ''}</span>
                  ${post.artist.activity2 ? `<span class="tag tag--2">${post.artist.activity2}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="postInfos">
              <h3>${post.title}</h3>
              <p>${post.description}</p>
            </div>
            <div class="reactCommentGroup">
              <div class="postReact">
                <button><img src="./icons/heart.svg" alt=""></button>
                <button><img src="./icons/chat-dots.svg" alt=""></button>
                <button><img src="./icons/send-fill.svg" alt=""></button>
                <button><img src="./icons/bookmark-star.svg" alt=""></button>
              </div>
              <div class="postComment">
                <img src="./icons/person-circle.svg" alt="">
                <input type="text" placeholder="Digite algo...">
              </div>                                       
            </div>
          </div>
        `;
  
        feedContainer.appendChild(postCard);
      }
    } catch (err) {
      console.error("Erro ao carregar feed:", err);
      feedContainer.innerHTML = `<p>Erro ao carregar postagens.</p>`;
    }
  });
  
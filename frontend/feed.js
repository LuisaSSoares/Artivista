function buildProfileUrl(filename) {
  return filename
    ? `http://localhost:3520/uploads/profile/${filename}`
    : './icons/person-circle.svg';
}
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
    const videoExtensions = ['mp4', 'mov', 'webm', 'avi'];

    for (const post of postsFiltrados) {
      const postCard = document.createElement("div");
      postCard.classList.add("postCard");

      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const userProfileImg = buildProfileUrl(usuario?.profileImage);

      // monta o carrossel / media unica
      const dataFormatada = new Date(post.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        });
      
      // Verifica se há apenas uma mídia. Se sim, renderiza apenas a mídia.
      if (post.media.length === 1) {
          const file = post.media[0];
          const isVideo = videoExtensions.some(ext => file.toLowerCase().includes(`.${ext}`));

          postCard.innerHTML = `
            <div class="carousel">
              ${isVideo
                ? `<video src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" controls muted></video>`
                : `<img src="http://localhost:3520/uploads/feed/${file}" class="d-block w-100" alt="midia">`}
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
                  <button class="btn-like" data-id="${post.id}">
                  <img src="./icons/heart.svg" class="heart-icon" alt="Curtir">
                  <p class="contadorLikes"></p>
                  </button>

                  <button class="btn-comment" data-id="${post.id}">
                  <img src="./icons/chat-dots.svg" class="comment-icon" alt="">
                  <p class="contadorComentarios"></p>
                  </button>
                  
                  
                  <button class="btn-favorite" data-id="${post.id}">
                  <img src="./icons/bookmark-star.svg" alt="">
                  </button>
                  
                </div>

                <div class="postComment">
                  <img src="${userProfileImg}" class="profileImageComment" alt="">
                  <input type="text" placeholder="Digite algo...">
                  <button class="sendCommentBtn">
                  <img src="./icons/send.svg" alt="Enviar">
                  </button>
                </div>

              </div>
            </div>
          `;
      } else { // Se houver mais de uma mídia, monta o carrossel
        const carouselId = `carousel-${post.id}`;
        const carouselItems = post.media.map((file, i) => {
          // Lógica de verificação de vídeo
          const isVideo = videoExtensions.some(ext => file.toLowerCase().includes(`.${ext}`));
          
          // Lógica para extrair a extensão do arquivo e determinar o MIME type
          let videoType = '';
          let fileExtension = '';

          if (isVideo) {
              // Achar a extensão do nome original do arquivo, que está antes do timestamp
              const match = file.match(/\.(mp4|mov|webm|avi)(_|$)/i);
              if (match) {
                  fileExtension = match[1].toLowerCase();
                  if (fileExtension === 'mp4') videoType = 'video/mp4';
                  else if (fileExtension === 'mov') videoType = 'video/quicktime';
                  else if (fileExtension === 'webm') videoType = 'video/webm';
                  else if (fileExtension === 'avi') videoType = 'video/x-msvideo';
              }
          }

          return `
            <div class="carousel-item ${i === 0 ? 'active' : ''}">
              ${isVideo
                ? `<video src="http://localhost:3520/uploads/feed/${file}" 
                          class="d-block w-100" 
                          controls muted 
                          ${videoType ? `type="${videoType}"` : ''} 
                          autoplay="${i === 0 ? 'true' : 'false'}" 
                          preload="metadata"
                          loop
                          ></video>`
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
                <button class="btn-like" data-id="${post.id}">
                <img src="./icons/heart.svg" class="heart-icon" alt="Curtir">
                <p class="contadorLikes"></p>
                </button>

                <button class="btn-comment" data-id="${post.id}">
                <img src="./icons/chat-dots.svg" class="comment-icon" alt="">
                <p class="contadorComentarios"></p>
                </button>
                
                <button class="btn-favorite" data-id="${post.id}">
                <img src="./icons/bookmark-star.svg" alt="">
                </button>
              </div>
              <div class="postComment">
                <img src="${userProfileImg}" class="profileImageComment" alt="">
                <input type="text" placeholder="Digite algo...">
                <button class="sendCommentBtn">
                <img src="./icons/send.svg" alt="Enviar">
                </button>
              </div>                                       
            </div>
          </div>
        `;
      } // Fim do if/else de carrossel

      feedContainer.appendChild(postCard);
    }
    ativarReacoesDeCurtida();
    ativarComentarios();
    ativarFavoritos();
  } catch (err) {
    console.error("Erro ao carregar feed:", err);
    feedContainer.innerHTML = `<p>Erro ao carregar postagens.</p>`;
  }
});

//Função para ativar/desativar curtidas com animação e contador interno
async function ativarReacoesDeCurtida() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario.id) return; // usuário não logado

  // Busca posts curtidos pelo usuário logado
  let likedPosts = [];
  try {
    const res = await fetch(`http://localhost:3520/user/${usuario.id}/liked-posts`);
    const data = await res.json();
    if (data.success) {
      likedPosts = data.posts.map(p => p.id);
    }
  } catch (err) {
    console.error("Erro ao buscar posts curtidos:", err);
  }

  const likeButtons = document.querySelectorAll(".btn-like");

  likeButtons.forEach(async (button) => {
    const postId = button.getAttribute("data-id");
    const heartIcon = button.querySelector(".heart-icon");
    const likeCountEl = button.querySelector(".contadorLikes");

    // Atualiza contador de curtidas no botão
    async function atualizarContador() {
      try {
        const res = await fetch(`http://localhost:3520/post/likes/${postId}`);
        if (!res.ok) {
          likeCountEl.textContent = "0";
          return;
        }
        const data = await res.json();
        if (data.success) {
          const total = data.likes || 0;
          likeCountEl.textContent = total; // mostra só o número
        }
      } catch (err) {
        console.error("Erro ao atualizar contador:", err);
        likeCountEl.textContent = "0";
      }
    }

    // Define estado inicial (curtido/não curtido)
    if (likedPosts.includes(parseInt(postId))) {
      button.classList.add("liked");
    }

    await atualizarContador();

    // Clique no botão de curtida
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
          // --- Descurtir ---
          const res = await fetch("http://localhost:3520/post/unlike", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, userId: usuario.id }),
          });
          const data = await res.json();
          if (data.success) button.classList.remove("liked");
        } else {
          // --- Curtir ---
          const res = await fetch("http://localhost:3520/post/like", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, userId: usuario.id }),
          });
          const data = await res.json();
          if (data.success) button.classList.add("liked");
        }
      } catch (err) {
        console.error("Erro ao curtir/descurtir:", err);
      }
      atualizarContador(); // Atualiza o número após ação
    });
  });
}

// Função para ativar comentários com contador e envio
async function ativarComentarios() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario.id) return; // usuário não logado

  const commentButtons = document.querySelectorAll(".postReact button:nth-child(2)"); 
  const commentInputs = document.querySelectorAll(".postComment input");
  const sendButtons = document.querySelectorAll(".sendCommentBtn");

  // Função para atualizar contador de comentários
  async function atualizarContadorComentarios(postId, contadorEl) {
    try {
      const res = await fetch(`http://localhost:3520/comments/${postId}`);
      const data = await res.json();
      if (data.success) {
        const total = data.comments.length;
        contadorEl.textContent = total;
      } else {
        contadorEl.textContent = "0";
      }
    } catch (err) {
      console.error("Erro ao contar comentários:", err);
      contadorEl.textContent = "";
    }
  }
  

  // Percorre cada post para ativar o sistema
  document.querySelectorAll(".postCard").forEach((postCard, index) => {
    const postId = postCard.querySelector(".btn-like")?.getAttribute("data-id");
    const contadorEl = postCard.querySelector(".postReact button:nth-child(2) p");
    const input = postCard.querySelector(".postComment input");
    const sendBtn = postCard.querySelector(".postComment .sendCommentBtn");
    
    if (!postId || !contadorEl || !input || !sendBtn) return;

    atualizarContadorComentarios(postId, contadorEl); // contador inicial

    // Evento: Enviar comentário
    sendBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const content = input.value.trim();
      if (!content) return;

      try {
        const res = await fetch("http://localhost:3520/comments/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            postId,
            userId: usuario.id,
          }),
        });

        const data = await res.json();
        if (data.success) {
          input.value = "";
          atualizarContadorComentarios(postId, contadorEl);
        } else {
          console.error("Erro ao enviar comentário:", data.message);
        }
      } catch (err) {
        console.error("Erro ao enviar comentário:", err);
      }
    });
  });
}

// === Função para ativar/desativar favoritos com animação ===
async function ativarFavoritos() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario || !usuario.id) return;

  // Busca posts favoritados pelo usuário logado
  let favoritedPosts = [];
  try {
    const res = await fetch(`http://localhost:3520/user/${usuario.id}/favorites`);
    const data = await res.json();
    if (data.success) favoritedPosts = data.posts.map((p) => p.id);
  } catch (err) {
    console.error("Erro ao buscar posts favoritados:", err);
  }

  const favoriteButtons = document.querySelectorAll(".btn-favorite");

  favoriteButtons.forEach((button) => {
    const postId = button.getAttribute("data-id");
    const favoriteIcon = button.querySelector("img");

    // Estado inicial
    if (favoritedPosts.includes(parseInt(postId))) {
      button.classList.add("favorited");
      favoriteIcon.src = "./icons/bookmark-star-fill.svg"; // ícone amarelo preenchido
    }

    // Evento de clique
    button.addEventListener("click", async (e) => {
      e.preventDefault();

      if (!usuario || !usuario.id) {
        alert("Você precisa estar logado para favoritar postagens.");
        return;
      }

      const isFavorited = button.classList.contains("favorited");
      favoriteIcon.classList.add("animate"); // animação
      setTimeout(() => favoriteIcon.classList.remove("animate"), 200);

      try {
        if (isFavorited) {
          // --- Remover dos favoritos ---
          const res = await fetch("http://localhost:3520/favorites/remove", {
            method: "DELETE", // ✅ usa DELETE corretamente
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, userId: usuario.id }),
          });
          const data = await res.json();
          if (data.success) {
            button.classList.remove("favorited");
            favoriteIcon.src = "./icons/bookmark-star.svg"; // volta ao ícone padrão
            if (typeof atualizarContagemFavoritosPorSecao === 'function') {
              atualizarContagemFavoritosPorSecao();
            }
          } else {
            console.warn("Erro ao remover favorito:", data.message);
          }
        } else {
          // --- Adicionar aos favoritos ---
          const res = await fetch("http://localhost:3520/favorites/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, userId: usuario.id }),
          });
          const data = await res.json();
          if (data.success) {
            button.classList.add("favorited");
            favoriteIcon.src = "./icons/bookmark-star-fill.svg";
            if (typeof atualizarContagemFavoritosPorSecao === 'function') {
              atualizarContagemFavoritosPorSecao();
            }
          } else {
            console.warn("Erro ao favoritar post:", data.message);
          }
        }
      } catch (err) {
        console.error("Erro ao favoritar/desfavoritar:", err);
      }
    });
  });
}

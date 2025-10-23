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
          <div class="postMain">
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
        <div class="postMain">
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

  // ✅ usa o MESMO urlParams (não redeclarar)
  const openPostId = urlParams.get("post");
  const openComments = urlParams.get("openComments") === "true";

  if (openPostId && openComments) {
    // tenta abrir imediatamente
    let tries = 0;
    const tryOpen = () => {
      const postBtn = document.querySelector(`.btn-comment[data-id="${openPostId}"]`);
      if (postBtn) {
        postBtn.click(); // abre a lista de comentários
        return true;
      }
      return false;
    };

    if (!tryOpen()) {
      // fallback curto caso a UI ainda esteja pintando
      const timer = setInterval(() => {
        tries++;
        if (tryOpen() || tries >= 10) clearInterval(timer);
      }, 150);
    }
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

// === 💬 Sistema de listagem de comentários com paginação ===
function montarComentarioHTML(c) {
  const usuario = JSON.parse(localStorage.getItem("usuario")); // <-- Adiciona isso aqui!

  const isUserComment = usuario && usuario.id === c.userId;
  const profileImg = c.profileImage
    ? `http://localhost:3520/uploads/profile/${c.profileImage}`
    : './icons/person-circle.svg';
  const editadoLabel = c.editado ? '<span class="editLabel">(editado)</span>' : '';
  const tagsHTML = c.userType === 'artista'
    ? `
      <div class="tagsFeed">
        ${c.activity1 ? `<span class="tag tag--1">${c.activity1}</span>` : ''}
        ${c.activity2 ? `<span class="tag tag--2">${c.activity2}</span>` : ''}
      </div>`
    : '';
  let dataFormatada = "";
  if (c.sendData) {
    const data = new Date(c.sendData);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const hora = String(data.getHours()).padStart(2, '0');
    const min = String(data.getMinutes()).padStart(2, '0');
    dataFormatada = `${dia}/${mes}/${ano} às ${hora}:${min}`;
  }
  return `
    <div class="commentItem" data-comment-id="${c.id}">
      <img src="${profileImg}" class="profileImageComment" alt="">
      <div class="commentBody">
        <div class="commentHeader">
          <strong>${c.name}</strong>
          <span class="commentUsername">@${c.userName}</span>
          ${editadoLabel}
          ${isUserComment ? `
            <div class="commentActions">
              <button class="editCommentBtn" title="Editar">
                <img src="./icons/pencil-square.svg" alt="Editar">
              </button>
              <button class="deleteCommentBtn" title="Excluir">
                <img src="./icons/trash.svg" alt="Excluir">
              </button>
            </div>
          ` : ''}
        </div>
        ${dataFormatada ? `<span class="commentDate">${dataFormatada}</span>` : ''}
        ${tagsHTML}
        <p class="commentText">${c.comment}</p>
      </div>
    </div>
  `;
}


// === 💬 Sistema de listagem de comentários com paginação + fallback sem comentários ===
async function carregarComentarios(postId, container, page = 1, append = false) {
  try {
    const res = await fetch(`http://localhost:3520/comments/${postId}?page=${page}`);
    const data = await res.json();
    if (!data.success) return;

    if (!append) container.innerHTML = ''; // limpa na primeira vez

    // Caso não haja comentários
    if (!data.comments || data.comments.length === 0) {
      container.classList.add('semBorda');
      container.innerHTML = `
        <div class="noCommentsMsg">
          <img src="./icons/emoji-frown.svg" alt="">
          <span>Não há comentários neste post.</span>
        </div>
      `;
      return;
    } else {
      container.classList.remove('semBorda');
    }

    // --- Atualiza contador total de comentários no post ---
    const postCard = container.closest(".postCard");
    const contador = postCard?.querySelector(".contadorComentarios");
    if (contador) contador.textContent = data.total || data.comments.length;

    // --- Ordena: comentários do usuário logado vêm primeiro ---
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    let comentariosOrdenados = data.comments;

    if (usuario && usuario.id) {
      comentariosOrdenados = [
        ...data.comments.filter(c => c.userId === usuario.id),
        ...data.comments.filter(c => c.userId !== usuario.id)
      ];
    }

    // Renderiza os comentários ordenados
    comentariosOrdenados.forEach(c => {
      container.insertAdjacentHTML('beforeend', montarComentarioHTML(c));
    });

    const editedComments = JSON.parse(localStorage.getItem("editedComments") || "[]");
    editedComments.forEach(id => {
      const comment = container.querySelector(`[data-comment-id="${id}"]`);
      if (comment && !comment.querySelector(".editLabel")) {
        const label = document.createElement("span");
        label.classList.add("editLabel");
        label.textContent = " (editado)";
        comment.querySelector(".commentHeader").appendChild(label);
      }
    })

    // Remove controles antigos para evitar duplicação
    container.querySelectorAll('.commentsControls').forEach(ctrl => ctrl.remove());

    // Botões de paginação
    const controls = document.createElement('div');
    controls.classList.add('commentsControls');
    controls.innerHTML = `
      ${data.hasMore ? `<button class="loadMoreBtn" data-next="${page + 1}">Carregar mais comentários</button>` : ''}
      <button class="closeCommentsBtn">Fechar comentários</button>
    `;
    container.appendChild(controls);

    // Eventos dos botões
    const loadMore = controls.querySelector('.loadMoreBtn');
    const closeBtn = controls.querySelector('.closeCommentsBtn');

    if (loadMore) {
      loadMore.addEventListener('click', () => {
        carregarComentarios(postId, container, parseInt(loadMore.dataset.next), true);
        loadMore.remove(); // remove o botão após clicar
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        container.remove(); // remove toda a lista ao fechar
      });
    }
  } catch (err) {
    console.error('Erro ao carregar comentários:', err);
  }
}

// === 💬 Ativa o botão de chat para exibir ou esconder comentários ===
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-comment');
  if (!btn) return;

  const postCard = btn.closest('.postCard');
  const postComment = postCard.querySelector('.postComment');
  if (!postComment) return;

  // Garante que o container fique logo abaixo de .postComment
  let commentsContainer = postCard.querySelector('.commentsContainer');

  // 👉 Se já está visível, clicar de novo fecha
  if (commentsContainer && !commentsContainer.hidden) {
    commentsContainer.remove();
    return;
  }

  // Cria container se não existir
  if (!commentsContainer) {
    commentsContainer = document.createElement('div');
    commentsContainer.classList.add('commentsContainer');
    postCard.appendChild(commentsContainer);
  }

  commentsContainer.hidden = false;
  await carregarComentarios(btn.dataset.id, commentsContainer);
});

// === 🎯 Delegação global para editar/excluir comentários ===
document.addEventListener("click", async (e) => {
  const delBtn = e.target.closest(".deleteCommentBtn");
  const editBtn = e.target.closest(".editCommentBtn");

  // --- Excluir comentário ---
  if (delBtn) {
    const commentEl = delBtn.closest(".commentItem");
    const id = commentEl.dataset.commentId;

    if (confirm("Deseja realmente excluir este comentário?")) {
      try {
        const res = await fetch(`http://localhost:3520/comments/delete/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) commentEl.remove();
      } catch (err) {
        console.error("Erro ao excluir:", err);
      }
    }
    return;
  }

  // --- Editar comentário ---
  if (editBtn) {
    const commentEl = editBtn.closest(".commentItem");
    const commentTextEl = commentEl.querySelector(".commentText");
    const oldText = commentTextEl.textContent;

    // Evita abrir outro editor
    if (commentEl.querySelector(".editField")) return;

    commentTextEl.innerHTML = `
      <div class="editField">
        <input type="text" value="${oldText}" class="editInput">
        <div class="editBtns">
          <button class="saveEditBtn">Salvar</button>
          <button class="cancelEditBtn">Cancelar</button>
        </div>
      </div>
    `;
    return;
  }

  // --- Salvar edição ---
  const saveBtn = e.target.closest(".saveEditBtn");
  if (saveBtn) {
    const commentEl = saveBtn.closest(".commentItem");
    const id = commentEl.dataset.commentId;
    const newText = commentEl.querySelector(".editInput").value.trim();

    if (!newText) return alert("O comentário não pode estar vazio.");

    try {
      const res = await fetch(`http://localhost:3520/comments/edit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newText }),
      });
      const data = await res.json();

      if (data.success) {
        const commentTextEl = commentEl.querySelector(".commentText");
        commentEl.querySelector(".editField")?.remove();
        commentTextEl.textContent = newText;
      
        // Marca o comentário como editado no localStorage
        const id = commentEl.dataset.commentId;
        const editedComments = JSON.parse(localStorage.getItem("editedComments") || "[]");
        if (!editedComments.includes(id)) {
          editedComments.push(id);
          localStorage.setItem("editedComments", JSON.stringify(editedComments));
        }
      
        // Adiciona o selo "(editado)" se ainda não existir
        if (!commentEl.querySelector(".editLabel")) {
          const editLabel = document.createElement("span");
          editLabel.classList.add("editLabel");
          editLabel.textContent = " (editado)";
          commentEl.querySelector(".commentHeader").appendChild(editLabel);
        }
      }
      
      
    } catch (err) {
      console.error("Erro ao editar:", err);
    }
    return;
  }

  // --- Cancelar edição ---
  const cancelBtn = e.target.closest(".cancelEditBtn");
  if (cancelBtn) {
    const commentEl = cancelBtn.closest(".commentItem");
    const commentTextEl = commentEl.querySelector(".commentText");
    const oldText = commentTextEl.querySelector(".editInput")?.defaultValue;
    commentTextEl.textContent = oldText;
    return;
  }
});


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
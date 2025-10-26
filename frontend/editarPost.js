document.addEventListener("DOMContentLoaded", () => {
    // Se não há edição pendente, não faz nada
    const raw = localStorage.getItem("postEdicao");
    if (!raw) return;
  
    const postEdicao = JSON.parse(raw);
  
    // Campos da página criarPost.html
    const titleInput     = document.getElementById("titlePost");
    const descInput      = document.getElementById("descriptionPost");
    const sectionSelect  = document.getElementById("secao");
    const submitBtn      = document.getElementById("submitPost");
    const inputUpload    = document.getElementById("imageUpload");
    const previewCarousel= document.getElementById("previewCarousel");
    const carouselInner  = document.getElementById("carouselInner");
    const placeholder    = document.getElementById("uploadArea");
  
    if (!titleInput || !descInput || !sectionSelect || !submitBtn || !previewCarousel || !carouselInner || !placeholder) {
      return; // elementos não encontrados — evita erro
    }
  
    // 1) Preenche campos de texto/seleção
    titleInput.value    = postEdicao.title || "";
    descInput.value     = postEdicao.description || "";
    sectionSelect.value = postEdicao.artSection || "";
    
    // === Contador de caracteres (edição de posts) ===
const charCount = document.getElementById("charCount");
const maxChars = 225;

if (descInput && charCount) {
  // Atualiza contador inicial com o valor existente
  const len = descInput.value.length;
  charCount.textContent = `${len} / ${maxChars}`;
  charCount.classList.toggle("limit", len >= maxChars);

  // Atualiza em tempo real
  descInput.addEventListener("input", () => {
    const len = descInput.value.length;
    charCount.textContent = `${len} / ${maxChars}`;
    charCount.classList.toggle("limit", len >= maxChars);

    if (len > maxChars) {
      descInput.value = descInput.value.substring(0, maxChars);

      // Mostra balão de erro
      descInput.setCustomValidity(`O limite de ${maxChars} caracteres foi atingido.`);
      descInput.reportValidity();

      const clearError = () => {
        descInput.setCustomValidity('');
        descInput.removeEventListener('input', clearError);
      };
      descInput.addEventListener('input', clearError);
    }
  });
}
  
    // 2) Ajusta o botão
    submitBtn.textContent = "Republicar";
  
    // 3) MOSTRA AS MÍDIAS EXISTENTES RÁPIDO (URL direta, sem Blob!)
    //    - isso evita baixar o arquivo de novo e resolve a demora dos vídeos
    function renderExistingMedia(urls) {
        carouselInner.innerHTML = "";
      
        if (urls.length === 0) {
          previewCarousel.style.display = "none";
          placeholder.style.display = "flex";
          placeholder.innerHTML = "";
          return;
        }
      
        // 🔹 1 mídia → mostra direto no uploadArea
        if (urls.length === 1) {
          previewCarousel.style.display = "none";
          placeholder.style.display = "flex";
          placeholder.innerHTML = "";
      
          const fileUrl = urls[0];
          const isVideo = /\.(mp4|mov|webm|avi|mkv)(_|$)/i.test(fileUrl);
      
          const media = document.createElement(isVideo ? "video" : "img");
          media.className = "previewMedia";
          media.style.cursor = "default"; // 🔹 sem cursor pointer
          media.src = fileUrl;
      
          if (isVideo) {
            media.controls = true;
            media.muted = true;
            media.preload = "metadata";
          }
      
          const wrapper = document.createElement("div");
          wrapper.className = "media-wrapper";
          wrapper.appendChild(media);
      
          placeholder.innerHTML = "";
          placeholder.appendChild(wrapper);
          return;
        }
      
        // 🔹 2+ mídias → carrossel
        placeholder.style.display = "none";
        previewCarousel.style.display = "block";
      
        urls.forEach((fileUrl, index) => {
          const item = document.createElement("div");
          item.classList.add("carousel-item");
          if (index === 0) item.classList.add("active");
      
          const isVideo = /\.(mp4|mov|webm|avi|mkv)(_|$)/i.test(fileUrl);
          const el = document.createElement(isVideo ? "video" : "img");
          el.src = fileUrl;
          el.className = "previewMedia";
          el.style.cursor = "default"; // 🔹 sem cursor pointer
          if (isVideo) {
            el.controls = true;
            el.muted = true;
            el.preload = "metadata";
          }
      
          // 🔹 botão lixeira
          const trashBtn = document.createElement("img");
          trashBtn.src = "./icons/trash.svg";
          trashBtn.className = "remove-media";
          trashBtn.title = "Remover";
          trashBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            urls.splice(index, 1);
            postEdicao.media = urls.filter(u => !!u);
            renderExistingMedia(urls); // 🔹 se sobrar 1, volta automaticamente pro modo único
          });
      
          const wrapper = document.createElement("div");
          wrapper.className = "media-wrapper";
          wrapper.appendChild(el);
          wrapper.appendChild(trashBtn);
      
          item.appendChild(wrapper);
          carouselInner.appendChild(item);
        });
      }
      
    // Renderiza as mídias atuais do post (URLs completas)
        renderExistingMedia(postEdicao.media);
  
    // 4) Coleta NOVOS arquivos que o usuário adicionar (sem interferir no posts.js)
    //    - guardamos em um array próprio; o posts.js pode continuar a lógica dele
    const novosArquivos = [];
    inputUpload.addEventListener("click", (e) => {
        e.preventDefault(); // impede o clique padrão
        e.stopPropagation(); // evita qualquer propagação
      });
      
  
    // 5) Intercepta o clique do botão para chamar a EDIÇÃO (e impedir o handler de criação)
    submitBtn.addEventListener("click", async (e) => {
      // impede o listener do posts.js
      e.preventDefault();
      e.stopImmediatePropagation();
  
      // validação simples
      let hasError = false;
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const artSection = sectionSelect.value;

      // Título
      if (!titleInput.value.trim()) {
        titleInput.setCustomValidity("Por favor, insira um título.");
        titleInput.reportValidity();
        hasError = true;
      } else {
        titleInput.setCustomValidity("");
      }
      
      // Descrição
      if (!descInput.value.trim()) {
        descInput.setCustomValidity("Por favor, insira uma descrição.");
        descInput.reportValidity();
        hasError = true;
      } else {
        descInput.setCustomValidity("");
      }
      
      // Seção
      if (!sectionSelect.value) {
        sectionSelect.setCustomValidity("Por favor, selecione uma categoria.");
        sectionSelect.reportValidity();
        hasError = true;
      } else {
        sectionSelect.setCustomValidity("");
      }
      
      // Se houve algum erro, interrompe o envio
      if (hasError) return;
  
      // Monta o FormData para o PUT /feed/edit/:id
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("artSection", artSection);
  
      // MUITO IMPORTANTE:
      // Envia somente os NOMES das mídias antigas — o back já trata isso e faz o merge com as novas
      formData.append("existingMedia", JSON.stringify(postEdicao.media));
  
      // Anexa apenas os ARQUIVOS NOVOS (se o usuário adicionou)
      novosArquivos.forEach(file => formData.append("media", file));
  
      try {
        const res = await fetch(`http://localhost:3520/feed/edit/${postEdicao.id}`, {
          method: "PUT",
          body: formData
        });
        const data = await res.json();
  
        if (data?.success) {
          alert("Post atualizado com sucesso!");
          localStorage.removeItem("postEdicao");
          window.location.href = "./perfil.html";
        } else {
          alert(data?.message || "Erro ao atualizar.");
        }
      } catch (err) {
        console.error("Erro ao atualizar:", err);
        alert("Falha na atualização do post.");
      }
    }, true /* captura primeiro, para suplantar o listener de criação */);
  });
  
  
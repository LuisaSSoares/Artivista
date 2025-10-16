document.addEventListener("DOMContentLoaded", () => {
    const inputUpload = document.getElementById('imageUpload');
    const previewCarousel = document.getElementById('previewCarousel');
    const carouselInner = document.getElementById('carouselInner');
    const placeholder = document.getElementById('uploadArea');
  
    if (!inputUpload || !previewCarousel || !carouselInner || !placeholder) return;
  
    const placeholderDefaultHTML = placeholder.innerHTML;
    let allFiles = []; // armazena todas as seleções anteriores
  
    inputUpload.addEventListener('change', (event) => {
      const newFiles = Array.from(event.target.files || []);
  
      // evita duplicatas
      const uniqueNewFiles = newFiles.filter(
        nf => !allFiles.some(af => af.name === nf.name && af.lastModified === nf.lastModified)
      );
  
      // adiciona até 5 arquivos
      allFiles = [...allFiles, ...uniqueNewFiles].slice(0, 5);
  
      renderPreview();
      inputUpload.value = '';
    });
  
    // clicar no carrossel para adicionar mais imagens
    previewCarousel.addEventListener('click', (e) => {
      const isControl = e.target.closest('.carousel-control-prev, .carousel-control-next, .remove-media');
      if (isControl) return;
      inputUpload.click();
    });
  
    function renderPreview() {
      carouselInner.innerHTML = '';
  
      if (allFiles.length === 0) {
        previewCarousel.style.display = 'none';
        placeholder.style.display = 'flex';
        placeholder.innerHTML = placeholderDefaultHTML;
        return;
      }
  
      // 1 arquivo → mostra direto no quadrado
      if (allFiles.length === 1) {
        const file = allFiles[0];
        const ext = file.name.split('.').pop().toLowerCase();
        const isVideo = ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext);
  
        placeholder.innerHTML = '';
        const media = document.createElement(isVideo ? 'video' : 'img');
        media.className = 'previewMedia';
        media.src = URL.createObjectURL(file);
        if (isVideo) {
          media.controls = true;
          media.muted = true;
        }
  
        // botão de lixeira
        const trashBtn = document.createElement('img');
        trashBtn.src = './icons/trash.svg';
        trashBtn.className = 'remove-media';
        trashBtn.title = 'Remover';
        trashBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          allFiles = [];
          renderPreview();
        });
  
        const wrapper = document.createElement('div');
        wrapper.className = 'media-wrapper';
        wrapper.appendChild(media);
        wrapper.appendChild(trashBtn);
  
        placeholder.innerHTML = '';
        placeholder.appendChild(wrapper);
  
        previewCarousel.style.display = 'none';
        placeholder.style.display = 'flex';
        return;
      }
  
      // 2+ arquivos → carrossel
      allFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.classList.add('carousel-item');
        if (index === 0) item.classList.add('active');
  
        const ext = file.name.split('.').pop().toLowerCase();
        const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(ext);
        const el = document.createElement(isVideo ? 'video' : 'img');
        el.src = URL.createObjectURL(file);
        if (isVideo) {
          el.controls = true;
          el.muted = true;
        }
  
        // botão lixeira para cada slide
        const trashBtn = document.createElement('img');
        trashBtn.src = './icons/trash.svg';
        trashBtn.className = 'remove-media';
        trashBtn.title = 'Remover';
        trashBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          allFiles.splice(index, 1);
          renderPreview();
        });
  
        const wrapper = document.createElement('div');
        wrapper.className = 'media-wrapper';
        wrapper.appendChild(el);
        wrapper.appendChild(trashBtn);
  
        item.appendChild(wrapper);
        carouselInner.appendChild(item);
      });
  
      previewCarousel.style.display = 'block';
      placeholder.style.display = 'none';
    }

    const submitBtn = document.getElementById("submitPost");
    const titleInput = document.getElementById("titlePost");
    const descInput = document.getElementById("descriptionPost");
    const sectionSelect = document.getElementById("secao");
  
    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
  
      const title = titleInput.value.trim();
      const description = descInput.value.trim();
      const artSection = sectionSelect.value;
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      let artistId = null;
      
      // Verifica se o usuário é um artista antes de publicar
      try {
        const res = await fetch(`http://localhost:3520/profile/${usuario.id}`);
        const data = await res.json();
      
        if (data.success && data.data.service) {
          // É um artista -> usa o id do usuário como artistId
          artistId = usuario.id;
        } else {
          alert("Somente artistas podem publicar postagens. Crie seu perfil de artista primeiro.");
          return;
        }
      } catch (err) {
        console.error("Erro ao verificar perfil:", err);
        alert("Erro ao verificar seu perfil. Tente novamente.");
        return;
      }
  
      // Validação
      if (!title || !description || !artSection) {
        alert("Por favor, preencha todos os campos e selecione uma categoria.");
        return;
      }
  
      if (!artistId) {
        alert("Você precisa estar logado para publicar.");
        return;
      }
  
      if (allFiles.length === 0) {
        alert("Adicione pelo menos uma imagem ou vídeo.");
        return;
      }
      
      const files = allFiles;
  
      // Envia os dados via FormData
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("artSection", artSection);
      formData.append("artistId", artistId);
  
      files.forEach(file => formData.append("media", file));
  
      try {
        const res = await fetch("http://localhost:3520/feed/upload", {
          method: "POST",
          body: formData
        });
  
        const data = await res.json();
        if (data.success) {
          alert("Post publicado com sucesso!");
          window.location.href = `./feed.html?tab=${getFeedTab(artSection)}`;
        } else {
          alert(data.message || "Erro ao publicar o post.");
        }
      } catch (error) {
        console.error("Erro ao publicar:", error);
        alert("Falha ao publicar a postagem. Verifique sua conexão.");
      }
    });
  
    // Função para associar nome da categoria ao tab correto do feed
    function getFeedTab(section) {
      switch (section) {
        case "musica-audiovisual": return "musicaAudiovisual";
        case "artes-plasticas": return "artesPlasticas";
        case "artes-cenicas": return "artesCenicas";
        case "literatura": return "literatura";
      }
    }
  });
  
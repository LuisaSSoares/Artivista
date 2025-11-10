document.addEventListener("DOMContentLoaded", () => {
    const linkInput = document.getElementById("ticketLink");
    const previewArea = document.getElementById("previewArea");
    const tagOptions = document.querySelectorAll(".tagOption");
    const form = document.getElementById("eventForm");
    // === Contador de caracteres da descrição (cadastro) ===
  const description = document.getElementById("descriptionEvent");
  const charCount = document.getElementById("charCount");
  const maxChars = 255;

  if (description && charCount) {
    // Contador inicial
    const len = description.value.length;
    charCount.textContent = `${len} / ${maxChars}`;
    charCount.classList.toggle("limit", len >= maxChars);

    description.addEventListener("input", () => {
      const len = description.value.length;
      charCount.textContent = `${len} / ${maxChars}`;
      charCount.classList.toggle("limit", len >= maxChars);

      if (len > maxChars) {
        // Corta o texto no limite
        description.value = description.value.substring(0, maxChars);

        // Balão de erro nativo
        description.setCustomValidity(`O limite de ${maxChars} caracteres foi atingido.`);
        description.reportValidity();

        // Remove o aviso assim que o usuário editar
        const clearError = () => {
          description.setCustomValidity('');
          description.removeEventListener('input', clearError);
        };
        description.addEventListener('input', clearError);
      }
    });
  }

  
    let selectedType = "";
  
    // --- Seletor de tipo de evento (gratuito/pago) ---
    tagOptions.forEach(opt => {
      opt.addEventListener("click", () => {
        tagOptions.forEach(o => o.classList.remove("active"));
        opt.classList.add("active");
        selectedType = opt.dataset.type;
      });
    });
  
    // --- Preview automático da imagem do link (somente imagem, sem botão) ---
    linkInput.addEventListener("change", async () => {
      const url = linkInput.value.trim();
      if (!url) return;
      previewArea.innerHTML = "<span>Carregando imagem...</span>";
  
      try {
        const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        const imageUrl = data?.data?.image?.url;
  
        if (imageUrl) {
          previewArea.innerHTML = `
            <img src="${imageUrl}" alt="Prévia do evento" class="eventImage">
          `;
        } else {
          previewArea.innerHTML = "<span>Nenhuma imagem encontrada.</span>";
        }
      } catch (err) {
        console.error("Erro ao buscar imagem:", err);
        previewArea.innerHTML = "<span>Erro ao carregar imagem.</span>";
      }
    });
  
    // --- Cadastro do evento ---
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
    
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      if (!usuario || !usuario.id) {
        showFieldError(document.getElementById("titleEvent"), "Você precisa estar logado para criar um evento.");
        return;
      }
    
      // --- Coleta de campos ---
      const title = document.getElementById("titleEvent");
      const description = document.getElementById("descriptionEvent");
      const link = document.getElementById("ticketLink");
      const classification = document.getElementById("classification");
      const dateEvent = document.getElementById("dateEvent");
      const time = document.getElementById("timeEvent");
    
      // --- Validações visuais com balões ---
      if (!title.value.trim()) return showFieldError(title, "Digite o título do evento.");
      if (!description.value.trim()) return showFieldError(description, "Descreva o evento.");
      if (!link.value.trim()) return showFieldError(link, "Adicione o link do evento (site de ingresso).");
      if (!classification.value) return showFieldError(classification, "Selecione a classificação indicativa.");
      if (!selectedType) {
        const firstTag = document.querySelector(".tagOption");
        return showFieldError(firstTag, "Escolha o tipo de evento: gratuito ou pago.");
      }
      if (!dateEvent.value) return showFieldError(dateEvent, "Escolha a data do evento.");
      if (!time.value) return showFieldError(time, "Escolha o horário do evento.");
    
      // --- Monta e envia ---
      const body = {
        title: title.value.trim(),
        description: description.value.trim(),
        link: link.value.trim(),
        classification: classification.value,
        typeEvent: selectedType,
        dateEvent: dateEvent.value,
        time: time.value,
        artistId: usuario.id,
      };
    
      try {
        const res = await fetch("http://localhost:3520/events/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
    
        const data = await res.json();
        if (data.success) {
          form.reset();
          previewArea.innerHTML = "<span>Prévia da imagem do evento</span>";
          tagOptions.forEach(o => o.classList.remove("active"));
          setTimeout(() => window.location.href = "index.html", 800);
        } else {
          showFieldError(title, data.message || "Erro ao cadastrar evento.");
        }
      } catch (err) {
        console.error("Erro ao cadastrar evento:", err);
        showFieldError(title, "Erro ao conectar com o servidor.");
      }
    });
    const eventoDestacadoId = localStorage.getItem("eventoDestacado");
    if (eventoDestacadoId) {
      // espera o carregamento da lista
      setTimeout(() => {
        const card = document.querySelector(`[data-id="${eventoDestacadoId}"]`);
        if (card) {
          card.classList.add("eventoDestacado");
          card.scrollIntoView({ behavior: "smooth", block: "center" });
  
          // remove destaque após animação
          setTimeout(() => {
            card.classList.remove("eventoDestacado");
            localStorage.removeItem("eventoDestacado");
          }, 2500);
        }
      }, 1000);
    }    
  });

// --- LISTAGEM DOS EVENTOS CADASTRADOS ---
async function carregarEventos() {
  try {
    const listaEventos = document.getElementById("listaEventosECursos");
    if (!listaEventos) return;

    // ✅ Corrige o endpoint conforme o server.js
    const res = await fetch("http://localhost:3520/events");
    const result = await res.json();

    listaEventos.innerHTML = "";

    for (const evento of result.events) {
        // --- 🔍 Recupera a imagem real do link via Microlink ---
        let imageUrl = '';
        try {
          const linkRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(evento.link)}`);
          const linkData = await linkRes.json();
          imageUrl = linkData?.data?.image?.url || '';
        } catch (err) {
          console.warn("Erro ao buscar imagem de preview:", err);
        }
      
        // Garante que o evento tenha imagem disponível
        evento.previewImage = imageUrl || './img/default-event.png';
      
        // --- Cria o item na lista ---
        const item = document.createElement("li");
        item.innerHTML = `
          <div class="eventosECursos">
            <div class="headerEventoCurso">
              <h3 class="event-title">${evento.title}</h3>
              <p class="event-autor">De: ${evento.artistName || "Artista desconhecido"}</p>
              <span class="tagEvento">Evento</span>
            </div>
      
            <div class="event-content">
              <div class="event-image-container">
                <img 
                  src="${evento.previewImage}" 
                  alt="Imagem do evento"
                  class="event-image"
                >
              </div>
      
              <p class="event-description">${evento.description}</p>
      
              <div class="event-details">
                <div class="event-elements">
                  <div class="event-date">
                    <img src="./icons/calendar-date-fill.svg" alt="Ícone de calendário">
                    <span>${new Date(evento.dateEvent).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div class="event-time">
                    <img src="./icons/clock-fill.svg" alt="Ícone de relógio">
                    <span>${evento.time}</span>
                  </div>
                </div>
      
                <div>
                  <div class="event-classificacao event-elements">
                    <p><strong>Classificação:</strong> ${evento.classification}</p>
                    <div class="event-type" id="${evento.typeEvent.toLowerCase()}">
                    ${evento.typeEvent}
                  </div>
                  </div>
                </div>
              </div>
      
              <div class="event-button">
                <a href="${evento.link}" target="_blank" class="btnIngresso">Adquira seu ingresso</a>
              </div>
            </div>
          </div>
        `;    
        listaEventos.appendChild(item);
        item.setAttribute("data-id", evento.id);
      } 
      await verificarEventosECursos();     
  } catch (err) {
    console.error("Erro ao carregar eventos:", err);
    const listaEventos = document.getElementById("listaEventosECursos");
    if (listaEventos) {
      listaEventos.innerHTML = `
        <li><span class="noPublicationSpan"><span>Erro ao carregar eventos.</span></span></li>
      `;
    }
  }
}

// 🔄 Executa automaticamente na página de eventos
if (window.location.pathname.includes("eventosECursos.html")) {
  carregarEventos().then(() => {
    const eventoDestacadoId = localStorage.getItem("eventoDestacado");
    if (eventoDestacadoId) {
      setTimeout(() => {
        const card = document.querySelector(`[data-id="${eventoDestacadoId}"]`);
        if (card) {
          // destaque visual
          card.classList.add("eventoDestacado");
          // rolagem suave até o evento
          card.scrollIntoView({ behavior: "smooth", block: "center" });

          // remove o destaque e limpa storage
          setTimeout(() => {
            card.classList.remove("eventoDestacado");
            localStorage.removeItem("eventoDestacado");
          }, 2500);
        }
      }, 800); // tempo pra garantir carregamento
    }
  });
}

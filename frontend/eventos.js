document.addEventListener("DOMContentLoaded", () => {
    const linkInput = document.getElementById("ticketLink");
    const previewArea = document.getElementById("previewArea");
    const tagOptions = document.querySelectorAll(".tagOption");
    const form = document.getElementById("eventForm");
  
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
        alert("Você precisa estar logado para criar um evento.");
        return;
      }
  
      const body = {
        title: document.getElementById("titleEvent").value,
        dateEvent: document.getElementById("dateEvent").value,
        time: document.getElementById("timeEvent").value,
        description: document.getElementById("descriptionEvent").value,
        classification: document.getElementById("classification").value,
        typeEvent: selectedType,
        link: document.getElementById("ticketLink").value,
        artistId: usuario.id,
      };
  
      try {
        const res = await fetch("http://localhost:3520/events/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
  
        const data = await res.json();
  
        if (data.success) {
          alert("Evento criado com sucesso!");
          form.reset();
          previewArea.innerHTML = "<span>Prévia da imagem do evento</span>";
          tagOptions.forEach(o => o.classList.remove("active"));
  
          // 🔄 Redireciona para a tela inicial
          setTimeout(() => {
            window.location.href = "index.html";
          }, 800);
        } else {
          alert(data.message || "Erro ao cadastrar evento.");
        }
      } catch (err) {
        console.error("Erro ao enviar evento:", err);
        alert("Erro ao cadastrar evento.");
      }
    });
  });

// --- LISTAGEM DOS EVENTOS CADASTRADOS ---
async function carregarEventos() {
  try {
    const listaEventos = document.getElementById("listaEventosECursos");
    if (!listaEventos) return;

    // ✅ Corrige o endpoint conforme o server.js
    const res = await fetch("http://localhost:3520/events");
    const result = await res.json();

    // ✅ O array correto vem dentro de "events"
    if (!result.success || !Array.isArray(result.events) || result.events.length === 0) {
      listaEventos.innerHTML = `
        <li><span class="noPublicationSpan"><span>Nenhum evento encontrado.</span></span></li>
      `;
      return;
    }

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
                <div>
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
                  <div class="event-classificacao">
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
      }      
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
  carregarEventos();
}

// === CADASTRO DE CURSOS ===
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("eventForm");
    const title = document.getElementById("titleEvent");
    const description = document.getElementById("descriptionEvent");
    const link = document.getElementById("ticketLink");
    const classification = document.getElementById("classification");
    const dateEvent = document.getElementById("dateEvent");
    const startTime = document.getElementById("startTime");
    const endTime = document.getElementById("endTime");
    const durationValue = document.getElementById("durationValue");
    const durationUnit = document.getElementById("durationUnit");
    const typeOptions = document.querySelectorAll(".tagOption[data-type]");
    const modeOptions = document.querySelectorAll(".tagOption[data-mode]");
    const previewArea = document.getElementById("previewArea");
    const charCount = document.getElementById("charCount");
  
    let selectedType = "";
    let selectedMode = "";
  
    // === Seleção do tipo (gratuito/pago) ===
    typeOptions.forEach(tag => {
      tag.addEventListener("click", () => {
        typeOptions.forEach(t => t.classList.remove("active"));
        tag.classList.add("active");
        selectedType = tag.dataset.type;
      });
    });
  
    // === Seleção da modalidade (online/presencial) ===
    modeOptions.forEach(tag => {
      tag.addEventListener("click", () => {
        modeOptions.forEach(t => t.classList.remove("active"));
        tag.classList.add("active");
        selectedMode = tag.dataset.mode;
      });
    });
  
    // === Contador de caracteres da descrição ===
    if (description && charCount) {
      const maxChars = 225;
  
      const updateCount = () => {
        const len = description.value.length;
        charCount.textContent = `${len} / ${maxChars}`;
        charCount.classList.toggle("limit", len >= maxChars);
  
        if (len > maxChars) {
          description.value = description.value.substring(0, maxChars);
          description.setCustomValidity(`O limite de ${maxChars} caracteres foi atingido.`);
          description.reportValidity();
          description.setCustomValidity("");
        }
      };
  
      description.addEventListener("input", updateCount);
      updateCount();
    }
  
    // === Prévia da imagem (Microlink) ===
    if (link && previewArea) {
      link.addEventListener("input", async () => {
        const url = link.value.trim();
        if (!url) {
          previewArea.innerHTML = `<span>Prévia da imagem do curso</span>`;
          return;
        }
  
        try {
          const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
          const data = await res.json();
          const imageUrl = data?.data?.image?.url;
  
          if (imageUrl) {
            previewArea.innerHTML = `<img src="${imageUrl}" alt="Prévia da imagem do curso">`;
          } else {
            previewArea.innerHTML = `<span>Não foi possível carregar a prévia.</span>`;
          }
        } catch (err) {
          previewArea.innerHTML = `<span>Erro ao gerar prévia.</span>`;
          console.error("Erro na prévia do curso:", err);
        }
      });
    }
  
    // === Submissão do formulário ===
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
  
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (!usuario) {
          alert("Você precisa estar logado para cadastrar um curso.");
          return;
        }
  
        if (!selectedType || !selectedMode) {
          alert("Selecione o tipo e a modalidade do curso antes de continuar.");
          return;
        }
  
        if (!durationValue.value || !durationUnit.value) {
          alert("Informe a duração do curso antes de continuar.");
          return;
        }
  
        const body = {
          title: title.value.trim(),
          description: description.value.trim(),
          link: link.value.trim(),
          classification: classification.value,
          typeCourse: selectedType,
          modeCourse: selectedMode,
          dateCourse: dateEvent.value,
          startTime: startTime.value,
          endTime: endTime.value,
          durationValue: durationValue.value,
          durationUnit: durationUnit.value,
          artistId: usuario.id
        };
  
        try {
          const res = await fetch("http://localhost:3520/courses/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          const data = await res.json();
  
          if (data.success) {
            alert("Curso cadastrado com sucesso!");
            window.location.href = "./eventosECursos.html";
          } else {
            alert(data.message || "Erro ao cadastrar curso.");
          }
        } catch (err) {
          console.error("Erro ao cadastrar curso:", err);
          alert("Erro ao cadastrar curso.");
        }
      });
    }
  
    // === Listagem dos cursos na página eventosECursos.html ===
    if (window.location.pathname.includes("eventosECursos.html")) {
      carregarCursos();
    }
  });
  
  // === FUNÇÃO DE LISTAGEM DE CURSOS ===
  async function carregarCursos() {
    try {
      const listaEventos = document.getElementById("listaEventosECursos");
      if (!listaEventos) return;
  
      const res = await fetch("http://localhost:3520/courses");
      const data = await res.json();
  
      if (!data.success || !Array.isArray(data.courses) || data.courses.length === 0) {
        listaEventos.innerHTML = `
          <li><span class="noPublicationSpan"><span>Nenhum curso encontrado.</span></span></li>
        `;
        return;
      }
  
      for (const curso of data.courses) {
        let imageUrl = "";
        try {
          const linkRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(curso.link)}`);
          const linkData = await linkRes.json();
          imageUrl = linkData?.data?.image?.url || "./img/default-event.png";
        } catch {
          imageUrl = "./img/default-event.png";
        }
  
        const item = document.createElement("li");
        item.innerHTML = `
          <div class="eventosECursos">
            <div class="headerEventoCurso">
              <h3 class="event-title">${curso.title}</h3>
              <p class="event-autor">De: ${curso.artistName || "Artista desconhecido"}</p>
              <span class="tagEvento tagCurso">Curso</span>
            </div>
  
            <div class="event-content">
              <div class="event-image-container">
                <img src="${imageUrl}" alt="Imagem do curso" class="event-image">
              </div>
  
              <p class="event-description">${curso.description}</p>
  
              <div class="event-details">
                <div class="event-elements">
                  <div class="event-date">
                    <img src="./icons/calendar-date-fill.svg" alt="Ícone de calendário">
                    <span>${new Date(curso.dateCourse).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div class="event-time">
                    <img src="./icons/clock-fill.svg" alt="Ícone de relógio">
                    <span>${curso.startTime} - ${curso.endTime}</span>
                  </div>
                </div>
                <div>
                  <div class="event-classificacao event-elements">
                    <p><strong>Classificação:</strong> ${curso.classification}</p>
                    <div class="event-duration">
                    <p><strong>Duração:</strong> ${curso.durationValue} ${curso.durationUnit}(s)</p>
                  </div>
                  </div>
                  <div class="event-type" id="${curso.typeCourse.toLowerCase()}">${curso.typeCourse}</div>
                  <div class="event-type" id="${curso.modeCourse?.toLowerCase()}">${curso.modeCourse || ''}</div>
                </div>
              </div>
  
  
              <div class="event-button">
                <a href="${curso.link}" target="_blank" class="btnIngresso">Acesse o curso</a>
              </div>
            </div>
          </div>
        `;
        item.setAttribute("data-id", curso.id);
        listaEventos.appendChild(item);
      }
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    }
  }
  
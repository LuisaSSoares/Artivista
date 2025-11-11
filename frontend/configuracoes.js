document.addEventListener("DOMContentLoaded", async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) return;
  
    const nome = document.getElementById("nomeUsuario");
    const username = document.getElementById("username");
    const tipoPerfil = document.getElementById("tipoPerfil");
    const fotoPerfil = document.getElementById("fotoPerfil");
    const secaoLinksExternos = document.getElementById("secaoLinksExternos");
    const secaoServico = document.getElementById("secaoServico");
    const btnTornarArtista = document.getElementById("btnTornarArtista");
    const telefoneContainer = document.getElementById("telefoneContainer");
    const inputTel = document.getElementById("telefone");
    const checkboxServico = document.getElementById("venderServico");
    const btnAddLink = document.querySelector(".btnAddLink");
    const btnSalvarAlteracoes = document.getElementById("btnSalvar");
    if (usuario && usuario.userType !== "artista") {
      if (btnSalvarAlteracoes) btnSalvarAlteracoes.style.display = "none";
    }
    
  
    // === Modal Add Link ===
    const modalAdd = document.getElementById("modalAddLink");
    const inputNovoLink = document.getElementById("inputNovoLink");
    const btnSalvarLink = document.getElementById("salvarAddLink");
    const btnCancelarLink = document.getElementById("cancelarAddLink");
  
    let linksTemp = [];
  
    // === Mapeamento de plataformas ===
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
  
    inputTel.addEventListener("input", (e) => {
        let valor = e.target.value.replace(/\D/g, ""); // remove tudo que não for número
        if (valor.length > 11) valor = valor.slice(0, 11); // limita a 11 dígitos
      
        // aplica a formatação progressiva
        if (valor.length > 6) {
          valor = valor.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
        } else if (valor.length > 2) {
          valor = valor.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
        } else if (valor.length > 0) {
          valor = valor.replace(/^(\d{0,2})/, "($1");
        }
      
        e.target.value = valor;
      });
      
    const nomeDaPlataforma = (url) => {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        return plataformaNome[host] || host;
      } catch {
        return "Link externo";
      }
    };
  
    // === Renderização dos links ===
function renderLinks(links = []) {
    const lista = document.querySelector(".linksList");
    if (!lista) return;
    lista.innerHTML = "";
  
    links.forEach((url, index) => {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.className = "linkItem";
      a.innerHTML = `
        <img src="https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}">
        <span>${nomeDaPlataforma(url)}</span>
        <button class="removeLinkBtn" data-index="${index}" title="Remover">×</button>
      `;
      lista.appendChild(a);
    });
  
    // Mostrar ou ocultar botão "Adicionar link"
    if (btnAddLink) btnAddLink.style.display = links.length >= 3 ? "none" : "flex";
  
    // Botões de remoção
    const removeBtns = lista.querySelectorAll(".removeLinkBtn");
    removeBtns.forEach(btn => {
      btn.addEventListener("click", (event) => {
        // 🔹 Evita que o clique no X acione o link do <a>
        event.stopPropagation();
        event.preventDefault();
  
        const idx = parseInt(btn.dataset.index);
        linksTemp.splice(idx, 1);
        renderLinks(linksTemp);
      });
    });
  }
  
  
    // === Carregar perfil ===
    try {
      const res = await fetch(`http://localhost:3520/profile/${usuario.id}`);
      const data = await res.json();
      if (!data.success || !data.data) return;
  
      const perfil = data.data;
      const isArtist = perfil.userType === "artista";
  
      nome.textContent = perfil.name || "Usuário";
      username.textContent = perfil.userName ? `@${perfil.userName}` : "@usuario";
      tipoPerfil.textContent = isArtist ? "Artista" : "Usuário";
      fotoPerfil.src = perfil.profileImage
        ? `http://localhost:3520/uploads/profile/${perfil.profileImage}`
        : "./icons/person-circle.svg";
  
      if (secaoLinksExternos) secaoLinksExternos.hidden = !isArtist;
      if (secaoServico) secaoServico.hidden = !isArtist;
      if (btnTornarArtista) btnTornarArtista.style.display = isArtist ? "none" : "inline-block";
  
      // === Preencher links ===
      const wrap = document.getElementById("linksExternosContainer");
      if (wrap && isArtist) {
        let lista = wrap.querySelector(".linksList");
        if (!lista) {
          lista = document.createElement("div");
          lista.className = "linksList";
          lista.style.display = "flex";
          lista.style.flexWrap = "wrap";
          lista.style.gap = "14px";
          lista.style.marginTop = "10px";
          wrap.appendChild(lista);
        }
  
        linksTemp = [perfil.link1, perfil.link2, perfil.link3].filter(Boolean);
        renderLinks(linksTemp);
      }
  
      // === Telefone ===
      const vende = isArtist && perfil.service === "sim";
      checkboxServico.checked = !!vende;
      telefoneContainer.hidden = !vende;
      if (vende) inputTel.value = perfil.phone || "";
  
      checkboxServico.addEventListener("change", () => {
        if (!isArtist) {
          checkboxServico.checked = false;
          return;
        }
        telefoneContainer.hidden = !checkboxServico.checked;
      });
      function telefoneValidoMascara(v) {
        // precisa bater exatamente com (00) 00000-0000
        if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(v)) return false;
      
        const digits = v.replace(/\D/g, ""); // 11 dígitos
        // rejeita todos iguais (00000000000, 11111111111 etc.)
        if (/^(\d)\1{10}$/.test(digits)) return false;
        // rejeita DDD 00
        if (digits.slice(0, 2) === "00") return false;
      
        return true;
      }
      
      // limpa o balão ao digitar
      if (inputTel) {
        inputTel.addEventListener("input", () => {
          inputTel.setCustomValidity("");
        });
      }
      
      // se desmarcar o toggle de serviço, remove qualquer erro pendente do input
      if (checkboxServico) {
        checkboxServico.addEventListener("change", () => {
          if (!checkboxServico.checked && inputTel) {
            inputTel.setCustomValidity("");
          }
        });
      }
  
      // === Modal de adicionar link ===
      if (btnAddLink) {
        btnAddLink.addEventListener("click", () => {
          modalAdd.classList.add("show");
          inputNovoLink.value = "";
          inputNovoLink.focus();
        });
      }
  
      btnCancelarLink.addEventListener("click", () => {
        modalAdd.classList.remove("show");
        inputNovoLink.setCustomValidity("");
      });
  
      btnSalvarLink.addEventListener("click", () => {
        const url = inputNovoLink.value.trim();
        if (!url) {
          inputNovoLink.setCustomValidity("Digite um link válido.");
          inputNovoLink.reportValidity();
          return;
        }
  
        let host;
        try { host = new URL(url).hostname.replace(/^www\./, ""); }
        catch { host = null; }
  
        if (!Object.keys(plataformaNome).includes(host)) {
          inputNovoLink.setCustomValidity("Essa plataforma não é compatível.");
          inputNovoLink.reportValidity();
          return;
        }
  
        inputNovoLink.setCustomValidity("");
        modalAdd.classList.remove("show");
  
        if (!linksTemp.includes(url) && linksTemp.length < 3) linksTemp.push(url);
        renderLinks(linksTemp);
      });
  
      // === SALVAR ALTERAÇÕES ===
// === SALVAR ALTERAÇÕES ===
if (btnSalvarAlteracoes) {
    btnSalvarAlteracoes.addEventListener("click", async () => {
      try {
        if (isArtist) {
          const vendeServico = !!(checkboxServico && checkboxServico.checked);
          const tel = (inputTel?.value || "").trim();
  
          // 🔒 Regras quando vende serviço
          if (vendeServico) {
            if (!tel) {
              inputTel.setCustomValidity("Informe um número de telefone para vendas.");
              inputTel.reportValidity();
              return;
            }
            if (!telefoneValidoMascara(tel)) {
              inputTel.setCustomValidity("Número de telefone inválido. Use o formato (00) 00000-0000.");
              inputTel.reportValidity();
              return;
            }
          } else {
            // não vende serviço: telefone pode ser nulo e limpamos qualquer erro
            if (inputTel) inputTel.setCustomValidity("");
          }
  
          const body = {
            links: linksTemp,                 // seus links temporários visíveis
            phone: vendeServico ? tel : null, // só salva telefone se vender
            service: vendeServico ? "sim" : "não", // salva sim/não no BD
          };
  
          const res = await fetch(`http://localhost:3520/artist/updateConfig/${usuario.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
  
          const result = await res.json();
          if (result.success) {
            alert("Alterações salvas com sucesso!");
          } else {
            alert(result.message || "Erro ao salvar alterações.");
          }
        } else {
          alert("Alterações salvas!");
        }
      } catch (err) {
        console.error("Erro ao salvar:", err);
      }
    });
  }
  
  // ✅ Fecha o try/catch principal corretamente
  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
  }  
  // === BOTÃO SAIR ===
const btnSair = document.getElementById("btnSair");
if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html"; // ✅ volta para login
  });
}

// === BOTÃO EXCLUIR CONTA ===
const btnExcluir = document.getElementById("btnExcluir");
const modalExcluir = document.getElementById("modalExcluirConta");
const cancelarExclusao = document.getElementById("cancelarExclusao");
const confirmarExclusao = document.getElementById("confirmarExclusao");

// Abre modal
if (btnExcluir && modalExcluir) {
  btnExcluir.addEventListener("click", () => {
    modalExcluir.classList.add("show");
    modalExcluir.classList.remove("hidden");
  });
}

// Cancela exclusão
if (cancelarExclusao) {
  cancelarExclusao.addEventListener("click", () => {
    modalExcluir.classList.remove("show");
    setTimeout(() => modalExcluir.classList.add("hidden"), 200);
  });
}

// Confirma exclusão
if (confirmarExclusao) {
  confirmarExclusao.addEventListener("click", async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      if (!usuario?.id) {
        alert("Usuário não encontrado.");
        return;
      }

      const res = await fetch(`http://localhost:3520/user/delete/${usuario.id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.success) {
        alert("Conta excluída com sucesso!");
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "login.html";
      } else {
        alert(result.message || "Erro ao excluir conta.");
      }
    } catch (err) {
      console.error("Erro ao excluir conta:", err);
      alert("Erro no servidor. Tente novamente.");
    }
  });
}
// Confirma exclusão
if (confirmarExclusao) {
    confirmarExclusao.addEventListener("click", async () => {
      try {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (!usuario?.id) {
          alert("Usuário não encontrado.");
          return;
        }
  
        const res = await fetch(`http://localhost:3520/user/delete/${usuario.id}`, {
          method: "DELETE",
        });
        const result = await res.json();
  
        if (result.success) {
          alert("Conta excluída com sucesso!");
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "login.html";
        } else {
          alert(result.message || "Erro ao excluir conta.");
        }
      } catch (err) {
        console.error("Erro ao excluir conta:", err);
        alert("Erro no servidor. Tente novamente.");
      }
    });
  }
  document.getElementById("btnTornarArtista").addEventListener("click", async () => {
    window.location.href = "artista.html";
  });
  });
  
// Links externos:
let linksExternos = [];
document.addEventListener('DOMContentLoaded', () => {
    const linkInput = document.getElementById('link');
    const addLinkBtn = document.getElementById('addLinkBtn');
    const linksContainer = document.getElementById('linksContainer');
    const mapaPlataformas = {
        "instagram.com": "Instagram",
        "youtube.com": "YouTube",
        "youtu.be": "YouTube",
        "behance.net": "Behance",
        "facebook.com": "Facebook",
        "twitter.com": "Twitter",
        "x.com": "Twitter (X)",
        "linkedin.com": "LinkedIn",
        "soundcloud.com": "SoundCloud",
        "tiktok.com": "TikTok",
        "vimeo.com": "Vimeo",
        "bandcamp.com": "Bandcamp",
        "artstation.com": "ArtStation",
        "pinterest.com": "Pinterest",
        "br.pinterest.com": "Pinterest",
        "deviantart.com": "DeviantArt",
        "github.io": "Portfólio (GitHub Pages)",
        "medium.com": "Medium",
        "notion.so": "Notion",
        "cargocollective.com": "Cargo",
        "wordpress.com": "WordPress",
        "canva.com": "Canva",
        "spotify.com": "Spotify",
        "apple.com": "Apple Music",
        "music.apple.com": "Apple Music",
        "deezer.com": "Deezer",
        "tidal.com": "Tidal",
        "amazon.com": "Amazon Music",
        "music.amazon.com": "Amazon Music",
        "soundcloud.com": "SoundCloud",
        "audible.com": "Audible",
        "napster.com": "Napster",
        "youtube-music.com": "YouTube Music",
        "youtube.com/music": "YouTube Music",
        "music.youtube.com": "YouTube Music",
        "wattpad.com": "Wattpad",
        "scribd.com": "Scribd",
        "smashwords.com": "Smashwords",
        "lulu.com": "Lulu",
        "kdp.amazon.com": "Kindle Direct Publishing",
        "bookfunnel.com": "BookFunnel",
        "inkitt.com": "Inkitt",
        "dribbble.com": "Dribbble",
        "coroflot.com": "Coroflot",
        "carbonmade.com": "Carbonmade",
        "portfolio.adobe.com": "Adobe Portfolio",
        "fabrik.io": "Fabrik",
        "crevado.com": "Crevado"
      };

      document.querySelector('.btn.finalizar').addEventListener('click', (e) => {
        e.preventDefault(); 
        salvarArtista(); 
      });
  
    function obterNomePlataforma(url) {
      try {
        const hostname = new URL(url).hostname.replace('www.', '');
        return mapaPlataformas[hostname] || hostname;
      } catch {
        return "Link externo";
      }
    }
  
    function atualizarLinks() {
      linksContainer.innerHTML = '';
  
      linksExternos.forEach((url, index) => {
        const nome = obterNomePlataforma(url);
        let hostname;
  
        try {
          hostname = new URL(url).hostname.replace('www.', '');
        } catch {
          hostname = '';
        }
  
        const tag = document.createElement('div');
        tag.className = 'linkItem';
        tag.innerHTML = `
          <img src="https://www.google.com/s2/favicons?sz=64&domain_url=${url}" alt="" style="width: 16px; height: 16px; margin-right: 8px;">
          <span>${nome}</span>
          <button title="Remover link">&times;</button>
        `;
  
        tag.querySelector('button').addEventListener('click', () => {
          linksExternos.splice(index, 1);
          atualizarLinks();
          verificarLimiteLinks();
        });
  
        linksContainer.appendChild(tag);
      });
    }
  
    function verificarLimiteLinks() {
      if (linksExternos.length >= 3) {
        linkInput.disabled = true;
        addLinkBtn.disabled = true;
        linkInput.placeholder = "Máximo de 3 links adicionados";
      } else {
        linkInput.disabled = false;
        addLinkBtn.disabled = false;
        linkInput.placeholder = "Adicione até 3 links para perfis externos (opcional)";
      }
    }
  
    // Limpa o erro se o usuário digitar algo novo
    linkInput.addEventListener('input', () => {
      linkInput.setCustomValidity("");
    });
  
    addLinkBtn.addEventListener('click', () => {
      const url = linkInput.value.trim();
  
      if (!url) {
        return;
      }
      
// Verifica se a plataforma é reconhecida
const hostname = (() => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return null;
    }
  })();

  const plataformaReconhecida = hostname && Object.keys(mapaPlataformas).includes(hostname);

  if (!plataformaReconhecida) {
    linkInput.setCustomValidity("Essa plataforma não é reconhecida. Verifique o link.");
    linkInput.reportValidity();
    return;
  }

  //Verifica se link já foi adicionado
  if (linksExternos.includes(url)) {
    linkInput.setCustomValidity("Este link já foi adicionado.");
    linkInput.reportValidity();
    return;
  }

  if (linksExternos.length < 3) {
    linksExternos.push(url);
    atualizarLinks();
    linkInput.value = '';
    verificarLimiteLinks();
    linkInput.setCustomValidity(""); 
    linkInput.focus();
  }
});
  
    verificarLimiteLinks();
  });
  
// Atividades do user artista -> tags de identificação
const atividades = [
    "Animação", "Artesanato", "Arte Ambiental", "Arte Afro-brasileira", "Arte Conceitual", "Arte Digital", "Arte Feminista", "Arte Indígena", "Arte Interativa", "Arte Naïf", "Arte Sacra", "Arte Sequencial", "Arte Sonora", "Arte Têxtil", "Arte Urbana", "Arte Terapia", "Audiovisual", "Ballet", "Body Art", "Cerâmica", "Circo", "Composição Musical", "Coreografia", "Cultura Popular", "Curadoria", "Dança", "Dança Contemporânea", "Dança de Rua", "Desenho", "Design", "Design de Interiores", "Design de Moda", "Design de Produto", "Design Gráfico", "Direção Artística", "Direção Cinematográfica", "DJ/Produção Musical", "Dramaturgia", "Edição de Vídeo", "Escultura", "Figurino", "Fotografia", "Grafite", "Gravura", "Ilustração", "Instalação Artística", "Interpretação Teatral", "Jóias e Ourivesaria", "Land Art", "Literatura", "Luthieria", "Maquiagem Artística", "Mediação Cultural", "Moda", "Mímica", "Multimídia", "Música", "Música Instrumental", "Música Vocal", "Performance", "Pintura", "Poesia", "Produção Cultural", "Produção de Eventos", "Quadrinhos", "Roteiro", "Sound Design", "Teatro", "Videoarte","Cinema"].sort();
  
  const buscaInput = document.getElementById("buscaArea");
  const sugestoesLista = document.getElementById("sugestoes");
  const tagsContainer = document.getElementById("areasSelecionadas");
  
  let selecionadas = [];
  
  function atualizarTags() {
    tagsContainer.innerHTML = "";
  
    selecionadas.forEach((atividade) => {
      const tag = document.createElement("div");
      tag.className = "tag";
      tag.innerHTML = `
        ${atividade}
        <button class="remover-tag" title="Remover atividade">&times;</button>
      `;
  
      tag.querySelector(".remover-tag").addEventListener("click", () => {
        selecionadas = selecionadas.filter(item => item !== atividade);
        atualizarTags();
        atualizarSugestoes(buscaInput.value);
      });
  
      tagsContainer.appendChild(tag);
    });
  
    buscaInput.placeholder = selecionadas.length < 2 ? "Informe sua(s) área(s) de atuação" : "";
  }
  
  function atualizarSugestoes(valor) {
    sugestoesLista.innerHTML = "";
  
    if (selecionadas.length >= 2) {
      sugestoesLista.style.display = "none";
      return;
    }
  
    let filtradas = [];
  
    if (!valor.trim()) {
      // Se o input estiver vazio, mostrar todas as opções que ainda não estão selecionadas
      filtradas = atividades.filter(item => !selecionadas.includes(item));
    } else {
      // Se o usuário digitou algo, filtra conforme o texto
      filtradas = atividades.filter(item =>
        item.toLowerCase().includes(valor.toLowerCase()) &&
        !selecionadas.includes(item)
      );
    }
  
    if (filtradas.length === 0) {
      sugestoesLista.style.display = "none";
      return;
    }
  
    filtradas.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
  
      li.addEventListener("click", () => {
        if (selecionadas.length < 2) {
          selecionadas.push(item);
          atualizarTags();
          buscaInput.value = "";
          atualizarSugestoes("");
        }
      });
  
      sugestoesLista.appendChild(li);
    });
  
    sugestoesLista.style.display = "block";
  }
  
  // Evento para buscar enquanto digita
  buscaInput.addEventListener("input", () => {
    atualizarSugestoes(buscaInput.value);
  });
  
  // Mostrar sugestões ao focar no input
  buscaInput.addEventListener("focus", () => {
    atualizarSugestoes(buscaInput.value);
  });
  
  // Fechar lista ao clicar fora
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".areaContainer")) {
      sugestoesLista.style.display = "none";
    }
  });
  const servicoCheckbox = document.getElementById('servico');
  const telefoneContainer = document.getElementById('telefoneContainer');
  const telefoneInput = document.getElementById('telefone');
if (telefoneInput) {
  telefoneInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, ''); // remove tudo que não for número
    if (v.length > 11) v = v.slice(0, 11); // limita a 11 dígitos

    if (v.length > 6) {
      e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    } else if (v.length > 0) {
      e.target.value = `(${v}`;
    }
  });
}

if (servicoCheckbox && telefoneContainer) {
  servicoCheckbox.addEventListener('change', () => {
    telefoneContainer.style.display = servicoCheckbox.checked ? 'block' : 'none';
  });
}

async function salvarArtista() {
  const userId = localStorage.getItem('userId');
  const service = document.getElementById('servico').checked ? 'sim' : 'não';
  const phone = document.getElementById('telefone')?.value.trim() || null; // ✅ novo

  const activity1 = selecionadas[0] || null;
  const activity2 = selecionadas[1] || null;

  const areaInput = document.getElementById('buscaArea');

  if (!activity1) {
    areaInput.setCustomValidity("Por favor, informe ao menos uma área de atuação.");
    areaInput.reportValidity();
    return;
  } else {
    areaInput.setCustomValidity("");
  }

  // ✅ envia telefone só se o artista ativar a venda de serviço
  const dadosArtista = {
    service,
    phone: service === 'sim' ? phone : null,
    userId,
    activity1,
    activity2,
    links: linksExternos
  };

  try {
    const response = await fetch('http://localhost:3520/artist/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
      },
      body: JSON.stringify(dadosArtista)
    });

    let data = {};
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (response.ok) {
      window.location.href = 'index.html';
    } else {
      alert('Erro: ' + (data.message || 'Erro ao cadastrar artista.'));
    }
  } catch (error) {
    alert('Erro na requisição: ' + error.message);
  }
}

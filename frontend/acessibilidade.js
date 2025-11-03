// === LEITURA DE TELA GLOBAL — versão final corrigida ===
let synth = window.speechSynthesis;
let leituraAtiva = localStorage.getItem("leituraTela") === "true";
let leituraAtual = null;

// === Detecta e anuncia o contexto da página ===
function detectarPagina() {
  const path = window.location.pathname.toLowerCase();

  if (path.includes("login") || path.includes("cadastro") || path.includes("artista.html"))
    return null;

  if (path.includes("configuracoes")) return "configurações";
  if (path.includes("criacaoconteudo") || path.includes("criarconteudo")) return "criação de conteúdo";
  if (path.includes("criarcurso")) return "criação de curso";
  if (path.includes("criarevento")) return "criação de evento";
  if (path.includes("criarpost")) return "criação de post";
  if (path.includes("index") || path.includes("home") || path === "/") return "inicial";

// === PERFIL ===
if (path.includes("perfil")) {
    const usuarioLogado = JSON.parse(localStorage.getItem("usuario"));
    const viewedIdParam = new URLSearchParams(location.search).get("id");
    const viewedIdDOM = document.querySelector("#perfilArtista, #perfilComum")?.dataset?.userid;
  
    const viewedId = viewedIdParam
      ? Number(viewedIdParam)
      : (viewedIdDOM ? Number(viewedIdDOM) : null);
    const loggedId = usuarioLogado?.id ? Number(usuarioLogado.id) : null;
  
    if (viewedId !== null && loggedId !== null && viewedId === loggedId) {
      return "seu perfil";
    }
    if (viewedId === null && loggedId !== null) {
      return "seu perfil";
    }
  
    // ✅ Perfil de terceiro agora é tratado no script.js
    return null;
  }
  
  
  // fallback
  return document.title.replace("-", " ").replace(/_/g, " ").toLowerCase();
}

// === Anúncio da página ===
function anunciarPagina() {
  const contexto = detectarPagina();
  if (contexto) {
    setTimeout(() => {
      if (contexto === "seu perfil") {
        falar("Página do seu perfil do Artivista ativada.");
      } else {
        falar(`Página de ${contexto} do Artivista ativada.`);
      }
    }, 200);
  }
}

// === Inicialização global ===
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("leitorTela");
  if (toggle) toggle.checked = leituraAtiva;

  if (leituraAtiva) ativarLeitor(true);

  if (toggle) {
    toggle.addEventListener("change", async () => {
      const ativando = toggle.checked;
      leituraAtiva = ativando;
      localStorage.setItem("leituraTela", leituraAtiva);

      if (ativando) {
        falar("Leitura de tela ativada.", 0, true);
        await new Promise(r => setTimeout(r, 2100));
        falar("Passe o mouse ou o foco sobre um elemento para ouvir seu conteúdo.", 0, true);
        ativarLeitor(false);
      } else {
        falar("Leitura de tela desativada.", 0, true);
        desativarLeitor();
      }
    });
  }
});

// === Core da leitura ===
function falar(texto, delay = 0, force = false) {
  if (!texto) return;
  if (!leituraAtiva && !force) return;
  pararFala();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  utterance.rate = 1;
  utterance.pitch = 1;
  leituraAtual = utterance;
  setTimeout(() => synth.speak(utterance), delay);
}

function pararFala() {
  if (synth.speaking) synth.cancel();
  leituraAtual = null;
}

// === Ativação/desativação ===
function ativarLeitor(anunciar = false) {
    if (anunciar) {
      // Primeiro fala a página, e só depois ativa os listeners
      anunciarPagina();
      setTimeout(() => {
        document.body.addEventListener("mouseenter", handleHover, true);
        document.body.addEventListener("focusin", handleFocus, true);
        document.body.addEventListener("change", handleChange, true);
        document.body.addEventListener("click", handleClick, true);
        document.body.addEventListener("input", handleTyping, true);
      }, 200); // espera o anúncio da página terminar
    } else {
      // Se não for anunciar, ativa direto
      document.body.addEventListener("mouseenter", handleHover, true);
      document.body.addEventListener("focusin", handleFocus, true);
      document.body.addEventListener("change", handleChange, true);
      document.body.addEventListener("click", handleClick, true);
      document.body.addEventListener("input", handleTyping, true);
    }
  }
function desativarLeitor() {
  document.body.removeEventListener("mouseenter", handleHover, true);
  document.body.removeEventListener("focusin", handleFocus, true);
  document.body.removeEventListener("change", handleChange, true);
  document.body.removeEventListener("click", handleClick, true);
  document.body.removeEventListener("input", handleTyping, true);
  pararFala();
}

// === Eventos ===
function handleHover(e) {
  if (!leituraAtiva) return;
  const texto = extrairTexto(e.target);
  if (texto) falar(texto);
}

function handleFocus(e) {
  if (!leituraAtiva) return;
  const el = e.target;
  const texto = extrairTexto(el);
  if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
    const tipo = el.type === "checkbox" ? "caixa de seleção" :
                 el.type === "tel" ? "número de telefone" :
                 el.type === "text" ? "texto" :
                 el.tagName === "SELECT" ? "seleção" : "campo";
    if (texto && texto.toLowerCase() !== "campo") {
      falar(`Campo de ${texto} ativado.`);
    } else {
      falar(`Campo de ${tipo} ativado.`);
    }
  } else if (texto) falar(texto);
}

function handleTyping(e) {
    if (!leituraAtiva) return;
    const el = e.target;
    if (!["INPUT", "TEXTAREA"].includes(el.tagName)) return;
  
    // Usa o tipo de entrada para falar corretamente o que foi digitado
    const it = e.inputType || "";
  
    // Inserção de texto normal (caracter a caracter)
    if (it === "insertText") {
      const ch = e.data;
      if (!ch) return;
      if (ch === " ") {
        // espaço inserido
        falar("espaço");
      } else {
        // letra/dígito/sinal inserido
        falar(ch);
      }
      return;
    }
  
    // Nova linha (Enter)
    if (it === "insertLineBreak") {
      falar("nova linha");
      return;
    }
  
    // Backspace
    if (it === "deleteContentBackward") {
      falar("apagar");
      return;
    }
  
    // Delete
    if (it === "deleteContentForward") {
      falar("apagar adiante");
      return;
    }
  }
  
  function handleChange(e) {
    if (!leituraAtiva) return;
    const el = e.target;
  
    // 🔒 Ignora o próprio toggle do leitor (pra não dizer "campo de campo desativado")
    if (el.id === "leitorTela") return;
  
    if (el.type === "checkbox" || el.role === "switch") {
      const texto = extrairTexto(el) || "campo";
      const status = el.checked ? "ativado" : "desativado";
      falar(`Campo de ${texto} ${status}.`);
    } else if (el.tagName === "SELECT") {
      const texto = extrairTexto(el);
      const valor = el.options[el.selectedIndex]?.text || el.value;
      if (texto) falar(`Campo de ${texto} alterado para ${valor}.`);
    }
  }
  
function handleClick(e) {
  if (!leituraAtiva) return;
  const el = e.target;
  if (el.classList.contains("tagOption")) {
    const nome = el.innerText.trim();
    const ativo = el.classList.contains("ativo") || el.classList.contains("selected");
    if (ativo) falar(`Tag ${nome} selecionada.`);
    else falar(`Tag ${nome} ativada.`);
  }
}

// === Extrai texto para leitura ===
function extrairTexto(el) {
  if (!el) return "";

  if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    const labelTxt = label ? label.innerText.trim() : "";
    const placeholderTxt = el.placeholder ? el.placeholder.trim() : "";

    if (el.type === "tel" || el.id === "telefone") {
      const valor = el.value?.trim();
      if (valor && valor.length > 0) {
        return `${labelTxt || "número de telefone"}. Valor atual: ${valor}`;
      } else if (placeholderTxt) {
        return `${labelTxt || "número de telefone"}. Formato esperado: ${placeholderTxt}`;
      }
      return labelTxt || "número de telefone";
    }

    if (el.type === "checkbox" && (el.id === "venderServico" || el.name.includes("serviço"))) {
      return "serviço";
    }

    if (labelTxt && placeholderTxt) return `${labelTxt}. ${placeholderTxt}`;
    if (labelTxt) return labelTxt;
    if (placeholderTxt) return placeholderTxt;
  }

  if (el.alt) return el.alt;
  if (el.ariaLabel) return el.ariaLabel;
  if (el.innerText) return el.innerText.trim();
  return "";
}

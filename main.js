// sinco institute
// Herói: o logo pequeno em cima e uma frase só.

const LABS = [
  {
    nome: "sinco software",
    cor: "var(--lab-software)", // musgo
    texto: "Software made with and for communities: tools people can understand and change.",
    link: "https://www.are.na/sinco-institute/sinco-software",
    rotuloLink: "are.na ↗",
  },
  {
    nome: "sinco hardware",
    cor: "var(--lab-hardware)", // laranja (terracota no tema terra)
    texto: "Modular gear, made on demand. First piece: shoulder_bag.(0).",
    link: "https://www.are.na/sinco-institute/sinco-hardware",
    rotuloLink: "are.na ↗",
  },
  {
    nome: "sinco social",
    cor: "var(--lab-social)", // ocre
    texto: "A zero-trust social network, against platforms that concentrate power in a few hands and turn people into machine minders — what Schumacher warned about fifty years ago.",
    link: "https://www.are.na/sinco-institute/sinco-social",
    rotuloLink: "are.na ↗",
  },
  {
    nome: "sinco surfistas",
    cor: "var(--lab-surfistas)", // mar
    texto: "A counterculture page on Instagram.",
    link: "https://www.are.na/sinco-institute/sinco-surfistas",
    rotuloLink: "are.na ↗",
  },
];

const AVISOS = {
  carregando: "loading…",
  erro: "Couldn’t load the library right now. Try again in a minute.",
  vazio: "Nothing here yet.",
};

// A biblioteca é uma amostra aleatória dos canais da sinco no Are.na.
const corDoLab = (nome) => LABS.find((l) => l.nome === nome)?.cor;
const FONTES = [
  { canal: "sinco-institute", nome: "institute" },
  { canal: "sinco", nome: "sinco" },
  { canal: "sinco-hardware", nome: "hardware", cor: corDoLab("sinco hardware") },
  { canal: "sinco-software", nome: "software", cor: corDoLab("sinco software") },
  { canal: "sinco-social", nome: "social", cor: corDoLab("sinco social") },
  { canal: "sincoos", nome: "sincoOS" },
];
const POR_PAGINA = 24; // blocos pedidos por canal, numa página sorteada
const POR_CANAL = 4; // blocos que entram na lista por canal
const TIPOS = new Set(["Link", "Text", "Image", "Attachment", "Embed"]);

const $ = (s) => document.querySelector(s);
const heroi = $(".heroi");
const menu = $("#menu");

// ---------- labs ----------

const peca = `<svg class="peca" viewBox="0 0 55.5366 22" aria-hidden="true"><use href="#sinco" /></svg>`;

function montarLabs() {
  $("#lista-labs").innerHTML = LABS.map(
    (n, i) => `<li style="--cor:${n.cor}"><div class="linha">
      <span class="linha-n mono">${String(i + 1).padStart(2, "0")}</span>
      <span class="linha-nome">${peca}${n.nome}</span>
      <span class="linha-texto">${n.texto}</span>
      <a class="linha-link mono" href="${n.link}" target="_blank" rel="noopener">${n.rotuloLink}</a>
    </div></li>`
  ).join("");
}

// ---------- biblioteca (Are.na) ----------

let blocos = null; // null enquanto carrega; "erro" se nada vier

const escapar = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const simples = (v) => (v && typeof v === "object" ? v.plain || v.markdown || "" : v || "");

function embaralhar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

// títulos que são só nome de arquivo, endereço, código ou rede social não dizem nada
const SEM_TITULO =
  /^(\(\d+\)\s*)?(instagram|pin em .*|image(\.png)?|file)$|\.(jpe?g|png|gif|gifv|webp|avif|svg|mp4|mov|pdf)(\?|\s*\(|$)|^[\w.-]+\.[a-z]{2,}\/\S*$|^[0-9a-f]{8}-[0-9a-f]{4}-|^[0-9a-f_-]{20,}$|\?format=|^[a-z0-9]+(-[a-z0-9]+){5,}/i;
const cortar = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function resumir(b, fonte) {
  const corpo = simples(b.content).trim();
  const [primeira] = corpo.split("\n");
  const dominio = b.source?.url ? (b.source.provider?.name || new URL(b.source.url).hostname).replace(/^www\./, "") : "are.na";
  let titulo = (b.title || "").replace(/^\(\d+\)\s*/, "").trim();
  // sem um título que diga algo, o quadro fala sozinho (a origem já aparece embaixo)
  if (!titulo || SEM_TITULO.test(titulo)) titulo = corpo ? cortar(primeira, 90) : "";
  return {
    fonte: fonte.nome,
    cor: fonte.cor || null,
    tipo: b.type,
    titulo,
    // blocos de texto aparecem como texto dentro do quadro, como no Are.na
    corpo: b.type === "Text" ? cortar(corpo, 420) : "",
    link: b.source?.url || `https://www.are.na/block/${b.id}`,
    dominio,
    imagem: b.image?.medium?.src || b.image?.small?.src || null,
  };
}

async function pagina(fonte, n) {
  const r = await fetch(`https://api.are.na/v3/channels/${fonte.canal}/contents?per=${POR_PAGINA}&page=${n}`);
  if (!r.ok) throw new Error(`are.na ${r.status}`);
  return r.json();
}

// sorteia uma página do canal e tira alguns blocos dela
async function amostra(fonte, totais) {
  const sortear = (total) => 1 + Math.floor(Math.random() * Math.max(1, Math.ceil(total / POR_PAGINA)));
  let resposta = await pagina(fonte, totais[fonte.canal] ? sortear(totais[fonte.canal]) : 1);
  if (!totais[fonte.canal] && resposta.meta.total_pages > 1) {
    // primeira visita: agora que sabemos o tamanho do canal, sorteia de verdade
    resposta = await pagina(fonte, sortear(resposta.meta.total_count));
  }
  totais[fonte.canal] = resposta.meta.total_count;
  const uteis = resposta.data.filter((b) => TIPOS.has(b.type) && b.state === "available").map((b) => resumir(b, fonte));
  return embaralhar(uteis.filter((b) => b.titulo || b.imagem)).slice(0, POR_CANAL);
}

const botaoEmbaralhar = $("#embaralhar");
botaoEmbaralhar.addEventListener("click", () => carregarBiblioteca(true));

async function carregarBiblioteca(novo = false) {
  const chave = "sinco:biblioteca:v4";
  const guardado = JSON.parse(sessionStorage.getItem(chave) || "null");
  if (!novo && guardado && Date.now() - guardado.em < 10 * 60 * 1000) {
    blocos = guardado.blocos;
    return montarBiblioteca();
  }
  blocos = null;
  botaoEmbaralhar.disabled = true;
  montarBiblioteca();
  const totais = JSON.parse(localStorage.getItem("sinco:biblioteca:totais") || "{}");
  const resultados = await Promise.allSettled(FONTES.map((f) => amostra(f, totais)));
  localStorage.setItem("sinco:biblioteca:totais", JSON.stringify(totais));
  // o mesmo bloco pode estar em mais de um canal: fica só a primeira vez
  const vistos = new Set();
  const vindos = resultados
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .filter((b) => !vistos.has(b.link) && vistos.add(b.link));
  blocos = vindos.length ? embaralhar(vindos) : "erro";
  if (vindos.length) sessionStorage.setItem(chave, JSON.stringify({ em: Date.now(), blocos }));
  botaoEmbaralhar.disabled = false;
  montarBiblioteca();
}

function quadro(b) {
  if (b.imagem) return `<img src="${escapar(b.imagem)}" alt="" loading="lazy" decoding="async" />`;
  if (b.corpo) return `<p class="bloco-texto">${escapar(b.corpo)}</p>`;
  return `<span class="bloco-vazio mono">${escapar(b.dominio)}</span>`;
}

function montarBiblioteca() {
  const galeria = $("#lista-biblioteca");
  const aviso = (t) => `<li class="galeria-aviso mono">${t}</li>`;
  if (blocos === null) galeria.innerHTML = aviso(AVISOS.carregando);
  else if (blocos === "erro") galeria.innerHTML = aviso(AVISOS.erro);
  else if (!blocos.length) galeria.innerHTML = aviso(AVISOS.vazio);
  else
    galeria.innerHTML = blocos
      .map(
        (b) => `<li><a class="bloco" href="${escapar(b.link)}" target="_blank" rel="noopener">
          <span class="bloco-quadro">${quadro(b)}</span>
          ${b.titulo ? `<span class="bloco-titulo">${escapar(b.titulo)}</span>` : ""}
          <span class="bloco-meta mono"><span class="tinta"${b.cor ? ` style="--cor:${b.cor}"` : ""}><i></i>${b.fonte}</span>${escapar(b.dominio)} ↗</span>
        </a></li>`
      )
      .join("");
}

// ---------- trilha (topo esquerdo durante a leitura) ----------

const secoes = [...document.querySelectorAll(".secao")];
let secaoAtual = secoes[0];

function atualizarTrilha() {
  $("#trilha-secao").textContent = secaoAtual.dataset.secao;
  $("#trilha").href = `#${secaoAtual.id}`;
}

// ---------- temas ----------
// As cores de cada tema estão no CSS ([data-tema="…"]); aqui só a ordem e os nomes.

// o primeiro é o padrão (o mesmo do data-tema no <html>)
const TEMAS = [
  { id: "chumbo", nome: "lead" },
  { id: "cinza", nome: "grey" },
  { id: "terra", nome: "earth" },
  { id: "musgo", nome: "moss" },
  { id: "argila", nome: "clay" },
  { id: "tabaco", nome: "tobacco" },
  { id: "noite", nome: "night" },
];

const temaAtual = () => document.documentElement.dataset.tema || TEMAS[0].id;

function montarTweak() {
  const labs = ["software", "hardware", "social", "surfistas"].map((l) => `<i style="background:var(--lab-${l})"></i>`).join("");
  $("#tweak-lista").innerHTML = TEMAS.map(
    (t) => `<li><button type="button" data-escolher="${t.id}" aria-pressed="${t.id === temaAtual()}">
      <span class="amostra" data-tema="${t.id}"><b>Aa</b><span>${labs}</span></span>
      <span class="tweak-nome">${t.nome}</span>
    </button></li>`
  ).join("");
}

let avisoTimer;
function aplicarTema(id, mostrar = false) {
  const tema = TEMAS.find((t) => t.id === id) || TEMAS[0];
  const raiz = document.documentElement;
  raiz.dataset.tema = tema.id;
  sessionStorage.setItem("sinco:tema", tema.id);
  document.querySelectorAll("[data-escolher]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.escolher === tema.id)));
  $('meta[name="theme-color"]').content = getComputedStyle(raiz).getPropertyValue("--fundo").trim();
  if (mostrar) avisar(`${TEMAS.indexOf(tema) + 1}/${TEMAS.length} · ${tema.nome}`);
}

$("#tweak-lista").addEventListener("click", (e) => {
  const b = e.target.closest("[data-escolher]");
  if (b) aplicarTema(b.dataset.escolher);
});

function avisar(texto) {
  const aviso = $("#aviso-tema");
  aviso.textContent = texto;
  aviso.classList.add("ativo");
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => aviso.classList.remove("ativo"), 1400);
}

// T avança o tema (Shift+T volta)
window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest("input, textarea")) return;
  if (e.key.toLowerCase() !== "t") return;
  const i = TEMAS.findIndex((t) => t.id === temaAtual());
  const passo = e.shiftKey ? -1 : 1;
  aplicarTema(TEMAS[(i + passo + TEMAS.length) % TEMAS.length].id, true);
});

menu.addEventListener("click", (e) => {
  if (e.target.closest("a")) menu.hidePopover();
});

// "lendo" quando o herói já quase saiu da tela
function medirHeroi() {
  document.body.classList.toggle("lendo", heroi.getBoundingClientRect().bottom < innerHeight * 0.35);
}
addEventListener("scroll", medirHeroi, { passive: true });
addEventListener("resize", medirHeroi);

const observaSecoes = new IntersectionObserver(
  (entradas) => {
    for (const e of entradas) {
      if (e.isIntersecting) {
        secaoAtual = e.target;
        atualizarTrilha();
      }
    }
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
secoes.forEach((s) => observaSecoes.observe(s));

// ---------- início ----------

aplicarTema(temaAtual());
medirHeroi();
montarLabs();
montarTweak();
montarBiblioteca();
atualizarTrilha();
carregarBiblioteca();

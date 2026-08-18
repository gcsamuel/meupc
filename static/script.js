function byId(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemento #${id} não foi encontrado na página.`);
  return el;
}

const containerVisual = byId("container-visual");
const buscaInput = byId("busca");
const totalEl = byId("total");
const contagemEl = byId("contagem");
const infoTotEl = byId("info-total");
const modal = byId("modal");
const form = byId("form-item");
const tituloModal = byId("modal-titulo");
const descModal = byId("modal-desc");
const msgErro = byId("msg-erro");
const toast = byId("toast");
const btnTema = byId("btn-tema");
const selectExportar = byId("select-exportar");
const btnImportar = byId("btn-importar");
const inputImportar = byId("input-importar");
const btnHistorico = byId("btn-historico");
const painelHistorico = byId("painel-historico");
const btnConfig = byId("btn-config");
const modalConfig = byId("modal-config");
const formConfig = byId("form-config");
const msgErroConfig = byId("msg-erro-config");
const modalPrecos = byId("modal-precos");
const prefill = byId("prefill");

console.log("[MeuPC] script carregado com sucesso.");

window.addEventListener("error", (e) => {
  console.error("[MeuPC] erro:", e.message, e.filename, e.lineno);
  mostrarToast?.("Erro no app: " + e.message, true);
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("[MeuPC] promise:", e.reason);
});

let items = [];
let filtro = "";
let config = { cep: "", orcamento: 0 };
let ordem = { campo: null, dir: 1 };
let visao = localStorage.getItem("meupc_visao") || "grade";
let comparando = { modo: "item", itemId: null, q: "" };

/* ---------------- utilidades ---------------- */

function esc(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function formataMoeda(valor) {
  const v = Number(valor) || 0;
  return v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function soDigitos(texto) {
  return String(texto || "").replace(/\D/g, "");
}

function mostrarToast(texto, erro = false) {
  toast.textContent = texto;
  toast.classList.toggle("toast-erro", erro);
  toast.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.hidden = true; }, 3200);
}

function imgFalha(img) {
  const jatava = img.parentElement?.querySelector(".img-vazia");
  if (jatava) return;
  const fallback = document.createElement("div");
  fallback.className = "img-vazia";
  fallback.textContent = "🖥️";
  img.replaceWith(fallback);
}

function imgHTML(url) {
  if (!url) return `<div class="img-vazia">🖥️</div>`;
  return `<img loading="lazy" src="${esc(url)}" alt="" onerror="imgFalha(this)">`;
}

function lojaDoItem(item) {
  const url = item.url || "";
  const nome = encodeURIComponent(item.nome + " " + item.peca);
  if (/^https?:\/\//i.test(url)) return { nome: "🔗 link", href: url };
  const loja = url.toLowerCase();
  if (/mercadolivre|mercado livre|ml\b/.test(loja)) return { nome: url, href: `https://lista.mercadolivre.com.br/${nome}` };
  if (/amazon/.test(loja)) return { nome: url, href: `https://www.amazon.com.br/s?k=${nome}` };
  return { nome: url || "Buscar preço", href: `https://shopee.com.br/search?keyword=${nome}` };
}

/* ---------------- tema ---------------- */

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  btnTema.textContent = tema === "claro" ? "🌙" : "☀️";
  btnTema.title = tema === "claro" ? "Tema escuro" : "Tema claro";
}

function initTema() {
  const salvo = localStorage.getItem("meupc_tema");
  if (salvo === "claro" || salvo === "escuro") aplicarTema(salvo);
}

btnTema.addEventListener("click", () => {
  const atual = document.documentElement.dataset.tema === "claro" ? "escuro" : "claro";
  aplicarTema(atual);
  localStorage.setItem("meupc_tema", atual);
  mostrarToast(atual === "claro" ? "Tema claro ativado." : "Tema escuro ativado.");
});

/* ---------------- visão (grade / lista) ---------------- */

function aplicarVisao() {
  document.querySelectorAll(".visao-btn").forEach((b) => {
    b.classList.toggle("ativo", b.dataset.visao === visao);
  });
  render();
}

byId("switch-visao").addEventListener("click", (e) => {
  const btn = e.target.closest(".visao-btn");
  if (!btn) return;
  visao = btn.dataset.visao;
  localStorage.setItem("meupc_visao", visao);
  aplicarVisao();
});

/* ---------------- orçamento / configurações ---------------- */

function renderOrcamento() {
  const total = items.reduce((s, i) => s + i.valor, 0);
  const orc = Number(config.orcamento) || 0;
  const bloco = byId("bloco-orcamento");
  const wrap = byId("barra-orcamento-wrap");
  if (orc <= 0) { bloco.hidden = true; wrap.hidden = true; return; }
  bloco.hidden = false;
  wrap.hidden = false;
  const pct = Math.min(100, (total / orc) * 100);
  byId("orcamento-pct").textContent = Math.round(pct) + "%";
  byId("orcamento-texto").textContent = `Orçamento: R$ ${formataMoeda(orc)} · gasto: R$ ${formataMoeda(total)}`;
  const fill = byId("barra-orcamento-fill");
  fill.style.width = pct + "%";
  fill.classList.toggle("amarela", pct >= 80 && pct < 100);
  fill.classList.toggle("vermelha", pct >= 100);
}

function loadConfig() {
  return fetch("/api/config")
    .then((r) => r.json())
    .then((d) => {
      config = { cep: d.cep || "", orcamento: Number(d.orcamento || 0) || 0 };
      renderOrcamento();
      atualizarStatusML();
    })
    .catch(() => {});
}

function atualizarStatusML() {
  fetch("/api/ml/status")
    .then((r) => r.json())
    .then((s) => {
      const linha = document.getElementById("ml-status-line");
      const link = document.getElementById("ml-auth-link");
      const pill = document.getElementById("ml-status-pill");
      if (!linha) return;
      if (s.conectado) {
        linha.textContent = "Conectado — usando a API oficial com token.";
        linha.className = "api-status-linha ok";
        link.hidden = true;
        if (pill) { pill.textContent = "ML ✔"; pill.classList.add("ok"); }
      } else if (s.tem_client_id) {
        linha.textContent = "Token ausente. Conecte sua conta do Mercado Livre.";
        linha.className = "api-status-linha";
        link.hidden = false;
        if (pill) { pill.textContent = "ML: conectar"; }
      } else {
        linha.textContent = "Não configurado (veja .env.example) — usando rota pública.";
        linha.className = "api-status-linha";
        link.hidden = true;
        if (pill) { pill.textContent = "ML: público"; }
      }
    })
    .catch(() => {});
}

byId("ml-auth-link").addEventListener("click", () => {
  fetch("/api/ml/auth")
    .then((r) => r.json())
    .then((d) => {
      if (d.auth_url) window.open(d.auth_url, "_blank");
      else mostrarToast(d.error || "Não foi possível gerar o link.", true);
    });
});

function abrirConfig() {
  msgErroConfig.style.display = "none";
  byId("c-cep").value = config.cep;
  byId("c-orcamento").value = config.orcamento > 0 ? formataMoeda(config.orcamento) : "";
  atualizarStatusML();
  modalConfig.hidden = false;
}

btnConfig.addEventListener("click", abrirConfig);
byId("btn-cancelar-config").addEventListener("click", () => { modalConfig.hidden = true; });

formConfig.addEventListener("submit", (e) => {
  e.preventDefault();
  fetch("/api/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cep: byId("c-cep").value, orcamento: byId("c-orcamento").value }),
  })
    .then((r) => r.json())
    .then((d) => {
      config = { cep: d.cep || "", orcamento: Number(d.orcamento) || 0 };
      modalConfig.hidden = true;
      renderOrcamento();
      atualizarStatusML();
      if (!modalPrecos.hidden && comparando.q) buscarPrecos();
      mostrarToast("Configurações salvas.");
    })
    .catch(() => {
      msgErroConfig.style.display = "block";
      msgErroConfig.textContent = "Não foi possível salvar.";
    });
});

/* ---------------- histórico ---------------- */

function renderHistorico() {
  fetch("/api/historico")
    .then((r) => r.json())
    .then(({ historico }) => {
      const fechar = `<button type="button" class="btn-fechar-historico">✕</button>`;
      if (!historico.length) {
        painelHistorico.innerHTML = `<h3>📈 Histórico de preços <span class="contador-historico">0</span>${fechar}</h3>
          <p class="historico-vazio">Nada registrado ainda. Quando alterar o valor de uma peça, a mudança aparecerá aqui.</p>`;
      } else {
        painelHistorico.innerHTML = `<h3>📈 Histórico de preços <span class="contador-historico">${historico.length}</span>${fechar}</h3>
          <ul class="lista-historico">${historico.map((h) => {
            const antigo = "R$ " + formataMoeda(h.valor_antigo);
            const novo = "R$ " + formataMoeda(h.valor_novo);
            const classe = h.valor_novo < h.valor_antigo ? "baixou" : "subiu";
            return `<li class="historico-item"><span class="hi-data">${esc(h.data)}</span><span class="hi-nome">${esc(h.nome)}</span><span class="hi-precos"><span>${antigo}</span><span class="seta">→</span><span class="${classe}">${novo}</span></span></li>`;
          }).join("")}</ul>`;
      }
      painelHistorico.querySelector(".btn-fechar-historico").addEventListener("click", () => { painelHistorico.hidden = true; });
    })
    .catch((err) => console.error("[MeuPC] histórico:", err));
}

btnHistorico.addEventListener("click", () => {
  if (painelHistorico.hidden) { painelHistorico.hidden = false; renderHistorico(); }
  else painelHistorico.hidden = true;
});

/* ---------------- exportar / importar ---------------- */

selectExportar.addEventListener("change", () => {
  const formato = selectExportar.value;
  if (!formato) return;
  window.location.href = `/api/export/${formato}`;
  selectExportar.value = "";
});

btnImportar.addEventListener("click", () => inputImportar.click());

inputImportar.addEventListener("change", () => {
  const arquivo = inputImportar.files[0];
  if (!arquivo) return;
  if (!confirm("Importar substituirá a lista atual. Deseja continuar?")) { inputImportar.value = ""; return; }
  const fd = new FormData();
  fd.append("arquivo", arquivo);
  fetch("/api/import", { method: "POST", body: fd })
    .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
    .then(({ ok, d }) => {
      if (!ok) throw new Error(d.error || "Erro ao importar.");
      mostrarToast(`Planilha importada com ${d.itens} peça${d.itens === 1 ? "" : "s"}!`);
      carregar();
    })
    .catch((err) => mostrarToast("Importação falhou: " + err.message, true))
    .finally(() => { inputImportar.value = ""; });
});

/* ---------------- ordenação ---------------- */

byId("container-visual").addEventListener("click", (e) => {
  const th = e.target.closest("th.sort");
  if (!th) return;
  const campo = th.dataset.ordem;
  if (ordem.campo === campo) ordem.dir *= -1;
  else ordem = { campo, dir: 1 };
  render();
});

function listaOrdenada(lista) {
  if (!ordem.campo) return lista;
  const dir = ordem.dir;
  const temp = [...lista];
  temp.sort((a, b) => {
    if (ordem.campo === "valor") return (a.valor - b.valor) * dir;
    return String(a[ordem.campo] || "").toLowerCase().localeCompare(String(b[ordem.campo] || "").toLowerCase(), "pt-BR") * dir;
  });
  return temp;
}

/* ---------------- render ---------------- */

function listaFiltrada() {
  const termo = filtro.trim().toLowerCase();
  const lista = termo
    ? items.filter((i) =>
        [i.nome, i.peca, i.url, i.nota, i.valor_formatado]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(termo))
      )
    : items;
  return listaOrdenada(lista);
}

function gradeHTML(lista) {
  if (!lista.length) {
    return `<div class="grade"><div class="vazio-grade"><span class="empty-icon">🛒</span>${
      filtro ? "Nenhuma peça encontrada para essa busca." : "Nenhuma peça ainda. Clique em \"+ Nova peça\" para começar."
    }</div></div>`;
  }
  return `<div class="grade">${lista.map((item) => {
    const loja = lojaDoItem(item);
    return `
      <article class="card-peca">
        <div class="cp-imagem">${imgHTML(item.imagem)}</div>
        <div class="cp-corpo">
          <div class="cp-linha-topo"><span class="badge-cat">${esc(item.peca) || "Outro"}</span></div>
          <span class="cp-nome">${esc(item.nome)}</span>
          ${item.nota ? `<p class="cp-nota">📝 ${esc(item.nota)}</p>` : ""}
          <div class="cp-loja"><span>${esc(loja.nome)}</span><a class="loja-link" href="${esc(loja.href)}" target="_blank" rel="noopener noreferrer">Buscar ↗</a></div>
          <div class="cp-preco">R$ ${esc(item.valor_formatado)}</div>
        </div>
        <div class="cp-acoes">
          <button class="btn" data-acao="comparar" data-id="${item.id}">🔎 Comparar</button>
          <button class="btn" data-acao="editar" data-id="${item.id}">Editar</button>
          <button class="btn btn-danger" data-acao="apagar" data-id="${item.id}">Apagar</button>
        </div>
      </article>`;
  }).join("")}</div>`;
}

function listaTabelaHTML(lista) {
  if (!lista.length) {
    return `<div class="tabela-wrapper"><table><thead><tr><th>Categoria</th><th>Peça</th><th>Loja</th><th class="num">Valor</th><th class="acoes">Ações</th></tr></thead><tbody><tr><td colspan="5" class="vazio-grade">${filtro ? "Nenhuma peça para essa busca." : "Nenhuma peça ainda."}</td></tr></tbody></table></div>`;
  }
  const ordemAntes = ordem.campo ? `<span class="seta-ord"></span>` : "";
  return `
    <div class="tabela-wrapper">
      <table>
        <thead>
          <tr>
            <th class="sort ${ordem.campo === "peca" ? (ordem.dir === 1 ? "ord-asc" : "ord-desc") : ""}" data-ordem="peca">Categoria${ordemAntes}</th>
            <th class="sort ${ordem.campo === "nome" ? (ordem.dir === 1 ? "ord-asc" : "ord-desc") : ""}" data-ordem="nome">Peça${ordemAntes}</th>
            <th class="sort ${ordem.campo === "loja" ? (ordem.dir === 1 ? "ord-asc" : "ord-desc") : ""}" data-ordem="loja">Loja${ordemAntes}</th>
            <th class="sort num ${ordem.campo === "valor" ? (ordem.dir === 1 ? "ord-asc" : "ord-desc") : ""}" data-ordem="valor">Valor${ordemAntes}</th>
            <th class="acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map((item) => {
            const loja = lojaDoItem(item);
            const notaHTML = item.nota ? `<p class="peca-nota">📝 ${esc(item.nota)}</p>` : "";
            return `
              <tr>
                <td><span class="badge-cat">${esc(item.peca) || "Outro"}</span></td>
                <td><div class="td-peca">
                  <div class="mini-imagem">${imgHTML(item.imagem)}</div>
                  <div class="peca-nome-ct"><strong>${esc(item.nome)}</strong>${notaHTML}</div>
                </div></td>
                <td><div class="loja-info cp-loja"><span>${esc(loja.nome)}</span><a class="loja-link" href="${esc(loja.href)}" target="_blank" rel="noopener noreferrer">Buscar ↗</a></div></td>
                <td class="num">${esc(item.valor_formatado)}</td>
                <td class="acoes acao-compacta">
                  <button class="btn" data-acao="comparar" data-id="${item.id}">🔎</button>
                  <button class="btn" data-acao="editar" data-id="${item.id}">Editar</button>
                  <button class="btn btn-danger" data-acao="apagar" data-id="${item.id}">Apagar</button>
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function render() {
  const lista = listaFiltrada();
  containerVisual.innerHTML = visao === "grade" ? gradeHTML(lista) : listaTabelaHTML(lista);
  const total = items.reduce((s, i) => s + i.valor, 0);
  totalEl.textContent = "R$ " + formataMoeda(total);
  contagemEl.textContent = items.length;
  infoTotEl.innerHTML = `Mostrando ${lista.length} de ${items.length} peça${items.length === 1 ? "" : "s"} · Total: <em>R$ ${formataMoeda(total)}</em>`;
  renderOrcamento();
}

/* ---------------- CRUD ---------------- */

function carregar() {
  return fetch("/api/items")
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((data) => { items = data.items; render(); })
    .catch((err) => mostrarToast("Erro ao carregar a lista: " + err.message, true));
}

function abrirModal(item) {
  msgErro.style.display = "none";
  byId("prefill").hidden = true;
  if (item) { tituloModal.textContent = "Editar peça"; descModal.textContent = "Altere os dados e clique em Salvar."; }
  else { tituloModal.textContent = "Nova peça"; descModal.textContent = "Preencha os dados da peça para adicionar à lista."; }

  byId("f-id").value = item ? item.id : "";
  const sel = byId("f-peca");
  sel.value = item ? ([...sel.options].some((o) => o.value === item.peca) ? item.peca : "Outro") : "Processador";
  byId("f-nome").value = item ? item.nome : "";
  byId("f-valor").value = item ? item.valor_formatado : "";
  byId("f-url").value = item ? item.url || "" : "";
  byId("f-nota").value = item ? item.nota || "" : "";
  byId("f-imagem").value = item ? item.imagem || "" : "";

  modal.hidden = false;
  byId("f-nome").focus();
}

function fecharModal() { modal.hidden = true; }

byId("btn-novo").addEventListener("click", () => abrirModal(null));
byId("btn-cancelar").addEventListener("click", fecharModal);
modal.addEventListener("click", (e) => { if (e.target === modal) fecharModal(); });

buscaInput.addEventListener("input", (e) => { filtro = e.target.value; render(); });

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = byId("f-id").value;
  const vv = parseFloat(String(byId("f-valor").value).replace(/\./g, "").replace(",", ".")) || 0;
  if (!(vv > 0)) {
    msgErro.textContent = "O valor deve ser maior que zero.";
    msgErro.style.display = "block";
    return;
  }
  const payload = {
    peca: byId("f-peca").value,
    nome: byId("f-nome").value,
    valor: byId("f-valor").value,
    url: byId("f-url").value,
    nota: byId("f-nota").value,
    imagem: byId("f-imagem").value,
  };
  fetch(id === "" ? "/api/items" : `/api/items/${id}`, {
    method: id === "" ? "POST" : "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
    .then(({ ok, d }) => {
      if (!ok) throw new Error(d.error || "Erro ao salvar.");
      fecharModal();
      mostrarToast(id === "" ? "Peça adicionada!" : "Peça atualizada!");
      carregar();
      if (!painelHistorico.hidden) renderHistorico();
    })
    .catch((err) => { msgErro.textContent = err.message; msgErro.style.display = "block"; });
});

containerVisual.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-acao]");
  if (!btn) return;
  const id = Number(btn.dataset.id);

  if (btn.dataset.acao === "comparar") {
    const item = items.find((i) => i.id === id);
    if (item) abrirComparar(item);
    return;
  }
  if (btn.dataset.acao === "editar") { abrirModal(items.find((i) => i.id === id)); return; }
  if (btn.dataset.acao === "apagar") {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (confirm(`Apagar "${item.nome}" da lista?`)) {
      fetch(`/api/items/${id}`, { method: "DELETE" })
        .then((r) => r.json())
        .then((d) => { if (!d.ok) throw new Error("Erro ao apagar."); mostrarToast(`"${item.nome}" removido.`); carregar(); })
        .catch((err) => mostrarToast(err.message, true));
    }
  }
});

/* ---------------- comparador de preços ---------------- */

function abrirComparar(item) {
  comparando = { modo: "item", itemId: item.id, q: `${item.peca} ${item.nome}`.trim() };
  byId("precos-titulo").textContent = "Comparar preços";
  byId("precos-busca").textContent = `Resultados para: ${item.nome}`;
  const pillShopee = byId("shopee-status-pill");
  if (pillShopee) pillShopee.textContent = "Shopee: pública";
  atualizarStatusML();
  modalPrecos.hidden = false;
  byId("precos-cep-input").value = config.cep;
  byId("precos-cep-info").textContent = config.cep
    ? `Usando CEP ${config.cep} para estimar o frete.`
    : "Informe seu CEP abaixo para estimar o frete nas buscas.";
  limparResultados();
  if (config.cep) buscarPrecos();
}

byId("btn-fechar-precos").addEventListener("click", () => { modalPrecos.hidden = true; });
modalPrecos.addEventListener("click", (e) => { if (e.target === modalPrecos) modalPrecos.hidden = true; });

byId("btn-precos-buscar").addEventListener("click", async () => {
  const cep = soDigitos(byId("precos-cep-input").value);
  if (cep && cep.length === 8 && cep !== config.cep) {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep, orcamento: config.orcamento }),
    }).then((r) => r.json()).then((d) => { config.cep = d.cep || ""; });
  }
  buscarPrecos();
});

function limparResultados() {
  byId("lista-precos").innerHTML = "";
  byId("precos-vazio").hidden = true;
  byId("precos-erros").hidden = true;
  const loading = byId("precos-loading");
  loading.hidden = false;
  loading.textContent = "Buscando preços...";
}

function buscarPrecos() {
  if (!comparando.q) return;
  const cep = soDigitos(byId("precos-cep-input").value);
  limparResultados();
  byId("precos-cep-info").textContent = cep ? `Usando CEP ${cep} para estimar o frete.` : "Sem CEP informado: o frete será exibido quando a loja permitir.";
  fetch(`/api/precos?q=${encodeURIComponent(comparando.q)}&cep=${cep}`)
    .then((r) => { if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d.error || "Erro na busca."))); return r.json(); })
    .then((d) => renderResultados(d.resultados, d.erros || []))
    .catch((err) => {
      byId("precos-loading").hidden = true;
      byId("precos-vazio").hidden = false;
      byId("precos-erros").hidden = false;
      byId("precos-erros").innerHTML = `<strong>Aviso:</strong> ${esc(err.message)}`;
    });
}

function renderResultados(resultados, erros) {
  byId("precos-loading").hidden = true;
  if (!resultados.length) byId("precos-vazio").hidden = false;
  if (erros.length) {
    byId("precos-erros").hidden = false;
    byId("precos-erros").innerHTML = `<strong>Algumas lojas não responderam:</strong> ${erros.map(esc).join(" · ")}<br><span class="dica-campo">Dica: conecte a API oficial do Mercado Livre em ⚙️ para mais resultados.</span>`;
  }
  const lista = byId("lista-precos");
  let passouPorPreco = false;
  resultados.forEach((res, idx) => {
    const melhor = res.preco != null && !passouPorPreco;
    if (res.preco != null) passouPorPreco = true;
    const li = document.createElement("li");
    li.className = "preco-item" + (melhor ? " melhor" : "");
    const precoHtml = res.preco != null
      ? `<span class="pi-preco">${melhor ? "<span class=\"pi-selo\">🏆 melhor preço</span>" : ""}R$ ${formataMoeda(res.preco)}${res.frete ? `<span class="pi-frete">+ frete R$ ${res.frete}</span>` : ""}</span>`
      : `<span class="pi-sem-preco">Sem preço na busca — abra na loja para ver</span>`;
    li.innerHTML = `
      <div class="pi-imagem">${imgHTML(res.imagem)}</div>
      <span class="loja-pill">${esc(res.loja)}</span>
      <div class="pi-nome">${esc(res.nome)}</div>
      ${precoHtml}
      <div class="pi-acoes">
        <a class="btn" href="${esc(res.link)}" target="_blank" rel="noopener noreferrer">Abrir ↗</a>
        <button type="button" class="btn btn-primary" data-usar-link="${idx}">Usar este link</button>
      </div>`;
    li.querySelector("[data-usar-link]").addEventListener("click", () => usarLink(res));
    lista.appendChild(li);
  });
}

function usarLink(res) {
  if (comparando.modo === "item") {
    const item = items.find((i) => i.id === comparando.itemId);
    if (!item) return;
    const payload = {
      peca: item.peca,
      nome: item.nome,
      valor: item.valor,
      url: res.link,
      nota: item.nota || "",
      imagem: res.imagem || item.imagem || "",
    };
    fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Erro ao salvar link.");
        modalPrecos.hidden = true;
        mostrarToast(`Link da ${res.loja} salvo e imagem atualizada.`);
        carregar();
      })
      .catch((err) => mostrarToast(err.message, true));
  } else {
    preencherCamposCom(res);
  }
}

/* ---------------- preencher automaticamente ---------------- */

byId("btn-buscar-preco").addEventListener("click", () => {
  const nome = byId("f-nome").value.trim();
  if (nome.length < 2) {
    msgErro.textContent = "Digite o nome da peça primeiro.";
    msgErro.style.display = "block";
    return;
  }
  msgErro.style.display = "none";
  comparando = { modo: "form", itemId: null, q: `${byId("f-peca").value} ${nome}`.trim() };
  prefill.hidden = false;
  prefill.innerHTML = `<p class="prefill-titulo">🔎 Buscando "${nome}"...</p>`;
  fetch(`/api/precos?q=${encodeURIComponent(comparando.q)}&cep=${config.cep}`)
    .then((r) => r.json())
    .then((d) => {
      if (!d.resultados.length) {
        prefill.innerHTML = `<p class="prefill-titulo">Nenhum resultado agora. Tente de novo em instantes.</p>`;
        return;
      }
      prefill.innerHTML = `<p class="prefill-titulo">🔎 Encontramos estas opções — clique para preencher:</p>`;
      d.resultados.slice(0, 4).forEach((res) => {
        const card = document.createElement("div");
        card.className = "prefill-item";
        const info = res.preco != null ? `R$ ${formataMoeda(res.preco)}` : "ver na loja";
        card.innerHTML = `
          <span class="pf-nome">${esc(res.loja)} — ${esc(res.nome).slice(0, 58)}</span>
          <span class="pf-resumo">${info}</span>
          <button type="button" class="btn btn-primary" data-usar-prefill>Usar</button>`;
        card.querySelector("[data-usar-prefill]").addEventListener("click", () => {
          preencherCamposCom(res);
          card.querySelector(".btn").disabled = true;
          card.querySelector(".btn").textContent = "✓ Preenchido";
        });
        prefill.appendChild(card);
      });
    })
    .catch(() => {
      prefill.innerHTML = `<p class="prefill-titulo">Não foi possível buscar agora. Algumas lojas bloqueiam buscas automáticas.</p>`;
    });
});

function preencherCamposCom(res) {
  byId("f-url").value = res.link;
  byId("f-imagem").value = res.imagem || "";
  if (res.preco != null && !String(byId("f-valor").value).trim()) {
    byId("f-valor").value = formataMoeda(res.preco);
  }
  mostrarToast(`Preenchido com link da ${res.loja}.`);
}

/* ---------------- iniciar ---------------- */

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    [modal, modalConfig, modalPrecos].forEach((m) => { if (!m.hidden) m.hidden = true; });
  }
});

initTema();
aplicarVisao();
loadConfig().then(carregar);
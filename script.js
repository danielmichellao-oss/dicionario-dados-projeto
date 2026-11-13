(function () {
  'use strict';

  const html = document.documentElement;
  const busca = document.getElementById('busca');
  const limpar = document.getElementById('limpar-busca');
  const resultado = document.getElementById('resultado-busca');
  const semResultados = document.getElementById('sem-resultados');
  const navTabelas = document.getElementById('nav-tabelas');
  const tabelas = Array.from(document.querySelectorAll('section.tabela-dic'));

  /* ---------- Tema claro / escuro ---------- */
  const botaoTema = document.getElementById('botao-tema');
  function aplicarTema(tema) {
    html.setAttribute('data-tema', tema);
    botaoTema.setAttribute('aria-pressed', tema === 'escuro' ? 'true' : 'false');
  }
  let temaSalvo = 'claro';
  try { temaSalvo = localStorage.getItem('dicionario-tema') || 'claro'; } catch (e) { /* ignora */ }
  aplicarTema(temaSalvo);
  botaoTema.addEventListener('click', function () {
    const novo = html.getAttribute('data-tema') === 'escuro' ? 'claro' : 'escuro';
    aplicarTema(novo);
    try { localStorage.setItem('dicionario-tema', novo); } catch (e) { /* ignora */ }
  });

  /* ---------- Menu lateral (mobile) ---------- */
  const botaoMenu = document.getElementById('botao-menu');
  const sidebar = document.getElementById('sidebar');
  const fundoMenu = document.getElementById('fundo-menu');
  function alternarMenu(abrir) {
    sidebar.classList.toggle('aberta', abrir);
    fundoMenu.classList.toggle('visivel', abrir);
    botaoMenu.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  }
  botaoMenu.addEventListener('click', function () {
    alternarMenu(!sidebar.classList.contains('aberta'));
  });
  fundoMenu.addEventListener('click', function () { alternarMenu(false); });

  /* ---------- Índice de tabelas na barra lateral ---------- */
  if (navTabelas && tabelas.length) {
    const ul = document.createElement('ul');
    tabelas.forEach(function (sec) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + sec.id;
      a.textContent = sec.querySelector('h2').textContent.trim();
      a.dataset.alvo = sec.id;
      li.appendChild(a);
      ul.appendChild(li);
      a.addEventListener('click', function () {
        if (window.innerWidth <= 900) alternarMenu(false);
      });
    });
    navTabelas.appendChild(ul);
  }

  /* Destaca no índice a tabela que está visível na tela */
  if ('IntersectionObserver' in window && tabelas.length) {
    const obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        document.querySelectorAll('#nav-tabelas a').forEach(function (a) {
          a.classList.toggle('ativo', a.dataset.alvo === e.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    tabelas.forEach(function (s) { obs.observe(s); });
  }

  /* ---------- Busca dinâmica por tabela ou coluna ---------- */
  const navLinks = Array.from(document.querySelectorAll('#nav-tabelas a'));
  function filtrar() {
    const termo = busca.value.trim().toLowerCase();
    limpar.hidden = termo === '';
    let tabelasVisiveis = 0;
    let colunasEncontradas = 0;

    tabelas.forEach(function (sec) {
      const nome = (sec.dataset.tabela || '').toLowerCase();
      const linhas = Array.from(sec.querySelectorAll('tbody tr'));
      if (!termo) {
        sec.hidden = false;
        linhas.forEach(function (tr) { tr.hidden = false; });
        tabelasVisiveis++;
        return;
      }
      const nomeBate = nome.indexOf(termo) !== -1;
      let bateLinhas = 0;
      linhas.forEach(function (tr) {
        const coluna = tr.querySelector('.atributo');
        const texto = coluna ? coluna.textContent.toLowerCase() : '';
        const bate = nomeBate || texto.indexOf(termo) !== -1;
        tr.hidden = !bate;
        if (bate && texto.indexOf(termo) !== -1) bateLinhas++;
      });
      colunasEncontradas += bateLinhas;
      const mostrar = nomeBate || bateLinhas > 0;
      sec.hidden = !mostrar;
      if (mostrar) tabelasVisiveis++;
    });

    navLinks.forEach(function (a) {
      const sec = document.getElementById(a.dataset.alvo);
      a.parentElement.hidden = !!(sec && sec.hidden);
    });

    if (!termo) {
      resultado.textContent = '';
    } else if (tabelasVisiveis === 0) {
      resultado.textContent = 'Nenhum resultado.';
    } else {
      resultado.textContent = tabelasVisiveis + ' tabela(s) e ' + colunasEncontradas + ' coluna(s) encontradas.';
    }
    semResultados.hidden = !(termo && tabelasVisiveis === 0);
  }
  busca.addEventListener('input', filtrar);
  limpar.addEventListener('click', function () {
    busca.value = '';
    filtrar();
    busca.focus();
  });
  document.addEventListener('keydown', function (e) {
    const digitando = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === '/' && !digitando && !modal.classList.contains('aberto')) {
      e.preventDefault();
      busca.focus();
    }
    if (e.key === 'Escape') {
      if (modal.classList.contains('aberto')) fecharDer();
      else if (sidebar.classList.contains('aberta')) alternarMenu(false);
    }
  });
  limpar.hidden = true;

  /* ---------- Modal do DER com zoom e arrastar (Panzoom) ---------- */
  const modal = document.getElementById('modal-der');
  const abrirDer = document.getElementById('abrir-der');
  const fecharBotao = document.getElementById('fechar-der');
  const imagem = document.getElementById('imagem-der');
  const areaZoom = document.getElementById('area-zoom');
  const nivel = document.getElementById('nivel-zoom');
  let panzoom = null;

  function iniciarZoom() {
    if (panzoom || typeof Panzoom === 'undefined') return;
    panzoom = Panzoom(imagem, {
      maxScale: 5,
      minScale: 0.3,
      contain: 'outside',
      excludeClass: 'panzoom-exclude'
    });
    areaZoom.addEventListener('wheel', panzoom.zoomWithWheel);
    imagem.addEventListener('panzoomchange', function (ev) {
      nivel.textContent = 'Zoom: ' + Math.round(ev.detail.scale * 100) + '%';
    });
    document.getElementById('zoom-mais').addEventListener('click', function () { panzoom.zoomIn(); });
    document.getElementById('zoom-menos').addEventListener('click', function () { panzoom.zoomOut(); });
    document.getElementById('zoom-reset').addEventListener('click', function () { panzoom.reset(); });
  }

  function abrirModal() {
    modal.classList.add('aberto');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    iniciarZoom();
    fecharBotao.focus();
  }
  function fecharDer() {
    modal.classList.remove('aberto');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    abrirDer.focus();
  }
  abrirDer.addEventListener('click', abrirModal);
  fecharBotao.addEventListener('click', fecharDer);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) fecharDer();
  });
})();

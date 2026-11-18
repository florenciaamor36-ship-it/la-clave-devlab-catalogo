(() => {
  'use strict';
  const PAGE_SIZE = 36;
  const ids = ['search','category-filter','language-filter','video-filter','sort-filter','clear-filters','category-chips','category-list','cards','result-count','active-filter-label','empty-state','load-more','empty-clear','total-count','category-count'];
  const els = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  let catalog = [];
  let visibleCount = PAGE_SIZE;
  let selectedCategory = '';

  const categoryNames = {
    '3D Renderer':'Renderizado 3D','AI Model':'Modelos de IA','Augmented Reality':'Realidad aumentada',
    'BitTorrent Client':'Cliente BitTorrent','Blockchain / Cryptocurrency':'Blockchain y criptomonedas',
    'Bot':'Bots','Command-Line Tool':'Herramientas de terminal','Database':'Bases de datos',
    'Distributed Systems':'Sistemas distribuidos','Docker':'Docker y contenedores',
    'Emulator / Virtual Machine':'Emuladores y máquinas virtuales',
    'Front-end Framework / Library':'Frameworks y bibliotecas web','Game':'Videojuegos',
    'Git':'Git y control de versiones','Memory Allocator':'Gestión de memoria',
    'Network Stack':'Redes y protocolos','Neural Network':'Redes neuronales',
    'Operating System':'Sistemas operativos','Physics Engine':'Motores de física','Processor':'Procesadores',
    'Programming Language':'Lenguajes de programación','Regex Engine':'Motores de expresiones regulares',
    'Search Engine':'Motores de búsqueda','Shell':'Intérpretes de comandos',
    'Template Engine':'Motores de plantillas','Text Editor':'Editores de texto',
    'Visual Recognition System':'Reconocimiento visual','Voxel Engine':'Motores voxel',
    'Web Browser':'Navegadores web','Web Server':'Servidores web','Uncategorized':'Otros proyectos'
  };
  const categoryLabel = name => categoryNames[name] || name;
  const categoryIcon = name => ({
    'AI Model':'✳','Neural Network':'◉','Database':'▤','Web Browser':'⌘','Web Server':'↗',
    'Git':'⑂','Docker':'▣','Game':'◇','Blockchain / Cryptocurrency':'◈','Search Engine':'⌕'
  }[name] || '◌');
  const clean = value => String(value).toLocaleLowerCase('es');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function setupFilters() {
    const categories = [...new Set(catalog.map(item => item.category))];
    const languages = [...new Set(catalog.map(item => item.language))].sort((a,b) => a.localeCompare(b,'es'));
    els['total-count'].textContent = catalog.length.toLocaleString('es-AR');
    els['category-count'].textContent = categories.length;
    const counts = catalog.reduce((acc,item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = categoryLabel(category);
      els['category-filter'].append(option);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-item';
      button.dataset.category = category;
      button.innerHTML = `<span>${esc(categoryIcon(category))} &nbsp;${esc(categoryLabel(category))}</span><small>${counts[category]}</small>`;
      button.addEventListener('click', () => chooseCategory(category));
      els['category-list'].append(button);
    });
    languages.forEach(language => {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = language;
      els['language-filter'].append(option);
    });
    ['AI Model','Database','Git','Neural Network','Web Browser','Game','Docker','Search Engine']
      .filter(category => categories.includes(category)).forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-chip';
        button.textContent = categoryLabel(category);
        button.dataset.category = category;
        button.addEventListener('click', () => chooseCategory(selectedCategory === category ? '' : category));
        els['category-chips'].append(button);
      });
  }

  function chooseCategory(category) {
    selectedCategory = category;
    els['category-filter'].value = category;
    visibleCount = PAGE_SIZE;
    update();
  }

  function matching() {
    const query = clean(els.search.value.trim());
    const category = els['category-filter'].value;
    const language = els['language-filter'].value;
    const onlyVideo = els['video-filter'].checked;
    let list = catalog.filter(item => {
      const categoryMatch = (!category || item.category === category) && (!selectedCategory || item.category === selectedCategory);
      const languageMatch = !language || item.language === language;
      const videoMatch = !onlyVideo || item.video;
      const searchMatch = !query || clean(`${item.title_es || ''} ${item.title} ${item.category} ${categoryLabel(item.category)} ${item.language}`).includes(query);
      return categoryMatch && languageMatch && videoMatch && searchMatch;
    });
    if (els['sort-filter'].value === 'az') list = [...list].sort((a,b) => a.title.localeCompare(b.title,'es'));
    if (els['sort-filter'].value === 'language') list = [...list].sort((a,b) => a.language.localeCompare(b.language,'es') || a.title.localeCompare(b.title,'es'));
    return list;
  }

  function update() {
    const list = matching();
    const shown = list.slice(0, visibleCount);
    const active = els['category-filter'].value || selectedCategory;
    els['result-count'].textContent = `${list.length.toLocaleString('es-AR')} ${list.length === 1 ? 'guía' : 'guías'}`;
    els['active-filter-label'].textContent = active
      ? `${categoryLabel(active)} · ${list.length} ${list.length === 1 ? 'guía' : 'guías'}`
      : 'Todas las guías';
    els.cards.innerHTML = shown.map(item => `
      <article class="guide-card">
        <div class="card-top"><span class="category-tag" title="${esc(categoryLabel(item.category))}">${esc(categoryLabel(item.category))}</span>${item.video ? '<span class="format-tag">▶ VIDEO</span>' : ''}</div>
        <span class="language-label">${esc(item.language)}</span>
        <h3 title="${esc(item.title_es ? `Título original: ${item.title}` : item.title)}">${esc(item.title_es || item.title)}</h3>
        <a class="card-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer"><span>Abrir guía original</span><span aria-hidden="true">↗</span></a>
      </article>`).join('');
    els['empty-state'].hidden = list.length > 0;
    els['load-more'].hidden = shown.length >= list.length;
    document.querySelectorAll('.category-item,.category-chip').forEach(button => {
      button.classList.toggle('active', button.dataset.category === active);
    });
  }

  function clear() {
    els.search.value = '';
    els['category-filter'].value = '';
    els['language-filter'].value = '';
    els['video-filter'].checked = false;
    els['sort-filter'].value = 'source';
    selectedCategory = '';
    visibleCount = PAGE_SIZE;
    update();
  }

  async function init() {
    try {
      const response = await fetch('./catalog.json');
      if (!response.ok) throw new Error('No se pudo cargar el catálogo');
      catalog = await response.json();
      if (!Array.isArray(catalog) || catalog.length === 0) throw new Error('El catálogo llegó vacío');
      setupFilters();
      update();
    } catch (error) {
      els['result-count'].textContent = 'No se pudo cargar el catálogo';
      els.cards.innerHTML = '<div class="empty-state"><h3>No se pudo abrir el catálogo</h3><p>Probá recargando la página. También podés consultar la fuente original en GitHub.</p></div>';
      els['empty-state'].hidden = true;
      console.error(error);
    }
  }

  ['input','change'].forEach(event => {
    els.search.addEventListener(event, () => { visibleCount = PAGE_SIZE; update(); });
    els['category-filter'].addEventListener(event, () => { selectedCategory = ''; visibleCount = PAGE_SIZE; update(); });
    els['language-filter'].addEventListener(event, () => { visibleCount = PAGE_SIZE; update(); });
    els['video-filter'].addEventListener(event, () => { visibleCount = PAGE_SIZE; update(); });
    els['sort-filter'].addEventListener(event, update);
  });
  els['clear-filters'].addEventListener('click', clear);
  els['empty-clear'].addEventListener('click', clear);
  els['load-more'].addEventListener('click', () => { visibleCount += PAGE_SIZE; update(); });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
      event.preventDefault(); els.search.focus();
    }
    if (event.key === 'Escape' && document.activeElement === els.search) {
      els.search.value = ''; visibleCount = PAGE_SIZE; update();
    }
  });
  init();
})();

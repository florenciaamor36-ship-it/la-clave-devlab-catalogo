(() => {
  const PAGE_SIZE = 36;
  const els = Object.fromEntries(['search','category-filter','language-filter','video-filter','sort-filter','clear-filters','category-chips','category-list','cards','result-count','active-filter-label','empty-state','load-more','empty-clear','total-count','category-count'].map(id => [id, document.getElementById(id)]));
  let catalog = [], visibleCount = PAGE_SIZE, selectedCategory = '';
  const clean = value => value.toLocaleLowerCase('es');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const categoryIcon = name => ({'AI Model':'✳','Neural Network':'◉','Database':'▤','Web Browser':'⌘','Web Server':'↗','Git':'⑂','Docker':'▣','Game':'◇','Blockchain / Cryptocurrency':'◈','Search Engine':'⌕'}[name] || '◌');

  function setupFilters() {
    const categories = [...new Set(catalog.map(item => item.category))];
    const languages = [...new Set(catalog.map(item => item.language))].sort((a,b) => a.localeCompare(b,'es'));
    els['total-count'].textContent = catalog.length.toLocaleString('es-AR');
    els['category-count'].textContent = categories.length;
    const counts = catalog.reduce((acc,item) => (acc[item.category]=(acc[item.category]||0)+1,acc),{});
    categories.forEach(category => {
      const option = document.createElement('option'); option.value = category; option.textContent = category; els['category-filter'].append(option);
      const button = document.createElement('button'); button.type='button'; button.className='category-item'; button.dataset.category=category; button.innerHTML=`<span>${esc(categoryIcon(category))} &nbsp;${esc(category)}</span><small>${counts[category]}</small>`; button.addEventListener('click',()=>chooseCategory(category)); els['category-list'].append(button);
    });
    languages.forEach(language => { const option=document.createElement('option'); option.value=language; option.textContent=language; els['language-filter'].append(option); });
    const popular = ['AI Model','Database','Git','Neural Network','Web Browser','Game','Docker','Search Engine'];
    popular.filter(c=>categories.includes(c)).forEach(category=>{const button=document.createElement('button');button.type='button';button.className='category-chip';button.textContent=category;button.dataset.category=category;button.addEventListener('click',()=>chooseCategory(selectedCategory===category?'':category));els['category-chips'].append(button);});
  }
  function chooseCategory(category){selectedCategory=category;els['category-filter'].value=category;visibleCount=PAGE_SIZE;update();}
  function matching(){
    const query=clean(els.search.value.trim()), category=els['category-filter'].value, language=els['language-filter'].value, onlyVideo=els['video-filter'].checked;
    let list=catalog.filter(item=> (!category||item.category===category)&&(!selectedCategory||item.category===selectedCategory)&&(!language||item.language===language)&&(!onlyVideo||item.video)&&(!query||clean(`${item.title} ${item.category} ${item.language}`).includes(query)));
    const sort=els['sort-filter'].value;
    if(sort==='az') list=[...list].sort((a,b)=>a.title.localeCompare(b.title,'es'));
    if(sort==='language') list=[...list].sort((a,b)=>a.language.localeCompare(b.language,'es')||a.title.localeCompare(b.title,'es'));
    return list;
  }
  function update(){
    const list=matching(), shown=list.slice(0,visibleCount); const active=els['category-filter'].value||selectedCategory;
    els['result-count'].textContent=`${list.length.toLocaleString('es-AR')} ${list.length===1?'guía':'guías'}`;
    els['active-filter-label'].textContent=active?`${active} · ${list.length} ${list.length===1?'guía':'guías'}`:'Todas las guías';
    els.cards.innerHTML=shown.map(item=>`<article class="guide-card"><div class="card-top"><span class="category-tag" title="${esc(item.category)}">${esc(item.category)}</span>${item.video?'<span class="format-tag">▶ VIDEO</span>':''}</div><span class="language-label">${esc(item.language)}</span><h3>${esc(item.title)}</h3><a class="card-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer"><span>Ir a la guía original</span><span aria-hidden="true">↗</span></a></article>`).join('');
    els['empty-state'].hidden=list.length>0; els['load-more'].hidden=shown.length>=list.length;
    document.querySelectorAll('.category-item,.category-chip').forEach(button=>button.classList.toggle('active',button.dataset.category===active));
  }
  function clear(){els.search.value='';els['category-filter'].value='';els['language-filter'].value='';els['video-filter'].checked=false;els['sort-filter'].value='source';selectedCategory='';visibleCount=PAGE_SIZE;update();}
  async function init(){
    try { const response=await fetch('./catalog.json'); if(!response.ok) throw new Error('No se pudo cargar el catálogo'); catalog=await response.json(); setupFilters(); update(); }
    catch { els['result-count'].textContent='No se pudo cargar el catálogo'; els.cards.innerHTML='<div class="empty-state"><h3>El catálogo no está disponible por el momento</h3><p>Podés consultar la fuente original en GitHub.</p></div>'; }
  }
  ['input','change'].forEach(event=>{els.search.addEventListener(event,()=>{visibleCount=PAGE_SIZE;update()});els['category-filter'].addEventListener(event,()=>{selectedCategory='';visibleCount=PAGE_SIZE;update()});els['language-filter'].addEventListener(event,()=>{visibleCount=PAGE_SIZE;update()});els['video-filter'].addEventListener(event,()=>{visibleCount=PAGE_SIZE;update()});els['sort-filter'].addEventListener(event,update)});
  els['clear-filters'].addEventListener('click',clear); els['empty-clear'].addEventListener('click',clear); els['load-more'].addEventListener('click',()=>{visibleCount+=PAGE_SIZE;update()});
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();els.search.focus()} if(event.key==='Escape'&&document.activeElement===els.search){els.search.value='';visibleCount=PAGE_SIZE;update()}});
  init();
})();

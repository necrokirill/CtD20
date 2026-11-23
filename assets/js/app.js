/* ==========================================================================
   CHANGELING: THE DREAMING 20TH — INTERACTIVE BOOK ENGINE (app.js)
   - Boundary-safe 55+ term Lexicon Auto-Linker + BG3 Chained Popover / Sheet
   - 13-Kith Stained-Glass Arcana Gallery + Dynamic Aura + Book Scroll View
   - Step 3/4 Interactive Widgets (Tempers + Cantrip Equation)
   - Global Instant Search (Ctrl+K / ⌘K), Table Mode, TOC Scrollspy & Lightbox
   ========================================================================== */
(function () {
  'use strict';

  const BUNDLE = window.CTD_BUNDLE || { lexicon: [], kiths: [], houses: [], legacies: [], thresholds: [], volumes: [], search: [] };
  const ROOT = document.documentElement.getAttribute('data-root') || './';
  const LEXICON = BUNDLE.lexicon || [];
  const KITHS = BUNDLE.kiths || [];
  const HOUSES = BUNDLE.houses || [];
  const LEGACIES = BUNDLE.legacies || [];
  const THRESHOLDS = BUNDLE.thresholds || [];
  const LEX_MAP = Object.fromEntries(LEXICON.map((item) => [item.id, item]));

  /* ------------------------------------------------------------------------
     1. BOUNDARY-SAFE LEXICON AUTO-LINKER
     ------------------------------------------------------------------------ */
  const PATTERN_LIST = [];
  LEXICON.forEach((item) => {
    (item.patterns || []).forEach((p) => PATTERN_LIST.push({ text: p, id: item.id }));
  });
  PATTERN_LIST.sort((a, b) => b.text.length - a.text.length);

  // Preserve case sensitivity for ambiguous capitalized words like "Банк" / "Тропы" / mechanic terms
  const CASE_SENSITIVE_WORDS = new Set([
    'Банк',
    'Тропы',
    'Троп',
    'Тропам',
    'Титул',
    'Титула',
    'Титулу',
    'Титулом',
    'Титуле',
    'Воспоминания',
    'Воспоминаний',
    'Воспоминаниям',
    'Воспоминаниями',
    'Воспоминаниях',
    'Вдохновение',
    'Вдохновения',
    'Вдохновением',
    'Вдохновении',
    'Восхищение',
    'Восхищения',
    'Восхищением',
    'Восхищении',
    'Восхищению',
    'Опустошение',
    'Опустошения',
    'Опустошением',
    'Опустошении',
    'Опустошению',
    'Владычество',
    'Владычества',
    'Владычеством',
    'Владычеству',
    'Владычестве',
    'Отблески',
    'Отблесков',
    'Отблесками',
    'Отблесках',
    'Порог',
    'Порога',
    'Порогу',
    'Порогом',
    'Пороге',
    'Пороги',
    'Порогов',
    'Порогам',
    'Порогами',
    'Порогах',
    'Призвание',
    'Призвания',
    'Призванию',
    'Призванием',
    'Запрет',
    'Запрета',
    'Запрету',
    'Запретом',
    'Сокровище',
    'Сокровища',
    'Сокровищу',
    'Сокровищем',
    'Сокровищ',
    'Сокровищам',
    'Сокровищами',
    'Сокровищах',
    'Темперамент',
    'Темперамента',
    'Темпераменту',
    'Темпераменте',
    'Темпераменты',
    'Темпераментов',
    'Темпераментам',
    'Темпераментами',
    'Темпераментах'
  ]);
  const EXACT_LOOKUP = new Map();
  const LOWER_LOOKUP = new Map();
  PATTERN_LIST.forEach((p) => {
    if (CASE_SENSITIVE_WORDS.has(p.text)) {
      if (!EXACT_LOOKUP.has(p.text)) EXACT_LOOKUP.set(p.text, p.id);
    } else {
      const low = p.text.toLowerCase();
      if (!LOWER_LOOKUP.has(low)) LOWER_LOOKUP.set(low, p.id);
    }
  });

  const LINK_RE = PATTERN_LIST.length
    ? new RegExp(
        `(^|[^А-Яа-яЁёA-Za-z0-9_])(${PATTERN_LIST.map((p) =>
          p.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        ).join('|')})(?![А-Яа-яЁёA-Za-z0-9_])`,
        'g'
      )
    : null;

  function resolveTermId(word) {
    if (EXACT_LOOKUP.has(word)) return EXACT_LOOKUP.get(word);
    return LOWER_LOOKUP.get(word.toLowerCase()) || null;
  }

  function linkifyText(text, excludeId = null) {
    if (!text || !LINK_RE) return text || '';
    return text.replace(LINK_RE, (full, prefix, word) => {
      const id = resolveTermId(word);
      if (!id || id === excludeId) return full;
      const item = LEX_MAP[id];
      const isRule = Boolean(item && item.kind === 'rule');
      return `${prefix}<button type="button" class="lex-term${isRule ? ' lex-rule' : ''}" data-term="${id}"${isRule ? ' data-kind="rule"' : ''}>${word}</button>`;
    });
  }

  function formatInlineMd(str) {
    if (!str) return '';
    return str
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  function linkifyHTML(html, excludeId = null) {
    if (!html) return '';
    const parts = html.split(/(<[^>]+>)/g);
    let skipDepth = 0;
    return parts
      .map((part) => {
        if (part.startsWith('<')) {
          if (/^<(button|a|code|pre|h1|h2|h3|h4|script|style)\b/i.test(part)) skipDepth++;
          else if (/^<\/(button|a|code|pre|h1|h2|h3|h4|script|style)>/i.test(part)) {
            skipDepth = Math.max(0, skipDepth - 1);
          }
          return part;
        }
        return skipDepth > 0 ? part : linkifyText(part, excludeId);
      })
      .join('');
  }

  function linkifyDOMContainer(rootEl) {
    if (!rootEl || !LINK_RE) return;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('button, a, h1, h2, h3, h4, code, pre, script, style, .no-lex')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((textNode) => {
      const raw = textNode.nodeValue;
      LINK_RE.lastIndex = 0;
      if (!LINK_RE.test(raw)) return;
      LINK_RE.lastIndex = 0;
      const replaced = linkifyText(
        raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      );
      if (replaced === raw) return;
      const span = document.createElement('span');
      span.innerHTML = replaced;
      textNode.parentNode.replaceChild(span, textNode);
      // unwrap span
      while (span.firstChild) span.parentNode.insertBefore(span.firstChild, span);
      span.parentNode.removeChild(span);
    });
  }

  /* ------------------------------------------------------------------------
     2. STATE
     ------------------------------------------------------------------------ */
  const state = {
    selectedKithId: KITHS[0] ? KITHS[0].id : 'boggans',
    kithDetailTab: 'essence', // 'essence' | 'powers' | 'seemings' | 'stereotypes'
    kithAffinityFilter: 'all',
    kithViewMode: 'arcana',   // 'arcana' | 'scroll'
    selectedHouseId: HOUSES[0] ? HOUSES[0].id : 'gwydion',
    houseDetailTab: 'lore',   // 'lore' | 'powers' | 'factions' | 'members'
    houseCourtFilter: 'all',
    houseViewMode: 'arcana',  // 'arcana' | 'scroll'
    selectedSeelieLegacyId: 'paladin',
    selectedUnseelieLegacyId: 'fool',
    legacyLeadCourt: 'Благой',
    legacyCourtFilter: 'all',
    legacyQuery: '',
    legacyViewMode: 'pair',   // 'pair' | 'scroll'
    selectedThresholdId: 'foster_dreams',
    thresholdMode: 'musing',  // 'musing' | 'ravaging' | 'pairs'
    tableMode: localStorage.getItem('ctd20_table_mode') === '1',
    forceSheet: false,
    seeming: 'wilder',
    wilderBonus: 'glamour',
    houseLiam: false,
    cantripExample: 'boggan',
    lexKind: 'all',
    lexCat: 'all',
    lexQuery: '',
    chain: [],
    popoverPinned: false,
    popoverOpen: false,
    sheetOpen: false,
    hoverTimer: null
  };

  function hexToRgbStr(hex) {
    const clean = (hex || '#d8b979').replace('#', '');
    if (clean.length !== 6) return '216, 185, 121';
    const n = parseInt(clean, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }

  function resolveAssetUrl(path) {
    if (!path) return '';
    if (/^(https?:|data:|\/)/.test(path)) return path;
    return ROOT + path.replace(/^\.?\//, '');
  }

  /* ------------------------------------------------------------------------
     3. WIDGET: 13-KITH STAINED-GLASS ARCANA GALLERY
     ------------------------------------------------------------------------ */
  function initKithsGallery() {
    const mount = document.getElementById('kiths-widget-mount');
    if (!mount || !KITHS.length) return;

    // Check URL hash or ?kith= param
    const params = new URLSearchParams(window.location.search);
    const qKith = params.get('kith');
    if (qKith && KITHS.some((k) => k.id === qKith)) {
      state.selectedKithId = qKith;
    }

    const affinities = ['all', 'Актёр', 'Фея', 'Природа', 'Предмет', 'Сцена', 'Время'];

    mount.innerHTML = `
      <section id="kiths-arcana" class="space-y-6 my-8">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979]">Народы Грёзы · Витражная галерея</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc] !mt-1 !mb-0 !border-0 !pb-0">
              Тринадцать Китов Конкордии
            </h2>
          </div>
          <div class="no-print inline-flex rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1 self-start md:self-auto">
            <button type="button" id="kview-arcana" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ✦ Витражные Арканы
            </button>
            <button type="button" id="kview-scroll" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ☰ Книжный свиток
            </button>
          </div>
        </div>

        <!-- Affinity Filter Pills -->
        <div id="kiths-filter-bar" class="no-print flex flex-wrap items-center gap-1.5">
          <span class="text-[11px] uppercase tracking-wider text-[#a69f90] mr-1">Сродство:</span>
          ${affinities
            .map(
              (af) => `
            <button type="button" data-af="${af}" class="kith-af-btn px-3 py-1 rounded-full text-xs border transition">
              ${af === 'all' ? `Все (${KITHS.length})` : af}
            </button>
          `
            )
            .join('')}
        </div>

        <!-- Interactive Arcana Mode -->
        <div id="kiths-interactive-area" class="space-y-6">
          <div id="kiths-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"></div>
          <div id="kith-spotlight" class="nouveau-panel p-5 sm:p-8 scroll-mt-24" aria-live="polite"></div>
        </div>

        <!-- Continuous Scroll Reading Mode -->
        <div id="kiths-scroll-area" class="hidden space-y-8"></div>

        <!-- Print-Only Expansion -->
        <div id="print-kiths-container" class="print-only space-y-4"></div>
      </section>
    `;

    document.getElementById('kview-arcana').addEventListener('click', () => {
      state.kithViewMode = 'arcana';
      syncKithViewMode();
    });
    document.getElementById('kview-scroll').addEventListener('click', () => {
      state.kithViewMode = 'scroll';
      syncKithViewMode();
    });

    mount.querySelectorAll('.kith-af-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.kithAffinityFilter = btn.getAttribute('data-af');
        renderKithsGrid();
      });
    });

    renderKithsGrid();
    selectKith(state.selectedKithId, false);
    renderKithsScrollArea();
    syncKithViewMode();
  }

  function syncKithViewMode() {
    const arcanaArea = document.getElementById('kiths-interactive-area');
    const scrollArea = document.getElementById('kiths-scroll-area');
    const filterBar = document.getElementById('kiths-filter-bar');
    const bArc = document.getElementById('kview-arcana');
    const bScr = document.getElementById('kview-scroll');
    if (!arcanaArea || !scrollArea) return;

    const isArc = state.kithViewMode === 'arcana';
    arcanaArea.classList.toggle('hidden', !isArc);
    filterBar.classList.toggle('hidden', !isArc);
    scrollArea.classList.toggle('hidden', isArc);

    bArc.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      isArc ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
    bScr.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      !isArc ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
  }

  function renderKithsGrid() {
    const grid = document.getElementById('kiths-grid');
    if (!grid) return;

    document.querySelectorAll('.kith-af-btn').forEach((btn) => {
      const active = btn.getAttribute('data-af') === state.kithAffinityFilter;
      btn.className = `kith-af-btn px-3 py-1 rounded-full text-xs border transition ${
        active
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });

    const filtered =
      state.kithAffinityFilter === 'all'
        ? KITHS
        : KITHS.filter((k) => k.affinity === state.kithAffinityFilter);

    grid.innerHTML = filtered
      .map((k) => {
        const rgb = k.auraRgb || hexToRgbStr(k.auraHex);
        const portraitHTML = k.image
          ? `<div class="relative z-10 w-16 h-20 sm:w-20 sm:h-24 rounded-t-full rounded-b-lg overflow-hidden mb-2.5 border shadow-md"
                  style="border-color: rgba(${rgb}, 0.6);">
               <img src="${resolveAssetUrl(k.image)}" alt="${k.ru}" class="w-full h-full object-cover" loading="lazy"/>
             </div>`
          : `<div class="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2.5 border transition-transform duration-300 group-hover:scale-105"
                  style="color: ${k.auraHex}; border-color: rgba(${rgb}, 0.50); background: radial-gradient(circle, rgba(${rgb}, 0.18), rgba(11, 17, 15, 0.74));">
               <div class="w-8 h-8">${k.emblem || ''}</div>
             </div>`;

        return `
          <button
            type="button"
            id="tarot-${k.id}"
            data-kith-card="${k.id}"
            class="tarot-card group text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0dba8] ${
              k.id === state.selectedKithId ? 'active' : ''
            }"
            style="--card-aura: ${k.auraHex}; --card-aura-rgb: ${rgb};"
          >
            <span class="tarot-foil" aria-hidden="true"></span>
            ${portraitHTML}
            <h3 class="relative z-10 font-nouveau text-lg sm:text-xl font-semibold text-[#f0eadc] leading-tight">
              ${k.ru}
            </h3>
            <div class="relative z-10 text-[10px] uppercase tracking-[0.15em] text-[#a69f90] mt-0.5">
              ${k.en}
            </div>
            <div class="relative z-10 my-2 w-9 h-px" style="background: linear-gradient(90deg, transparent, ${k.auraHex}, transparent);"></div>
            <p class="relative z-10 lore-only text-[11px] text-[#a69f90] leading-snug mb-2.5 line-clamp-2">
              ${k.tagline || ''}
            </p>
            <span class="relative z-10 mt-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] border"
                  style="border-color: rgba(${rgb}, 0.45); background: rgba(${rgb}, 0.12); color: #f0eadc;">
              <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${k.auraHex};"></span>
              ${k.affinity}
            </span>
          </button>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-kith-card]').forEach((btn) => {
      btn.addEventListener('click', () => selectKith(btn.getAttribute('data-kith-card'), true));
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
        btn.style.setProperty('--my', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
      });
    });
  }

  function selectKith(kithId, scrollToPanel = false) {
    const k = KITHS.find((item) => item.id === kithId);
    if (!k) return;

    state.selectedKithId = kithId;
    if (state.tableMode && state.kithDetailTab === 'essence') {
      state.kithDetailTab = 'powers';
    }

    document.querySelectorAll('[data-kith-card]').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-kith-card') === kithId);
    });

    const rgb = k.auraRgb || hexToRgbStr(k.auraHex);
    document.documentElement.style.setProperty('--aura-hex', k.auraHex);
    document.documentElement.style.setProperty('--aura-rgb', rgb);

    renderKithSpotlight();

    if (scrollToPanel) {
      const panel = document.getElementById('kith-spotlight');
      if (panel) {
        const rect = panel.getBoundingClientRect();
        if (rect.top < 60 || rect.top > window.innerHeight * 0.65) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }

  function renderKithSpotlight() {
    const spot = document.getElementById('kith-spotlight');
    if (!spot) return;
    const k = KITHS.find((item) => item.id === state.selectedKithId);
    if (!k) return;
    const rgb = k.auraRgb || hexToRgbStr(k.auraHex);

    const tabs = [
      { id: 'essence', label: 'История и Облик' },
      { id: 'powers', label: 'Права и Слабость' },
      { id: 'seemings', label: 'Стадии души' },
      { id: 'stereotypes', label: `Стереотипы (${(k.stereotypes || []).length})` }
    ];

    let bodyHTML = '';

    if (state.kithDetailTab === 'essence') {
      const firstLore = (k.lore && k.lore[0]) || '';
      const restLore = (k.lore || []).slice(1);
      const imageBlock = k.image
        ? `<figure class="nouveau-figure style-right style-arch">
             <div class="nouveau-figure-frame">
               <img src="${resolveAssetUrl(k.image)}" alt="${k.ru}" data-lightbox="${resolveAssetUrl(k.image)}" data-caption="${k.ru} (${k.en})" />
             </div>
             <figcaption>${k.ru} · ${k.en}</figcaption>
           </figure>`
        : '';

      bodyHTML = `
        <div class="space-y-5">
          ${
            k.quote
              ? `<blockquote class="border-l-2 pl-4 py-0.5 font-nouveau italic text-lg sm:text-xl text-[#f0dba8]/95 leading-snug"
                             style="border-color: ${k.auraHex};">
                   ${linkifyHTML(formatInlineMd(k.quote))}
                 </blockquote>`
              : ''
          }
          <div class="clearfix text-sm sm:text-[15.5px] text-[#f0eadc]/92 space-y-3.5 leading-relaxed">
            ${imageBlock}
            ${
              firstLore
                ? `<p><span class="drop-cap" aria-hidden="true">${firstLore.charAt(0)}</span>${linkifyHTML(
                    formatInlineMd(firstLore.slice(1))
                  )}</p>`
                : ''
            }
            ${restLore.map((p) => `<p>${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div class="rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/58 p-4 sm:p-5 space-y-2">
              <div class="text-[11px] uppercase tracking-[0.18em] text-[#d8b979]">Внешность · Appearance</div>
              ${(k.appearance || [])
                .map((p) => `<p class="text-xs sm:text-[13.8px] text-[#f0eadc]/88 leading-relaxed">${linkifyHTML(formatInlineMd(p))}</p>`)
                .join('')}
            </div>
            <div class="rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/58 p-4 sm:p-5 space-y-2">
              <div class="text-[11px] uppercase tracking-[0.18em] text-[#d8b979]">Образ жизни · Lifestyles</div>
              ${(k.lifestyle || [])
                .map((p) => `<p class="text-xs sm:text-[13.8px] text-[#f0eadc]/88 leading-relaxed">${linkifyHTML(formatInlineMd(p))}</p>`)
                .join('')}
            </div>
          </div>
        </div>
      `;
    } else if (state.kithDetailTab === 'powers') {
      bodyHTML = `
        <div class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="rounded-xl border p-4 sm:p-5 space-y-3.5"
                 style="border-color: rgba(${rgb}, 0.44); background: linear-gradient(160deg, rgba(${rgb}, 0.09), rgba(11, 17, 15, 0.76));">
              <div class="flex items-center justify-between border-b border-[#d8b979]/15 pb-2">
                <h4 class="font-nouveau text-xl sm:text-2xl font-semibold text-[#f0dba8]">Врождённые права</h4>
                <span class="text-[10px] uppercase tracking-[0.18em] text-[#a69f90]">Birthrights</span>
              </div>
              <div class="space-y-4">
                ${(k.birthrights || [])
                  .map(
                    (b) => `
                  <div class="space-y-1.5">
                    <div class="text-sm font-semibold" style="color: ${k.auraHex};">✦ ${b.name}</div>
                    ${(b.paragraphs || [])
                      .map(
                        (p) =>
                          `<p class="text-xs sm:text-[13.8px] text-[#f0eadc]/92 leading-relaxed">${linkifyHTML(
                            formatInlineMd(p)
                          )}</p>`
                      )
                      .join('')}
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <div class="rounded-xl border border-[#a83b4a]/48 p-4 sm:p-5 flex flex-col justify-between gap-4"
                 style="background: linear-gradient(160deg, rgba(168, 59, 74, 0.11), rgba(11, 17, 15, 0.80));">
              <div class="space-y-3">
                <div class="flex items-center justify-between border-b border-[#a83b4a]/28 pb-2">
                  <h4 class="font-nouveau text-xl sm:text-2xl font-semibold text-[#e6989f]">Слабость Кита</h4>
                  <span class="text-[10px] uppercase tracking-[0.18em] text-[#a69f90]">Frailty</span>
                </div>
                <div class="space-y-2">
                  <div class="text-sm font-semibold text-[#e6989f]">◈ ${(k.frailty && k.frailty.name) || 'Слабость'}</div>
                  ${((k.frailty && k.frailty.paragraphs) || [])
                    .map(
                      (p) =>
                        `<p class="text-xs sm:text-[13.8px] text-[#f0eadc]/92 leading-relaxed">${linkifyHTML(
                          formatInlineMd(p)
                        )}</p>`
                    )
                    .join('')}
                </div>
              </div>
              <div class="pt-3 border-t border-[#d8b979]/15 text-xs text-[#a69f90]">
                <strong class="text-[#d8b979]">Сродство Кита:</strong> ${linkifyText('Владение')}
                <strong style="color:${k.auraHex};">${k.affinity} (${k.affinityEn})</strong> снижает сложность броска ${linkifyText('Кантрипа')} на <strong>−1</strong>.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/58 p-4 space-y-1.5">
              <div class="text-[11px] uppercase tracking-[0.18em] text-[#d8b979]">${linkifyText('Разгул')} · Revelry</div>
              <p class="text-xs sm:text-[13.6px] text-[#f0eadc]/88 leading-relaxed">${linkifyHTML(formatInlineMd(k.revelry))}</p>
            </div>
            <div class="rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/58 p-4 space-y-1.5">
              <div class="text-[11px] uppercase tracking-[0.18em] text-[#d8b979]">${linkifyText('Высвобождение')} · Unleashing</div>
              <p class="text-xs sm:text-[13.6px] text-[#f0eadc]/88 leading-relaxed">${linkifyHTML(formatInlineMd(k.unleashing))}</p>
            </div>
          </div>
        </div>
      `;
    } else if (state.kithDetailTab === 'seemings') {
      bodyHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/60 p-4 sm:p-5 space-y-2">
            <div class="font-nouveau text-2xl font-semibold text-[#f0dba8]">Младенцы</div>
            <div class="text-[10px] uppercase tracking-[0.18em] text-[#a69f90]">Childlings · +1 Гламур</div>
            <p class="text-xs sm:text-[13.8px] text-[#f0eadc]/90 leading-relaxed pt-1">${linkifyHTML(
              formatInlineMd(k.seemings && k.seemings.childling)
            )}</p>
          </div>
          <div class="rounded-xl border p-4 sm:p-5 space-y-2" style="border-color: rgba(${rgb}, 0.45); background: rgba(${rgb}, 0.07);">
            <div class="font-nouveau text-2xl font-semibold" style="color: ${k.auraHex};">Дикари</div>
            <div class="text-[10px] uppercase tracking-[0.18em] text-[#a69f90]">Wilders · +1 Гламур или СВ</div>
            <p class="text-xs sm:text-[13.8px] text-[#f0eadc]/90 leading-relaxed pt-1">${linkifyHTML(
              formatInlineMd(k.seemings && k.seemings.wilder)
            )}</p>
          </div>
          <div class="rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/60 p-4 sm:p-5 space-y-2">
            <div class="font-nouveau text-2xl font-semibold text-[#f0eadc]">Ворчуны</div>
            <div class="text-[10px] uppercase tracking-[0.18em] text-[#a69f90]">Grumps · +1 Сила Воли</div>
            <p class="text-xs sm:text-[13.8px] text-[#f0eadc]/90 leading-relaxed pt-1">${linkifyHTML(
              formatInlineMd(k.seemings && k.seemings.grump)
            )}</p>
          </div>
        </div>
      `;
    } else {
      bodyHTML = `
        <div class="space-y-4">
          ${
            k.stereotypesNarrator
              ? `<p class="font-nouveau italic text-lg text-[#f0dba8]">${linkifyHTML(
                  formatInlineMd(k.stereotypesNarrator)
                )}</p>`
              : ''
          }
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${(k.stereotypes || [])
              .map(
                (st) => `
              <div class="rounded-xl border border-[#d8b979]/18 bg-[#0b110f]/55 p-3.5 space-y-1">
                <div class="text-xs font-semibold text-[#f0dba8]">${st.target}</div>
                <p class="text-xs sm:text-[13.2px] text-[#f0eadc]/86 leading-relaxed">${linkifyHTML(
                  formatInlineMd(st.text)
                )}</p>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    spot.innerHTML = `
      <div class="spotlight-anim relative z-10 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#d8b979]/20">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border"
                 style="color: ${k.auraHex}; border-color: rgba(${rgb}, 0.55); background: radial-gradient(circle, rgba(${rgb}, 0.22), rgba(11, 17, 15, 0.82));">
              <div class="w-8 h-8">${k.emblem || ''}</div>
            </div>
            <div>
              <div class="flex flex-wrap items-baseline gap-2.5">
                <h3 class="font-nouveau text-3xl sm:text-4xl font-semibold text-[#f0eadc] leading-none">${k.ru}</h3>
                <span class="text-xs uppercase tracking-[0.18em] text-[#a69f90]">${k.en}</span>
              </div>
              <p class="lore-only text-xs text-[#a69f90] mt-1">${k.tagline || ''}</p>
            </div>
          </div>

          <div class="inline-flex items-center gap-2 self-start sm:self-center px-3.5 py-1.5 rounded-full border text-xs"
               style="border-color: rgba(${rgb}, 0.50); background: rgba(${rgb}, 0.13); color: #f0eadc;">
            <span class="text-[#a69f90]">Сродство:</span>
            <strong style="color: ${k.auraHex};">${k.affinity}</strong>
            <span class="text-[11px] text-[#a69f90]">(−1 сл.)</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5" role="tablist">
          ${tabs
            .map((t) => {
              const active = state.kithDetailTab === t.id;
              return `
                <button type="button" data-ktab="${t.id}"
                  class="px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
                    active
                      ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
                      : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc] hover:border-[#d8b979]/55'
                  }">
                  ${t.label}
                </button>
              `;
            })
            .join('')}
        </div>

        <div>${bodyHTML}</div>
      </div>
    `;

    spot.querySelectorAll('[data-ktab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.kithDetailTab = btn.getAttribute('data-ktab');
        renderKithSpotlight();
      });
    });
  }

  function renderKithsScrollArea() {
    const area = document.getElementById('kiths-scroll-area');
    if (!area) return;
    area.innerHTML = KITHS.map((k) => {
      const rgb = k.auraRgb || hexToRgbStr(k.auraHex);
      return `
        <article id="kith-${k.id}" class="nouveau-panel p-6 sm:p-8 space-y-5 scroll-mt-24">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8b979]/20 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center border"
                   style="color:${k.auraHex}; border-color:rgba(${rgb},0.5); background:rgba(${rgb},0.14);">
                <div class="w-6 h-6">${k.emblem || ''}</div>
              </div>
              <div>
                <h3 class="font-nouveau text-2xl sm:text-3xl font-semibold text-[#f0eadc]">${k.ru} <span class="text-sm font-sans font-normal text-[#a69f90]">(${k.en})</span></h3>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-xs border" style="border-color:rgba(${rgb},0.45); color:${k.auraHex};">
              Сродство: ${k.affinity} (−1 сл.)
            </span>
          </div>
          <div class="lore-only space-y-3 text-sm leading-relaxed">
            <blockquote class="font-nouveau italic text-lg text-[#f0dba8] border-l-2 pl-3.5" style="border-color:${k.auraHex};">${linkifyHTML(formatInlineMd(k.quote))}</blockquote>
            ${(k.lore || []).map((p) => `<p>${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div class="rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/50 p-3.5">
                <div class="text-xs font-semibold text-[#d8b979] mb-1">Внешность</div>
                ${(k.appearance || []).map((p) => `<p class="text-xs leading-relaxed">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
              </div>
              <div class="rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/50 p-3.5">
                <div class="text-xs font-semibold text-[#d8b979] mb-1">Образ жизни</div>
                ${(k.lifestyle || []).map((p) => `<p class="text-xs leading-relaxed">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-xl border border-[#d8b979]/30 bg-[#0b110f]/65 p-4 space-y-2.5">
              <h4 class="font-nouveau text-xl font-semibold text-[#f0dba8]">Врождённые права</h4>
              ${(k.birthrights || [])
                .map(
                  (b) => `
                <div>
                  <div class="text-xs font-semibold" style="color:${k.auraHex};">✦ ${b.name}</div>
                  ${(b.paragraphs || []).map((p) => `<p class="text-xs leading-relaxed mt-0.5">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
                </div>`
                )
                .join('')}
            </div>
            <div class="rounded-xl border border-[#a83b4a]/40 bg-[#0b110f]/65 p-4 space-y-2.5">
              <h4 class="font-nouveau text-xl font-semibold text-[#e6989f]">Слабость · ${(k.frailty && k.frailty.name) || ''}</h4>
              ${((k.frailty && k.frailty.paragraphs) || []).map((p) => `<p class="text-xs leading-relaxed">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
              <div class="pt-2 border-t border-[#d8b979]/15 text-xs space-y-1">
                <p><strong class="text-[#d8b979]">Разгул:</strong> ${linkifyHTML(formatInlineMd(k.revelry))}</p>
                <p><strong class="text-[#d8b979]">Высвобождение:</strong> ${linkifyHTML(formatInlineMd(k.unleashing))}</p>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /* ------------------------------------------------------------------------
     3B. WIDGET: 14-HOUSE HERALDIC STAINED-GLASS GALLERY
     ------------------------------------------------------------------------ */
  function initHousesGallery() {
    const mount = document.getElementById('houses-widget-mount');
    if (!mount || !HOUSES.length) return;

    const params = new URLSearchParams(window.location.search);
    const qHouse = params.get('house');
    if (qHouse && HOUSES.some((h) => h.id === qHouse)) {
      state.selectedHouseId = qHouse;
    }

    const seelieCount = HOUSES.filter((h) => h.court === 'Благой').length;
    const unseelieCount = HOUSES.filter((h) => h.court === 'Неблагой').length;
    const courtFilters = [
      { id: 'all', label: `Все Дома (${HOUSES.length})` },
      { id: 'Благой', label: `☀ Благой Двор (${seelieCount})` },
      { id: 'Неблагой', label: `☽ Неблагой Двор (${unseelieCount})` }
    ];

    mount.innerHTML = `
      <section id="houses-arcana" class="space-y-6 my-8">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979]">Сияющее Воинство · Гербовая галерея</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc] !mt-1 !mb-0 !border-0 !pb-0">
              Четырнадцать Благородных Домов
            </h2>
          </div>
          <div class="no-print inline-flex rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1 self-start md:self-auto">
            <button type="button" id="hview-arcana" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ✦ Гербовые Витражи
            </button>
            <button type="button" id="hview-scroll" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ☰ Книжный свиток
            </button>
          </div>
        </div>

        <!-- Court Filter Pills -->
        <div id="houses-filter-bar" class="no-print flex flex-wrap items-center gap-1.5">
          <span class="text-[11px] uppercase tracking-wider text-[#a69f90] mr-1">Двор:</span>
          ${courtFilters
            .map(
              (cf) => `
            <button type="button" data-hcourt="${cf.id}" class="house-court-btn px-3 py-1 rounded-full text-xs border transition">
              ${cf.label}
            </button>
          `
            )
            .join('')}
        </div>

        <!-- Interactive Heraldic Mode -->
        <div id="houses-interactive-area" class="space-y-6">
          <div id="houses-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"></div>
          <div id="house-spotlight" class="nouveau-panel p-5 sm:p-8 scroll-mt-24" aria-live="polite"></div>
        </div>

        <!-- Continuous Scroll Reading Mode -->
        <div id="houses-scroll-area" class="hidden space-y-8"></div>

        <!-- Print-Only Expansion -->
        <div id="print-houses-container" class="print-only space-y-4"></div>
      </section>
    `;

    document.getElementById('hview-arcana').addEventListener('click', () => {
      state.houseViewMode = 'arcana';
      syncHouseViewMode();
    });
    document.getElementById('hview-scroll').addEventListener('click', () => {
      state.houseViewMode = 'scroll';
      syncHouseViewMode();
    });

    mount.querySelectorAll('.house-court-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.houseCourtFilter = btn.getAttribute('data-hcourt');
        const visible =
          state.houseCourtFilter === 'all'
            ? HOUSES
            : HOUSES.filter((h) => h.court === state.houseCourtFilter);
        if (visible.length && !visible.some((h) => h.id === state.selectedHouseId)) {
          state.selectedHouseId = visible[0].id;
        }
        renderHousesGrid();
        selectHouse(state.selectedHouseId, false);
      });
    });

    renderHousesGrid();
    selectHouse(state.selectedHouseId, false);
    renderHousesScrollArea();
    syncHouseViewMode();
  }

  function syncHouseViewMode() {
    const arcanaArea = document.getElementById('houses-interactive-area');
    const scrollArea = document.getElementById('houses-scroll-area');
    const filterBar = document.getElementById('houses-filter-bar');
    const bArc = document.getElementById('hview-arcana');
    const bScr = document.getElementById('hview-scroll');
    if (!arcanaArea || !scrollArea) return;

    const isArc = state.houseViewMode === 'arcana';
    arcanaArea.classList.toggle('hidden', !isArc);
    filterBar.classList.toggle('hidden', !isArc);
    scrollArea.classList.toggle('hidden', isArc);

    bArc.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      isArc ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
    bScr.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      !isArc ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
  }

  function renderHousesGrid() {
    const grid = document.getElementById('houses-grid');
    if (!grid) return;

    document.querySelectorAll('.house-court-btn').forEach((btn) => {
      const active = btn.getAttribute('data-hcourt') === state.houseCourtFilter;
      btn.className = `house-court-btn px-3 py-1 rounded-full text-xs border transition ${
        active
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });

    const filtered =
      state.houseCourtFilter === 'all'
        ? HOUSES
        : HOUSES.filter((h) => h.court === state.houseCourtFilter);

    grid.innerHTML = filtered
      .map((h) => {
        const rgb = h.auraRgb || hexToRgbStr(h.auraHex);
        const courtIcon = h.court === 'Благой' ? '☀' : '☽';
        return `
          <button
            type="button"
            id="house-card-${h.id}"
            data-house-card="${h.id}"
            class="tarot-card group text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0dba8] ${
              h.id === state.selectedHouseId ? 'active' : ''
            }"
            style="--card-aura: ${h.auraHex}; --card-aura-rgb: ${rgb};"
          >
            <span class="tarot-foil" aria-hidden="true"></span>
            <div class="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2.5 border transition-transform duration-300 group-hover:scale-105"
                 style="color: ${h.auraHex}; border-color: rgba(${rgb}, 0.52); background: radial-gradient(circle, rgba(${rgb}, 0.19), rgba(11, 17, 15, 0.76));">
              <div class="w-8 h-8">${h.emblem || ''}</div>
            </div>
            <h3 class="relative z-10 font-nouveau text-lg sm:text-xl font-semibold text-[#f0eadc] leading-tight">
              ${h.ru}
            </h3>
            <div class="relative z-10 text-[10px] uppercase tracking-[0.15em] text-[#a69f90] mt-0.5">
              ${h.en}
            </div>
            <div class="relative z-10 my-2 w-9 h-px" style="background: linear-gradient(90deg, transparent, ${h.auraHex}, transparent);"></div>
            <p class="relative z-10 lore-only text-[11px] text-[#a69f90] leading-snug mb-2.5 line-clamp-2">
              ${h.tagline || ''}
            </p>
            <span class="relative z-10 mt-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] border"
                  style="border-color: rgba(${rgb}, 0.45); background: rgba(${rgb}, 0.12); color: #f0eadc;">
              <span style="color: ${h.auraHex};">${courtIcon}</span>
              ${h.court} Двор
            </span>
          </button>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-house-card]').forEach((btn) => {
      btn.addEventListener('click', () => selectHouse(btn.getAttribute('data-house-card'), true));
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
        btn.style.setProperty('--my', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
      });
    });
  }

  function selectHouse(houseId, scrollToPanel = false) {
    const h = HOUSES.find((item) => item.id === houseId);
    if (!h) return;

    state.selectedHouseId = houseId;
    if (state.tableMode && state.houseDetailTab === 'lore') {
      state.houseDetailTab = 'powers';
    }

    document.querySelectorAll('[data-house-card]').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-house-card') === houseId);
    });

    const rgb = h.auraRgb || hexToRgbStr(h.auraHex);
    document.documentElement.style.setProperty('--aura-hex', h.auraHex);
    document.documentElement.style.setProperty('--aura-rgb', rgb);

    renderHouseSpotlight();

    if (scrollToPanel) {
      const panel = document.getElementById('house-spotlight');
      if (panel) {
        const rect = panel.getBoundingClientRect();
        if (rect.top < 60 || rect.top > window.innerHeight * 0.65) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }

  function renderHouseSpotlight() {
    const spot = document.getElementById('house-spotlight');
    if (!spot) return;
    const h = HOUSES.find((item) => item.id === state.selectedHouseId);
    if (!h) return;
    const rgb = h.auraRgb || hexToRgbStr(h.auraHex);
    const courtIcon = h.court === 'Благой' ? '☀' : '☽';

    const tabs = [
      { id: 'lore', label: 'Летопись и Изгнание' },
      { id: 'powers', label: 'Дар и Изъян' },
      { id: 'factions', label: `Ордена и Общества (${(h.factions || []).length})` },
      { id: 'members', label: `Знаменитые лица (${(h.notableMembers || []).length})` }
    ];

    let bodyHTML = '';

    if (state.houseDetailTab === 'lore') {
      const firstLore = (h.lore && h.lore[0]) || '';
      const restLore = (h.lore || []).slice(1);
      bodyHTML = `
        <div class="space-y-5">
          ${
            h.oath
              ? `<div class="rounded-xl border p-4 sm:p-5 space-y-1.5"
                      style="border-color: rgba(${rgb}, 0.42); background: linear-gradient(145deg, rgba(${rgb}, 0.11), rgba(11, 17, 15, 0.78));">
                   <div class="text-[10px] uppercase tracking-[0.22em]" style="color: ${h.auraHex};">✦ Священная Клятва Дома</div>
                   <blockquote class="font-nouveau italic text-lg sm:text-xl text-[#f0dba8]/95 leading-snug">
                     ${linkifyHTML(formatInlineMd(h.oath))}
                   </blockquote>
                 </div>`
              : ''
          }
          <div class="clearfix text-sm sm:text-[15.5px] text-[#f0eadc]/92 space-y-3.5 leading-relaxed">
            ${
              firstLore
                ? `<p><span class="drop-cap" aria-hidden="true">${firstLore.charAt(0)}</span>${linkifyHTML(
                    formatInlineMd(firstLore.slice(1))
                  )}</p>`
                : ''
            }
            ${restLore.map((p) => `<p>${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div class="rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/58 p-4 sm:p-5 space-y-2">
              <div class="text-[11px] uppercase tracking-[0.18em] text-[#d8b979]">Исход из Аркадии · Exile</div>
              <p class="text-xs sm:text-[13.8px] text-[#f0eadc]/88 leading-relaxed">${linkifyHTML(formatInlineMd(h.exile || ''))}</p>
            </div>
            <div class="rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/58 p-4 sm:p-5 space-y-2.5">
              <div class="text-[11px] uppercase tracking-[0.18em] text-[#d8b979]">Геральдическая справка</div>
              <p class="text-xs sm:text-[13.6px] text-[#f0eadc]/88 leading-relaxed">
                <strong class="text-[#f0dba8]">Произношение:</strong> ${h.pronunciation || h.en}
              </p>
              <p class="text-xs sm:text-[13.6px] text-[#f0eadc]/88 leading-relaxed">
                <strong class="text-[#f0dba8]">Прозвища при дворах:</strong> ${linkifyHTML(formatInlineMd(h.nicknames || ''))}
              </p>
              <p class="text-xs sm:text-[13.6px] text-[#f0eadc]/88 leading-relaxed">
                <strong class="text-[#f0dba8]">Судьба в летописи:</strong> ${linkifyHTML(formatInlineMd(h.wave || ''))}
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (state.houseDetailTab === 'powers') {
      bodyHTML = `
        <div class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="rounded-xl border p-4 sm:p-5 space-y-3.5"
                 style="border-color: rgba(${rgb}, 0.46); background: linear-gradient(160deg, rgba(${rgb}, 0.10), rgba(11, 17, 15, 0.78));">
              <div class="flex items-center justify-between border-b border-[#d8b979]/15 pb-2">
                <h4 class="font-nouveau text-xl sm:text-2xl font-semibold text-[#f0dba8]">Дар Дома</h4>
                <span class="text-[10px] uppercase tracking-[0.18em] text-[#a69f90]">House Boon</span>
              </div>
              <div class="space-y-2.5">
                <div class="text-sm font-semibold" style="color: ${h.auraHex};">✦ ${(h.boon && h.boon.name) || 'Дар Дома'}</div>
                ${((h.boon && h.boon.paragraphs) || [])
                  .map(
                    (p) =>
                      `<p class="text-xs sm:text-[13.8px] text-[#f0eadc]/92 leading-relaxed">${linkifyHTML(
                        formatInlineMd(p)
                      )}</p>`
                  )
                  .join('')}
              </div>
            </div>

            <div class="rounded-xl border border-[#a83b4a]/48 p-4 sm:p-5 flex flex-col justify-between gap-4"
                 style="background: linear-gradient(160deg, rgba(168, 59, 74, 0.11), rgba(11, 17, 15, 0.80));">
              <div class="space-y-2.5">
                <div class="flex items-center justify-between border-b border-[#a83b4a]/28 pb-2">
                  <h4 class="font-nouveau text-xl sm:text-2xl font-semibold text-[#e6989f]">Изъян Дома</h4>
                  <span class="text-[10px] uppercase tracking-[0.18em] text-[#a69f90]">House Flaw</span>
                </div>
                <div class="text-sm font-semibold text-[#e6989f]">◈ ${(h.flaw && h.flaw.name) || 'Изъян Дома'}</div>
                ${((h.flaw && h.flaw.paragraphs) || [])
                  .map(
                    (p) =>
                      `<p class="text-xs sm:text-[13.8px] text-[#f0eadc]/92 leading-relaxed">${linkifyHTML(
                        formatInlineMd(p)
                      )}</p>`
                  )
                  .join('')}
              </div>
              <div class="pt-3 border-t border-[#d8b979]/15 text-xs text-[#a69f90]">
                <strong class="text-[#d8b979]">Условие присяги:</strong> требует хотя бы <strong>1 точки</strong> Дополнения «${linkifyText('Титул')}» (от оруженосца и выше).
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (state.houseDetailTab === 'factions') {
      bodyHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${(h.factions || [])
            .map(
              (f) => `
            <div class="rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/60 p-4 space-y-1.5">
              <div class="flex flex-wrap items-baseline justify-between gap-1.5">
                <div class="font-nouveau text-xl font-semibold text-[#f0dba8]">${f.name}</div>
                <span class="text-[10px] uppercase tracking-wider text-[#a69f90]">${f.en || ''}</span>
              </div>
              <p class="text-xs sm:text-[13.6px] text-[#f0eadc]/88 leading-relaxed">${linkifyHTML(
                formatInlineMd(f.desc)
              )}</p>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    } else {
      bodyHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${(h.notableMembers || [])
            .map(
              (m) => `
            <div class="rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/58 p-4 space-y-1.5">
              <div class="text-sm font-semibold" style="color: ${h.auraHex};">✦ ${m.name}</div>
              <p class="text-xs sm:text-[13.5px] text-[#f0eadc]/88 leading-relaxed">${linkifyHTML(
                formatInlineMd(m.desc)
              )}</p>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    spot.innerHTML = `
      <div class="spotlight-anim relative z-10 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#d8b979]/20">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border"
                 style="color: ${h.auraHex}; border-color: rgba(${rgb}, 0.55); background: radial-gradient(circle, rgba(${rgb}, 0.22), rgba(11, 17, 15, 0.82));">
              <div class="w-8 h-8">${h.emblem || ''}</div>
            </div>
            <div>
              <div class="flex flex-wrap items-baseline gap-2.5">
                <h3 class="font-nouveau text-3xl sm:text-4xl font-semibold text-[#f0eadc] leading-none">${h.ru}</h3>
                <span class="text-xs uppercase tracking-[0.18em] text-[#a69f90]">${h.en}</span>
              </div>
              <p class="lore-only text-xs text-[#a69f90] mt-1">${h.tagline || ''}</p>
            </div>
          </div>

          <div class="inline-flex items-center gap-2 self-start sm:self-center px-3.5 py-1.5 rounded-full border text-xs"
               style="border-color: rgba(${rgb}, 0.50); background: rgba(${rgb}, 0.13); color: #f0eadc;">
            <span style="color: ${h.auraHex};">${courtIcon}</span>
            <strong style="color: ${h.auraHex};">${h.courtNote || `${h.court} Двор`}</strong>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5" role="tablist">
          ${tabs
            .map((t) => {
              const active = state.houseDetailTab === t.id;
              return `
                <button type="button" data-htab="${t.id}"
                  class="px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
                    active
                      ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
                      : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc] hover:border-[#d8b979]/55'
                  }">
                  ${t.label}
                </button>
              `;
            })
            .join('')}
        </div>

        <div>${bodyHTML}</div>
      </div>
    `;

    spot.querySelectorAll('[data-htab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.houseDetailTab = btn.getAttribute('data-htab');
        renderHouseSpotlight();
      });
    });
  }

  function renderHousesScrollArea() {
    const area = document.getElementById('houses-scroll-area');
    if (!area) return;
    area.innerHTML = HOUSES.map((h) => {
      const rgb = h.auraRgb || hexToRgbStr(h.auraHex);
      const courtIcon = h.court === 'Благой' ? '☀' : '☽';
      return `
        <article id="house-${h.id}" class="nouveau-panel p-6 sm:p-8 space-y-5 scroll-mt-24">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8b979]/20 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center border"
                   style="color:${h.auraHex}; border-color:rgba(${rgb},0.5); background:rgba(${rgb},0.14);">
                <div class="w-6 h-6">${h.emblem || ''}</div>
              </div>
              <div>
                <h3 class="font-nouveau text-2xl sm:text-3xl font-semibold text-[#f0eadc]">${h.ru} <span class="text-sm font-sans font-normal text-[#a69f90]">(${h.en})</span></h3>
                <div class="text-xs text-[#a69f90]">${h.nicknames || ''}</div>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-xs border" style="border-color:rgba(${rgb},0.45); color:${h.auraHex};">
              ${courtIcon} ${h.courtNote || `${h.court} Двор`} · ${h.wave || ''}
            </span>
          </div>
          <div class="lore-only space-y-3 text-sm leading-relaxed">
            <blockquote class="font-nouveau italic text-lg text-[#f0dba8] border-l-2 pl-3.5" style="border-color:${h.auraHex};">${linkifyHTML(formatInlineMd(h.oath))}</blockquote>
            ${(h.lore || []).map((p) => `<p>${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
            <div class="rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/50 p-3.5">
              <div class="text-xs font-semibold text-[#d8b979] mb-1">Исход из Аркадии</div>
              <p class="text-xs leading-relaxed">${linkifyHTML(formatInlineMd(h.exile || ''))}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-xl border border-[#d8b979]/30 bg-[#0b110f]/65 p-4 space-y-2">
              <h4 class="font-nouveau text-xl font-semibold text-[#f0dba8]">Дар · ${(h.boon && h.boon.name) || ''}</h4>
              ${((h.boon && h.boon.paragraphs) || []).map((p) => `<p class="text-xs leading-relaxed">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
            </div>
            <div class="rounded-xl border border-[#a83b4a]/40 bg-[#0b110f]/65 p-4 space-y-2">
              <h4 class="font-nouveau text-xl font-semibold text-[#e6989f]">Изъян · ${(h.flaw && h.flaw.name) || ''}</h4>
              ${((h.flaw && h.flaw.paragraphs) || []).map((p) => `<p class="text-xs leading-relaxed">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
            </div>
          </div>
          <div class="lore-only grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div class="rounded-xl border border-[#d8b979]/18 bg-[#0b110f]/45 p-4 space-y-2">
              <div class="text-xs font-semibold text-[#d8b979]">Ордена и Общества</div>
              ${(h.factions || [])
                .map((f) => `<p class="text-xs leading-relaxed"><strong class="text-[#f0dba8]">${f.name}:</strong> ${linkifyHTML(formatInlineMd(f.desc))}</p>`)
                .join('')}
            </div>
            <div class="rounded-xl border border-[#d8b979]/18 bg-[#0b110f]/45 p-4 space-y-2">
              <div class="text-xs font-semibold text-[#d8b979]">Знаменитые лица</div>
              ${(h.notableMembers || [])
                .map((m) => `<p class="text-xs leading-relaxed"><strong class="text-[#f0dba8]">${m.name}:</strong> ${linkifyHTML(formatInlineMd(m.desc))}</p>`)
                .join('')}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /* ------------------------------------------------------------------------
     3C. WIDGET: 28 LEGACIES MIRROR & SOUL PAIR SELECTOR
     ------------------------------------------------------------------------ */
  function initLegaciesWidget() {
    const mount = document.getElementById('legacies-widget-mount');
    if (!mount || !LEGACIES.length) return;

    const params = new URLSearchParams(window.location.search);
    const qLeg = params.get('legacy');
    if (qLeg) {
      const found = LEGACIES.find((l) => l.id === qLeg);
      if (found) {
        if (found.court === 'Благой') {
          state.selectedSeelieLegacyId = found.id;
          state.legacyLeadCourt = 'Благой';
        } else {
          state.selectedUnseelieLegacyId = found.id;
          state.legacyLeadCourt = 'Неблагой';
        }
      }
    }

    const seelieCount = LEGACIES.filter((l) => l.court === 'Благой').length;
    const unseelieCount = LEGACIES.filter((l) => l.court === 'Неблагой').length;

    mount.innerHTML = `
      <section id="legacies-mirror" class="space-y-6 my-8 scroll-mt-24">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979]">Двойственность души · Призвание и Запрет</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc] !mt-1 !mb-0 !border-0 !pb-0">
              Двадцать восемь Наследий
            </h2>
          </div>
          <div class="no-print inline-flex rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1 self-start md:self-auto">
            <button type="button" id="lview-pair" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ✦ Подбор пары
            </button>
            <button type="button" id="lview-scroll" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ☰ Книжный свиток
            </button>
          </div>
        </div>

        <div id="legacies-filter-bar" class="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] uppercase tracking-wider text-[#a69f90] mr-1">Наследие:</span>
            <button type="button" data-lcourt="all" class="leg-court-btn px-3 py-1 rounded-full text-xs border transition">Все (${LEGACIES.length})</button>
            <button type="button" data-lcourt="Благой" class="leg-court-btn px-3 py-1 rounded-full text-xs border transition">☀ Благие (${seelieCount})</button>
            <button type="button" data-lcourt="Неблагой" class="leg-court-btn px-3 py-1 rounded-full text-xs border transition">☽ Неблагие (${unseelieCount})</button>
          </div>
          <input type="search" id="leg-search-input" placeholder="Найти Наследие (Паладин, Шут, Мудрец)..."
            class="w-full sm:w-64 rounded-full border border-[#d8b979]/30 bg-[#0b110f]/75 px-3.5 py-1.5 text-xs text-[#f0eadc] placeholder-[#7b7669] focus:outline-none focus:border-[#f0dba8]" />
        </div>

        <div id="legacies-interactive-area" class="space-y-6">
          <div id="legacies-pair-spotlight" class="nouveau-panel p-5 sm:p-7 scroll-mt-24" aria-live="polite"></div>
          <div id="legacies-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"></div>
        </div>

        <div id="legacies-scroll-area" class="hidden space-y-6"></div>
        <div id="print-legacies-container" class="print-only space-y-3"></div>
      </section>
    `;

    document.getElementById('lview-pair').addEventListener('click', () => {
      state.legacyViewMode = 'pair';
      syncLegacyViewMode();
    });
    document.getElementById('lview-scroll').addEventListener('click', () => {
      state.legacyViewMode = 'scroll';
      syncLegacyViewMode();
    });

    mount.querySelectorAll('.leg-court-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.legacyCourtFilter = btn.getAttribute('data-lcourt');
        renderLegaciesGrid();
      });
    });

    const legInp = document.getElementById('leg-search-input');
    if (legInp) {
      legInp.addEventListener('input', (e) => {
        state.legacyQuery = e.target.value.trim().toLowerCase();
        renderLegaciesGrid();
      });
    }

    renderLegaciesPairSpotlight();
    renderLegaciesGrid();
    renderLegaciesScrollArea();
    syncLegacyViewMode();
  }

  function syncLegacyViewMode() {
    const pairArea = document.getElementById('legacies-interactive-area');
    const scrollArea = document.getElementById('legacies-scroll-area');
    const filterBar = document.getElementById('legacies-filter-bar');
    const bPair = document.getElementById('lview-pair');
    const bScr = document.getElementById('lview-scroll');
    if (!pairArea || !scrollArea) return;

    const isPair = state.legacyViewMode === 'pair';
    pairArea.classList.toggle('hidden', !isPair);
    filterBar.classList.toggle('hidden', !isPair);
    scrollArea.classList.toggle('hidden', isPair);

    bPair.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      isPair ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
    bScr.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      !isPair ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
  }

  function renderLegaciesGrid() {
    const grid = document.getElementById('legacies-grid');
    if (!grid) return;

    document.querySelectorAll('.leg-court-btn').forEach((btn) => {
      const act = btn.getAttribute('data-lcourt') === state.legacyCourtFilter;
      btn.className = `leg-court-btn px-3 py-1 rounded-full text-xs border transition ${
        act
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });

    const filtered = LEGACIES.filter((l) => {
      if (state.legacyCourtFilter !== 'all' && l.court !== state.legacyCourtFilter) return false;
      if (!state.legacyQuery) return true;
      return `${l.ru} ${l.en} ${l.tagline} ${l.desc} ${l.quest} ${l.ban}`.toLowerCase().includes(state.legacyQuery);
    });

    if (!filtered.length) {
      grid.innerHTML = `<div class="col-span-full text-center py-8 text-xs text-[#a69f90]">Ни одно Наследие не соответствует запросу.</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((l) => {
        const rgb = l.auraRgb || hexToRgbStr(l.auraHex);
        const isSelected = l.id === state.selectedSeelieLegacyId || l.id === state.selectedUnseelieLegacyId;
        const courtIcon = l.court === 'Благой' ? '☀' : '☽';
        return `
          <button
            type="button"
            data-leg-card="${l.id}"
            class="tarot-card group text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0dba8] ${
              isSelected ? 'active' : ''
            }"
            style="--card-aura: ${l.auraHex}; --card-aura-rgb: ${rgb};"
          >
            <span class="tarot-foil" aria-hidden="true"></span>
            <div class="relative z-10 w-11 h-11 rounded-full flex items-center justify-center mb-2 border transition-transform duration-300 group-hover:scale-105"
                 style="color: ${l.auraHex}; border-color: rgba(${rgb}, 0.52); background: radial-gradient(circle, rgba(${rgb}, 0.19), rgba(11, 17, 15, 0.76));">
              <div class="w-7 h-7">${l.emblem || ''}</div>
            </div>
            <h3 class="relative z-10 font-nouveau text-lg font-semibold text-[#f0eadc] leading-tight">${l.ru}</h3>
            <div class="relative z-10 text-[10px] uppercase tracking-[0.14em] text-[#a69f90] mt-0.5">${l.en}</div>
            <div class="relative z-10 my-1.5 w-8 h-px" style="background: linear-gradient(90deg, transparent, ${l.auraHex}, transparent);"></div>
            <p class="relative z-10 lore-only text-[11px] text-[#a69f90] leading-snug mb-2 line-clamp-2">${l.tagline}</p>
            <span class="relative z-10 mt-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] border"
                  style="border-color: rgba(${rgb}, 0.45); background: rgba(${rgb}, 0.12); color: #f0eadc;">
              <span style="color: ${l.auraHex};">${courtIcon}</span>
              ${isSelected ? 'Выбрано в пару' : `${l.court}`}
            </span>
          </button>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-leg-card]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const l = LEGACIES.find((x) => x.id === btn.getAttribute('data-leg-card'));
        if (!l) return;
        if (l.court === 'Благой') state.selectedSeelieLegacyId = l.id;
        else state.selectedUnseelieLegacyId = l.id;

        const rgb = l.auraRgb || hexToRgbStr(l.auraHex);
        document.documentElement.style.setProperty('--aura-hex', l.auraHex);
        document.documentElement.style.setProperty('--aura-rgb', rgb);

        renderLegaciesGrid();
        renderLegaciesPairSpotlight();
        const panel = document.getElementById('legacies-pair-spotlight');
        if (panel) {
          const rect = panel.getBoundingClientRect();
          if (rect.top < 55 || rect.top > window.innerHeight * 0.65) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      });
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
        btn.style.setProperty('--my', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
      });
    });
  }

  function renderLegaciesPairSpotlight() {
    const spot = document.getElementById('legacies-pair-spotlight');
    if (!spot) return;
    const seelie = LEGACIES.find((l) => l.id === state.selectedSeelieLegacyId) || LEGACIES.find((l) => l.court === 'Благой');
    const unseelie = LEGACIES.find((l) => l.id === state.selectedUnseelieLegacyId) || LEGACIES.find((l) => l.court === 'Неблагой');
    if (!seelie || !unseelie) return;

    const buildHalfCard = (l) => {
      const isPrimary = l.court === state.legacyLeadCourt;
      const rgb = l.auraRgb || hexToRgbStr(l.auraHex);
      const badgeText = isPrimary ? '✦ Ведущее Наследие' : '◇ Теневое Наследие';
      return `
        <div class="rounded-xl border p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition"
             style="border-color: rgba(${rgb}, ${isPrimary ? '0.68' : '0.28'}); background: linear-gradient(160deg, rgba(${rgb}, ${
        isPrimary ? '0.14' : '0.05'
      }), rgba(11, 17, 15, 0.82));">
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-2 border-b border-[#d8b979]/15 pb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                     style="color: ${l.auraHex}; border-color: rgba(${rgb}, 0.55); background: rgba(${rgb}, 0.16);">
                  <div class="w-6 h-6">${l.emblem || ''}</div>
                </div>
                <div>
                  <h4 class="font-nouveau text-2xl font-semibold text-[#f0eadc] leading-none">${l.ru}</h4>
                  <div class="text-[11px] uppercase tracking-[0.14em] text-[#a69f90] mt-0.5">${l.en} · ${l.court} Двор</div>
                </div>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-medium border shrink-0"
                    style="border-color: rgba(${rgb}, ${isPrimary ? '0.65' : '0.30'}); color: ${
        isPrimary ? '#f0dba8' : '#a69f90'
      }; background: rgba(${rgb}, ${isPrimary ? '0.18' : '0.06'});">
                ${badgeText}
              </span>
            </div>

            <p class="lore-only text-xs sm:text-[13.8px] text-[#f0eadc]/90 leading-relaxed">${linkifyHTML(formatInlineMd(l.desc))}</p>
          </div>

          <div class="space-y-2 pt-2 border-t border-[#d8b979]/15 text-xs sm:text-[13px]">
            <div class="rounded-lg border border-[#d8b979]/25 bg-[#0b110f]/65 p-2.5">
              <span class="font-semibold text-[#f0dba8]">✦ ${linkifyText('Призвание')} (+1 ${linkifyText('Сила Воли')}):</span>
              <span class="text-[#f0eadc]/92"> ${linkifyHTML(formatInlineMd(l.quest))}</span>
            </div>
            <div class="rounded-lg border border-[#a83b4a]/35 bg-[#0b110f]/65 p-2.5">
              <span class="font-semibold text-[#e6989f]">◈ ${linkifyText('Запрет')} (−1 ${linkifyText('Сила Воли')}):</span>
              <span class="text-[#f0eadc]/92"> ${linkifyHTML(formatInlineMd(l.ban))}</span>
            </div>
          </div>
        </div>
      `;
    };

    spot.innerHTML = `
      <div class="spotlight-anim relative z-10 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d8b979]/20 pb-3.5">
          <div>
            <div class="text-[11px] uppercase tracking-[0.2em] text-[#d8b979]">Зеркальная пара души</div>
            <h3 class="font-nouveau text-2xl sm:text-3xl font-semibold text-[#f0eadc] !mt-0.5 !mb-0">
              ${seelie.ru} & ${unseelie.ru}
            </h3>
            <p class="text-xs text-[#a69f90] mt-0.5">Нажмите на любую карту ниже, чтобы сменить Благое или Неблагое Наследие пары.</p>
          </div>
          <div class="no-print inline-flex rounded-full border border-[#d8b979]/35 bg-[#0b110f]/80 p-1 shrink-0 self-start sm:self-center">
            <button type="button" data-lead-court="Благой" class="px-3 py-1 rounded-full text-xs font-medium transition ${
              state.legacyLeadCourt === 'Благой' ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
            }">☀ Ведёт Благой</button>
            <button type="button" data-lead-court="Неблагой" class="px-3 py-1 rounded-full text-xs font-medium transition ${
              state.legacyLeadCourt === 'Неблагой' ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
            }">☽ Ведёт Неблагой</button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          ${buildHalfCard(seelie)}
          ${buildHalfCard(unseelie)}
        </div>
      </div>
    `;

    spot.querySelectorAll('[data-lead-court]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.legacyLeadCourt = btn.getAttribute('data-lead-court');
        renderLegaciesPairSpotlight();
      });
    });
  }

  function renderLegaciesScrollArea() {
    const area = document.getElementById('legacies-scroll-area');
    if (!area) return;
    const renderGroup = (title, items) => `
      <div class="space-y-4">
        <h3 class="font-nouveau text-2xl font-semibold text-[#f0dba8] border-b border-[#d8b979]/20 pb-2">${title}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${items
            .map((l) => {
              const rgb = l.auraRgb || hexToRgbStr(l.auraHex);
              return `
                <article id="legacy-${l.id}" class="nouveau-panel p-5 space-y-2.5 scroll-mt-24">
                  <div class="flex items-center gap-3 border-b border-[#d8b979]/15 pb-2.5">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center border shrink-0"
                         style="color:${l.auraHex}; border-color:rgba(${rgb},0.5); background:rgba(${rgb},0.14);">
                      <div class="w-5 h-5">${l.emblem || ''}</div>
                    </div>
                    <div>
                      <h4 class="font-nouveau text-xl font-semibold text-[#f0eadc] !mt-0 !mb-0">${l.ru} <span class="text-xs font-sans font-normal text-[#a69f90]">(${l.en})</span></h4>
                    </div>
                  </div>
                  <p class="lore-only text-xs sm:text-[13.5px] leading-relaxed">${linkifyHTML(formatInlineMd(l.desc))}</p>
                  <div class="space-y-1.5 text-xs pt-1">
                    <p><strong class="text-[#f0dba8]">✦ Призвание:</strong> ${linkifyHTML(formatInlineMd(l.quest))}</p>
                    <p><strong class="text-[#e6989f]">◈ Запрет:</strong> ${linkifyHTML(formatInlineMd(l.ban))}</p>
                  </div>
                </article>`;
            })
            .join('')}
        </div>
      </div>
    `;
    area.innerHTML =
      renderGroup('☀ Благие Наследия (Seelie Legacies)', LEGACIES.filter((l) => l.court === 'Благой')) +
      renderGroup('☽ Неблагие Наследия (Unseelie Legacies)', LEGACIES.filter((l) => l.court === 'Неблагой'));
  }

  /* ------------------------------------------------------------------------
     3D. WIDGET: 14 THRESHOLDS COMPASS (MUSING, RAVAGING & MIRROR PAIRS)
     ------------------------------------------------------------------------ */
  function initThresholdsWidget() {
    const mount = document.getElementById('thresholds-widget-mount');
    if (!mount || !THRESHOLDS.length) return;

    const params = new URLSearchParams(window.location.search);
    const qThr = params.get('threshold');
    if (qThr) {
      const found = THRESHOLDS.find((t) => t.id === qThr);
      if (found) {
        state.selectedThresholdId = found.id;
        state.thresholdMode = found.type;
      }
    }

    mount.innerHTML = `
      <section id="thresholds-compass" class="space-y-6 my-8 scroll-mt-24">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979]">Эпифания · Семь зеркальных пар</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc] !mt-1 !mb-0 !border-0 !pb-0">
              Четырнадцать Порогов Гламура
            </h2>
          </div>
          <div class="no-print flex flex-wrap gap-1 rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1 self-start lg:self-auto">
            <button type="button" data-tmode="musing" class="thr-mode-btn px-3 py-1.5 rounded-full text-xs font-medium transition">
              ☀ Вдохновение (7)
            </button>
            <button type="button" data-tmode="ravaging" class="thr-mode-btn px-3 py-1.5 rounded-full text-xs font-medium transition">
              ☽ Опустошение (7)
            </button>
            <button type="button" data-tmode="pairs" class="thr-mode-btn px-3 py-1.5 rounded-full text-xs font-medium transition">
              ⇄ Зеркальные пары (7)
            </button>
          </div>
        </div>

        <div id="thresholds-interactive-area" class="space-y-6"></div>
        <div id="print-thresholds-container" class="print-only space-y-3"></div>
      </section>
    `;

    mount.querySelectorAll('.thr-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.thresholdMode = btn.getAttribute('data-tmode');
        if (state.thresholdMode === 'musing' || state.thresholdMode === 'ravaging') {
          const cur = THRESHOLDS.find((t) => t.id === state.selectedThresholdId);
          if (!cur || cur.type !== state.thresholdMode) {
            const firstMatch = THRESHOLDS.find((t) => t.type === state.thresholdMode);
            if (firstMatch) state.selectedThresholdId = firstMatch.id;
          }
        }
        renderThresholdsUI();
      });
    });

    renderThresholdsUI();
  }

  function renderThresholdsUI() {
    const area = document.getElementById('thresholds-interactive-area');
    if (!area) return;

    document.querySelectorAll('.thr-mode-btn').forEach((btn) => {
      const act = btn.getAttribute('data-tmode') === state.thresholdMode;
      btn.className = `thr-mode-btn px-3 py-1.5 rounded-full text-xs font-medium transition ${
        act ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });

    if (state.thresholdMode === 'pairs') {
      const pairs = [];
      for (let idx = 1; idx <= 7; idx++) {
        const m = THRESHOLDS.find((t) => t.pairIndex === idx && t.type === 'musing');
        const r = THRESHOLDS.find((t) => t.pairIndex === idx && t.type === 'ravaging');
        if (m && r) pairs.push([m, r]);
      }

      area.innerHTML = `
        <div class="space-y-4">
          ${pairs
            .map(
              ([m, r]) => `
            <div class="nouveau-panel p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="rounded-xl border p-4 space-y-2" style="border-color:rgba(${m.auraRgb},0.4); background:rgba(${m.auraRgb},0.07);">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center border shrink-0" style="color:${m.auraHex}; border-color:rgba(${m.auraRgb},0.5);">
                    <div class="w-5 h-5">${m.emblem || ''}</div>
                  </div>
                  <div>
                    <div class="font-nouveau text-xl font-semibold text-[#f0dba8]">☀ ${m.ru}</div>
                    <div class="text-[10px] uppercase tracking-wider text-[#a69f90]">${m.en} · Вдохновение</div>
                  </div>
                </div>
                <p class="text-xs sm:text-[13.5px] text-[#f0eadc]/90 leading-relaxed">${linkifyHTML(formatInlineMd(m.desc))}</p>
                <p class="lore-only text-[11.5px] text-[#a69f90] italic">${linkifyHTML(formatInlineMd(m.sceneHint))}</p>
              </div>
              <div class="rounded-xl border p-4 space-y-2" style="border-color:rgba(${r.auraRgb},0.42); background:rgba(${r.auraRgb},0.07);">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center border shrink-0" style="color:${r.auraHex}; border-color:rgba(${r.auraRgb},0.5);">
                    <div class="w-5 h-5">${r.emblem || ''}</div>
                  </div>
                  <div>
                    <div class="font-nouveau text-xl font-semibold text-[#e6989f]">☽ ${r.ru}</div>
                    <div class="text-[10px] uppercase tracking-wider text-[#a69f90]">${r.en} · Опустошение</div>
                  </div>
                </div>
                <p class="text-xs sm:text-[13.5px] text-[#f0eadc]/90 leading-relaxed">${linkifyHTML(formatInlineMd(r.desc))}</p>
                <p class="lore-only text-[11.5px] text-[#a69f90] italic">${linkifyHTML(formatInlineMd(r.sceneHint))}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
      return;
    }

    const list = THRESHOLDS.filter((t) => t.type === state.thresholdMode);
    const activeT = list.find((t) => t.id === state.selectedThresholdId) || list[0];
    if (!activeT) return;
    state.selectedThresholdId = activeT.id;
    const mirror = THRESHOLDS.find((t) => t.id === activeT.mirrorId);
    const rgb = activeT.auraRgb || hexToRgbStr(activeT.auraHex);
    const tIcon = activeT.type === 'musing' ? '☀' : '☽';

    area.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        ${list
          .map((t) => {
            const trgb = t.auraRgb || hexToRgbStr(t.auraHex);
            const act = t.id === activeT.id;
            return `
              <button type="button" data-thr-card="${t.id}"
                class="tarot-card group text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0dba8] ${act ? 'active' : ''}"
                style="--card-aura: ${t.auraHex}; --card-aura-rgb: ${trgb}; padding: 1rem 0.65rem 0.9rem;">
                <span class="tarot-foil" aria-hidden="true"></span>
                <div class="relative z-10 w-10 h-10 rounded-full flex items-center justify-center mb-2 border"
                     style="color:${t.auraHex}; border-color:rgba(${trgb},0.5); background:rgba(${trgb},0.16);">
                  <div class="w-6 h-6">${t.emblem || ''}</div>
                </div>
                <div class="relative z-10 font-nouveau text-base font-semibold text-[#f0eadc] leading-tight">${t.ru}</div>
                <div class="relative z-10 text-[9.5px] uppercase tracking-wider text-[#a69f90] mt-0.5">${t.en}</div>
              </button>
            `;
          })
          .join('')}
      </div>

      <div id="threshold-spotlight" class="nouveau-panel p-5 sm:p-7 space-y-4">
        <div class="spotlight-anim relative z-10 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d8b979]/20 pb-3.5">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border"
                   style="color:${activeT.auraHex}; border-color:rgba(${rgb},0.55); background:rgba(${rgb},0.18);">
                <div class="w-7 h-7">${activeT.emblem || ''}</div>
              </div>
              <div>
                <h3 class="font-nouveau text-2xl sm:text-3xl font-semibold text-[#f0eadc] leading-none">${tIcon} ${activeT.ru}</h3>
                <div class="text-xs uppercase tracking-[0.16em] text-[#a69f90] mt-1">${activeT.en} · ${activeT.typeRu}</div>
              </div>
            </div>
            ${
              mirror
                ? `<button type="button" id="btn-flip-threshold"
                     class="px-3.5 py-1.5 rounded-full text-xs border border-[#d8b979]/35 bg-[#0b110f]/75 text-[#f0dba8] hover:border-[#f0dba8] transition self-start sm:self-center">
                     ⇄ Зеркало: ${mirror.ru}
                   </button>`
                : ''
            }
          </div>

          <p class="text-sm sm:text-[15px] text-[#f0eadc]/92 leading-relaxed">${linkifyHTML(formatInlineMd(activeT.desc))}</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-[13px]">
            <div class="lore-only rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/60 p-4 space-y-1">
              <div class="text-[10.5px] uppercase tracking-[0.18em] text-[#d8b979]">Игровая сцена</div>
              <p class="text-[#f0eadc]/88 leading-relaxed">${linkifyHTML(formatInlineMd(activeT.sceneHint))}</p>
            </div>
            <div class="rounded-xl border p-4 space-y-1" style="border-color:rgba(${rgb},0.42); background:rgba(${rgb},0.08);">
              <div class="text-[10.5px] uppercase tracking-[0.18em]" style="color:${activeT.auraHex};">✦ Сила Порога в Эпифании</div>
              <p class="text-[#f0eadc]/90 leading-relaxed">
                ${
                  activeT.type === 'musing'
                    ? linkifyText('При 5 и более успехах в завершающем броске Вдохновения (Манипулирование + Способность, сл. 6) через свой Порог Вдохновения подменыш получает +1 постоянную точку Гламура.')
                    : linkifyText('Проведя Опустошение через свой Порог по системе Вдохновения (изучив жертву по Восприятие + Кеннинг сл. 8 и набрав 5+ успехов на финальном броске сл. 6), подменыш получает +1 постоянную точку Гламура.')
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    area.querySelectorAll('[data-thr-card]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedThresholdId = btn.getAttribute('data-thr-card');
        renderThresholdsUI();
      });
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
        btn.style.setProperty('--my', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
      });
    });

    const flipBtn = document.getElementById('btn-flip-threshold');
    if (flipBtn && mirror) {
      flipBtn.addEventListener('click', () => {
        state.selectedThresholdId = mirror.id;
        state.thresholdMode = mirror.type;
        renderThresholdsUI();
      });
    }
  }

  /* ------------------------------------------------------------------------
     4. WIDGETS: STEP 4 TEMPERS & STEP 3 CANTRIP EQUATION
     ------------------------------------------------------------------------ */
  const CANTRIP_EXAMPLES = {
    boggan: {
      title: 'Прикосновение Боггана',
      kith: 'Богган · Сродство: Актёр',
      art: 'Искусство: Весна (исцеление и уют)',
      realm: 'Владение: Актёр (усталый гость)',
      bunk: 'Уловка (Бунк): Незаметно подложить тёплую булочку на край стола и прошептать старую пословицу.',
      result:
        'Поскольку Владение совпадает со Сродством Боггана (Актёр), сложность броска Кантрипа снижается на −1! А при Высвобождении зал наполнится ароматом свежего хлеба и пряного яблочного сидра.'
    },
    selkie: {
      title: 'Зов Шелки',
      kith: 'Шелки · Сродство: Природа',
      art: 'Искусство: Первозданность / Странствие',
      realm: 'Владение: Природа (морская волна)',
      bunk: 'Уловка (Бунк): Коснуться солёной воды и напеть мотив старинной колыбельной моряков.',
      result:
        'Владение Природа совпадает со Сродством Шелки — сложность броска Кантрипа снижается на −1 (пока при ней её тюленья шкура). При Высвобождении на полу останутся лужицы солёной морской воды.'
    },
    redcap: {
      title: 'Гнев Красной Шапки',
      kith: 'Красная Шапка · Сродство: Природа',
      art: 'Искусство: Осень (ужас и ржавчина)',
      realm: 'Владение: Природа (ночной холод переулка)',
      bunk: 'Уловка (Бунк): С хрустом разгрызть стеклянную пробку, глядя жертве прямо в глаза.',
      result:
        'Сродство к Владению Природа снижает сложность Кантрипа на −1, а дерзкий Бунк дополнительно облегчает бросок, помогая пробить Банальность цели и влить живой Гламур в сцену.'
    }
  };

  function initTempersWidget() {
    const mount = document.getElementById('tempers-widget-mount');
    if (!mount) return;
    mount.innerHTML = `
      <div class="nouveau-panel p-5 sm:p-7 my-6 space-y-5">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <span class="text-[11px] uppercase tracking-[0.2em] text-[#d8b979]">Шаг Четвёртый · Гармония Темпераментов</span>
            <h4 class="font-nouveau text-2xl sm:text-3xl font-semibold text-[#f0eadc] !mt-0.5 !mb-0">Баланс души Подменыша</h4>
            <p class="lore-only text-xs text-[#a69f90] mt-1">
              Стартовые запасы души зависят от избранной Стадии и наследия Благородного Дома.
            </p>
          </div>
          <div class="no-print inline-grid grid-cols-3 p-1 rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 w-full md:w-auto">
            <button type="button" data-seem="childling" class="seem-btn px-3.5 py-1.5 rounded-full text-xs font-medium transition">Младенец</button>
            <button type="button" data-seem="wilder" class="seem-btn px-3.5 py-1.5 rounded-full text-xs font-medium transition">Дикарь</button>
            <button type="button" data-seem="grump" class="seem-btn px-3.5 py-1.5 rounded-full text-xs font-medium transition">Ворчун</button>
          </div>
        </div>

        <div class="no-print flex flex-wrap items-center justify-between gap-3 text-xs">
          <div id="wilder-subchoice" class="flex flex-wrap items-center gap-2">
            <span class="text-[#a69f90]">Бонус <strong class="text-[#f0dba8]">Дикаря</strong>:</span>
            <button type="button" data-wopt="glamour" class="wopt-btn px-3 py-1 rounded-full border transition">+1 Гламур</button>
            <button type="button" data-wopt="willpower" class="wopt-btn px-3 py-1 rounded-full border transition">+1 Сила Воли</button>
          </div>
          <label class="inline-flex items-center gap-2 cursor-pointer text-[#a69f90] hover:text-[#f0eadc] select-none ml-auto">
            <input type="checkbox" id="chk-house-liam" class="accent-[#d8b979] rounded" />
            <span>Дом Лиам (+1 к Банальности)</span>
          </label>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="mech-card rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-4 space-y-3">
            <div class="flex items-baseline justify-between gap-2">
              <div>
                <div class="font-nouveau text-xl font-semibold text-[#f0eadc]">Сила Воли</div>
                <div class="text-[11px] text-[#a69f90]">Willpower · база 4</div>
              </div>
              <div class="flex items-center gap-1.5">
                <span id="badge-wp" class="hidden text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#f0dba8]/65 bg-[#d8b979]/20 text-[#f0dba8]">+1</span>
                <span id="num-wp" class="font-nouveau text-2xl font-bold text-[#f0dba8]">4</span>
              </div>
            </div>
            <div id="dots-wp" class="flex items-center gap-1.5 flex-wrap"></div>
          </div>

          <div class="mech-card rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/55 p-4 space-y-3">
            <div class="flex items-baseline justify-between gap-2">
              <div>
                <div class="font-nouveau text-xl font-semibold text-[#f0dba8]">${linkifyText('Гламур')}</div>
                <div class="text-[11px] text-[#a69f90]">Glamour · база 4</div>
              </div>
              <div class="flex items-center gap-1.5">
                <span id="badge-gl" class="hidden text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#f0dba8]/65 bg-[#d8b979]/20 text-[#f0dba8]">+1</span>
                <span id="num-gl" class="font-nouveau text-2xl font-bold text-[#f0dba8]">5</span>
              </div>
            </div>
            <div id="dots-gl" class="flex items-center gap-1.5 flex-wrap"></div>
          </div>

          <div class="mech-card rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/55 p-4 space-y-3">
            <div class="flex items-baseline justify-between gap-2">
              <div>
                <div class="font-nouveau text-xl font-semibold text-[#f0eadc]">${linkifyText('Банальность')}</div>
                <div class="text-[11px] text-[#a69f90]">Banality · база 3</div>
              </div>
              <span id="num-bn" class="font-nouveau text-2xl font-bold text-[#a69f90]">3</span>
            </div>
            <div id="dots-bn" class="flex items-center gap-1.5 flex-wrap"></div>
          </div>
        </div>
        <p id="seeming-summary" class="text-xs text-[#a69f90] text-center"></p>
      </div>
    `;

    mount.querySelectorAll('.seem-btn').forEach((b) =>
      b.addEventListener('click', () => {
        state.seeming = b.getAttribute('data-seem');
        updateTempersUI();
      })
    );
    mount.querySelectorAll('.wopt-btn').forEach((b) =>
      b.addEventListener('click', () => {
        state.wilderBonus = b.getAttribute('data-wopt');
        updateTempersUI();
      })
    );
    const chk = document.getElementById('chk-house-liam');
    if (chk) {
      chk.addEventListener('change', () => {
        state.houseLiam = chk.checked;
        updateTempersUI();
      });
    }
    updateTempersUI();
  }

  function updateTempersUI() {
    if (!document.getElementById('num-wp')) return;
    let wp = 4,
      gl = 4,
      bn = state.houseLiam ? 4 : 3;
    let wpBonus = false,
      glBonus = false;
    let summary = '';

    if (state.seeming === 'childling') {
      gl = 5;
      glBonus = true;
      summary = 'Младенец (Childling): восторг перед чудесами дарует +1 к стартовому Гламуру (5).';
    } else if (state.seeming === 'wilder') {
      if (state.wilderBonus === 'glamour') {
        gl = 5;
        glBonus = true;
        summary = 'Дикарь (Wilder): неукротимая страсть направлена в +1 к стартовому Гламуру (5).';
      } else {
        wp = 5;
        wpBonus = true;
        summary = 'Дикарь (Wilder): мятежная решимость направлена в +1 к стартовой Силе Воли (5).';
      }
    } else {
      wp = 5;
      wpBonus = true;
      summary = 'Ворчун (Grump): житейская выдержка дарует +1 к стартовой Силе Воли (5).';
    }

    document.querySelectorAll('.seem-btn').forEach((btn) => {
      const act = btn.getAttribute('data-seem') === state.seeming;
      btn.className = `seem-btn px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
        act ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });
    const sub = document.getElementById('wilder-subchoice');
    if (sub) sub.style.visibility = state.seeming === 'wilder' ? 'visible' : 'hidden';

    document.querySelectorAll('.wopt-btn').forEach((btn) => {
      const act = btn.getAttribute('data-wopt') === state.wilderBonus;
      btn.className = `wopt-btn px-3 py-1 rounded-full border text-xs font-medium transition ${
        act
          ? 'border-[#f0dba8] bg-[#d8b979]/22 text-[#f0dba8]'
          : 'border-[#d8b979]/30 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });

    const makeDots = (val, hasBonus, extraCls = '') =>
      Array.from({ length: 10 }, (_, i) => {
        const isFilled = i < val;
        const isBonusDot = hasBonus && i === val - 1;
        return `<span class="wod-dot ${extraCls} ${isFilled ? 'filled' : ''} ${isBonusDot ? 'bonus' : ''}"></span>`;
      }).join('');

    document.getElementById('num-wp').textContent = wp;
    document.getElementById('num-gl').textContent = gl;
    document.getElementById('num-bn').textContent = bn;
    document.getElementById('badge-wp').classList.toggle('hidden', !wpBonus);
    document.getElementById('badge-gl').classList.toggle('hidden', !glBonus);
    document.getElementById('dots-wp').innerHTML = makeDots(wp, wpBonus);
    document.getElementById('dots-gl').innerHTML = makeDots(gl, glBonus);
    document.getElementById('dots-bn').innerHTML = makeDots(bn, state.houseLiam, 'banality');
    document.getElementById('seeming-summary').innerHTML = linkifyText(summary);
  }

  function initCantripWidget() {
    const mount = document.getElementById('cantrip-widget-mount');
    if (!mount) return;
    mount.innerHTML = `
      <div class="nouveau-panel p-5 sm:p-7 my-6 space-y-5">
        <div class="text-center space-y-1">
          <span class="text-[11px] uppercase tracking-[0.22em] text-[#d8b979]">Плетение чар · Формула Кантрипа</span>
          <h4 class="font-nouveau text-2xl sm:text-3xl font-semibold text-[#f0eadc] !mt-0.5 !mb-0">Витражное уравнение магии</h4>
        </div>
        <div class="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 text-center">
          <div class="px-4 py-2.5 rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/65 min-w-[144px]">
            <div class="font-nouveau text-lg font-semibold text-[#f0dba8]">${linkifyText('Искусства')}</div>
            <div class="text-[11px] text-[#a69f90]">что творит магия · 3 точки</div>
          </div>
          <span class="font-nouveau text-2xl text-[#d8b979] leading-none">+</span>
          <div class="px-4 py-2.5 rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/65 min-w-[144px]">
            <div class="font-nouveau text-lg font-semibold text-[#f0dba8]">${linkifyText('Владения')}</div>
            <div class="text-[11px] text-[#a69f90]">на кого/что · 5 точек</div>
          </div>
          <span class="font-nouveau text-2xl text-[#d8b979] leading-none">+</span>
          <div class="px-4 py-2.5 rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/65 min-w-[148px]">
            <div class="font-nouveau text-lg font-semibold text-[#f0dba8]">${linkifyText('Уловка')} / ${linkifyText('Бунк')}</div>
            <div class="text-[11px] text-[#a69f90]">снижает сл. от −1 до −5</div>
          </div>
          <span class="font-nouveau text-2xl text-[#d8b979] leading-none">=</span>
          <div class="px-5 py-2.5 rounded-xl border border-[#f0dba8]/70 min-w-[152px]"
               style="background: linear-gradient(145deg, rgba(216, 185, 121, 0.20), rgba(11, 17, 15, 0.86));">
            <div class="font-nouveau text-xl font-bold text-[#f0dba8]">✦ ${linkifyText('Кантрип')}</div>
            <div class="text-[11px] text-[#f0eadc]/82">Сродство Кита: −1 сл.</div>
          </div>
        </div>
        <div class="no-print flex flex-wrap items-center justify-center gap-2 pt-1">
          <span class="text-[11px] uppercase tracking-wider text-[#a69f90] mr-1">Примеры:</span>
          <button type="button" data-cex="boggan" class="cex-btn px-3 py-1 rounded-full text-xs border transition">Прикосновение Боггана</button>
          <button type="button" data-cex="selkie" class="cex-btn px-3 py-1 rounded-full text-xs border transition">Зов Шелки</button>
          <button type="button" data-cex="redcap" class="cex-btn px-3 py-1 rounded-full text-xs border transition">Гнев Красной Шапки</button>
        </div>
        <div id="cantrip-example-box" class="mech-card rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/58 p-4 text-xs sm:text-sm"></div>
      </div>
    `;

    mount.querySelectorAll('.cex-btn').forEach((b) =>
      b.addEventListener('click', () => {
        state.cantripExample = b.getAttribute('data-cex');
        updateCantripExample();
      })
    );
    updateCantripExample();
  }

  function updateCantripExample() {
    const box = document.getElementById('cantrip-example-box');
    if (!box) return;
    const ex = CANTRIP_EXAMPLES[state.cantripExample];
    document.querySelectorAll('.cex-btn').forEach((b) => {
      const act = b.getAttribute('data-cex') === state.cantripExample;
      b.className = `cex-btn px-3 py-1 rounded-full text-xs border transition ${
        act
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/28 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });
    box.innerHTML = `
      <div class="spotlight-anim space-y-2.5">
        <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#d8b979]/18 pb-2">
          <span class="font-nouveau text-xl font-semibold text-[#f0dba8]">${ex.title}</span>
          <span class="text-[11px] uppercase tracking-wider text-[#d8b979]">${ex.kith}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          <div class="rounded-lg border border-[#d8b979]/18 bg-[#101916]/80 p-2.5 text-[#f0eadc]/90">${linkifyText(ex.art)}</div>
          <div class="rounded-lg border border-[#d8b979]/18 bg-[#101916]/80 p-2.5 text-[#f0eadc]/90">${linkifyText(ex.realm)}</div>
          <div class="rounded-lg border border-[#d8b979]/18 bg-[#101916]/80 p-2.5 text-[#f0eadc]/90">${linkifyText(ex.bunk)}</div>
        </div>
        <p class="text-xs sm:text-[13px] text-[#a69f90] leading-relaxed pt-0.5">${linkifyText(ex.result)}</p>
      </div>
    `;
  }

  /* ------------------------------------------------------------------------
     5. DEDICATED LEXICON DIRECTORY PAGE (#lexicon-directory-mount)
     ------------------------------------------------------------------------ */
  function initLexiconDirectory() {
    const mount = document.getElementById('lexicon-directory-mount');
    if (!mount) return;
    const cats = ['all', ...Array.from(new Set(LEXICON.map((x) => x.cat)))];
    const ruleCount = LEXICON.filter((x) => x.kind === 'rule').length;
    const loreCount = LEXICON.length - ruleCount;

    mount.innerHTML = `
      <div class="space-y-6">
        <div class="nouveau-panel p-4 sm:p-6 space-y-4">
          <div class="relative">
            <input type="search" id="lex-dir-search" placeholder="Найти термин или правило на русском или английском (например: Гламур, Wyrd, Порог)..."
              class="w-full rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/80 px-4 py-2.5 text-sm text-[#f0eadc] placeholder-[#7b7669] focus:outline-none focus:border-[#f0dba8]" />
          </div>
          <div class="flex flex-wrap gap-1.5" id="lex-kind-bar">
            <button type="button" data-lkind="all" class="lkind-btn px-3 py-1 rounded-full text-xs border transition">
              Все записи (${LEXICON.length})
            </button>
            <button type="button" data-lkind="lore" class="lkind-btn px-3 py-1 rounded-full text-xs border transition">
              ✦ Словарь мира (${loreCount})
            </button>
            <button type="button" data-lkind="rule" class="lkind-btn px-3 py-1 rounded-full text-xs border transition">
              ◈ Правила игры (${ruleCount})
            </button>
          </div>
          <div class="flex flex-wrap gap-1.5" id="lex-cat-bar">
            ${cats
              .map(
                (c) => `
              <button type="button" data-lcat="${c}" class="lcat-btn px-3 py-1 rounded-full text-xs border transition">
                ${c === 'all' ? 'Все разделы' : c}
              </button>`
              )
              .join('')}
          </div>
        </div>
        <div id="lex-dir-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
      </div>
    `;

    document.getElementById('lex-dir-search').addEventListener('input', (e) => {
      state.lexQuery = e.target.value.trim().toLowerCase();
      renderLexiconDirectoryGrid();
    });

    mount.querySelectorAll('.lkind-btn').forEach((b) =>
      b.addEventListener('click', () => {
        state.lexKind = b.getAttribute('data-lkind');
        renderLexiconDirectoryGrid();
      })
    );

    mount.querySelectorAll('.lcat-btn').forEach((b) =>
      b.addEventListener('click', () => {
        state.lexCat = b.getAttribute('data-lcat');
        renderLexiconDirectoryGrid();
      })
    );

    renderLexiconDirectoryGrid();
  }

  function renderLexiconDirectoryGrid() {
    const grid = document.getElementById('lex-dir-grid');
    if (!grid) return;

    document.querySelectorAll('.lkind-btn').forEach((b) => {
      const k = b.getAttribute('data-lkind');
      const act = k === state.lexKind;
      if (k === 'rule') {
        b.className = `lkind-btn px-3 py-1 rounded-full text-xs border transition ${
          act
            ? 'border-[#38b89a]/80 bg-[#38b89a]/20 text-[#7be3c8]'
            : 'border-[#38b89a]/30 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#7be3c8]'
        }`;
      } else {
        b.className = `lkind-btn px-3 py-1 rounded-full text-xs border transition ${
          act
            ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
            : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
        }`;
      }
    });

    document.querySelectorAll('.lcat-btn').forEach((b) => {
      const act = b.getAttribute('data-lcat') === state.lexCat;
      b.className = `lcat-btn px-3 py-1 rounded-full text-xs border transition ${
        act
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });

    const filtered = LEXICON.filter((item) => {
      const isRule = item.kind === 'rule';
      if (state.lexKind === 'lore' && isRule) return false;
      if (state.lexKind === 'rule' && !isRule) return false;
      if (state.lexCat !== 'all' && item.cat !== state.lexCat) return false;
      if (!state.lexQuery) return true;
      const sysHay = (item.system || []).join(' ').toLowerCase();
      return (
        item.ru.toLowerCase().includes(state.lexQuery) ||
        item.en.toLowerCase().includes(state.lexQuery) ||
        item.desc.toLowerCase().includes(state.lexQuery) ||
        sysHay.includes(state.lexQuery)
      );
    });

    if (!filtered.length) {
      grid.innerHTML = `<div class="col-span-full text-center py-10 text-sm text-[#a69f90]">По вашему запросу записей не найдено.</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((item) => {
        const isRule = item.kind === 'rule';
        return `
      <article id="term-${item.id}" class="nouveau-panel p-5 space-y-2 ${isRule ? '!border-[#38b89a]/40' : ''}">
        <div class="relative z-10 space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="font-nouveau text-2xl font-semibold ${isRule ? 'text-[#7be3c8]' : 'text-[#f0dba8]'} leading-tight">${item.ru}</h3>
              <div class="text-[11px] uppercase tracking-[0.14em] text-[#a69f90]">${item.en}</div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border shrink-0 ${
              isRule
                ? 'border-[#38b89a]/45 bg-[#38b89a]/12 text-[#7be3c8]'
                : 'border-[#d8b979]/35 bg-[#d8b979]/10 text-[#d8b979]'
            }">${isRule ? `Правило · ${item.cat}` : item.cat}</span>
          </div>
          <p class="text-xs sm:text-sm text-[#f0eadc]/90 leading-relaxed pt-1">
            ${linkifyText(item.desc, item.id)}
          </p>
          ${buildRuleSystemHTML(item)}
        </div>
      </article>`;
      })
      .join('');
  }

  /* ------------------------------------------------------------------------
     6. CHAINED GLOSSARY OVERLAYS (DESKTOP POPOVER + MOBILE BOTTOM SHEET)
     ------------------------------------------------------------------------ */
  function useBottomSheetMode() {
    return state.forceSheet || window.innerWidth < 768;
  }

  function openTerm(termId, anchorEl, fromInsideOverlay = false) {
    if (!LEX_MAP[termId]) return;

    if (!fromInsideOverlay) {
      state.chain = [termId];
    } else if (state.chain[state.chain.length - 1] !== termId) {
      state.chain.push(termId);
    }

    if (useBottomSheetMode()) {
      closePopover(true);
      renderBottomSheet();
      openBottomSheetEl();
    } else {
      closeBottomSheet();
      renderDesktopPopover();
      openDesktopPopoverEl(anchorEl, fromInsideOverlay);
    }
  }

  function stepBackChain() {
    if (state.chain.length > 1) {
      state.chain.pop();
      if (state.sheetOpen) renderBottomSheet();
      if (state.popoverOpen) renderDesktopPopover();
    } else {
      closeBottomSheet();
      closePopover(true);
    }
  }

  function jumpToChainIndex(idx) {
    state.chain = state.chain.slice(0, idx + 1);
    if (state.sheetOpen) renderBottomSheet();
    if (state.popoverOpen) renderDesktopPopover();
  }

  function buildBreadcrumbsHTML() {
    const first = LEX_MAP[state.chain[0]];
    const firstIsRule = Boolean(first && first.kind === 'rule');
    const backBtn =
      state.chain.length > 1
        ? `<button type="button" data-chain-back="1" class="px-2 py-0.5 rounded-full border border-[#d8b979]/50 bg-[#d8b979]/15 text-[#f0dba8] font-medium shrink-0 hover:bg-[#d8b979]/25 transition">← Назад</button>`
        : `<span class="${firstIsRule ? 'text-[#38b89a]' : 'text-[#d8b979]'} shrink-0">${firstIsRule ? '◈' : '✦'}</span>`;

    const trail = state.chain
      .map((id, idx) => {
        const t = LEX_MAP[id];
        const isCurrent = idx === state.chain.length - 1;
        const activeCls = t && t.kind === 'rule' ? 'text-[#7be3c8] font-semibold' : 'text-[#f0dba8] font-semibold';
        return `
          ${idx > 0 ? '<span class="text-[#7b7669] shrink-0">›</span>' : ''}
          <button type="button" data-chain-idx="${idx}"
            class="shrink-0 px-1 py-0.5 rounded transition ${
              isCurrent ? activeCls : 'text-[#a69f90] hover:text-[#f0eadc]'
            }">
            ${t.ru.split(' / ')[0]}
          </button>
        `;
      })
      .join('');

    return backBtn + trail;
  }

  function buildRuleSystemHTML(item) {
    if (!item || !Array.isArray(item.system) || !item.system.length) return '';
    const rows = item.system
      .map((line) => {
        const safe = String(line || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<li>${linkifyHTML(formatInlineMd(safe), item.id)}</li>`;
      })
      .join('');
    return `
      <div class="rule-system-box">
        <div class="rule-system-title">◈ Система</div>
        <ul class="rule-system-list">${rows}</ul>
      </div>
    `;
  }

  function buildTermBodyHTML(item) {
    const isRule = item.kind === 'rule';
    return `
      <div class="flex items-start justify-between gap-2">
        <div>
          <h4 class="font-nouveau text-2xl font-semibold ${isRule ? 'text-[#7be3c8]' : 'text-[#f0dba8]'} leading-tight">${item.ru}</h4>
          <div class="text-[11px] uppercase tracking-[0.14em] text-[#a69f90]">${item.en}</div>
        </div>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border shrink-0 ${
          isRule
            ? 'border-[#38b89a]/45 bg-[#38b89a]/12 text-[#7be3c8]'
            : 'border-[#d8b979]/35 bg-[#d8b979]/10 text-[#d8b979]'
        }">${isRule ? `Правило · ${item.cat}` : item.cat}</span>
      </div>
      <p class="text-xs sm:text-sm text-[#f0eadc]/92 leading-relaxed pt-1">
        ${linkifyText(item.desc, item.id)}
      </p>
      ${buildRuleSystemHTML(item)}
    `;
  }

  function renderDesktopPopover() {
    const current = LEX_MAP[state.chain[state.chain.length - 1]];
    if (!current) return;
    const pop = document.getElementById('desktop-popover');
    if (pop) pop.classList.toggle('is-rule', current.kind === 'rule');
    document.getElementById('pop-breadcrumbs').innerHTML = buildBreadcrumbsHTML();
    document.getElementById('pop-content').innerHTML = buildTermBodyHTML(current);

    const pinBtn = document.getElementById('pop-pin-btn');
    pinBtn.textContent = state.popoverPinned ? 'Закреплено' : 'Закрепить';
    pinBtn.className = `px-2 py-0.5 rounded-full text-[11px] border transition ${
      state.popoverPinned
        ? 'border-[#f0dba8] bg-[#d8b979]/22 text-[#f0dba8]'
        : 'border-[#d8b979]/35 text-[#a69f90] hover:text-[#f0dba8] hover:border-[#d8b979]'
    }`;
  }

  function openDesktopPopoverEl(anchorEl, keepPosition) {
    const pop = document.getElementById('desktop-popover');
    if (!keepPosition && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const popW = Math.min(400, window.innerWidth - 24);
      const estH = 220;

      let left = rect.left;
      let top = rect.bottom + 10;
      if (left + popW > window.innerWidth - 12) left = Math.max(12, window.innerWidth - popW - 12);
      if (top + estH > window.innerHeight - 12) top = Math.max(12, rect.top - estH - 10);

      pop.style.left = `${Math.round(left)}px`;
      pop.style.top = `${Math.round(top)}px`;
    }
    pop.classList.add('open');
    state.popoverOpen = true;
  }

  function closePopover(force = false) {
    if (!force && state.popoverPinned) return;
    const pop = document.getElementById('desktop-popover');
    if (pop) pop.classList.remove('open');
    state.popoverOpen = false;
    if (force) state.popoverPinned = false;
  }

  function renderBottomSheet() {
    const current = LEX_MAP[state.chain[state.chain.length - 1]];
    if (!current) return;
    const sheet = document.getElementById('bottom-sheet');
    if (sheet) sheet.classList.toggle('is-rule', current.kind === 'rule');
    document.getElementById('sheet-breadcrumbs').innerHTML = buildBreadcrumbsHTML();
    document.getElementById('sheet-content').innerHTML = `
      ${buildTermBodyHTML(current)}
      <p class="pt-3 border-t border-[#d8b979]/15 text-[11px] text-[#7b7669]">
        Нажмите на любой выделенный термин выше — <span class="text-[#f0dba8]">золотой</span> (словарь мира) или <span class="text-[#7be3c8]">бирюзовый</span> (правило игры), — чтобы перейти дальше по цепочке.
      </p>
    `;
  }

  function openBottomSheetEl() {
    document.getElementById('sheet-backdrop').classList.add('open');
    document.getElementById('bottom-sheet').classList.add('open');
    state.sheetOpen = true;
  }

  function closeBottomSheet() {
    const bd = document.getElementById('sheet-backdrop');
    const sh = document.getElementById('bottom-sheet');
    if (bd) bd.classList.remove('open');
    if (sh) sh.classList.remove('open');
    state.sheetOpen = false;
  }

  /* ------------------------------------------------------------------------
     7. GLOBAL SEARCH MODAL (Ctrl+K / ⌘K) & VOLUMES DRAWER & LIGHTBOX
     ------------------------------------------------------------------------ */
  function openSearchModal() {
    const modal = document.getElementById('search-modal');
    if (!modal) return;
    modal.classList.add('open');
    const inp = document.getElementById('global-search-input');
    if (inp) {
      inp.focus();
      renderGlobalSearchResults(inp.value);
    }
  }

  function closeSearchModal() {
    const modal = document.getElementById('search-modal');
    if (modal) modal.classList.remove('open');
  }

  function renderGlobalSearchResults(qRaw) {
    const out = document.getElementById('global-search-results');
    if (!out) return;
    const q = (qRaw || '').trim().toLowerCase();
    if (!q) {
      out.innerHTML = `
        <div class="text-xs text-[#a69f90] py-6 text-center">
          Введите запрос: название Кита, главу, правило (например, <strong class="text-[#f0dba8]">Холодное железо</strong>, <strong class="text-[#f0dba8]">Шелки</strong>, <strong class="text-[#f0dba8]">Свободные очки</strong>).
        </div>`;
      return;
    }

    const hits = [];
    // 1. Lexicon & Rule hits
    LEXICON.forEach((item) => {
      const sysHay = (item.system || []).join(' ').replace(/\*+/g, '').toLowerCase();
      if (
        item.ru.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        sysHay.includes(q)
      ) {
        const isRule = item.kind === 'rule';
        hits.push({
          badge: `${isRule ? 'Правило' : 'Лексикон'} · ${item.cat}`,
          title: `${item.ru} (${item.en})`,
          snippet: item.desc.slice(0, 150) + (item.desc.length > 150 ? '…' : ''),
          url: `${ROOT}lexicon/index.html#term-${item.id}`
        });
      }
    });

    // 2. Kith hits
    KITHS.forEach((k) => {
      const hay = `${k.ru} ${k.en} ${k.tagline} ${(k.lore || []).join(' ')} ${(k.birthrights || [])
        .map((b) => b.name)
        .join(' ')} ${k.frailty ? k.frailty.name : ''}`.toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          badge: `Кит · Сродство: ${k.affinity}`,
          title: `${k.ru} (${k.en})`,
          snippet: k.tagline,
          url: `${ROOT}02-kiths/index.html?kith=${k.id}#kiths-arcana`
        });
      }
    });

    // 2b. Noble House hits
    HOUSES.forEach((h) => {
      const hay = `${h.ru} ${h.en} ${h.nicknames || ''} ${h.tagline || ''} ${(h.lore || []).join(' ')} ${
        h.boon ? h.boon.name : ''
      } ${h.flaw ? h.flaw.name : ''} ${(h.factions || []).map((f) => f.name).join(' ')}`.toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          badge: `Благородный Дом · ${h.court} Двор`,
          title: `${h.ru} (${h.en})`,
          snippet: h.tagline,
          url: `${ROOT}03-noble-houses/index.html?house=${h.id}#houses-arcana`
        });
      }
    });

    // 2c. Legacy & Threshold hits
    LEGACIES.forEach((l) => {
      const hay = `${l.ru} ${l.en} ${l.tagline} ${l.desc} ${l.quest} ${l.ban}`.toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          badge: `Наследие · ${l.court} Двор`,
          title: `${l.ru} (${l.en})`,
          snippet: l.tagline,
          url: `${ROOT}04-legacies-thresholds/index.html?legacy=${l.id}#legacies-mirror`
        });
      }
    });

    THRESHOLDS.forEach((t) => {
      const hay = `${t.ru} ${t.en} ${t.tagline} ${t.desc} ${t.sceneHint}`.toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          badge: `Порог · ${t.typeRu}`,
          title: `${t.ru} (${t.en})`,
          snippet: t.tagline,
          url: `${ROOT}04-legacies-thresholds/index.html?threshold=${t.id}#thresholds-compass`
        });
      }
    });

    // 3. Chapter section hits
    (BUNDLE.search || []).forEach((s) => {
      if (s.title.toLowerCase().includes(q) || s.text.toLowerCase().includes(q)) {
        const idx = s.text.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 45);
        const snip = (start > 0 ? '…' : '') + s.text.slice(start, start + 150) + '…';
        hits.push({
          badge: s.part,
          title: s.title,
          snippet: snip,
          url: ROOT + s.url
        });
      }
    });

    if (!hits.length) {
      out.innerHTML = `<div class="text-xs text-[#a69f90] py-8 text-center">Ничего не найдено по запросу «${qRaw}».</div>`;
      return;
    }

    out.innerHTML = hits
      .slice(0, 18)
      .map(
        (h) => `
      <a href="${h.url}" class="block rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/65 hover:border-[#d8b979]/65 hover:bg-[#15211d] p-3.5 transition">
        <div class="flex items-center justify-between gap-2">
          <span class="font-nouveau text-lg font-semibold text-[#f0dba8]">${h.title}</span>
          <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#d8b979]/30 text-[#d8b979] shrink-0">${h.badge}</span>
        </div>
        <p class="text-xs text-[#a69f90] mt-1 line-clamp-2">${h.snippet}</p>
      </a>`
      )
      .join('');
  }

  /* ------------------------------------------------------------------------
     8. TOPBAR MODES, SCROLLSPY, LIGHTBOX & PRINT ARTIFACTS
     ------------------------------------------------------------------------ */
  function applyTableModeUI() {
    document.body.classList.toggle('mode-table', state.tableMode);
    localStorage.setItem('ctd20_table_mode', state.tableMode ? '1' : '0');
    const textEl = document.getElementById('depth-text');
    const dotEl = document.getElementById('depth-dot');
    const btn = document.getElementById('btn-depth-toggle');
    if (textEl && dotEl && btn) {
      textEl.textContent = state.tableMode ? 'Режим стола' : 'Лор + Правила';
      dotEl.style.backgroundColor = state.tableMode ? '#f0dba8' : '#d8b979';
      btn.style.borderColor = state.tableMode ? '#f0dba8' : 'rgba(216, 185, 121, 0.30)';
    }
    if (state.tableMode && state.kithDetailTab === 'essence') {
      state.kithDetailTab = 'powers';
      renderKithSpotlight();
    }
    if (state.tableMode && state.houseDetailTab === 'lore') {
      state.houseDetailTab = 'powers';
      renderHouseSpotlight();
    }
  }

  function initScrollSpy() {
    const links = Array.from(document.querySelectorAll('.toc-link[href^="#"]'));
    if (!links.length) return;
    const targets = links
      .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
      .filter(Boolean);

    const onScroll = () => {
      let currentId = targets[0] ? targets[0].id : '';
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= 135) currentId = el.id;
      }
      links.forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === `#${currentId}`);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function buildPrintArtifacts() {
    const kithsPrint = document.getElementById('print-kiths-container');
    if (kithsPrint && KITHS.length) {
      kithsPrint.innerHTML = KITHS.map(
        (k) => `
        <article class="print-kith-card p-4 space-y-2">
          <div class="flex items-baseline justify-between border-b border-[#ccc] pb-1">
            <h3 class="font-nouveau text-xl font-bold">${k.ru} <span class="text-sm font-normal">(${k.en})</span></h3>
            <span class="text-xs font-semibold">Сродство: ${k.affinity} (−1 сл.)</span>
          </div>
          <p class="italic text-xs">${k.quote}</p>
          <div class="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <div class="font-bold mb-1">Врождённые права:</div>
              ${(k.birthrights || [])
                .map((b) => `<p class="mb-1"><strong>${b.name}:</strong> ${(b.paragraphs || []).join(' ')}</p>`)
                .join('')}
            </div>
            <div>
              <div class="font-bold mb-1">Слабость — ${(k.frailty && k.frailty.name) || ''}:</div>
              <p class="mb-1">${((k.frailty && k.frailty.paragraphs) || []).join(' ')}</p>
              <p><strong>Разгул:</strong> ${k.revelry}</p>
            </div>
          </div>
        </article>`
      ).join('');
    }

    const housesPrint = document.getElementById('print-houses-container');
    if (housesPrint && HOUSES.length) {
      housesPrint.innerHTML = HOUSES.map(
        (h) => `
        <article class="print-house-card p-4 space-y-2">
          <div class="flex items-baseline justify-between border-b border-[#ccc] pb-1">
            <h3 class="font-nouveau text-xl font-bold">${h.ru} <span class="text-sm font-normal">(${h.en})</span></h3>
            <span class="text-xs font-semibold">${h.courtNote || `${h.court} Двор`} · ${h.nicknames || ''}</span>
          </div>
          <p class="italic text-xs">${h.oath}</p>
          <div class="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <div class="font-bold mb-1">Дар Дома — ${(h.boon && h.boon.name) || ''}:</div>
              <p>${((h.boon && h.boon.paragraphs) || []).join(' ')}</p>
            </div>
            <div>
              <div class="font-bold mb-1">Изъян Дома — ${(h.flaw && h.flaw.name) || ''}:</div>
              <p>${((h.flaw && h.flaw.paragraphs) || []).join(' ')}</p>
            </div>
          </div>
        </article>`
      ).join('');
    }

    const legaciesPrint = document.getElementById('print-legacies-container');
    if (legaciesPrint && LEGACIES.length) {
      legaciesPrint.innerHTML = LEGACIES.map(
        (l) => `
        <article class="print-legacy-card p-3 space-y-1">
          <div class="flex items-baseline justify-between border-b border-[#ccc] pb-0.5">
            <h4 class="font-nouveau text-lg font-bold">${l.ru} <span class="text-xs font-normal">(${l.en})</span></h4>
            <span class="text-xs font-semibold">${l.court} Двор</span>
          </div>
          <p class="text-xs">${l.desc}</p>
          <p class="text-xs"><strong>Призвание:</strong> ${l.quest} · <strong>Запрет:</strong> ${l.ban}</p>
        </article>`
      ).join('');
    }

    const thresholdsPrint = document.getElementById('print-thresholds-container');
    if (thresholdsPrint && THRESHOLDS.length) {
      thresholdsPrint.innerHTML = THRESHOLDS.map(
        (t) => `
        <article class="print-threshold-card p-3 space-y-1">
          <div class="flex items-baseline justify-between border-b border-[#ccc] pb-0.5">
            <h4 class="font-nouveau text-lg font-bold">${t.ru} <span class="text-xs font-normal">(${t.en})</span></h4>
            <span class="text-xs font-semibold">Порог · ${t.typeRu}</span>
          </div>
          <p class="text-xs">${t.desc}</p>
        </article>`
      ).join('');
    }

    const lexPrint = document.getElementById('print-lexicon-container');
    if (lexPrint && LEXICON.length) {
      const sorted = [...LEXICON].sort((a, b) => a.ru.localeCompare(b.ru, 'ru'));
      lexPrint.innerHTML = sorted
        .map((item) => {
          const sys =
            Array.isArray(item.system) && item.system.length
              ? ` <em>Система:</em> ${item.system
                  .map((s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1'))
                  .join(' · ')}`
              : '';
          return `<div class="print-lex-entry"><strong>${item.ru}</strong> <em>(${item.en})</em> — ${item.desc}${sys}</div>`;
        })
        .join('');
    }
  }

  /* ------------------------------------------------------------------------
     9. BOOTSTRAP
     ------------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    // Linkify static prose & hero intro
    document.querySelectorAll('.auto-lex').forEach((el) => linkifyDOMContainer(el));

    initKithsGallery();
    initHousesGallery();
    initLegaciesWidget();
    initThresholdsWidget();
    initTempersWidget();
    initCantripWidget();
    initLexiconDirectory();
    applyTableModeUI();
    initScrollSpy();
    buildPrintArtifacts();

    // Topbar button bindings
    const depthBtn = document.getElementById('btn-depth-toggle');
    if (depthBtn) {
      depthBtn.addEventListener('click', () => {
        state.tableMode = !state.tableMode;
        applyTableModeUI();
      });
    }
    const restoreBtn = document.getElementById('btn-restore-lore');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        state.tableMode = false;
        applyTableModeUI();
      });
    }

    const sheetToggle = document.getElementById('btn-sheet-toggle');
    if (sheetToggle) {
      sheetToggle.addEventListener('click', () => {
        state.forceSheet = !state.forceSheet;
        closePopover(true);
        closeBottomSheet();
        const txt = document.getElementById('sheet-text');
        if (txt) txt.textContent = state.forceSheet ? 'Шторка: ВКЛ' : 'Тест шторки';
        sheetToggle.style.borderColor = state.forceSheet ? '#f0dba8' : 'rgba(216, 185, 121, 0.30)';
        sheetToggle.style.color = state.forceSheet ? '#f0dba8' : '#a69f90';
      });
    }

    document.querySelectorAll('[data-open-search]').forEach((b) => b.addEventListener('click', openSearchModal));
    document.querySelectorAll('[data-close-search]').forEach((b) => b.addEventListener('click', closeSearchModal));

    const searchInp = document.getElementById('global-search-input');
    if (searchInp) {
      searchInp.addEventListener('input', (e) => renderGlobalSearchResults(e.target.value));
    }

    const volDrawer = document.getElementById('volumes-drawer');
    document.querySelectorAll('[data-open-volumes]').forEach((b) =>
      b.addEventListener('click', () => volDrawer && volDrawer.classList.add('open'))
    );
    document.querySelectorAll('[data-close-volumes]').forEach((b) =>
      b.addEventListener('click', () => volDrawer && volDrawer.classList.remove('open'))
    );

    // Popover & Sheet internal buttons
    const pinBtn = document.getElementById('pop-pin-btn');
    if (pinBtn) {
      pinBtn.addEventListener('click', () => {
        state.popoverPinned = !state.popoverPinned;
        renderDesktopPopover();
      });
    }
    document.querySelectorAll('[data-close-pop]').forEach((b) => b.addEventListener('click', () => closePopover(true)));
    document.querySelectorAll('[data-close-sheet]').forEach((b) => b.addEventListener('click', closeBottomSheet));

    // Delegated click handler (Lexicon links, Chain breadcrumbs, Lightbox)
    document.addEventListener('click', (e) => {
      const backBtn = e.target.closest('[data-chain-back]');
      if (backBtn) {
        e.stopPropagation();
        stepBackChain();
        return;
      }
      const idxBtn = e.target.closest('[data-chain-idx]');
      if (idxBtn) {
        e.stopPropagation();
        jumpToChainIndex(parseInt(idxBtn.getAttribute('data-chain-idx'), 10));
        return;
      }
      const termBtn = e.target.closest('.lex-term');
      if (termBtn) {
        e.stopPropagation();
        const termId = termBtn.getAttribute('data-term');
        const inside = !!(termBtn.closest('#desktop-popover') || termBtn.closest('#bottom-sheet'));
        openTerm(termId, termBtn, inside);
        return;
      }
      const lbImg = e.target.closest('[data-lightbox]');
      if (lbImg) {
        const lb = document.getElementById('lightbox-modal');
        const lbTarget = document.getElementById('lightbox-img');
        const lbCap = document.getElementById('lightbox-caption');
        if (lb && lbTarget) {
          lbTarget.src = lbImg.getAttribute('data-lightbox');
          if (lbCap) lbCap.textContent = lbImg.getAttribute('data-caption') || '';
          lb.classList.add('open');
        }
        return;
      }
      if (state.popoverOpen && !e.target.closest('#desktop-popover')) {
        closePopover(false);
      }
    });

    document.querySelectorAll('[data-close-lightbox]').forEach((b) =>
      b.addEventListener('click', () => {
        const lb = document.getElementById('lightbox-modal');
        if (lb) lb.classList.remove('open');
      })
    );

    // Desktop hover preview on lexicon terms
    document.addEventListener('mouseover', (e) => {
      if (useBottomSheetMode() || state.popoverPinned) return;
      const termBtn = e.target.closest('.lex-term');
      if (!termBtn || termBtn.closest('#desktop-popover')) return;
      clearTimeout(state.hoverTimer);
      state.hoverTimer = setTimeout(() => {
        openTerm(termBtn.getAttribute('data-term'), termBtn, false);
      }, 320);
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('.lex-term')) clearTimeout(state.hoverTimer);
    });

    // Keyboard shortcuts (Ctrl+K / Cmd+K & Escape)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearchModal();
      } else if (e.key === 'Escape') {
        closePopover(true);
        closeBottomSheet();
        closeSearchModal();
        if (volDrawer) volDrawer.classList.remove('open');
        const lb = document.getElementById('lightbox-modal');
        if (lb) lb.classList.remove('open');
      }
    });

    // Touch swipe down on bottom sheet
    const sheet = document.getElementById('bottom-sheet');
    if (sheet) {
      let touchStartY = 0;
      sheet.addEventListener('touchstart', (e) => (touchStartY = e.touches[0].clientY), { passive: true });
      sheet.addEventListener(
        'touchend',
        (e) => {
          if (e.changedTouches[0].clientY - touchStartY > 70) closeBottomSheet();
        },
        { passive: true }
      );
    }

    window.addEventListener('beforeprint', buildPrintArtifacts);
  });
})();

/* ==========================================================================
   CHANGELING: THE DREAMING 20TH — INTERACTIVE BOOK ENGINE (app.js)
   - Boundary-safe 55+ term Lexicon Auto-Linker + BG3 Chained Popover / Sheet
   - 13-Kith Stained-Glass Arcana Gallery + Dynamic Aura + Book Scroll View
   - Step 3/4 Interactive Widgets (Tempers + Cantrip Equation)
   - Global Instant Search (Ctrl+K / ⌘K), Table Mode, TOC Scrollspy & Lightbox
   ========================================================================== */
(function () {
  'use strict';

  const BUNDLE = window.CTD_BUNDLE || { lexicon: [], kiths: [], houses: [], legacies: [], thresholds: [], traits: {}, volumes: [], search: [] };
  const ROOT = document.documentElement.getAttribute('data-root') || './';
  const LEXICON = BUNDLE.lexicon || [];
  const KITHS = BUNDLE.kiths || [];
  const HOUSES = BUNDLE.houses || [];
  const LEGACIES = BUNDLE.legacies || [];
  const THRESHOLDS = BUNDLE.thresholds || [];
  const TRAITS_DATA = BUNDLE.traits || { attributes: [], abilities: [], backgrounds: [] };
  const ATTRIBUTES = TRAITS_DATA.attributes || [];
  const ABILITIES = TRAITS_DATA.abilities || [];
  const BACKGROUNDS = TRAITS_DATA.backgrounds || [];
  const MERITS_FLAWS_DATA = BUNDLE.meritsFlaws || { items: [], animalFeatures: [] };
  const MF_ITEMS = MERITS_FLAWS_DATA.items || [];
  const ANIMAL_FEATURES = MERITS_FLAWS_DATA.animalFeatures || [];
  const REALMS_DATA = BUNDLE.realmsData || { realms: [], cantripModifiers: [], bunkExamples: [] };
  const REALMS = REALMS_DATA.realms || [];
  const CANTRIP_MODS = REALMS_DATA.cantripModifiers || [];
  const BUNK_EXAMPLES = REALMS_DATA.bunkExamples || [];
  const LEX_MAP = Object.fromEntries(LEXICON.map((item) => [item.id, item]));

  /* ------------------------------------------------------------------------
     1. BOUNDARY-SAFE LEXICON AUTO-LINKER
     ------------------------------------------------------------------------ */
  const PATTERN_LIST = [];
  LEXICON.forEach((item) => {
    (item.patterns || []).forEach((p) => PATTERN_LIST.push({ text: p, id: item.id }));
  });
  PATTERN_LIST.sort((a, b) => b.text.length - a.text.length);

  // Preserve case sensitivity for ambiguous capitalized words like "Тропы" / "Отголоски" / mechanic terms
  const CASE_SENSITIVE_WORDS = new Set([
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
    'Темпераментах',
    'Наставник',
    'Наставника',
    'Наставнику',
    'Наставником',
    'Наставнике',
    'Наставники',
    'Наставников',
    'Наставникам',
    'Наставниками',
    'Наставниках',
    'Свита',
    'Свиты',
    'Свите',
    'Свиту',
    'Свитой',
    'Свитою',
    'Свитам',
    'Свитами',
    'Свитах',
    'Якорь',
    'Якорем',
    'Якоря',
    'Якорю',
    'Якоре',
    'Туманами',
    'Туманам',
    'Туманах',
    'Туманов',
    'Отголоски',
    'Отголосков',
    'Отголоскам',
    'Отголосками',
    'Отголосках',
    'Сродство',
    'Сродства',
    'Сродству',
    'Сродством',
    'Сродстве'
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
      return `${prefix}<button type="button" class="lex-term" data-term="${id}"${isRule ? ' data-kind="rule"' : ''}>${word}</button>`;
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
    traitCat: 'attributes',   // 'attributes' | 'talents' | 'skills' | 'knowledges'
    selectedTraitId: 'strength',
    traitQuery: '',
    traitViewMode: 'atlas',   // 'atlas' | 'scroll'
    selectedBgId: 'chimera',
    bgFilter: 'all',          // 'all' | 'poolable' | 'personal'
    bgViewMode: 'atlas',      // 'atlas' | 'scroll'
    selectedMfId: 'acute_sense',
    mfKindFilter: 'all',      // 'all' | 'merit' | 'flaw'
    mfCatFilter: 'all',       // 'all' | 'physical' | 'mental' | 'social' | 'supernatural'
    mfCostFilter: 'all',      // 'all' | '1' | '2' | '3' | '4' | '5+'
    mfQuery: '',
    mfViewMode: 'atlas',      // 'atlas' | 'scroll'
    selectedMfChoices: [],    // [{ id, ru, kind, cost, uid }]
    cfTab: 'cantrip',         // 'cantrip' | 'unleash' | 'bunks'
    cfWyrd: true,
    cfArt: 3,
    cfRealm: 2,
    cfCheated: 0,
    cfNightmare: 1,
    cfBunk: -2,
    cfGlamour: 4,
    cfBunkFilter: 'all',      // 'all' | '-1' | '-2' | '-3' | '-4' | '-5'
    cfBunkQuery: '',
    cfMods: {
      target_banality: false,
      location_banality: false,
      scene_realm: false,
      time_realm: false,
      higher_title: false,
      freehold: false,
      enchanted_kinain: false,
      kith_affinity: false,
      voluntary_nightmare: false
    },
    selectedRealmId: 'actor',
    realmViewMode: 'atlas',   // 'atlas' | 'scroll'
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
          <div id="kiths-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"></div>
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
            <div class="relative z-10 w-full min-h-[3.5rem] flex flex-col items-center justify-center">
              <h3 class="font-nouveau text-lg sm:text-xl font-semibold text-[#f0eadc] leading-tight">
                ${k.ru}
              </h3>
              <div class="text-[10px] uppercase tracking-[0.12em] text-[#a69f90] mt-0.5">
                ${k.en}
              </div>
            </div>
            <div class="relative z-10 my-2 w-9 h-px" style="background: linear-gradient(90deg, transparent, ${k.auraHex}, transparent);"></div>
            <p class="relative z-10 text-[11px] text-[#a69f90] leading-snug mb-3 line-clamp-3">
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
                <strong style="color:${k.auraHex};">${k.affinity} (${k.affinityEn})</strong> снижает сложность броска ${linkifyText('Кантрипа')} на <strong>1</strong> <em>(когда выступает основным Владением)</em>.
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
          <div id="houses-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"></div>
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
            <div class="relative z-10 w-full min-h-[3.5rem] flex flex-col items-center justify-center">
              <h3 class="font-nouveau text-lg sm:text-xl font-semibold text-[#f0eadc] leading-tight">
                ${h.ru}
              </h3>
              <div class="text-[10px] uppercase tracking-[0.12em] text-[#a69f90] mt-0.5">
                ${h.en}
              </div>
            </div>
            <div class="relative z-10 my-2 w-9 h-px" style="background: linear-gradient(90deg, transparent, ${h.auraHex}, transparent);"></div>
            <p class="relative z-10 text-[11px] text-[#a69f90] leading-snug mb-3 line-clamp-3">
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
          <div id="legacies-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"></div>
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
            <div class="relative z-10 w-full min-h-[3.2rem] flex flex-col items-center justify-center">
              <h3 class="font-nouveau text-lg font-semibold text-[#f0eadc] leading-tight">${l.ru}</h3>
              <div class="text-[10px] uppercase tracking-[0.12em] text-[#a69f90] mt-0.5">${l.en}</div>
            </div>
            <div class="relative z-10 my-1.5 w-8 h-px" style="background: linear-gradient(90deg, transparent, ${l.auraHex}, transparent);"></div>
            <p class="relative z-10 text-[11px] text-[#a69f90] leading-snug mb-2.5 line-clamp-3">${l.tagline}</p>
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
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
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
                    : linkifyText('Проведя Опустошение через свой Порог по системе Вдохновения (изучив жертву броском Восприятия + Кеннинга по базовой сложности 8 и набрав 5 и более успехов на финальном броске по сложности 6), подменыш получает +1 постоянную точку Гламура.')
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
     3E. WIDGET: TRAITS COMPENDIUM (ATTRIBUTES & ABILITIES)
     ------------------------------------------------------------------------ */
  function renderSmallDotsHTML(count, max = 5) {
    let dots = '';
    for (let i = 1; i <= max; i++) {
      dots += `<span class="wod-dot-sm ${i <= count ? 'filled' : ''}" aria-hidden="true"></span>`;
    }
    return `<span class="inline-flex items-center gap-1 shrink-0" aria-label="${count} / ${max}">${dots}</span>`;
  }

  function initTraitsCompendium() {
    const mount = document.getElementById('traits-widget-mount');
    if (!mount || (!ATTRIBUTES.length && !ABILITIES.length)) return;

    const params = new URLSearchParams(window.location.search);
    const qTrait = params.get('trait');
    if (qTrait) {
      const fAttr = ATTRIBUTES.find((a) => a.id === qTrait);
      const fAb = ABILITIES.find((a) => a.id === qTrait);
      if (fAttr) {
        state.traitCat = 'attributes';
        state.selectedTraitId = fAttr.id;
      } else if (fAb) {
        state.traitCat = fAb.group;
        state.selectedTraitId = fAb.id;
      }
    }

    const cats = [
      { id: 'attributes', label: `Атрибуты (${ATTRIBUTES.length})` },
      { id: 'talents', label: `Таланты (${ABILITIES.filter((a) => a.group === 'talents').length - 1}+1)` },
      { id: 'skills', label: `Навыки (${ABILITIES.filter((a) => a.group === 'skills').length - 1}+1)` },
      { id: 'knowledges', label: `Познания (${ABILITIES.filter((a) => a.group === 'knowledges').length - 1}+1)` }
    ];

    mount.innerHTML = `
      <section id="traits-compendium" class="space-y-6 my-8 scroll-mt-24">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979]">Природа и выучка · Справочник Черт</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc] !mt-1 !mb-0 !border-0 !pb-0">
              Атрибуты и Способности
            </h2>
          </div>
          <div class="no-print inline-flex rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1 self-start md:self-auto">
            <button type="button" id="tview-atlas" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ✦ Справочник
            </button>
            <button type="button" id="tview-scroll" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ☰ Книжный свиток
            </button>
          </div>
        </div>

        <div id="traits-interactive-area" class="space-y-5">
          <div class="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div class="flex flex-wrap gap-1.5">
              ${cats
                .map(
                  (c) => `
                <button type="button" data-tcat="${c.id}" class="trait-cat-btn px-3 py-1.5 rounded-full text-xs border transition">
                  ${c.label}
                </button>`
                )
                .join('')}
            </div>
            <input type="search" id="trait-search-input" placeholder="Поиск Черты, профессии или специализации..."
              class="w-full sm:w-64 rounded-full border border-[#d8b979]/30 bg-[#0b110f]/75 px-3.5 py-1.5 text-xs text-[#f0eadc] placeholder-[#7b7669] focus:outline-none focus:border-[#f0dba8]" />
          </div>

          <div id="trait-rule-banner" class="rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/60 px-4 py-2.5 text-xs text-[#a69f90]"></div>
          <div id="traits-grid"></div>
          <div id="trait-spotlight" class="nouveau-panel p-5 sm:p-7 scroll-mt-24" aria-live="polite"></div>
        </div>

        <div id="traits-scroll-area" class="hidden space-y-6"></div>
        <div id="print-traits-container" class="print-only space-y-3"></div>
      </section>
    `;

    document.getElementById('tview-atlas').addEventListener('click', () => {
      state.traitViewMode = 'atlas';
      syncTraitViewMode();
    });
    document.getElementById('tview-scroll').addEventListener('click', () => {
      state.traitViewMode = 'scroll';
      syncTraitViewMode();
    });
    mount.querySelectorAll('.trait-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.traitCat = btn.getAttribute('data-tcat');
        state.traitQuery = '';
        const inp = document.getElementById('trait-search-input');
        if (inp) inp.value = '';
        const firstInCat =
          state.traitCat === 'attributes'
            ? ATTRIBUTES[0]
            : ABILITIES.find((a) => a.group === state.traitCat);
        if (firstInCat) state.selectedTraitId = firstInCat.id;
        renderTraitsGrid();
        renderTraitSpotlight(false);
      });
    });
    document.getElementById('trait-search-input').addEventListener('input', (e) => {
      state.traitQuery = e.target.value.trim().toLowerCase();
      renderTraitsGrid();
    });

    renderTraitsGrid();
    renderTraitSpotlight(false);
    renderTraitsScrollArea();
    syncTraitViewMode();
  }

  function syncTraitViewMode() {
    const atlas = document.getElementById('traits-interactive-area');
    const scroll = document.getElementById('traits-scroll-area');
    const bAtl = document.getElementById('tview-atlas');
    const bScr = document.getElementById('tview-scroll');
    if (!atlas || !scroll) return;
    const isAtl = state.traitViewMode === 'atlas';
    atlas.classList.toggle('hidden', !isAtl);
    scroll.classList.toggle('hidden', isAtl);
    bAtl.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      isAtl ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
    bScr.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      !isAtl ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
  }

  function renderTraitsGrid() {
    const grid = document.getElementById('traits-grid');
    const banner = document.getElementById('trait-rule-banner');
    if (!grid || !banner) return;

    document.querySelectorAll('.trait-cat-btn').forEach((btn) => {
      const act = !state.traitQuery && btn.getAttribute('data-tcat') === state.traitCat;
      btn.className = `trait-cat-btn px-3 py-1.5 rounded-full text-xs border transition ${
        act
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });

    const bannerNotes = {
      attributes:
        'Шкала 1–5 точек *(высшие дары фейри поднимают черту до 6 и более)*. При рейтинге 4 и выше выбирается <strong>Специализация</strong> — каждая выпавшая «10» даёт 2 успеха.',
      talents:
        '<strong>Таланты:</strong> если в нужном Таланте нет ни одной точки, игрок бросает полный запас подходящего Атрибута без штрафа. ◇ — свободная ячейка.',
      skills:
        '<strong>Навыки:</strong> при отсутствии точек в Навыке сложность проверки увеличивается на 1. ✦ — специализация обязательна уже с первой точки; ◇ — свободная ячейка.',
      knowledges:
        '<strong>Познания:</strong> без хотя бы 1 точки совершить проверку Познания нельзя *(общеизвестные факты броска не требуют)*. ✦ — специализация обязательна с первой точки; ◇ — свободная ячейка.'
    };

    const q = state.traitQuery;
    if (q) {
      const safeQ = q.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      banner.innerHTML = `Поиск по всем Атрибутам и Способностям по запросу <strong class="text-[#f0dba8]">«${safeQ}»</strong>.`;
      const allTraits = [...ATTRIBUTES, ...ABILITIES].filter((item) => {
        const hay = `${item.ru} ${item.en} ${item.groupRu} ${item.desc} ${item.mechanicNote || ''} ${(item.possessedBy || []).join(' ')} ${(item.specialties || []).join(' ')} ${(item.levels || []).map((l) => l.text).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
      if (!allTraits.length) {
        grid.className = '';
        grid.innerHTML = `<div class="text-xs text-[#a69f90] py-6 text-center rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/50">По вашему запросу Черты не найдены.</div>`;
        return;
      }
      if (!allTraits.some((item) => item.id === state.selectedTraitId)) {
        state.selectedTraitId = allTraits[0].id;
        renderTraitSpotlight(false);
      }
      grid.className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2';
      grid.innerHTML = allTraits.map((item) => buildTraitCardBtnHTML(item, true)).join('');
    } else if (state.traitCat === 'attributes') {
      banner.innerHTML = linkifyHTML(formatInlineMd(bannerNotes.attributes));
      const groups = [
        { key: 'physical', title: 'Физические', aura: '#c87a4b' },
        { key: 'social', title: 'Социальные', aura: '#c86d8a' },
        { key: 'mental', title: 'Ментальные', aura: '#4b9aa8' }
      ];
      grid.className = 'grid grid-cols-1 md:grid-cols-3 gap-3';
      grid.innerHTML = groups
        .map((g) => {
          const items = ATTRIBUTES.filter((a) => a.group === g.key);
          return `
            <div class="rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-3 space-y-2">
              <div class="flex items-center gap-2 border-b border-[#d8b979]/15 pb-1.5">
                <span class="w-2 h-2 rounded-full shrink-0" style="background-color:${g.aura};"></span>
                <span class="text-[11px] uppercase tracking-[0.18em] text-[#d8b979] font-semibold">${g.title}</span>
              </div>
              <div class="space-y-1.5">
                ${items.map((item) => buildTraitCardBtnHTML(item, false)).join('')}
              </div>
            </div>
          `;
        })
        .join('');
    } else {
      banner.innerHTML = linkifyHTML(formatInlineMd(bannerNotes[state.traitCat] || ''));
      const list = ABILITIES.filter((a) => a.group === state.traitCat);
      grid.className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2';
      grid.innerHTML = list.map((item) => buildTraitCardBtnHTML(item, false)).join('');
    }

    grid.querySelectorAll('[data-trait-card]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedTraitId = btn.getAttribute('data-trait-card');
        renderTraitsGrid();
        renderTraitSpotlight(true);
      });
    });
  }

  function buildTraitCardBtnHTML(item, showGroupTag) {
    const active = item.id === state.selectedTraitId;
    const mark = item.mandatorySpecialty
      ? '<span class="text-[#d8b979]" title="Специализация с 1-й точки">✦</span>'
      : item.isCustomSlot
      ? '<span class="text-[#a69f90]" title="Свободная ячейка">◇</span>'
      : '';
    return `
      <button type="button" data-trait-card="${item.id}"
        class="w-full text-left px-3.5 py-2.5 rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0dba8] ${
          active
            ? 'border-[#f0dba8]/85 bg-[#d8b979]/18 shadow-[0_0_20px_rgba(216,185,121,0.16)]'
            : 'border-[#d8b979]/22 bg-[#101916]/80 hover:border-[#d8b979]/55 hover:bg-[#15211d]'
        }">
        <div class="flex items-center justify-between gap-2">
          <span class="font-nouveau text-lg font-semibold text-[#f0eadc] leading-tight">${item.ru}</span>
          ${mark}
        </div>
        <div class="flex items-center justify-between gap-1 mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[#a69f90]">
          <span>${item.en}</span>
          ${showGroupTag ? `<span class="text-[#d8b979]">${item.groupRu}</span>` : ''}
        </div>
      </button>
    `;
  }

  function renderTraitSpotlight(scrollToPanel = false) {
    const spot = document.getElementById('trait-spotlight');
    if (!spot) return;
    const item = [...ATTRIBUTES, ...ABILITIES].find((x) => x.id === state.selectedTraitId) || ATTRIBUTES[0] || ABILITIES[0];
    if (!item) return;

    const badgeExtras = [
      `<span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-[#d8b979]/35 bg-[#d8b979]/10 text-[#d8b979]">${item.groupRu}</span>`
    ];
    if (item.mandatorySpecialty) {
      badgeExtras.push('<span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-[#f0dba8]/55 bg-[#d8b979]/18 text-[#f0dba8]">✦ Специализация с 1-й точки</span>');
    } else if (item.isCustomSlot) {
      badgeExtras.push('<span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-[#d8b979]/35 bg-[#0b110f]/75 text-[#a69f90]">◇ Свободная ячейка</span>');
    }

    const mechBox = item.mechanicNote
      ? `<div class="rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/70 px-4 py-3 text-xs sm:text-[13.5px] text-[#f0eadc]/92 leading-relaxed">
           <span class="font-semibold text-[#f0dba8]">◈ Особенность правила:</span> ${linkifyHTML(formatInlineMd(item.mechanicNote))}
         </div>`
      : '';

    const levelsHTML = (item.levels || [])
      .map(
        (lv) => `
        <div class="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3 rounded-lg border border-[#d8b979]/16 bg-[#0b110f]/52 px-3.5 py-2.5 text-xs sm:text-[13.5px]">
          <div class="flex items-center gap-2 shrink-0 sm:w-44">
            ${renderSmallDotsHTML(lv.dots, 5)}
            <span class="font-semibold text-[#f0dba8]">${lv.label}</span>
          </div>
          <div class="text-[#f0eadc]/90 leading-relaxed">${linkifyHTML(formatInlineMd(lv.text))}</div>
        </div>`
      )
      .join('');

    const specsHTML = `
      <div class="rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/58 p-3.5 space-y-2">
        <div class="text-[10.5px] uppercase tracking-[0.18em] text-[#d8b979]">${item.specialtiesLabel || 'Специализации'}</div>
        <div class="flex flex-wrap gap-1.5">
          ${(item.specialties || [])
            .map((s) => `<span class="px-2.5 py-0.5 rounded-full text-xs border border-[#d8b979]/25 bg-[#101916]/85 text-[#f0eadc]/88">${s}</span>`)
            .join('')}
        </div>
      </div>
    `;

    const possHTML =
      item.possessedBy && item.possessedBy.length
        ? `<div class="rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/58 p-3.5 space-y-2">
             <div class="text-[10.5px] uppercase tracking-[0.18em] text-[#d8b979]">У кого встречается</div>
             <p class="text-xs sm:text-[13.2px] text-[#f0eadc]/88 leading-relaxed">${item.possessedBy.join(', ')}.</p>
           </div>`
        : '';

    spot.innerHTML = `
      <div class="spotlight-anim relative z-10 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#d8b979]/20 pb-3">
          <div>
            <h3 class="font-nouveau text-3xl font-semibold text-[#f0eadc] !mt-0 !mb-0 leading-none">${item.ru}</h3>
            <div class="text-xs uppercase tracking-[0.16em] text-[#a69f90] mt-1">${item.en}</div>
          </div>
          <div class="flex flex-wrap gap-1.5">${badgeExtras.join('')}</div>
        </div>

        <p class="text-sm sm:text-[15px] text-[#f0eadc]/92 leading-relaxed">${linkifyHTML(formatInlineMd(item.desc))}</p>
        ${mechBox}

        <div class="space-y-1.5">${levelsHTML}</div>

        <div class="grid grid-cols-1 ${possHTML ? 'md:grid-cols-2' : ''} gap-3 pt-1">
          ${possHTML}
          ${specsHTML}
        </div>
      </div>
    `;

    if (scrollToPanel) {
      const rect = spot.getBoundingClientRect();
      if (rect.top < 60 || rect.top > window.innerHeight * 0.68) {
        spot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function renderTraitsScrollArea() {
    const area = document.getElementById('traits-scroll-area');
    if (!area) return;
    const renderSection = (title, items) => `
      <div class="space-y-3">
        <h3 class="font-nouveau text-2xl font-semibold text-[#f0dba8] border-b border-[#d8b979]/20 pb-2">${title}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${items
            .map(
              (item) => `
            <article class="nouveau-panel p-5 space-y-2.5">
              <div class="flex items-baseline justify-between gap-2 border-b border-[#d8b979]/15 pb-2">
                <h4 class="font-nouveau text-xl font-semibold text-[#f0eadc] !mt-0 !mb-0">${item.ru} <span class="text-xs font-sans font-normal text-[#a69f90]">(${item.en})</span></h4>
                ${item.mandatorySpecialty ? '<span class="text-[10px] text-[#f0dba8]">✦ спец. с 1-й точки</span>' : ''}
              </div>
              <p class="text-xs sm:text-[13.5px] leading-relaxed">${linkifyHTML(formatInlineMd(item.desc))}</p>
              ${item.mechanicNote ? `<p class="text-xs text-[#f0dba8]/90">${linkifyHTML(formatInlineMd(item.mechanicNote))}</p>` : ''}
              <div class="space-y-1 text-xs">
                ${(item.levels || [])
                  .map((lv) => `<div><strong class="text-[#f0dba8]">${'●'.repeat(lv.dots)} ${lv.label}:</strong> ${linkifyHTML(formatInlineMd(lv.text))}</div>`)
                  .join('')}
              </div>
              <p class="text-[11.5px] text-[#a69f90]"><strong>${item.specialtiesLabel || 'Специализации'}:</strong> ${(item.specialties || []).join(', ')}.</p>
            </article>`
            )
            .join('')}
        </div>
      </div>
    `;
    area.innerHTML =
      renderSection('Атрибуты (Attributes)', ATTRIBUTES) +
      renderSection('Таланты (Talents)', ABILITIES.filter((a) => a.group === 'talents')) +
      renderSection('Навыки (Skills)', ABILITIES.filter((a) => a.group === 'skills')) +
      renderSection('Познания (Knowledges)', ABILITIES.filter((a) => a.group === 'knowledges'));
  }

  /* ------------------------------------------------------------------------
     3F. WIDGET: BACKGROUNDS VAULT (10 BACKGROUNDS)
     ------------------------------------------------------------------------ */
  function initBackgroundsVault() {
    const mount = document.getElementById('backgrounds-widget-mount');
    if (!mount || !BACKGROUNDS.length) return;

    const params = new URLSearchParams(window.location.search);
    const qBg = params.get('bg');
    if (qBg && BACKGROUNDS.some((b) => b.id === qBg)) {
      state.selectedBgId = qBg;
    }

    const poolCount = BACKGROUNDS.filter((b) => b.poolable).length;
    const persCount = BACKGROUNDS.length - poolCount;
    const filters = [
      { id: 'all', label: `Все (${BACKGROUNDS.length})` },
      { id: 'poolable', label: `⇄ Объединяются в Мотли (${poolCount})` },
      { id: 'personal', label: `✦ Личные (${persCount})` }
    ];

    mount.innerHTML = `
      <section id="backgrounds-vault" class="space-y-6 my-8 scroll-mt-24">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979]">Опора в двух мирах · Десять Дополнений</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc] !mt-1 !mb-0 !border-0 !pb-0">
              Сокровищница Дополнений
            </h2>
          </div>
          <div class="no-print inline-flex rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1 self-start md:self-auto">
            <button type="button" id="bview-atlas" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ✦ Каталог
            </button>
            <button type="button" id="bview-scroll" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ☰ Книжный свиток
            </button>
          </div>
        </div>

        <div id="backgrounds-interactive-area" class="space-y-5">
          <div class="no-print flex flex-wrap items-center gap-1.5">
            ${filters
              .map(
                (f) => `
              <button type="button" data-bgf="${f.id}" class="bg-filter-btn px-3 py-1 rounded-full text-xs border transition">
                ${f.label}
              </button>`
              )
              .join('')}
          </div>

          <div id="bgs-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5"></div>
          <div id="bg-spotlight" class="nouveau-panel p-5 sm:p-7 scroll-mt-24" aria-live="polite"></div>
        </div>

        <div id="backgrounds-scroll-area" class="hidden space-y-5"></div>
        <div id="print-backgrounds-container" class="print-only space-y-3"></div>
      </section>
    `;

    document.getElementById('bview-atlas').addEventListener('click', () => {
      state.bgViewMode = 'atlas';
      syncBgViewMode();
    });
    document.getElementById('bview-scroll').addEventListener('click', () => {
      state.bgViewMode = 'scroll';
      syncBgViewMode();
    });
    mount.querySelectorAll('.bg-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.bgFilter = btn.getAttribute('data-bgf');
        renderBgsGrid();
      });
    });

    renderBgsGrid();
    renderBgSpotlight(false);
    renderBgsScrollArea();
    syncBgViewMode();
  }

  function syncBgViewMode() {
    const atlas = document.getElementById('backgrounds-interactive-area');
    const scroll = document.getElementById('backgrounds-scroll-area');
    const bAtl = document.getElementById('bview-atlas');
    const bScr = document.getElementById('bview-scroll');
    if (!atlas || !scroll) return;
    const isAtl = state.bgViewMode === 'atlas';
    atlas.classList.toggle('hidden', !isAtl);
    scroll.classList.toggle('hidden', isAtl);
    bAtl.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      isAtl ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
    bScr.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      !isAtl ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
  }

  function renderBgsGrid() {
    const grid = document.getElementById('bgs-grid');
    if (!grid) return;

    document.querySelectorAll('.bg-filter-btn').forEach((btn) => {
      const act = btn.getAttribute('data-bgf') === state.bgFilter;
      btn.className = `bg-filter-btn px-3 py-1 rounded-full text-xs border transition ${
        act
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });

    const filtered = BACKGROUNDS.filter((b) => {
      if (state.bgFilter === 'poolable') return b.poolable;
      if (state.bgFilter === 'personal') return !b.poolable;
      return true;
    });

    grid.innerHTML = filtered
      .map((b) => {
        const active = b.id === state.selectedBgId;
        return `
          <button type="button" data-bg-card="${b.id}"
            class="text-left p-3.5 rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0dba8] flex flex-col justify-between gap-2 ${
              active
                ? 'border-[#f0dba8]/85 bg-[#d8b979]/18 shadow-[0_0_22px_rgba(216,185,121,0.16)]'
                : 'border-[#d8b979]/22 bg-[#101916]/82 hover:border-[#d8b979]/55 hover:bg-[#15211d]'
            }">
            <div>
              <div class="flex items-center justify-between gap-1.5">
                <span class="font-nouveau text-xl font-semibold text-[#f0eadc] leading-tight">${b.ru}</span>
                <span class="w-2 h-2 rounded-full shrink-0" style="background-color:${b.auraHex};"></span>
              </div>
              <div class="text-[10px] uppercase tracking-[0.13em] text-[#a69f90] mt-0.5">${b.en}</div>
            </div>
            <span class="self-start px-2 py-0.5 rounded-full text-[10px] border ${
              b.poolable
                ? 'border-[#d8b979]/45 bg-[#d8b979]/12 text-[#f0dba8]'
                : 'border-[#d8b979]/20 bg-[#0b110f]/60 text-[#a69f90]'
            }">${b.poolable ? '⇄ Мотли' : '✦ Личное'}</span>
          </button>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-bg-card]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedBgId = btn.getAttribute('data-bg-card');
        renderBgsGrid();
        renderBgSpotlight(true);
      });
    });
  }

  function renderBgSpotlight(scrollToPanel = false) {
    const spot = document.getElementById('bg-spotlight');
    if (!spot) return;
    const b = BACKGROUNDS.find((x) => x.id === state.selectedBgId) || BACKGROUNDS[0];
    if (!b) return;

    const poolBadge = b.poolable
      ? '<span class="px-3 py-1 rounded-full text-xs border border-[#f0dba8]/55 bg-[#d8b979]/18 text-[#f0dba8]">⇄ Объединяется в Мотли</span>'
      : '<span class="px-3 py-1 rounded-full text-xs border border-[#d8b979]/30 bg-[#0b110f]/75 text-[#a69f90]">✦ Личное Дополнение</span>';

    let tracksHTML = '';
    if (b.subtracks && b.subtracks.length) {
      tracksHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          ${b.subtracks
            .map(
              (st) => `
            <div class="rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/58 p-4 space-y-3">
              <div class="border-b border-[#d8b979]/15 pb-2">
                <h4 class="font-nouveau text-xl font-semibold text-[#f0dba8] !mt-0 !mb-0">${st.title}</h4>
                <div class="text-[10.5px] uppercase tracking-[0.14em] text-[#a69f90]">${st.en}</div>
              </div>
              <p class="text-xs sm:text-[13.2px] text-[#f0eadc]/88 leading-relaxed">${linkifyHTML(formatInlineMd(st.desc))}</p>
              <div class="space-y-1.5">
                ${(st.levels || [])
                  .map(
                    (lv) => `
                  <div class="flex items-start gap-2.5 text-xs leading-relaxed">
                    <div class="pt-1">${renderSmallDotsHTML(lv.dots, 5)}</div>
                    <div class="text-[#f0eadc]/92">${linkifyHTML(formatInlineMd(lv.text))}</div>
                  </div>`
                  )
                  .join('')}
              </div>
            </div>`
            )
            .join('')}
        </div>`;
    } else {
      tracksHTML = `
        <div class="space-y-1.5 pt-1">
          ${(b.levels || [])
            .map(
              (lv) => `
            <div class="flex items-start sm:items-center gap-3 rounded-lg border border-[#d8b979]/16 bg-[#0b110f]/55 px-3.5 py-2.5 text-xs sm:text-[13.5px]">
              <div class="pt-1 sm:pt-0">${renderSmallDotsHTML(lv.dots, 5)}</div>
              <div class="text-[#f0eadc]/92 leading-relaxed">${linkifyHTML(formatInlineMd(lv.text))}</div>
            </div>`
            )
            .join('')}
        </div>`;
    }

    spot.innerHTML = `
      <div class="spotlight-anim relative z-10 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#d8b979]/20 pb-3">
          <div>
            <h3 class="font-nouveau text-3xl font-semibold text-[#f0eadc] !mt-0 !mb-0 leading-none">${b.ru}</h3>
            <div class="text-xs uppercase tracking-[0.16em] text-[#a69f90] mt-1">${b.en}</div>
          </div>
          ${poolBadge}
        </div>

        <div class="space-y-2.5 text-sm sm:text-[15px] text-[#f0eadc]/92 leading-relaxed">
          ${(b.desc || []).map((p) => `<p>${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
        </div>

        ${
          b.mechanicNote
            ? `<div class="rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/70 px-4 py-3 text-xs sm:text-[13.5px] text-[#f0eadc]/92 leading-relaxed">
                 <span class="font-semibold text-[#f0dba8]">◈ Игровая механика:</span> ${linkifyHTML(formatInlineMd(b.mechanicNote))}
               </div>`
            : ''
        }

        ${tracksHTML}
      </div>
    `;

    if (scrollToPanel) {
      const rect = spot.getBoundingClientRect();
      if (rect.top < 60 || rect.top > window.innerHeight * 0.68) {
        spot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function renderBgsScrollArea() {
    const area = document.getElementById('backgrounds-scroll-area');
    if (!area) return;
    area.innerHTML = BACKGROUNDS.map((b) => {
      const subHTML =
        b.subtracks && b.subtracks.length
          ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
               ${b.subtracks
                 .map(
                   (st) => `
                 <div class="rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/55 p-3.5 space-y-1.5">
                   <div class="font-semibold text-xs text-[#f0dba8]">${st.title} (${st.en})</div>
                   <p class="text-[11.5px] text-[#a69f90] leading-relaxed">${linkifyHTML(formatInlineMd(st.desc))}</p>
                   <div class="space-y-1 text-xs">
                     ${(st.levels || []).map((lv) => `<div><strong class="text-[#f0dba8]">${'●'.repeat(lv.dots)}:</strong> ${linkifyHTML(formatInlineMd(lv.text))}</div>`).join('')}
                   </div>
                 </div>`
                 )
                 .join('')}
             </div>`
          : `<div class="space-y-1 text-xs sm:text-[13px]">
               ${(b.levels || []).map((lv) => `<div><strong class="text-[#f0dba8]">${'●'.repeat(lv.dots)}:</strong> ${linkifyHTML(formatInlineMd(lv.text))}</div>`).join('')}
             </div>`;

      return `
        <article class="nouveau-panel p-5 space-y-2.5">
          <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#d8b979]/15 pb-2">
            <h3 class="font-nouveau text-2xl font-semibold text-[#f0eadc] !mt-0 !mb-0">${b.ru} <span class="text-xs font-sans font-normal text-[#a69f90]">(${b.en})</span></h3>
            <span class="text-[11px] text-[#d8b979]">${b.poolable ? '⇄ Объединяется в Мотли' : '✦ Личное'}</span>
          </div>
          ${(b.desc || []).map((p) => `<p class="text-xs sm:text-[13.5px] leading-relaxed">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
          ${b.mechanicNote ? `<p class="text-xs text-[#f0dba8]/90">${linkifyHTML(formatInlineMd(b.mechanicNote))}</p>` : ''}
          ${subHTML}
        </article>`;
    }).join('');
  }

  /* ------------------------------------------------------------------------
     3G. WIDGET: MERITS & FLAWS ATLAS (121 TRAITS + 7 ANIMAL FEATURES)
     ------------------------------------------------------------------------ */
  const MF_CATEGORIES = {
    physical: 'Физические',
    mental: 'Ментальные',
    social: 'Социальные',
    supernatural: 'Сверхъестественные'
  };

  function mfExcludeLexId(m) {
    if (!m) return null;
    if (m.id === 'echoes') return 'echoes';
    if (m.id === 'geas') return 'geas';
    return null;
  }

  function mfKindMeta(kind) {
    if (kind === 'merit') {
      return {
        label: 'Достоинство',
        pillClass: 'border-[#f0dba8]/55 bg-[#d8b979]/15 text-[#f0dba8]'
      };
    }
    if (kind === 'flaw') {
      return {
        label: 'Недостаток',
        pillClass: 'border-[#d98a7c]/45 bg-[#d98a7c]/12 text-[#f0b4a8]'
      };
    }
    return {
      label: 'Достоинство / Недостаток',
      pillClass: 'border-[#c4a8ff]/45 bg-[#c4a8ff]/12 text-[#dfd0ff]'
    };
  }

  function mfEffectiveCosts(m) {
    if (m.kind === 'both') {
      if (state.mfKindFilter === 'merit' && typeof m.meritCost === 'number') return [m.meritCost];
      if (state.mfKindFilter === 'flaw' && typeof m.flawCost === 'number') return [m.flawCost];
    }
    return Array.isArray(m.costs) ? m.costs : [];
  }

  function mfAnimalTableHTML(compact = false) {
    if (!ANIMAL_FEATURES.length) return '';
    return `
      <div class="rounded-xl border border-[#d8b979]/28 bg-[#0b110f]/68 p-3.5 sm:p-4 space-y-2.5">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h4 class="font-nouveau ${compact ? 'text-lg' : 'text-xl'} font-semibold text-[#f0dba8] !mt-0 !mb-0">
            Таблица Звериных черт (Animal Features)
          </h4>
          <span class="text-[11px] text-[#a69f90]">3–5 очков · Боевой запас персонажа</span>
        </div>
        <div class="overflow-x-auto">
          <table class="nouveau-table w-full text-xs">
            <thead>
              <tr>
                <th>Черта</th>
                <th>Цена</th>
                <th>Эффект в игре</th>
              </tr>
            </thead>
            <tbody>
              ${ANIMAL_FEATURES.map(
                (af) => `
                <tr>
                  <td class="whitespace-nowrap">
                    <strong class="text-[#f0eadc]">${af.ru}</strong>
                    <span class="block text-[10px] uppercase tracking-wider text-[#a69f90]">${af.en}</span>
                  </td>
                  <td class="whitespace-nowrap font-medium text-[#f0dba8]">${af.cost} очк.</td>
                  <td class="text-[#f0eadc]/90">${linkifyHTML(formatInlineMd(af.effect))}</td>
                </tr>`
              ).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function initMeritsFlawsAtlas() {
    const mount = document.getElementById('merits-flaws-widget-mount');
    if (!mount || !MF_ITEMS.length) return;

    const params = new URLSearchParams(window.location.search);
    const qMf = params.get('mf');
    if (qMf && MF_ITEMS.some((m) => m.id === qMf)) {
      state.selectedMfId = qMf;
    } else if (!MF_ITEMS.some((m) => m.id === state.selectedMfId)) {
      state.selectedMfId = MF_ITEMS[0].id;
    }

    const totalCount = MF_ITEMS.length;
    const meritCount = MF_ITEMS.filter((m) => m.kind === 'merit' || m.kind === 'both').length;
    const flawCount = MF_ITEMS.filter((m) => m.kind === 'flaw' || m.kind === 'both').length;

    const kindFilters = [
      { id: 'all', label: `Все (${totalCount})` },
      { id: 'merit', label: `✦ Достоинства (${meritCount})` },
      { id: 'flaw', label: `❖ Недостатки (${flawCount})` }
    ];

    const catFilters = [
      { id: 'all', label: 'Все категории' },
      ...Object.entries(MF_CATEGORIES).map(([id, title]) => ({
        id,
        label: `${title} (${MF_ITEMS.filter((m) => m.category === id).length})`
      }))
    ];

    const costFilters = [
      { id: 'all', label: 'Любая цена' },
      { id: '1', label: '1 очко' },
      { id: '2', label: '2 очка' },
      { id: '3', label: '3 очка' },
      { id: '4', label: '4 очка' },
      { id: '5+', label: '5+ очков' }
    ];

    mount.innerHTML = `
      <section id="merits-flaws-atlas" class="space-y-6 my-8 scroll-mt-24">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979] !mt-0 !mb-0">Узоры судьбы и характера · Свод 121 черты</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc] !mt-1 !mb-0 !border-0 !pb-0">
              Атлас Достоинств и Недостатков
            </h2>
          </div>
          <div class="no-print inline-flex rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1 self-start md:self-auto">
            <button type="button" id="mfview-atlas" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ✦ Атлас черт
            </button>
            <button type="button" id="mfview-scroll" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ☰ Книжный свиток
            </button>
          </div>
        </div>

        <div id="mf-interactive-area" class="space-y-4">
          <div id="mf-tracker-bar" class="no-print rounded-xl border border-[#d8b979]/28 bg-[#0b110f]/72 px-4 py-3 space-y-2"></div>

          <div class="no-print space-y-2.5">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div class="flex flex-wrap gap-1.5">
                ${kindFilters
                  .map(
                    (f) => `
                  <button type="button" data-mf-kind="${f.id}" class="mf-kind-btn px-3 py-1 rounded-full text-xs border transition">
                    ${f.label}
                  </button>`
                  )
                  .join('')}
              </div>
              <input type="search" id="mf-search-input" placeholder="Поиск по названию, цене или эффекту..."
                class="w-full sm:w-64 rounded-full border border-[#d8b979]/30 bg-[#0b110f]/75 px-3.5 py-1.5 text-xs text-[#f0eadc] placeholder-[#7b7669] focus:outline-none focus:border-[#f0dba8]" />
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap gap-1.5">
                ${catFilters
                  .map(
                    (c) => `
                  <button type="button" data-mf-cat="${c.id}" class="mf-cat-btn px-2.5 py-1 rounded-full text-[11.5px] border transition">
                    ${c.label}
                  </button>`
                  )
                  .join('')}
              </div>
              <div class="flex flex-wrap gap-1">
                ${costFilters
                  .map(
                    (cf) => `
                  <button type="button" data-mf-cost="${cf.id}" class="mf-cost-btn px-2.5 py-1 rounded-full text-[11px] border transition">
                    ${cf.label}
                  </button>`
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <div id="mf-count-line" class="no-print flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#a69f90]"></div>

          <div id="mf-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[390px] overflow-y-auto pr-1.5 rounded-xl border border-[#d8b979]/18 bg-[#0b110f]/35 p-2.5"></div>

          <div id="mf-spotlight" class="nouveau-panel p-5 sm:p-7 scroll-mt-24" aria-live="polite"></div>
        </div>

        <div id="mf-scroll-area" class="hidden space-y-6 no-print"></div>
        <div id="print-merits-flaws-container" class="print-only space-y-3"></div>
      </section>
    `;

    document.getElementById('mfview-atlas').addEventListener('click', () => {
      state.mfViewMode = 'atlas';
      syncMfViewMode();
    });
    document.getElementById('mfview-scroll').addEventListener('click', () => {
      state.mfViewMode = 'scroll';
      syncMfViewMode();
    });
    mount.querySelectorAll('.mf-kind-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.mfKindFilter = btn.getAttribute('data-mf-kind');
        renderMfGrid();
      });
    });
    mount.querySelectorAll('.mf-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.mfCatFilter = btn.getAttribute('data-mf-cat');
        renderMfGrid();
      });
    });
    mount.querySelectorAll('.mf-cost-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.mfCostFilter = btn.getAttribute('data-mf-cost');
        renderMfGrid();
      });
    });
    document.getElementById('mf-search-input').addEventListener('input', (e) => {
      state.mfQuery = e.target.value.trim().toLowerCase();
      renderMfGrid();
    });

    renderMfTracker();
    renderMfGrid();
    renderMfSpotlight(false);
    renderMfScrollArea();
    syncMfViewMode();
  }

  function syncMfViewMode() {
    const atlas = document.getElementById('mf-interactive-area');
    const scroll = document.getElementById('mf-scroll-area');
    const bAtl = document.getElementById('mfview-atlas');
    const bScr = document.getElementById('mfview-scroll');
    if (!atlas || !scroll) return;
    const isAtl = state.mfViewMode === 'atlas';
    atlas.classList.toggle('hidden', !isAtl);
    scroll.classList.toggle('hidden', isAtl);
    bAtl.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      isAtl ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
    bScr.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      !isAtl ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
  }

  function toggleMfChoice(m, kind, cost) {
    const uid = `${m.id}:${kind}:${cost}`;
    const already = state.selectedMfChoices.some((c) => c.uid === uid);
    if (already) {
      state.selectedMfChoices = state.selectedMfChoices.filter((c) => c.uid !== uid);
    } else {
      state.selectedMfChoices = [
        ...state.selectedMfChoices.filter((c) => c.id !== m.id),
        { id: m.id, ru: m.ru, kind, cost, uid }
      ];
    }
    renderMfTracker();
    renderMfGrid();
    renderMfSpotlight(false);
  }

  function renderMfTracker() {
    const bar = document.getElementById('mf-tracker-bar');
    if (!bar) return;

    const rawFlaws = state.selectedMfChoices.filter((c) => c.kind === 'flaw').reduce((acc, c) => acc + c.cost, 0);
    const cappedFlaws = Math.min(rawFlaws, 7);
    const meritSpent = state.selectedMfChoices.filter((c) => c.kind === 'merit').reduce((acc, c) => acc + c.cost, 0);
    const totalFreebies = 15 + cappedFlaws;
    const remaining = totalFreebies - meritSpent;

    const overCapNote =
      rawFlaws > 7
        ? `<div class="text-[11.5px] text-[#f0b4a8] leading-snug">Предел Недостатков превышен (${rawFlaws} из 7): сверх 7 очков новые Свободные очки не начисляются (потолок — 22 очка с учётом 15 базовых).</div>`
        : '';
    const deficitNote =
      remaining < 0
        ? `<div class="text-[11.5px] text-[#f0b4a8] leading-snug">Выбранные Достоинства требуют на ${Math.abs(remaining)} Свободных очк. больше, чем есть в запасе.</div>`
        : '';

    const chipsHTML = state.selectedMfChoices.length
      ? `<div class="flex flex-wrap items-center gap-1.5 pt-1">
           ${state.selectedMfChoices
             .map(
               (c) => `
             <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border ${
               c.kind === 'merit'
                 ? 'border-[#d8b979]/45 bg-[#d8b979]/12 text-[#f0dba8]'
                 : 'border-[#d98a7c]/45 bg-[#d98a7c]/12 text-[#f0b4a8]'
             }">
               <button type="button" data-mf-jump="${c.id}" class="hover:underline text-left">${c.ru} (${c.kind === 'merit' ? `−${c.cost}` : `+${c.cost}`})</button>
               <button type="button" data-mf-remove="${c.uid}" class="opacity-75 hover:opacity-100 leading-none" aria-label="Убрать ${c.ru}">✕</button>
             </span>`
             )
             .join('')}
           <button type="button" id="mf-clear-choices" class="ml-auto text-[11px] text-[#a69f90] hover:text-[#f0dba8] underline decoration-dotted">Сбросить отбор</button>
         </div>`
      : `<div class="text-[11px] text-[#7b7669]">Отмечайте черты прямо в карточке внизу, чтобы примерить бюджет Свободных очков для будущего персонажа.</div>`;

    bar.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs font-medium text-[#f0dba8]">Отбор черт для образа · Свободные очки</div>
        <div class="flex flex-wrap items-center gap-1.5 text-[11.5px]">
          <span class="px-2.5 py-0.5 rounded-full border border-[#d8b979]/25 bg-[#101916] text-[#a69f90]">База: <strong class="text-[#f0eadc]">15</strong></span>
          <span class="px-2.5 py-0.5 rounded-full border ${rawFlaws > 7 ? 'border-[#d98a7c]/55 bg-[#d98a7c]/12 text-[#f0b4a8]' : 'border-[#d8b979]/25 bg-[#101916] text-[#a69f90]'}">
            Недостатки: <strong class="${rawFlaws > 7 ? 'text-[#f0b4a8]' : 'text-[#f0dba8]'}">+${cappedFlaws}</strong> <span class="opacity-80">(${rawFlaws}/7)</span>
          </span>
          <span class="px-2.5 py-0.5 rounded-full border border-[#d8b979]/25 bg-[#101916] text-[#a69f90]">Достоинства: <strong class="text-[#f0eadc]">−${meritSpent}</strong></span>
          <span class="px-2.5 py-0.5 rounded-full border ${remaining < 0 ? 'border-[#d98a7c]/60 bg-[#d98a7c]/15 text-[#f0b4a8]' : 'border-[#f0dba8]/45 bg-[#d8b979]/15 text-[#f0dba8]'}">
            Остаток: <strong>${remaining}</strong> <span class="opacity-80">(из ${totalFreebies})</span>
          </span>
        </div>
      </div>
      ${chipsHTML}
      ${overCapNote}
      ${deficitNote}
    `;

    bar.querySelectorAll('[data-mf-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedMfId = btn.getAttribute('data-mf-jump');
        renderMfGrid();
        renderMfSpotlight(true);
      });
    });
    bar.querySelectorAll('[data-mf-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-mf-remove');
        state.selectedMfChoices = state.selectedMfChoices.filter((c) => c.uid !== uid);
        renderMfTracker();
        renderMfGrid();
        renderMfSpotlight(false);
      });
    });
    const clearBtn = document.getElementById('mf-clear-choices');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.selectedMfChoices = [];
        renderMfTracker();
        renderMfGrid();
        renderMfSpotlight(false);
      });
    }
  }

  function renderMfGrid() {
    const grid = document.getElementById('mf-grid');
    const countLine = document.getElementById('mf-count-line');
    if (!grid) return;

    document.querySelectorAll('.mf-kind-btn').forEach((btn) => {
      const act = btn.getAttribute('data-mf-kind') === state.mfKindFilter;
      btn.className = `mf-kind-btn px-3 py-1 rounded-full text-xs border transition ${
        act
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });
    document.querySelectorAll('.mf-cat-btn').forEach((btn) => {
      const act = btn.getAttribute('data-mf-cat') === state.mfCatFilter;
      btn.className = `mf-cat-btn px-2.5 py-1 rounded-full text-[11.5px] border transition ${
        act
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/22 bg-[#0b110f]/50 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });
    document.querySelectorAll('.mf-cost-btn').forEach((btn) => {
      const act = btn.getAttribute('data-mf-cost') === state.mfCostFilter;
      btn.className = `mf-cost-btn px-2.5 py-1 rounded-full text-[11px] border transition ${
        act
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/20 bg-[#0b110f]/50 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });

    const filtered = MF_ITEMS.filter((m) => {
      if (state.mfKindFilter !== 'all') {
        if (m.kind !== state.mfKindFilter && m.kind !== 'both') return false;
      }
      if (state.mfCatFilter !== 'all' && m.category !== state.mfCatFilter) return false;
      if (state.mfCostFilter !== 'all') {
        const effCosts = mfEffectiveCosts(m);
        if (state.mfCostFilter === '5+') {
          if (!effCosts.some((c) => c >= 5)) return false;
        } else if (!effCosts.includes(Number(state.mfCostFilter))) {
          return false;
        }
      }
      if (state.mfQuery) {
        const tiersStr = (m.tiers || []).map((t) => `${t.cost} ${t.text}`).join(' ');
        const hay = `${m.ru} ${m.en} ${m.costLabel} ${(m.desc || []).join(' ')} ${m.mechanicNote || ''} ${tiersStr}`.toLowerCase();
        if (!hay.includes(state.mfQuery)) return false;
      }
      return true;
    });

    if (countLine) {
      const isFiltered =
        state.mfKindFilter !== 'all' ||
        state.mfCatFilter !== 'all' ||
        state.mfCostFilter !== 'all' ||
        Boolean(state.mfQuery);
      countLine.innerHTML = `
        <span>Показано черт: <strong class="text-[#f0eadc]">${filtered.length}</strong> из ${MF_ITEMS.length}</span>
        ${isFiltered ? '<button type="button" id="mf-reset-filters" class="text-[#d8b979] hover:text-[#f0dba8] underline decoration-dotted">Сбросить фильтры</button>' : ''}
      `;
      const rst = document.getElementById('mf-reset-filters');
      if (rst) {
        rst.addEventListener('click', () => {
          state.mfKindFilter = 'all';
          state.mfCatFilter = 'all';
          state.mfCostFilter = 'all';
          state.mfQuery = '';
          const inp = document.getElementById('mf-search-input');
          if (inp) inp.value = '';
          renderMfGrid();
        });
      }
    }

    if (!filtered.length) {
      grid.innerHTML = `<div class="col-span-full text-center py-8 text-xs text-[#a69f90]">Ни одна черта не подходит под выбранные условия.</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((m) => {
        const active = m.id === state.selectedMfId;
        const km = mfKindMeta(m.kind);
        const picked = state.selectedMfChoices.find((c) => c.id === m.id);
        return `
          <button type="button" data-mf-card="${m.id}"
            class="text-left p-3 rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0dba8] flex flex-col justify-between gap-2 ${
              active
                ? 'border-[#f0dba8]/85 bg-[#d8b979]/18 shadow-[0_0_20px_rgba(216,185,121,0.16)]'
                : 'border-[#d8b979]/20 bg-[#101916]/85 hover:border-[#d8b979]/55 hover:bg-[#15211d]'
            }">
            <div>
              <div class="flex items-start justify-between gap-1.5">
                <span class="font-nouveau text-lg sm:text-[19px] font-semibold text-[#f0eadc] leading-tight">${m.ru}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] border border-[#d8b979]/30 bg-[#0b110f]/75 text-[#f0dba8] shrink-0">${m.costLabel}</span>
              </div>
              <div class="text-[10px] uppercase tracking-[0.12em] text-[#a69f90] mt-0.5">${m.en}</div>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-1 pt-0.5">
              <span class="px-2 py-0.5 rounded-full text-[10px] border ${km.pillClass}">${km.label}</span>
              <span class="text-[10px] text-[#7b7669]">${picked ? `<strong class="text-[#f0dba8]">✓ ${picked.cost} очк.</strong> · ` : ''}${MF_CATEGORIES[m.category] || m.category}</span>
            </div>
          </button>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-mf-card]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedMfId = btn.getAttribute('data-mf-card');
        renderMfGrid();
        renderMfSpotlight(true);
      });
    });
  }

  function renderMfSpotlight(scrollToPanel = false) {
    const spot = document.getElementById('mf-spotlight');
    if (!spot) return;
    const m = MF_ITEMS.find((x) => x.id === state.selectedMfId) || MF_ITEMS[0];
    if (!m) return;

    const exId = mfExcludeLexId(m);
    const km = mfKindMeta(m.kind);
    const catLabel = MF_CATEGORIES[m.category] || m.category;

    const pickOptions =
      m.kind === 'both'
        ? [
            { kind: 'flaw', cost: m.flawCost, label: `Недостаток (+${m.flawCost} очк.)` },
            { kind: 'merit', cost: m.meritCost, label: `Достоинство (−${m.meritCost} очк.)` }
          ]
        : (m.costs || []).map((c) => ({
            kind: m.kind,
            cost: c,
            label: (m.costs || []).length > 1 ? `${c} очк.` : `Отметить в образе (${m.kind === 'merit' ? `−${c}` : `+${c}`} очк.)`
          }));

    const pickerHTML = `
      <div class="no-print flex flex-wrap items-center gap-1.5 pt-1">
        ${pickOptions.length > 1 ? '<span class="text-[11.5px] text-[#a69f90] mr-1">Отметить в образе:</span>' : ''}
        ${pickOptions
          .map((opt) => {
            const uid = `${m.id}:${opt.kind}:${opt.cost}`;
            const chosen = state.selectedMfChoices.some((c) => c.uid === uid);
            return `
              <button type="button" data-pick-kind="${opt.kind}" data-pick-cost="${opt.cost}"
                class="mf-pick-btn px-3 py-1 rounded-full text-xs border transition ${
                  chosen
                    ? 'border-[#f0dba8]/85 bg-[#d8b979]/25 text-[#f0dba8]'
                    : 'border-[#d8b979]/35 bg-[#0b110f]/75 text-[#a69f90] hover:text-[#f0dba8] hover:border-[#d8b979]/70'
                }">
                ${chosen ? '✓ ' : '+ '}${opt.label}
              </button>`;
          })
          .join('')}
      </div>
    `;

    const tiersHTML =
      m.tiers && m.tiers.length
        ? `
      <div class="space-y-1.5 pt-1">
        ${m.tiers
          .map(
            (t) => `
          <div class="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3 rounded-lg border border-[#d8b979]/18 bg-[#0b110f]/58 px-3.5 py-2.5 text-xs sm:text-[13.5px]">
            <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-[#d8b979]/35 bg-[#d8b979]/12 text-[#f0dba8] shrink-0 self-start">${t.cost}</span>
            <div class="text-[#f0eadc]/92 leading-relaxed">${linkifyHTML(formatInlineMd(t.text), exId)}</div>
          </div>`
          )
          .join('')}
      </div>`
        : '';

    const animalHTML = m.id === 'animalistic_favor' ? mfAnimalTableHTML(false) : '';

    spot.innerHTML = `
      <div class="spotlight-anim relative z-10 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#d8b979]/20 pb-3">
          <div>
            <h3 class="font-nouveau text-3xl font-semibold text-[#f0eadc] !mt-0 !mb-0 leading-none">${m.ru}</h3>
            <div class="text-xs uppercase tracking-[0.16em] text-[#a69f90] mt-1">${m.en}</div>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="px-2.5 py-1 rounded-full text-xs border ${km.pillClass}">${km.label}</span>
            <span class="px-2.5 py-1 rounded-full text-xs border border-[#d8b979]/28 bg-[#0b110f]/75 text-[#a69f90]">${catLabel}</span>
            <span class="px-2.5 py-1 rounded-full text-xs font-medium border border-[#f0dba8]/45 bg-[#d8b979]/15 text-[#f0dba8]">${m.costLabel}</span>
          </div>
        </div>

        <div class="space-y-2.5 text-sm sm:text-[15px] text-[#f0eadc]/92 leading-relaxed">
          ${(m.desc || []).map((p) => `<p class="!my-0">${linkifyHTML(formatInlineMd(p), exId)}</p>`).join('')}
        </div>

        ${
          m.mechanicNote
            ? `<div class="rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/70 px-4 py-3 text-xs sm:text-[13.5px] text-[#f0eadc]/92 leading-relaxed">
                 <span class="font-semibold text-[#f0dba8]">◈ Игровая механика:</span> ${linkifyHTML(formatInlineMd(m.mechanicNote), exId)}
               </div>`
            : ''
        }

        ${tiersHTML}
        ${animalHTML}
        ${pickerHTML}
      </div>
    `;

    spot.querySelectorAll('.mf-pick-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pickKind = btn.getAttribute('data-pick-kind');
        const pickCost = Number(btn.getAttribute('data-pick-cost'));
        toggleMfChoice(m, pickKind, pickCost);
      });
    });

    if (scrollToPanel) {
      const rect = spot.getBoundingClientRect();
      if (rect.top < 60 || rect.top > window.innerHeight * 0.72) {
        spot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function renderMfScrollArea() {
    const area = document.getElementById('mf-scroll-area');
    if (!area) return;

    area.innerHTML = Object.entries(MF_CATEGORIES)
      .map(([catId, catTitle]) => {
        const items = MF_ITEMS.filter((m) => m.category === catId);
        return `
          <div class="space-y-4">
            <div class="flex items-baseline justify-between border-b border-[#d8b979]/25 pb-2">
              <h3 class="font-nouveau text-2xl sm:text-3xl font-semibold text-[#f0dba8] !mt-0 !mb-0">${catTitle} черты</h3>
              <span class="text-xs text-[#a69f90]">${items.length}</span>
            </div>
            <div class="space-y-4">
              ${items
                .map((m) => {
                  const km = mfKindMeta(m.kind);
                  const exId = mfExcludeLexId(m);
                  const tiersHTML =
                    m.tiers && m.tiers.length
                      ? `<div class="space-y-1 text-xs sm:text-[13px] pt-1">
                           ${m.tiers
                             .map((t) => `<div><strong class="text-[#f0dba8]">${t.cost}:</strong> ${linkifyHTML(formatInlineMd(t.text), exId)}</div>`)
                             .join('')}
                         </div>`
                      : '';
                  const animalHTML = m.id === 'animalistic_favor' ? mfAnimalTableHTML(true) : '';
                  return `
                    <article class="nouveau-panel p-4 sm:p-5 space-y-2.5">
                      <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#d8b979]/15 pb-2">
                        <h4 class="font-nouveau text-2xl font-semibold text-[#f0eadc] !mt-0 !mb-0">${m.ru} <span class="text-xs font-sans font-normal text-[#a69f90]">(${m.en})</span></h4>
                        <div class="flex items-center gap-1.5 text-[11px]">
                          <span class="px-2 py-0.5 rounded-full border ${km.pillClass}">${km.label}</span>
                          <span class="text-[#f0dba8] font-medium">${m.costLabel}</span>
                        </div>
                      </div>
                      ${(m.desc || []).map((p) => `<p class="text-xs sm:text-[13.5px] leading-relaxed !my-0">${linkifyHTML(formatInlineMd(p), exId)}</p>`).join('')}
                      ${m.mechanicNote ? `<p class="text-xs text-[#f0dba8]/90 !my-0"><strong class="text-[#f0dba8]">◈ Игровая механика:</strong> ${linkifyHTML(formatInlineMd(m.mechanicNote), exId)}</p>` : ''}
                      ${tiersHTML}
                      ${animalHTML}
                    </article>`;
                })
                .join('')}
            </div>
          </div>
        `;
      })
      .join('');
  }

  /* ------------------------------------------------------------------------
     3H. WIDGETS: CANTRIP FORGE (CALCULATOR, UNLEASHING & 42 BUNKS) + REALMS ATLAS
     ------------------------------------------------------------------------ */
  function cfStepperHTML(key, label, val, min, max, hint = '') {
    return `
      <div class="rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/68 px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div>
          <div class="text-xs font-medium text-[#f0eadc]">${label}</div>
          ${hint ? `<div class="text-[10.5px] text-[#a69f90]">${hint}</div>` : ''}
        </div>
        <div class="inline-flex items-center gap-1.5 shrink-0">
          <button type="button" data-cf-step="${key}" data-cf-dir="-1" ${val <= min ? 'disabled' : ''}
            class="w-7 h-7 rounded-full border border-[#d8b979]/35 bg-[#101916] text-sm text-[#f0dba8] hover:border-[#f0dba8] disabled:opacity-35 transition">−</button>
          <span class="w-6 text-center font-nouveau text-xl font-bold text-[#f0dba8]">${val}</span>
          <button type="button" data-cf-step="${key}" data-cf-dir="1" ${val >= max ? 'disabled' : ''}
            class="w-7 h-7 rounded-full border border-[#d8b979]/35 bg-[#101916] text-sm text-[#f0dba8] hover:border-[#f0dba8] disabled:opacity-35 transition">+</button>
        </div>
      </div>`;
  }

  function initCantripForge() {
    const mount = document.getElementById('cantrip-forge-widget-mount');
    if (!mount || (!CANTRIP_MODS.length && !BUNK_EXAMPLES.length)) return;

    const tabs = [
      { id: 'cantrip', label: '✦ Расчёт Кантрипа' },
      { id: 'unleash', label: '⚡ Высвобождение' },
      { id: 'bunks', label: `🎭 Примеры Уловок (${BUNK_EXAMPLES.length})` }
    ];

    mount.innerHTML = `
      <section id="cantrip-forge" class="space-y-5 my-8 scroll-mt-24">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979] !mt-0 !mb-0">Плетение чар и театр Грёзы · Справочная панель</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc] !mt-1 !mb-0 !border-0 !pb-0">
              Расчёт Кантрипа и каталог Уловок
            </h2>
          </div>
          <div class="no-print flex flex-wrap gap-1.5 rounded-2xl sm:rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1 self-start md:self-auto">
            ${tabs
              .map(
                (t) => `
              <button type="button" data-cf-tab="${t.id}" class="cf-tab-btn px-3 py-1.5 rounded-full text-xs font-medium transition">
                ${t.label}
              </button>`
              )
              .join('')}
          </div>
        </div>

        <div id="cantrip-forge-interactive" class="nouveau-panel p-5 sm:p-7"></div>
        <div id="print-bunks-container" class="print-only space-y-3"></div>
      </section>
    `;

    mount.querySelectorAll('.cf-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.cfTab = btn.getAttribute('data-cf-tab');
        renderCantripForge();
      });
    });

    renderCantripForge();
  }

  function renderCantripForge() {
    const body = document.getElementById('cantrip-forge-interactive');
    if (!body) return;

    document.querySelectorAll('.cf-tab-btn').forEach((btn) => {
      const act = btn.getAttribute('data-cf-tab') === state.cfTab;
      btn.className = `cf-tab-btn px-3 py-1.5 rounded-full text-xs font-medium transition ${
        act ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
      }`;
    });

    if (state.cfTab === 'cantrip') {
      const basePool = state.cfArt + state.cfRealm;
      const baseNm = Math.min(basePool, state.cfNightmare);
      const normalBeforeVol = basePool - baseNm;
      const canVoluntary = normalBeforeVol >= 3;
      const volActive = canVoluntary && state.cfMods.voluntary_nightmare;
      const finalNm = baseNm + (volActive ? 3 : 0);
      const finalNormal = basePool - finalNm;

      const glamourCost = (state.cfWyrd ? 1 : 0) + state.cfCheated;

      let diffSum = 8 + state.cfBunk;
      const breakdown = ['8 (база)'];
      if (state.cfBunk !== 0) breakdown.push(`−${Math.abs(state.cfBunk)} (Уловка)`);

      CANTRIP_MODS.forEach((cm) => {
        if (cm.id === 'bunk' || typeof cm.mod !== 'number') return;
        if (cm.id === 'voluntary_nightmare') {
          if (volActive) {
            diffSum += cm.mod;
            breakdown.push(`${cm.modLabel} (+3 куб. Кошмара)`);
          }
          return;
        }
        if (state.cfMods[cm.id]) {
          diffSum += cm.mod;
          breakdown.push(`${cm.modLabel} (${cm.ru})`);
        }
      });

      const shownDiff = Math.max(3, Math.min(10, diffSum));
      const diffNote =
        diffSum < 3
          ? `расчёт ${diffSum}, обычно не ниже 3`
          : diffSum > 10
          ? `расчёт ${diffSum}, потолок сложности 10`
          : 'итоговая сложность';

      const penaltyMods = CANTRIP_MODS.filter((cm) => cm.group === 'penalty');
      const bonusMods = CANTRIP_MODS.filter((cm) => cm.group === 'bonus');

      body.innerHTML = `
        <div class="relative z-10 space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#d8b979]/20 pb-3">
            <div class="inline-flex rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1">
              <button type="button" data-cf-wyrd="0" class="px-3.5 py-1 rounded-full text-xs font-medium transition ${
                !state.cfWyrd ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
              }">Химерический (0 Гламура)</button>
              <button type="button" data-cf-wyrd="1" class="px-3.5 py-1 rounded-full text-xs font-medium transition ${
                state.cfWyrd ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
              }">Вирд-кантрип (1 Гламур)</button>
            </div>
            <div class="text-xs text-[#a69f90]">
              Запас = <strong class="text-[#f0eadc]">Искусство + младшее основное Владение</strong>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            ${cfStepperHTML('art', 'Рейтинг Искусства', state.cfArt, 1, 5, 'ступень от 1 до 5')}
            ${cfStepperHTML('realm', 'Младшее основное Владение', state.cfRealm, 0, 5, state.cfRealm === 0 ? 'обход: +0 куб.' : 'Актёр / Фея / Природа / Предмет')}
            ${cfStepperHTML('cheated', 'Обойдено Владений', state.cfCheated, 0, 4, '+1 Гламур за каждое')}
            ${cfStepperHTML('nightmare', 'Текущий Кошмар', state.cfNightmare, 0, 10, 'заменяет кубики запаса')}
          </div>

          ${
            state.cfRealm === 0 && state.cfCheated === 0
              ? `<div class="rounded-lg border border-[#d8b979]/30 bg-[#d8b979]/10 px-3.5 py-2 text-[11.5px] text-[#f0dba8]">
                   Примечание: при основном Владении 0 необходимо добавить минимум 1 в счётчик «Обойдено Владений» (+1 Гламур).
                 </div>`
              : ''
          }

          <div class="space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-medium text-[#f0dba8]">Сила Уловки:</span>
              <button type="button" id="cf-goto-bunks" class="text-[11px] text-[#d8b979] hover:text-[#f0dba8] underline decoration-dotted">
                Посмотреть 42 примера Уловок →
              </button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${[0, -1, -2, -3, -4, -5]
                .map(
                  (v) => `
                <button type="button" data-cf-bunk="${v}" class="px-3 py-1 rounded-full text-xs border transition ${
                  state.cfBunk === v
                    ? 'border-[#f0dba8]/80 bg-[#d8b979]/22 text-[#f0dba8]'
                    : 'border-[#d8b979]/25 bg-[#0b110f]/60 text-[#a69f90] hover:text-[#f0eadc]'
                }">${v === 0 ? 'Без Уловки (0)' : `Уловка ${v}`}</button>`
                )
                .join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="text-[11px] uppercase tracking-wider text-[#d98a7c]">Осложнения (+1)</div>
              <div class="space-y-1.5">
                ${penaltyMods
                  .map(
                    (cm) => `
                  <button type="button" data-cf-mod="${cm.id}"
                    class="w-full text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition ${
                      state.cfMods[cm.id]
                        ? 'border-[#d98a7c]/65 bg-[#d98a7c]/15 text-[#f0eadc]'
                        : 'border-[#d8b979]/20 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
                    }">
                    <span>${cm.ru}</span>
                    <span class="font-semibold text-[#f0b4a8] shrink-0">${cm.modLabel}</span>
                  </button>`
                  )
                  .join('')}
              </div>
            </div>
            <div class="space-y-2">
              <div class="text-[11px] uppercase tracking-wider text-[#f0dba8]">Облегчения (−1)</div>
              <div class="space-y-1.5">
                ${bonusMods
                  .map((cm) => {
                    const isVol = cm.id === 'voluntary_nightmare';
                    const disabled = isVol && !canVoluntary;
                    const on = !disabled && state.cfMods[cm.id];
                    return `
                      <button type="button" data-cf-mod="${cm.id}" ${disabled ? 'disabled' : ''}
                        class="w-full text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition ${
                          disabled
                            ? 'border-[#d8b979]/12 bg-[#0b110f]/35 text-[#7b7669] opacity-65 cursor-not-allowed'
                            : on
                            ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0eadc]'
                            : 'border-[#d8b979]/20 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
                        }">
                        <span>${cm.ru}${disabled ? ' (нужно ≥ 3 обычных кубиков)' : ''}</span>
                        <span class="font-semibold text-[#f0dba8] shrink-0">${cm.modLabel}</span>
                      </button>`;
                  })
                  .join('')}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div class="rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/75 p-4 text-center space-y-1">
              <div class="text-[10.5px] uppercase tracking-widest text-[#a69f90]">Цена в Гламуре</div>
              <div class="font-nouveau text-3xl font-bold text-[#f0dba8]">${glamourCost}</div>
              <div class="text-[11px] text-[#a69f90]">${state.cfWyrd ? 'Вирд: 1' : 'Химерический: 0'} + обход: ${state.cfCheated}</div>
            </div>
            <div class="rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/75 p-4 text-center space-y-1">
              <div class="text-[10.5px] uppercase tracking-widest text-[#a69f90]">Запас кубиков</div>
              <div class="font-nouveau text-3xl font-bold text-[#f0eadc]">${basePool}</div>
              <div class="text-[11px] text-[#a69f90]">
                <strong class="text-[#f0eadc]">${finalNormal}</strong> обычных + <strong class="text-[#c4a8ff]">${finalNm}</strong> Кошмара${volActive ? ' (+3 добровольно)' : ''}
              </div>
            </div>
            <div class="rounded-xl border border-[#f0dba8]/55 bg-[#d8b979]/12 p-4 text-center space-y-1">
              <div class="text-[10.5px] uppercase tracking-widest text-[#f0dba8]">Сложность броска</div>
              <div class="font-nouveau text-3xl font-bold text-[#f0dba8]">${shownDiff}</div>
              <div class="text-[11px] text-[#f0eadc]/85">${diffNote}</div>
            </div>
          </div>

          <div class="text-[11.5px] text-[#a69f90] leading-relaxed">
            <strong class="text-[#f0dba8]">Расчёт сложности:</strong> ${breakdown.join(' ')} = <strong class="text-[#f0eadc]">${diffSum}</strong>.
            Каждая «10» на кубике Кошмара сразу добавляет +1 к шкале Кошмара; при достижении 10 шкала сбрасывается в Дисбаланс и приносит +1 временный Гламур.
          </div>
        </div>
      `;

      body.querySelectorAll('[data-cf-wyrd]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.cfWyrd = btn.getAttribute('data-cf-wyrd') === '1';
          renderCantripForge();
        });
      });
      body.querySelectorAll('[data-cf-bunk]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.cfBunk = Number(btn.getAttribute('data-cf-bunk'));
          renderCantripForge();
        });
      });
      body.querySelectorAll('[data-cf-mod]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-cf-mod');
          state.cfMods[id] = !state.cfMods[id];
          renderCantripForge();
        });
      });
      const gotoBtn = document.getElementById('cf-goto-bunks');
      if (gotoBtn) {
        gotoBtn.addEventListener('click', () => {
          state.cfTab = 'bunks';
          renderCantripForge();
        });
      }
      bindCfSteppers(body);
    } else if (state.cfTab === 'unleash') {
      const nmBefore = Math.min(state.cfNightmare, 9);
      const nmAfter = nmBefore + 1;
      const unleashPool = state.cfGlamour + nmAfter;

      body.innerHTML = `
        <div class="relative z-10 space-y-5">
          <div class="text-xs sm:text-[13.5px] text-[#f0eadc]/90 leading-relaxed">
            Высвобождение отбрасывает ограничения Владений и прорывает Грёзу напрямую через выбранное Искусство. Перед броском игрок называет простое намерение, тратит <strong class="text-[#f0dba8]">2 пункта Гламура</strong> и прибавляет <strong class="text-[#c4a8ff]">+1 к рейтингу Кошмара</strong>.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            ${cfStepperHTML('glamour', 'Постоянный Гламур', state.cfGlamour, 1, 10, 'входит в запас и срок Вирда')}
            ${cfStepperHTML('art', 'Рейтинг Искусства', state.cfArt, 1, 5, 'порог контроля над магией')}
            ${cfStepperHTML('nightmare_unleash', 'Кошмар до броска', nmBefore, 0, 9, `после +1 перед броском станет ${nmAfter}`)}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/75 p-4 text-center space-y-1">
              <div class="text-[10.5px] uppercase tracking-widest text-[#a69f90]">Цена до броска</div>
              <div class="font-nouveau text-2xl font-bold text-[#f0dba8]">2 Гламура + 1 Кошмар</div>
              <div class="text-[11px] text-[#a69f90]">Владения не требуются</div>
            </div>
            <div class="rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/75 p-4 text-center space-y-1">
              <div class="text-[10.5px] uppercase tracking-widest text-[#a69f90]">Запас Высвобождения</div>
              <div class="font-nouveau text-2xl font-bold text-[#f0eadc]">${unleashPool} кубиков</div>
              <div class="text-[11px] text-[#a69f90]">${state.cfGlamour} обычных + ${nmAfter} Кошмара</div>
            </div>
            <div class="rounded-xl border border-[#f0dba8]/55 bg-[#d8b979]/12 p-4 text-center space-y-1">
              <div class="text-[10.5px] uppercase tracking-widest text-[#f0dba8]">Сложность</div>
              <div class="font-nouveau text-2xl font-bold text-[#f0dba8]">7</div>
              <div class="text-[11px] text-[#f0eadc]/85">Порог контроля: до ${state.cfArt} успехов</div>
            </div>
          </div>

          ${
            nmAfter === 10
              ? `<div class="rounded-lg border border-[#d98a7c]/55 bg-[#d98a7c]/12 px-3.5 py-2 text-xs text-[#f0b4a8]">
                   Осторожно: обязательный +1 Кошмар доводит шкалу до 10 — срабатывает переполнение в Дисбаланс (+1 временный Гламур).
                 </div>`
              : ''
          }

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
            <div class="rounded-xl border border-[#f0dba8]/40 bg-[#0b110f]/68 p-4 space-y-1">
              <div class="font-semibold text-[#f0dba8]">✦ Успех под контролем (успехов: 1–${state.cfArt})</div>
              <p class="text-[#f0eadc]/90 !my-0">${linkifyText(`Эффект описывает сам игрок. Облик феи проявляется наяву, а Вирд включается на число ходов, равное Гламуру (${state.cfGlamour})`)} <em>(за 1 пункт Силы Воли — на всю сцену)</em>.</p>
            </div>
            <div class="rounded-xl border border-[#c4a8ff]/40 bg-[#0b110f]/68 p-4 space-y-1">
              <div class="font-semibold text-[#dfd0ff]">❖ Потеря контроля (успехов: ${state.cfArt + 1} и более)</div>
              <p class="text-[#f0eadc]/90 !my-0">${linkifyText('Замысел сбывается искажённо с опасными осложнениями по воле Рассказчика; +1 Кошмар, а Вирд активен всю сцену.')}</p>
            </div>
            <div class="rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/68 p-4 space-y-1">
              <div class="font-semibold text-[#a69f90]">✕ Провал</div>
              <p class="text-[#f0eadc]/90 !my-0">${linkifyText('Высвобождение не срабатывает; Триггер Банальности, и это Искусство закрыто для вас до конца сцены.')}</p>
            </div>
            <div class="rounded-xl border border-[#d98a7c]/50 bg-[#0b110f]/68 p-4 space-y-1">
              <div class="font-semibold text-[#f0b4a8]">☠ Критический провал (ботч)</div>
              <p class="text-[#f0eadc]/90 !my-0">${linkifyText('Сразу 1 Дисбаланс')} <em>(без сброса Кошмара)</em>, ${linkifyText('1 ход хаоса вокруг, затем Триггер Банальности и запрет на трату Гламура и любые Искусства до конца сцены.')}</p>
            </div>
          </div>
        </div>
      `;
      bindCfSteppers(body);
    } else {
      const bFilters = [
        { id: 'all', label: `Все (${BUNK_EXAMPLES.length})` },
        { id: '-1', label: `−1 (${BUNK_EXAMPLES.filter((b) => b.mod === -1).length})` },
        { id: '-2', label: `−2 (${BUNK_EXAMPLES.filter((b) => b.mod === -2).length})` },
        { id: '-3', label: `−3 (${BUNK_EXAMPLES.filter((b) => b.mod === -3).length})` },
        { id: '-4', label: `−4 (${BUNK_EXAMPLES.filter((b) => b.mod === -4).length})` },
        { id: '-5', label: `−5 (${BUNK_EXAMPLES.filter((b) => b.mod === -5).length})` }
      ];

      const filtered = BUNK_EXAMPLES.filter((b) => {
        if (state.cfBunkFilter !== 'all' && String(b.mod) !== state.cfBunkFilter) return false;
        if (state.cfBunkQuery) {
          const hay = `${b.ru} ${b.en} ${b.label}`.toLowerCase();
          if (!hay.includes(state.cfBunkQuery)) return false;
        }
        return true;
      });

      body.innerHTML = `
        <div class="relative z-10 space-y-4">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div class="flex flex-wrap gap-1.5">
              ${bFilters
                .map(
                  (f) => `
                <button type="button" data-bf="${f.id}" class="px-2.5 py-1 rounded-full text-xs border transition ${
                  state.cfBunkFilter === f.id
                    ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
                    : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
                }">${f.label}</button>`
                )
                .join('')}
            </div>
            <input type="search" id="cf-bunk-search" value="${state.cfBunkQuery.replace(/"/g, '&quot;')}" placeholder="Поиск среди 42 примеров Уловок..."
              class="w-full sm:w-64 rounded-full border border-[#d8b979]/30 bg-[#0b110f]/75 px-3.5 py-1.5 text-xs text-[#f0eadc] placeholder-[#7b7669] focus:outline-none focus:border-[#f0dba8]" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
            ${
              filtered.length
                ? filtered
                    .map(
                      (b) => `
                  <button type="button" data-apply-bunk="${b.mod}"
                    class="text-left p-3 rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/60 hover:border-[#f0dba8]/65 hover:bg-[#15211d] flex items-start justify-between gap-2.5 transition">
                    <div>
                      <div class="text-xs sm:text-[13px] font-medium text-[#f0eadc] leading-snug">${b.ru}</div>
                      <div class="text-[10.5px] text-[#a69f90] mt-0.5">${b.en}</div>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#f0dba8]/45 bg-[#d8b979]/15 text-[#f0dba8] shrink-0" title="Подставить в расчёт Кантрипа">
                      ${b.label}
                    </span>
                  </button>`
                    )
                    .join('')
                : '<div class="col-span-full py-6 text-center text-xs text-[#a69f90]">Ни одна Уловка не подходит под запрос.</div>'
            }
          </div>
          <div class="text-[11px] text-[#7b7669]">Нажмите на любой пример, чтобы сразу перенести поправку в расчёт Кантрипа.</div>
        </div>
      `;

      body.querySelectorAll('[data-bf]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.cfBunkFilter = btn.getAttribute('data-bf');
          renderCantripForge();
        });
      });
      const inp = document.getElementById('cf-bunk-search');
      if (inp) {
        inp.addEventListener('input', (e) => {
          state.cfBunkQuery = e.target.value.trim().toLowerCase();
          renderCantripForge();
          const newInp = document.getElementById('cf-bunk-search');
          if (newInp) {
            newInp.focus();
            newInp.setSelectionRange(newInp.value.length, newInp.value.length);
          }
        });
      }
      body.querySelectorAll('[data-apply-bunk]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.cfBunk = Number(btn.getAttribute('data-apply-bunk'));
          state.cfTab = 'cantrip';
          renderCantripForge();
        });
      });
    }
  }

  function bindCfSteppers(root) {
    root.querySelectorAll('[data-cf-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-cf-step');
        const dir = Number(btn.getAttribute('data-cf-dir'));
        if (key === 'art') state.cfArt = Math.max(1, Math.min(5, state.cfArt + dir));
        else if (key === 'realm') state.cfRealm = Math.max(0, Math.min(5, state.cfRealm + dir));
        else if (key === 'cheated') state.cfCheated = Math.max(0, Math.min(4, state.cfCheated + dir));
        else if (key === 'nightmare') state.cfNightmare = Math.max(0, Math.min(10, state.cfNightmare + dir));
        else if (key === 'nightmare_unleash') state.cfNightmare = Math.max(0, Math.min(9, Math.min(state.cfNightmare, 9) + dir));
        else if (key === 'glamour') state.cfGlamour = Math.max(1, Math.min(10, state.cfGlamour + dir));
        renderCantripForge();
      });
    });
  }

  function initRealmsAtlas() {
    const mount = document.getElementById('realms-widget-mount');
    if (!mount || !REALMS.length) return;

    const params = new URLSearchParams(window.location.search);
    const qRealm = params.get('realm');
    if (qRealm && REALMS.some((r) => r.id === qRealm)) {
      state.selectedRealmId = qRealm;
    } else if (!REALMS.some((r) => r.id === state.selectedRealmId)) {
      state.selectedRealmId = REALMS[0].id;
    }

    mount.innerHTML = `
      <section id="realms-atlas" class="space-y-6 my-8 scroll-mt-24">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979] !mt-0 !mb-0">Четыре основных и два модифицирующих · Тридцать ступеней</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc] !mt-1 !mb-0 !border-0 !pb-0">
              Атлас шести Владений
            </h2>
          </div>
          <div class="no-print inline-flex rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1 self-start md:self-auto">
            <button type="button" id="rview-atlas" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ✦ Атлас Владений
            </button>
            <button type="button" id="rview-scroll" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ☰ Книжный свиток
            </button>
          </div>
        </div>

        <div id="realms-interactive-area" class="space-y-5">
          <div id="realms-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"></div>
          <div id="realm-spotlight" class="nouveau-panel p-5 sm:p-7 scroll-mt-24" aria-live="polite"></div>
        </div>

        <div id="realms-scroll-area" class="hidden space-y-5 no-print"></div>
        <div id="print-realms-container" class="print-only space-y-3"></div>
      </section>
    `;

    document.getElementById('rview-atlas').addEventListener('click', () => {
      state.realmViewMode = 'atlas';
      syncRealmViewMode();
    });
    document.getElementById('rview-scroll').addEventListener('click', () => {
      state.realmViewMode = 'scroll';
      syncRealmViewMode();
    });

    renderRealmsGrid();
    renderRealmSpotlight(false);
    renderRealmsScrollArea();
    syncRealmViewMode();
  }

  function syncRealmViewMode() {
    const atlas = document.getElementById('realms-interactive-area');
    const scroll = document.getElementById('realms-scroll-area');
    const bAtl = document.getElementById('rview-atlas');
    const bScr = document.getElementById('rview-scroll');
    if (!atlas || !scroll) return;
    const isAtl = state.realmViewMode === 'atlas';
    atlas.classList.toggle('hidden', !isAtl);
    scroll.classList.toggle('hidden', isAtl);
    bAtl.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      isAtl ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
    bScr.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      !isAtl ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
  }

  function renderRealmsGrid() {
    const grid = document.getElementById('realms-grid');
    if (!grid) return;

    grid.innerHTML = REALMS.map((r) => {
      const active = r.id === state.selectedRealmId;
      const isMod = r.kind === 'modifier';
      return `
        <button type="button" data-realm-card="${r.id}"
          class="text-left p-3.5 rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0dba8] flex flex-col justify-between gap-2 ${
            active
              ? 'border-[#f0dba8]/85 bg-[#d8b979]/18 shadow-[0_0_22px_rgba(216,185,121,0.16)]'
              : 'border-[#d8b979]/22 bg-[#101916]/82 hover:border-[#d8b979]/55 hover:bg-[#15211d]'
          }">
          <div>
            <div class="flex items-center justify-between gap-1.5">
              <span class="font-nouveau text-xl sm:text-2xl font-semibold text-[#f0eadc] leading-tight">${r.ru}</span>
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color:${r.auraHex};"></span>
            </div>
            <div class="text-[10px] uppercase tracking-[0.14em] text-[#a69f90] mt-0.5">${r.en}</div>
            <p class="text-[11.5px] text-[#a69f90] leading-snug !mt-1.5 !mb-0">${r.summary}</p>
          </div>
          <span class="self-start px-2.5 py-0.5 rounded-full text-[10px] border ${
            isMod
              ? 'border-[#c4a8ff]/45 bg-[#c4a8ff]/12 text-[#dfd0ff]'
              : 'border-[#d8b979]/45 bg-[#d8b979]/12 text-[#f0dba8]'
          }">${r.kindRu}</span>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('[data-realm-card]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedRealmId = btn.getAttribute('data-realm-card');
        renderRealmsGrid();
        renderRealmSpotlight(true);
      });
    });
  }

  function renderRealmSpotlight(scrollToPanel = false) {
    const spot = document.getElementById('realm-spotlight');
    if (!spot) return;
    const r = REALMS.find((x) => x.id === state.selectedRealmId) || REALMS[0];
    if (!r) return;

    const isMod = r.kind === 'modifier';
    spot.innerHTML = `
      <div class="spotlight-anim relative z-10 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#d8b979]/20 pb-3">
          <div>
            <h3 class="font-nouveau text-3xl font-semibold text-[#f0eadc] !mt-0 !mb-0 leading-none">${r.ru}</h3>
            <div class="text-xs uppercase tracking-[0.16em] text-[#a69f90] mt-1">${r.en}</div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs border self-start sm:self-auto ${
            isMod
              ? 'border-[#c4a8ff]/45 bg-[#c4a8ff]/12 text-[#dfd0ff]'
              : 'border-[#f0dba8]/55 bg-[#d8b979]/18 text-[#f0dba8]'
          }">${isMod ? '⇄ Модификатор · +1 к сложности' : '✦ Основное Владение'}</span>
        </div>

        <div class="space-y-2.5 text-sm sm:text-[15px] text-[#f0eadc]/92 leading-relaxed">
          ${(r.desc || []).map((p) => `<p class="!my-0">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
        </div>

        ${
          r.specialNote
            ? `<div class="rounded-xl border border-[#d8b979]/35 bg-[#0b110f]/70 px-4 py-3 text-xs sm:text-[13.5px] text-[#f0eadc]/92 leading-relaxed">
                 <span class="font-semibold text-[#f0dba8]">◈ Особое правило Владения:</span> ${linkifyHTML(formatInlineMd(r.specialNote))}
               </div>`
            : ''
        }

        <div class="space-y-2.5 pt-1">
          ${(r.levels || [])
            .map(
              (lv) => `
            <div class="rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/60 p-3.5 sm:p-4 space-y-1.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  ${renderSmallDotsHTML(lv.dots, 5)}
                  <span class="font-nouveau text-xl font-semibold text-[#f0dba8]">${lv.ru}</span>
                </div>
                <span class="text-[10.5px] uppercase tracking-[0.14em] text-[#a69f90]">${lv.en}</span>
              </div>
              <p class="text-xs sm:text-[13.5px] text-[#f0eadc]/92 leading-relaxed !my-0">${linkifyHTML(formatInlineMd(lv.desc))}</p>
              <div class="text-[11.5px] text-[#a69f90] leading-relaxed">
                <strong class="text-[#d8b979]">Примеры:</strong> ${linkifyHTML(formatInlineMd(lv.examples))}
              </div>
            </div>`
            )
            .join('')}
        </div>
      </div>
    `;

    if (scrollToPanel) {
      const rect = spot.getBoundingClientRect();
      if (rect.top < 60 || rect.top > window.innerHeight * 0.72) {
        spot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function renderRealmsScrollArea() {
    const area = document.getElementById('realms-scroll-area');
    if (!area) return;

    area.innerHTML = REALMS.map((r) => `
      <article class="nouveau-panel p-5 space-y-3">
        <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#d8b979]/15 pb-2">
          <h3 class="font-nouveau text-2xl font-semibold text-[#f0eadc] !mt-0 !mb-0">${r.ru} <span class="text-xs font-sans font-normal text-[#a69f90]">(${r.en})</span></h3>
          <span class="text-[11px] text-[#d8b979]">${r.kindRu}</span>
        </div>
        ${(r.desc || []).map((p) => `<p class="text-xs sm:text-[13.5px] leading-relaxed !my-0">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
        ${r.specialNote ? `<p class="text-xs text-[#f0dba8]/90 !my-0"><strong>◈ Особое правило:</strong> ${linkifyHTML(formatInlineMd(r.specialNote))}</p>` : ''}
        <div class="space-y-1.5 text-xs sm:text-[13px] pt-1">
          ${(r.levels || [])
            .map(
              (lv) => `
            <div>
              <strong class="text-[#f0dba8]">${'●'.repeat(lv.dots)} ${lv.ru} (${lv.en}):</strong> ${linkifyHTML(formatInlineMd(lv.desc))}
              <span class="text-[#a69f90]"><em>Примеры:</em> ${linkifyHTML(formatInlineMd(lv.examples))}</span>
            </div>`
            )
            .join('')}
        </div>
      </article>
    `).join('');
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
      bunk: 'Уловка: Незаметно подложить тёплую булочку на край стола и прошептать старую пословицу.',
      result:
        'Поскольку Владение совпадает со Сродством Боггана (Актёр), сложность броска Кантрипа снижается на 1! А при Высвобождении зал наполнится ароматом свежего хлеба и пряного яблочного сидра.'
    },
    selkie: {
      title: 'Зов Шелки',
      kith: 'Шелки · Сродство: Природа',
      art: 'Искусство: Первозданность / Странствие',
      realm: 'Владение: Природа (морская волна)',
      bunk: 'Уловка: Коснуться солёной воды и напеть мотив старинной колыбельной моряков.',
      result:
        'Владение Природа совпадает со Сродством Шелки — сложность броска Кантрипа снижается на 1 (пока при ней её тюленья шкура). При Высвобождении на полу останутся лужицы солёной морской воды.'
    },
    redcap: {
      title: 'Гнев Красной Шапки',
      kith: 'Красная Шапка · Сродство: Природа',
      art: 'Искусство: Осень (ужас и ржавчина)',
      realm: 'Владение: Природа (ночной холод переулка)',
      bunk: 'Уловка: С хрустом разгрызть стеклянную пробку, глядя жертве прямо в глаза.',
      result:
        'Сродство к Владению Природа снижает сложность Кантрипа на 1, а дерзкая Уловка дополнительно облегчает бросок, помогая пробить Банальность цели и влить живой Гламур в сцену.'
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
            <div class="font-nouveau text-lg font-semibold text-[#f0dba8]">${linkifyText('Уловка')}</div>
            <div class="text-[11px] text-[#a69f90]">снижает сложность на 1–5</div>
          </div>
          <span class="font-nouveau text-2xl text-[#d8b979] leading-none">=</span>
          <div class="px-5 py-2.5 rounded-xl border border-[#f0dba8]/70 min-w-[152px]"
               style="background: linear-gradient(145deg, rgba(216, 185, 121, 0.20), rgba(11, 17, 15, 0.86));">
            <div class="font-nouveau text-xl font-bold text-[#f0dba8]">✦ ${linkifyText('Кантрип')}</div>
            <div class="text-[11px] text-[#f0eadc]/82">Сродство Кита: −1 к сложности</div>
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
      const act = b.getAttribute('data-lkind') === state.lexKind;
      b.className = `lkind-btn px-3 py-1 rounded-full text-xs border transition ${
        act
          ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
          : 'border-[#d8b979]/25 bg-[#0b110f]/55 text-[#a69f90] hover:text-[#f0eadc]'
      }`;
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
      <article id="term-${item.id}" class="nouveau-panel p-5 space-y-2">
        <div class="relative z-10 space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="font-nouveau text-2xl font-semibold text-[#f0dba8] leading-tight">${item.ru}</h3>
              <div class="text-[11px] uppercase tracking-[0.14em] text-[#a69f90]">${item.en}</div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border shrink-0 ${
              isRule
                ? 'border-[#f0dba8]/55 bg-[#d8b979]/18 text-[#f0dba8]'
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
        : `<span class="text-[#d8b979] shrink-0">${firstIsRule ? '◈' : '✦'}</span>`;

    const trail = state.chain
      .map((id, idx) => {
        const t = LEX_MAP[id];
        const isCurrent = idx === state.chain.length - 1;
        return `
          ${idx > 0 ? '<span class="text-[#7b7669] shrink-0">›</span>' : ''}
          <button type="button" data-chain-idx="${idx}"
            class="shrink-0 px-1 py-0.5 rounded transition ${
              isCurrent ? 'text-[#f0dba8] font-semibold' : 'text-[#a69f90] hover:text-[#f0eadc]'
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
          <h4 class="font-nouveau text-2xl font-semibold text-[#f0dba8] leading-tight">${item.ru}</h4>
          <div class="text-[11px] uppercase tracking-[0.14em] text-[#a69f90]">${item.en}</div>
        </div>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border shrink-0 ${
          isRule
            ? 'border-[#f0dba8]/55 bg-[#d8b979]/18 text-[#f0dba8]'
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
    document.getElementById('sheet-breadcrumbs').innerHTML = buildBreadcrumbsHTML();
    document.getElementById('sheet-content').innerHTML = `
      ${buildTermBodyHTML(current)}
      <p class="pt-3 border-t border-[#d8b979]/15 text-[11px] text-[#7b7669]">
        Нажмите на любой золотой термин выше, чтобы перейти дальше по цепочке понятий и правил.
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

    // 2d. Traits (Attributes & Abilities) hits
    [...ATTRIBUTES, ...ABILITIES].forEach((tr) => {
      const hay = `${tr.ru} ${tr.en} ${tr.groupRu} ${tr.desc} ${tr.mechanicNote || ''} ${(tr.possessedBy || []).join(' ')} ${(tr.specialties || []).join(' ')}`.toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          badge: `Черта · ${tr.groupRu}`,
          title: `${tr.ru} (${tr.en})`,
          snippet: tr.desc.slice(0, 150) + (tr.desc.length > 150 ? '…' : ''),
          url: `${ROOT}05-traits-backgrounds/index.html?trait=${tr.id}#traits-compendium`
        });
      }
    });

    // 2e. Backgrounds hits
    BACKGROUNDS.forEach((b) => {
      const subText = (b.subtracks || []).map((st) => `${st.title} ${st.desc} ${(st.levels || []).map((l) => l.text).join(' ')}`).join(' ');
      const hay = `${b.ru} ${b.en} ${(b.desc || []).join(' ')} ${b.mechanicNote || ''} ${(b.levels || []).map((l) => l.text).join(' ')} ${subText}`.toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          badge: b.poolable ? 'Дополнение · Мотли' : 'Дополнение',
          title: `${b.ru} (${b.en})`,
          snippet: ((b.desc && b.desc[0]) || '').slice(0, 150) + '…',
          url: `${ROOT}05-traits-backgrounds/index.html?bg=${b.id}#backgrounds-vault`
        });
      }
    });

    // 2f. Merits & Flaws hits
    MF_ITEMS.forEach((m) => {
      const tiersStr = (m.tiers || []).map((t) => `${t.cost} ${t.text}`).join(' ');
      const animalStr =
        m.id === 'animalistic_favor'
          ? ANIMAL_FEATURES.map((af) => `${af.ru} ${af.en} ${af.effect}`).join(' ')
          : '';
      const hay = `${m.ru} ${m.en} ${MF_CATEGORIES[m.category] || ''} ${m.costLabel} ${(m.desc || []).join(' ')} ${m.mechanicNote || ''} ${tiersStr} ${animalStr}`.toLowerCase();
      if (hay.includes(q)) {
        const km = mfKindMeta(m.kind);
        hits.push({
          badge: `${km.label} · ${m.costLabel}`,
          title: `${m.ru} (${m.en})`,
          snippet: ((m.desc && m.desc[0]) || '').slice(0, 150) + '…',
          url: `${ROOT}06-merits-flaws/index.html?mf=${m.id}#merits-flaws-atlas`
        });
      }
    });

    // 2g. Realms hits
    REALMS.forEach((r) => {
      const lvText = (r.levels || []).map((lv) => `${lv.ru} ${lv.en} ${lv.desc} ${lv.examples}`).join(' ');
      const hay = `${r.ru} ${r.en} ${r.kindRu} ${r.summary} ${(r.desc || []).join(' ')} ${r.specialNote || ''} ${lvText}`.toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          badge: `Владение · ${r.kind === 'modifier' ? 'Модификатор' : 'Основное'}`,
          title: `${r.ru} (${r.en})`,
          snippet: (r.summary || (r.desc && r.desc[0]) || '').slice(0, 150) + '…',
          url: `${ROOT}07-laws-of-glamour-realms/index.html?realm=${r.id}#realms-atlas`
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
      dotEl.style.boxShadow = state.tableMode ? '0 0 8px #f0dba8' : '';
      btn.style.borderColor = state.tableMode ? '#f0dba8' : 'rgba(216, 185, 121, 0.30)';
      btn.style.backgroundColor = state.tableMode ? 'rgba(216, 185, 121, 0.24)' : '';
      btn.style.boxShadow = state.tableMode ? '0 0 16px rgba(216, 185, 121, 0.28)' : '';
      btn.style.color = state.tableMode ? '#f0dba8' : '';
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

    const traitsPrint = document.getElementById('print-traits-container');
    if (traitsPrint && (ATTRIBUTES.length || ABILITIES.length)) {
      traitsPrint.innerHTML = [...ATTRIBUTES, ...ABILITIES]
        .map(
          (item) => `
        <article class="print-trait-card p-3 space-y-1">
          <div class="flex items-baseline justify-between border-b border-[#ccc] pb-0.5">
            <h4 class="font-nouveau text-lg font-bold">${item.ru} <span class="text-xs font-normal">(${item.en})</span></h4>
            <span class="text-xs font-semibold">${item.groupRu}${item.mandatorySpecialty ? ' · спец. с 1-й точки' : ''}</span>
          </div>
          <p class="text-xs">${formatInlineMd(item.desc)}</p>
          ${item.mechanicNote ? `<p class="text-xs"><strong>Механика:</strong> ${formatInlineMd(item.mechanicNote)}</p>` : ''}
          <p class="text-[11px] leading-snug"><strong>Шкала:</strong> ${(item.levels || [])
            .map((lv) => `<strong>${'●'.repeat(lv.dots)} ${lv.label}:</strong> ${formatInlineMd(lv.text)}`)
            .join(' · ')}</p>
          <p class="text-xs"><strong>${item.specialtiesLabel || 'Специализации'}:</strong> ${(item.specialties || []).join(', ')}.</p>
        </article>`
        )
        .join('');
    }

    const bgsPrint = document.getElementById('print-backgrounds-container');
    if (bgsPrint && BACKGROUNDS.length) {
      bgsPrint.innerHTML = BACKGROUNDS.map((b) => {
        const lvlHTML =
          b.subtracks && b.subtracks.length
            ? b.subtracks
                .map(
                  (st) =>
                    `<div class="text-xs mt-1"><strong>${st.title} (${st.en}):</strong> ${formatInlineMd(st.desc)}<br/>${(st.levels || [])
                      .map((lv) => `<strong>${'●'.repeat(lv.dots)}:</strong> ${formatInlineMd(lv.text)}`)
                      .join(' · ')}</div>`
                )
                .join('')
            : `<p class="text-xs">${(b.levels || [])
                .map((lv) => `<strong>${'●'.repeat(lv.dots)}:</strong> ${formatInlineMd(lv.text)}`)
                .join(' · ')}</p>`;
        return `
        <article class="print-bg-card p-3 space-y-1">
          <div class="flex items-baseline justify-between border-b border-[#ccc] pb-0.5">
            <h4 class="font-nouveau text-lg font-bold">${b.ru} <span class="text-xs font-normal">(${b.en})</span></h4>
            <span class="text-xs font-semibold">${b.poolable ? 'Объединяется в Мотли' : 'Личное'}</span>
          </div>
          <p class="text-xs">${(b.desc || []).map((p) => formatInlineMd(p)).join(' ')}</p>
          ${b.mechanicNote ? `<p class="text-xs"><strong>Механика:</strong> ${formatInlineMd(b.mechanicNote)}</p>` : ''}
          ${lvlHTML}
        </article>`;
      }).join('');
    }

    const mfPrint = document.getElementById('print-merits-flaws-container');
    if (mfPrint && MF_ITEMS.length) {
      mfPrint.innerHTML = Object.entries(MF_CATEGORIES)
        .map(([catId, catTitle]) => {
          const items = MF_ITEMS.filter((m) => m.category === catId);
          return `
            <div class="space-y-2 mt-3">
              <h3 class="font-nouveau text-xl font-bold border-b border-[#8c7b5a] pb-0.5">${catTitle} черты (${items.length})</h3>
              ${items
                .map((m) => {
                  const km = mfKindMeta(m.kind);
                  const tiersHTML =
                    m.tiers && m.tiers.length
                      ? `<div class="text-[11px] leading-snug space-y-0.5">${m.tiers
                          .map((t) => `<div><strong>${t.cost}:</strong> ${formatInlineMd(t.text)}</div>`)
                          .join('')}</div>`
                      : '';
                  const animalHTML =
                    m.id === 'animalistic_favor' && ANIMAL_FEATURES.length
                      ? `<div class="text-[11px] leading-snug pt-0.5"><strong>Звериные черты:</strong> ${ANIMAL_FEATURES.map(
                          (af) => `<strong>${af.ru} (${af.en}, ${af.cost} очк.):</strong> ${formatInlineMd(af.effect)}`
                        ).join(' · ')}</div>`
                      : '';
                  return `
                  <article class="print-mf-card p-3 space-y-1">
                    <div class="flex items-baseline justify-between border-b border-[#ccc] pb-0.5">
                      <h4 class="font-nouveau text-lg font-bold">${m.ru} <span class="text-xs font-normal">(${m.en})</span></h4>
                      <span class="text-xs font-semibold">${km.label} · ${m.costLabel}</span>
                    </div>
                    <p class="text-xs">${(m.desc || []).map((p) => formatInlineMd(p)).join(' ')}</p>
                    ${m.mechanicNote ? `<p class="text-xs"><strong>Механика:</strong> ${formatInlineMd(m.mechanicNote)}</p>` : ''}
                    ${tiersHTML}
                    ${animalHTML}
                  </article>`;
                })
                .join('')}
            </div>`;
        })
        .join('');
    }

    const bunksPrint = document.getElementById('print-bunks-container');
    if (bunksPrint && BUNK_EXAMPLES.length) {
      const grouped = [-1, -2, -3, -4, -5].map((mod) => {
        const list = BUNK_EXAMPLES.filter((b) => b.mod === mod);
        const label = list[0] ? list[0].label : String(mod);
        return `
          <div class="text-xs mt-1">
            <strong>Уловки (${label}):</strong> ${list.map((b) => `${b.ru} <em>(${b.en})</em>`).join(' · ')}
          </div>`;
      });
      bunksPrint.innerHTML = `
        <article class="print-bunks-card p-3 space-y-1.5">
          <div class="flex items-baseline justify-between border-b border-[#ccc] pb-0.5">
            <h4 class="font-nouveau text-lg font-bold">Примеры Уловок (Bunk Examples)</h4>
            <span class="text-xs font-semibold">${BUNK_EXAMPLES.length} примеров</span>
          </div>
          ${grouped.join('')}
        </article>`;
    }

    const realmsPrint = document.getElementById('print-realms-container');
    if (realmsPrint && REALMS.length) {
      realmsPrint.innerHTML = REALMS.map(
        (r) => `
        <article class="print-realm-card p-3 space-y-1">
          <div class="flex items-baseline justify-between border-b border-[#ccc] pb-0.5">
            <h4 class="font-nouveau text-lg font-bold">${r.ru} <span class="text-xs font-normal">(${r.en})</span></h4>
            <span class="text-xs font-semibold">${r.kindRu}</span>
          </div>
          <p class="text-xs">${(r.desc || []).map((p) => formatInlineMd(p)).join(' ')}</p>
          ${r.specialNote ? `<p class="text-xs"><strong>Особое правило:</strong> ${formatInlineMd(r.specialNote)}</p>` : ''}
          <div class="text-[11px] leading-snug space-y-0.5 pt-0.5">
            ${(r.levels || [])
              .map(
                (lv) =>
                  `<div><strong>${'●'.repeat(lv.dots)} ${lv.ru} (${lv.en}):</strong> ${formatInlineMd(lv.desc)} <em>Примеры:</em> ${formatInlineMd(lv.examples)}</div>`
              )
              .join('')}
          </div>
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
    initTraitsCompendium();
    initBackgroundsVault();
    initMeritsFlawsAtlas();
    initCantripForge();
    initRealmsAtlas();
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

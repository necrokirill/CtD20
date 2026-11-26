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
  const ARTS_DATA = BUNDLE.artsData || { groups: [], arts: [] };
  const ARTS = ARTS_DATA.arts || [];
  const ART_GROUPS = ARTS_DATA.groups || [];
  const CREATION_DATA = BUNDLE.creationData || {};
  const CREATION_STEPS = CREATION_DATA.steps || [];
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
    'Сродстве',
    'Искусство',
    'Искусством',
    'Владение',
    'Владением',
    'Очарованный',
    'Очарованная',
    'Очарованного',
    'Очарованному',
    'Очарованным',
    'Очарованном',
    'Очарованных',
    'Очарованными',
    'Очарованную',
    'Очарованной',
    'Дарование',
    'Дарования',
    'Дарованию',
    'Дарованием',
    'Даровании',
    'Дарований',
    'Дарованиям',
    'Дарованиями',
    'Дарованиях',
    'Дан',
    'Дана',
    'Дану',
    'Даном',
    'Дане',
    'Кошмар',
    'Кошмара',
    'Кошмару',
    'Кошмаром',
    'Кошмаре',
    'Кошмары',
    'Кошмаров',
    'Кошмарам',
    'Кошмарами',
    'Кошмарах',
    'Договор',
    'Договора',
    'Договору',
    'Договором',
    'Договоре',
    'Слабость',
    'Слабости',
    'Слабостью',
    'Слабостей',
    'Слабостям',
    'Слабостями',
    'Слабостях',
    'Очарование',
    'Очарования',
    'Очарованию',
    'Очарованием',
    'Очаровании',
    'Клятва',
    'Клятвы',
    'Клятве',
    'Клятву',
    'Клятвой',
    'Клятвою',
    'Клятв',
    'Клятвам',
    'Клятвами',
    'Клятвах',
    'Младенец',
    'Младенца',
    'Младенцу',
    'Младенцем',
    'Младенце',
    'Младенцы',
    'Младенцев',
    'Младенцам',
    'Младенцами',
    'Младенцах',
    'Дикарь',
    'Дикаря',
    'Дикарю',
    'Дикарём',
    'Дикаре',
    'Дикари',
    'Дикарей',
    'Дикарям',
    'Дикарями',
    'Дикарях',
    'Ворчун',
    'Ворчуна',
    'Ворчуну',
    'Ворчуном',
    'Ворчуне',
    'Ворчуны',
    'Ворчунов',
    'Ворчунам',
    'Ворчунами',
    'Ворчунах',
    'Прелюдия',
    'Прелюдии',
    'Прелюдию',
    'Прелюдией',
    'Прелюдиею',
    'Блудный',
    'Блудного',
    'Блудному',
    'Блудным',
    'Блудном',
    'Блудных',
    'Химерический',
    'Химерическая',
    'Химерическое',
    'Химерические',
    'Химерической',
    'Химерическую',
    'Химерическим',
    'Химерических',
    'Химерическими',
    'Разделение',
    'Разделения',
    'Разделению',
    'Разделением',
    'Разделении',
    'Разделений',
    'Разделениям',
    'Разделениями',
    'Разделениях',
    'Костёр',
    'Костра',
    'Костру',
    'Костром',
    'Костре',
    'Костры',
    'Костров',
    'Кострам',
    'Кострами',
    'Кострах',
    'Стадия',
    'Стадии',
    'Стадию',
    'Стадией',
    'Стадиею',
    'Стадий',
    'Стадиям',
    'Стадиями',
    'Стадиях'
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
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(
        /`([^`]+)`/g,
        '<code class="px-1.5 py-0.5 rounded bg-[#0b110f] border border-[#d8b979]/25 text-[#f0dba8] text-[0.85em]">$1</code>'
      );
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
    selectedArtId: 'autumn',
    artGroup: 'all',
    artTypeFilter: 'all',     // 'all' | 'wyrd' | 'chimerical' | 'either'
    artDotFilter: 'all',      // 'all' | 1..5
    artQuery: '',
    artViewMode: 'atlas',     // 'atlas' | 'scroll'
    chrysalisStepIdx: 0,
    chrysalisViewMode: 'interactive', // 'interactive' | 'dossier' | 'scroll'
    chrysalisMfKind: 'all',   // 'all' | 'merit' | 'flaw'
    chrysalisMfQuery: '',
    chrysalisFbOpen: { abil: false, bg: false, art: false, realm: false },
    chrysalisSheet: null,
    chrysalisDossierView: 'summary', // 'summary' | 'preview'
    chrysalisPrint: { pages: '2', palette: 'color', scale: 1, blank: false },
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
            breakdown.push(`${cm.modLabel} (+3 кубика Кошмара)`);
          }
          return;
        }
        if (state.cfMods[cm.id]) {
          diffSum += cm.mod;
          breakdown.push(`${cm.modLabel} (${cm.ru})`);
        }
      });

      const shownDiff = Math.max(2, Math.min(10, diffSum));
      const diffNote =
        diffSum < 2
          ? `расчёт ${diffSum}, минимум сложности в системе — 2`
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
            <div class="flex flex-wrap items-center gap-3 text-xs text-[#a69f90]">
              <span>Запас = <strong class="text-[#f0eadc]">Искусство + наименьшее основное Владение</strong></span>
              <button type="button" id="cf-reset" title="Сбросить Уловку, обходы и поправки"
                class="px-2.5 py-1 rounded-full border border-[#d8b979]/30 bg-[#0b110f]/75 text-[11px] text-[#d8b979] hover:border-[#f0dba8] hover:text-[#f0dba8] transition">
                ↺ Сбросить
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            ${cfStepperHTML('art', 'Рейтинг Искусства', state.cfArt, 1, 5, 'ваш полный рейтинг на бланке (1–5)')}
            ${cfStepperHTML('realm', 'Наименьшее основное Владение', state.cfRealm, 0, 5, state.cfRealm === 0 ? 'обход: +0 кубиков' : 'ваш рейтинг: Актёр / Фея / Природа / Предмет')}
            ${cfStepperHTML('cheated', 'Обойдено Владений', state.cfCheated, 0, 6, '+1 Гламур за каждое')}
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
      const resetBtn = document.getElementById('cf-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.cfCheated = 0;
          state.cfBunk = 0;
          Object.keys(state.cfMods).forEach((k) => {
            state.cfMods[k] = false;
          });
          renderCantripForge();
        });
      }
      bindCfSteppers(body);
    } else if (state.cfTab === 'unleash') {
      const nmBefore = Math.min(state.cfNightmare, 9);
      const nmAfter = nmBefore + 1;
      const overflows = nmAfter === 10;
      const rollNm = overflows ? 0 : nmAfter;
      const unleashPool = state.cfGlamour + rollNm;

      body.innerHTML = `
        <div class="relative z-10 space-y-5">
          <div class="text-xs sm:text-[13.5px] text-[#f0eadc]/90 leading-relaxed">
            Высвобождение отбрасывает ограничения Владений и прорывает Грёзу напрямую через выбранное Искусство. Перед броском игрок называет простое намерение, тратит <strong class="text-[#f0dba8]">2 пункта Гламура</strong> и прибавляет <strong class="text-[#c4a8ff]">+1 к рейтингу Кошмара</strong>.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            ${cfStepperHTML('glamour', 'Постоянный Гламур', state.cfGlamour, 1, 10, 'входит в запас и срок Вирда')}
            ${cfStepperHTML('art', 'Рейтинг Искусства', state.cfArt, 1, 5, 'порог контроля над магией')}
            ${cfStepperHTML('nightmare_unleash', 'Кошмар до броска', nmBefore, 0, 9, overflows ? 'достигает 10 → сброс в 0 и Дисбаланс' : `после +1 перед броском станет ${nmAfter}`)}
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
              <div class="text-[11px] text-[#a69f90]">${overflows ? `${state.cfGlamour} обычных + 0 Кошмара (после сброса)` : `${state.cfGlamour} обычных + ${nmAfter} Кошмара`}</div>
            </div>
            <div class="rounded-xl border border-[#f0dba8]/55 bg-[#d8b979]/12 p-4 text-center space-y-1">
              <div class="text-[10.5px] uppercase tracking-widest text-[#f0dba8]">Сложность</div>
              <div class="font-nouveau text-2xl font-bold text-[#f0dba8]">7</div>
              <div class="text-[11px] text-[#f0eadc]/85">Порог контроля: до ${state.cfArt} успехов</div>
            </div>
          </div>

          ${
            overflows
              ? `<div class="rounded-lg border border-[#d98a7c]/55 bg-[#d98a7c]/12 px-3.5 py-2 text-xs text-[#f0b4a8]">
                   Осторожно: обязательный +1 Кошмар до броска доводит шкалу до 10 — по правилам C20 шкала немедленно обнуляется в 0, отмечается 1 Дисбаланс и восстанавливается 1 временный пункт Гламура (если Рассказчик не разрешит сперва бросить все 10 кубиков Кошмара до сброса).
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
        else if (key === 'cheated') state.cfCheated = Math.max(0, Math.min(6, state.cfCheated + dir));
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

  function cantripSpecialText(c) {
    const sbText = (c.specialBlocks || [])
      .map((sb) => {
        const itemsStr = (sb.items || [])
          .map((it) => `${it.title || ''} ${it.en || ''} ${it.badge || ''} ${it.text || ''}`)
          .join(' ');
        return `${sb.title || ''} ${sb.text || ''} ${itemsStr}`;
      })
      .join(' ');
    const multiTblText = (c.successTables || [])
      .map(
        (tb) =>
          `${tb.title || ''} ${tb.col1 || ''} ${tb.col2 || ''} ${(tb.rows || [])
            .map((r) => `${r.successes || ''} ${r.effect || ''}`)
            .join(' ')}`
      )
      .join(' ');
    const singleTblText = (c.successTable || [])
      .map((r) => `${r.successes || ''} ${r.effect || ''}`)
      .join(' ');
    return `${sbText} ${multiTblText} ${singleTblText}`;
  }

  function artTypeMeta(c) {
    if (c.type === 'wyrd') {
      return {
        label: '✦ Вирд · 1 Гламур',
        short: 'Вирд',
        cls: 'border-[#f0dba8]/55 bg-[#d8b979]/18 text-[#f0dba8]'
      };
    }
    if (c.type === 'chimerical') {
      return {
        label: '☾ Химерический · 0 Гламура',
        short: 'Химерический',
        cls: 'border-[#9cc2b8]/45 bg-[#203832]/75 text-[#c9e6dc]'
      };
    }
    return {
      label: '⇄ Химерический или Вирд',
      short: 'На выбор',
      cls: 'border-[#c4a8ff]/45 bg-[#c4a8ff]/12 text-[#dfd0ff]'
    };
  }

  function renderCantripTableHTML(rows, title = '', col1 = 'Успехи', col2 = 'Эффект') {
    if (!rows || !rows.length) return '';
    return `
      <div class="nouveau-table-wrap !my-2.5">
        ${title ? `<div class="px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] font-semibold text-[#f0dba8] bg-[#16231e]/90 border-b border-[#d8b979]/25">◈ ${formatInlineMd(title)}</div>` : ''}
        <table class="nouveau-table text-xs sm:text-[13px]">
          <thead><tr><th>${formatInlineMd(col1 || 'Успехи')}</th><th>${formatInlineMd(col2 || 'Эффект')}</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr><td class="font-semibold text-[#f0dba8] whitespace-nowrap">${row.successes}</td><td>${linkifyHTML(formatInlineMd(row.effect))}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderCantripCardHTML(c) {
    const meta = artTypeMeta(c);
    const sysItems = c.system || [];
    const tableHTML =
      c.successTables && c.successTables.length
        ? `<div class="space-y-2.5">
             ${c.successTables
               .map((tb) => renderCantripTableHTML(tb.rows, tb.title, tb.col1, tb.col2))
               .join('')}
           </div>`
        : renderCantripTableHTML(c.successTable);
    const specialHTML =
      c.specialBlocks && c.specialBlocks.length
        ? c.specialBlocks
            .map(
              (sb) => `
              <div class="rounded-lg border border-[#c4a8ff]/35 bg-[#1a1526]/70 px-3.5 py-2.5 space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
                <div class="font-semibold text-[#dfd0ff]">◈ ${formatInlineMd(sb.title)}</div>
                ${sb.text ? `<p class="text-[#f0eadc]/90 !my-0">${linkifyHTML(formatInlineMd(sb.text))}</p>` : ''}
                ${
                  sb.items && sb.items.length
                    ? `<div class="space-y-1.5 pt-0.5">
                        ${sb.items
                          .map(
                            (it) => `
                          <div class="rounded border border-[#c4a8ff]/25 bg-[#120e1b]/80 px-3 py-2 space-y-0.5">
                            <div class="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                              <span class="font-semibold text-[#dfd0ff]">${linkifyHTML(formatInlineMd(it.title))}${it.en ? ` <span class="font-normal text-[11px] text-[#f0eadc]/55 italic">(${formatInlineMd(it.en)})</span>` : ''}</span>
                              ${it.badge ? `<span class="text-[11px] px-1.5 py-0.5 rounded bg-[#c4a8ff]/15 border border-[#c4a8ff]/30 text-[#dfd0ff] whitespace-nowrap">${formatInlineMd(it.badge)}</span>` : ''}
                            </div>
                            <p class="text-[#f0eadc]/90 !my-0">${linkifyHTML(formatInlineMd(it.text))}</p>
                          </div>`
                          )
                          .join('')}
                      </div>`
                    : ''
                }
              </div>`
            )
            .join('')
        : '';

    return `
      <article id="art-cantrip-${c.dots}" class="rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/65 p-4 sm:p-5 space-y-3 scroll-mt-24 transition">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <div class="flex flex-wrap items-center gap-2.5">
              ${renderSmallDotsHTML(c.dots, 5)}
              <h4 class="font-nouveau text-2xl font-semibold text-[#f0dba8] !my-0 leading-tight">${c.ru}</h4>
            </div>
            <div class="text-[11px] uppercase tracking-[0.14em] text-[#a69f90] mt-0.5">${c.en}</div>
          </div>
          <div class="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] border ${meta.cls}">${meta.label}</span>
            ${c.typeNote ? `<span class="text-[10.5px] text-[#a69f90] sm:text-right"><em>${c.typeNote}</em></span>` : ''}
          </div>
        </div>

        ${
          c.lore && c.lore.length
            ? `<div class="lore-only space-y-2 text-xs sm:text-[14px] text-[#f0eadc]/88 leading-relaxed">
                 ${c.lore.map((p) => `<p class="!my-0">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
               </div>`
            : ''
        }

        <div class="rounded-lg border border-[#d8b979]/25 bg-[#101916]/85 p-3 sm:p-3.5 space-y-2 text-xs sm:text-[13.5px] leading-relaxed">
          <div class="text-[10.5px] uppercase tracking-[0.18em] text-[#f0dba8] font-semibold">◈ Система</div>
          ${
            sysItems.length === 1
              ? `<p class="text-[#f0eadc]/92 !my-0">${linkifyHTML(formatInlineMd(sysItems[0]))}</p>`
              : `<ul class="!pl-3 !my-0 space-y-1.5 text-[#f0eadc]/92">
                   ${sysItems.map((p) => `<li>${linkifyHTML(formatInlineMd(p))}</li>`).join('')}
                 </ul>`
          }
          ${tableHTML}
          ${specialHTML}
        </div>
      </article>
    `;
  }

  function initArtsGrimoire() {
    const mount = document.getElementById('arts-widget-mount');
    if (!mount || !ARTS.length) return;

    const params = new URLSearchParams(window.location.search);
    const qArt = params.get('art');
    const qDotRaw = params.get('dot');
    const qDot = qDotRaw ? Number(qDotRaw) : null;
    if (qArt && ARTS.some((a) => a.id === qArt)) {
      state.selectedArtId = qArt;
      state.artGroup = 'all';
      state.artTypeFilter = 'all';
      state.artDotFilter = 'all';
    } else if (!ARTS.some((a) => a.id === state.selectedArtId)) {
      state.selectedArtId = ARTS[0].id;
    }

    const totalCantrips = ARTS.reduce((acc, a) => acc + (a.cantrips ? a.cantrips.length : 0), 0);
    const progressText =
      ARTS.length >= 18
        ? `${ARTS.length} Искусств · ${totalCantrips} Кантрипов`
        : `Открыто Искусств: ${ARTS.length} из 18 · Кантрипов: ${totalCantrips} из 90`;

    mount.innerHTML = `
      <section id="arts-grimoire" class="space-y-6 my-8 scroll-mt-24">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#d8b979]/20 pb-4">
          <div>
            <p class="text-[11px] uppercase tracking-[0.25em] text-[#d8b979] !mt-0 !mb-0">${progressText}</p>
            <h2 class="font-nouveau fluid-section-title font-semibold text-[#f0eadc] !mt-1 !mb-0 !border-0 !pb-0">
              Единый Гримуар Искусств
            </h2>
          </div>
          <div class="no-print inline-flex rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1 self-start md:self-auto">
            <button type="button" id="aview-atlas" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ✦ Гримуар
            </button>
            <button type="button" id="aview-scroll" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition">
              ☰ Книжный свиток
            </button>
          </div>
        </div>

        <div id="arts-interactive-area" class="space-y-5">
          <div id="arts-controls" class="space-y-3"></div>
          <div id="arts-cantrip-hits" class="hidden space-y-2"></div>
          <div id="arts-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"></div>
          <div id="art-spotlight" class="nouveau-panel p-5 sm:p-7 scroll-mt-24" aria-live="polite"></div>
        </div>

        <div id="arts-scroll-area" class="hidden space-y-5 no-print"></div>
        <div id="print-arts-container" class="print-only space-y-3"></div>
      </section>
    `;

    document.getElementById('aview-atlas').addEventListener('click', () => {
      state.artViewMode = 'atlas';
      syncArtViewMode();
    });
    document.getElementById('aview-scroll').addEventListener('click', () => {
      state.artViewMode = 'scroll';
      syncArtViewMode();
    });

    renderArtsControls();
    renderArtsGrid();
    renderArtSpotlight(false, qDot && qDot >= 1 && qDot <= 5 ? qDot : null);
    renderArtsScrollArea();
    syncArtViewMode();
  }

  function syncArtViewMode() {
    const atlas = document.getElementById('arts-interactive-area');
    const scroll = document.getElementById('arts-scroll-area');
    const bAtl = document.getElementById('aview-atlas');
    const bScr = document.getElementById('aview-scroll');
    if (!atlas || !scroll) return;
    const isAtl = state.artViewMode === 'atlas';
    atlas.classList.toggle('hidden', !isAtl);
    scroll.classList.toggle('hidden', isAtl);
    bAtl.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      isAtl ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
    bScr.className = `px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      !isAtl ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'
    }`;
  }

  function renderArtsControls() {
    const wrap = document.getElementById('arts-controls');
    const hitsWrap = document.getElementById('arts-cantrip-hits');
    if (!wrap) return;

    const visibleGroups = ART_GROUPS.filter(
      (g) => g.id === 'all' || ARTS.some((a) => a.group === g.id)
    );

    wrap.innerHTML = `
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div class="flex flex-wrap gap-1.5">
          ${visibleGroups
            .map((g) => {
              const cnt = g.id === 'all' ? ARTS.length : ARTS.filter((a) => a.group === g.id).length;
              const act = state.artGroup === g.id;
              return `
                <button type="button" data-art-group="${g.id}"
                  class="px-3 py-1 rounded-full text-xs border transition ${
                    act
                      ? 'border-[#f0dba8]/75 bg-[#d8b979]/20 text-[#f0dba8]'
                      : 'border-[#d8b979]/25 bg-[#0b110f]/60 text-[#a69f90] hover:text-[#f0eadc]'
                  }">
                  ${g.label} (${cnt})
                </button>`;
            })
            .join('')}
        </div>
        <div class="relative w-full sm:w-72">
          <input type="search" id="arts-search" value="${state.artQuery.replace(/"/g, '&quot;')}"
            placeholder="Поиск по Искусствам и Кантрипам..."
            class="w-full rounded-full border border-[#d8b979]/30 bg-[#0b110f]/75 px-3.5 py-1.5 pr-8 text-xs text-[#f0eadc] placeholder-[#7b7669] focus:outline-none focus:border-[#f0dba8]" />
          ${
            state.artQuery
              ? `<button type="button" id="arts-search-clear" aria-label="Очистить поиск"
                   class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#a69f90] hover:text-[#f0dba8]">✕</button>`
              : ''
          }
        </div>
      </div>
    `;

    wrap.querySelectorAll('[data-art-group]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.artGroup = btn.getAttribute('data-art-group');
        renderArtsControls();
        renderArtsGrid();
      });
    });

    const inp = document.getElementById('arts-search');
    if (inp) {
      inp.addEventListener('input', (e) => {
        state.artQuery = e.target.value.trim().toLowerCase();
        renderArtsControls();
        renderArtsGrid();
        const freshInp = document.getElementById('arts-search');
        if (freshInp) {
          freshInp.focus();
          freshInp.setSelectionRange(freshInp.value.length, freshInp.value.length);
        }
      });
    }

    const clr = document.getElementById('arts-search-clear');
    if (clr) {
      clr.addEventListener('click', () => {
        state.artQuery = '';
        renderArtsControls();
        renderArtsGrid();
      });
    }

    if (hitsWrap) {
      if (!state.artQuery) {
        hitsWrap.classList.add('hidden');
        hitsWrap.innerHTML = '';
      } else {
        const matchedCantrips = [];
        ARTS.forEach((a) => {
          (a.cantrips || []).forEach((c) => {
            const hay = `${a.ru} ${a.en} ${c.ru} ${c.en} ${(c.lore || []).join(' ')} ${(c.system || []).join(' ')} ${cantripSpecialText(c)}`.toLowerCase();
            if (hay.includes(state.artQuery)) matchedCantrips.push({ art: a, cantrip: c });
          });
        });

        hitsWrap.classList.remove('hidden');
        hitsWrap.innerHTML = matchedCantrips.length
          ? `<div class="rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/70 p-3.5 space-y-2">
               <div class="text-[11px] uppercase tracking-wider text-[#d8b979]">Найденные Кантрипы (${matchedCantrips.length})</div>
               <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                 ${matchedCantrips
                   .slice(0, 12)
                   .map(({ art, cantrip }) => {
                     const meta = artTypeMeta(cantrip);
                     return `
                       <button type="button" data-jump-art="${art.id}" data-jump-dot="${cantrip.dots}"
                         class="text-left p-2.5 rounded-lg border border-[#d8b979]/20 bg-[#101916]/85 hover:border-[#f0dba8]/65 hover:bg-[#15211d] transition space-y-1">
                         <div class="flex items-center justify-between gap-1.5">
                           <span class="text-[10.5px] font-medium text-[#d8b979]">${art.ru} · ${'•'.repeat(cantrip.dots)}</span>
                           <span class="text-[10px] px-1.5 py-0.2 rounded-full border ${meta.cls}">${meta.short}</span>
                         </div>
                         <div class="font-nouveau text-base font-semibold text-[#f0eadc] leading-tight">${cantrip.ru}</div>
                         <div class="text-[10px] text-[#a69f90]">${cantrip.en}</div>
                       </button>`;
                   })
                   .join('')}
               </div>
             </div>`
          : `<div class="rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/55 px-4 py-3 text-xs text-[#a69f90]">Ни одного Искусства или Кантрипа по этому запросу не найдено.</div>`;

        hitsWrap.querySelectorAll('[data-jump-art]').forEach((btn) => {
          btn.addEventListener('click', () => {
            state.selectedArtId = btn.getAttribute('data-jump-art');
            state.artTypeFilter = 'all';
            state.artDotFilter = 'all';
            const dot = Number(btn.getAttribute('data-jump-dot'));
            renderArtsGrid();
            renderArtSpotlight(false, dot);
          });
        });
      }
    }
  }

  function renderArtsGrid() {
    const grid = document.getElementById('arts-grid');
    if (!grid) return;

    const list = ARTS.filter((a) => {
      if (state.artGroup !== 'all' && a.group !== state.artGroup) return false;
      if (state.artQuery) {
        const cantripStr = (a.cantrips || [])
          .map((c) => `${c.ru} ${c.en} ${(c.system || []).join(' ')} ${cantripSpecialText(c)}`)
          .join(' ');
        const hay = `${a.ru} ${a.en} ${a.summary} ${a.groupRu} ${artSpecialRuleSearchText(a)} ${cantripStr}`.toLowerCase();
        if (!hay.includes(state.artQuery)) return false;
      }
      return true;
    });

    if (!list.length) {
      grid.innerHTML = '';
      return;
    }

    if (!list.some((a) => a.id === state.selectedArtId) && !state.artQuery) {
      state.selectedArtId = list[0].id;
    }

    grid.innerHTML = list
      .map((a) => {
        const active = a.id === state.selectedArtId;
        return `
          <button type="button" data-art-card="${a.id}"
            class="text-left p-3.5 rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0dba8] flex flex-col justify-between gap-2 ${
              active
                ? 'border-[#f0dba8]/85 bg-[#d8b979]/18 shadow-[0_0_22px_rgba(216,185,121,0.16)]'
                : 'border-[#d8b979]/22 bg-[#101916]/82 hover:border-[#d8b979]/55 hover:bg-[#15211d]'
            }">
            <div>
              <div class="flex items-center justify-between gap-1.5">
                <span class="font-nouveau text-xl sm:text-2xl font-semibold text-[#f0eadc] leading-tight">${a.ru}</span>
                <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color:${a.auraHex};"></span>
              </div>
              <div class="text-[10px] uppercase tracking-[0.14em] text-[#a69f90] mt-0.5">${a.en}</div>
              <p class="text-[11.5px] text-[#a69f90] leading-snug !mt-1.5 !mb-0">${a.summary}</p>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] border border-[#d8b979]/35 bg-[#d8b979]/10 text-[#f0dba8]">${a.groupRu}</span>
              <span class="text-[10.5px] text-[#a69f90]">${(a.cantrips || []).length} ступеней</span>
            </div>
          </button>`;
      })
      .join('');

    grid.querySelectorAll('[data-art-card]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedArtId = btn.getAttribute('data-art-card');
        renderArtsGrid();
        renderArtSpotlight(true);
      });
    });
  }

  function artSpecialRuleSearchText(a) {
    if (!a || !a.specialRule) return '';
    return `${a.specialRule.title || ''} ${a.specialRule.text || ''} ${(a.specialRule.items || []).join(' ')}`;
  }

  function renderArtSpecialRuleHTML(a) {
    const sr = a && a.specialRule;
    if (!sr) return '';
    const items = Array.isArray(sr.items) ? sr.items : [];
    return `
      <div class="rounded-xl border border-[#f0dba8]/45 bg-[#19160d]/80 px-4 py-3 space-y-1.5 text-xs sm:text-[13.5px] leading-relaxed">
        <div class="font-semibold text-[#f0dba8]">◈ ${formatInlineMd(sr.title || 'Особое правило Искусства')}</div>
        ${sr.text ? `<p class="text-[#f0eadc]/92 !my-0">${linkifyHTML(formatInlineMd(sr.text))}</p>` : ''}
        ${
          items.length
            ? `<ul class="!pl-3 !my-0 space-y-1 text-[#f0eadc]/92">
                 ${items.map((it) => `<li>${linkifyHTML(formatInlineMd(it))}</li>`).join('')}
               </ul>`
            : ''
        }
      </div>`;
  }

  function renderArtSpotlight(scrollToPanel = false, highlightDot = null) {
    const spot = document.getElementById('art-spotlight');
    if (!spot) return;
    const a = ARTS.find((x) => x.id === state.selectedArtId) || ARTS[0];
    if (!a) return;

    const dotFilters = [
      { id: 'all', label: 'Все' },
      { id: '1', label: '•' },
      { id: '2', label: '••' },
      { id: '3', label: '•••' },
      { id: '4', label: '••••' },
      { id: '5', label: '•••••' }
    ];
    const typeFilters = [
      { id: 'all', label: 'Все типы' },
      { id: 'wyrd', label: 'Вирд' },
      { id: 'chimerical', label: 'Химерический' },
      { id: 'either', label: 'На выбор' }
    ];

    const filteredCantrips = (a.cantrips || []).filter((c) => {
      if (state.artDotFilter !== 'all' && String(c.dots) !== String(state.artDotFilter)) return false;
      if (state.artTypeFilter !== 'all' && c.type !== state.artTypeFilter) return false;
      return true;
    });

    spot.innerHTML = `
      <div class="spotlight-anim relative z-10 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#d8b979]/20 pb-3">
          <div>
            <h3 class="font-nouveau text-3xl font-semibold text-[#f0eadc] !mt-0 !mb-0 leading-none">${a.ru}</h3>
            <div class="text-xs uppercase tracking-[0.16em] text-[#a69f90] mt-1">${a.en}</div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs border border-[#f0dba8]/45 bg-[#d8b979]/15 text-[#f0dba8] self-start sm:self-auto">
            ✦ ${a.groupRu}
          </span>
        </div>

        <div class="lore-only space-y-2.5 text-sm sm:text-[15px] text-[#f0eadc]/92 leading-relaxed">
          ${(a.lore || []).map((p) => `<p class="!my-0">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
        </div>

        ${renderArtSpecialRuleHTML(a)}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div class="rounded-xl border border-[#c4a8ff]/30 bg-[#0b110f]/70 px-4 py-3 space-y-1 text-xs sm:text-[13.5px] leading-relaxed">
            <div class="font-semibold text-[#dfd0ff]">⚡ Высвобождение</div>
            <p class="text-[#f0eadc]/90 !my-0">${linkifyHTML(formatInlineMd(a.unleashing))}</p>
          </div>
          <div class="rounded-xl border border-[#d8b979]/30 bg-[#0b110f]/70 px-4 py-3 space-y-1 text-xs sm:text-[13.5px] leading-relaxed">
            <div class="font-semibold text-[#f0dba8]">🎭 Характерные Уловки</div>
            <p class="text-[#f0eadc]/90 !my-0">${linkifyHTML(formatInlineMd(a.bunks))}</p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-b border-[#d8b979]/15 py-2.5">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-[#a69f90] mr-1">Ступень:</span>
            ${dotFilters
              .map(
                (df) => `
              <button type="button" data-art-dot="${df.id}"
                class="px-2.5 py-0.5 rounded-full text-xs border transition ${
                  String(state.artDotFilter) === df.id
                    ? 'border-[#f0dba8]/75 bg-[#d8b979]/22 text-[#f0dba8]'
                    : 'border-[#d8b979]/22 bg-[#0b110f]/60 text-[#a69f90] hover:text-[#f0eadc]'
                }">${df.label}</button>`
              )
              .join('')}
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            ${typeFilters
              .map(
                (tf) => `
              <button type="button" data-art-type="${tf.id}"
                class="px-2.5 py-0.5 rounded-full text-[11px] border transition ${
                  state.artTypeFilter === tf.id
                    ? 'border-[#f0dba8]/75 bg-[#d8b979]/22 text-[#f0dba8]'
                    : 'border-[#d8b979]/22 bg-[#0b110f]/60 text-[#a69f90] hover:text-[#f0eadc]'
                }">${tf.label}</button>`
              )
              .join('')}
          </div>
        </div>

        <div class="space-y-3.5">
          ${
            filteredCantrips.length
              ? filteredCantrips.map((c) => renderCantripCardHTML(c)).join('')
              : `<div class="rounded-xl border border-[#d8b979]/20 bg-[#0b110f]/55 py-6 text-center text-xs text-[#a69f90]">
                   В Искусстве «${a.ru}» нет Кантрипов под выбранный фильтр — нажмите «Все» или «Все типы».
                 </div>`
          }
        </div>
      </div>
    `;

    spot.querySelectorAll('[data-art-dot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.artDotFilter = btn.getAttribute('data-art-dot');
        renderArtSpotlight(false);
      });
    });
    spot.querySelectorAll('[data-art-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.artTypeFilter = btn.getAttribute('data-art-type');
        renderArtSpotlight(false);
      });
    });

    if (highlightDot) {
      const targetCard = document.getElementById(`art-cantrip-${highlightDot}`);
      if (targetCard) {
        targetCard.classList.add('ring-2', 'ring-[#f0dba8]/75');
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    if (scrollToPanel) {
      const rect = spot.getBoundingClientRect();
      if (rect.top < 60 || rect.top > window.innerHeight * 0.72) {
        spot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function renderArtsScrollArea() {
    const area = document.getElementById('arts-scroll-area');
    if (!area) return;

    area.innerHTML = ARTS.map(
      (a) => `
      <article class="nouveau-panel p-5 sm:p-6 space-y-4">
        <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#d8b979]/20 pb-2.5">
          <h3 class="font-nouveau text-3xl font-semibold text-[#f0eadc] !mt-0 !mb-0">${a.ru} <span class="text-sm font-sans font-normal text-[#a69f90]">(${a.en})</span></h3>
          <span class="text-xs text-[#d8b979]">${a.groupRu}</span>
        </div>
        <div class="lore-only space-y-2 text-sm text-[#f0eadc]/90 leading-relaxed">
          ${(a.lore || []).map((p) => `<p class="!my-0">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
        </div>
        ${renderArtSpecialRuleHTML(a)}
        <div class="space-y-1.5 text-xs sm:text-[13.5px] leading-relaxed">
          <p class="!my-0"><strong class="text-[#dfd0ff]">⚡ Высвобождение:</strong> ${linkifyHTML(formatInlineMd(a.unleashing))}</p>
          <p class="!my-0"><strong class="text-[#f0dba8]">🎭 Характерные Уловки:</strong> ${linkifyHTML(formatInlineMd(a.bunks))}</p>
        </div>
        <div class="space-y-3 pt-1">
          ${(a.cantrips || []).map((c) => renderCantripCardHTML(c)).join('')}
        </div>
      </article>`
    ).join('');
  }

  /* ------------------------------------------------------------------------
     3F. CHRYSALIS PATH & CHARACTER SHEET (PART 1)
     ------------------------------------------------------------------------ */
  const CHRYSALIS_STORAGE_KEY = 'ctd20_chrysalis_sheet_v1';
  const REALM_NAME_TO_ID = {
    Актёр: 'actor',
    Фея: 'fae',
    Природа: 'nature',
    Предмет: 'prop',
    Сцена: 'scene',
    Время: 'time'
  };
  const ATTR_GROUP_NAMES = {
    physical: 'Физические',
    social: 'Социальные',
    mental: 'Ментальные'
  };
  const ABIL_GROUP_NAMES = {
    talents: 'Таланты',
    skills: 'Навыки',
    knowledges: 'Познания'
  };
  const SEEMING_NAMES = {
    childling: 'Младенец',
    wilder: 'Дикарь',
    grump: 'Ворчун'
  };
  const ART_GROUP_NAMES = {
    seasons: 'Времена года',
    elements: 'Стихии и плоть',
    mind: 'Власть, клятвы и разум',
    fate: 'Судьба, сон и время'
  };

  function escHtml(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createEmptySheet() {
    const attrBase = {};
    ATTRIBUTES.forEach((a) => {
      attrBase[a.id] = 1;
    });
    return {
      name: '',
      concept: '',
      motley: '',
      kithId: '',
      court: 'Благой',
      seeming: 'wilder',
      wilderChoice: 'glamour',
      seelieLegacyId: '',
      unseelieLegacyId: '',
      houseId: '',
      trollOaths: 0,
      attrPriority: { physical: 7, social: 5, mental: 3 },
      attrBase,
      abilPriority: { talents: 13, skills: 9, knowledges: 5 },
      abilBase: {},
      customAbilityNames: { hobby_talent: '', professional_skill: '', expert_knowledge: '' },
      bgBase: {},
      artBase: {},
      realmBase: {},
      freebie: {
        attr: {},
        abil: {},
        bg: {},
        art: {},
        realm: {},
        glamour: 0,
        willpower: 0,
        merits: [],
        flaws: []
      },
      specialties: {},
      thresholdId: '',
      antithesis: '',
      mortalGuise: '',
      faeMien: '',
      goals: '',
      quirks: '',
      backstory: '',
      completedSteps: []
    };
  }

  function normalizeSheet(raw) {
    const base = createEmptySheet();
    if (!raw || typeof raw !== 'object') return base;
    const merged = Object.assign(base, raw);
    merged.attrPriority = Object.assign({}, base.attrPriority, raw.attrPriority || {});
    merged.attrBase = Object.assign({}, base.attrBase, raw.attrBase || {});
    merged.abilPriority = Object.assign({}, base.abilPriority, raw.abilPriority || {});
    merged.abilBase = Object.assign({}, raw.abilBase || {});
    merged.customAbilityNames = Object.assign({}, base.customAbilityNames, raw.customAbilityNames || {});
    merged.bgBase = Object.assign({}, raw.bgBase || {});
    merged.artBase = Object.assign({}, raw.artBase || {});
    merged.realmBase = Object.assign({}, raw.realmBase || {});
    const rawFb = raw.freebie || {};
    const mapMfList = (arr) =>
      Array.isArray(arr)
        ? arr.map((x) => {
            const copy = Object.assign({}, x);
            if (!copy.ru) {
              const found = MF_ITEMS.find((it) => it.id === copy.id);
              if (found) copy.ru = found.ru;
            }
            return copy;
          })
        : [];
    merged.freebie = {
      attr: Object.assign({}, rawFb.attr || {}),
      abil: Object.assign({}, rawFb.abil || {}),
      bg: Object.assign({}, rawFb.bg || {}),
      art: Object.assign({}, rawFb.art || {}),
      realm: Object.assign({}, rawFb.realm || {}),
      glamour: Number(rawFb.glamour) || 0,
      willpower: Number(rawFb.willpower) || 0,
      merits: mapMfList(rawFb.merits),
      flaws: mapMfList(rawFb.flaws)
    };
    merged.specialties = Object.assign({}, raw.specialties || {});
    merged.completedSteps = Array.isArray(raw.completedSteps) ? [...raw.completedSteps] : [];
    return merged;
  }

  function loadChrysalisSheet() {
    try {
      const saved = localStorage.getItem(CHRYSALIS_STORAGE_KEY);
      if (saved) return normalizeSheet(JSON.parse(saved));
    } catch (_err) {
      /* ignore corrupted local storage */
    }
    return createEmptySheet();
  }

  function saveChrysalisSheet() {
    try {
      localStorage.setItem(CHRYSALIS_STORAGE_KEY, JSON.stringify(state.chrysalisSheet));
    } catch (_err) {
      /* ignore quota errors */
    }
  }

  function sumMap(obj) {
    return Object.values(obj || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
  }

  function renderDotStrip(count, maxDots, bonusCount = 0) {
    const bits = [];
    for (let i = 1; i <= maxDots; i++) {
      const cls = i <= count ? 'wod-dot-sm filled' : 'wod-dot-sm';
      bits.push(`<span class="${cls}"></span>`);
    }
    for (let b = 0; b < bonusCount; b++) {
      bits.push('<span class="wod-dot-sm filled" title="Бонус Кита или Дома"></span>');
    }
    return `<span class="inline-flex items-center gap-0.5">${bits.join('')}</span>`;
  }

  function computeCharacterSheet(sheet) {
    const kith = KITHS.find((k) => k.id === sheet.kithId) || null;
    const house = HOUSES.find((h) => h.id === sheet.houseId) || null;
    const seelieLegacy = LEGACIES.find((l) => l.id === sheet.seelieLegacyId) || null;
    const unseelieLegacy = LEGACIES.find((l) => l.id === sheet.unseelieLegacyId) || null;
    const threshold = THRESHOLDS.find((t) => t.id === sheet.thresholdId) || null;
    const affinityRealmId = kith ? REALM_NAME_TO_ID[kith.affinity] || '' : '';

    const attrBonus = {};
    ATTRIBUTES.forEach((a) => {
      attrBonus[a.id] = 0;
    });
    const bonusSources = {};
    if (sheet.kithId === 'piskies') {
      attrBonus.dexterity += 1;
      bonusSources.dexterity = 'Писки +1';
    } else if (sheet.kithId === 'satyrs') {
      attrBonus.stamina += 1;
      bonusSources.stamina = 'Сатиры +1';
    } else if (sheet.kithId === 'selkies') {
      attrBonus.appearance += 1;
      attrBonus.charisma += 1;
      bonusSources.appearance = 'Шелки +1';
      bonusSources.charisma = 'Шелки +1';
    } else if (sheet.kithId === 'arcadian_sidhe' || sheet.kithId === 'autumn_sidhe') {
      attrBonus.appearance += 2;
      bonusSources.appearance = 'Ши +2';
    } else if (sheet.kithId === 'trolls') {
      const oaths = Math.max(0, Math.min(2, Number(sheet.trollOaths) || 0));
      attrBonus.strength += oaths;
      if (oaths > 0) bonusSources.strength = `Тролли +${oaths}`;
    }
    if (sheet.houseId === 'beaumayn') {
      attrBonus.perception += 1;
      bonusSources.perception = bonusSources.perception ? `${bonusSources.perception}, Бомейн +1` : 'Дом Бомейн +1';
    } else if (sheet.houseId === 'leanhaun') {
      attrBonus.charisma += 1;
      bonusSources.charisma = bonusSources.charisma ? `${bonusSources.charisma}, Лианнан +1` : 'Дом Лианнан +1';
    }

    const attrAddedByGroup = { physical: 0, social: 0, mental: 0 };
    const finalAttr = {};
    const maxAttr = {};
    ATTRIBUTES.forEach((a) => {
      const baseVal = Math.max(1, Math.min(5, Number(sheet.attrBase[a.id]) || 1));
      const fbVal = Math.max(0, Number((sheet.freebie.attr || {})[a.id]) || 0);
      attrAddedByGroup[a.group] += baseVal - 1;
      maxAttr[a.id] = 5 + (attrBonus[a.id] || 0);
      finalAttr[a.id] = Math.min(maxAttr[a.id], baseVal + (attrBonus[a.id] || 0) + fbVal);
    });

    const abilSpentByGroup = { talents: 0, skills: 0, knowledges: 0 };
    const finalAbil = {};
    ABILITIES.forEach((ab) => {
      const baseVal = Math.max(0, Math.min(3, Number(sheet.abilBase[ab.id]) || 0));
      const fbVal = Math.max(0, Number((sheet.freebie.abil || {})[ab.id]) || 0);
      abilSpentByGroup[ab.group] += baseVal;
      finalAbil[ab.id] = Math.min(5, baseVal + fbVal);
    });

    const finalBg = {};
    BACKGROUNDS.forEach((b) => {
      const baseVal = Math.max(0, Math.min(5, Number(sheet.bgBase[b.id]) || 0));
      const fbVal = Math.max(0, Number((sheet.freebie.bg || {})[b.id]) || 0);
      finalBg[b.id] = Math.min(5, baseVal + fbVal);
    });
    const finalArt = {};
    ARTS.forEach((ar) => {
      const baseVal = Math.max(0, Math.min(5, Number(sheet.artBase[ar.id]) || 0));
      const fbVal = Math.max(0, Number((sheet.freebie.art || {})[ar.id]) || 0);
      finalArt[ar.id] = Math.min(5, baseVal + fbVal);
    });
    const finalRealm = {};
    REALMS.forEach((rl) => {
      const baseVal = Math.max(0, Math.min(5, Number(sheet.realmBase[rl.id]) || 0));
      const fbVal = Math.max(0, Number((sheet.freebie.realm || {})[rl.id]) || 0);
      finalRealm[rl.id] = Math.min(5, baseVal + fbVal);
    });

    const glamourFromSeeming =
      sheet.seeming === 'childling' ? 1 : sheet.seeming === 'wilder' && sheet.wilderChoice === 'glamour' ? 1 : 0;
    const willpowerFromSeeming =
      sheet.seeming === 'grump' ? 1 : sheet.seeming === 'wilder' && sheet.wilderChoice === 'willpower' ? 1 : 0;
    const maxWillpower = sheet.houseId === 'balor' ? 6 : 10;
    const baseGlamour = 4 + glamourFromSeeming;
    const baseWillpower = Math.min(maxWillpower, 4 + willpowerFromSeeming);
    const glamour = Math.min(10, baseGlamour + (Number(sheet.freebie.glamour) || 0));
    const willpower = Math.min(maxWillpower, baseWillpower + (Number(sheet.freebie.willpower) || 0));
    const banality = 3 + (sheet.houseId === 'liam' ? 1 : 0);

    const extraBruised = sheet.kithId === 'trolls' ? Math.max(0, Math.min(2, Number(sheet.trollOaths) || 0)) : 0;
    const healthLevels = 7 + extraBruised;

    const meritsCost = (sheet.freebie.merits || []).reduce((acc, m) => acc + (Number(m.cost) || 0), 0);
    const flawTotal = (sheet.freebie.flaws || []).reduce((acc, f) => acc + (Number(f.cost) || 0), 0);
    const flawCredit = Math.min(7, flawTotal);
    const freebiePool = 15 + flawCredit;
    const freebieSpent =
      sumMap(sheet.freebie.attr) * 5 +
      sumMap(sheet.freebie.abil) * 2 +
      sumMap(sheet.freebie.bg) * 1 +
      sumMap(sheet.freebie.art) * 5 +
      sumMap(sheet.freebie.realm) * 2 +
      (Number(sheet.freebie.glamour) || 0) * 3 +
      (Number(sheet.freebie.willpower) || 0) * 2 +
      meritsCost;
    const freebieRemaining = freebiePool - freebieSpent;

    const requiredSpecialties = [];
    ATTRIBUTES.forEach((a) => {
      if (finalAttr[a.id] >= 4) {
        requiredSpecialties.push({
          key: `attr:${a.id}`,
          label: a.ru,
          rating: finalAttr[a.id],
          reason: 'Атрибут 4+',
          suggestions: a.specialties || []
        });
      }
    });
    ABILITIES.forEach((ab) => {
      const val = finalAbil[ab.id] || 0;
      if (val >= 4 || (ab.mandatorySpecialty && val >= 1) || (ab.isCustomSlot && val >= 1)) {
        const customName = sheet.customAbilityNames && sheet.customAbilityNames[ab.id];
        requiredSpecialties.push({
          key: `abil:${ab.id}`,
          label: customName ? `${ab.ru}: ${customName}` : ab.ru,
          rating: val,
          reason: val >= 4 ? 'Способность 4+' : ab.isCustomSlot ? 'Свободная графа' : 'Обязательно с 1 точки',
          suggestions: ab.specialties || []
        });
      }
    });

    const warnings = [];
    if (house && (finalBg.title || 0) === 0) {
      warnings.push('Для принадлежности к Благородному Дому, его Дара и Изъяна требуется хотя бы 1 точка Дополнения «Титул» на Шаге III.');
    }
    if (sheet.kithId === 'arcadian_sidhe' && !house) {
      warnings.push('Аркадийские ши по канону принадлежат к одному из четырнадцати Благородных Домов, если только не отреклись от титула.');
    }
    if (sheet.houseId === 'scathach' && sheet.kithId && sheet.kithId !== 'arcadian_sidhe' && (finalArt.sovereign || 0) > 0) {
      warnings.push('По Изъяну Дома Скатах Осенним ши и представителям иных Китов запрещено изучать Искусство «Владычество».');
    }
    if (sheet.houseId === 'liam' && threshold && threshold.type === 'ravaging') {
      warnings.push('По Изъяну Дома Лиам дворяне этого Дома ни при каких обстоятельствах не способны к Опустошению.');
    }
    if (flawTotal > 7) {
      warnings.push(`Взято Недостатков на ${flawTotal} очков: по правилам C20 в зачёт Свободных очков идёт не более 7.`);
    }
    if (freebieRemaining < 0) {
      warnings.push(`Свободные очки перерасходованы на ${Math.abs(freebieRemaining)}.`);
    }

    return {
      kith,
      house,
      seelieLegacy,
      unseelieLegacy,
      threshold,
      affinityRealmId,
      attrBonus,
      bonusSources,
      attrAddedByGroup,
      finalAttr,
      maxAttr,
      abilSpentByGroup,
      finalAbil,
      bgBaseTotal: sumMap(sheet.bgBase),
      artBaseTotal: sumMap(sheet.artBase),
      realmBaseTotal: sumMap(sheet.realmBase),
      finalBg,
      finalArt,
      finalRealm,
      baseGlamour,
      baseWillpower,
      maxWillpower,
      glamour,
      willpower,
      banality,
      extraBruised,
      healthLevels,
      meritsCost,
      flawTotal,
      flawCredit,
      freebiePool,
      freebieSpent,
      freebieRemaining,
      requiredSpecialties,
      warnings
    };
  }

  function renderDotAdjusterRow(labelHtml, val, minVal, maxVal, decAttrs, incAttrs, noteHtml = '') {
    return `
      <div class="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg border border-[#d8b979]/15 bg-[#0b110f]/55">
        <div class="min-w-0 flex-1">
          <div class="text-xs sm:text-[13px] text-[#f0eadc] font-medium truncate">${labelHtml}</div>
          ${noteHtml ? `<div class="text-[11px] text-[#a69f90]">${noteHtml}</div>` : ''}
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" ${decAttrs} class="chrysalis-dot-btn" ${val <= minVal ? 'disabled' : ''}>−</button>
          <span class="min-w-[1.6rem] text-center text-xs font-semibold text-[#f0dba8]">${val}</span>
          <button type="button" ${incAttrs} class="chrysalis-dot-btn" ${val >= maxVal ? 'disabled' : ''}>+</button>
        </div>
      </div>`;
  }

  function formatDossierText(sheet, comp) {
    const kithName = comp.kith ? `${comp.kith.ru} (${comp.kith.en})` : 'не выбран';
    const houseName = comp.house ? `${comp.house.ru} (${comp.house.en})` : 'без титула';
    const primaryLeg = sheet.court === 'Благой' ? comp.seelieLegacy : comp.unseelieLegacy;
    const secondaryLeg = sheet.court === 'Благой' ? comp.unseelieLegacy : comp.seelieLegacy;
    const lines = [
      `ЛИСТ ПОДМЕНЫША — ${sheet.name || 'Безымянный слёток'}`,
      `Замысел: ${sheet.concept || '—'}`,
      `Мотли: ${sheet.motley || '—'}`,
      `Кит: ${kithName}${comp.kith ? ` · Сродство: ${comp.kith.affinity}` : ''}`,
      `Двор: ${sheet.court} · Стадия души: ${SEEMING_NAMES[sheet.seeming] || 'Дикарь'}`,
      `Ведущее Наследие: ${primaryLeg ? primaryLeg.ru : '—'}${primaryLeg ? ` (Призвание: ${primaryLeg.quest} Запрет: ${primaryLeg.ban})` : ''}`,
      `Второе Наследие: ${secondaryLeg ? secondaryLeg.ru : '—'}${secondaryLeg ? ` (Призвание: ${secondaryLeg.quest} Запрет: ${secondaryLeg.ban})` : ''}`,
      `Благородный Дом: ${houseName}`,
      '',
      'АТРИБУТЫ:',
      ...ATTRIBUTES.map((a) => `- ${a.ru}: ${comp.finalAttr[a.id]}${comp.bonusSources[a.id] ? ` [${comp.bonusSources[a.id]}]` : ''}`),
      '',
      'СПОСОБНОСТИ:',
      ...ABILITIES.filter((ab) => comp.finalAbil[ab.id] > 0).map((ab) => {
        const cn = sheet.customAbilityNames && sheet.customAbilityNames[ab.id];
        return `- ${ab.ru}${cn ? ` (${cn})` : ''}: ${comp.finalAbil[ab.id]}`;
      }),
      '',
      'ДОПОЛНЕНИЯ, ИСКУССТВА И ВЛАДЕНИЯ:',
      ...BACKGROUNDS.filter((b) => comp.finalBg[b.id] > 0).map((b) => `- Дополнение · ${b.ru}: ${comp.finalBg[b.id]}`),
      ...ARTS.filter((ar) => comp.finalArt[ar.id] > 0).map((ar) => {
        const rating = comp.finalArt[ar.id];
        const unlocked = (ar.cantrips || []).filter((c) => c.dots <= rating).map((c) => c.ru);
        return `- Искусство · ${ar.ru}: ${rating}${unlocked.length ? ` (${unlocked.join(', ')})` : ''}`;
      }),
      ...REALMS.filter((rl) => comp.finalRealm[rl.id] > 0).map((rl) => `- Владение · ${rl.ru}: ${comp.finalRealm[rl.id]}${comp.affinityRealmId === rl.id ? ' [Сродство]' : ''}`),
      '',
      `ТЕМПЕРАМЕНТЫ: Сила Воли ${comp.willpower} (макс. ${comp.maxWillpower}) · Гламур ${comp.glamour} · Банальность ${comp.banality} · Кошмар 0`,
      `ЗДОРОВЬЕ: ${comp.healthLevels} ступеней (Реальная и Химерическая шкалы)`
    ];
    if ((sheet.freebie.merits || []).length || (sheet.freebie.flaws || []).length) {
      lines.push('', 'ДОСТОИНСТВА И НЕДОСТАТКИ:');
      (sheet.freebie.merits || []).forEach((m) => lines.push(`- Достоинство: ${m.ru} (${m.cost})${m.note ? ` — ${m.note}` : ''}`));
      (sheet.freebie.flaws || []).forEach((f) => lines.push(`- Недостаток: ${f.ru} (${f.cost})${f.note ? ` — ${f.note}` : ''}`));
    }
    if (comp.requiredSpecialties.length) {
      lines.push('', 'СПЕЦИАЛИЗАЦИИ:');
      comp.requiredSpecialties.forEach((sp) => lines.push(`- ${sp.label} (${sp.rating}): ${(sheet.specialties || {})[sp.key] || 'не указана'}`));
    }
    lines.push(
      '',
      `ПОРОГ ГЛАМУРА: ${comp.threshold ? `${comp.threshold.ru} (${comp.threshold.typeRu})` : 'определится в игре'}`,
      `АНТИТЕЗА: ${sheet.antithesis || 'не указана'}`,
      '',
      `СМЕРТНЫЙ ОБЛИК: ${sheet.mortalGuise || '—'}`,
      `ОБЛИК ФЕИ И ВУАЛЬ: ${sheet.faeMien || '—'}`,
      `ЦЕЛИ: ${sheet.goals || '—'}`,
      `ПРИЧУДЫ: ${sheet.quirks || '—'}`,
      `ХРИЗАЛИДА И ИСТОРИЯ: ${sheet.backstory || '—'}`
    );
    return lines.join('\n');
  }

  function cleanMdPlain(rawText) {
    return String(rawText || '')
      .replace(/\[([^\x5d]+)\]\([^\x29]+\)/g, '$1')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stripEnParens(name) {
    return String(name || '')
      .replace(/\s*\([^\x28\x29]+\)\s*$/, '')
      .trim();
  }

  const CHRYSALIS_PRINT_STORAGE_KEY = 'ctd20_chrysalis_print_v1';

  function normalizeChrysalisPrint(raw) {
    const allowedScales = [0.9, 0.95, 1, 1.05, 1.1];
    const src = raw && typeof raw === 'object' ? raw : {};
    const parsedScale = Number(src.scale);
    const scale = allowedScales.includes(parsedScale) ? parsedScale : 1;
    return {
      pages: src.pages === '1' ? '1' : '2',
      palette: src.palette === 'bw' ? 'bw' : 'color',
      scale,
      blank: Boolean(src.blank)
    };
  }

  function loadChrysalisPrint() {
    try {
      const saved = localStorage.getItem(CHRYSALIS_PRINT_STORAGE_KEY);
      if (saved) return normalizeChrysalisPrint(JSON.parse(saved));
    } catch (_err) {
      /* ignore corrupted local storage */
    }
    return normalizeChrysalisPrint(null);
  }

  function saveChrysalisPrint() {
    try {
      localStorage.setItem(CHRYSALIS_PRINT_STORAGE_KEY, JSON.stringify(state.chrysalisPrint));
    } catch (_err) {
      /* ignore quota errors */
    }
  }

  function renderSheetCornersSVG() {
    const svg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"><path d="M2 16V4a2 2 0 0 1 2-2h12"/><path d="M2 10c4 0 8-4 8-8"/><circle cx="5.5" cy="5.5" r="1.1" fill="currentColor" stroke="none"/></svg>';
    return `
      <span class="c20-corner tl" aria-hidden="true">${svg}</span>
      <span class="c20-corner tr" aria-hidden="true">${svg}</span>
      <span class="c20-corner bl" aria-hidden="true">${svg}</span>
      <span class="c20-corner br" aria-hidden="true">${svg}</span>
    `;
  }

  function renderSheetSectionHead(title) {
    return `<div class="c20-sec-head"><span>◈ ${escHtml(title)} ◈</span></div>`;
  }

  function renderSheetDots(val, maxDots = 5, opts = {}) {
    const bonusCount = opts.bonusCount || 0;
    const lockedAfter = opts.lockedAfter || 0;
    const banality = Boolean(opts.banality);
    const blank = Boolean(opts.blank);
    const baseFilled = blank ? 0 : Math.max(0, val - bonusCount);
    const totalFilled = blank ? 0 : Math.max(0, val);
    const dots = [];
    for (let i = 1; i <= maxDots; i++) {
      let cls = 'c20-dot';
      if (!blank && lockedAfter > 0 && i > lockedAfter) {
        cls += ' locked';
      } else if (!blank && i <= totalFilled) {
        if (i > baseFilled) cls += ' bonus';
        else cls += banality ? ' banality filled' : ' filled';
      }
      dots.push(`<span class="${cls}"></span>`);
    }
    return `<span class="c20-dots">${dots.join('')}</span>`;
  }

  function renderSheetBoxes(count = 10) {
    const boxes = [];
    for (let i = 0; i < count; i++) boxes.push('<span class="c20-box"></span>');
    return `<span class="c20-boxes">${boxes.join('')}</span>`;
  }

  function renderRuledBlock(text, minLines = 3) {
    const clean = String(text || '').trim();
    if (clean) {
      return `<div class="c20-note-line">${escHtml(clean).replace(/\n+/g, '<br>')}</div>`;
    }
    const rows = [];
    for (let i = 0; i < minLines; i++) rows.push('<div class="c20-ruled-line"></div>');
    return `<div class="c20-ruled-lines">${rows.join('')}</div>`;
  }

  function formatCustomAbilitySheetLabel(ab, sheet, blank) {
    const prefixes = {
      hobby_talent: 'Увлечение',
      professional_skill: 'Профессия',
      expert_knowledge: 'Познание'
    };
    const pref = prefixes[ab.id] || ab.ru;
    const customName = !blank && sheet.customAbilityNames ? (sheet.customAbilityNames[ab.id] || '').trim() : '';
    return customName ? `${pref}: ${customName}` : `${pref}: __________`;
  }

  function renderSheetBlankTraitRow(maxDots = 5) {
    return `
      <div class="c20-trait-row">
        <span class="c20-trait-blank"></span>
        ${renderSheetDots(0, maxDots, { blank: true })}
      </div>`;
  }

  function renderC20SheetHTML(sheet, comp, rawPrintOpts) {
    const opts = normalizeChrysalisPrint(rawPrintOpts || state.chrysalisPrint);
    const isBlank = opts.blank;
    const isCompact = opts.pages === '1';

    const valOrBlank = (v) => (isBlank ? '' : String(v || '').trim());
    const passportField = (label, value) => `
      <div class="c20-field-row">
        <span class="c20-field-lbl">${escHtml(label)}:</span>
        <span class="c20-field-val">${value ? escHtml(value) : '&nbsp;'}</span>
      </div>`;

    const primaryLeg = sheet.court === 'Благой' ? comp.seelieLegacy : comp.unseelieLegacy;
    const secondaryLeg = sheet.court === 'Благой' ? comp.unseelieLegacy : comp.seelieLegacy;
    const kithFull = isBlank ? '' : comp.kith ? `${comp.kith.ru} (Сродство: ${comp.kith.affinity})` : '';
    const houseFull = isBlank ? '' : comp.house ? `${comp.house.ru} (${comp.house.court})` : '';

    const passportHTML = `
      <div class="c20-passport">
        ${passportField('Имя', valOrBlank(sheet.name))}
        ${passportField('Замысел', valOrBlank(sheet.concept))}
        ${passportField('Мотли', valOrBlank(sheet.motley))}
        ${passportField('Кит', kithFull)}
        ${passportField('Двор', isBlank ? '' : sheet.court)}
        ${passportField('Стадия души', isBlank ? '' : SEEMING_NAMES[sheet.seeming] || 'Дикарь')}
        ${passportField('Ведущее Наследие', isBlank ? '' : primaryLeg ? primaryLeg.ru : '')}
        ${passportField('Второе Наследие', isBlank ? '' : secondaryLeg ? secondaryLeg.ru : '')}
        ${passportField('Благородный Дом', houseFull)}
      </div>`;

    const attrGridHTML = `
      <div class="c20-grid-3">
        ${['physical', 'social', 'mental']
          .map(
            (grp) => `
          <div>
            <div class="c20-col-title">${ATTR_GROUP_NAMES[grp]}</div>
            <div class="c20-trait-list">
              ${ATTRIBUTES.filter((a) => a.group === grp)
                .map((a) => {
                  const val = isBlank ? 0 : comp.finalAttr[a.id];
                  const bonus = isBlank ? 0 : comp.attrBonus[a.id] || 0;
                  const maxDots = isBlank ? 5 : Math.max(5, val);
                  const spec = !isBlank && sheet.specialties ? (sheet.specialties[`attr:${a.id}`] || '').trim() : '';
                  const specHtml = spec ? ` <span class="c20-trait-spec">(${escHtml(spec)})</span>` : '';
                  return `
                    <div class="c20-trait-row">
                      <span class="c20-trait-name">${escHtml(a.ru)}${specHtml}</span>
                      <span class="c20-leader"></span>
                      ${renderSheetDots(val, maxDots, { bonusCount: bonus, blank: isBlank })}
                    </div>`;
                })
                .join('')}
            </div>
          </div>`
          )
          .join('')}
      </div>`;

    const renderAbilityGroupRows = (grp) => {
      const grpAbils = ABILITIES.filter((ab) => ab.group === grp);
      const visible = isCompact && !isBlank ? grpAbils.filter((ab) => comp.finalAbil[ab.id] > 0) : isCompact && isBlank ? [] : grpAbils;
      const rows = visible.map((ab) => {
        const val = isBlank ? 0 : comp.finalAbil[ab.id];
        const baseLabel = ab.isCustomSlot ? formatCustomAbilitySheetLabel(ab, sheet, isBlank) : ab.ru;
        const spec = !isBlank && sheet.specialties ? (sheet.specialties[`abil:${ab.id}`] || '').trim() : '';
        const specHtml = spec ? ` <span class="c20-trait-spec">(${escHtml(spec)})</span>` : '';
        return `
          <div class="c20-trait-row">
            <span class="c20-trait-name">${escHtml(baseLabel)}${specHtml}</span>
            <span class="c20-leader"></span>
            ${renderSheetDots(val, 5, { blank: isBlank })}
          </div>`;
      });
      if (isCompact) {
        const minRows = isBlank ? 4 : 3;
        while (rows.length < minRows) rows.push(renderSheetBlankTraitRow(5));
      }
      return rows.join('');
    };

    const abilGridHTML = `
      <div class="c20-grid-3">
        ${['talents', 'skills', 'knowledges']
          .map(
            (grp) => `
          <div>
            <div class="c20-col-title">${ABIL_GROUP_NAMES[grp]}</div>
            <div class="c20-trait-list">${renderAbilityGroupRows(grp)}</div>
          </div>`
          )
          .join('')}
      </div>`;

    const advTargetRows = isCompact ? 5 : 6;
    const renderAdvList = (items, finalMap) => {
      const chosen = isBlank ? [] : items.filter((it) => (finalMap[it.id] || 0) > 0);
      const rows = chosen.map(
        (it) => `
        <div class="c20-trait-row">
          <span class="c20-trait-name">${escHtml(it.ru)}</span>
          <span class="c20-leader"></span>
          ${renderSheetDots(finalMap[it.id], 5, { blank: false })}
        </div>`
      );
      while (rows.length < advTargetRows) rows.push(renderSheetBlankTraitRow(5));
      return rows.join('');
    };

    const realmsListHTML = REALMS.map((rl) => {
      const isAffinity = !isBlank && comp.affinityRealmId === rl.id;
      const val = isBlank ? 0 : comp.finalRealm[rl.id];
      return `
        <div class="c20-trait-row">
          <span class="c20-trait-name">${escHtml(rl.ru)}${isAffinity ? ' ★' : ''}</span>
          <span class="c20-leader"></span>
          ${renderSheetDots(val, 5, { blank: isBlank })}
        </div>`;
    }).join('');

    const advGridHTML = `
      <div class="c20-grid-3">
        <div>
          <div class="c20-col-title">Дополнения</div>
          <div class="c20-trait-list">${renderAdvList(BACKGROUNDS, comp.finalBg)}</div>
        </div>
        <div>
          <div class="c20-col-title">Искусства</div>
          <div class="c20-trait-list">${renderAdvList(ARTS, comp.finalArt)}</div>
        </div>
        <div>
          <div class="c20-col-title">Владения${!isBlank && comp.kith ? ' (★ Сродство)' : ''}</div>
          <div class="c20-trait-list">${realmsListHTML}</div>
        </div>
      </div>`;

    const renderRightsColHTML = () => {
      if (isBlank) {
        return `
          <div class="c20-card">
            <div class="c20-card-title">Права, Слабость и Дом</div>
            <div class="c20-note-line"><strong>Врождённые права:</strong></div>
            ${renderRuledBlock('', 3)}
            <div class="c20-note-line"><strong>Слабость Кита:</strong></div>
            ${renderRuledBlock('', 2)}
            <div class="c20-note-line"><strong>Дар и Изъян Дома:</strong></div>
            ${renderRuledBlock('', 2)}
            ${
              isCompact
                ? `
              <div class="c20-note-line" style="margin-top:0.15em;"><strong>Наследия (Призвание / Запрет):</strong></div>
              ${renderRuledBlock('', 2)}
              <div class="c20-note-line"><strong>Порог Гламура:</strong> ______________________</div>
              <div class="c20-note-line"><strong>Антитеза:</strong> ___________________________</div>
              <div class="c20-note-line"><strong>Достоинства / Недостатки:</strong></div>
              ${renderRuledBlock('', 2)}`
                : ''
            }
          </div>`;
      }
      const blocks = [];
      if (comp.kith) {
        (comp.kith.birthrights || []).forEach((br) => {
          const mech = br.sheetSummary || cleanMdPlain((br.paragraphs || []).join(' '));
          blocks.push(`<div class="c20-note-line"><strong>Право · ${escHtml(stripEnParens(br.name))}:</strong> ${escHtml(mech)}</div>`);
        });
        if (comp.kith.frailty) {
          const mechF = comp.kith.frailty.sheetSummary || cleanMdPlain((comp.kith.frailty.paragraphs || []).join(' '));
          blocks.push(
            `<div class="c20-note-line"><strong>Слабость · ${escHtml(stripEnParens(comp.kith.frailty.name))}:</strong> ${escHtml(mechF)}</div>`
          );
        }
      } else {
        blocks.push('<div class="c20-note-line"><strong>Права и Слабость:</strong> Кит не выбран</div>');
      }
      if (comp.house) {
        const boonSum = comp.house.boon.sheetSummary || cleanMdPlain((comp.house.boon.paragraphs || [comp.house.boon.text || '']).join(' '));
        const flawSum = comp.house.flaw.sheetSummary || cleanMdPlain((comp.house.flaw.paragraphs || [comp.house.flaw.text || '']).join(' '));
        blocks.push(`<div class="c20-note-line"><strong>Дар (${escHtml(stripEnParens(comp.house.boon.name))}):</strong> ${escHtml(boonSum)}</div>`);
        blocks.push(`<div class="c20-note-line"><strong>Изъян (${escHtml(stripEnParens(comp.house.flaw.name))}):</strong> ${escHtml(flawSum)}</div>`);
      }
      if (isCompact) {
        if (primaryLeg) {
          blocks.push(
            `<div class="c20-note-line" style="padding-top:0.15em;border-top:0.5pt solid var(--sh-rule-soft);"><strong>Ведущее Наследие (${escHtml(primaryLeg.ru)}):</strong> Призвание — ${escHtml(primaryLeg.quest)} Запрет — ${escHtml(primaryLeg.ban)}</div>`
          );
        }
        if (secondaryLeg) {
          blocks.push(
            `<div class="c20-note-line"><strong>Второе Наследие (${escHtml(secondaryLeg.ru)}):</strong> Призвание — ${escHtml(secondaryLeg.quest)} Запрет — ${escHtml(secondaryLeg.ban)}</div>`
          );
        }
        blocks.push(
          `<div class="c20-note-line" style="padding-top:0.15em;border-top:0.5pt solid var(--sh-rule-soft);"><strong>Порог Гламура:</strong> ${
            comp.threshold
              ? `${escHtml(comp.threshold.ru)} (${escHtml(comp.threshold.typeRu)}) — ${escHtml(comp.threshold.tagline)}`
              : 'определится в игре'
          }</div>`
        );
        blocks.push(`<div class="c20-note-line"><strong>Антитеза:</strong> ${escHtml(sheet.antithesis || 'не выбрана')}</div>`);
        const mfAll = [
          ...(sheet.freebie.merits || []).map((m) => `+${m.ru} (−${m.cost})`),
          ...(sheet.freebie.flaws || []).map((f) => `−${f.ru} (+${f.cost})`)
        ];
        if (mfAll.length) {
          blocks.push(`<div class="c20-note-line"><strong>Достоинства / Недостатки:</strong> ${escHtml(mfAll.join('; '))}</div>`);
        }
      }
      return `
        <div class="c20-card">
          <div class="c20-card-title">Права, Слабость и Дом</div>
          ${blocks.join('')}
        </div>`;
    };

    const tempersColHTML = `
      <div class="c20-card">
        <div class="c20-card-title" style="text-align:center;">Темпераменты</div>
        <div class="c20-temper-stack">
          <div class="c20-temper-block">
            <div class="c20-temper-title">Гламур</div>
            ${renderSheetDots(isBlank ? 0 : comp.glamour, 10, { blank: isBlank })}
            ${renderSheetBoxes(10)}
          </div>
          <div class="c20-temper-block">
            <div class="c20-temper-title">Сила Воли</div>
            ${renderSheetDots(isBlank ? 0 : comp.willpower, 10, {
              lockedAfter: !isBlank && comp.maxWillpower < 10 ? comp.maxWillpower : 0,
              blank: isBlank
            })}
            ${renderSheetBoxes(10)}
            <div class="c20-temper-sub" style="text-align:center;">${!isBlank && comp.maxWillpower < 10 ? `предел ${comp.maxWillpower} (Дом Балор) · ` : ''}Дисбаланс обводится на квадратах · Бедлам — когда отмечены все</div>
          </div>
          <div class="c20-temper-block">
            <div class="c20-temper-title">Кошмар</div>
            ${renderSheetBoxes(10)}
            <div class="c20-temper-sub" style="text-align:center;">при 10: сброс в 0, 1 Дисбаланс на Силе Воли и +1 временный Гламур</div>
          </div>
          <div class="c20-temper-block">
            <div class="c20-temper-title">Банальность</div>
            ${renderSheetDots(isBlank ? 0 : comp.banality, 10, { banality: true, blank: isBlank })}
            ${renderSheetBoxes(10)}
            <div class="c20-temper-sub" style="text-align:center;">сверх 10 временных: сброс и +1 постоянная · 10 постоянных — Развеивание</div>
          </div>
        </div>
      </div>`;

    const extraBruised = isBlank ? 0 : comp.extraBruised;
    const healthLevelsList = [];
    for (let b = 0; b < extraBruised; b++) healthLevelsList.push(['Синяки (Клятва)', '0']);
    healthLevelsList.push(
      ['Синяки', '0'],
      ['Ушиблен', '−1'],
      ['Ранен', '−1'],
      ['Тяжело ранен', '−2'],
      ['Изувечен', '−2'],
      ['Искалечен', '−5'],
      ['Недееспособен', '—']
    );

    const healthColHTML = `
      <div class="c20-card">
        <div class="c20-card-title" style="text-align:center;">Здоровье и Опыт</div>
        <table class="c20-health-table">
          <thead>
            <tr>
              <th>Уровень</th>
              <th class="cen">Штраф</th>
              <th class="cen">Реал.</th>
              <th class="cen">Хим.</th>
            </tr>
          </thead>
          <tbody>
            ${healthLevelsList
              .map(
                ([lvl, pen]) => `
              <tr>
                <td>${escHtml(lvl)}</td>
                <td class="pen">${escHtml(pen)}</td>
                <td class="cen"><span class="c20-box"></span></td>
                <td class="cen"><span class="c20-box"></span></td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div class="c20-temper-sub" style="text-align:center;margin-top:0.15em;">/ ударный · ✕ летальный · ✳ аггравированный</div>
        <div class="c20-note-line" style="padding-top:0.25em;margin-top:0.2em;border-top:0.5pt solid var(--sh-rule-soft);display:flex;justify-content:space-between;gap:0.4em;">
          <span><strong>Опыт:</strong> ________</span>
          <span><strong>Потрачено:</strong> ________</span>
        </div>
      </div>`;

    const bottomBandHTML = `
      <div class="c20-bottom-band">
        ${renderRightsColHTML()}
        ${tempersColHTML}
        ${healthColHTML}
      </div>`;

    const metaLabel = isBlank
      ? 'Чистый игровой бланк (A4)'
      : `Свободные очки: ${comp.freebieSpent} / ${comp.freebiePool} · Шагов: ${(sheet.completedSteps || []).length} / 9`;

    const page1HTML = `
      <div class="c20-page-badge no-print">${isCompact ? 'Компактный бланк · 1 лист A4' : 'Лист I · Игровой бланк (A4)'}</div>
      <div class="c20-page-fit-box">
        <section class="c20-sheet-page ${isCompact ? 'c20-page-compact' : 'c20-page-1'}">
        <div class="c20-sheet-frame">
          ${renderSheetCornersSVG()}
          <header class="c20-banner">
            <div>
              <div class="c20-banner-sub">Changeling: The Dreaming · 20th Anniversary Edition</div>
              <div class="c20-banner-title">Лист Подменыша</div>
            </div>
            <div class="c20-banner-meta">
              <div><strong>${isBlank ? 'Безымянный слёток / Новый персонаж' : escHtml(sheet.name || 'Безымянный слёток')}</strong></div>
              <div>${escHtml(metaLabel)}</div>
            </div>
          </header>

          ${passportHTML}
          ${renderSheetSectionHead('Атрибуты')}
          ${attrGridHTML}
          ${renderSheetSectionHead('Способности')}
          ${abilGridHTML}
          ${renderSheetSectionHead('Преимущества')}
          ${advGridHTML}
          ${bottomBandHTML}
          ${
            isCompact
              ? `
            ${renderSheetSectionHead('Искра жизни и облик')}
            <div class="c20-grid-2">
              <div class="c20-card">
                <div class="c20-note-line"><strong>Смертный облик:</strong></div>
                ${renderRuledBlock(isBlank ? '' : sheet.mortalGuise, 2)}
                <div class="c20-note-line" style="margin-top:0.15em;"><strong>Облик феи и Вуаль:</strong></div>
                ${renderRuledBlock(isBlank ? '' : sheet.faeMien, 2)}
              </div>
              <div class="c20-card">
                <div class="c20-note-line"><strong>Цели и причуды:</strong></div>
                ${renderRuledBlock(isBlank ? '' : [sheet.goals, sheet.quirks].filter(Boolean).join(' · '), 2)}
                <div class="c20-note-line" style="margin-top:0.15em;"><strong>Хризалида, Мотли и Клятвы:</strong></div>
                ${renderRuledBlock(isBlank ? '' : sheet.backstory, 2)}
              </div>
            </div>`
              : ''
          }
          <footer class="c20-sheet-footer">
            <span>Подменыши: Грёза · Книга Игрока</span>
            <span>${isCompact ? 'Компактный лист A4' : 'Лист I · Игровые параметры'}</span>
          </footer>
        </div>
        </section>
      </div>`;

    let page2HTML = '';
    if (!isCompact) {
      const merits = isBlank ? [] : sheet.freebie.merits || [];
      const flaws = isBlank ? [] : sheet.freebie.flaws || [];
      const meritLines = merits.map((m) => `✦ <strong>${escHtml(m.ru)}</strong> (−${m.cost})${m.note ? ` — ${escHtml(m.note)}` : ''}`);
      const flawLines = flaws.map((f) => `◆ <strong>${escHtml(f.ru)}</strong> (+${f.cost})${f.note ? ` — ${escHtml(f.note)}` : ''}`);
      const meritPad = Math.max(0, 3 - meritLines.length);
      const flawPad = Math.max(0, 3 - flawLines.length);
      const oppositeCourt = sheet.court === 'Благой' ? 'Неблагой' : 'Благой';

      const emptyRows = (cols, count) =>
        Array.from({ length: count }, () => `<tr>${Array.from({ length: cols }, () => '<td>&nbsp;</td>').join('')}</tr>`).join('');

      page2HTML = `
        <div class="c20-page-badge no-print">Лист II · Хроника, облик и снаряжение (A4)</div>
        <div class="c20-page-fit-box c20-page-break">
          <section class="c20-sheet-page c20-page-2">
          <div class="c20-sheet-frame">
            ${renderSheetCornersSVG()}
            <header class="c20-banner">
              <div>
                <div class="c20-banner-sub">Подменыши: Грёза · Хроника, магия и снаряжение</div>
                <div class="c20-banner-title">${isBlank ? 'Лист Хроники' : escHtml(sheet.name || 'Безымянный слёток')}</div>
              </div>
              <div class="c20-banner-meta">
                <div><strong>${isBlank ? 'Кит / Двор / Дом' : escHtml([comp.kith ? comp.kith.ru : '', sheet.court, comp.house ? comp.house.ru : ''].filter(Boolean).join(' · '))}</strong></div>
                <div>Лист II · Продолжение досье</div>
              </div>
            </header>

            <div class="c20-grid-2">
              <div class="c20-card">
                <div class="c20-card-title">Наследия: Призвание и Запрет</div>
                ${
                  isBlank
                    ? `
                  <div class="c20-note-line"><strong>Ведущее Наследие:</strong> _____________________</div>
                  <div class="c20-note-line"><strong>Призвание:</strong></div>
                  ${renderRuledBlock('', 1)}
                  <div class="c20-note-line"><strong>Запрет:</strong></div>
                  ${renderRuledBlock('', 1)}
                  <div class="c20-note-line" style="margin-top:0.15em;padding-top:0.15em;border-top:0.5pt solid var(--sh-rule-soft);"><strong>Второе Наследие:</strong> ______________________</div>
                  <div class="c20-note-line"><strong>Призвание:</strong></div>
                  ${renderRuledBlock('', 1)}
                  <div class="c20-note-line"><strong>Запрет:</strong></div>
                  ${renderRuledBlock('', 1)}`
                    : `
                  <div class="c20-note-line"><strong>Ведущее · ${primaryLeg ? escHtml(primaryLeg.ru) : 'не выбрано'}</strong> (${escHtml(sheet.court)} Двор)</div>
                  ${
                    primaryLeg
                      ? `<div class="c20-note-line"><strong>Призвание:</strong> ${escHtml(primaryLeg.quest)}</div>
                         <div class="c20-note-line"><strong>Запрет:</strong> ${escHtml(primaryLeg.ban)}</div>`
                      : ''
                  }
                  <div class="c20-note-line" style="margin-top:0.15em;padding-top:0.15em;border-top:0.5pt solid var(--sh-rule-soft);"><strong>Второе · ${secondaryLeg ? escHtml(secondaryLeg.ru) : 'не выбрано'}</strong> (${oppositeCourt} Двор)</div>
                  ${
                    secondaryLeg
                      ? `<div class="c20-note-line"><strong>Призвание:</strong> ${escHtml(secondaryLeg.quest)}</div>
                         <div class="c20-note-line"><strong>Запрет:</strong> ${escHtml(secondaryLeg.ban)}</div>`
                      : ''
                  }`
                }
                <div class="c20-temper-sub" style="margin-top:0.15em;">Призвание восстанавливает Силу Воли · нарушение Запрета отнимает 1 пункт Силы Воли</div>
              </div>

              <div class="c20-card">
                <div class="c20-card-title">Порог Гламура и Антитеза</div>
                ${
                  isBlank
                    ? `
                  <div class="c20-note-line"><strong>Порог Гламура:</strong> ______________________</div>
                  <div class="c20-note-line"><strong>Вдохновение / Опустошение и способ добычи:</strong></div>
                  ${renderRuledBlock('', 4)}
                  <div class="c20-note-line" style="margin-top:0.15em;"><strong>Антитеза:</strong> ___________________________</div>`
                    : `
                  <div class="c20-note-line"><strong>${comp.threshold ? `${escHtml(comp.threshold.ru)} (${escHtml(comp.threshold.typeRu)})` : 'Порог определится в первых сценах игры'}</strong></div>
                  ${comp.threshold ? `<div class="c20-note-line">${escHtml(comp.threshold.desc)}</div>` : ''}
                  <div class="c20-note-line" style="margin-top:0.2em;padding-top:0.2em;border-top:0.5pt solid var(--sh-rule-soft);"><strong>Антитеза:</strong> ${escHtml(sheet.antithesis || 'не указана')}</div>`
                }
              </div>
            </div>

            <div class="c20-card">
              <div class="c20-card-title">Достоинства и Недостатки</div>
              <div class="c20-grid-2">
                <div>
                  <div class="c20-note-line"><strong>Достоинства</strong></div>
                  ${meritLines.map((ln) => `<div class="c20-note-line">${ln}</div>`).join('')}
                  ${meritPad > 0 ? `<div class="c20-ruled-lines">${Array.from({ length: meritPad }, () => '<div class="c20-ruled-line"></div>').join('')}</div>` : ''}
                </div>
                <div>
                  <div class="c20-note-line"><strong>Недостатки</strong></div>
                  ${flawLines.map((ln) => `<div class="c20-note-line">${ln}</div>`).join('')}
                  ${flawPad > 0 ? `<div class="c20-ruled-lines">${Array.from({ length: flawPad }, () => '<div class="c20-ruled-line"></div>').join('')}</div>` : ''}
                </div>
              </div>
            </div>

            ${renderSheetSectionHead('Искра жизни и облик')}
            <div class="c20-grid-2">
              <div class="c20-card">
                <div class="c20-card-title">Смертный облик</div>
                ${renderRuledBlock(isBlank ? '' : sheet.mortalGuise, 2)}
              </div>
              <div class="c20-card">
                <div class="c20-card-title">Облик феи и Вуаль</div>
                ${renderRuledBlock(isBlank ? '' : sheet.faeMien, 2)}
              </div>
              <div class="c20-card">
                <div class="c20-card-title">Три цели</div>
                ${renderRuledBlock(isBlank ? '' : sheet.goals, 2)}
              </div>
              <div class="c20-card">
                <div class="c20-card-title">Причуды и привычки</div>
                ${renderRuledBlock(isBlank ? '' : sheet.quirks, 2)}
              </div>
            </div>
            <div class="c20-card">
              <div class="c20-card-title">Хризалида, смертная жизнь и связь с Мотли</div>
              ${renderRuledBlock(isBlank ? '' : sheet.backstory, 2)}
            </div>

            ${renderSheetSectionHead('Кантрипы, Сокровища и Снаряжение')}
            ${(() => {
              const unlockedCantrips = [];
              if (!isBlank) {
                ARTS.forEach((ar) => {
                  const rating = comp.finalArt[ar.id] || 0;
                  if (rating > 0) {
                    (ar.cantrips || []).forEach((c) => {
                      if (c.dots <= rating) {
                        unlockedCantrips.push({
                          artRu: ar.ru,
                          artRating: rating,
                          dots: c.dots,
                          ru: c.ru,
                          typeRu: c.typeRu || '',
                          summary: c.sheetSummary || cleanMdPlain((c.system || [])[0] || '')
                        });
                      }
                    });
                  }
                });
              }
              const padRows = Math.max(0, 4 - unlockedCantrips.length);
              const filledRowsHTML = unlockedCantrips
                .map(
                  (ct) => `
                  <tr class="c20-cantrip-row">
                    <td><strong>${escHtml(ct.ru)}</strong><div class="c20-temper-sub">${escHtml(ct.artRu)} ${'•'.repeat(ct.dots)}</div></td>
                    <td>${escHtml(ct.typeRu.replace(' или ', ' / '))}</td>
                    <td>${escHtml(ct.summary)}</td>
                    <td>${ct.artRating} + Владение</td>
                  </tr>`
                )
                .join('');
              return `
                <table class="c20-pencil-table">
                  <thead>
                    <tr>
                      <th style="width:25%;">Кантрип и Искусство</th>
                      <th style="width:15%;">Тип</th>
                      <th style="width:46%;">Суть и эффект</th>
                      <th style="width:14%;">Запас</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filledRowsHTML}${emptyRows(4, padRows)}
                  </tbody>
                </table>`;
            })()}

            <div class="c20-grid-2">
              <table class="c20-pencil-table">
                <thead>
                  <tr>
                    <th style="width:45%;">Сокровище, Химера или Дар</th>
                    <th style="width:55%;">Уровень, Гламур и свойства</th>
                  </tr>
                </thead>
                <tbody>
                  ${emptyRows(2, 4)}
                </tbody>
              </table>

              <div style="display:flex;flex-direction:column;gap:0.45em;">
                <table class="c20-pencil-table">
                  <thead>
                    <tr>
                      <th style="width:46%;">Оружие / Броня</th>
                      <th style="width:22%;">Сложность</th>
                      <th style="width:32%;">Урон / Защита</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${emptyRows(3, 3)}
                  </tbody>
                </table>
                <div class="c20-card">
                  <div class="c20-card-title">Клятвы, Дворы и союзники</div>
                  ${renderRuledBlock('', 2)}
                </div>
              </div>
            </div>

            <footer class="c20-sheet-footer">
              <span>Опыт: Текущий ________ · Потрачено ________ · Всего ________</span>
              <span>Changeling: The Dreaming 20th · Лист II</span>
            </footer>
          </div>
          </section>
        </div>`;
    }

    return `
      <div class="c20-sheet-root" data-pages="${opts.pages}" data-palette="${opts.palette}" style="--sheet-scale:${opts.scale};">
        <div class="c20-sheet-stack">
          ${page1HTML}
          ${page2HTML}
        </div>
      </div>`;
  }

  function renderDossierSummaryHTML(sheet, comp) {
    const kithName = comp.kith ? `${escHtml(comp.kith.ru)} <span class="text-xs opacity-75">(${escHtml(comp.kith.en)})</span>` : 'Не выбран';
    const houseName = comp.house ? escHtml(comp.house.ru) : 'Без титула';
    const primaryLeg = sheet.court === 'Благой' ? comp.seelieLegacy : comp.unseelieLegacy;
    const secondaryLeg = sheet.court === 'Благой' ? comp.unseelieLegacy : comp.seelieLegacy;
    const abilsTaken = ABILITIES.filter((ab) => comp.finalAbil[ab.id] > 0);
    const bgsTaken = BACKGROUNDS.filter((b) => comp.finalBg[b.id] > 0);
    const artsTaken = ARTS.filter((ar) => comp.finalArt[ar.id] > 0);
    const realmsTaken = REALMS.filter((rl) => comp.finalRealm[rl.id] > 0);
    const boxCls = 'rounded-xl border border-[#d8b979]/22 bg-[#0b110f]/60 p-3.5 space-y-2';
    const headCls = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8b979] border-b border-[#d8b979]/20 pb-1';
    const extraLevelsText = comp.extraBruised > 0 ? `${'Синяки [0] · '.repeat(comp.extraBruised)}` : '';
    const healthTrackText = `${extraLevelsText}Синяки [0] · Ушиблен [−1] · Ранен [−1] · Тяжело ранен [−2] · Изувечен [−2] · Искалечен [−5] · Недееспособен`;

    return `
      <div class="nouveau-panel p-5 sm:p-7 space-y-5">
        <div class="relative z-10 flex flex-wrap items-baseline justify-between gap-3 border-b border-[#d8b979]/25 pb-3">
          <div>
            <div class="text-[11px] uppercase tracking-[0.2em] text-[#d8b979]">Сводка персонажа · Changeling: The Dreaming 20th</div>
            <h3 class="font-nouveau text-2xl sm:text-3xl font-semibold text-[#f0eadc] !mt-0.5 !mb-0">${escHtml(sheet.name || 'Безымянный слёток')}</h3>
          </div>
          <div class="text-xs text-[#a69f90] text-right">
            <div>Свободные очки: <strong class="text-[#f0dba8]">${comp.freebieSpent}</strong> из <strong class="text-[#f0dba8]">${comp.freebiePool}</strong></div>
            <div>Пройдено шагов: <strong class="text-[#f0dba8]">${(sheet.completedSteps || []).length}</strong> из 9</div>
          </div>
        </div>

        <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
          <div class="${boxCls}">
            <div class="${headCls}">Происхождение и душа</div>
            <div><strong>Замысел:</strong> ${escHtml(sheet.concept || '—')}</div>
            <div><strong>Мотли:</strong> ${escHtml(sheet.motley || '—')}</div>
            <div><strong>Кит:</strong> ${kithName}${comp.kith ? ` · <em>Сродство: ${escHtml(comp.kith.affinity)}</em>` : ''}</div>
            <div><strong>Двор и Стадия:</strong> ${escHtml(sheet.court)} · ${escHtml(SEEMING_NAMES[sheet.seeming] || 'Дикарь')}</div>
            <div><strong>Благородный Дом:</strong> ${houseName}</div>
            <div><strong>Ведущее Наследие:</strong> ${
              primaryLeg
                ? `${escHtml(primaryLeg.ru)} — <em>Призвание:</em> ${escHtml(primaryLeg.quest)} <em>Запрет:</em> ${escHtml(primaryLeg.ban)}`
                : '—'
            }</div>
            <div><strong>Второе Наследие:</strong> ${
              secondaryLeg
                ? `${escHtml(secondaryLeg.ru)} — <em>Призвание:</em> ${escHtml(secondaryLeg.quest)} <em>Запрет:</em> ${escHtml(secondaryLeg.ban)}`
                : '—'
            }</div>
          </div>

          <div class="${boxCls}">
            <div class="${headCls}">Темпераменты, Порог и Здоровье</div>
            <div><strong>Сила Воли:</strong> ${comp.willpower} ${renderDotStrip(comp.willpower, comp.maxWillpower)} <span class="opacity-70">(предел ${comp.maxWillpower})</span></div>
            <div><strong>Гламур:</strong> ${comp.glamour} ${renderDotStrip(comp.glamour, 10)}</div>
            <div><strong>Банальность:</strong> ${comp.banality} ${renderDotStrip(comp.banality, 10)}</div>
            <div><strong>Кошмар:</strong> 0 из 10</div>
            <div><strong>Порог Гламура:</strong> ${comp.threshold ? `${escHtml(comp.threshold.ru)} (${escHtml(comp.threshold.typeRu)})` : 'определится в игре'}</div>
            <div><strong>Антитеза:</strong> ${escHtml(sheet.antithesis || 'не выбрана')}</div>
            <div><strong>Шкалы Здоровья (${comp.healthLevels}):</strong> ${healthTrackText}</div>
          </div>
        </div>

        <div class="relative z-10 ${boxCls}">
          <div class="${headCls}">Атрибуты</div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            ${['physical', 'social', 'mental'].map((g) => `
              <div class="space-y-1">
                <div class="font-semibold opacity-80">${ATTR_GROUP_NAMES[g]}</div>
                ${ATTRIBUTES.filter((a) => a.group === g).map((a) => `
                  <div class="flex items-center justify-between gap-2">
                    <span>${a.ru}${comp.bonusSources[a.id] ? ` <span class="opacity-75">(${comp.bonusSources[a.id]})</span>` : ''}</span>
                    <span class="font-semibold text-[#f0dba8]">${comp.finalAttr[a.id]}</span>
                  </div>`).join('')}
              </div>`).join('')}
          </div>
        </div>

        <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div class="${boxCls}">
            <div class="${headCls}">Способности</div>
            ${abilsTaken.length
              ? `<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">${abilsTaken.map((ab) => {
                  const cn = sheet.customAbilityNames && sheet.customAbilityNames[ab.id];
                  return `<div class="flex items-center justify-between gap-2"><span>${ab.ru}${cn ? ` (${escHtml(cn)})` : ''}</span><strong class="text-[#f0dba8]">${comp.finalAbil[ab.id]}</strong></div>`;
                }).join('')}</div>`
              : '<div class="opacity-70">Способности ещё не распределены.</div>'}
          </div>

          <div class="${boxCls}">
            <div class="${headCls}">Дополнения, Искусства и Владения</div>
            ${bgsTaken.length ? `<div><strong>Дополнения:</strong> ${bgsTaken.map((b) => `${b.ru} ${comp.finalBg[b.id]}`).join(' · ')}</div>` : '<div class="opacity-70">Дополнения не выбраны.</div>'}
            ${artsTaken.length ? `<div><strong>Искусства:</strong> ${artsTaken.map((ar) => {
              const rating = comp.finalArt[ar.id];
              const unlocked = (ar.cantrips || []).filter((c) => c.dots <= rating).map((c) => escHtml(c.ru));
              return `${escHtml(ar.ru)} ${rating}${unlocked.length ? ` <span class="opacity-80">(${unlocked.join(', ')})</span>` : ''}`;
            }).join(' · ')}</div>` : '<div class="opacity-70">Искусства не выбраны.</div>'}
            ${realmsTaken.length ? `<div><strong>Владения:</strong> ${realmsTaken.map((rl) => `${rl.ru} ${comp.finalRealm[rl.id]}${comp.affinityRealmId === rl.id ? ' ★' : ''}`).join(' · ')}</div>` : '<div class="opacity-70">Владения не выбраны.</div>'}
          </div>
        </div>

        <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div class="${boxCls}">
            <div class="${headCls}">Права, Дары, Достоинства и Недостатки</div>
            ${comp.kith ? `<div><strong>Врождённые права:</strong> ${(comp.kith.birthrights || []).map((b) => escHtml(b.name)).join(' · ')}</div>` : ''}
            ${comp.kith && comp.kith.frailty ? `<div><strong>Слабость Кита:</strong> ${escHtml(comp.kith.frailty.name)}</div>` : ''}
            ${comp.house ? `<div><strong>Дар и Изъян Дома:</strong> ${escHtml(comp.house.boon.name)} · ${escHtml(comp.house.flaw.name)}</div>` : ''}
            ${(sheet.freebie.merits || []).length ? `<div><strong>Достоинства:</strong> ${(sheet.freebie.merits || []).map((m) => `${escHtml(m.ru)} (${m.cost}${m.note ? `: ${escHtml(m.note)}` : ''})`).join('; ')}</div>` : ''}
            ${(sheet.freebie.flaws || []).length ? `<div><strong>Недостатки:</strong> ${(sheet.freebie.flaws || []).map((f) => `${escHtml(f.ru)} (${f.cost}${f.note ? `: ${escHtml(f.note)}` : ''})`).join('; ')}</div>` : ''}
          </div>

          <div class="${boxCls}">
            <div class="${headCls}">Специализации</div>
            ${comp.requiredSpecialties.length
              ? comp.requiredSpecialties.map((sp) => `<div><strong>${escHtml(sp.label)} (${sp.rating}):</strong> ${escHtml((sheet.specialties || {})[sp.key] || 'не указана')}</div>`).join('')
              : '<div class="opacity-70">Пока нет черт 4+ или обязательных специализаций.</div>'}
          </div>
        </div>

        <div class="relative z-10 ${boxCls} text-xs leading-relaxed">
          <div class="${headCls}">Искра жизни и облик</div>
          <div><strong>Смертный облик:</strong> ${escHtml(sheet.mortalGuise || '—')}</div>
          <div><strong>Облик феи и Вуаль:</strong> ${escHtml(sheet.faeMien || '—')}</div>
          <div><strong>Цели:</strong> ${escHtml(sheet.goals || '—').replace(/\n/g, ' · ')}</div>
          <div><strong>Причуды:</strong> ${escHtml(sheet.quirks || '—')}</div>
          <div><strong>Хризалида и Мотли:</strong> ${escHtml(sheet.backstory || '—')}</div>
        </div>
      </div>`;
  }

  function fitA4PreviewPages() {
    const stage = document.querySelector('#chrysalis-dossier-area .c20-preview-stage');
    if (!stage) return;
    const availW = Math.max(200, stage.clientWidth - 34);
    stage.querySelectorAll('.c20-page-fit-box').forEach((box) => {
      const page = box.querySelector('.c20-sheet-page');
      if (!page) return;
      page.style.transform = '';
      page.style.transformOrigin = '';
      box.style.width = '';
      box.style.height = '';
      const naturalW = page.offsetWidth;
      const naturalH = page.offsetHeight;
      if (naturalW > 0) {
        const ratio = Math.min(1, Math.max(0.28, availW / naturalW));
        if (ratio < 1) {
          page.style.transform = `scale(${ratio})`;
          page.style.transformOrigin = 'top left';
          box.style.width = `${Math.floor(naturalW * ratio)}px`;
          box.style.height = `${Math.ceil(naturalH * ratio)}px`;
        }
      }
    });
  }

  function renderDossierBodyHTML(sheet, comp, _forPrint = false) {
    return renderC20SheetHTML(sheet, comp, state.chrysalisPrint);
  }

  function initChrysalisPath() {
    const mount = document.getElementById('chrysalis-path-widget-mount');
    if (!mount || !CREATION_STEPS.length) return;

    state.chrysalisSheet = loadChrysalisSheet();
    state.chrysalisPrint = loadChrysalisPrint();
    if (!state.chrysalisResizeBound) {
      state.chrysalisResizeBound = true;
      window.addEventListener('resize', () => {
        if (state.chrysalisViewMode === 'dossier' && state.chrysalisDossierView === 'preview') {
          fitA4PreviewPages();
        }
      });
    }

    mount.innerHTML = `
      <section id="chrysalis-path" class="space-y-5 my-6 scroll-mt-24">
        <div id="chrysalis-toolbar" class="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#d8b979]/20 pb-3"></div>
        <div id="chrysalis-interactive-area" class="space-y-4">
          <div id="chrysalis-summary-bar" class="nouveau-panel p-3.5 sm:p-4"></div>
          <div id="chrysalis-stepper" class="flex flex-wrap gap-1.5"></div>
          <div id="chrysalis-step-body"></div>
          <div id="chrysalis-dossier-area" class="hidden space-y-4"></div>
        </div>
        <div id="chrysalis-scroll-area" class="hidden space-y-5 no-print"></div>
        <div id="print-chrysalis-container" class="print-only space-y-3"></div>
      </section>
    `;

    renderChrysalisAll();
  }

  function renderChrysalisAll() {
    renderChrysalisToolbar();
    renderChrysalisSummary();
    renderChrysalisStepper();
    renderChrysalisModeAreas();
    renderChrysalisScrollArea();
  }

  function renderChrysalisToolbar() {
    const tb = document.getElementById('chrysalis-toolbar');
    if (!tb) return;
    const mode = state.chrysalisViewMode;
    tb.innerHTML = `
      <div class="inline-flex flex-wrap rounded-full border border-[#d8b979]/35 bg-[#0b110f]/75 p-1">
        <button type="button" data-cview="interactive" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition ${mode === 'interactive' ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'}">✦ Девять шагов</button>
        <button type="button" data-cview="dossier" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition ${mode === 'dossier' ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'}">◈ Лист подменыша</button>
        <button type="button" data-cview="scroll" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition ${mode === 'scroll' ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90] hover:text-[#f0eadc]'}">☰ Книжный свиток</button>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" id="btn-load-saffron" class="px-3 py-1.5 rounded-full text-xs border border-[#d8b979]/40 bg-[#15211d]/85 text-[#f0dba8] hover:bg-[#d8b979]/20 transition">✦ Загрузить Саффрон (пример C20)</button>
        <button type="button" id="btn-reset-sheet" class="px-3 py-1.5 rounded-full text-xs border border-[#d8b979]/25 bg-[#0b110f]/65 text-[#a69f90] hover:text-[#f0eadc] transition">Очистить лист</button>
      </div>
    `;
    tb.querySelectorAll('[data-cview]').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.chrysalisViewMode = btn.getAttribute('data-cview');
        renderChrysalisAll();
      })
    );
    const loadBtn = document.getElementById('btn-load-saffron');
    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        state.chrysalisSheet = normalizeSheet(CREATION_DATA.saffronPreset);
        saveChrysalisSheet();
        renderChrysalisAll();
      });
    }
    const resetBtn = document.getElementById('btn-reset-sheet');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.chrysalisSheet = createEmptySheet();
        state.chrysalisStepIdx = 0;
        saveChrysalisSheet();
        renderChrysalisAll();
      });
    }
  }

  function renderChrysalisSummary() {
    const bar = document.getElementById('chrysalis-summary-bar');
    if (!bar) return;
    const hideSummary = state.chrysalisViewMode === 'scroll';
    bar.classList.toggle('hidden', hideSummary);
    if (hideSummary) return;

    const sheet = state.chrysalisSheet;
    const comp = computeCharacterSheet(sheet);
    const attrRem = Object.keys(sheet.attrPriority).map((g) => sheet.attrPriority[g] - comp.attrAddedByGroup[g]);
    const abilRem = Object.keys(sheet.abilPriority).map((g) => sheet.abilPriority[g] - comp.abilSpentByGroup[g]);
    bar.innerHTML = `
      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div class="flex flex-wrap items-center gap-2">
          <strong id="chrysalis-summary-name" class="font-nouveau text-lg text-[#f0dba8]">${escHtml(sheet.name || 'Новый подменыш')}</strong>
          ${comp.kith ? `<span class="px-2 py-0.5 rounded-full border border-[#d8b979]/35 bg-[#15211d] text-[#f0eadc]">${escHtml(comp.kith.ru)}</span>` : ''}
          <span class="px-2 py-0.5 rounded-full border border-[#d8b979]/25 bg-[#0b110f]/70 text-[#a69f90]">${escHtml(sheet.court)} · ${escHtml(SEEMING_NAMES[sheet.seeming] || 'Дикарь')}</span>
          ${comp.house ? `<span class="px-2 py-0.5 rounded-full border border-[#d8b979]/25 bg-[#0b110f]/70 text-[#f0dba8]">${escHtml(comp.house.ru)}</span>` : ''}
        </div>
        <div class="flex flex-wrap items-center gap-2 text-[11px] text-[#a69f90]">
          <span>Атрибуты: <strong class="text-[#f0dba8]">${attrRem.join('/')}</strong></span>
          <span>· Способности: <strong class="text-[#f0dba8]">${abilRem.join('/')}</strong></span>
          <span>· Свободные: <strong class="${comp.freebieRemaining < 0 ? 'text-[#ff9c8a]' : 'text-[#f0dba8]'}">${comp.freebieRemaining}/${comp.freebiePool}</strong></span>
        </div>
      </div>
    `;
  }

  function renderChrysalisStepper() {
    const strip = document.getElementById('chrysalis-stepper');
    if (!strip) return;
    const hideStepper = state.chrysalisViewMode !== 'interactive';
    strip.classList.toggle('hidden', hideStepper);
    if (hideStepper) return;

    const doneSet = new Set(state.chrysalisSheet.completedSteps || []);
    strip.innerHTML = CREATION_STEPS.map((st, idx) => {
      const act = idx === state.chrysalisStepIdx;
      const done = doneSet.has(st.id);
      return `
        <button type="button" data-cstep="${idx}"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition ${
            act
              ? 'border-[#f0dba8]/80 bg-[#d8b979]/22 text-[#f0dba8] font-medium'
              : done
                ? 'border-[#d8b979]/45 bg-[#15211d]/80 text-[#f0eadc]'
                : 'border-[#d8b979]/22 bg-[#0b110f]/60 text-[#a69f90] hover:text-[#f0eadc]'
          }">
          <span class="font-nouveau font-semibold">${st.num}</span>
          <span>${st.short}</span>
          ${done ? '<span class="text-[#78c87a]">✓</span>' : ''}
        </button>`;
    }).join('');
    strip.querySelectorAll('[data-cstep]').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.chrysalisStepIdx = parseInt(btn.getAttribute('data-cstep'), 10) || 0;
        renderChrysalisAll();
      })
    );
  }

  function renderChrysalisModeAreas() {
    const stepBody = document.getElementById('chrysalis-step-body');
    const dossierArea = document.getElementById('chrysalis-dossier-area');
    const scrollArea = document.getElementById('chrysalis-scroll-area');
    const intArea = document.getElementById('chrysalis-interactive-area');
    if (!stepBody || !dossierArea || !scrollArea || !intArea) return;

    const mode = state.chrysalisViewMode;
    intArea.classList.toggle('hidden', mode === 'scroll');
    scrollArea.classList.toggle('hidden', mode !== 'scroll');
    stepBody.classList.toggle('hidden', mode !== 'interactive');
    dossierArea.classList.toggle('hidden', mode !== 'dossier');

    if (mode === 'interactive') renderChrysalisStepBody();
    else if (mode === 'dossier') renderChrysalisDossierArea();
  }

  function renderChrysalisStepForm(step, sheet, comp) {
    if (step.id === 'concept') {
      const seelieLegacies = LEGACIES.filter((l) => l.court === 'Благой');
      const unseelieLegacies = LEGACIES.filter((l) => l.court === 'Неблагой');
      const activeLegacyId = sheet.court === 'Благой' ? sheet.seelieLegacyId : sheet.unseelieLegacyId;
      const activeLegacy = LEGACIES.find((l) => l.id === activeLegacyId) || null;
      const examples = CREATION_DATA.conceptExamples || [];
      return `
        <div class="space-y-4 rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-4">
          <div class="text-xs uppercase tracking-[0.18em] text-[#d8b979] font-semibold">◈ Анкета Шага I · Основа образа</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label class="space-y-1">
              <span class="text-[#a69f90]">Имя подменыша</span>
              <input type="text" data-sheet-field="name" value="${escHtml(sheet.name)}" placeholder="Например: Саффрон (Сэффи)" class="chrysalis-input" />
            </label>
            <label class="space-y-1">
              <span class="text-[#a69f90]">Мотли и союз</span>
              <input type="text" data-sheet-field="motley" value="${escHtml(sheet.motley)}" placeholder="Например: стражи фрихолда «Крафтверк»" class="chrysalis-input" />
            </label>
          </div>
          <div class="space-y-1.5 text-xs">
            <label class="block space-y-1">
              <span class="text-[#a69f90]">Замысел (призвание среди смертных)</span>
              <input type="text" id="chrysalis-concept-input" data-sheet-field="concept" value="${escHtml(sheet.concept)}" placeholder="Кем персонаж живёт и дышит" class="chrysalis-input" />
            </label>
            <details class="lore-only text-xs">
              <summary class="cursor-pointer text-[#d8b979] hover:text-[#f0dba8] select-none">Вдохновиться примерами замыслов из книги C20 (7)</summary>
              <div class="flex flex-wrap gap-1.5 pt-2">
                ${examples.map((ex, i) => `<button type="button" data-concept-sample="${i}" class="text-left px-2.5 py-1 rounded-lg border border-[#d8b979]/25 bg-[#15211d]/70 text-[11px] text-[#f0eadc]/90 hover:border-[#f0dba8]/60 transition">${escHtml(ex)}</button>`).join('')}
              </div>
            </details>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <label class="space-y-1">
              <span class="text-[#a69f90]">Кит (Kith)</span>
              <select data-sheet-select="kithId" class="chrysalis-input">
                <option value="">— Выберите Кит —</option>
                ${KITHS.map((k) => `<option value="${k.id}" ${sheet.kithId === k.id ? 'selected' : ''}>${escHtml(k.ru)} (Сродство: ${escHtml(k.affinity)})</option>`).join('')}
              </select>
              ${comp.kith ? `<a href="../02-kiths/index.html?kith=${comp.kith.id}#kiths-arcana" target="_blank" rel="noopener" class="inline-block text-[11px] text-[#d8b979] hover:underline">Открыть Аркан Кита ↗</a>` : ''}
            </label>

            <label class="space-y-1">
              <span class="text-[#a69f90]">Двор (Court)</span>
              <select data-sheet-select="court" class="chrysalis-input">
                <option value="Благой" ${sheet.court === 'Благой' ? 'selected' : ''}>Благой Двор (Seelie)</option>
                <option value="Неблагой" ${sheet.court === 'Неблагой' ? 'selected' : ''}>Неблагой Двор (Unseelie)</option>
              </select>
            </label>

            <label class="space-y-1">
              <span class="text-[#a69f90]">Стадия души (Seeming)</span>
              <select data-sheet-select="seeming" class="chrysalis-input">
                <option value="childling" ${sheet.seeming === 'childling' ? 'selected' : ''}>Младенец (+1 Гламур)</option>
                <option value="wilder" ${sheet.seeming === 'wilder' ? 'selected' : ''}>Дикарь (+1 Гламур или Сила Воли)</option>
                <option value="grump" ${sheet.seeming === 'grump' ? 'selected' : ''}>Ворчун (+1 Сила Воли)</option>
              </select>
            </label>

            <label class="space-y-1">
              <span class="text-[#a69f90]">Благое Наследие ${sheet.court === 'Благой' ? '★ (ведущее)' : '(скрытое)'}</span>
              <select data-sheet-select="seelieLegacyId" class="chrysalis-input">
                <option value="">— Выберите Благое Наследие —</option>
                ${seelieLegacies.map((l) => `<option value="${l.id}" ${sheet.seelieLegacyId === l.id ? 'selected' : ''}>${escHtml(l.ru)} (${escHtml(l.en)})</option>`).join('')}
              </select>
            </label>

            <label class="space-y-1">
              <span class="text-[#a69f90]">Неблагое Наследие ${sheet.court === 'Неблагой' ? '★ (ведущее)' : '(скрытое)'}</span>
              <select data-sheet-select="unseelieLegacyId" class="chrysalis-input">
                <option value="">— Выберите Неблагое Наследие —</option>
                ${unseelieLegacies.map((l) => `<option value="${l.id}" ${sheet.unseelieLegacyId === l.id ? 'selected' : ''}>${escHtml(l.ru)} (${escHtml(l.en)})</option>`).join('')}
              </select>
            </label>

            <label class="space-y-1">
              <span class="text-[#a69f90]">Благородный Дом</span>
              <select data-sheet-select="houseId" class="chrysalis-input">
                <option value="">Без титула (вольный простолюдин)</option>
                ${HOUSES.map((h) => `<option value="${h.id}" ${sheet.houseId === h.id ? 'selected' : ''}>${escHtml(h.ru)} (${escHtml(h.court)})</option>`).join('')}
              </select>
              ${comp.house ? `<a href="../03-noble-houses/index.html?house=${comp.house.id}#houses-arcana" target="_blank" rel="noopener" class="inline-block text-[11px] text-[#d8b979] hover:underline">Открыть витраж Дома ↗</a>` : ''}
            </label>
          </div>

          ${activeLegacy ? `
            <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/70 p-3 text-xs space-y-1">
              <div class="font-semibold text-[#f0dba8]">Ведущее Наследие: ${escHtml(activeLegacy.ru)} — ${escHtml(activeLegacy.tagline)}</div>
              <div><strong>Призвание:</strong> ${escHtml(activeLegacy.quest)}</div>
              <div><strong>Запрет:</strong> ${escHtml(activeLegacy.ban)}</div>
            </div>` : ''}
        </div>`;
    }

    if (step.id === 'traits') {
      const attrVals = [7, 5, 3];
      const abilVals = [13, 9, 5];
      return `
        <div class="space-y-5 rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-4">
          <div class="space-y-3">
            <div class="text-xs uppercase tracking-[0.18em] text-[#d8b979] font-semibold">◈ Анкета Шага II · Атрибуты (приоритеты 7 / 5 / 3)</div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
              ${['physical', 'social', 'mental'].map((g) => {
                const cap = sheet.attrPriority[g];
                const used = comp.attrAddedByGroup[g];
                const rem = cap - used;
                return `
                  <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/55 p-3 space-y-2">
                    <div class="flex items-center justify-between gap-2 border-b border-[#d8b979]/15 pb-1.5">
                      <div>
                        <div class="text-xs font-semibold text-[#f0dba8]">${ATTR_GROUP_NAMES[g]}</div>
                        <div class="text-[11px] ${rem < 0 ? 'text-[#ff9c8a]' : 'text-[#a69f90]'}">Остаток: <strong>${rem}</strong> из ${cap}</div>
                      </div>
                      <select data-prio-kind="attr" data-prio-group="${g}" class="chrysalis-input !w-auto !py-1 !px-2 text-xs">
                        ${attrVals.map((v) => `<option value="${v}" ${cap === v ? 'selected' : ''}>${v} очков</option>`).join('')}
                      </select>
                    </div>
                    <div class="space-y-1.5">
                      ${ATTRIBUTES.filter((a) => a.group === g).map((a) => {
                        const baseVal = sheet.attrBase[a.id] || 1;
                        return renderDotAdjusterRow(
                          escHtml(a.ru),
                          baseVal,
                          1,
                          5,
                          `data-dot-kind="attrBase" data-dot-id="${a.id}" data-dot-delta="-1" data-dot-group="${g}"`,
                          `data-dot-kind="attrBase" data-dot-id="${a.id}" data-dot-delta="1" data-dot-group="${g}"`,
                          comp.bonusSources[a.id] ? `+ бонус (${comp.bonusSources[a.id]})` : ''
                        );
                      }).join('')}
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>

          <div class="space-y-3">
            <div class="text-xs uppercase tracking-[0.18em] text-[#d8b979] font-semibold">◈ Анкета Шага II · Способности (приоритеты 13 / 9 / 5, максимум 3 до Свободных очков)</div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
              ${['talents', 'skills', 'knowledges'].map((g) => {
                const cap = sheet.abilPriority[g];
                const used = comp.abilSpentByGroup[g];
                const rem = cap - used;
                return `
                  <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/55 p-3 space-y-2">
                    <div class="flex items-center justify-between gap-2 border-b border-[#d8b979]/15 pb-1.5">
                      <div>
                        <div class="text-xs font-semibold text-[#f0dba8]">${ABIL_GROUP_NAMES[g]}</div>
                        <div class="text-[11px] ${rem < 0 ? 'text-[#ff9c8a]' : 'text-[#a69f90]'}">Остаток: <strong>${rem}</strong> из ${cap}</div>
                      </div>
                      <select data-prio-kind="abil" data-prio-group="${g}" class="chrysalis-input !w-auto !py-1 !px-2 text-xs">
                        ${abilVals.map((v) => `<option value="${v}" ${cap === v ? 'selected' : ''}>${v} очков</option>`).join('')}
                      </select>
                    </div>
                    <div class="space-y-1.5">
                      ${ABILITIES.filter((ab) => ab.group === g).map((ab) => {
                        const baseVal = sheet.abilBase[ab.id] || 0;
                        const customInput = ab.isCustomSlot && baseVal > 0
                          ? `<input type="text" data-custom-abil="${ab.id}" value="${escHtml((sheet.customAbilityNames || {})[ab.id] || '')}" placeholder="Укажите область..." class="chrysalis-input !py-1 !px-2 text-[11px] mt-1" />`
                          : '';
                        return `
                          <div>
                            ${renderDotAdjusterRow(
                              `${escHtml(ab.ru)}${ab.mandatorySpecialty ? ' *' : ''}`,
                              baseVal,
                              0,
                              3,
                              `data-dot-kind="abilBase" data-dot-id="${ab.id}" data-dot-delta="-1" data-dot-group="${g}"`,
                              `data-dot-kind="abilBase" data-dot-id="${ab.id}" data-dot-delta="1" data-dot-group="${g}"`
                            )}
                            ${customInput}
                          </div>`;
                      }).join('')}
                    </div>
                  </div>`;
              }).join('')}
            </div>
            <p class="text-[11px] text-[#a69f90] !my-0">* Отмечены Способности с обязательной специализацией уже с первой точки.</p>
          </div>
        </div>`;
    }

    if (step.id === 'advantages') {
      return `
        <div class="space-y-4 rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/55 p-3 space-y-2">
              <div class="flex items-center justify-between border-b border-[#d8b979]/15 pb-1.5">
                <div class="text-xs font-semibold text-[#f0dba8]">Дополнения (Backgrounds)</div>
                <div class="text-[11px] ${5 - comp.bgBaseTotal < 0 ? 'text-[#ff9c8a]' : 'text-[#a69f90]'}">Остаток: <strong>${5 - comp.bgBaseTotal}</strong> из 5</div>
              </div>
              <div class="space-y-1.5">
                ${BACKGROUNDS.map((b) => {
                  const notes = [];
                  if (b.poolable) notes.push('объединяется в Мотли');
                  if (b.id === 'title' && comp.house && (sheet.bgBase.title || 0) === 0) notes.push('нужен для выбранного Дома');
                  return renderDotAdjusterRow(
                    escHtml(b.ru),
                    sheet.bgBase[b.id] || 0,
                    0,
                    5,
                    `data-dot-kind="bgBase" data-dot-id="${b.id}" data-dot-delta="-1"`,
                    `data-dot-kind="bgBase" data-dot-id="${b.id}" data-dot-delta="1"`,
                    notes.join(' · ')
                  );
                }).join('')}
              </div>
            </div>

            <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/55 p-3 space-y-2">
              <div class="flex items-center justify-between border-b border-[#d8b979]/15 pb-1.5">
                <div class="text-xs font-semibold text-[#f0dba8]">Шесть Владений (Realms)</div>
                <div class="text-[11px] ${5 - comp.realmBaseTotal < 0 ? 'text-[#ff9c8a]' : 'text-[#a69f90]'}">Остаток: <strong>${5 - comp.realmBaseTotal}</strong> из 5</div>
              </div>
              <div class="space-y-1.5">
                ${REALMS.map((rl) => {
                  const isAff = comp.affinityRealmId === rl.id;
                  return renderDotAdjusterRow(
                    `${escHtml(rl.ru)}${isAff ? ' <span class="text-[#f0dba8]">★ Сродство</span>' : ''}`,
                    sheet.realmBase[rl.id] || 0,
                    0,
                    5,
                    `data-dot-kind="realmBase" data-dot-id="${rl.id}" data-dot-delta="-1"`,
                    `data-dot-kind="realmBase" data-dot-id="${rl.id}" data-dot-delta="1"`,
                    rl.kindRu
                  );
                }).join('')}
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/55 p-3 space-y-2.5">
            <div class="flex items-center justify-between border-b border-[#d8b979]/15 pb-1.5">
              <div class="text-xs font-semibold text-[#f0dba8]">Восемнадцать Искусств (Arts)</div>
              <div class="text-[11px] ${3 - comp.artBaseTotal < 0 ? 'text-[#ff9c8a]' : 'text-[#a69f90]'}">Остаток: <strong>${3 - comp.artBaseTotal}</strong> из 3</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${['seasons', 'elements', 'mind', 'fate'].map((grp) => `
                <div class="space-y-1.5">
                  <div class="text-[11px] uppercase tracking-wider text-[#d8b979]">${ART_GROUP_NAMES[grp]}</div>
                  ${ARTS.filter((ar) => ar.group === grp).map((ar) => {
                    const forbidden = sheet.houseId === 'scathach' && sheet.kithId !== 'arcadian_sidhe' && ar.id === 'sovereign';
                    return renderDotAdjusterRow(
                      escHtml(ar.ru),
                      sheet.artBase[ar.id] || 0,
                      0,
                      5,
                      `data-dot-kind="artBase" data-dot-id="${ar.id}" data-dot-delta="-1"`,
                      `data-dot-kind="artBase" data-dot-id="${ar.id}" data-dot-delta="1"`,
                      forbidden ? 'запрещено для Скатах (кроме Аркадийских ши)' : ''
                    );
                  }).join('')}
                </div>`).join('')}
            </div>
          </div>
        </div>`;
    }

    if (step.id === 'tempers') {
      return `
        <div class="space-y-4 rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-4 text-xs">
          ${sheet.seeming === 'wilder' ? `
            <div class="flex flex-wrap items-center gap-2 pb-2 border-b border-[#d8b979]/15">
              <span class="text-[#a69f90]">Дар <strong class="text-[#f0dba8]">Дикаря</strong>:</span>
              <button type="button" data-wilder-choice="glamour" class="px-3 py-1 rounded-full border transition ${sheet.wilderChoice === 'glamour' ? 'border-[#f0dba8]/80 bg-[#d8b979]/20 text-[#f0dba8]' : 'border-[#d8b979]/25 text-[#a69f90]'}">+1 к Гламуру</button>
              <button type="button" data-wilder-choice="willpower" class="px-3 py-1 rounded-full border transition ${sheet.wilderChoice === 'willpower' ? 'border-[#f0dba8]/80 bg-[#d8b979]/20 text-[#f0dba8]' : 'border-[#d8b979]/25 text-[#a69f90]'}">+1 к Силе Воли</button>
            </div>` : ''}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="rounded-lg border border-[#d8b979]/25 bg-[#15211d]/70 p-3 space-y-1.5">
              <div class="text-[#d8b979] uppercase tracking-wider text-[11px]">Сила Воли</div>
              <div class="font-nouveau text-2xl font-semibold text-[#f0eadc]">${comp.baseWillpower} <span class="text-xs font-sans text-[#a69f90]">(предел ${comp.maxWillpower})</span></div>
              <div>${renderDotStrip(comp.baseWillpower, comp.maxWillpower)}</div>
            </div>
            <div class="rounded-lg border border-[#d8b979]/25 bg-[#15211d]/70 p-3 space-y-1.5">
              <div class="text-[#d8b979] uppercase tracking-wider text-[11px]">Гламур</div>
              <div class="font-nouveau text-2xl font-semibold text-[#f0eadc]">${comp.baseGlamour} <span class="text-xs font-sans text-[#a69f90]">(предел 10)</span></div>
              <div>${renderDotStrip(comp.baseGlamour, 10)}</div>
            </div>
            <div class="rounded-lg border border-[#d8b979]/25 bg-[#15211d]/70 p-3 space-y-1.5">
              <div class="text-[#d8b979] uppercase tracking-wider text-[11px]">Банальность</div>
              <div class="font-nouveau text-2xl font-semibold text-[#f0eadc]">${comp.banality} <span class="text-xs font-sans text-[#a69f90]">${sheet.houseId === 'liam' ? '(Дом Лиам +1)' : '(база 3)'}</span></div>
              <div>${renderDotStrip(comp.banality, 10)}</div>
            </div>
          </div>
        </div>`;
    }

    if (step.id === 'birthrights') {
      const kithBlock = comp.kith
        ? `
          <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/60 p-3.5 space-y-2 text-xs leading-relaxed">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8b979]/15 pb-1.5">
              <strong class="text-sm font-nouveau text-[#f0dba8]">Кит: ${escHtml(comp.kith.ru)}</strong>
              <span class="text-[#a69f90]">Сродство: ${escHtml(comp.kith.affinity)}</span>
            </div>
            ${sheet.kithId === 'trolls' ? `
              <div class="flex flex-wrap items-center gap-2 py-1">
                <span class="text-[#a69f90]">Принесённых клятв верности (Мощь титана):</span>
                ${[0, 1, 2].map((o) => `<button type="button" data-troll-oaths="${o}" class="px-2.5 py-0.5 rounded-full border transition ${Number(sheet.trollOaths) === o ? 'border-[#f0dba8]/80 bg-[#d8b979]/20 text-[#f0dba8]' : 'border-[#d8b979]/25 text-[#a69f90]'}">${o}</button>`).join('')}
              </div>` : ''}
            ${(comp.kith.birthrights || []).map((br) => `<div><strong>${escHtml(br.name)}:</strong> ${linkifyHTML(formatInlineMd((br.paragraphs || []).join(' ')))}</div>`).join('')}
            ${comp.kith.frailty ? `<div><strong class="text-[#dfd0ff]">Слабость — ${escHtml(comp.kith.frailty.name)}:</strong> ${linkifyHTML(formatInlineMd((comp.kith.frailty.paragraphs || []).join(' ')))}</div>` : ''}
          </div>`
        : '<div class="text-xs text-[#a69f90]">Кит ещё не выбран на Шаге I — вернитесь и выберите народ Конкордии, чтобы подставились Врождённые права и Слабость.</div>';

      const houseBlock = comp.house
        ? `
          <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/60 p-3.5 space-y-2 text-xs leading-relaxed">
            <div class="font-nouveau text-sm font-semibold text-[#f0dba8] border-b border-[#d8b979]/15 pb-1.5">${escHtml(comp.house.ru)} (${escHtml(comp.house.court)} Двор)</div>
            <div><strong>Дар — ${escHtml(comp.house.boon.name)}:</strong> ${linkifyHTML(formatInlineMd((comp.house.boon.paragraphs || [comp.house.boon.text || '']).join(' ')))}</div>
            <div><strong class="text-[#ffd6c9]">Изъян — ${escHtml(comp.house.flaw.name)}:</strong> ${linkifyHTML(formatInlineMd((comp.house.flaw.paragraphs || [comp.house.flaw.text || '']).join(' ')))}</div>
          </div>`
        : '';

      return `<div class="space-y-3 rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-4">${kithBlock}${houseBlock}</div>`;
    }

    if (step.id === 'freebies') {
      const costRows = (CREATION_DATA.freebieCosts || [])
        .map((r) => `<tr><td class="font-medium text-[#f0dba8]">${escHtml(r.trait)}</td><td>${linkifyHTML(formatInlineMd(r.cost))}</td></tr>`)
        .join('');
      const mfFiltered = MF_ITEMS.filter((it) => {
        if (state.chrysalisMfKind !== 'all' && it.kind !== 'both' && it.kind !== state.chrysalisMfKind) return false;
        if (state.chrysalisMfQuery) {
          const q = state.chrysalisMfQuery.toLowerCase();
          return `${it.ru} ${it.en}`.toLowerCase().includes(q);
        }
        return true;
      });
      return `
        <div class="space-y-4 rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-4">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8b979]/15 pb-2.5">
            <div class="text-xs uppercase tracking-[0.18em] text-[#d8b979] font-semibold">◈ Анкета Шага VI · Свободные очки</div>
            <div class="text-xs">
              Доступно: <strong class="${comp.freebieRemaining < 0 ? 'text-[#ff9c8a]' : 'text-[#f0dba8]'}">${comp.freebieRemaining}</strong>
              <span class="text-[#a69f90]">(база 15 + ${comp.flawCredit} за Недостатки − потрачено ${comp.freebieSpent})</span>
            </div>
          </div>

          <div class="nouveau-table-wrap !my-1">
            <table class="nouveau-table text-xs">
              <thead><tr><th>Черта</th><th>Цена в Свободных очках</th></tr></thead>
              <tbody>${costRows}</tbody>
            </table>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/55 p-3 space-y-2">
              <div class="font-semibold text-[#f0dba8]">Темпераменты и Атрибуты (за Свободные очки)</div>
              ${renderDotAdjusterRow('Гламур (3 очка/точка)', comp.glamour, comp.baseGlamour, 10, 'data-fb-temper="glamour" data-dot-delta="-1"', 'data-fb-temper="glamour" data-dot-delta="1"')}
              ${renderDotAdjusterRow(`Сила Воли (2 очка/точка, макс. ${comp.maxWillpower})`, comp.willpower, comp.baseWillpower, comp.maxWillpower, 'data-fb-temper="willpower" data-dot-delta="-1"', 'data-fb-temper="willpower" data-dot-delta="1"')}
              <div class="pt-1 border-t border-[#d8b979]/15 text-[11px] text-[#a69f90]">Атрибуты (5 очков за точку):</div>
              <div class="space-y-1 max-h-52 overflow-y-auto pr-1">
                ${ATTRIBUTES.map((a) => {
                  const minV = (sheet.attrBase[a.id] || 1) + (comp.attrBonus[a.id] || 0);
                  return renderDotAdjusterRow(escHtml(a.ru), comp.finalAttr[a.id], minV, comp.maxAttr[a.id], `data-fb-kind="attr" data-dot-id="${a.id}" data-dot-delta="-1"`, `data-fb-kind="attr" data-dot-id="${a.id}" data-dot-delta="1"`);
                }).join('')}
              </div>
            </div>

            <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/55 p-3 space-y-2">
              <div class="font-semibold text-[#f0dba8]">Способности (2), Дополнения (1), Искусства (5), Владения (2)</div>
              <details data-fb-drawer="abil" class="text-xs"${state.chrysalisFbOpen.abil ? ' open' : ''}>
                <summary class="cursor-pointer text-[#d8b979] py-1">Способности (2 очка за точку)</summary>
                <div class="space-y-1 max-h-48 overflow-y-auto pt-1 pr-1">
                  ${ABILITIES.map((ab) => renderDotAdjusterRow(escHtml(ab.ru), comp.finalAbil[ab.id], sheet.abilBase[ab.id] || 0, 5, `data-fb-kind="abil" data-dot-id="${ab.id}" data-dot-delta="-1"`, `data-fb-kind="abil" data-dot-id="${ab.id}" data-dot-delta="1"`)).join('')}
                </div>
              </details>
              <details data-fb-drawer="bg" class="text-xs"${state.chrysalisFbOpen.bg ? ' open' : ''}>
                <summary class="cursor-pointer text-[#d8b979] py-1">Дополнения (1 очко за точку)</summary>
                <div class="space-y-1 max-h-48 overflow-y-auto pt-1 pr-1">
                  ${BACKGROUNDS.map((b) => renderDotAdjusterRow(escHtml(b.ru), comp.finalBg[b.id], sheet.bgBase[b.id] || 0, 5, `data-fb-kind="bg" data-dot-id="${b.id}" data-dot-delta="-1"`, `data-fb-kind="bg" data-dot-id="${b.id}" data-dot-delta="1"`)).join('')}
                </div>
              </details>
              <details data-fb-drawer="art" class="text-xs"${state.chrysalisFbOpen.art ? ' open' : ''}>
                <summary class="cursor-pointer text-[#d8b979] py-1">Искусства (5 очков за точку)</summary>
                <div class="space-y-1 max-h-48 overflow-y-auto pt-1 pr-1">
                  ${ARTS.map((ar) => renderDotAdjusterRow(escHtml(ar.ru), comp.finalArt[ar.id], sheet.artBase[ar.id] || 0, 5, `data-fb-kind="art" data-dot-id="${ar.id}" data-dot-delta="-1"`, `data-fb-kind="art" data-dot-id="${ar.id}" data-dot-delta="1"`)).join('')}
                </div>
              </details>
              <details data-fb-drawer="realm" class="text-xs"${state.chrysalisFbOpen.realm ? ' open' : ''}>
                <summary class="cursor-pointer text-[#d8b979] py-1">Владения (2 очка за точку)</summary>
                <div class="space-y-1 max-h-48 overflow-y-auto pt-1 pr-1">
                  ${REALMS.map((rl) => renderDotAdjusterRow(escHtml(rl.ru), comp.finalRealm[rl.id], sheet.realmBase[rl.id] || 0, 5, `data-fb-kind="realm" data-dot-id="${rl.id}" data-dot-delta="-1"`, `data-fb-kind="realm" data-dot-id="${rl.id}" data-dot-delta="1"`)).join('')}
                </div>
              </details>
            </div>
          </div>

          <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/55 p-3 space-y-3 text-xs">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="font-semibold text-[#f0dba8]">Выбранные Достоинства (${comp.meritsCost}) и Недостатки (${comp.flawTotal}, в зачёт ${comp.flawCredit})</div>
              <a href="../06-merits-flaws/index.html#merits-flaws-widget-mount" target="_blank" rel="noopener" class="text-[11px] text-[#d8b979] hover:underline">Открыть Атлас Достоинств ↗</a>
            </div>
            <div class="space-y-1.5">
              ${(sheet.freebie.merits || []).map((m, i) => `
                <div class="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[#78c87a]/35 bg-[#0f1f17]/75">
                  <span>✦ <strong>${escHtml(m.ru)}</strong> (−${m.cost} очка)</span>
                  <input type="text" data-mf-note="merits" data-mf-idx="${i}" value="${escHtml(m.note || '')}" placeholder="Детали или заметка..." class="chrysalis-input !w-auto flex-1 min-w-[8rem] !py-0.5 !px-2 text-[11px]" />
                  <button type="button" data-rm-mf="merits" data-rm-idx="${i}" class="text-[#a69f90] hover:text-[#f0eadc]">Удалить ✕</button>
                </div>`).join('')}
              ${(sheet.freebie.flaws || []).map((f, i) => `
                <div class="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[#e06d44]/35 bg-[#231412]/75">
                  <span>◆ <strong>${escHtml(f.ru)}</strong> (+${f.cost} очка)</span>
                  <input type="text" data-mf-note="flaws" data-mf-idx="${i}" value="${escHtml(f.note || '')}" placeholder="Детали или заметка..." class="chrysalis-input !w-auto flex-1 min-w-[8rem] !py-0.5 !px-2 text-[11px]" />
                  <button type="button" data-rm-mf="flaws" data-rm-idx="${i}" class="text-[#a69f90] hover:text-[#f0eadc]">Удалить ✕</button>
                </div>`).join('')}
            </div>

            <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-[#d8b979]/15">
              <div class="inline-flex rounded-full border border-[#d8b979]/30 p-0.5">
                ${[['all', 'Все'], ['merit', 'Достоинства'], ['flaw', 'Недостатки']].map(([k, lbl]) => `
                  <button type="button" data-mf-pick-kind="${k}" class="px-2.5 py-1 rounded-full text-[11px] transition ${state.chrysalisMfKind === k ? 'bg-[#d8b979]/25 text-[#f0dba8]' : 'text-[#a69f90]'}">${lbl}</button>`).join('')}
              </div>
              <input type="search" id="chrysalis-mf-search" value="${escHtml(state.chrysalisMfQuery)}" placeholder="Поиск по 121 дару и недостатку..." class="chrysalis-input !w-auto flex-1 min-w-[12rem] !py-1 text-xs" />
            </div>
            <div id="chrysalis-mf-list" class="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              ${renderChrysalisMfResultsHTML(mfFiltered)}
            </div>
          </div>
        </div>`;
    }

    if (step.id === 'specialties') {
      return `
        <div class="space-y-3 rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-4 text-xs">
          <div class="text-xs uppercase tracking-[0.18em] text-[#d8b979] font-semibold">◈ Анкета Шага VII · Ваши специализации</div>
          ${comp.requiredSpecialties.length
            ? `<div class="space-y-3">${comp.requiredSpecialties.map((sp) => `
                <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/55 p-3 space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <strong class="text-[#f0dba8]">${escHtml(sp.label)} (${sp.rating})</strong>
                    <span class="text-[11px] text-[#a69f90]">${escHtml(sp.reason)}</span>
                  </div>
                  <input type="text" data-spec-key="${sp.key}" value="${escHtml((sheet.specialties || {})[sp.key] || '')}" placeholder="Впишите специализацию..." class="chrysalis-input" />
                  ${sp.suggestions.length ? `<div class="flex flex-wrap gap-1">${sp.suggestions.map((sg) => `<button type="button" data-spec-suggest="${sp.key}" data-spec-val="${escHtml(sg)}" class="px-2 py-0.5 rounded-full border border-[#d8b979]/25 bg-[#0b110f]/70 text-[11px] text-[#a69f90] hover:text-[#f0dba8]">+ ${escHtml(sg)}</button>`).join('')}</div>` : ''}
                </div>`).join('')}</div>`
            : '<div class="text-[#a69f90]">Пока ни один Атрибут или Способность не достигли рейтинга 4, и нет выбранных Способностей с обязательной специализацией.</div>'}
        </div>`;
    }

    if (step.id === 'threshold') {
      const musingList = THRESHOLDS.filter((t) => t.type === 'musing');
      const ravagingList = THRESHOLDS.filter((t) => t.type === 'ravaging');
      return `
        <div class="space-y-3 rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-4 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label class="space-y-1">
              <span class="text-[#a69f90]">Порог Гламура</span>
              <select data-sheet-select="thresholdId" class="chrysalis-input">
                <option value="">Определится в первых сценах игры</option>
                <optgroup label="Пороги Вдохновения (Musing)">
                  ${musingList.map((t) => `<option value="${t.id}" ${sheet.thresholdId === t.id ? 'selected' : ''}>${escHtml(t.ru)} (${escHtml(t.en)})</option>`).join('')}
                </optgroup>
                <optgroup label="Пороги Опустошения (Ravaging)">
                  ${ravagingList.map((t) => `<option value="${t.id}" ${sheet.thresholdId === t.id ? 'selected' : ''}>${escHtml(t.ru)} (${escHtml(t.en)})</option>`).join('')}
                </optgroup>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-[#a69f90]">Личная Антитеза</span>
              <input type="text" data-sheet-field="antithesis" value="${escHtml(sheet.antithesis)}" placeholder="Например: высмеивать чужое искреннее творчество" class="chrysalis-input" />
            </label>
          </div>
          ${comp.threshold ? `
            <div class="rounded-lg border border-[#d8b979]/20 bg-[#15211d]/60 p-3 space-y-1">
              <strong class="text-[#f0dba8]">${escHtml(comp.threshold.ru)} (${escHtml(comp.threshold.typeRu)}):</strong>
              <span>${linkifyHTML(formatInlineMd(comp.threshold.desc))}</span>
            </div>` : ''}
        </div>`;
    }

    return `
      <div class="space-y-3 rounded-xl border border-[#d8b979]/25 bg-[#0b110f]/55 p-4 text-xs">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label class="space-y-1">
            <span class="text-[#a69f90]">Смертный облик</span>
            <textarea rows="3" data-sheet-field="mortalGuise" placeholder="Как персонаж выглядит в глазах обычных людей" class="chrysalis-input">${escHtml(sheet.mortalGuise)}</textarea>
          </label>
          <label class="space-y-1">
            <span class="text-[#a69f90]">Облик феи и Вуаль</span>
            <textarea rows="3" data-sheet-field="faeMien" placeholder="Сказочная внешность, наряд из снов и видимые химерические вещи" class="chrysalis-input">${escHtml(sheet.faeMien)}</textarea>
          </label>
          <label class="space-y-1">
            <span class="text-[#a69f90]">Три цели (повседневная, ближняя, заветная)</span>
            <textarea rows="3" data-sheet-field="goals" placeholder="Что ведёт персонажа каждый день и к чему он стремится в хронике" class="chrysalis-input">${escHtml(sheet.goals)}</textarea>
          </label>
          <label class="space-y-1">
            <span class="text-[#a69f90]">Причуды и привычки</span>
            <textarea rows="3" data-sheet-field="quirks" placeholder="Любимые словечки, мелкие жесты, странности" class="chrysalis-input">${escHtml(sheet.quirks)}</textarea>
          </label>
        </div>
        <label class="block space-y-1">
          <span class="text-[#a69f90]">Хризалида, смертная жизнь и связь с Мотли</span>
          <textarea rows="2" data-sheet-field="backstory" placeholder="Где рос персонаж, как пробудился и что держит его рядом с Мотли" class="chrysalis-input">${escHtml(sheet.backstory)}</textarea>
        </label>
        <div class="pt-1 flex justify-end">
          <button type="button" data-open-dossier class="px-4 py-2 rounded-full text-xs font-medium border border-[#f0dba8]/80 bg-[#d8b979]/22 text-[#f0dba8] hover:bg-[#d8b979]/32 transition">◈ Открыть готовый Лист подменыша →</button>
        </div>
      </div>`;
  }

  function renderChrysalisMfResultsHTML(items) {
    if (!items.length) return '<div class="text-[#a69f90] py-2">Ничего не найдено по запросу.</div>';
    return items.slice(0, 24).map((it) => {
      const addBtns =
        it.id === 'winged'
          ? `<button type="button" data-add-mf="${it.id}" data-add-kind="flaw" data-add-cost="2" class="px-2 py-0.5 rounded-full border border-[#e06d44]/45 text-[#ffd6c9] hover:bg-[#e06d44]/15">+ Недостаток (+2)</button>
             <button type="button" data-add-mf="${it.id}" data-add-kind="merit" data-add-cost="4" class="px-2 py-0.5 rounded-full border border-[#78c87a]/45 text-[#bfeec2] hover:bg-[#78c87a]/15">+ Достоинство (−4)</button>`
          : (it.costs || []).map((c) => {
              const isFlaw = it.kind === 'flaw';
              const sign = isFlaw ? `+${c}` : `−${c}`;
              const cls = isFlaw ? 'border-[#e06d44]/45 text-[#ffd6c9] hover:bg-[#e06d44]/15' : 'border-[#78c87a]/45 text-[#bfeec2] hover:bg-[#78c87a]/15';
              return `<button type="button" data-add-mf="${it.id}" data-add-kind="${it.kind}" data-add-cost="${c}" class="px-2 py-0.5 rounded-full border ${cls}">${sign}</button>`;
            }).join('');
      return `
        <div class="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[#d8b979]/15 bg-[#0b110f]/70">
          <div class="min-w-0 flex-1">
            <span class="font-medium text-[#f0eadc]">${escHtml(it.ru)}</span>
            <span class="text-[11px] text-[#a69f90]">(${escHtml(it.en)})</span>
          </div>
          <div class="flex flex-wrap gap-1 shrink-0">${addBtns}</div>
        </div>`;
    }).join('');
  }

  function renderChrysalisStepBody() {
    const body = document.getElementById('chrysalis-step-body');
    if (!body) return;
    const idx = Math.max(0, Math.min(CREATION_STEPS.length - 1, state.chrysalisStepIdx));
    const step = CREATION_STEPS[idx];
    const sheet = state.chrysalisSheet;
    const comp = computeCharacterSheet(sheet);
    const isDone = (sheet.completedSteps || []).includes(step.id);

    body.innerHTML = `
      <div class="nouveau-panel p-5 sm:p-7 space-y-5 spotlight-anim">
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d8b979]/20 pb-3.5">
          <div>
            <div class="text-[11px] uppercase tracking-[0.22em] text-[#d8b979]">Шаг ${step.num} · ${escHtml(step.budget)}</div>
            <h3 class="font-nouveau text-2xl sm:text-3xl font-semibold text-[#f0eadc] !mt-0.5 !mb-0">${escHtml(step.ru)} <span class="text-sm font-sans font-normal text-[#a69f90]">(${escHtml(step.en)})</span></h3>
          </div>
          <button type="button" id="btn-toggle-step-done" class="px-3.5 py-1.5 rounded-full text-xs border transition shrink-0 ${isDone ? 'border-[#78c87a]/65 bg-[#78c87a]/18 text-[#bfeec2]' : 'border-[#d8b979]/35 bg-[#0b110f]/70 text-[#a69f90] hover:text-[#f0eadc]'}">
            ${isDone ? '✓ Шаг завершён' : 'Отметить шаг пройденным'}
          </button>
        </div>

        <div class="relative z-10 flex flex-wrap gap-2">
          ${(step.links || []).map((lk) => `<a href="${escHtml(lk.href)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-[#d8b979]/40 bg-[#15211d]/85 text-[#f0dba8] hover:border-[#f0dba8] transition">${escHtml(lk.label)} ↗</a>`).join('')}
        </div>

        <div class="relative z-10 space-y-2 text-xs sm:text-[13.5px] leading-relaxed text-[#f0eadc]/92">
          ${(step.rules || []).map((r) => `<p class="!my-0">${linkifyHTML(formatInlineMd(r))}</p>`).join('')}
        </div>

        ${comp.warnings.length ? `
          <div class="relative z-10 rounded-xl border border-[#e06d44]/45 bg-[#2a1512]/70 p-3 space-y-1 text-xs text-[#ffd6c9]">
            ${comp.warnings.map((w) => `<div>◈ ${escHtml(w)}</div>`).join('')}
          </div>` : ''}

        <div class="relative z-10">
          ${renderChrysalisStepForm(step, sheet, comp)}
        </div>

        ${step.saffron ? `
          <details class="relative z-10 lore-only callout-sidebar">
            <summary class="cursor-pointer font-nouveau text-lg font-semibold text-[#f0dba8] select-none list-none flex items-center justify-between gap-2">
              <span>✦ ${escHtml(step.saffron.title)}</span>
              <span class="text-xs font-sans text-[#a69f90]">Раскрыть ▾</span>
            </summary>
            <div class="space-y-2 pt-2.5 text-xs sm:text-[13px] leading-relaxed text-[#f0eadc]/90">
              ${(step.saffron.paragraphs || []).map((p) => `<p class="!my-0">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
            </div>
          </details>` : ''}

        <div class="relative z-10 flex items-center justify-between gap-3 pt-2 border-t border-[#d8b979]/20">
          <button type="button" data-cstep-nav="-1" class="px-4 py-2 rounded-full text-xs border border-[#d8b979]/35 bg-[#0b110f]/75 text-[#f0eadc] hover:border-[#f0dba8] transition ${idx === 0 ? 'invisible' : ''}">← Предыдущий шаг</button>
          <button type="button" data-cstep-nav="1" class="px-4 py-2 rounded-full text-xs font-medium border border-[#f0dba8]/70 bg-[#d8b979]/20 text-[#f0dba8] hover:bg-[#d8b979]/30 transition">${idx === CREATION_STEPS.length - 1 ? '◈ К готовому Листу →' : 'Следующий шаг →'}</button>
        </div>
      </div>
    `;

    bindChrysalisStepEvents(body, step);
  }

  function bindChrysalisStepEvents(body, step) {
    const sheet = state.chrysalisSheet;

    const doneBtn = document.getElementById('btn-toggle-step-done');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        const list = sheet.completedSteps || [];
        const pos = list.indexOf(step.id);
        if (pos >= 0) list.splice(pos, 1);
        else list.push(step.id);
        sheet.completedSteps = list;
        saveChrysalisSheet();
        renderChrysalisAll();
      });
    }

    body.querySelectorAll('[data-cstep-nav]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const d = parseInt(btn.getAttribute('data-cstep-nav'), 10);
        if (state.chrysalisStepIdx + d >= CREATION_STEPS.length) {
          state.chrysalisViewMode = 'dossier';
          renderChrysalisAll();
        } else {
          state.chrysalisStepIdx = Math.max(0, Math.min(CREATION_STEPS.length - 1, state.chrysalisStepIdx + d));
          renderChrysalisAll();
        }
      })
    );

    const openDossierBtn = body.querySelector('[data-open-dossier]');
    if (openDossierBtn) {
      openDossierBtn.addEventListener('click', () => {
        state.chrysalisViewMode = 'dossier';
        renderChrysalisAll();
      });
    }

    body.querySelectorAll('[data-sheet-field]').forEach((el) => {
      el.addEventListener('input', () => {
        const f = el.getAttribute('data-sheet-field');
        sheet[f] = el.value;
        saveChrysalisSheet();
        if (f === 'name') {
          const sumName = document.getElementById('chrysalis-summary-name');
          if (sumName) sumName.textContent = el.value || 'Новый подменыш';
        }
      });
    });

    const clampTemperFreebies = () => {
      const gFromS = sheet.seeming === 'childling' ? 1 : sheet.seeming === 'wilder' && sheet.wilderChoice === 'glamour' ? 1 : 0;
      const wFromS = sheet.seeming === 'grump' ? 1 : sheet.seeming === 'wilder' && sheet.wilderChoice === 'willpower' ? 1 : 0;
      const maxW = sheet.houseId === 'balor' ? 6 : 10;
      const baseG = 4 + gFromS;
      const baseW = Math.min(maxW, 4 + wFromS);
      sheet.freebie.glamour = Math.max(0, Math.min(10 - baseG, Number(sheet.freebie.glamour) || 0));
      sheet.freebie.willpower = Math.max(0, Math.min(maxW - baseW, Number(sheet.freebie.willpower) || 0));
    };

    body.querySelectorAll('[data-sheet-select]').forEach((el) => {
      el.addEventListener('change', () => {
        const f = el.getAttribute('data-sheet-select');
        sheet[f] = el.value;
        if (f === 'houseId' || f === 'seeming') clampTemperFreebies();
        saveChrysalisSheet();
        renderChrysalisAll();
      });
    });

    body.querySelectorAll('[data-fb-drawer]').forEach((det) =>
      det.addEventListener('toggle', () => {
        state.chrysalisFbOpen[det.getAttribute('data-fb-drawer')] = det.open;
      })
    );

    body.querySelectorAll('[data-concept-sample]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const text = (CREATION_DATA.conceptExamples || [])[parseInt(btn.getAttribute('data-concept-sample'), 10)] || '';
        sheet.concept = text;
        saveChrysalisSheet();
        const inp = document.getElementById('chrysalis-concept-input');
        if (inp) inp.value = text;
      })
    );

    body.querySelectorAll('[data-prio-kind]').forEach((sel) =>
      sel.addEventListener('change', () => {
        const kind = sel.getAttribute('data-prio-kind');
        const grp = sel.getAttribute('data-prio-group');
        const newVal = parseInt(sel.value, 10);
        const map = kind === 'attr' ? sheet.attrPriority : sheet.abilPriority;
        const oldVal = map[grp];
        const swapKey = Object.keys(map).find((k) => k !== grp && map[k] === newVal);
        map[grp] = newVal;
        if (swapKey) map[swapKey] = oldVal;
        saveChrysalisSheet();
        renderChrysalisAll();
      })
    );

    body.querySelectorAll('[data-dot-kind]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const kind = btn.getAttribute('data-dot-kind');
        const id = btn.getAttribute('data-dot-id');
        const delta = parseInt(btn.getAttribute('data-dot-delta'), 10);
        const minV = kind === 'attrBase' ? 1 : 0;
        const maxV = kind === 'abilBase' ? 3 : 5;
        const cur = Number((sheet[kind] || {})[id]);
        const safeCur = Number.isNaN(cur) ? minV : cur;
        const nxt = Math.max(minV, Math.min(maxV, safeCur + delta));
        sheet[kind][id] = nxt;
        saveChrysalisSheet();
        renderChrysalisAll();
      })
    );

    body.querySelectorAll('[data-custom-abil]').forEach((inp) =>
      inp.addEventListener('input', () => {
        const id = inp.getAttribute('data-custom-abil');
        sheet.customAbilityNames[id] = inp.value;
        saveChrysalisSheet();
      })
    );

    body.querySelectorAll('[data-wilder-choice]').forEach((btn) =>
      btn.addEventListener('click', () => {
        sheet.wilderChoice = btn.getAttribute('data-wilder-choice');
        clampTemperFreebies();
        saveChrysalisSheet();
        renderChrysalisAll();
      })
    );

    body.querySelectorAll('[data-troll-oaths]').forEach((btn) =>
      btn.addEventListener('click', () => {
        sheet.trollOaths = parseInt(btn.getAttribute('data-troll-oaths'), 10) || 0;
        saveChrysalisSheet();
        renderChrysalisAll();
      })
    );

    body.querySelectorAll('[data-fb-temper]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-fb-temper');
        const delta = parseInt(btn.getAttribute('data-dot-delta'), 10);
        const cur = Number(sheet.freebie[key]) || 0;
        sheet.freebie[key] = Math.max(0, cur + delta);
        saveChrysalisSheet();
        renderChrysalisAll();
      })
    );

    body.querySelectorAll('[data-fb-kind]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const kind = btn.getAttribute('data-fb-kind');
        const id = btn.getAttribute('data-dot-id');
        const delta = parseInt(btn.getAttribute('data-dot-delta'), 10);
        const cur = Number((sheet.freebie[kind] || {})[id]) || 0;
        sheet.freebie[kind][id] = Math.max(0, cur + delta);
        saveChrysalisSheet();
        renderChrysalisAll();
      })
    );

    body.querySelectorAll('[data-mf-pick-kind]').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.chrysalisMfKind = btn.getAttribute('data-mf-pick-kind');
        renderChrysalisStepBody();
      })
    );

    const mfSearch = document.getElementById('chrysalis-mf-search');
    if (mfSearch) {
      mfSearch.addEventListener('input', () => {
        state.chrysalisMfQuery = mfSearch.value;
        const listEl = document.getElementById('chrysalis-mf-list');
        if (listEl) {
          const mfFiltered = MF_ITEMS.filter((it) => {
            if (state.chrysalisMfKind !== 'all' && it.kind !== 'both' && it.kind !== state.chrysalisMfKind) return false;
            if (state.chrysalisMfQuery) {
              const q = state.chrysalisMfQuery.toLowerCase();
              return `${it.ru} ${it.en}`.toLowerCase().includes(q);
            }
            return true;
          });
          listEl.innerHTML = renderChrysalisMfResultsHTML(mfFiltered);
          bindChrysalisMfAddButtons(listEl);
        }
      });
    }
    const mfList = document.getElementById('chrysalis-mf-list');
    if (mfList) bindChrysalisMfAddButtons(mfList);

    body.querySelectorAll('[data-rm-mf]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const bucket = btn.getAttribute('data-rm-mf');
        const rIdx = parseInt(btn.getAttribute('data-rm-idx'), 10);
        if (Array.isArray(sheet.freebie[bucket])) {
          sheet.freebie[bucket].splice(rIdx, 1);
          saveChrysalisSheet();
          renderChrysalisAll();
        }
      })
    );

    body.querySelectorAll('[data-mf-note]').forEach((inp) =>
      inp.addEventListener('input', () => {
        const bucket = inp.getAttribute('data-mf-note');
        const idx = parseInt(inp.getAttribute('data-mf-idx'), 10);
        if (sheet.freebie[bucket] && sheet.freebie[bucket][idx]) {
          sheet.freebie[bucket][idx].note = inp.value;
          saveChrysalisSheet();
        }
      })
    );

    body.querySelectorAll('[data-spec-key]').forEach((inp) =>
      inp.addEventListener('input', () => {
        sheet.specialties[inp.getAttribute('data-spec-key')] = inp.value;
        saveChrysalisSheet();
      })
    );

    body.querySelectorAll('[data-spec-suggest]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-spec-suggest');
        const v = btn.getAttribute('data-spec-val');
        sheet.specialties[k] = v;
        saveChrysalisSheet();
        const inp = body.querySelector(`[data-spec-key="${k}"]`);
        if (inp) inp.value = v;
      })
    );
  }

  function bindChrysalisMfAddButtons(container) {
    container.querySelectorAll('[data-add-mf]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-add-mf');
        const kind = btn.getAttribute('data-add-kind');
        const cost = parseInt(btn.getAttribute('data-add-cost'), 10) || 1;
        const item = MF_ITEMS.find((x) => x.id === id);
        if (!item) return;
        const bucket = kind === 'flaw' ? 'flaws' : 'merits';
        state.chrysalisSheet.freebie[bucket].push({ id: item.id, ru: item.ru, cost, note: '' });
        saveChrysalisSheet();
        renderChrysalisAll();
      })
    );
  }

  function renderChrysalisDossierArea() {
    const area = document.getElementById('chrysalis-dossier-area');
    if (!area) return;
    const sheet = state.chrysalisSheet;
    const comp = computeCharacterSheet(sheet);
    const pOpts = normalizeChrysalisPrint(state.chrysalisPrint);
    const dView = state.chrysalisDossierView === 'preview' ? 'preview' : 'summary';
    const scaleChoices = [0.9, 0.95, 1, 1.05, 1.1];
    const pillCls = (active) =>
      active
        ? 'border-[#f0dba8]/80 bg-[#d8b979]/24 text-[#f0dba8] font-medium'
        : 'border-[#d8b979]/25 bg-[#0b110f]/75 text-[#a69f90] hover:text-[#f0eadc]';

    area.innerHTML = `
      <div class="nouveau-panel p-4 sm:p-5 space-y-3.5 no-print">
        <div class="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
          <div class="flex flex-wrap gap-2">
            <button type="button" id="btn-print-dossier" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border border-[#f0dba8]/80 bg-[#d8b979]/22 text-[#f0dba8] hover:bg-[#d8b979]/32 transition">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9V4h12v5M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/></svg>
              <span>Печать / Сохранить PDF (A4)</span>
            </button>
            <button type="button" id="btn-copy-dossier" class="px-4 py-2 rounded-full text-xs font-medium border border-[#d8b979]/40 bg-[#15211d]/85 text-[#f0eadc] hover:border-[#f0dba8] transition">Скопировать лист текстом</button>
          </div>
          <button type="button" id="btn-back-steps" class="px-3.5 py-2 rounded-full text-xs border border-[#d8b979]/30 text-[#a69f90] hover:text-[#f0eadc] transition">← Вернуться к шагам</button>
        </div>

        <div class="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#d8b979]/20 text-xs">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-[#a69f90]">На экране:</span>
            <button type="button" data-dossier-view="summary" class="px-3 py-1 rounded-full border transition ${pillCls(dView === 'summary')}">◈ Сводка на экране</button>
            <button type="button" data-dossier-view="preview" class="px-3 py-1 rounded-full border transition ${pillCls(dView === 'preview')}">Предпросмотр листа A4</button>
          </div>

          <button type="button" data-print-blank="toggle" class="px-3 py-1 rounded-full border transition ${pillCls(pOpts.blank)}">
            ${pOpts.blank ? '✓ Пустой бланк для PDF' : 'Пустой бланк для PDF'}
          </button>
        </div>

        <div class="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 pt-2.5 border-t border-[#d8b979]/15 text-xs">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-[#a69f90]">Формат PDF:</span>
            <button type="button" data-print-pages="2" class="px-2.5 py-1 rounded-full border transition ${pillCls(pOpts.pages === '2')}">2 стр. A4 · Полный</button>
            <button type="button" data-print-pages="1" class="px-2.5 py-1 rounded-full border transition ${pillCls(pOpts.pages === '1')}">1 стр. A4 · Компактный</button>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-[#a69f90]">Палитра PDF:</span>
            <button type="button" data-print-palette="color" class="px-2.5 py-1 rounded-full border transition ${pillCls(pOpts.palette === 'color')}">Цветной Ар-Нуво</button>
            <button type="button" data-print-palette="bw" class="px-2.5 py-1 rounded-full border transition ${pillCls(pOpts.palette === 'bw')}">Ч/Б контраст</button>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <span class="text-[11px] text-[#a69f90] mr-0.5">Масштаб шрифта:</span>
            ${scaleChoices
              .map(
                (sc) =>
                  `<button type="button" data-print-scale="${sc}" class="px-2 py-1 rounded-full border text-[11px] transition ${pillCls(pOpts.scale === sc)}">${Math.round(sc * 100)}%</button>`
              )
              .join('')}
          </div>
        </div>

        ${
          pOpts.blank && dView === 'summary'
            ? `<div class="relative z-10 text-[11px] text-[#f0dba8]">✦ Включён режим «Пустой бланк»: в PDF и в предпросмотр A4 пойдёт чистый лист для заполнения от руки, а сводка ниже сохраняет вашего персонажа.</div>`
            : ''
        }

        <div class="relative z-10 text-[11px] text-[#a69f90] leading-relaxed">
          Для лучшего результата в диалоге печати выберите бумагу <strong class="text-[#f0eadc]">A4</strong> и отключите колонтитулы браузера. Цветной PDF хорошо ложится и на чёрно-белый принтер, а режим <strong class="text-[#f0eadc]">«Ч/Б контраст»</strong> даёт максимальную резкость без полутонов.
        </div>
      </div>

      ${
        comp.warnings.length && !(pOpts.blank && dView === 'preview')
          ? `
        <div class="rounded-xl border border-[#e06d44]/45 bg-[#2a1512]/70 p-3.5 space-y-1 text-xs text-[#ffd6c9] no-print">
          <div class="font-semibold">◈ Напоминания по правилам C20</div>
          ${comp.warnings.map((w) => `<div>• ${escHtml(w)}</div>`).join('')}
        </div>`
          : ''
      }

      ${
        dView === 'preview'
          ? `<div class="c20-preview-stage">${renderC20SheetHTML(sheet, comp, pOpts)}</div>`
          : renderDossierSummaryHTML(sheet, comp)
      }
    `;

    area.querySelectorAll('[data-dossier-view]').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.chrysalisDossierView = btn.getAttribute('data-dossier-view') === 'preview' ? 'preview' : 'summary';
        renderChrysalisDossierArea();
      })
    );

    area.querySelectorAll('[data-print-pages]').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.chrysalisPrint = normalizeChrysalisPrint(
          Object.assign({}, state.chrysalisPrint, { pages: btn.getAttribute('data-print-pages') })
        );
        saveChrysalisPrint();
        renderChrysalisDossierArea();
      })
    );

    area.querySelectorAll('[data-print-palette]').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.chrysalisPrint = normalizeChrysalisPrint(
          Object.assign({}, state.chrysalisPrint, { palette: btn.getAttribute('data-print-palette') })
        );
        saveChrysalisPrint();
        renderChrysalisDossierArea();
      })
    );

    area.querySelectorAll('[data-print-scale]').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.chrysalisPrint = normalizeChrysalisPrint(
          Object.assign({}, state.chrysalisPrint, { scale: parseFloat(btn.getAttribute('data-print-scale')) || 1 })
        );
        saveChrysalisPrint();
        renderChrysalisDossierArea();
      })
    );

    const blankBtn = area.querySelector('[data-print-blank]');
    if (blankBtn) {
      blankBtn.addEventListener('click', () => {
        state.chrysalisPrint = normalizeChrysalisPrint(
          Object.assign({}, state.chrysalisPrint, { blank: !state.chrysalisPrint.blank })
        );
        saveChrysalisPrint();
        renderChrysalisDossierArea();
      });
    }

    const copyBtn = document.getElementById('btn-copy-dossier');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const txt = formatDossierText(sheet, comp);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(() => {
            copyBtn.textContent = '✓ Лист скопирован';
            setTimeout(() => {
              copyBtn.textContent = 'Скопировать лист текстом';
            }, 2000);
          });
        }
      });
    }

    const printBtn = document.getElementById('btn-print-dossier');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        const box = document.getElementById('print-dossier-container');
        if (box) box.innerHTML = renderC20SheetHTML(sheet, comp, state.chrysalisPrint);
        const oldStyle = document.getElementById('c20-dynamic-page-style');
        if (oldStyle) oldStyle.remove();
        const pageStyle = document.createElement('style');
        pageStyle.id = 'c20-dynamic-page-style';
        pageStyle.textContent = '@page { size: A4 portrait; margin: 8mm; }';
        document.head.appendChild(pageStyle);
        document.body.classList.add('print-dossier-only');

        let cleaned = false;
        const cleanup = () => {
          if (cleaned) return;
          cleaned = true;
          document.body.classList.remove('print-dossier-only');
          const st = document.getElementById('c20-dynamic-page-style');
          if (st) st.remove();
        };
        window.addEventListener('afterprint', cleanup, { once: true });
        window.print();
        window.addEventListener('focus', () => setTimeout(cleanup, 150), { once: true });
      });
    }

    const backBtn = document.getElementById('btn-back-steps');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        state.chrysalisViewMode = 'interactive';
        renderChrysalisAll();
      });
    }

    if (dView === 'preview') {
      requestAnimationFrame(fitA4PreviewPages);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (state.chrysalisDossierView === 'preview') fitA4PreviewPages();
        });
      }
    }
  }

  function renderChrysalisScrollArea() {
    const area = document.getElementById('chrysalis-scroll-area');
    if (!area) return;
    area.innerHTML = CREATION_STEPS.map((st) => `
      <article class="nouveau-panel p-5 sm:p-6 space-y-3">
        <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#d8b979]/20 pb-2">
          <h3 class="font-nouveau text-2xl sm:text-3xl font-semibold text-[#f0eadc] !mt-0 !mb-0">Шаг ${st.num}. ${escHtml(st.ru)} <span class="text-sm font-sans font-normal text-[#a69f90]">(${escHtml(st.en)})</span></h3>
          <span class="text-xs text-[#d8b979]">${escHtml(st.budget)}</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${(st.links || []).map((lk) => `<a href="${escHtml(lk.href)}" class="px-2.5 py-1 rounded-full text-xs border border-[#d8b979]/35 bg-[#0b110f]/70 text-[#f0dba8] hover:border-[#f0dba8]">${escHtml(lk.label)} →</a>`).join('')}
        </div>
        <div class="space-y-2 text-xs sm:text-[13.5px] leading-relaxed text-[#f0eadc]/92">
          ${(st.rules || []).map((r) => `<p class="!my-0">${linkifyHTML(formatInlineMd(r))}</p>`).join('')}
        </div>
        ${st.saffron ? `
          <div class="lore-only callout-sidebar space-y-1.5 text-xs leading-relaxed">
            <h4 class="font-nouveau text-lg font-semibold text-[#f0dba8] !mt-0 !mb-1">${escHtml(st.saffron.title)}</h4>
            ${(st.saffron.paragraphs || []).map((p) => `<p class="!my-0">${linkifyHTML(formatInlineMd(p))}</p>`).join('')}
          </div>` : ''}
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

    // 2h. Arts & Cantrips hits
    ARTS.forEach((a) => {
      const artHay = `${a.ru} ${a.en} ${a.groupRu} ${a.summary} ${artSpecialRuleSearchText(a)} ${(a.lore || []).join(' ')} ${a.unleashing || ''} ${a.bunks || ''}`.toLowerCase();
      if (artHay.includes(q)) {
        hits.push({
          badge: `Искусство · ${a.groupRu}`,
          title: `${a.ru} (${a.en})`,
          snippet: (a.summary || '').slice(0, 150) + '…',
          url: `${ROOT}08-grimoire-arts/index.html?art=${a.id}#arts-grimoire`
        });
      }
      (a.cantrips || []).forEach((c) => {
        const meta = artTypeMeta(c);
        const sysStr = (c.system || []).join(' ');
        const specialStr = cantripSpecialText(c);
        const hay = `${c.ru} ${c.en} ${(c.lore || []).join(' ')} ${sysStr} ${specialStr}`.toLowerCase();
        if (hay.includes(q)) {
          const snpSrc = sysStr.toLowerCase().includes(q) || !specialStr ? sysStr : specialStr;
          hits.push({
            badge: `Кантрип · ${a.ru} ${'•'.repeat(c.dots)} · ${meta.short}`,
            title: `${c.ru} (${c.en})`,
            snippet: (snpSrc.replace(/\*\*|\*/g, '') || '').slice(0, 150) + '…',
            url: `${ROOT}08-grimoire-arts/index.html?art=${a.id}&dot=${c.dots}#arts-grimoire`
          });
        }
      });
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
    document.querySelectorAll('[data-toggle-depth]').forEach((btn) => {
      const dotEl = btn.querySelector('.depth-dot');
      const shortEl = btn.querySelector('.depth-label-short');
      const fullEl = btn.querySelector('.depth-label-full');
      if (shortEl) shortEl.textContent = state.tableMode ? 'Стол' : 'Лор';
      if (fullEl) fullEl.textContent = state.tableMode ? 'Режим стола' : 'Лор + Правила';
      if (dotEl) {
        dotEl.style.backgroundColor = state.tableMode ? '#f0dba8' : '#d8b979';
        dotEl.style.boxShadow = state.tableMode ? '0 0 8px #f0dba8' : '';
      }
      btn.style.borderColor = state.tableMode ? '#f0dba8' : 'rgba(216, 185, 121, 0.30)';
      btn.style.backgroundColor = state.tableMode ? 'rgba(216, 185, 121, 0.24)' : '';
      btn.style.boxShadow = state.tableMode ? '0 0 16px rgba(216, 185, 121, 0.28)' : '';
      btn.style.color = state.tableMode ? '#f0dba8' : '';
    });
    if (state.tableMode && state.kithDetailTab === 'essence') {
      state.kithDetailTab = 'powers';
      renderKithSpotlight();
    }
    if (state.tableMode && state.houseDetailTab === 'lore') {
      state.houseDetailTab = 'powers';
      renderHouseSpotlight();
    }
  }

  function closeAllNavDropdowns() {
    document.querySelectorAll('.nav-dropdown.open').forEach((dd) => {
      dd.classList.remove('open');
      const trg = dd.querySelector('[data-nav-trigger]');
      if (trg) trg.setAttribute('aria-expanded', 'false');
    });
  }

  function initNavigation() {
    document.querySelectorAll('[data-nav-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = trigger.closest('.nav-dropdown');
        if (!parent) return;
        const willOpen = !parent.classList.contains('open');
        closeAllNavDropdowns();
        if (willOpen) {
          parent.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-dropdown')) {
        closeAllNavDropdowns();
      }
    });

    const mobileToc = document.getElementById('mobile-chapter-toc');
    if (mobileToc) {
      mobileToc.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          mobileToc.removeAttribute('open');
        });
      });
    }

    const backBtn = document.getElementById('btn-back-to-top');
    if (backBtn) {
      const updateBackBtn = () => {
        backBtn.classList.toggle('visible', window.scrollY > 420);
      };
      window.addEventListener('scroll', updateBackBtn, { passive: true });
      updateBackBtn();
      backBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
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

    const artsPrint = document.getElementById('print-arts-container');
    if (artsPrint && ARTS.length) {
      artsPrint.innerHTML = ARTS.map(
        (a) => `
        <article class="print-art-card p-3 space-y-1.5">
          <div class="flex items-baseline justify-between border-b border-[#ccc] pb-0.5">
            <h4 class="font-nouveau text-lg font-bold">${a.ru} <span class="text-xs font-normal">(${a.en})</span></h4>
            <span class="text-xs font-semibold">${a.groupRu}</span>
          </div>
          ${a.specialRule ? `<p class="text-xs"><strong>${formatInlineMd(a.specialRule.title || 'Особые правила')}:</strong> ${a.specialRule.text ? formatInlineMd(a.specialRule.text) + ' ' : ''}${(a.specialRule.items || []).map((it) => formatInlineMd(it)).join(' ')}</p>` : ''}
          <p class="text-xs"><strong>Высвобождение:</strong> ${formatInlineMd(a.unleashing)}</p>
          <p class="text-xs"><strong>Уловки:</strong> ${formatInlineMd(a.bunks)}</p>
          <div class="text-[11px] leading-snug space-y-1 pt-0.5">
            ${(a.cantrips || [])
              .map((c) => {
                const sys = (c.system || []).map((s) => formatInlineMd(s)).join(' ');
                const tbl =
                  c.successTables && c.successTables.length
                    ? ` ${c.successTables
                        .map(
                          (tb) =>
                            `<em>${formatInlineMd(tb.title || 'Шкала успехов')}:</em> ${(tb.rows || []).map((r) => `${r.successes} — ${formatInlineMd(r.effect)}`).join('; ')}.`
                        )
                        .join(' ')}`
                    : c.successTable && c.successTable.length
                      ? ` <em>Шкала успехов:</em> ${c.successTable.map((r) => `${r.successes} — ${formatInlineMd(r.effect)}`).join('; ')}.`
                      : '';
                const sbs =
                  c.specialBlocks && c.specialBlocks.length
                    ? ` ${c.specialBlocks
                        .map((sb) => {
                          const head = `<strong>${formatInlineMd(sb.title)}:</strong>${sb.text ? ` ${formatInlineMd(sb.text)}` : ''}`;
                          const items =
                            sb.items && sb.items.length
                              ? ` ${sb.items
                                  .map(
                                    (it) =>
                                      `<em>${formatInlineMd(it.title)}</em>${it.badge ? ` (${formatInlineMd(it.badge)})` : ''}: ${formatInlineMd(it.text)}`
                                  )
                                  .join('; ')}.`
                              : '';
                          return `${head}${items}`;
                        })
                        .join(' ')}`
                    : '';
                return `<div><strong>${'●'.repeat(c.dots)} ${c.ru} (${c.en})</strong> <em>[${c.typeRu}${c.typeNote ? ` — ${c.typeNote}` : ''}]</em>: ${sys}${tbl}${sbs}</div>`;
              })
              .join('')}
          </div>
        </article>`
      ).join('');
    }

    const chrysalisPrint = document.getElementById('print-chrysalis-container');
    if (chrysalisPrint && CREATION_STEPS.length) {
      chrysalisPrint.innerHTML = CREATION_STEPS.map(
        (st) => `
        <article class="print-chrysalis-card p-3 space-y-1.5">
          <div class="flex items-baseline justify-between border-b border-[#ccc] pb-0.5">
            <h4 class="font-nouveau text-lg font-bold">Шаг ${st.num}. ${escHtml(st.ru)}</h4>
            <span class="text-xs font-semibold">${escHtml(st.budget)}</span>
          </div>
          <div class="text-xs leading-snug space-y-1">
            ${(st.rules || []).map((r) => `<p class="!my-0">${formatInlineMd(r)}</p>`).join('')}
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
    initArtsGrimoire();
    initChrysalisPath();
    initTempersWidget();
    initCantripWidget();
    initLexiconDirectory();
    initNavigation();
    applyTableModeUI();
    initScrollSpy();
    buildPrintArtifacts();

    // Topbar & drawer mode bindings
    document.querySelectorAll('[data-toggle-depth]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.tableMode = !state.tableMode;
        applyTableModeUI();
      });
    });
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
      b.addEventListener('click', () => {
        closeAllNavDropdowns();
        if (volDrawer) {
          volDrawer.classList.add('open');
          const activeItem = volDrawer.querySelector('[data-active-drawer-item="true"]');
          if (activeItem) {
            requestAnimationFrame(() => activeItem.scrollIntoView({ block: 'nearest' }));
          }
        }
      })
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
        closeAllNavDropdowns();
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

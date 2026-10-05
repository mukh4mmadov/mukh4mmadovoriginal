const sharedTheme = `
<style id="mukh-listening-theme">
  :root, html[data-theme="dark"] {
    color-scheme: dark !important;
    --bg: #0f172a !important;
    --panel: #1e293b !important;
    --panel-2: #172338 !important;
    --border: #334155 !important;
    --text: #f1f5f9 !important;
    --muted: #94a3b8 !important;
    --accent: #0ea5e9 !important;
    --accent-2: #0284c7 !important;
    --input-bg: #0b1220 !important;
    --input-border: #475569 !important;
    --input-correct: #34d399 !important;
    --input-wrong: #fb7185 !important;
    --section: #172338 !important;
    --timer: #1e293b !important;
    --highlight-bg: #facc15 !important;
    --highlight-fg: #111827 !important;
  }
  html[data-theme="light"] {
    color-scheme: light !important;
    --bg: #f8fafc !important;
    --panel: #ffffff !important;
    --panel-2: #f1f5f9 !important;
    --border: #cbd5e1 !important;
    --text: #0f172a !important;
    --muted: #475569 !important;
    --accent: #0369a1 !important;
    --accent-2: #075985 !important;
    --input-bg: #ffffff !important;
    --input-border: #94a3b8 !important;
    --input-correct: #047857 !important;
    --input-wrong: #be123c !important;
    --section: #f1f5f9 !important;
    --timer: #ffffff !important;
    --highlight-bg: #fde047 !important;
    --highlight-fg: #422006 !important;
  }
  html, body { min-height: 100%; background: var(--bg) !important; color: var(--text) !important; }
  body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif !important; line-height: 1.55 !important; }
  body, body * { scrollbar-color: var(--input-border) var(--bg); }
  header, .fixed-header, .audio-bar, .fixed-bottom, .part-banner, .section-banner,
  .bottom-nav, .navbar, .questions-panel, .content-scroll, .main-area, #mainArea,
  #content, #questionsPanel { background-color: var(--bg) !important; color: var(--text) !important; border-color: var(--border) !important; }
  .part-banner { padding: 14px 20px !important; border-bottom: 1px solid var(--border) !important; }
  .content-scroll { background: var(--bg) !important; }
  .fixed-header, body > header, .bottom-nav, .fixed-bottom, .audio-bar {
    box-shadow: 0 8px 24px rgba(2, 8, 23, .16) !important;
  }
  .question-card, .notes-card, .note-card, .qgroup, .question-block, .rblock,
  .pick-two, .listening-map-card, .section-content > .question-card,
  .partgrid .prow, .typegrid .prow, .report-box, .leave-box {
    color: var(--text) !important; background: var(--panel) !important;
    border: 1px solid var(--border) !important; border-radius: 16px !important;
  }
  .question-card, .notes-card, .note-card, .qgroup, .question-block, .report-box, .leave-box { padding: 16px !important; }
  .section-banner, .part-banner { border: 1px solid var(--border) !important; border-radius: 14px !important; }
  h1, h2, h3, h4, p, li, th, td, label, .instruction, .instr, .task-kicker,
  .task-title, .question-prompt, .mc-stem, .sub, .answered-count, .part-banner,
  .section-banner, .section-content { color: var(--text) !important; }
  .muted, .hint, .helper, .sub, .answered-count { color: var(--muted) !important; }
  button, select, input:not([type="radio"]):not([type="checkbox"]):not([type="range"]), textarea,
  .icon-btn, .circle-btn, .header-tool-btn, .nav-arrow, .skip-btn, .speed-btn,
  .section-tab, .section-tab.active, .plabel, .subQuestion, .pillnums button,
  .check-btn, .submit-btn {
    border-color: var(--input-border) !important; border-radius: 10px !important;
  }
  button, select, input:not([type="radio"]):not([type="checkbox"]):not([type="range"]), textarea,
  .icon-btn, .circle-btn, .header-tool-btn, .nav-arrow, .section-tab,
  .subQuestion, .pillnums button, .check-btn {
    color: var(--text) !important; background-color: var(--panel-2) !important;
  }
  input:not([type="radio"]):not([type="checkbox"]):not([type="range"]), select, textarea {
    min-height: 40px !important; background: var(--input-bg) !important;
    border: 1px solid var(--input-border) !important; padding: 8px 10px !important;
  }
  input[type="radio"], input[type="checkbox"] { accent-color: #0ea5e9 !important; }
  button:hover, .section-tab:hover, .subQuestion:hover, .pillnums button:hover {
    border-color: var(--accent) !important; background-color: var(--panel) !important;
  }
  .section-tab.active, .plabel.active, .subQuestion.active, .subQuestion.current,
  .pillnums button.active, .lmap-cell.selected {
    color: #fff !important; background: var(--accent-2) !important; border-color: var(--accent) !important;
  }
  .submit-btn, .check-btn.result-mode, .check-btn:not(:disabled) {
    color: #fff !important; background: var(--accent-2) !important; border-color: var(--accent) !important;
  }
  .submit-btn:hover, .check-btn:hover { background: var(--accent) !important; }
  .correct-ui, .correct, .opt-correct, .correct-answer-display { color: var(--input-correct) !important; }
  .incorrect-ui, .incorrect, .opt-wrong { color: var(--input-wrong) !important; }
  .question-card table, .note-card table, .notes-card table, .lmap-matrix,
  .lmap-matrix td, .lmap-matrix th { border-color: var(--border) !important; }
  .fillbox, .opt-box, .mc-option, .ldm-option, .lmap-cell, .question-nav,
  .nav-status, .navchunk, .partgrid .prow, .typegrid .prow {
    border-color: var(--border) !important;
  }
  .fillbox, .opt-box, .mc-option, .ldm-option, .lmap-cell {
    color: var(--text) !important; background: var(--panel-2) !important;
  }
  .fillbox input, .opt-box input, .question-card input, .question-card select,
  .question-card textarea { color: var(--text) !important; caret-color: var(--accent) !important; }
  :focus-visible { outline: 2px solid var(--accent) !important; outline-offset: 2px !important; }
  a { color: var(--accent) !important; }
  .telegram-pin, .telegram-pin-text, .promo-brand, .promo-group, .watermark,
  .brand { display: none !important; }
  .site-section-heading { margin: 0 0 16px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 14px; background: var(--panel-2); }
  .site-section-heading span { display: block; margin-bottom: 3px; color: var(--accent); font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
  .site-section-heading strong { color: var(--text); font-size: 17px; }
  .modal, .modal-content, .modal-content-dark, .overlay .modal, .modal-overlay .modal-content {
    max-width: calc(100vw - 24px) !important; max-height: calc(100dvh - 24px) !important;
    overflow: auto !important; color: var(--text) !important; background: var(--panel) !important;
    border: 1px solid var(--border) !important; border-radius: 20px !important;
    box-shadow: 0 24px 80px rgba(2, 8, 23, .28) !important;
  }
  .modal h1, .modal h2, .modal h3, .modal h4, .modal p, .modal span,
  .modal b, .modal strong, .modal small, .modal li, .modal label,
  .modal-content h1, .modal-content h2, .modal-content h3, .modal-content h4,
  .modal-content p, .modal-content span, .modal-content b, .modal-content strong,
  .modal-content small, .modal-content li, .modal-content label {
    color: var(--text) !important;
  }
  .overlay, .modal-overlay { background: rgba(15, 23, 42, .68) !important; }
  .results-summary p, .score-hero, .results-details-header, .result-row { color: var(--text) !important; }
  .results-summary p, .score-hero { background: var(--panel-2) !important; border-color: var(--border) !important; }
  .results-table { max-height: 55dvh !important; overflow: auto !important; }
  #resultsModal .user-ans, #resultsModal .correct-ans, #resultsModal .q-num,
  #resultsModal .result-status { color: var(--text) !important; }
  #resultsModal .user-ans, #resultsModal .q-num {
    color: var(--text) !important; background: var(--panel-2) !important; border-color: var(--border) !important;
  }
  #resultsModal .correct-ans { color: var(--input-correct) !important; background: rgba(16, 185, 129, .12) !important; border-color: var(--input-correct) !important; }
  #resultsModal .result-row.correct { background: rgba(16, 185, 129, .08) !important; }
  #resultsModal .result-row.partial { background: rgba(245, 158, 11, .08) !important; }
  #resultsModal .result-row.incorrect { background: rgba(244, 63, 94, .08) !important; }
  #resultsModal .result-row.correct .result-status { color: var(--input-correct) !important; }
  #resultsModal .result-row.partial .result-status { color: #b45309 !important; }
  #resultsModal .result-row.incorrect .result-status { color: var(--input-wrong) !important; }
  .results-details-header, .result-row { display: grid !important; grid-template-columns: 36px minmax(0, 1fr) minmax(0, 1fr) auto !important; gap: 10px !important; }
  .result-row { border-bottom: 1px solid var(--border) !important; }
  .close { cursor: pointer !important; }
  /* Keep embedded source exercises visually aligned with the Reading workspace. */
  body { margin: 0 !important; min-height: 100dvh !important; }
  .fixed-header, body > header, .part-banner, .section-banner {
    padding-top: 12px !important; padding-bottom: 12px !important;
    backdrop-filter: blur(12px) !important;
  }
  .main-area, #mainArea, #content, .questions-panel, #questionsPanel,
  .content-scroll, .contentScroll, .section-content, .part-section {
    scrollbar-gutter: stable; scroll-behavior: smooth;
  }
  .section-content, .part-section { line-height: 1.7 !important; }
  .site-section-heading { box-shadow: 0 8px 24px rgba(2, 8, 23, .12); }
  .question-card, .notes-card, .note-card, .qgroup, .question-block,
  .pick-two, .listening-map-card, .section-content > .question-card {
    box-shadow: 0 8px 24px rgba(2, 8, 23, .10) !important;
  }
  .question-card:focus-within, .notes-card:focus-within, .note-card:focus-within,
  .qgroup:focus-within, .question-block:focus-within {
    border-color: var(--accent) !important;
  }
  button, select, input, textarea { font: inherit; }
  button { min-height: 40px; }
  audio { max-width: 100%; }
  html[data-theme="dark"] .instruction strong, html[data-theme="dark"] .instr strong {
    color: #f8fafc !important; background: #334155 !important; border-radius: 4px; padding: 1px 3px;
  }
  html[data-theme="dark"] .q-badge, html[data-theme="dark"] .lmap-qno {
    color: #0f172a !important; background: #cbd5e1 !important; border-color: #94a3b8 !important;
  }
  @media (max-width: 640px) {
    .progress-area { gap: 6px !important; }
    .time-text { min-width: 68px !important; font-size: 11px !important; }
    #seekSlider { min-width: 48px !important; }
    .question-card, .notes-card, .note-card, .qgroup, .question-block { padding: 13px !important; }
    .fixed-header, body > header { gap: 5px !important; padding-left: 8px !important; padding-right: 8px !important; }
    .fixed-bottom, .bottom-nav { gap: 5px !important; padding-left: 6px !important; padding-right: 6px !important; }
    .section-tabs { max-width: 100%; overflow-x: auto; }
    .section-tabs::after {
      content: "Swipe for more"; position: sticky; right: 0; flex: 0 0 auto;
      align-self: center; padding: 6px 8px; border-radius: 8px;
      color: var(--muted); background: var(--panel); font-size: 10px; font-weight: 700;
    }
    .subQuestion, .pillnums button { min-width: 32px !important; min-height: 34px !important; }
    .nav-status { gap: 5px !important; }
    .part-banner { padding: 12px 14px !important; }
    .navbar { gap: 8px !important; padding: 8px !important; }
    .site-section-heading strong { font-size: 15px; }
    .navbar::after, .fixed-bottom::after {
      content: "Swipe for more →"; position: sticky; right: 0; flex: 0 0 auto;
      align-self: center; padding: 6px 8px; border-radius: 8px;
      color: var(--muted); background: var(--panel); font-size: 10px; font-weight: 700;
    }
    .results-details-header { display: none !important; }
    .result-row { grid-template-columns: 28px minmax(0, 1fr) !important; gap: 6px 10px !important; padding: 10px 0 !important; }
    .result-row > :nth-child(2)::before { content: "Your answer: "; color: var(--muted); font-weight: 700; }
    .result-row > :nth-child(3)::before { content: "Correct answer: "; color: var(--muted); font-weight: 700; }
    .result-row > :nth-child(4) { grid-column: 2; }
  }
</style>`;

function makeSectionScript(test) {
  const title = JSON.stringify(test.title).replace(/</g, "\\u003c");
  const sections = JSON.stringify(test.sectionTitles).replace(/</g, "\\u003c");
  return `<script id="mukh-listening-sections">(() => {
    const testTitle = ${title};
    const names = ${sections};
    document.title = testTitle;
    const addSectionHeadings = (selector, attribute) => {
      document.querySelectorAll(selector).forEach((section) => {
        const number = Number(section.getAttribute(attribute));
        const name = names[number - 1];
        if (!name) return;
        const heading = document.createElement('div');
        heading.className = 'site-section-heading';
        const label = document.createElement('span');
        label.textContent = 'Section ' + number;
        const text = document.createElement('strong');
        text.textContent = name;
        heading.append(label, text);
        section.prepend(heading);
      });
    };
    addSectionHeadings('.section-content[data-section]', 'data-section');
    const partSections = document.querySelectorAll('.part-section[data-part]');
    if (!document.querySelector('.section-content[data-section]')) {
      addSectionHeadings('.part-section[data-part]', 'data-part');
    }
    document.querySelectorAll('.section-tab[data-section]').forEach((button) => {
      const number = Number(button.dataset.section);
      if (names[number - 1]) {
        button.textContent = number + '. ' + names[number - 1];
        button.setAttribute('aria-label', 'Section ' + number + ': ' + names[number - 1]);
      }
    });
    document.querySelectorAll('.plabel[data-goto]').forEach((button) => {
      const number = Number(button.dataset.goto);
      const label = number + '. ' + names[number - 1];
      const firstText = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
      if (firstText) firstText.nodeValue = label + ' ';
      else button.insertBefore(document.createTextNode(label + ' '), button.firstChild);
      button.setAttribute('aria-label', 'Section ' + number + ': ' + names[number - 1]);
      button.setAttribute('title', names[number - 1]);
    });
    const activeTitle = document.getElementById('partTitle');
    if (activeTitle && partSections.length) {
      let current = 1;
      const observer = new MutationObserver(() => {
        const match = activeTitle.textContent.match(/(?:section|part)\\s*(\\d+)/i);
        if (match) current = Number(match[1]);
        const next = names[current - 1];
        if (next && activeTitle.textContent !== next) activeTitle.textContent = next;
      });
      observer.observe(activeTitle, { childList: true, characterData: true, subtree: true });
      activeTitle.textContent = names[0] || activeTitle.textContent;
    }
    const root = document.documentElement;
    let audioVolume = 1;
    let audioMuted = false;
    const sendAudioControl = (control) => window.parent.postMessage({ type: 'listening:audio-control', ...control }, '*');
    window.addEventListener('message', (event) => {
      if (event.source !== window.parent) return;
      if (event.data?.type === 'listening:change-section') {
        const number = Number(event.data.section);
        if (number < 1 || number > names.length) return;
        if (typeof window.switchToSection === 'function') window.switchToSection(number);
        else if (typeof window.showPart === 'function') window.showPart(number, false);
      }
      if (event.data?.type === 'listening:set-theme' && ['light', 'dark'].includes(event.data.theme)) {
        root.setAttribute('data-theme', event.data.theme);
        document.querySelectorAll('#themeRow [data-theme]').forEach((button) => {
          button.classList.toggle('active', button.dataset.theme === event.data.theme);
        });
      }
      if (event.data?.type === 'listening:audio-state') {
        const { rate, volume, muted } = event.data;
        if (Number.isFinite(Number(volume))) audioVolume = Number(volume);
        if (typeof muted === 'boolean') audioMuted = muted;
        document.querySelectorAll('#speedRow [data-speed]').forEach((button) => {
          button.classList.toggle('active', Number(button.dataset.speed) === Number(rate));
        });
        const slider = document.getElementById('volSlider');
        if (slider && Number.isFinite(Number(volume))) slider.value = String(Math.round(Number(volume) * 100));
        const mute = document.getElementById('muteBtn');
        if (mute) {
          mute.setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
          mute.textContent = muted ? '🔇' : '🔊';
        }
      }
    });
    document.addEventListener('click', (event) => {
      const mute = event.target.closest?.('#muteBtn');
      if (mute) {
        event.preventDefault();
        event.stopImmediatePropagation();
        audioMuted = !audioMuted;
        sendAudioControl({ muted: audioMuted });
        const slider = document.getElementById('volSlider');
        if (slider) slider.value = String(Math.round(audioVolume * 100));
        mute.setAttribute('aria-label', audioMuted ? 'Unmute audio' : 'Mute audio');
        mute.textContent = audioMuted ? '🔇' : '🔊';
        return;
      }
      const speed = event.target.closest?.('#speedRow [data-speed]');
      if (speed) sendAudioControl({ rate: Number(speed.dataset.speed) });
    }, true);
    document.getElementById('volSlider')?.addEventListener('input', (event) => {
      sendAudioControl({ volume: Number(event.target.value) / 100 });
    });
    const labelledQuestionControls = () => {
      document.querySelectorAll('input[id^="q"], select[id^="q"], textarea[id^="q"]').forEach((control) => {
        const number = control.id.match(/^q(\d+)$/i)?.[1];
        if (!number || control.hasAttribute('aria-label') || control.labels?.length) return;
        const context = control.closest('li, tr, td, p, .mc-stem, .instr, .instruction, .question-row, .qrow, .qgroup, .note-card, .question-card');
        const copy = context?.cloneNode(true);
        copy?.querySelectorAll('input, select, textarea').forEach((field) => field.remove());
        const prompt = copy?.textContent.replace(/\s+/g, ' ').trim().slice(0, 180);
        control.setAttribute('aria-label', prompt ? 'Question ' + number + ': ' + prompt : 'Question ' + number + ' answer');
      });
      const volume = document.getElementById('volSlider');
      if (volume) volume.setAttribute('aria-label', 'Audio volume');
      document.querySelectorAll('.opt-box').forEach((group) => {
        if (group.hasAttribute('role')) return;
        group.setAttribute('role', 'group');
        const prompt = group.previousElementSibling?.matches('.mc-stem, .instr, .instruction') ? group.previousElementSibling : null;
        if (prompt) {
          if (!prompt.id) prompt.id = 'listening-question-' + Math.random().toString(36).slice(2, 9);
          group.setAttribute('aria-labelledby', prompt.id);
        }
      });
      document.querySelectorAll('#settingsBtn, #muteBtn, #expandBtn, #transcriptBtn, #leaveBtn').forEach((button) => {
        button.setAttribute('role', 'button'); button.setAttribute('tabindex', '0');
        if (button.id === 'settingsBtn') {
          button.setAttribute('aria-label', 'Open settings'); button.setAttribute('aria-controls', 'settingsOverlay');
        }
        if (button.id === 'muteBtn') button.setAttribute('aria-label', 'Mute audio');
        if (button.id === 'expandBtn') button.setAttribute('aria-label', 'Toggle full screen');
        if (button.id === 'transcriptBtn') button.setAttribute('aria-label', 'Open transcript');
        if (button.id === 'leaveBtn') button.setAttribute('aria-label', 'Leave test without saving');
        if (!button.dataset.keyboardReady) {
          button.dataset.keyboardReady = 'true';
          button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); button.click(); }
          });
        }
      });
      document.getElementById('prevArrow')?.setAttribute('aria-label', 'Previous section');
      document.getElementById('nextArrow')?.setAttribute('aria-label', 'Next section');
      document.querySelectorAll('.arrow-btn').forEach((button) => {
        if (button.id === 'prevArrow') button.setAttribute('aria-label', 'Previous section');
        if (button.id === 'nextArrow') button.setAttribute('aria-label', 'Next section');
      });
      document.querySelectorAll('.plabel[data-goto]').forEach((button) => {
        button.setAttribute('role', 'button'); button.setAttribute('tabindex', '0');
        const section = Number(button.dataset.goto);
        button.setAttribute('aria-label', 'Section ' + section + ': ' + (names[section - 1] || ''));
        if (button.classList.contains('active')) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
        if (!button.dataset.keyboardReady) {
          button.dataset.keyboardReady = 'true';
          button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); button.click(); }
          });
        }
      });
      document.querySelectorAll('.section-tab[data-section]').forEach((button) => {
        const section = Number(button.dataset.section);
        if (button.classList.contains('active')) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
        button.setAttribute('aria-label', 'Section ' + section + ': ' + (names[section - 1] || ''));
      });
      document.querySelectorAll('.subQuestion[data-question], .pillnums button, .question-nav button').forEach((button) => {
        const number = Number(button.dataset.question || button.dataset.q || button.textContent.trim());
        if (!Number.isFinite(number) || number < 1 || number > 40) return;
        const field = document.getElementById('q' + number);
        const answerGroup = [...document.querySelectorAll('[name="q' + number + '"]')];
        const checkboxGroup = [...document.querySelectorAll('.opt-box[data-group]')].find((group) => {
          const [first, last] = group.dataset.group.replace(/^q/i, '').split('-').map(Number);
          return number >= first && number <= last;
        });
        const checkboxIndex = checkboxGroup
          ? number - Number(checkboxGroup.dataset.group.replace(/^q/i, '').split('-')[0])
          : -1;
        const checkedCount = checkboxGroup?.querySelectorAll('input[type="checkbox"]:checked').length || 0;
        const matchingSlot = document.querySelector('.ldm-slot[data-question="' + number + '"]');
        const answered = typeof window.isQuestionAnswered === 'function'
          ? window.isQuestionAnswered(number)
          : checkboxGroup
            ? checkedCount > checkboxIndex
          : matchingSlot
            ? Boolean(matchingSlot.dataset.answer)
          : field
            ? (['radio', 'checkbox'].includes(field.type)
              ? answerGroup.some((control) => control.checked)
              : String(field.value || '').trim() !== '')
            : answerGroup.some((control) => control.checked)
              || button.classList.contains('answered')
              || button.classList.contains('correct')
              || button.classList.contains('incorrect')
              || button.classList.contains('partial');
        button.setAttribute('aria-label', 'Question ' + number + (answered ? ', answered' : ', unanswered'));
        if (button.classList.contains('active') || button.classList.contains('current')) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      document.querySelectorAll('.navbar, .fixed-bottom').forEach((nav) => {
        nav.setAttribute('aria-label', 'Question navigation. Swipe horizontally to see more questions.');
      });
    };
    const updateQuestionLabels = () => requestAnimationFrame(labelledQuestionControls);
    document.addEventListener('input', updateQuestionLabels);
    document.addEventListener('change', updateQuestionLabels);
    let previouslyFocused = null;
    let pendingDialogOpener = null;
    let openDialog = null;
    const activeDialog = () => [...document.querySelectorAll('#settingsOverlay.show, #resultsOverlay.show, #resultsModal.show, #settingsModal.show')].at(-1) || null;
    const closeControl = (dialog) => dialog?.querySelector('#closeSettings, #closeResults, .modal-close, .close');
    const syncDialogs = () => {
      labelledQuestionControls();
      const dialog = activeDialog();
      if (dialog && dialog !== openDialog) {
        previouslyFocused = pendingDialogOpener?.isConnected ? pendingDialogOpener : document.activeElement;
        pendingDialogOpener = null;
        openDialog = dialog;
        const panel = dialog.matches('.overlay, .modal-overlay') ? dialog.querySelector('.modal, .modal-content') || dialog : dialog;
        if (panel !== dialog && dialog.getAttribute('role') === 'dialog') {
          dialog.removeAttribute('role'); dialog.removeAttribute('aria-modal'); dialog.removeAttribute('aria-labelledby');
        }
        panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
        const heading = panel.querySelector('h1, h2, h3');
        if (heading) {
          if (!heading.id) heading.id = 'listening-dialog-title';
          panel.setAttribute('aria-labelledby', heading.id);
        }
        const close = closeControl(panel) || closeControl(dialog);
        if (close) {
          close.setAttribute('role', 'button'); close.setAttribute('tabindex', '0'); close.setAttribute('aria-label', 'Close dialog');
          if (!close.dataset.keyboardReady) {
            close.dataset.keyboardReady = 'true';
            close.addEventListener('keydown', (event) => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); close.click(); }
            });
          }
        }
        requestAnimationFrame(() => (close || panel).focus?.({ preventScroll: true }));
      } else if (!dialog && openDialog) {
        openDialog = null;
        const focusTarget = previouslyFocused?.isConnected
          && !previouslyFocused.matches(':disabled')
          && !previouslyFocused.closest('[hidden], [aria-hidden="true"]')
          ? previouslyFocused
          : document.querySelector('#submitBtn:not(:disabled), #checkButton:not(:disabled), .question-nav button:not(:disabled)') || document.body;
        if (focusTarget === document.body && !document.body.hasAttribute('tabindex')) document.body.tabIndex = -1;
        requestAnimationFrame(() => focusTarget.focus?.({ preventScroll: true }));
      }
    };
    document.addEventListener('click', (event) => {
      const opener = event.target.closest?.('#settingsBtn, #submitBtn, #checkButton, #resultsBtn');
      if (opener) pendingDialogOpener = opener;
    }, true);
    document.addEventListener('keydown', (event) => {
      const dialog = activeDialog(); if (!dialog) return;
      if (event.key === 'Escape') { (closeControl(dialog) || dialog).click(); return; }
      if (event.key !== 'Tab') return;
      const panel = dialog.matches('.overlay, .modal-overlay') ? dialog.querySelector('.modal, .modal-content') || dialog : dialog;
      const focusable = [...panel.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter((el) => el.getClientRects().length);
      if (!focusable.length) { event.preventDefault(); panel.focus(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }, true);
    const getUnansweredCount = () => {
      let unanswered = 0;
      for (let number = 1; number <= 40; number++) {
        if (typeof window.isQuestionAnswered === 'function') { if (!window.isQuestionAnswered(number)) unanswered++; continue; }
        const field = document.getElementById('q' + number);
        if (field) { if (!String(field.value || '').trim()) unanswered++; continue; }
        const checkboxGroup = [...document.querySelectorAll('.opt-box[data-group]')].find((group) => {
          const [first, last] = group.dataset.group.replace(/^q/i, '').split('-').map(Number);
          return number >= first && number <= last;
        });
        if (checkboxGroup) {
          const first = Number(checkboxGroup.dataset.group.replace(/^q/i, '').split('-')[0]);
          const checkedCount = checkboxGroup.querySelectorAll('input[type="checkbox"]:checked').length;
          if (checkedCount <= number - first) unanswered++;
          continue;
        }
        const slot = document.querySelector('.ldm-slot[data-question="' + number + '"]');
        if (slot) { if (!slot.dataset.answer) unanswered++; continue; }
        const group = [...document.querySelectorAll('[name="q' + number + '"]')];
        if (group.length && !group.some((control) => control.checked)) unanswered++;
      }
      return unanswered;
    };
    document.addEventListener('click', (event) => {
      const submit = event.target.closest?.('#submitBtn, #checkButton');
      if (!submit || document.getElementById('resultsOverlay')?.classList.contains('show') || document.getElementById('resultsModal')?.classList.contains('show')) return;
      if (document.body.classList.contains('locked') || document.getElementById('questionsPanel')?.classList.contains('answers-locked')) return;
      const unanswered = getUnansweredCount();
      if (unanswered > 0 && !window.confirm('You still have ' + unanswered + ' unanswered question' + (unanswered === 1 ? '' : 's') + '. Submit your answers anyway?')) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    }, true);
    const updateUnansweredCount = () => {
      const results = document.getElementById('resultsModal');
      if (!results || !results.classList.contains('show') && !document.getElementById('resultsOverlay')?.classList.contains('show')) return;
      const unanswered = getUnansweredCount();
      const summary = results.querySelector('.results-summary');
      if (summary && !summary.querySelector('.listening-unanswered')) {
        const item = document.createElement('p'); item.className = 'listening-unanswered';
        item.innerHTML = '<span>Unanswered</span><strong></strong>'; summary.append(item);
      }
      const item = results.querySelector('.listening-unanswered');
      if (item) {
        const value = item.querySelector('strong');
        const count = unanswered + ' / 40';
        if (value && value.textContent !== count) value.textContent = count;
      }
      else if (!results.querySelector('.listening-unanswered')) {
        const item = document.createElement('p'); item.className = 'listening-unanswered';
        item.textContent = 'Unanswered: ' + unanswered + ' / 40';
        (results.querySelector('.score-hero') || results).after(item);
      }
    };
    const observer = new MutationObserver(() => { syncDialogs(); updateUnansweredCount(); });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    syncDialogs();
  })();</script>`;
}

export function prepareListeningHtml(html, test) {
  const normalizedHtml = test.slug === 'community-nature-teamwork'
    ? html.replace(
      "box.dataset.group.split('-').map(Number)",
      "box.dataset.group.replace(/^q/i, '').split('-').map(Number)",
    )
    : html;
  return normalizedHtml.replace(/<\/head>/i, `${sharedTheme}</head>`).replace(/<\/body>/i, `${makeSectionScript(test)}</body>`);
}

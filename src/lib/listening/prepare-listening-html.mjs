const sharedTheme = `
<style id="mukh-listening-theme">
  :root, html[data-theme="dark"], html[data-theme="light"] {
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
  html, body { min-height: 100%; background: #0f172a !important; color: #f1f5f9 !important; }
  body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif !important; line-height: 1.55 !important; }
  body, body * { scrollbar-color: #475569 #0f172a; }
  header, .fixed-header, .audio-bar, .fixed-bottom, .part-banner, .section-banner,
  .bottom-nav, .navbar, .questions-panel, .content-scroll, .main-area, #mainArea,
  #content, #questionsPanel { background-color: #0f172a !important; color: #f1f5f9 !important; border-color: #334155 !important; }
  .part-banner { padding: 14px 20px !important; border-bottom: 1px solid #334155 !important; }
  .content-scroll { background: #0f172a !important; }
  .fixed-header, body > header, .bottom-nav, .fixed-bottom, .audio-bar {
    box-shadow: 0 8px 24px rgba(2, 8, 23, .28) !important;
  }
  .question-card, .notes-card, .note-card, .qgroup, .question-block, .rblock,
  .pick-two, .listening-map-card, .section-content > .question-card,
  .partgrid .prow, .typegrid .prow, .report-box, .leave-box {
    color: #e2e8f0 !important; background: #1e293b !important;
    border: 1px solid #334155 !important; border-radius: 16px !important;
  }
  .question-card, .notes-card, .note-card, .qgroup, .question-block, .report-box, .leave-box { padding: 16px !important; }
  .section-banner, .part-banner { border: 1px solid #334155 !important; border-radius: 14px !important; }
  h1, h2, h3, h4, p, li, th, td, label, .instruction, .instr, .task-kicker,
  .task-title, .question-prompt, .mc-stem, .sub, .answered-count, .part-banner,
  .section-banner, .section-content { color: #e2e8f0 !important; }
  .muted, .hint, .helper, .sub, .answered-count { color: #94a3b8 !important; }
  button, select, input:not([type="radio"]):not([type="checkbox"]):not([type="range"]), textarea,
  .icon-btn, .circle-btn, .header-tool-btn, .nav-arrow, .skip-btn, .speed-btn,
  .section-tab, .section-tab.active, .plabel, .subQuestion, .pillnums button,
  .check-btn, .submit-btn {
    border-color: #475569 !important; border-radius: 10px !important;
  }
  button, select, input:not([type="radio"]):not([type="checkbox"]):not([type="range"]), textarea,
  .icon-btn, .circle-btn, .header-tool-btn, .nav-arrow, .section-tab,
  .subQuestion, .pillnums button, .check-btn {
    color: #e2e8f0 !important; background-color: #172338 !important;
  }
  input:not([type="radio"]):not([type="checkbox"]):not([type="range"]), select, textarea {
    min-height: 40px !important; background: #0b1220 !important;
    border: 1px solid #475569 !important; padding: 8px 10px !important;
  }
  input[type="radio"], input[type="checkbox"] { accent-color: #0ea5e9 !important; }
  button:hover, .section-tab:hover, .subQuestion:hover, .pillnums button:hover {
    border-color: #38bdf8 !important; background-color: #1e3a5f !important;
  }
  .section-tab.active, .plabel.active, .subQuestion.active, .subQuestion.current,
  .pillnums button.active, .lmap-cell.selected {
    color: #fff !important; background: #0369a1 !important; border-color: #38bdf8 !important;
  }
  .submit-btn, .check-btn.result-mode, .check-btn:not(:disabled) {
    color: #fff !important; background: #0284c7 !important; border-color: #38bdf8 !important;
  }
  .submit-btn:hover, .check-btn:hover { background: #0369a1 !important; }
  .correct-ui, .correct, .opt-correct, .correct-answer-display { color: #86efac !important; }
  .incorrect-ui, .incorrect, .opt-wrong { color: #fda4af !important; }
  .question-card table, .note-card table, .notes-card table, .lmap-matrix,
  .lmap-matrix td, .lmap-matrix th { border-color: #334155 !important; }
  .fillbox, .opt-box, .mc-option, .ldm-option, .lmap-cell, .question-nav,
  .nav-status, .navchunk, .partgrid .prow, .typegrid .prow {
    border-color: #334155 !important;
  }
  .fillbox, .opt-box, .mc-option, .ldm-option, .lmap-cell {
    color: #e2e8f0 !important; background: #172338 !important;
  }
  .fillbox input, .opt-box input, .question-card input, .question-card select,
  .question-card textarea { color: #f1f5f9 !important; caret-color: #38bdf8 !important; }
  :focus-visible { outline: 2px solid #38bdf8 !important; outline-offset: 2px !important; }
  a { color: #7dd3fc !important; }
  .telegram-pin, .telegram-pin-text, .promo-brand, .promo-group, .watermark,
  .brand { display: none !important; }
  .site-section-heading { margin: 0 0 16px; padding: 12px 16px; border: 1px solid #334155; border-radius: 14px; background: #172338; }
  .site-section-heading span { display: block; margin-bottom: 3px; color: #7dd3fc; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
  .site-section-heading strong { color: #f8fafc; font-size: 17px; }
  @media (max-width: 640px) {
    .question-card, .notes-card, .note-card, .qgroup, .question-block { padding: 13px !important; }
    .fixed-header, body > header { gap: 5px !important; padding-left: 8px !important; padding-right: 8px !important; }
    .fixed-bottom, .bottom-nav { gap: 5px !important; padding-left: 6px !important; padding-right: 6px !important; }
    .section-tabs { max-width: 100%; overflow-x: auto; }
    .subQuestion, .pillnums button { min-width: 32px !important; min-height: 34px !important; }
    .nav-status { gap: 5px !important; }
    .part-banner { padding: 12px 14px !important; }
    .navbar { gap: 8px !important; padding: 8px !important; }
    .site-section-heading strong { font-size: 15px; }
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
    window.addEventListener('message', (event) => {
      if (event.source !== window.parent || event.data?.type !== 'listening:change-section') return;
      const number = Number(event.data.section);
      if (number < 1 || number > names.length) return;
      if (typeof window.switchToSection === 'function') window.switchToSection(number);
      else if (typeof window.showPart === 'function') window.showPart(number, false);
    });
  })();</script>`;
}

export function prepareListeningHtml(html, test) {
  return html.replace(/<\/head>/i, `${sharedTheme}</head>`).replace(/<\/body>/i, `${makeSectionScript(test)}</body>`);
}

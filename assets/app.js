(() => {
  'use strict';
  const core = window.PortfolioCore;
  const $ = id => document.getElementById(id);
  const format = n => n.toLocaleString('pt-BR', { maximumSignificantDigits: 6 });
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch { return false; } };
  const toast = message => { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 4200); };
  const menuButton = $('menu-toggle');
  if (menuButton) {
    menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); $('site-nav').classList.toggle('open', open); });
    $('site-nav').querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menuButton.setAttribute('aria-expanded', 'false'); $('site-nav').classList.remove('open'); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { menuButton.setAttribute('aria-expanded', 'false'); $('site-nav').classList.remove('open'); } });
  }
  if ($('project-grid')) {
    const grid = $('project-grid');
    const cards = Array.from(grid.querySelectorAll('[data-area]'));
    const storedArea = read('pv-project-area', 'todos');
    let area = ['todos', 'integracao', 'ads', 'quimica'].includes(storedArea) ? storedArea : 'todos';
    const applyFilters = () => {
      const selected = new Set(core.filterProjects(area, $('project-search').value).map(p => p.slug));
      cards.forEach(card => { card.hidden = !selected.has(card.dataset.slug); });
      $('project-count').textContent = `${selected.size} ${selected.size === 1 ? 'projeto exibido' : 'projetos exibidos'}`;
      $('empty-state').hidden = selected.size !== 0;
      document.querySelectorAll('[data-filter]').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.filter === area)));
      write('pv-project-area', area);
    };
    document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => { area = btn.dataset.filter; applyFilters(); }));
    $('project-search').addEventListener('input', applyFilters);
    $('reset-filters').addEventListener('click', () => { area = 'todos'; $('project-search').value = ''; applyFilters(); });
    applyFilters();
  }
  const dialog = $('profile-dialog');
  if (dialog) {
    let lastTrigger, currentKind = 'github', currentKey = 'github';
    function updateLinks() {
      const links = read('pv-links', {});
      document.querySelectorAll('[data-profile-kind]').forEach(container => {
        const kind = container.dataset.profileKind, key = container.dataset.profileKey || kind;
        const anchor = container.querySelector('[data-saved-link]');
        const edit = container.querySelector('[data-edit-profile]');
        const exists = links[key] && core.validProfile(kind, links[key]);
        if (anchor) { anchor.hidden = !exists; if (exists) anchor.href = links[key]; }
        if (edit) edit.textContent = exists ? 'Editar link' : (key.startsWith('repo-') ? 'Adicionar repositório' : 'Adicionar meu perfil');
      });
    }
    document.querySelectorAll('[data-edit-profile]').forEach(button => button.addEventListener('click', () => {
      const container = button.closest('[data-profile-kind]');
      currentKind = container.dataset.profileKind; currentKey = container.dataset.profileKey || currentKind;
      lastTrigger = button;
      $('profile-title').textContent = currentKey.startsWith('repo-') ? 'Repositório do projeto' : `Seu perfil no ${currentKind === 'github' ? 'GitHub' : 'LinkedIn'}`;
      $('profile-url').value = read('pv-links', {})[currentKey] || '';
      $('profile-url').placeholder = currentKind === 'github' ? (currentKey.startsWith('repo-') ? 'https://github.com/usuario/repositorio' : 'https://github.com/usuario') : 'https://www.linkedin.com/in/usuario';
      $('profile-error').textContent = '';
      dialog.showModal(); $('profile-url').focus();
    }));
    $('profile-cancel').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => lastTrigger?.focus());
    $('profile-form').addEventListener('submit', event => {
      event.preventDefault();
      const url = $('profile-url').value.trim();
      if (url && !core.validProfile(currentKind, url)) { $('profile-error').textContent = 'Informe um link HTTPS válido do GitHub ou do perfil /in/ do LinkedIn, conforme o campo.'; return; }
      const links = read('pv-links', {});
      if (url) links[currentKey] = url; else delete links[currentKey];
      if (!write('pv-links', links)) { $('profile-error').textContent = 'O navegador bloqueou o salvamento. Permita o armazenamento local para guardar seus links.'; return; }
      updateLinks(); dialog.close(); toast(url ? 'Link salvo neste navegador.' : 'Link removido.');
    });
    updateLinks();
  }
  if ($('dilution-form')) {
    $('dilution-form').addEventListener('submit', event => {
      event.preventDefault();
      const result = core.dilution($('c1').value, $('c2').value, $('v2').value);
      $('dilution-error').textContent = result.error || '';
      if (result.error) { $('dilution-result').hidden = true; return; }
      $('dilution-result').hidden = false;
      $('aliquot-value').textContent = `${format(result.aliquot)} mL`;
      $('dilution-description').textContent = `Volume calculado da solução inicial para um volume final total de ${format(result.finalVolume)} mL, a ${format(result.c2)} mol/L.`;
      $('formula-step').textContent = `V₁ = (${format(result.c2)} × ${format(result.finalVolume)}) ÷ ${format(result.c1)} = ${format(result.aliquot)} mL`;
    });
  }
  if ($('curve-form')) {
    $('curve-form').addEventListener('submit', event => {
      event.preventDefault();
      const result = core.concentration($('absorbance').value);
      $('curve-error').textContent = result.error || '';
      $('curve-result').hidden = Boolean(result.error);
      $('curve-point').setAttribute('visibility', result.error ? 'hidden' : 'visible');
      if (result.error) return;
      $('concentration-value').textContent = `${format(result.value)} mg/L`;
      $('curve-point').setAttribute('cx', String(58 + result.value * 38));
      $('curve-point').setAttribute('cy', String(234 - result.absorbance * 225));
      $('curve-description').textContent = `C = (${format(result.absorbance)} − 0,01) ÷ 0,08. Estimativa ilustrativa, sem validação experimental.`;
    });
  }
  if ($('inventory-select')) {
    $('inventory-select').addEventListener('change', () => {
      let count = 0;
      document.querySelectorAll('[data-stock]').forEach(row => { row.hidden = $('inventory-select').value === 'baixo' && row.dataset.stock !== 'baixo'; if (!row.hidden) count++; });
      $('inventory-count').textContent = `${count} lotes fictícios exibidos`;
    });
  }
  if ($('sample-filter')) {
    $('sample-filter').addEventListener('change', () => {
      let count = 0;
      document.querySelectorAll('[data-sample-status]').forEach(row => { row.hidden = $('sample-filter').value !== 'todas' && row.dataset.sampleStatus !== $('sample-filter').value; if (!row.hidden) count++; });
      $('sample-count').textContent = `${count} amostras fictícias exibidas`;
    });
  }
  if ($('flash-card')) {
    const questions = [
      ['O que é concentração molar?', 'É a quantidade de matéria do soluto dividida pelo volume da solução. Fórmula: c = n/V, com n em mol e V em litros.'],
      ['O que se conserva em uma diluição ideal?', 'A quantidade de matéria do soluto. Ao adicionar solvente sem perdas ou reação, o volume aumenta e a concentração diminui: C₁V₁ = C₂V₂.'],
      ['Por que indicar unidades nos dados?', 'Uma medida precisa de contexto. Um valor como 10 fica incompleto sem saber se representa mL, mg ou mol/L. Registrar unidades ajuda a comparar e interpretar resultados.']
    ];
    let index = 0;
    const render = () => { $('flash-question').textContent = questions[index][0]; $('flash-answer').textContent = questions[index][1]; $('flash-answer').hidden = true; $('flash-reveal').hidden = false; $('flash-progress').textContent = `Cartão ${index + 1} de ${questions.length}`; };
    $('flash-reveal').addEventListener('click', () => { $('flash-answer').hidden = false; $('flash-reveal').hidden = true; });
    $('flash-next').addEventListener('click', () => { index = (index + 1) % questions.length; render(); });
    render();
  }
  if ($('quality-filter')) {
    const applyQuality = () => {
      const rows = core.qualityRows($('quality-filter').checked);
      document.querySelectorAll('[data-quality-id]').forEach(row => { row.hidden = !rows.some(s => s.id === row.dataset.qualityId); });
      $('quality-count').textContent = `${rows.length} resultados fictícios exibidos`;
    };
    $('quality-filter').addEventListener('change', applyQuality);
    $('export-csv').addEventListener('click', () => {
      const data = ['Amostra;Valor_simulado;Unidade;Faixa_demonstrativa', ...core.qualityRows($('quality-filter').checked).map(s => `${s.id};${String(s.value).replace('.', ',')};pH;6,8 a 7,5`)].join('\r\n');
      const blob = new Blob(['\uFEFF' + data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'qualidata-dados-demonstrativos.csv'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('CSV exportado com os dados demonstrativos exibidos.');
    });
    applyQuality();
  }
})();

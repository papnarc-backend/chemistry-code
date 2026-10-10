(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PortfolioCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const projects = [
    { slug: 'labdilui', title: 'LabDilui', status: 'funcional', area: 'integracao', category: 'Programação + Química', type: 'Calculadora de diluição', description: 'Calculadora educativa de diluição, com validação das entradas e explicação do resultado.', tech: ['JavaScript', 'HTML', 'CSS'], number: '01', color: 'mint' },
    { slug: 'curvalab', title: 'CurvaLab', area: 'integracao', category: 'Programação + Química', type: 'Curva de calibração', description: 'Transformando uma série de padrões fictícios em uma leitura visual de concentração.', tech: ['JavaScript', 'SVG', 'Dados simulados'], number: '02', color: 'peach' },
    { slug: 'reagente360', title: 'Reagente360', area: 'integracao', category: 'Programação + Química', type: 'Inventário de laboratório', description: 'Um painel para explorar lotes, quantidades e organização de um estoque fictício.', tech: ['JavaScript', 'HTML', 'CSS'], number: '03', color: 'sand' },
    { slug: 'amostrahub', title: 'AmostraHub', area: 'ads', category: 'ADS', type: 'Fluxo de amostras', description: 'Uma visão simples do caminho de uma amostra, do recebimento à conclusão.', tech: ['JavaScript', 'HTML', 'CSS'], number: '04', color: 'lilac' },
    { slug: 'quimicards', title: 'QuimiCards', area: 'quimica', category: 'Química', type: 'Aprendizagem interativa', description: 'Conceitos de concentração e diluição em cartões que convidam a estudar e revisar.', tech: ['JavaScript', 'HTML', 'CSS'], number: '05', color: 'blue' },
    { slug: 'qualidata', title: 'QualiData', area: 'integracao', category: 'Programação + Química', type: 'Exploração de resultados', description: 'Resultados simulados ganham contexto com filtros, indicadores e exportação em CSV.', tech: ['JavaScript', 'SVG', 'CSV'], number: '06', color: 'rose' }
  ];
  const samples = [
    { id: 'AM-001', label: 'Amostra A', value: 7.1, state: 'Recebida' },
    { id: 'AM-002', label: 'Amostra B', value: 7.3, state: 'Em análise' },
    { id: 'AM-003', label: 'Amostra C', value: 6.6, state: 'Concluída' },
    { id: 'AM-004', label: 'Amostra D', value: 7.0, state: 'Em análise' },
    { id: 'AM-005', label: 'Amostra E', value: 7.4, state: 'Concluída' },
    { id: 'AM-006', label: 'Amostra F', value: 7.8, state: 'Recebida' }
  ];
  function parseNumber(value) {
    const input = String(value).trim();
    return /^\d+(?:[.,]\d+)?$/.test(input) ? Number(input.replace(',', '.')) : NaN;
  }
  function dilution(initial, target, volume) {
    const c1 = parseNumber(initial), c2 = parseNumber(target), v2 = parseNumber(volume);
    if (![c1, c2, v2].every(Number.isFinite) || [c1, c2, v2].some(x => x <= 0)) return { error: 'Informe três números positivos. Você pode usar vírgula ou ponto decimal.' };
    if (c2 > c1) return { error: 'Para uma diluição, a concentração final deve ser menor ou igual à inicial.' };
    return { aliquot: (c2 / c1) * v2, finalVolume: v2, c1, c2 };
  }
  function concentration(absorbance) {
    const a = parseNumber(absorbance);
    if (!Number.isFinite(a) || a < 0.01 || a > 0.81) return { error: 'Use uma absorbância entre 0,01 e 0,81, dentro da faixa fictícia da curva.' };
    return { value: (a - 0.01) / 0.08, absorbance: a };
  }
  function filterProjects(area, query = '') {
    const normalized = s => s.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const q = normalized(query.trim());
    return projects.filter(p => (area === 'todos' || p.area === area) && normalized([p.title, p.description, p.type, ...p.tech].join(' ')).includes(q));
  }
  function validProfile(kind, raw) {
    try {
      const u = new URL(raw);
      const host = u.hostname.toLowerCase();
      if (u.protocol !== 'https:' || u.username || u.password) return false;
      if (kind === 'linkedin') return ['linkedin.com', 'www.linkedin.com'].includes(host) && /^\/in\/[^/]+\/?$/.test(u.pathname);
      return ['github.com', 'www.github.com'].includes(host) && /^\/[^/]+(?:\/[^/]+)?\/?$/.test(u.pathname);
    } catch { return false; }
  }
  function qualityRows(onlyOutside) { return samples.filter(s => !onlyOutside || s.value < 6.8 || s.value > 7.5); }
  return { projects, samples, parseNumber, dilution, concentration, filterProjects, validProfile, qualityRows };
});

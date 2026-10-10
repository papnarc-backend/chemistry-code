const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const core = require('../assets/core.js');
const fixture = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let assertions = 0;
const eq = (a,b) => {assert.deepEqual(a,b);assertions++;};
const ok = a => {assert.ok(a);assertions++;};
eq(core.dilution('1','0,1','100').aliquot,10);
eq(core.dilution('2.5','0.5','250').aliquot,50);
eq(core.dilution('1','1','100').aliquot,100);
for(const input of [['0','1','100'],['1','2','100'],['abc','0.1','100'],['1','0.1','-1'],['','0.1','100'],['1','0','100']]) ok(core.dilution(...input).error);
ok(Math.abs(core.concentration('0,41').value-5)<1e-10);
eq(core.concentration('0.01').value,0);
ok(Math.abs(core.concentration('0.81').value-10)<1e-10);
for(const input of ['0','0.82','abc','-1'])ok(core.concentration(input).error);
eq(core.filterProjects('todos').length,6);
eq(core.filterProjects('integracao').length,4);
eq(core.filterProjects('ads').length,1);
eq(core.filterProjects('quimica').length,1);
eq(core.filterProjects('todos','diluicao').map(p=>p.slug),['labdilui','quimicards']);
eq(core.filterProjects('todos','INEXISTENTE').length,0);
eq(core.qualityRows(true).map(s=>s.id),['AM-003','AM-006']);
ok(core.validProfile('github','https://github.com/paulo/projeto'));
ok(core.validProfile('linkedin','https://www.linkedin.com/in/paulo'));
for(const u of ['javascript:alert(1)','https://github.com.evil.test/paulo','https://evil.test/paulo','http://github.com/paulo','https://user:pass@github.com/paulo'])ok(!core.validProfile('github',u));
ok(!core.validProfile('linkedin','https://linkedin.com/company/test'));

// Execute the actual application script against parsed page elements.
// This is a DOM event simulation, not a real-browser rendering test.
class Element {
  constructor(raw,parent=null){
    this.tag=raw.tag;this.attrs={...raw.attrs};this.parent=parent;this.textContent=raw.text;this.listeners={};this.value=this.attrs.value||'';this.hidden='hidden' in this.attrs;this.checked='checked' in this.attrs;this.dataset={};
    Object.entries(this.attrs).filter(([k])=>k.startsWith('data-')).forEach(([k,v])=>{this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;});
    this.classes=new Set((this.attrs.class||'').split(' '));
    this.classList={toggle:(c,on)=>{const value=on??!this.classes.has(c);value?this.classes.add(c):this.classes.delete(c);},add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};
    this.children=raw.children.map(c=>new Element(c,this));
    if(this.tag==='select'){const option=this.children.find(c=>c.tag==='option');this.value=option?.attrs.value??option?.textContent??'';}
  }
  matches(selector){
    if(selector.startsWith('[')){const m=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return Boolean(m)&&m[1] in this.attrs&&(m[2]===undefined||this.attrs[m[1]]===m[2]);}
    if(selector.startsWith('#'))return this.attrs.id===selector.slice(1);
    return this.tag===selector;
  }
  querySelectorAll(selector){return this.children.flatMap(c=>[...(c.matches(selector)?[c]:[]),...c.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  closest(selector){return this.matches(selector)?this:this.parent?.closest(selector)||null;}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
  trigger(name){(this.listeners[name]||[]).forEach(fn=>fn({preventDefault(){},target:this}));}
  setAttribute(name,value){this.attrs[name]=String(value);}
  getAttribute(name){return this.attrs[name]??null;}
  focus(){this.focused=true;}
  showModal(){this.open=true;}
  close(){this.open=false;this.trigger('close');}
  click(){this.trigger('click');}
}
const appSource=fs.readFileSync('assets/app.js','utf8');
const stored=new Map();
const exported=[];
function load(path, blocked=false){
  const doc=new Element(fixture[path]);
  doc.getElementById=id=>doc.querySelector('#'+id);
  doc.createElement=tag=>new Element({tag,attrs:{},text:'',children:[]});
  const url=class extends URL{};url.createObjectURL=blob=>{exported.push(blob);return 'blob:demo';};url.revokeObjectURL=()=>{};
  const context={document:doc,window:{PortfolioCore:core},localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return stored.get(k)??null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');stored.set(k,v);}},URL:url,Blob,setTimeout:()=>1,clearTimeout(){}};
  vm.runInNewContext(appSource,context,{filename:'app.js'});
  return {doc,$:id=>doc.getElementById(id)};
}
for(const path of Object.keys(fixture)){
  const {doc,$}=load(path);
  eq($('profile-dialog'),null);eq(doc.querySelector('[data-edit-profile]'),null);
  $('menu-toggle').click();eq($('menu-toggle').getAttribute('aria-expanded'),'true');
  $('site-nav').querySelector('a').click();eq($('menu-toggle').getAttribute('aria-expanded'),'false');
}
{
  const {doc,$}=load('index.html');
  doc.querySelector('[data-filter="integracao"]').click();eq($('project-grid').querySelectorAll('[data-area]').filter(c=>!c.hidden).length,4);
  doc.querySelector('[data-filter="ads"]').click();eq($('project-grid').querySelectorAll('[data-area]').filter(c=>!c.hidden).length,1);
  $('project-search').value='inexistente';$('project-search').trigger('input');eq($('empty-state').hidden,false);
  $('reset-filters').click();eq($('empty-state').hidden,true);eq($('project-grid').querySelectorAll('[data-area]').filter(c=>!c.hidden).length,6);
  $('project-search').value='DILUIÇÃO';$('project-search').trigger('input');eq($('project-grid').querySelectorAll('[data-area]').filter(c=>!c.hidden).map(c=>c.dataset.slug),['labdilui','quimicards']);
  stored.set('pv-links',JSON.stringify({github:'https://github.com/antigo-visitante'}));
  const publicPage=load('index.html').doc;
  const publicLinks=publicPage.querySelectorAll('a').map(a=>a.getAttribute('href'));
  ok(publicLinks.includes('https://github.com/papnarc-backend'));
  ok(publicLinks.includes('https://github.com/papnarc-backend/LabDilui'));
  ok(!publicLinks.includes('https://github.com/antigo-visitante'));

}
{
  const {$}=load('projetos/labdilui/index.html');$('dilution-form').trigger('submit');eq($('aliquot-value').textContent,'10 mL');
  $('c2').value='2';$('dilution-form').trigger('submit');ok($('dilution-error').textContent);eq($('dilution-result').hidden,true);
  $('c2').value='0,5';$('dilution-form').trigger('submit');eq($('aliquot-value').textContent,'50 mL');eq($('dilution-result').hidden,false);
}
{
  const {$}=load('projetos/curvalab/index.html');$('curve-form').trigger('submit');eq($('concentration-value').textContent,'5 mg/L');ok(Math.abs(Number($('curve-point').getAttribute('cx'))-248)<1e-8);
  $('absorbance').value='0.9';$('curve-form').trigger('submit');eq($('curve-point').getAttribute('visibility'),'hidden');ok($('curve-error').textContent);
  $('absorbance').value='0,81';$('curve-form').trigger('submit');eq($('concentration-value').textContent,'10 mg/L');eq($('curve-point').getAttribute('visibility'),'visible');
}
{
  const {doc,$}=load('projetos/reagente360/index.html');$('inventory-select').value='baixo';$('inventory-select').trigger('change');eq(doc.querySelectorAll('[data-stock]').filter(r=>!r.hidden).length,2);
  $('inventory-select').value='todos';$('inventory-select').trigger('change');eq(doc.querySelectorAll('[data-stock]').filter(r=>!r.hidden).length,4);
}
{
  const {doc,$}=load('projetos/amostrahub/index.html');
  for(const status of ['Recebida','Em análise','Concluída']){$('sample-filter').value=status;$('sample-filter').trigger('change');eq(doc.querySelectorAll('[data-sample-status]').filter(r=>!r.hidden).length,2);}
}
{
  const {$}=load('projetos/quimicards/index.html');eq($('flash-answer').hidden,true);$('flash-reveal').click();eq($('flash-answer').hidden,false);ok($('flash-answer').textContent.includes('c = n/V'));
  $('flash-next').click();eq($('flash-answer').hidden,true);eq($('flash-progress').textContent,'Cartão 2 de 3');
  $('flash-next').click();$('flash-next').click();eq($('flash-progress').textContent,'Cartão 1 de 3');
}
{
  const {doc,$}=load('projetos/qualidata/index.html');$('quality-filter').checked=true;$('quality-filter').trigger('change');eq(doc.querySelectorAll('[data-quality-id]').filter(r=>!r.hidden).length,2);$('export-csv').click();eq(exported.length,1);
}
{
  const {doc,$}=load('index.html',true);doc.querySelector('[data-filter="ads"]').click();eq($('project-grid').querySelectorAll('[data-area]').filter(c=>!c.hidden).length,1);ok(doc.querySelectorAll('a').some(a=>a.getAttribute('href')==='https://github.com/papnarc-backend'));
}
Promise.all(exported.map(b=>b.text())).then(([csv])=>{ok(csv.includes('AM-003'));ok(csv.includes('AM-006'));ok(!csv.includes('AM-001'));eq(csv.trim().split('\r\n').length,3);console.log(`${assertions} assertions passed: calculations, navigation controls, filters, public links, flashcards and filtered CSV.`);});

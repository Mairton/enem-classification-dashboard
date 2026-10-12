<script>
"use strict";
const D = __DADOS__;

/* ---------- formato pt-BR ---------- */
const f1 = (x,d=1) => Number(x).toFixed(d).replace('.',',');
const fi = (x) => Number(x).toLocaleString('pt-BR');
const cond = D.escada.condicoes;
const byId = {}; cond.forEach(c => byId[c.id] = c);
const AREAS = ['LC','CH','CN','MT'];
const AREA_NOME = {LC:'Linguagens', CH:'C. Humanas', CN:'C. da Natureza', MT:'Matemática'};
const METODOS = ['lexical','bgeA','bgeB','bgeC','qwen8','qwen14','gpt'];
const CURTO = {lexical:'Lexical', bgeA:'Forma A', bgeB:'Forma B', bgeC:'Forma C',
               qwen8:'qwen3:8b', qwen14:'qwen3:14b', gpt:'gpt-5.5', acaso:'Acaso'};
/* rótulo de duas linhas, para não estourar a margem do gráfico */
const LINHA1 = {lexical:'TF-IDF', bgeA:'Forma A', bgeB:'Forma B', bgeC:'Forma C',
                qwen8:'qwen3:8b', qwen14:'qwen3:14b', gpt:'gpt-5.5'};
const LINHA2 = {lexical:'lexical · sem IA', bgeA:'vetorial · local', bgeB:'vetorial · local',
                bgeC:'vetorial · local', qwen8:'generativa · local',
                qwen14:'generativa · local', gpt:'generativa · PAGA'};

/* ---------- fatos no texto ---------- */
const m = D.matriz, s = D.soberania, ar = D.armadilha;
const FATOS = {
  heroPct: Math.round(s.razao_top1),
  razao1: f1(s.razao_top1), razao5: f1(s.razao_top5),
  abremao1: f1(s.abre_mao_top1), abremao5: f1(s.abre_mao_top5),
  local1: f1(s.local_top1), api1: f1(s.api_top1),
  local5: f1(s.local_top5), api5: f1(s.api_top5),
  ganho: f1(s.ganho_8b_14b),
  ppt1: f1(s.api_top1 - s.local_top1), ppt5: f1(s.api_top5 - s.local_top5),
  nEixos: m.eixos.length, nAreas: m.areas.length,
  nComp: m.resumo.total_competencias, nHab: m.resumo.total_habilidades,
  nObj: m.areas.reduce((a,b)=>a+b.objetos,0),
  eixosLista: m.eixos.map(e=>e.nome.toLowerCase()).join(', '),
  areasLista: AREAS.map(a=>a).join(', '),
  compPorArea: AREAS.map(a=>a+' '+m.areas.find(x=>x.id===a).competencias).join(' · '),
  objPorArea: AREAS.map(a=>a+' '+m.areas.find(x=>x.id===a).objetos).join(' · '),
  cand: D.escada.candidatos_por_area, nRef: D.escada.n_referencia,
  acaso1: f1(byId.acaso.top1), acaso5: f1(byId.acaso.top5),
  itensTotal: fi(D.microdados.total),
  C1: f1(byId.bgeC.top1), C5: f1(byId.bgeC.top5),
  circ1: f1(ar.circular.top1), hon1: f1(ar.honesto.top1), nCirc: fi(ar.circular.n),
  margMed: f1(ar.margem.mediana_geral,4), margN: fi(ar.margem.n),
  margPct: f1(ar.margem.pct_acertos_abaixo_0005,0),
  tokApiIn: fi(s.tokens_api.entrada), tokApiOut: fi(s.tokens_api.saida),
  tokLocIn: fi(s.tokens_local.entrada), tokLocOut: fi(s.tokens_local.saida),
  nLoc: s.tokens_local_n
};
document.querySelectorAll('[data-f]').forEach(el => {
  const v = FATOS[el.getAttribute('data-f')];
  if (v !== undefined) el.textContent = v;
});

/* ---------- utilitários de svg ---------- */
const NS = 'http://www.w3.org/2000/svg';
function el(t, a = {}) {
  const n = document.createElementNS(NS, t);
  for (const k in a) if (a[k] !== null && a[k] !== undefined) n.setAttribute(k, a[k]);
  return n;
}
function txt(s, a = {}) { const n = el('text', a); n.textContent = s; return n; }
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
function cssvar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}
function lum(hex) {
  const h = hex.replace('#','');
  const v = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
  const c = [0,2,4].map(i => parseInt(v.slice(i,i+2),16)/255)
    .map(x => x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4));
  return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
}
function inkOn(hex) { return lum(hex) > 0.42 ? '#0b0b0b' : '#ffffff'; }

/* ---------- tooltip ---------- */
const tip = document.createElement('div');
tip.className = 'tip'; tip.setAttribute('role','status'); document.body.appendChild(tip);
function tipShow(html, x, y) {
  tip.innerHTML = html; tip.classList.add('on');
  const r = tip.getBoundingClientRect();
  let L = x + 14, T = y - r.height - 12;
  if (L + r.width > innerWidth - 10) L = x - r.width - 14;
  if (T < 8) T = y + 16;
  tip.style.left = Math.max(8, L) + 'px'; tip.style.top = T + 'px';
}
function tipHide() { tip.classList.remove('on'); }
function bindTip(node, html) {
  const show = ev => {
    const b = node.getBoundingClientRect();
    const x = ev.clientX !== undefined && ev.clientX !== 0 ? ev.clientX : b.left + b.width/2;
    const y = ev.clientY !== undefined && ev.clientY !== 0 ? ev.clientY : b.top;
    tipShow(html, x, y);
  };
  node.addEventListener('mouseenter', show);
  node.addEventListener('mousemove', show);
  node.addEventListener('mouseleave', tipHide);
  node.addEventListener('focus', show);
  node.addEventListener('blur', tipHide);
  node.setAttribute('tabindex','0');
}
function tipHTML(title, rows) {
  return '<div class="t">' + title + '</div>' +
    rows.map(r => '<div class="r"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>').join('');
}

/* ---------- tabelas ---------- */
function tabela(host, head, rows, hiIdx) {
  const t = ['<table class="tbl"><thead><tr>'];
  head.forEach((h,i) => t.push('<th' + (i===0 ? ' style="text-align:left"' : '') + '>' + h + '</th>'));
  t.push('</tr></thead><tbody>');
  rows.forEach((r,i) => {
    t.push('<tr' + (hiIdx && hiIdx.indexOf(i) >= 0 ? ' class="hi"' : '') + '>');
    r.forEach(c => t.push('<td>' + c + '</td>'));
    t.push('</tr>');
  });
  t.push('</tbody></table>');
  document.getElementById(host).innerHTML = t.join('');
}

/* =========================================================
   1 · ESCADA (dumbbell)
   ========================================================= */
function gEscada() {
  const svg = document.getElementById('g-escada'); clear(svg);
  const W = Math.max(520, svg.parentNode.clientWidth);
  const rows = cond.filter(c => c.id !== 'acaso').slice().sort((a,b) => a.top1 - b.top1);
  const padL = W < 680 ? 118 : 148, padR = 56, padT = 16, rowH = 46, padB = 40;
  const H = padT + rows.length * rowH + padB;
  const x0 = padL, x1 = W - padR, XMAX = 85;
  const X = v => x0 + (v / XMAX) * (x1 - x0);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.style.minWidth = W + 'px';   /* rola em vez de encolher o texto */

  const PROT = ['qwen14','gpt'];
  // grade
  [0,20,40,60,80].forEach(v => {
    svg.appendChild(el('line', {x1:X(v), y1:padT, x2:X(v), y2:padT + rows.length*rowH, class:'gridline'}));
    svg.appendChild(txt(v + '%', {x:X(v), y:padT + rows.length*rowH + 20, 'text-anchor':'middle', class:'tick'}));
  });
  // piso do acaso
  const xa = X(byId.acaso.top1);
  svg.appendChild(el('line', {x1:xa, y1:padT - 4, x2:xa, y2:padT + rows.length*rowH + 4, class:'refline'}));
  svg.appendChild(txt('ACASO ' + f1(byId.acaso.top1) + '%', {
    x:xa, y:padT + rows.length*rowH + 34, 'text-anchor':'middle', class:'tick'}));

  rows.forEach((c,i) => {
    const y = padT + i*rowH + rowH/2;
    const prot = PROT.indexOf(c.id) >= 0;
    if (prot) svg.appendChild(el('rect', {x:8, y:y - rowH/2 + 3, width:W - 16, height:rowH - 6,
      rx:7, fill:'var(--accent-wash)'}));
    svg.appendChild(txt(LINHA1[c.id], {
      x:padL - 14, y:y - 1, 'text-anchor':'end', class:'rowlab' + (prot ? ' on' : '')}));
    svg.appendChild(txt(LINHA2[c.id], {
      x:padL - 14, y:y + 13, 'text-anchor':'end', class:'tick',
      style:'font-size:10.5px', fill: c.id==='gpt' ? 'var(--s2)' : null}));
    // haste
    svg.appendChild(el('line', {x1:X(c.top1), y1:y, x2:X(c.top5), y2:y,
      stroke:'var(--axis)', 'stroke-width':2, 'stroke-linecap':'round'}));
    // pontos: top5 (claro) atrás, top1 (escuro) na frente
    [['top5','var(--dot5)'],['top1','var(--dot1)']].forEach(([k,col]) => {
      svg.appendChild(el('circle', {cx:X(c[k]), cy:y, r:7, fill:'var(--surface)'}));
      svg.appendChild(el('circle', {cx:X(c[k]), cy:y, r:5.5, fill:col}));
    });
    // rótulos diretos: só protagonistas
    if (prot) {
      svg.appendChild(txt(f1(c.top1) + '%', {x:X(c.top1), y:y - 13, 'text-anchor':'middle', class:'vallab'}));
      svg.appendChild(txt(f1(c.top5) + '%', {x:X(c.top5), y:y - 13, 'text-anchor':'middle', class:'vallab q'}));
    }
    const hit = el('rect', {x:padL - 4, y:y - rowH/2 + 2, width:x1 - padL + 40, height:rowH - 4, class:'hit'});
    bindTip(hit, tipHTML(c.rotulo, [
      ['1ª posição', f1(c.top1) + '%  (' + c.acertos1 + ' de ' + c.n + ')'],
      ['5 primeiras', f1(c.top5) + '%  (' + c.acertos5 + ' de ' + c.n + ')'],
      ['Custo', c.custo],
      [c.treina ? 'Constrói centroides' : 'Sem construção prévia', c.treina ? 'sim' : 'não']
    ]));
    svg.appendChild(hit);
  });

  tabela('t-escada',
    ['Configuração','n','1ª posição','Acertos','5 primeiras','Acertos','Custo'],
    cond.slice().sort((a,b)=>b.top1-a.top1).map(c => [
      c.rotulo, c.n ?? 'n/d', f1(c.top1) + '%', c.acertos1 ?? 'n/d',
      f1(c.top5) + '%', c.acertos5 ?? 'n/d', c.custo
    ]),
    [0,1]);
}

/* =========================================================
   3 · SOBERANIA (meters)
   ========================================================= */
function gSoberania() {
  const svg = document.getElementById('g-soberania'); clear(svg);
  const W = Math.max(460, svg.parentNode.clientWidth);
  const padL = 112, padR = 120, padT = 24, rowH = 76;
  const H = padT + 2*rowH + 12;
  const x0 = padL, x1 = W - padR;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('width',W); svg.setAttribute('height',H);
  svg.style.minWidth = W + 'px';

  const linhas = [
    {lab:'1ª posição', loc:s.local_top1, api:s.api_top1, raz:s.razao_top1},
    {lab:'5 primeiras', loc:s.local_top5, api:s.api_top5, raz:s.razao_top5}
  ];
  linhas.forEach((L,i) => {
    const y = padT + i*rowH;
    svg.appendChild(txt(L.lab,{x:x0-14,y:y+20,'text-anchor':'end',class:'rowlab on'}));
    // trilha = proprietário (100%)
    svg.appendChild(el('rect',{x:x0,y:y,width:x1-x0,height:26,rx:4,fill:'var(--dot5)',opacity:.42}));
    // preenchimento = local
    const wf = (x1-x0) * L.raz/100;
    svg.appendChild(el('rect',{x:x0,y:y,width:wf,height:26,rx:4,fill:'var(--dot1)'}));
    svg.appendChild(el('rect',{x:x0+wf-2,y:y,width:2,height:26,fill:'var(--surface)'}));
    // rótulos
    svg.appendChild(txt(f1(L.raz)+'% do proprietário',{x:x0+10,y:y+42,class:'vallab'}));
    svg.appendChild(txt('local ' + f1(L.loc)+'%',{x:x0+wf-10,y:y+18,'text-anchor':'end',
      class:'vallab', fill: inkOn(cssvar('--dot1'))}));
    svg.appendChild(txt('API ' + f1(L.api)+'%',{x:x1+10,y:y+18,class:'vallab q'}));
    const hit = el('rect',{x:x0,y:y-6,width:x1-x0,height:38,class:'hit'});
    bindTip(hit, tipHTML(L.lab, [
      ['Proprietário · gpt-5.5', f1(L.api)+'%'],
      ['Local · qwen3:14b', f1(L.loc)+'%'],
      ['Razão local / proprietário', f1(L.raz)+'%'],
      ['Abre mão de', f1(100-L.raz)+'%']
    ]));
    svg.appendChild(hit);
  });
  tabela('t-soberania',
    ['Medida','Proprietário · gpt-5.5','Local · qwen3:14b','Razão','Abre mão de'],
    linhas.map(L => [L.lab, f1(L.api)+'%', f1(L.loc)+'%', f1(L.raz)+'%', f1(100-L.raz)+'%']));
}

/* =========================================================
   5 · TODAS AS CONFIGURAÇÕES, EDIÇÃO A EDIÇÃO
   ========================================================= */
const SERIES_TEMPO = [
  {k:'lexical', nome:'Lexical',    cor:'var(--s1)'},
  {k:'bgeA',    nome:'Forma A',    cor:'var(--s2)'},
  {k:'bgeB',    nome:'Forma B',    cor:'var(--s3)'},
  {k:'qwen8',   nome:'qwen3:8b',   cor:'var(--s4)'},
  {k:'qwen14',  nome:'qwen3:14b',  cor:'var(--s5)'}
];
function gTempo(hostId, chave, titulo, YMAX, anotar) {
  const svg = document.getElementById(hostId); clear(svg);
  const U = D.serie_unificada;
  const W = Math.max(330, svg.parentNode.clientWidth);
  const padL = 40, padR = 76, padT = 34, padB = 40, PH = 196;
  const H = padT + PH + padB;
  const anos = U.anos;
  const x0 = padL, x1 = W - padR;
  const X = a => x0 + (anos.indexOf(a)/(anos.length-1))*(x1-x0);
  const Y = v => padT + PH - (v/YMAX)*PH;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('width',W); svg.setAttribute('height',H);
  svg.style.minWidth = W + 'px';
  svg.appendChild(txt(titulo,{x:x0-28, y:16, class:'rowlab on'}));

  const ticks = YMAX <= 45 ? [0,10,20,30,40] : [0,20,40,60,80];
  ticks.forEach(v => { if (v > YMAX) return;
    svg.appendChild(el('line',{x1:x0,y1:Y(v),x2:x1,y2:Y(v),class:'gridline'}));
    svg.appendChild(txt(v+'%',{x:x0-8,y:Y(v)+4,'text-anchor':'end',class:'tick'})); });
  anos.forEach(a => svg.appendChild(txt(a,{x:X(a),y:padT+PH+20,'text-anchor':'middle',class:'tick'})));
  svg.appendChild(el('line',{x1:x0,y1:padT+PH,x2:x1,y2:padT+PH,class:'axisline'}));

  const fins = [];
  SERIES_TEMPO.forEach(se => {
    const pts = U.linhas.filter(l => l[se.k]).map(l => [X(l.ano), Y(l[se.k][chave])]);
    if (!pts.length) return;
    svg.appendChild(el('path',{d:'M'+pts.map(p=>p[0]+' '+p[1]).join('L'), fill:'none',
      stroke:se.cor, 'stroke-width':2, 'stroke-linejoin':'round','stroke-linecap':'round'}));
    pts.forEach(p => { svg.appendChild(el('circle',{cx:p[0],cy:p[1],r:6,fill:'var(--surface)'}));
                       svg.appendChild(el('circle',{cx:p[0],cy:p[1],r:4,fill:se.cor})); });
    const last = pts[pts.length-1];
    fins.push({nome:se.nome, x:last[0], yLinha:last[1], y:last[1]});
  });

  /* gpt-5.5: ponto único em 2023, com rótulo direto */
  const lg = U.linhas.find(l => l.gpt);
  if (lg) {
    const xg = X(lg.ano), yg = Y(lg.gpt[chave]);
    svg.appendChild(el('circle',{cx:xg,cy:yg,r:8,fill:'var(--surface)'}));
    svg.appendChild(el('circle',{cx:xg,cy:yg,r:5.5,fill:'var(--critical)'}));
    svg.appendChild(txt('gpt-5.5 · só 2023',{x:xg+12, y:yg+4, class:'vallab',
      style:'font-size:11px;fill:var(--critical)'}));
  }

  /* anotação da inversão de 2021, que a escala comprime */
  if (anotar) {
    const xa = X(2021), ya = Y(U.linhas.find(l=>l.ano===2021).lexical[chave]);
    svg.appendChild(el('path',{d:'M'+xa+' '+(ya-9)+'V'+(padT-6), fill:'none',
      stroke:'var(--axis)', 'stroke-width':1}));
    svg.appendChild(txt(anotar,{x:xa-4, y:padT-11, class:'dg-xs', 'text-anchor':'start'}));
  }

  fins.sort((a,b)=>a.y-b.y);
  for (let i=1;i<fins.length;i++) if (fins[i].y - fins[i-1].y < 14) fins[i].y = fins[i-1].y + 14;
  const excesso = fins.length ? fins[fins.length-1].y - (padT + PH) : 0;
  if (excesso > 0) fins.forEach(fz => fz.y -= excesso);
  fins.forEach(fz => {
    if (Math.abs(fz.y - fz.yLinha) > 1.5)
      svg.appendChild(el('path',{d:'M'+(fz.x+6)+' '+fz.yLinha+'L'+(fz.x+11)+' '+fz.y,
        fill:'none', stroke:'var(--axis)', 'stroke-width':1}));
    svg.appendChild(txt(fz.nome,{x:fz.x+13, y:fz.y+4, class:'rowlab', style:'font-size:11px'}));
  });

  anos.forEach(a => {
    const l = U.linhas.find(x => x.ano === a);
    const linhas = SERIES_TEMPO.filter(se => l[se.k])
      .map(se => [se.nome, f1(l[se.k][chave])+'%  (n '+l[se.k].n+')']);
    if (l.gpt) linhas.push(['gpt-5.5', f1(l.gpt[chave])+'%  (n '+l.gpt.n+')']);
    const hit = el('rect',{x:X(a)-18, y:padT-8, width:36, height:PH+16, class:'hit'});
    bindTip(hit, tipHTML('ENEM ' + a, linhas));
    svg.appendChild(hit);
  });
}
function tabelaTempo() {
  const U = D.serie_unificada;
  const cab = ['Edição'];
  SERIES_TEMPO.forEach(se => cab.push(se.nome+' · 1ª', se.nome+' · 5'));
  cab.push('gpt-5.5 · 1ª', 'gpt-5.5 · 5');
  const linhas = U.linhas.map(l => {
    const r = [l.ano];
    SERIES_TEMPO.forEach(se => {
      r.push(l[se.k] ? f1(l[se.k].top1)+'%' : 'não rodou');
      r.push(l[se.k] ? f1(l[se.k].top5)+'%' : 'não rodou');
    });
    r.push(l.gpt ? f1(l.gpt.top1)+'%' : 'não rodou', l.gpt ? f1(l.gpt.top5)+'%' : 'não rodou');
    return r;
  });
  tabela('t-tempo', cab, linhas, [3]);
}

/* =========================================================
   6 · ÁRVORE MENTAL DA MATRIZ
   ========================================================= */
function gArvore() {
  const svg = document.getElementById('g-arvore'); clear(svg);
  const W = Math.max(840, svg.parentNode.clientWidth);
  const H = 402;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('width',W); svg.setAttribute('height',H);
  svg.style.minWidth = W + 'px';

  /* colunas proporcionais, para a árvore respirar quando há largura */
  const esc = W / 840;
  const CX = [10, 196, 432, 606].map(x => Math.round(x*esc));
  const CW = [160, 198, 148, 214].map(w => Math.round(w*esc));

  const NOME = {LC:'Linguagens e Códigos', CH:'Ciências Humanas',
                CN:'Ciências da Natureza', MT:'Matemática'};
  const areas = AREAS.map(a => m.areas.find(x => x.id === a));
  const linhas = [92, 146, 200, 254];        // centro vertical de cada área
  const yEixos = 40, yObj = 348, yRaiz = (linhas[0]+linhas[3])/2;

  /* ---- conectores primeiro, para ficarem atrás das caixas ---- */
  function liga(x1,y1,x2,y2,cor,larg,op) {
    const mx = (x1+x2)/2;
    svg.appendChild(el('path',{
      d:'M'+x1+' '+y1+'C'+mx+' '+y1+' '+mx+' '+y2+' '+x2+' '+y2,
      fill:'none', stroke:cor||'var(--axis)', 'stroke-width':larg||1.5,
      opacity: op===undefined ? 1 : op}));
  }
  const rxRaiz = CX[0]+CW[0];
  liga(rxRaiz, yRaiz, CX[1], yEixos, 'var(--axis)', 1.5, .5);
  linhas.forEach(y => liga(rxRaiz, yRaiz, CX[1], y));
  linhas.forEach((y) => {
    liga(CX[1]+CW[1], y, CX[2], y);
    liga(CX[2]+CW[2], y, CX[3], y, 'var(--s1)', 2);
    liga(CX[1]+CW[1], y, CX[2], yObj, 'var(--axis)', 1.5, .42);
  });

  /* ---- caixas ---- */
  function caixa(x, cy, w, h, opc) {
    const o = opc || {};
    svg.appendChild(el('rect',{x:x, y:cy - h/2, width:w, height:h, rx:9,
      fill: o.alvo ? 'var(--accent-wash)' : 'var(--surface-2)',
      stroke: o.alvo ? 'var(--s1)' : 'var(--ring)',
      'stroke-width': o.alvo ? 1.8 : 1,
      opacity: o.aux ? .62 : 1}));
  }
  function rotulo(t2, x, y, cls, estilo, cor) {
    svg.appendChild(txt(t2,{x:x, y:y, class:cls, style:estilo, fill:cor}));
  }

  /* raiz */
  caixa(CX[0], yRaiz, CW[0], 62);
  rotulo('MATRIZ DE REFERÊNCIA', CX[0]+14, yRaiz - 6, 'tick', 'font-size:10.5px;letter-spacing:.06em');
  rotulo('do ENEM', CX[0]+14, yRaiz + 13, 'rowlab on', 'font-size:15px');

  /* eixos cognitivos · auxiliar */
  caixa(CX[1], yEixos, CW[1], 52, {aux:true});
  rotulo('CAMADA AUXILIAR', CX[1]+13, yEixos - 11, 'tick', 'font-size:9.5px;letter-spacing:.07em');
  rotulo(m.eixos.length + ' eixos cognitivos', CX[1]+13, yEixos + 5, 'rowlab', 'font-size:13px;font-weight:650');
  rotulo(m.eixos.map(e => e.sigla).join(' · '), CX[1]+13, yEixos + 20, 'tick', 'font-size:10.5px');

  /* áreas → competências → habilidades */
  areas.forEach((a,i) => {
    const y = linhas[i];
    caixa(CX[1], y, CW[1], 42);
    svg.appendChild(el('rect',{x:CX[1]+11, y:y-11, width:30, height:22, rx:5,
      fill:'var(--s1)', opacity:.16}));
    rotulo(a.id, CX[1]+26, y + 4, 'rowlab on', 'font-size:11.5px', 'var(--s1)');
    rotulo(NOME[a.id], CX[1]+50, y + 4, 'rowlab', 'font-size:12.5px');

    caixa(CX[2], y, CW[2], 42);
    rotulo(a.competencias + ' competências', CX[2]+13, y + 4, 'rowlab', 'font-size:12.5px');

    caixa(CX[3], y, CW[3], 42, {alvo:true});
    svg.appendChild(el('use',{href:'#ic-alvo', x:CX[3]+12, y:y-9, width:18, height:18,
      fill:'none', stroke:'var(--s1)', 'stroke-width':1.8}));
    rotulo('30 habilidades', CX[3]+38, y + 4, 'rowlab on', 'font-size:13px');
  });

  /* rótulo da coluna do alvo */
  rotulo('◆ ALVO DA CLASSIFICAÇÃO', CX[3], linhas[0] - 34, 'tick',
    'font-size:10px;font-weight:700;letter-spacing:.07em', 'var(--s1)');
  /* alinhado à direita da coluna do alvo, para nunca estourar a borda do SVG */
  const xFim = CX[3] + CW[3];
  [['120 habilidades no total.', 36],
   ['Os códigos H1 a H30 se repetem entre as áreas,', 50],
   ['então a chave é área + código.', 64]].forEach(([t2,dy]) => {
    svg.appendChild(txt(t2, {x:xFim, y:linhas[3]+dy, 'text-anchor':'end',
      class:'tick', style:'font-size:10.5px'}));
  });

  /* objetos de conhecimento · auxiliar */
  const wObj = CX[3] + CW[3] - CX[2];
  caixa(CX[2], yObj, wObj, 52, {aux:true});
  rotulo('CAMADA AUXILIAR', CX[2]+13, yObj - 11, 'tick', 'font-size:9.5px;letter-spacing:.07em');
  rotulo(FATOS.nObj + ' objetos de conhecimento', CX[2]+13, yObj + 5, 'rowlab', 'font-size:13px;font-weight:650');
  rotulo(FATOS.objPorArea, CX[2]+13, yObj + 20, 'tick', 'font-size:10.5px');

  /* tooltips */
  areas.forEach((a,i) => {
    const y = linhas[i];
    const hit = el('rect',{x:CX[1], y:y-21, width:CX[3]+CW[3]-CX[1], height:42, class:'hit'});
    bindTip(hit, tipHTML(a.nome, [
      ['Competências de área', a.competencias],
      ['Habilidades', a.habilidades],
      ['Objetos de conhecimento', a.objetos],
      ['Candidatas por item', D.escada.candidatos_por_area]
    ]));
    svg.appendChild(hit);
  });
  const hitEixos = el('rect',{x:CX[1], y:yEixos-26, width:CW[1], height:52, class:'hit'});
  bindTip(hitEixos, tipHTML('Eixos cognitivos', m.eixos.map(e => [e.sigla, e.nome])));
  svg.appendChild(hitEixos);
}

/* =========================================================
   7 · COMO AS TRÊS ÂNCORAS SÃO CONSTRUÍDAS
   ========================================================= */
function gAncoras() {
  const svg = document.getElementById('g-ancoras'); clear(svg);
  const W = Math.max(700, svg.parentNode.clientWidth), H = 232;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('width',W); svg.setAttribute('height',H);
  svg.style.minWidth = W + 'px';

  const xLab = 6, xIn = 76, xVet = null, rows = [48, 114, 180];
  const xRes = W - 148;                 // coluna dos resultados
  const xSeta = xRes - 54;              // seta -> vetor
  const LARG = xSeta - xIn - 14;        // espaço disponível para as entradas

  function ficha(x, y, w, h, texto, cor, sub) {
    svg.appendChild(el('rect',{x:x, y:y-h/2, width:w, height:h, rx:6,
      fill: cor || 'var(--surface-2)', stroke:'var(--ring)', 'stroke-width':1}));
    svg.appendChild(txt(texto,{x:x+w/2, y:y+(sub?-1:4), 'text-anchor':'middle',
      class:'dg-s', style:'font-size:10.5px;fill:var(--ink)'}));
    if (sub) svg.appendChild(txt(sub,{x:x+w/2, y:y+12, 'text-anchor':'middle', class:'dg-xs'}));
  }
  function seta(x1,y1,x2,y2,cor) {
    svg.appendChild(el('path',{d:'M'+x1+' '+y1+'H'+x2, fill:'none',
      stroke:cor||'var(--axis)', 'stroke-width':1.6, 'marker-end':'url(#seta)'}));
  }

  svg.appendChild(txt('COMO A HABILIDADE É DESCRITA',{x:xIn, y:20, class:'dg-eyebrow'}));
  svg.appendChild(txt('VETOR',{x:xSeta+26, y:20, class:'dg-eyebrow', 'text-anchor':'middle'}));
  svg.appendChild(txt('RESULTADO',{x:xRes, y:20, class:'dg-eyebrow'}));

  const defs = [
    {id:'bgeA', nome:'Forma A', pecas:[{t:'Texto do descritor', s:'como está na matriz', f:1}]},
    {id:'bgeB', nome:'Forma B', pecas:[{t:'Texto do descritor', s:'', f:.52},
                                       {op:'+'},
                                       {t:'Objetos de conhecimento', s:'da área', f:.48}]},
    {id:'bgeC', nome:'Forma C', pecas:[{itens:true}]}
  ];

  defs.forEach((d,i) => {
    const y = rows[i], c = byId[d.id], alvo = d.id === 'bgeC';
    if (alvo) svg.appendChild(el('rect',{x:2, y:y-30, width:W-4, height:60, rx:9,
      fill:'var(--accent-wash)'}));
    svg.appendChild(txt(d.nome,{x:xLab, y:y+4, class:'rowlab on', style:'font-size:12.5px'}));

    if (d.pecas[0].itens) {
      // Forma C: fichas de itens -> chave -> centroide
      const n = 7, fw = 26, gap = 5, wTot = n*fw + (n-1)*gap;
      for (let k = 0; k < n; k++)
        ficha(xIn + k*(fw+gap), y-6, fw, 15, '', 'var(--surface-2)');
      svg.appendChild(txt('itens do ENEM atribuídos a essa habilidade',
        {x:xIn, y:y+20, class:'dg-xs'}));
      const xc = xIn + wTot + 16;
      svg.appendChild(txt('mediana de 7 por habilidade',{x:xIn+wTot+16, y:y-10, class:'dg-xs'}));
      ficha(xc, y+4, 84, 18, 'centroide', 'var(--surface)');
    } else {
      let x = xIn;
      d.pecas.forEach(pz => {
        if (pz.op) {
          svg.appendChild(txt(pz.op,{x:x+9, y:y+5, 'text-anchor':'middle', class:'dg-t',
            style:'font-size:14px;fill:var(--ink-2)'}));
          x += 20; return;
        }
        const w = Math.round((LARG - (d.pecas.length > 1 ? 20 : 0)) * pz.f);
        ficha(x, y, w, 30, pz.t, 'var(--surface)', pz.s);
        x += w + 4;
      });
    }

    seta(xSeta, y, xSeta + 40, y);
    // glifo do vetor
    svg.appendChild(el('path',{d:'M'+(xSeta+8)+' '+(y+14)+'L'+(xSeta+34)+' '+(y-10),
      stroke:'var(--s1)', 'stroke-width':2, 'stroke-linecap':'round', fill:'none'}));

    svg.appendChild(txt(f1(c.top1)+'%',{x:xRes, y:y+1, class:'vallab',
      style:'font-size:15px' + (alvo ? ';fill:var(--s1)' : '')}));
    svg.appendChild(txt(f1(c.top5)+'% entre as 5',{x:xRes, y:y+16, class:'dg-s'}));
  });

  svg.appendChild(txt('A matriz diz o que a habilidade é; os itens mostram como ela é cobrada.',
    {x:xIn, y:H-6, class:'dg-s', style:'fill:var(--muted)'}));

  tabela('t-ancoras', ['Âncora','O que representa a habilidade','Constrói algo?','1ª posição','5 primeiras'], [
    ['Forma A','O texto do descritor, como está na matriz','Não', f1(byId.bgeA.top1)+'%', f1(byId.bgeA.top5)+'%'],
    ['Forma B','O descritor somado aos objetos de conhecimento da área','Não', f1(byId.bgeB.top1)+'%', f1(byId.bgeB.top5)+'%'],
    ['Forma C','O centroide dos itens do exame atribuídos àquela habilidade','Sim, centroides de itens, não treino de modelo', f1(byId.bgeC.top1)+'%', f1(byId.bgeC.top5)+'%'],
  ], [2]);
}

/* =========================================================
   7b · TOKENS POR ITEM (ato 06)
   ========================================================= */
function gTokens() {
  const svg = document.getElementById('g-tokens'); clear(svg);
  const W = Math.max(520, svg.parentNode.clientWidth);
  const padL = W < 680 ? 118 : 170, padR = 90, padT = 14, grupo = 62, padB = 52;
  const linhas = [
    {nome:'Proprietário', sub:'gpt-5.5 · pago por token', cor:'var(--critical)',
     ent: s.tokens_api.entrada / s.tokens_api_n, sai: s.tokens_api.saida / s.tokens_api_n, n: s.tokens_api_n},
    {nome:'Aberto, local', sub:'qwen3:14b · token sem preço', cor:'var(--s1)',
     ent: s.tokens_local.entrada / s.tokens_local_n, sai: s.tokens_local.saida / s.tokens_local_n, n: s.tokens_local_n}
  ];
  const H = padT + linhas.length*grupo + padB;
  const XMAX = 3500, x0 = padL, x1 = W - padR;
  const X = v => x0 + (v/XMAX)*(x1-x0);
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('width',W); svg.setAttribute('height',H);
  svg.style.minWidth = W + 'px';
  [0,1000,2000,3000].forEach(v => {
    svg.appendChild(el('line',{x1:X(v),y1:padT,x2:X(v),y2:padT+linhas.length*grupo,class:'gridline'}));
    svg.appendChild(txt(v===0?'0':(v/1000)+' mil',{x:X(v),y:padT+linhas.length*grupo+20,'text-anchor':'middle',class:'tick'}));
  });
  svg.appendChild(txt('tokens por item',{x:x1,y:padT+linhas.length*grupo+36,'text-anchor':'end',class:'tick'}));
  const fmt = v => Math.round(v).toLocaleString('pt-BR');
  linhas.forEach((l,i) => {
    const y = padT + i*grupo;
    const [modelo, custo] = l.sub.split(' · ');
    svg.appendChild(txt(l.nome,{x:padL-14,y:y+18,'text-anchor':'end',class:'rowlab on'}));
    svg.appendChild(txt(modelo,{x:padL-14,y:y+33,'text-anchor':'end',class:'tick',style:'font-size:10.5px'}));
    svg.appendChild(txt(custo,{x:padL-14,y:y+47,'text-anchor':'end',class:'tick',style:'font-size:10.5px',
      fill: i===0 ? 'var(--critical)' : 'var(--s1)'}));
    [['ent','var(--s1)',8],['sai','var(--s2)',32]].forEach(([k,cor,dy]) => {
      const w = X(l[k]) - x0;
      svg.appendChild(el('rect',{x:x0,y:y+dy,width:Math.max(w,2),height:20,rx:4,fill:cor}));
      svg.appendChild(txt(fmt(l[k]),{x:X(l[k])+8,y:y+dy+14,class:'vallab',style:'font-size:12px'}));
    });
    const hit = el('rect',{x:padL-6,y:y+2,width:x1-padL+80,height:grupo-6,class:'hit'});
    bindTip(hit, tipHTML(l.nome + ' · ' + l.sub.split(' · ')[0], [
      ['Entrada por item', fmt(l.ent)], ['Saída por item', fmt(l.sai)],
      ['Itens classificados', l.n], ['Custo por token', i===0 ? 'cobrado' : 'zero']
    ]));
    svg.appendChild(hit);
  });
  tabela('t-tokens', ['Modelo','Itens','Entrada total','Saída total','Entrada por item','Saída por item','Custo por token'], [
    ['gpt-5.5 (proprietário)', s.tokens_api_n, fi(s.tokens_api.entrada), fi(s.tokens_api.saida), fmt(linhas[0].ent), fmt(linhas[0].sai), 'cobrado'],
    ['qwen3:14b (local)', s.tokens_local_n, fi(s.tokens_local.entrada), fi(s.tokens_local.saida), fmt(linhas[1].ent), fmt(linhas[1].sai), 'zero']
  ]);
}

/* =========================================================
   8 · O QUE A LISTA DE CINCO COMPRA (fechamento)
   ========================================================= */
function gEscolha() {
  const svg = document.getElementById('g-escolha'); clear(svg);
  const W = Math.max(660, svg.parentNode.clientWidth), H = 196;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  svg.setAttribute('width',W); svg.setAttribute('height',H);
  svg.style.minWidth = W + 'px';

  const COLS = 6, CEL = 18, GAP = 4;
  const GW = COLS*CEL + (COLS-1)*GAP;                 // 128
  const N = D.escada.candidatos_por_area;              // 30
  const LINHAS = Math.ceil(N/COLS);
  const GH = LINHAS*CEL + (LINHAS-1)*GAP;

  const INNER = 648, ox = Math.max(8, (W - INNER)/2);
  const xA = ox, xB = ox + GW + 92, yG = 44;

  function grade(x, destacar) {
    for (let i = 0; i < N; i++) {
      const c = i % COLS, l = Math.floor(i/COLS);
      const on = destacar && i < 5;
      svg.appendChild(el('rect',{
        x: x + c*(CEL+GAP), y: yG + l*(CEL+GAP), width: CEL, height: CEL, rx: 3.5,
        fill: on ? 'var(--s1)' : 'var(--surface-2)',
        stroke: on ? 'none' : 'var(--ring)', 'stroke-width': 1}));
    }
  }
  grade(xA, false);
  grade(xB, true);

  svg.appendChild(txt('SEM O SISTEMA',{x:xA, y:26, class:'dg-eyebrow'}));
  svg.appendChild(txt('COM A LISTA DE CINCO',{x:xB, y:26, class:'dg-eyebrow',
    style:'fill:var(--s1)'}));
  svg.appendChild(txt(N + ' candidatas para percorrer',{x:xA, y:yG+GH+20, class:'dg-s'}));
  svg.appendChild(txt('5 para conferir',{x:xB, y:yG+GH+20, class:'dg-t',
    style:'fill:var(--s1)'}));

  /* seta entre as duas grades */
  const xs = xA + GW + 26, xe = xB - 26, ym = yG + GH/2;
  svg.appendChild(el('path',{d:'M'+xs+' '+ym+'H'+xe, fill:'none',
    stroke:'var(--axis)', 'stroke-width':1.8, 'marker-end':'url(#seta)'}));

  /* leitura, à direita */
  const xT = xB + GW + 34;
  const gpt = byId.gpt, q14 = byId.qwen14;
  [['A habilidade oficial do INEP está', 0, 'dg-s'],
   ['entre essas cinco em', 15, 'dg-s']].forEach(([t2,dy,c]) =>
    svg.appendChild(txt(t2,{x:xT, y:yG+6+dy, class:c})));
  svg.appendChild(txt(f1(gpt.top5)+'%',{x:xT, y:yG+44,
    style:'font-size:27px;font-weight:700;fill:var(--ink)'}));
  svg.appendChild(txt('com o modelo proprietário,',{x:xT, y:yG+64, class:'dg-s'}));
  svg.appendChild(txt('e em ' + f1(q14.top5) + '% com o aberto local.',{x:xT, y:yG+79, class:'dg-s'}));
  svg.appendChild(txt('Na 1ª posição: ' + f1(gpt.top1) + '% e ' + f1(q14.top1) + '%.',
    {x:xT, y:yG+102, class:'dg-s', style:'fill:var(--muted)'}));

  const hit = el('rect',{x:xB, y:yG, width:GW, height:GH, class:'hit'});
  bindTip(hit, tipHTML('A lista de cinco', [
    ['Candidatas na área', N],
    ['Devolvidas pelo sistema', 5],
    ['Oficial entre elas · gpt-5.5', f1(gpt.top5)+'%'],
    ['Oficial entre elas · qwen3:14b', f1(q14.top5)+'%']
  ]));
  svg.appendChild(hit);
}

/* =========================================================
   tema + render
   ========================================================= */
function renderAll() {
  gArvore(); gEscada(); gAncoras(); gSoberania(); gTokens(); gEscolha();
  gTempo('g-tempo1','top1','1ª posição',45,'2021: o lexical passa à frente das vetoriais');
  gTempo('g-tempo5','top5','5 primeiras',80,null);
  tabelaTempo();
}
const btn = document.getElementById('btn-tema');
function temaAtual() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t) return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function pintaBotao() {
  const esc = temaAtual() === 'dark';
  btn.textContent = esc ? '☀ Claro' : '☾ Escuro';
  btn.setAttribute('aria-pressed', esc ? 'true' : 'false');
}
btn.addEventListener('click', () => {
  const novo = temaAtual() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', novo);
  try { localStorage.setItem('tema', novo === 'dark' ? 'escuro' : 'claro'); } catch(e) {}
  pintaBotao(); renderAll();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (!document.documentElement.getAttribute('data-theme')) { pintaBotao(); renderAll(); }
});
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(renderAll, 140); });
pintaBotao(); renderAll();
</script>
</body>
</html>

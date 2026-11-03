// ────── overview KPI 動的更新 ──────
function updateOverviewKPI(){
  const src=_curSectors();
  if(!src.length) return;
  const pbr=PBR_TS.length?PBR_TS[PBR_TS.length-1]:null;
  const per=PER_TS.length?PER_TS[PER_TS.length-1]:null;
  const latestYm=MONTHS.length?MONTHS[MONTHS.length-1]:null;
  const below1=src.filter(s=>(_finePbr(s)??Infinity)<1.0).length;
  const totalCap=src.reduce((s,a)=>s+(a.cap||0),0);
  const maxS=src.reduce((m,s)=>(s.pbr||0)>(m.pbr||0)?s:m,src[0]||{n:'',pbr:0});
  const total=src.length;
  const el=document.querySelector('#pg-overview .kpi-row');
  if(!el) return;
  const kv=el.querySelectorAll('.kpi');
  if(kv[0]){
    kv[0].querySelector('.kpi-val').innerHTML=pbr!=null?`${pbr.toFixed(2)}<span style="font-size:12px;color:var(--muted)">x</span>`:'–';
    if(latestYm) kv[0].querySelector('.kpi-sub').innerHTML=`<span class="fl">${latestYm}基準</span>`;
  }
  if(kv[1]&&per!=null) kv[1].querySelector('.kpi-val').innerHTML=`${per.toFixed(1)}<span style="font-size:12px;color:var(--muted)">x</span>`;
  if(kv[2]) kv[2].querySelector('.kpi-val').innerHTML=`${below1}<span style="font-size:12px;color:var(--muted)">/${total}</span>`;
  if(kv[3]) kv[3].querySelector('.kpi-val').innerHTML=`${Math.round(totalCap)}<span style="font-size:12px;color:var(--muted)">兆円</span>`;
  if(kv[4]&&maxS.n){
    kv[4].querySelector('.kpi-val').innerHTML=`<span style="font-size:15px">${maxS.n}</span>`;
    kv[4].querySelector('.kpi-sub').innerHTML=`<span style="font-family:var(--mono);color:var(--purple)">${maxS.pbr!=null?maxS.pbr.toFixed(2):'–'}x</span>`;
  }
  document.getElementById('nb-below').textContent=below1;
  const metaEl=document.querySelector('#pg-overview .g2 .card:first-child .card-meta');
  if(metaEl&&latestYm) metaEl.textContent=latestYm;
  renderOverviewSignals();
  renderPbrHeatGrid(src);
}

// ────── overview signal summary ──────
function renderOverviewSignals(){
  const src=_curSectors();
  const sb=src.filter(s=>signal(s).cls==='chip-g');
  const b=src.filter(s=>signal(s).cls==='chip-b');
  const ca=src.filter(s=>signal(s).cls==='chip-r'||signal(s).cls==='chip-a');
  function fmt(list,empty){
    if(!list.length) return `<span style="color:var(--muted)">${empty}</span>`;
    return list.map(s=>{
      const pbr=s.pbr!=null?s.pbr.toFixed(2)+'x':'–';
      const catCol=CAT_COL[s.cat]||'var(--muted)';
      return `<span style="display:inline-flex;align-items:center;gap:3px;margin:1px 6px 1px 0"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${catCol};flex-shrink:0"></span><span style="color:var(--text)">${s.n}</span><span style="font-family:var(--mono);color:var(--muted);font-size:10px">${pbr}</span></span>`;
    }).join('');
  }
  const sbEl=document.getElementById('ovStrongBuy');
  const bEl=document.getElementById('ovBuy');
  const cEl=document.getElementById('ovCaution');
  if(sbEl) sbEl.innerHTML=fmt(sb,'該当なし');
  if(bEl) bEl.innerHTML=fmt(b,'該当なし');
  if(cEl) cEl.innerHTML=fmt(ca,'注意フラグなし');
}

// ────── screening ──────
const _SIG_MAP={
  strong_buy: {txt:'強いBuy候補',cls:'chip-g'},
  buy:        {txt:'Buy候補',    cls:'chip-b'},
  caution_hot:{txt:'過熱注意',   cls:'chip-r'},
  caution_surge:{txt:'急騰注意', cls:'chip-a'},
  hold:       {txt:'Hold',       cls:'chip-p'},
  neutral:    {txt:'Neutral',    cls:''},
};
function signal(s){
  if(s.sig && _SIG_MAP[s.sig]) return _SIG_MAP[s.sig];
  if(s.pbr<0.6 && s.chg>0.2) return _SIG_MAP.strong_buy;
  if(s.pbr<1.0 && s.chg>0.3) return _SIG_MAP.buy;
  if(s.pbr>2.5 && s.chg<0)   return _SIG_MAP.caution_hot;
  if(s.chg>0.8)               return _SIG_MAP.caution_surge;
  if(s.pbr>=1.0 && s.pbr<1.5)return _SIG_MAP.hold;
  return _SIG_MAP.neutral;
}
function _setPresetTagActive(preset){
  document.querySelectorAll('#fg-preset .ftag').forEach(t=>{
    t.classList.toggle('on',t.dataset.preset===preset);
  });
}
function _setScreenTagGroup(groupId, attr, value){
  document.querySelectorAll(`#${groupId} .ftag`).forEach(t=>{
    t.classList.toggle('on', t.dataset[attr]===value);
  });
}
function _applyScreenState(state){
  fCat=state.cat ?? 'all';
  fPbr=state.pbr ?? 'all';
  fChgMin=state.chg ?? -1;
  fSearch=state.search ?? '';
  _setPresetTagActive(state.preset ?? 'all');
  _setScreenTagGroup('fg-cat','cat',fCat);
  _setScreenTagGroup('fg-pbr','pbr',fPbr);
  const slider=document.getElementById('sl-chg');
  const sliderVal=document.getElementById('sl-val');
  if(slider) slider.value=fChgMin;
  if(sliderVal) sliderVal.textContent=fChgMin>=0?'+'+fChgMin.toFixed(1):fChgMin===-1?'｜':fChgMin.toFixed(1);
  const searchEl=document.getElementById('screenSearch');
  if(searchEl) searchEl.value=fSearch;
  _syncFilterUrl();
  renderScreen();
}
function applyScreenPreset(name){
  const presets={
    all:       {preset:'all',cat:'all',pbr:'all',chg:-1,search:''},
    value:     {preset:'value',cat:'V',pbr:'below1',chg:-1,search:''},
    improving: {preset:'improving',cat:'all',pbr:'all',chg:0.3,search:''},
    cyclical:  {preset:'cyclical',cat:'C',pbr:'all',chg:-1,search:''},
    defensive: {preset:'defensive',cat:'D',pbr:'all',chg:-1,search:''},
  };
  _applyScreenState(presets[name] || presets.all);
}
function openGuidePath(mode){
  if(mode==='find-sectors'){
    goto('overview');
    applyScreenPreset('improving');
    goto('screen');
    return;
  }
  if(mode==='find-value'){
    applyScreenPreset('value');
    goto('pbr1');
    return;
  }
  if(mode==='macro-first'){
    goto('cycle');
    return;
  }
  if(mode==='pick-stocks'){
    goto('stocks');
    return;
  }
}
function _sortScreen(key){
  if(_screenSort.key===key) _screenSort.asc=!_screenSort.asc;
  else{_screenSort.key=key;_screenSort.asc=key==='code'||key==='n'||key==='cat';}
  // ヘッダーのソート矢印を更新
  document.querySelectorAll('#screenThead th[data-skey]').forEach(th=>{
    const k=th.dataset.skey;
    const arrow=k===_screenSort.key?(_screenSort.asc?' ▲':' ▼'):'';
    th.textContent=th.textContent.replace(/ [▲▼]$/,'')+arrow;
  });
  renderScreen();
}
function renderScreen(){
  const {key,asc}=_screenSort;
  const cmp=(a,b)=>{
    if(key==='code'){const ca=SECTOR_CODE[a.n]??9999,cb=SECTOR_CODE[b.n]??9999;return ca-cb;}
    const va=a[key]??'',vb=b[key]??'';
    return typeof va==='string'?va.localeCompare(vb,['ja','en']):va-vb;
  };
  const data=_curSectors().filter(s=>{
    if(fCat!=='all'&&s.cat!==fCat) return false;
    if(fPbr==='below1'&&(s.pbr??0)>=1.0) return false;
    if(fPbr==='1to2'&&((s.pbr??0)<1.0||(s.pbr??0)>=2.0)) return false;
    if(fPbr==='above2'&&(s.pbr??0)<2.0) return false;
    if((s.chg??-Infinity)<fChgMin) return false;
    if(fSearch&&!s.n.includes(fSearch)) return false;
    return true;
  }).sort((a,b)=>asc?cmp(a,b):cmp(b,a));
  document.getElementById('screen-count').textContent=`${data.length} 業種 / ${_curSectors().length}業種中`;
  const symEl=document.getElementById('screen-ym');
  if(symEl) symEl.textContent=_activeSectors?document.getElementById('scYm').textContent+' 基準':'最新月';
  document.getElementById('nb-screen').textContent=data.filter(s=>signal(s).cls==='chip-g'||signal(s).cls==='chip-b').length;
  const tbody=document.getElementById('screenBody');
  tbody.innerHTML=data.map(s=>{
    const sig=signal(s);
    const chgColor=s.chg>0?'var(--green)':s.chg<0?'var(--red)':'var(--muted)';
    const chgSym=s.chg>0?'▲':s.chg<0?'▼':'±';
    const catCol=CAT_COL[s.cat];
    return `<tr>
      <td class="bold">${s.n}</td>
      <td><span class="chip" style="background:${catCol}22;color:${catCol}">${CAT_LBL[s.cat]}</span></td>
      <td style="font-family:var(--mono);color:${s.pbr<1?'var(--amber)':'var(--text)'};font-weight:500">${s.pbr.toFixed(2)}x</td>
      <td style="font-family:var(--mono);color:${chgColor}">${chgSym}${Math.abs(s.chg).toFixed(2)}</td>
      <td style="font-family:var(--mono)">${s.per!=null?s.per+'x':'－'}</td>
      <td style="font-family:var(--mono)">${s.cap.toFixed(1)}兆</td>
      <td style="font-family:var(--mono)">${s.cos}</td>
      <td style="font-family:var(--mono)">${s.dy!=null?s.dy.toFixed(1)+'%':'–'}</td>
      <td>${sig.txt?`<span class="chip ${sig.cls}">${sig.txt}</span>`:''}</td>
      <td style="white-space:nowrap">
        <button onclick="showSectorDetail(_curSectors().find(x=>x.n==='${s.n.replace(/'/g,"\\'")}'))" title="詳細ダイアログを開く" style="background:none;border:1px solid var(--border2);color:var(--muted);padding:2px 8px;border-radius:4px;font-size:10px;cursor:pointer">🔍</button>
      </td>
    </tr>`;
  }).join('');
}
function fToggle(el,grp){
  const val=el.dataset[grp];
  if(grp==='cat') fCat=val;
  if(grp==='pbr') fPbr=val;
  _setPresetTagActive('all');
  document.querySelectorAll(`#fg-${grp} .ftag`).forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  _syncFilterUrl();
  renderScreen();
}
function updateSl(){
  fChgMin=parseFloat(document.getElementById('sl-chg').value);
  document.getElementById('sl-val').textContent=fChgMin>=0?'+'+fChgMin.toFixed(1):fChgMin===-1?'｜':fChgMin.toFixed(1);
  _setPresetTagActive('all');
  _syncFilterUrl();
  renderScreen();
}
function setSearch(v){
  fSearch=v.trim();
  _setPresetTagActive('all');
  renderScreen();
}

// ────── overview sector list ──────
function renderSectList(){
  const sorted=[..._curSectors()].sort((a,b)=>b.pbr-a.pbr);
  const items=[...sorted.slice(0,5),null,...sorted.slice(-5).reverse()];
  document.getElementById('sectList').innerHTML=items.map(s=>{
    if(!s) return `<div style="height:6px;border-top:1px solid ${dividerColor()};margin:3px 0"></div>`;
    const col=s.pbr>=1?'var(--green)':'var(--amber)';
    const w=Math.min(100,s.pbr/4*100);
    const c=s.chg>0?`<span class="up">▲${s.chg.toFixed(2)}</span>`:s.chg<0?`<span class="dn">▼${Math.abs(s.chg).toFixed(2)}</span>`:`<span style="color:var(--muted)">±0.0</span>`;
    return `<div class="sbar-row"><span class="sbar-name">${s.n}</span>
      <div class="sbar-track"><div class="sbar-fill" style="width:${w}%;background:${col}"></div></div>
      <span class="sbar-val" style="color:${col}">${s.pbr.toFixed(2)}x</span>
      <span class="sbar-chg">${c}</span></div>`;
  }).join('');
}


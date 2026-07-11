// ────── charts ──────
function mk(id,cfg){const c=document.getElementById(id);if(!c)return null;return new Chart(c,cfg);}
function lineDs(label,data,color,yAxis){return{label,data,borderColor:color,backgroundColor:color+'18',fill:false,tension:.4,pointRadius:2,borderWidth:2,yAxisID:yAxis||'y'};}
function fmtMonth(s){return s.replace('/','-');}
function chartTickColor(){ return themeMode==='light' ? '#475467' : '#6b7491'; }
function chartLabelColor(){ return themeMode==='light' ? '#162031' : '#dde2f0'; }
function chartGridColor(){ return themeMode==='light' ? 'rgba(16,24,40,.08)' : 'rgba(255,255,255,.04)'; }
function chartGridColorSoft(){ return themeMode==='light' ? 'rgba(16,24,40,.06)' : 'rgba(255,255,255,.03)'; }
function accentBlue(){ return themeMode==='light' ? '#2563eb' : '#5b8df6'; }
function accentAmber(){ return themeMode==='light' ? '#c98512' : '#f5a623'; }
function dividerColor(){ return themeMode==='light' ? 'rgba(16,24,40,.08)' : 'rgba(255,255,255,.04)'; }
function fmtNum(v,digits=1,fallback='–'){
  const n=Number(v);
  return Number.isFinite(n)?n.toFixed(digits):fallback;
}
function ttLabel(label,value,unit,digits=1){
  const base=label?`${label}: `:'';
  return `${base}${fmtNum(value,digits)}${unit||''}`;
}
function chartTitle(text){
  return {
    display:true,
    text,
    color:chartLabelColor(),
    font:{size:10,weight:'500'},
    padding:{bottom:8}
  };
}
function traceHasVisibleData(trace){
  const keys=['x','y','z'];
  return keys.some(key=>{
    const arr=trace?.[key];
    return Array.isArray(arr) && arr.some(v=>Number.isFinite(v) || (Array.isArray(v) && v.some(Number.isFinite)));
  });
}
function chartHasVisibleData(chart){
  if(!chart?.data?.datasets?.length) return false;
  return chart.data.datasets.some((ds,idx)=>{
    if(typeof chart.isDatasetVisible==='function' && !chart.isDatasetVisible(idx)) return false;
    const arr=Array.isArray(ds.data)?ds.data:[];
    return arr.some(v=>{
      if(v==null) return false;
      if(typeof v==='number') return Number.isFinite(v);
      if(typeof v==='object'){
        if(Number.isFinite(v.x)||Number.isFinite(v.y)||Number.isFinite(v.r)) return true;
      }
      return false;
    });
  });
}
function ensurePlotlyHost(canvasId){
  const canvas=document.getElementById(canvasId);
  if(!canvas || !canvas.parentElement) return null;
  const hostId=`${canvasId}Plotly`;
  let host=document.getElementById(hostId);
  if(!host){
    host=document.createElement('div');
    host.id=hostId;
    host.className='plotly-host';
    canvas.parentElement.appendChild(host);
  }
  return host;
}
let _themeMediaQuery=null;
function isThemeExplicit(){
  try{ return !!localStorage.getItem('jpxDashboardTheme'); }catch(_e){ return false; }
}
function initThemeAutoFollow(){
  if(typeof window.matchMedia!=='function') return;
  _themeMediaQuery=window.matchMedia('(prefers-color-scheme: dark)');
  const applySystem=e=>{
    if(isThemeExplicit()) return;
    setTheme(e.matches?'dark':'light');
    updateThemePill();
  };
  if(typeof _themeMediaQuery.addEventListener==='function') _themeMediaQuery.addEventListener('change',applySystem);
  else if(typeof _themeMediaQuery.addListener==='function') _themeMediaQuery.addListener(applySystem);
}
function plotlyTheme(layout){
  const isLight=themeMode==='light';
  const tickColor=isLight?'#344054':'#6b7491';
  const gridColor=isLight?'rgba(16,24,40,.08)':'rgba(255,255,255,.04)';
  const axDef={gridcolor:gridColor,tickfont:{color:isLight?'#162031':'#6b7491',size:10},zeroline:false};
  const merged={
    paper_bgcolor:'rgba(0,0,0,0)',
    plot_bgcolor:'rgba(0,0,0,0)',
    font:{family:"IBM Plex Sans, Noto Sans JP, sans-serif",color:isLight?'#162031':'#dde2f0',size:11},
    margin:{l:56,r:24,t:24,b:44},
    legend:{orientation:'h',yanchor:'bottom',y:1.02,xanchor:'left',x:0,font:{color:tickColor,size:11}},
    ...layout,
    xaxis:{...axDef,...(layout.xaxis||{})},
    yaxis:{...axDef,...(layout.yaxis||{})},
  };
  if(layout.yaxis2) merged.yaxis2={...axDef,showgrid:false,...layout.yaxis2};
  return merged;
}
function renderPlotlyChart(canvasId,traces,layout,config){
  const host=ensurePlotlyHost(canvasId);
  if(!host) return;
  const hasData=(traces||[]).some(traceHasVisibleData);
  const annotations=[...(layout?.annotations||[])];
  if(!hasData){
    annotations.push({
      text:'データなし',
      x:0.5,y:0.5,xref:'paper',yref:'paper',
      showarrow:false,
      font:{size:12,color:themeMode==='light'?'rgba(22,32,49,.55)':'rgba(221,226,240,.55)'}
    });
  }
  Plotly.react(host,traces,plotlyTheme({...layout,annotations}),{
    displayModeBar:false,
    responsive:true,
    ...config
  });
}
function applyChartMode(){
  const usePlotly=chartMode==='plotly';
  document.querySelectorAll('canvas[id]').forEach(canvas=>{
    canvas.classList.toggle('chart-host-hide',usePlotly);
    const host=document.getElementById(`${canvas.id}Plotly`);
    if(host) host.classList.toggle('act',usePlotly);
  });
  applyHeatmapMode();
  window.dispatchEvent(new Event('resize'));
}
function setChartMode(mode){
  chartMode=mode;
  applyChartMode();
}
function setTheme(mode){
  themeMode=mode;
  document.body.setAttribute('data-theme', mode);
  try{ localStorage.setItem('jpxDashboardTheme', mode); }catch(_e){}
  syncChartDefaults();
  refreshChartColors();
  renderHeatmap();
  if(typeof renderHeatmapChart==='function') renderHeatmapChart(true);
  selEv(currentEv, document.querySelector('.ev.act'));
  renderAllPlotly();
  renderPlotlyEvent(EVENTS[currentEv] || EVENTS[0]);
  renderPlotlyCycle();
}
function initTheme(){
  const paramTheme=getUrlParam('theme');
  let saved=null;
  try{ saved=localStorage.getItem('jpxDashboardTheme'); }catch(_e){}
  const initial = paramTheme || saved || 'light';
  themeMode=initial === 'light' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', themeMode);
  syncChartDefaults();
  updateThemePill();
  initThemeAutoFollow();
}
function populateYmOptions(){
  const sel=document.getElementById('ymSel');
  if(!sel || !MONTHS.length) return;
  const yyyymms = MONTHS.map(v=>v.replace('/','')).slice().reverse();
  sel.innerHTML=yyyymms.map(v=>`<option value="${v}">${v.slice(0,4)}年${v.slice(4,6)}月</option>`).join('');
  const latest = DASHBOARD_DATA?.latest_yyyymm || yyyymms[0];
  if(latest) sel.value = latest;
}
function updateDataModePill(){
  const el=document.getElementById('dataModePill');
  if(!el) return;
  el.classList.remove('pill-amber','pill-green');
  let member=false;
  try{ member=isMemberAuthorized(); }catch(_e){}
  if(DASHBOARD_DATA){
    el.textContent='実データ ⇌';
    el.classList.add('pill-green');
    el.style.cursor='pointer';
    el.title='クリックでサンプルデータに切り替え';
  } else if(window.JPX_DASHBOARD_DATA){
    el.textContent=member?'実データ ⇌':'🔒 実データへ';
    el.classList.add('pill-amber');
    el.style.cursor='pointer';
    el.title=member?'クリックで実データに切り替え':'有償会員ログインで実データに切り替え';
  } else {
    el.textContent='サンプルデータ';
    el.classList.add('pill-amber');
    el.style.cursor='default';
    el.title='';
  }
}
function updateSampleModeBanner(){
  const el=document.getElementById('sampleModeBanner');
  if(!el) return;
  el.style.display=!DASHBOARD_DATA?'block':'none';
}
function toggleDataMode(){
  if(!window.JPX_DASHBOARD_DATA) return;
  if(_forceSample && typeof _isMember==='function' && !_isMember()){
    if(typeof showMemberLogin==='function') showMemberLogin();
    return;
  }
  const url=new URL(location.href);
  if(_forceSample) url.searchParams.delete('mode');
  else url.searchParams.set('mode','sample');
  location.href=url.toString();
}
// A-2: 最新月へ
function goLatestYm(){
  const sel=document.getElementById('ymSel');
  if(!sel||!sel.options.length) return;
  sel.selectedIndex=0;
  onYm(sel.value);
}
// A-1: 生成日時表示
function updateGeneratedAt(){
  const el=document.getElementById('generatedAt');
  if(!el) return;
  const ga=DASHBOARD_DATA?.generated_at||(_forceSample?'2025-07-31T09:00:00':null);
  if(!ga) return;
  try{
    const d=new Date(ga);
    if(isNaN(d)) return;
    el.textContent=`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} 更新`;
    el.title='データ生成日時: '+ga;
  }catch(_e){}
}
function updateReadmeDataFreshness(){
  const wrap=document.getElementById('readmeDataFreshness');
  if(!wrap) return;
  const ga=DASHBOARD_DATA?.generated_at||null;
  let gaText='–';
  if(ga){
    gaText=ga.replace('T',' ');
  }
  if(!DASHBOARD_DATA){
    wrap.innerHTML='sample モードでは固定の参考データを表示します。real モードでは、業種月次・銘柄評価・マクロ系列の最新取得状況がここに表示されます。';
    return;
  }
  const latestYyyymm=DASHBOARD_DATA.latest_yyyymm||null;
  const latestMonth=latestYyyymm?`${latestYyyymm.slice(0,4)}/${latestYyyymm.slice(4,6)}`:'–';
  const stocksAsOf=DASHBOARD_DATA?.stocks?.as_of||'–';
  const stockListAsOf=DASHBOARD_DATA?.stock_list?.as_of||'–';
  const macroAsOf=DASHBOARD_DATA?.cycle?.latest_macro?.as_of_by_series||{};
  const releaseSchedule=DASHBOARD_DATA?.cycle?.release_schedule||{};
  const scheduleLine=(label,key)=>{
    const item=releaseSchedule[key];
    if(!item) return `<div>${label}: <span style="font-family:var(--mono);color:var(--text)">–</span></div>`;
    const tone=item.basis==='official'?'var(--accent)':'var(--muted)';
    const suffix=item.note?` <span style="color:${tone}">(${item.note})</span>`:'';
    return `<div>${label}: <span style="font-family:var(--mono);color:var(--text)">${item.display||'–'}</span>${suffix}</div>`;
  };
  wrap.innerHTML=`
    <div style="margin-bottom:10px;padding:8px 12px;background:var(--bg3);border-radius:6px;font-size:10px;color:var(--hint);line-height:1.7">
      最終データ反映タイミング: <span style="font-family:var(--mono);color:var(--text)">${gaText}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div>
        <div style="font-weight:500;color:var(--text);margin-bottom:4px">主要データ</div>
        <div>JPX 月次業種データ: <span style="font-family:var(--mono);color:var(--text)">${latestMonth}</span></div>
        <div>銘柄別評価: <span style="font-family:var(--mono);color:var(--text)">${stocksAsOf}</span></div>
        <div>銘柄一覧マスタ: <span style="font-family:var(--mono);color:var(--text)">${stockListAsOf}</span></div>
      </div>
      <div>
        <div style="font-weight:500;color:var(--text);margin-bottom:4px">マクロ系列</div>
        <div>CI一致指数: <span style="font-family:var(--mono);color:var(--text)">${macroAsOf.ci_coin||'–'}</span></div>
        <div>CI先行指数: <span style="font-family:var(--mono);color:var(--text)">${macroAsOf.ci_leading||'–'}</span></div>
        <div>PMI: <span style="font-family:var(--mono);color:var(--text)">${macroAsOf.pmi||'–'}</span></div>
        <div>10年国債利回り: <span style="font-family:var(--mono);color:var(--text)">${macroAsOf.jgb_10y||'–'}</span></div>
        <div>政策金利: <span style="font-family:var(--mono);color:var(--text)">${macroAsOf.pol_rate||'–'}</span></div>
      </div>
    </div>
    <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div style="padding:8px 12px;background:var(--bg3);border-radius:6px">
        <div style="font-weight:500;color:var(--text);margin-bottom:4px">次回公表予定</div>
        <div style="font-size:10px;color:var(--hint);line-height:1.8">
          ${scheduleLine('CI', 'ci')}
          ${scheduleLine('政策金利', 'pol_rate')}
        </div>
      </div>
      <div style="padding:8px 12px;background:var(--bg3);border-radius:6px">
        <div style="font-weight:500;color:var(--text);margin-bottom:4px">更新目安</div>
        <div style="font-size:10px;color:var(--hint);line-height:1.8">
          ${scheduleLine('PMI', 'pmi')}
          ${scheduleLine('10年国債利回り', 'jgb_10y')}
        </div>
      </div>
    </div>
    <div style="margin-top:10px;padding:8px 12px;background:var(--bg3);border-radius:6px;font-size:10px;color:var(--hint);line-height:1.7">
      系列ごとに公開タイミングが異なるため、マクロ指標は同じ月で揃わないことがあります。景気循環分析では系列別の最新月を表示し、固定日を持たない系列は更新目安として表示します。
    </div>`;
}
// A-6: テーマピル
function toggleTheme(){
  setTheme(themeMode==='dark'?'light':'dark');
  updateThemePill();
}
function updateThemePill(){
  const el=document.getElementById('themePill');
  if(!el) return;
  el.textContent=themeMode==='dark'?'Dark ⇌':'Light ⇌';
  el.classList.toggle('pt-active',themeMode==='light');
}
// A-6: チャートモードピル
function toggleChartModePill(){
  const next=chartMode==='chartjs'?'plotly':'chartjs';
  setChartMode(next);
  try{const url=new URL(location.href);url.searchParams.set('chart',next);history.replaceState(null,'',url.toString());}catch(_e){}
  updateChartModePill();
}
function updateChartModePill(){
  const el=document.getElementById('chartModePill');
  if(!el) return;
  el.textContent=chartMode==='plotly'?'Plotly ⇌':'Chart.js ⇌';
  el.classList.toggle('pt-active',chartMode==='plotly');
}
// A-3: フィルター URL 同期
function _syncFilterUrl(){
  try{
    const url=new URL(location.href);
    fCat!=='all'?url.searchParams.set('cat',fCat):url.searchParams.delete('cat');
    fPbr!=='all'?url.searchParams.set('pbr',fPbr):url.searchParams.delete('pbr');
    fChgMin!==-1?url.searchParams.set('chg',fChgMin):url.searchParams.delete('chg');
    history.replaceState(null,'',url.toString());
  }catch(_e){}
}
function _restoreFilterUrl(){
  const cat=getUrlParam('cat');
  const pbr=getUrlParam('pbr');
  const chg=getUrlParam('chg');
  if(cat){fCat=cat;document.querySelectorAll('#fg-cat .ftag').forEach(t=>t.classList.toggle('on',t.dataset.cat===cat));}
  if(pbr){fPbr=pbr;document.querySelectorAll('#fg-pbr .ftag').forEach(t=>t.classList.toggle('on',t.dataset.pbr===pbr));}
  if(chg!=null){const v=parseFloat(chg);if(!isNaN(v)){fChgMin=v;const sl=document.getElementById('sl-chg');const sv=document.getElementById('sl-val');if(sl)sl.value=v;if(sv)sv.textContent=v>=0?'+'+v.toFixed(1):v.toFixed(1);}}
}

// ─────────────────────────────────────────
// B-1: PBR絶対値ラベル（Zスコアチャート用プラグイン）
// ─────────────────────────────────────────
Chart.register({
  id:'emptyStateOverlay',
  afterDraw(chart){
    const enabled=chart?.options?.plugins?.emptyState?.display;
    if(!enabled || chartHasVisibleData(chart)) return;
    const {ctx,chartArea}=chart;
    if(!ctx || !chartArea) return;
    ctx.save();
    ctx.fillStyle=themeMode==='light'?'rgba(22,32,49,.55)':'rgba(221,226,240,.55)';
    ctx.font='12px IBM Plex Sans, Noto Sans JP, sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(chart.options.plugins.emptyState.text||'データなし',(chartArea.left+chartArea.right)/2,(chartArea.top+chartArea.bottom)/2);
    ctx.restore();
  }
});
Chart.register({
  id:'zscorePbrLabel',
  afterDraw(chart){
    if(chart.canvas.id!=='zscoreC') return;
    const {ctx,chartArea}=chart;
    if(!chartArea) return;
    const meta=chart.getDatasetMeta(0);
    if(!meta||!meta.data) return;
    const zd=chart._zPbrData||[];
    ctx.save();
    ctx.font='9px JetBrains Mono,monospace';
    ctx.textAlign='right';
    meta.data.forEach((bar,i)=>{ 
      const pbr=zd[i]?.pbr;
      if(pbr==null) return;
      const z=chart.data.datasets[0].data[i];
      ctx.fillStyle=z<-1?'rgba(91,141,246,.9)':z>1?'rgba(224,84,84,.8)':'rgba(107,116,145,.7)';
      ctx.fillText(pbr.toFixed(1)+'x',chart.width-8,bar.y+3.5);
    });
    ctx.restore();
  }
});
Chart.register({
  id:'decompBarValueLabel',
  afterDatasetsDraw(chart){
    if(!['decompCapC','decompNavC'].includes(chart.canvas.id)) return;
    const {ctx}=chart;
    const meta=chart.getDatasetMeta(0);
    if(!meta?.data?.length) return;
    ctx.save();
    ctx.font='10px JetBrains Mono,monospace';
    ctx.textAlign='left';
    ctx.textBaseline='middle';
    ctx.fillStyle=chartLabelColor();
    meta.data.forEach((bar,i)=>{
      const raw=chart.data.datasets[0].data[i];
      if(raw==null) return;
      ctx.fillText(`${Number(raw).toFixed(1)}兆`, bar.x+6, bar.y);
    });
    ctx.restore();
  }
});

// ─────────────────────────────────────────
// B-2: 比較モード（期間比較チャート）
// ─────────────────────────────────────────
let _compMode=false, _compChart=null;
function toggleCompMode(){
  _compMode=!_compMode;
  const pill=document.getElementById('compModePill');
  const sel=document.getElementById('compYmSel');
  const card=document.getElementById('compCard');
  if(pill) pill.classList.toggle('pt-active',_compMode);
  if(sel) sel.style.display=_compMode?'':'none';
  if(card) card.style.display=_compMode?'':'none';
  if(_compMode){
    _populateCompYmSel();
    renderCompChart();
  } else {
    if(_compChart){_compChart.destroy();_compChart=null;}
  }
}
function _populateCompYmSel(){
  const sel=document.getElementById('compYmSel');
  if(!sel||sel.options.length>1) return;
  const yyyymms=MONTHS.map(v=>v.replace('/','')).slice().reverse();
  yyyymms.forEach(v=>{
    const o=document.createElement('option');
    o.value=v;o.textContent=v.slice(0,4)+'年'+v.slice(4,6)+'月';
    sel.appendChild(o);
  });
  if(yyyymms.length>1) sel.value=yyyymms[1];
}
function renderCompChart(){
  const curYm=document.getElementById('ymSel')?.value;
  const cmpYm=document.getElementById('compYmSel')?.value;
  if(!curYm||!cmpYm) return;
  const curSrc=DASHBOARD_DATA?.sectors_history?.[curYm]||SAMPLE_SECTORS_HISTORY[curYm]||SECTORS;
  const cmpSrc=DASHBOARD_DATA?.sectors_history?.[cmpYm]||SAMPLE_SECTORS_HISTORY[cmpYm]||SECTORS;
  const labels=curSrc.map(s=>s.n);
  const curPbr=curSrc.map(s=>s.pbr??null);
  const cmpPbr=labels.map(n=>cmpSrc.find(s=>s.n===n)?.pbr??null);
  const meta=document.getElementById('compMeta');
  const cy=curYm.slice(0,4)+'/'+curYm.slice(4,6);
  const cm=cmpYm.slice(0,4)+'/'+cmpYm.slice(4,6);
  if(meta) meta.textContent=`${cy} vs ${cm}`;
  const el=document.getElementById('compC');
  if(!el) return;
  if(_compChart){_compChart.destroy();_compChart=null;}
  _compChart=new Chart(el,{
    type:'bar',
    data:{labels,datasets:[
      {label:cy,data:curPbr,backgroundColor:'rgba(91,141,246,.75)',borderRadius:3},
      {label:cm,data:cmpPbr,backgroundColor:'rgba(245,166,35,.6)',borderRadius:3}
    ]},
    options:{...GC,indexAxis:'y',
      plugins:{legend:{display:true,labels:{color:chartLabelColor(),font:{size:10}}},
        tooltip:{callbacks:{label:c=>ttLabel(c.dataset.label,c.parsed.x,'x',2)}},
        emptyState:{display:true,text:'比較対象データなし'}},
      scales:{
        x:{ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'x'},grid:{color:chartGridColor()},min:0},
        y:{ticks:{color:chartLabelColor(),font:{size:9}},grid:{display:false}}
      }}
  });
}

// ─────────────────────────────────────────
// B-3: C/D 上位業種内訳
// ─────────────────────────────────────────
function _renderCdTopSectors(src){
  const el=document.getElementById('cdTopSectors');
  if(!el||!src) return;
  const cTop=[...src].filter(s=>s.cat==='C').sort((a,b)=>b.cap-a.cap).slice(0,3).map(s=>s.n).join('・');
  const dTop=[...src].filter(s=>s.cat==='D').sort((a,b)=>b.cap-a.cap).slice(0,3).map(s=>s.n).join('・');
  el.innerHTML=`<span style="color:var(--amber)">C: ${cTop||'–'}</span>　<span style="color:var(--green)">D: ${dTop||'–'}</span>`;
}

// ─────────────────────────────────────────
// B-4: 散布図クリック → 詳細ダイアログ
// ─────────────────────────────────────────
let _dlgSector=null;
function showSectorDetail(s){
  if(!s) return;
  _dlgSector=s;
  const sig=signal(s);
  document.getElementById('dlgTitle').innerHTML=`${s.n} <span class="chip" style="background:${CAT_COL[s.cat]}22;color:${CAT_COL[s.cat]};font-size:10px">${CAT_LBL[s.cat]}</span>`;
  document.getElementById('dlgPbr').innerHTML=s.pbr!=null?`${s.pbr.toFixed(2)}<span style="font-size:11px;color:var(--muted)">x</span>`:'–';
  document.getElementById('dlgPer').innerHTML=s.per!=null?`${s.per.toFixed(1)}<span style="font-size:11px;color:var(--muted)">x</span>`:'–';
  document.getElementById('dlgCap').innerHTML=s.cap!=null?`${s.cap.toFixed(1)}<span style="font-size:11px;color:var(--muted)">兆</span>`:'–';
  document.getElementById('dlgDy').innerHTML=s.dy!=null?`${s.dy.toFixed(1)}<span style="font-size:11px;color:var(--muted)">%</span>`:'–';
  // PBR 推移スパークライン
  const idx=SECTORS.findIndex(x=>x.n===s.n);
  const _pbr1m=DASHBOARD_DATA?.pbr1||SAMPLE_PBR1;
  const pbrHistory=_pbr1m.matrix?.[idx]||null;
  document.getElementById('dlgSparkline').innerHTML=pbrHistory
    ?_sparkSvg(pbrHistory,'var(--accent)',180,24)
    :'<span style="font-size:10px;color:var(--muted)">（実データ接続時に表示）</span>';
  document.getElementById('dlgSignal').innerHTML=`<span class="chip ${sig.cls}">${sig.txt||'–'}</span>`;
  document.getElementById('sectorDlg').showModal();
}
function dlgToNote(){
  if(!_dlgSector) return;
  if(typeof _requireMemberNotes==='function' && !_requireMemberNotes('メモ追加')) return;
  document.getElementById('sectorDlg').close();
  addToNote(_dlgSector.n,_dlgSector.pbr||0,_dlgSector.chg||0);
}

// ─────────────────────────────────────────
// B-8: メモのピン留め
// ─────────────────────────────────────────
function pinNote(i){
  if(typeof _requireMemberNotes==='function' && !_requireMemberNotes('メモのピン留め')) return;
  notes[i]._pinned=!notes[i]._pinned;
  persistNotes();
  renderNotes();
}

// ─────────────────────────────────────────
// B-9: PBR ミニヒートマップグリッド
// ─────────────────────────────────────────
function renderPbrHeatGrid(src){
  const el=document.getElementById('pbrHeatGrid');
  if(!el||!src||!src.length) return;
  const pbrs=src.map(s=>s.pbr).filter(v=>v!=null);
  if(!pbrs.length) return;
  const mn=Math.min(...pbrs),mx=Math.max(...pbrs),rng=mx-mn||0.001;
  el.innerHTML=src.map(s=>{
    const t=s.pbr!=null?(s.pbr-mn)/rng:0.5;
    const r=Math.round(t*224+(1-t)*91);
    const g=Math.round(t*84+(1-t)*141);
    const b2=Math.round(t*84+(1-t)*246);
    const chgColor=s.chg>0?'var(--green)':s.chg<0?'var(--red)':'var(--muted)';
    return `<div style="background:rgba(${r},${g},${b2},.18);border:1px solid rgba(${r},${g},${b2},.4);border-radius:5px;padding:5px 8px;cursor:pointer" onclick="showSectorDetail(SECTORS.find(x=>x.n==='${s.n}'))" title="${s.n}">
      <div style="color:var(--muted);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.n}</div>
      <div style="font-family:var(--mono);font-weight:500;font-size:11px;color:var(--text)">${s.pbr!=null?s.pbr.toFixed(1)+'x':'–'}</div>
      <div style="font-size:9px;color:${chgColor}">${s.chg>0?'▲':s.chg<0?'▼':'±'}${Math.abs(s.chg).toFixed(1)}</div>
    </div>`;
  }).join('');
}
function renderPlotlyOverview(){
  renderPlotlyChart('trendC',[
    {type:'scatter',mode:'lines+markers',name:'加重PBR',x:MONTHS,y:PBR_TS,line:{color:'#5b8df6',width:2},marker:{size:5}}
  ],{
    xaxis:{title:''},
    yaxis:{title:'加重PBR（倍）',ticksuffix:'x'}
  });
}
function renderPlotlyValuation(){
  renderPlotlyChart('valTrendC',[
    {type:'scatter',mode:'lines+markers',name:'PBR',x:MONTHS,y:PBR_TS,line:{color:'#5b8df6',width:2},marker:{size:5},yaxis:'y'},
    {type:'scatter',mode:'lines+markers',name:'PER',x:MONTHS,y:PER_TS,line:{color:'#f5a623',width:2},marker:{size:5},yaxis:'y2'}
  ],{
    yaxis:{title:'PBR（倍）',ticksuffix:'x'},
    yaxis2:{title:'PER（倍）',ticksuffix:'x',overlaying:'y',side:'right',showgrid:false,tickfont:{color:'#f5a623',size:10}},
    legend:{orientation:'h',yanchor:'bottom',y:1.02,x:0}
  });

  const byChg=[...SECTORS].sort((a,b)=>b.chg-a.chg);
  renderPlotlyChart('indRankC',[
    {type:'bar',orientation:'h',name:'PBR変化',x:byChg.map(s=>s.chg),y:byChg.map(s=>s.n),
      marker:{color:byChg.map(s=>s.chg>=0?'rgba(91,141,246,.75)':'rgba(224,84,84,.75)')},hovertemplate:'%{y}<br>PBR変化: %{x:.1f}x<extra></extra>'}
  ],{
    margin:{l:92,r:24,t:24,b:44},
    showlegend:false,
    xaxis:{title:'PBR変化（倍）',ticksuffix:'x'},
    yaxis:{autorange:'reversed'}
  });

  renderPlotlyChart('sizeC',[
    {type:'scatter',mode:'lines+markers',name:'大型',x:MONTHS,y:LG,line:{color:'#5b8df6',width:2}},
    {type:'scatter',mode:'lines+markers',name:'中型',x:MONTHS,y:MED,line:{color:'#29c99a',width:2}},
    {type:'scatter',mode:'lines+markers',name:'小型',x:MONTHS,y:SM,line:{color:'#f5a623',width:2}}
  ],{yaxis:{title:'PBR（倍）',ticksuffix:'x'}});

  renderPlotlyChart('mfgC',[
    {type:'scatter',mode:'lines+markers',name:'製造業',x:MONTHS,y:MFG,line:{color:'#5b8df6',width:2}},
    {type:'scatter',mode:'lines+markers',name:'非製造業',x:MONTHS,y:NMFG,line:{color:'#29c99a',width:2}}
  ],{
    yaxis:{title:'PBR（倍）',ticksuffix:'x'},
    shapes:[{type:'line',xref:'x',yref:'paper',x0:'2023/07',x1:'2023/07',y0:0,y1:1,line:{color:'#f5a623',width:1,dash:'dash'}}]
  });

  renderPlotlyChart('sprC',[
    {type:'bar',orientation:'h',name:'単純−加重スプレッド',x:SPR_DATA.map(s=>s.v),y:SPR_DATA.map(s=>s.n),
      marker:{color:SPR_DATA.map(s=>s.v>=0?'rgba(245,166,35,.75)':'rgba(91,141,246,.75)')},hovertemplate:'%{y}<br>スプレッド: %{x:.2f}x<extra></extra>'}
  ],{
    margin:{l:100,r:24,t:24,b:44},
    showlegend:false,
    xaxis:{title:'単純−加重 PBR スプレッド',ticksuffix:'x',tickformat:'.1f'},
    yaxis:{autorange:'reversed'}
  });
}
function renderPlotlyScatter(){
  renderPlotlyChart('scatterC',[
    {type:'scatter',mode:'markers',name:'業種',
      x:SECTORS.map(s=>s.pbr),
      y:SECTORS.map(s=>s.cap),
      text:SECTORS.map(s=>s.n),
      customdata:SECTORS.map(s=>[CAT_LBL[s.cat],s.cos,s.per]),
      marker:{
        size:SECTORS.map(s=>Math.max(12,Math.sqrt(s.cos)*3.8)),
        color:SECTORS.map(s=>CAT_COL[s.cat]),
        sizemode:'diameter',
        opacity:0.78,
        line:{width:1,color:'rgba(255,255,255,.18)'}
      },
      hovertemplate:'%{text}<br>PBR: %{x:.1f}x<br>時価総額: %{y:.1f}兆円<br>カテゴリ: %{customdata[0]}<br>上場社数: %{customdata[1]}<br>加重PER: %{customdata[2]}<extra></extra>'
    }
  ],{
    showlegend:false,
    xaxis:{title:'加重PBR（倍）',ticksuffix:'x',range:[0,4.5]},
    yaxis:{title:'時価総額（兆円）'}
  });
}
function renderPlotlyDecomp(){
  const decomp=DASHBOARD_DATA?.decomp;
  if(decomp&&decomp.length>0){
    const top=decomp.slice(0,16);
    renderPlotlyChart('decompC',[
      {type:'bar',orientation:'h',name:'純資産（BPS）成長',x:top.map(d=>d.na),y:top.map(d=>d.n),marker:{color:'rgba(41,201,154,.7)'}},
      {type:'bar',orientation:'h',name:'PBR倍率変化',x:top.map(d=>d.pbr),y:top.map(d=>d.n),marker:{color:'rgba(91,141,246,.7)'}}
    ],{
      barmode:'stack',
      margin:{l:100,r:24,t:24,b:44},
      xaxis:{title:'寄与度（率）',tickformat:'+.1%'},
      yaxis:{autorange:'reversed'}
    });
    return;
  }
  const dcData=[...SECTORS].sort((a,b)=>b.cap-a.cap).slice(0,16);
  renderPlotlyChart('decompC',[
    {type:'bar',orientation:'h',name:'純資産（BPS）成長',x:dcData.map(s=>+(s.chg*.62).toFixed(2)),y:dcData.map(s=>s.n),marker:{color:'rgba(41,201,154,.7)'}},
    {type:'bar',orientation:'h',name:'PBR倍率変化',x:dcData.map(s=>+(s.chg*.38).toFixed(2)),y:dcData.map(s=>s.n),marker:{color:'rgba(91,141,246,.7)'}}
  ],{
    barmode:'stack',
    margin:{l:100,r:24,t:24,b:44},
    xaxis:{title:'寄与度（倍）',ticksuffix:'x'},
    yaxis:{autorange:'reversed'}
  });
}
function renderPlotlyDecompCap(src){
  const sorted=[...src].sort((a,b)=>(b.cap??0)-(a.cap??0));
  renderPlotlyChart('decompCapC',[
    {type:'bar',orientation:'h',name:'時価総額',
      x:sorted.map(s=>s.cap??0),y:sorted.map(s=>s.n),
      marker:{color:sorted.map(s=>CAT_COL[s.cat]||'#6b7491'),opacity:0.82},
      hovertemplate:'%{y}<br>時価総額: %{x:.1f}兆円<extra></extra>'}
  ],{margin:{l:100,r:24,t:24,b:44},showlegend:false,
    xaxis:{title:'時価総額（兆円）'},yaxis:{autorange:'reversed'}});
}
function renderPlotlyDecompNav(src){
  const _nav=s=>(s.cap&&s.pbr&&s.pbr>0)?+(s.cap/s.pbr).toFixed(2):null;
  const sorted=[...src].filter(s=>_nav(s)!=null).sort((a,b)=>(_nav(b)??0)-(_nav(a)??0));
  renderPlotlyChart('decompNavC',[
    {type:'bar',orientation:'h',name:'純資産',
      x:sorted.map(s=>_nav(s)),y:sorted.map(s=>s.n),
      marker:{color:sorted.map(s=>CAT_COL[s.cat]||'#6b7491'),opacity:0.82},
      hovertemplate:'%{y}<br>純資産: %{x:.1f}兆円<extra></extra>'}
  ],{margin:{l:100,r:24,t:24,b:44},showlegend:false,
    xaxis:{title:'純資産（兆円）'},yaxis:{autorange:'reversed'}});
}
// 業種別 時価総額/純資産 通期折れ線グラフ（遅延初期化）
let _decompCapLineInited=false;
let _decompNavLineInited=false;

function _buildSectorTimeSeries(valueGetter){
  const sh=DASHBOARD_DATA?.sectors_history||SAMPLE_SECTORS_HISTORY||{};
  const months=Object.keys(sh).sort();
  if(!months.length) return {labels:[],datasets:[]};
  const labels=months.map(m=>m.slice(0,4)+'/'+m.slice(4,6));
  const latestKey=months[months.length-1];
  const allSectors=(sh[latestKey]||[]).map(s=>({n:s.n,cat:s.cat||SECTORS.find(x=>x.n===s.n)?.cat||'V'}));
  const datasets=allSectors.map(({n,cat})=>{
    const color=CAT_COL[cat]||'#6b7491';
    return{
      label:n,
      data:months.map(m=>{const e=sh[m]?.find(s=>s.n===n);const v=e?valueGetter(e):null;return v!=null?+v.toFixed(2):null;}),
      borderColor:color,backgroundColor:color+'18',
      fill:false,tension:.3,pointRadius:0,borderWidth:1.5,
    };
  });
  return{labels,datasets};
}
function toggleAllLines(chartKey, btnId){
  const chart=charts[chartKey];
  if(!chart) return;
  const allVisible=chart.data.datasets.every((_,i)=>chart.isDatasetVisible(i));
  chart.data.datasets.forEach((_,i)=>chart.setDatasetVisibility(i,!allVisible));
  chart.update();
  if(chartKey==='heatLine' && typeof renderHeatLineLegend==='function') renderHeatLineLegend();
  const btn=document.getElementById(btnId);
  if(btn) btn.textContent=allVisible?'全て表示にする':'全て非表示にする';
}

function _lineChartOpts(chartText,yTitle){
  return{
    responsive:true,maintainAspectRatio:false,animation:false,spanGaps:true,
    plugins:{
      title:chartTitle(chartText),
      legend:{labels:{color:chartLabelColor(),font:{size:9},boxWidth:10,padding:6}},
      tooltip:{callbacks:{label:ctx=>ttLabel(ctx.dataset.label,ctx.parsed.y,'兆円',1)}},
      emptyState:{display:true,text:'表示できる時系列データがありません'}
    },
    scales:{
      x:{ticks:{color:chartTickColor(),font:{size:9},maxTicksLimit:12},grid:{color:chartGridColor()}},
      y:{title:{display:true,text:yTitle,color:chartTickColor(),font:{size:10}},ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'兆'},grid:{color:chartGridColor()}}
    }
  };
}
function renderDecompCapLine(){
  if(_decompCapLineInited) return;
  _decompCapLineInited=true;
  const{labels,datasets}=_buildSectorTimeSeries(s=>s.cap);
  const canvas=document.getElementById('decompCapLineC');
  if(!canvas) return;
  charts.decompCapLine=new Chart(canvas,{type:'line',data:{labels,datasets},options:_lineChartOpts('業種別 時価総額 推移','時価総額（兆円）')});
  _renderPlotlyDecompLine('decompCapLineC',datasets,labels,'時価総額（兆円）');
}
function renderDecompNavLine(){
  if(_decompNavLineInited) return;
  _decompNavLineInited=true;
  const _navGetter=s=>(s.cap&&s.pbr&&s.pbr>0)?s.cap/s.pbr:null;
  const{labels,datasets}=_buildSectorTimeSeries(_navGetter);
  const canvas=document.getElementById('decompNavLineC');
  if(!canvas) return;
  charts.decompNavLine=new Chart(canvas,{type:'line',data:{labels,datasets},options:_lineChartOpts('業種別 純資産 推移','純資産（兆円）')});
  _renderPlotlyDecompLine('decompNavLineC',datasets,labels,'純資産（兆円）');
}
function _renderPlotlyDecompLine(canvasId,datasets,labels,yTitle){
  renderPlotlyChart(canvasId,
    datasets.map(ds=>({
      type:'scatter',mode:'lines',name:ds.label,
      x:labels,y:ds.data,
      line:{color:ds.borderColor,width:1.5},
      hovertemplate:`%{fullData.name}<br>${yTitle.split('（')[0]}: %{y:.1f}兆円<extra></extra>`
    })),
    {title:{text:yTitle.split('（')[0]+' 推移',font:{size:10}},
      margin:{l:56,r:16,t:24,b:44},
      xaxis:{tickangle:0,nticks:12},
      yaxis:{title:yTitle},
      legend:{font:{size:9},orientation:'v',x:1.01,y:1}}
  );
}
function renderPlotlyEvent(ev){
  const pbr=[...ev.pbr].sort((a,b)=>b[1]-a[1]);
  const shr=[...ev.shr].sort((a,b)=>b[1]-a[1]);
  renderPlotlyChart('evBarC',[
    {type:'bar',orientation:'h',name:'PBR変化',x:pbr.map(x=>x[1]),y:pbr.map(x=>x[0]),
      marker:{color:pbr.map(x=>x[1]>=0?'rgba(91,141,246,.8)':'rgba(224,84,84,.8)')},hovertemplate:'%{y}<br>PBR変化: %{x:.1f}x<extra></extra>'}
  ],{
    margin:{l:88,r:24,t:24,b:44},
    showlegend:false,
    xaxis:{title:'PBR変化（倍）',ticksuffix:'x'},
    yaxis:{autorange:'reversed'}
  });
  renderPlotlyChart('evShareC',[
    {type:'bar',orientation:'h',name:'シェア変化',x:shr.map(x=>x[1]),y:shr.map(x=>x[0]),
      marker:{color:shr.map(x=>x[1]>=0?'rgba(41,201,154,.8)':'rgba(224,84,84,.8)')},hovertemplate:'%{y}<br>シェア変化: %{x:.1f}pp<extra></extra>'}
  ],{
    margin:{l:88,r:24,t:24,b:44},
    showlegend:false,
    xaxis:{title:'シェア変化（pp）',ticksuffix:'pp'},
    yaxis:{autorange:'reversed'}
  });
}
function renderPlotlyCycle(){
  const zBounds=typeof _zAxisBounds==='function' ? _zAxisBounds(Z_SCORES) : [-2.5,2.5];
  renderPlotlyChart('cyclePhaseC',[
    {type:'scatter',mode:'lines+markers',name:'CI一致指数',x:CYCLE_MONTHS,y:CI_COIN,line:{color:'#29c99a',width:2},yaxis:'y'},
    {type:'scatter',mode:'lines+markers',name:'政策金利',x:CYCLE_MONTHS,y:POL_RATE,line:{color:'#f5a623',width:2,dash:'dash'},yaxis:'y2'},
    {type:'scatter',mode:'lines+markers',name:'10年国債',x:CYCLE_MONTHS,y:JGB10Y,line:{color:'#9b7fe8',width:2,dash:'dot'},yaxis:'y2'}
  ],{
    yaxis:{title:'CI一致指数'},
    yaxis2:{title:'金利（%）',overlaying:'y',side:'right',showgrid:false,ticksuffix:'%'}
  });

  renderPlotlyChart('zscoreC',[
    {type:'bar',orientation:'h',name:'PBR乖離Zスコア',x:Z_SCORES.map(s=>s.z),y:Z_SCORES.map(s=>s.n),
      marker:{color:Z_SCORES.map(s=>s.z<-1?'rgba(91,141,246,.8)':s.z>1?'rgba(224,84,84,.8)':'rgba(107,116,145,.4)')},
      hovertemplate:'%{y}<br>Z=%{x:.2f}<extra></extra>'}
  ],{
    margin:{l:100,r:52,t:24,b:44},
    showlegend:false,
    xaxis:{title:'Zスコア',range:zBounds},
    yaxis:{autorange:'reversed'}
  });

  renderPlotlyChart('cdRatioC',[
    {type:'bar',name:'C/D相対強度',x:CYCLE_MONTHS,y:CD_RATIO,
      marker:{color:CD_RATIO.map(v=>v>1.0?'rgba(245,166,35,.75)':v<0?'rgba(41,201,154,.75)':'rgba(107,116,145,.4)')},
      hovertemplate:'%{x}<br>C/D比率: %{y:.1f}<extra></extra>'}
  ],{
    showlegend:false,
    yaxis:{title:'C/D比率'}
  });
}
// ─── PER推移タブ ───
let _perChartsInited=false;
function renderPerCharts(){
  if(_perChartsInited) return;
  _perChartsInited=true;

  // 全体PER時系列
  charts.perTrend=mk('perTrendC',{type:'line',
    data:{labels:MONTHS,datasets:[lineDs('PER',PER_TS,accentAmber(),'y')]},
    options:{...GC,
      plugins:{
        title:chartTitle('市場全体 PER 時系列'),
        legend:{display:false},
        tooltip:{callbacks:{label:c=>ttLabel('PER',c.parsed.y,'x',1)}},
        emptyState:{display:true,text:'PER時系列データなし'}
      },
      scales:{
        x:{ticks:{color:chartTickColor(),font:{size:10}},grid:{color:chartGridColor()}},
        y:{title:{display:true,text:'PER（倍）',color:chartTickColor(),font:{size:10}},
           ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'x'},
           grid:{color:chartGridColor()}}
      }
    }
  });

  // 業種別PER時系列
  const{labels,datasets}=_buildSectorTimeSeries(s=>s.per);
  const perSectorCanvas=document.getElementById('perSectorC');
  if(perSectorCanvas){
    charts.perSector=new Chart(perSectorCanvas,{type:'line',
      data:{labels,datasets},
      options:{
        responsive:true,maintainAspectRatio:false,animation:false,spanGaps:true,
        plugins:{
          title:chartTitle('業種別 PER 推移'),
          legend:{labels:{color:chartLabelColor(),font:{size:9},boxWidth:10,padding:4}},
          tooltip:{callbacks:{label:ctx=>ttLabel(ctx.dataset.label,ctx.parsed.y,'x',1)}},
          emptyState:{display:true,text:'業種別PERデータなし'}
        },
        scales:{
          x:{ticks:{color:chartTickColor(),font:{size:9},maxTicksLimit:12},grid:{color:chartGridColor()}},
          y:{title:{display:true,text:'PER（倍）',color:chartTickColor(),font:{size:10}},
             ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'x'},
             grid:{color:chartGridColor()}}
        }
      }
    });
  }

  // Plotlyモード対応
  _renderPlotlyPerCharts(labels,datasets);
}
function _renderPlotlyPerCharts(labels,datasets){
  renderPlotlyChart('perTrendC',[
    {type:'scatter',mode:'lines+markers',name:'PER',x:MONTHS,y:PER_TS,
      line:{color:'#f5a623',width:2},marker:{size:5},
      hovertemplate:'%{x}<br>PER: %{y:.1f}x<extra></extra>'}
  ],{
    yaxis:{title:'PER（倍）',ticksuffix:'x'},
    margin:{l:56,r:16,t:24,b:44}
  });
  renderPlotlyChart('perSectorC',
    (datasets||[]).map(ds=>({
      type:'scatter',mode:'lines',name:ds.label,
      x:labels,y:ds.data,
      line:{color:ds.borderColor,width:1.5},
      hovertemplate:`%{fullData.name}<br>PER: %{y:.1f}x<extra></extra>`
    })),
    {title:{text:'業種別 PER 推移',font:{size:10}},
      margin:{l:56,r:16,t:24,b:44},
      xaxis:{tickangle:0,nticks:12},
      yaxis:{title:'PER（倍）',ticksuffix:'x'},
      legend:{font:{size:9},orientation:'v',x:1.01,y:1}}
  );
}

function renderAllPlotly(){
  renderPlotlyOverview();
  renderPlotlyValuation();
  renderPlotlyHeatmap();
  renderPlotlyScatter();
  renderPlotlyDecomp();
  renderPlotlyDecompCap(_curSectors());
  renderPlotlyDecompNav(_curSectors());
  renderPlotlyCycle();
  if(_perChartsInited){
    const{labels,datasets}=_buildSectorTimeSeries(s=>s.per);
    _renderPlotlyPerCharts(labels,datasets);
  }
}

// A-7: イベント縦線プラグイン（Chart.js）
Chart.register({
  id:'evAnnotations',
  afterDraw(chart){
    if(chartMode==='plotly') return;
    const evMonths=EVENTS.map(ev=>ev.period.split('→')[0]);
    const evColors=['#e05454','#f5a623','#5b8df6','#9b7fe8','#29c99a'];
    const {ctx,chartArea}=chart;
    if(!chartArea) return;
    const meta0=chart.getDatasetMeta(0);
    if(!meta0||!meta0.data) return;
    evMonths.forEach((ym,i)=>{
      const idx=MONTHS.indexOf(ym);
      if(idx<0||!meta0.data[idx]) return;
      const x=meta0.data[idx].x;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x,chartArea.top);
      ctx.lineTo(x,chartArea.bottom);
      ctx.strokeStyle=(evColors[i]||'#888')+'88';
      ctx.lineWidth=1;
      ctx.setLineDash([4,3]);
      ctx.stroke();
      ctx.restore();
    });
  }
});

function initCharts(){
  updateSampleModeBanner();
  renderSectList();
  // 初期ソートインジケーターを設定（業種コード昇順）
  const initTh=document.querySelector('#screenThead th[data-skey="code"]');
  if(initTh) initTh.textContent=initTh.textContent.replace(/ [▲▼]$/,'')+' ▲';
  renderScreen();
  renderHeatmap();

  // trend (overview)
  charts.trend=mk('trendC',{type:'line',data:{labels:MONTHS,datasets:[lineDs('加重PBR',PBR_TS,'#5b8df6')]},
    options:{...GC,
      plugins:{title:chartTitle('市場全体 加重PBR推移'),legend:{display:false},tooltip:{callbacks:{label:c=>ttLabel('市場全体 加重PBR',c.parsed.y,'x',2)}},emptyState:{display:true,text:'市場全体PBRデータなし'}},
      scales:{x:{ticks:{color:chartTickColor(),font:{size:10}},grid:{color:chartGridColor()}},
      y:{title:{display:true,text:'加重PBR（倍）',color:chartTickColor(),font:{size:10}},ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'x'},grid:{color:chartGridColor()}}}}});

  // val trend
  charts.valTrend=mk('valTrendC',{type:'line',data:{labels:MONTHS,datasets:[
    lineDs('PBR',PBR_TS,'#5b8df6','y'),lineDs('PER',PER_TS,'#f5a623','y2')]},
    options:{...GC,plugins:{
      legend:{display:true,labels:{color:chartLabelColor(),font:{size:10},boxWidth:10,padding:8}},
      tooltip:{callbacks:{label:c=>ttLabel(c.dataset.label,c.parsed.y,'x',c.dataset.label==='PER'?1:2)}},
      emptyState:{display:true,text:'PBR/PER時系列データなし'}
    },scales:{
      x:{ticks:{color:chartTickColor(),font:{size:10}},grid:{color:chartGridColor()}},
      y:{title:{display:true,text:'PBR（倍）',color:accentBlue(),font:{size:10}},ticks:{color:accentBlue(),font:{size:10},callback:v=>v+'x'},grid:{color:chartGridColor()},position:'left'},
      y2:{title:{display:true,text:'PER（倍）',color:accentAmber(),font:{size:10}},ticks:{color:accentAmber(),font:{size:10},callback:v=>v+'x'},grid:{display:false},position:'right'}}}});

  // ind rank
  const byChg=[...SECTORS].sort((a,b)=>b.chg-a.chg);
  charts.indRank=mk('indRankC',{type:'bar',
    data:{labels:byChg.map(s=>s.n),datasets:[{label:'PBR変化',data:byChg.map(s=>s.chg),
      backgroundColor:byChg.map(s=>s.chg>=0?'rgba(91,141,246,.75)':'rgba(224,84,84,.75)'),borderRadius:3}]},
    options:{indexAxis:'y',...GC,plugins:{title:chartTitle('業種別 PBR変化率ランキング'),legend:{display:false},tooltip:{callbacks:{label:c=>ttLabel(c.label,c.parsed.x,'x',2)}},emptyState:{display:true,text:'ランキングデータなし'}},
      scales:{x:{title:{display:true,text:'PBR変化（倍）',color:chartTickColor(),font:{size:10}},ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'x'},grid:{color:chartGridColor()}},
        y:{ticks:{color:chartLabelColor(),font:{size:9}},grid:{display:false}}}}});

  // size
  charts.size=mk('sizeC',{type:'line',data:{labels:MONTHS,datasets:[
    lineDs('大型',LG,'#5b8df6'),lineDs('中型',MED,'#29c99a'),lineDs('小型',SM,'#f5a623')]},
    options:{...GC,plugins:{title:chartTitle('規模別 PBR推移'),tooltip:{callbacks:{label:c=>ttLabel(c.dataset.label,c.parsed.y,'x',2)}},emptyState:{display:true,text:'規模別PBRデータなし'}},scales:{x:{ticks:{color:chartTickColor(),font:{size:10}},grid:{color:chartGridColor()}},
      y:{title:{display:true,text:'PBR（倍）',color:chartTickColor(),font:{size:10}},ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'x'},grid:{color:chartGridColor()}}}}});

  // mfg
  charts.mfg=mk('mfgC',{type:'line',data:{labels:MONTHS,datasets:[
    lineDs('製造業',MFG,'#5b8df6'),lineDs('非製造業',NMFG,'#29c99a')]},
    options:{...GC,plugins:{title:chartTitle('製造業 / 非製造業 比較'),tooltip:{callbacks:{label:c=>ttLabel(c.dataset.label,c.parsed.y,'x',2)}},emptyState:{display:true,text:'製造業比較データなし'}},scales:{x:{ticks:{color:chartTickColor(),font:{size:10}},grid:{color:chartGridColor()}},
      y:{title:{display:true,text:'PBR（倍）',color:chartTickColor(),font:{size:10}},ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'x'},grid:{color:chartGridColor()}}}}});

  // spread — SPR_DATA（定数化済み、randomなし）
  charts.spr=mk('sprC',{type:'bar',
    data:{labels:SPR_DATA.map(s=>s.n),datasets:[{label:'単純−加重スプレッド',data:SPR_DATA.map(s=>s.v),
      backgroundColor:SPR_DATA.map(s=>s.v>=0?'rgba(245,166,35,.7)':'rgba(91,141,246,.7)'),borderRadius:3}]},
    options:{indexAxis:'y',...GC,plugins:{title:chartTitle('単純 / 加重 スプレッド'),legend:{display:false},tooltip:{callbacks:{label:c=>ttLabel(c.label,c.parsed.x,'x',2)}},emptyState:{display:true,text:'スプレッドデータなし'}},
      scales:{x:{title:{display:true,text:'単純−加重 PBR スプレッド',color:chartTickColor(),font:{size:10}},ticks:{color:chartTickColor(),font:{size:10},callback:v=>Number(v).toFixed(1)+'x'},grid:{color:chartGridColor()}},
        y:{ticks:{color:chartLabelColor(),font:{size:9}},grid:{display:false}}}}});

  // scatter (cap×pbr)
  charts.scatter=mk('scatterC',{type:'bubble',
    data:{datasets:[{label:'',data:SECTORS.map(s=>({x:s.pbr,y:s.cap,r:Math.sqrt(s.cos)*1.1,sector:s.n})),
        backgroundColor:SECTORS.map(s=>CAT_COL[s.cat]+'bb'),borderColor:SECTORS.map(s=>CAT_COL[s.cat]),borderWidth:1}]},
      options:{...GC,
        onHover:(e,elements)=>{e.native.target.style.cursor=elements.length?'pointer':'default';},
        onClick:(e,elements)=>{if(elements.length)showSectorDetail(_curSectors()[elements[0].index]);},
        plugins:{title:chartTitle('時価総額 × PBR'),legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw.sector}: PBR ${fmtNum(c.raw.x,2)}x / 時価総額 ${fmtNum(c.raw.y,1)}兆円`}},emptyState:{display:true,text:'散布図データなし'}},
      scales:{x:{title:{display:true,text:'加重PBR（倍）',color:chartTickColor(),font:{size:10}},
          ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'x'},grid:{color:chartGridColor()},min:0,max:4.5},
        y:{title:{display:true,text:'時価総額（兆円）',color:chartTickColor(),font:{size:10}},
          ticks:{color:chartTickColor(),font:{size:10}},grid:{color:chartGridColor()}}}}});

  // C-1: scatter (roe×pbr)
  const _roe=s=>s.roe!==undefined?s.roe:(s.per?+(s.pbr/s.per*100).toFixed(1):null);
  window._roe=_roe;
  const _roeData=src=>{const arr=src||_curSectors();return arr.filter(s=>_roe(s)!=null).map(s=>({x:_roe(s),y:s.pbr,r:Math.max(6,Math.sqrt((s.cap??1)*10)),sector:s.n}));};
  window._roeData=_roeData;
  charts.roe=mk('roeC',{type:'bubble',
      data:{datasets:[{label:'',data:_roeData(),
        backgroundColor:_curSectors().filter(s=>_roe(s)!=null).map(s=>CAT_COL[s.cat]+'bb'),
        borderColor:_curSectors().filter(s=>_roe(s)!=null).map(s=>CAT_COL[s.cat]),borderWidth:1}]},
      options:{...GC,
        onHover:(e,elements)=>{e.native.target.style.cursor=elements.length?'pointer':'default';},
        onClick:(e,elements)=>{if(elements.length){const d=_roeData();showSectorDetail(_curSectors().find(s=>s.n===d[elements[0].index]?.sector));}},
        plugins:{title:chartTitle('ROE × PBR'),legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw.sector}: ROE ${fmtNum(c.raw.x,1)}% / PBR ${fmtNum(c.raw.y,1)}x`}},emptyState:{display:true,text:'ROE散布図データなし'}},
      scales:{x:{title:{display:true,text:'ROE（%、理論値＝PBR÷PER×100）',color:chartTickColor(),font:{size:10}},
          ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'%'},grid:{color:chartGridColor()},min:0},
        y:{title:{display:true,text:'加重PBR（倍）',color:chartTickColor(),font:{size:10}},
          ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'x'},grid:{color:chartGridColor()},min:0}}}});

  // decompose — 実データ優先、なければ SAMPLE_DECOMP
  const dcSrc=(DASHBOARD_DATA?.decomp||SAMPLE_DECOMP).slice(0,16);
  const dcReal=!!(DASHBOARD_DATA?.decomp?.length);
  const dcLbl=dcSrc.map(d=>d.n);
  const dcNA=dcSrc.map(d=>d.na);
  const dcPBR=dcSrc.map(d=>d.pbr);
  const dcFmt=v=>Math.round(v*100)+'%';
  charts.decomp=mk('decompC',{type:'bar',
    data:{labels:dcLbl,datasets:[
      {label:'純資産（BPS）成長',data:dcNA,backgroundColor:'rgba(41,201,154,.7)',borderRadius:2,stack:'s'},
      {label:'PBR倍率変化',data:dcPBR,backgroundColor:'rgba(91,141,246,.7)',borderRadius:2,stack:'s'}]},
    options:{indexAxis:'y',...GC,
      plugins:{title:chartTitle('時価総額成長要因分解'),tooltip:{callbacks:{label:c=>ttLabel(c.dataset.label,c.parsed.x,dcReal?'%':'x',dcReal?0:2)}},emptyState:{display:true,text:'要因分解データなし'}},
      scales:{x:{title:{display:true,text:dcReal?'寄与度（%）':'寄与度（倍）',color:chartTickColor(),font:{size:10}},stacked:true,ticks:{color:chartTickColor(),font:{size:10},callback:dcFmt},grid:{color:chartGridColor()}},
        y:{stacked:true,ticks:{color:chartLabelColor(),font:{size:9}},grid:{display:false}}}}});

  // 業種別 時価総額
  const capSrc=[...SECTORS].sort((a,b)=>(b.cap??0)-(a.cap??0));
  charts.decompCap=mk('decompCapC',{type:'bar',
    data:{labels:capSrc.map(s=>s.n),datasets:[{
      label:'時価総額',data:capSrc.map(s=>s.cap??0),
      backgroundColor:capSrc.map(s=>(CAT_COL[s.cat]||'#6b7491')+'cc'),borderRadius:2}]},
    options:{indexAxis:'y',...GC,
      plugins:{title:chartTitle('業種別 時価総額'),legend:{display:false},tooltip:{callbacks:{label:ctx=>ttLabel(ctx.label,ctx.parsed.x,'兆円',1)}},emptyState:{display:true,text:'時価総額データなし'}},
      scales:{x:{title:{display:true,text:'時価総額（兆円）',color:chartTickColor(),font:{size:10}},ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'兆'},grid:{color:chartGridColor()}},
        y:{ticks:{color:chartLabelColor(),font:{size:9}},grid:{display:false}}}}});

  // 業種別 純資産（時価総額 ÷ PBR）
  const _nav=s=>(s.cap&&s.pbr&&s.pbr>0)?+(s.cap/s.pbr).toFixed(2):null;
  const navSrc=[...SECTORS].filter(s=>_nav(s)!=null).sort((a,b)=>(_nav(b)??0)-(_nav(a)??0));
  charts.decompNav=mk('decompNavC',{type:'bar',
    data:{labels:navSrc.map(s=>s.n),datasets:[{
      label:'純資産',data:navSrc.map(s=>_nav(s)),
      backgroundColor:navSrc.map(s=>(CAT_COL[s.cat]||'#6b7491')+'cc'),borderRadius:2}]},
    options:{indexAxis:'y',...GC,
      plugins:{title:chartTitle('業種別 純資産'),legend:{display:false},tooltip:{callbacks:{label:ctx=>ttLabel(ctx.label,ctx.parsed.x,'兆円',1)}},emptyState:{display:true,text:'純資産データなし'}},
      scales:{x:{title:{display:true,text:'純資産（兆円）',color:chartTickColor(),font:{size:10}},ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'兆'},grid:{color:chartGridColor()}},
        y:{ticks:{color:chartLabelColor(),font:{size:9}},grid:{display:false}}}}});

  selEv(0, document.querySelector('.ev.act'));
  renderAllPlotly();
  applyChartMode();
  updateOverviewKPI();
  if(DASHBOARD_DATA?.latest_yyyymm) _onYmDecomp(DASHBOARD_DATA.latest_yyyymm);
}


// ────── navigation ──────
let _cycleInited=false;
function goto(id,el,silent){
  if(id==='notes' && typeof _isMember==='function' && !_isMember()){
    if(typeof showMemberLogin==='function') showMemberLogin();
    return;
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('act'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('act'));
  document.getElementById('pg-'+id).classList.add('act');
  if(el) el.classList.add('act');
  else if(!silent){
    document.querySelectorAll('.nav-item').forEach(n=>{
      if(n.getAttribute('onclick')&&n.getAttribute('onclick').includes(`'${id}'`)) n.classList.add('act');
    });
  }
  if(id==='cycle'&&!_cycleInited){
    _cycleInited=true;
    _initCycleDom();
    initCycleCharts();
    if(typeof renderPhaseHistory==='function') renderPhaseHistory();
    renderPlotlyCycle();
    applyChartMode();
  }
  if(id==='pbr1'){
    if(typeof renderHeatmapChart==='function') renderHeatmapChart(true);
    if(typeof applyHeatmapMode==='function') applyHeatmapMode();
  }
  if(id==='eval') initStocks();
  if(id==='stocks') initStockList();
}
function swTab(pg,id,el){
  document.querySelectorAll(`#pg-${pg} .tab`).forEach(t=>t.classList.remove('act'));
  document.querySelectorAll(`#pg-${pg} .tp`).forEach(p=>p.classList.remove('act'));
  el.classList.add('act');
  document.getElementById(`${pg}-${id}`).classList.add('act');
}
function onYm(v){
  const ym=v.replace(/(\d{4})(\d{2})/,'$1/$2');
  document.getElementById('scYm').textContent=ym;
  _onYmKpi(v,ym);
  _onYmVline(ym);
  _onYmScatter(v,ym);
  _onYmDecomp(v);
  _onYmCycle(v);
  _flashYmLinked();
  if(typeof _compMode!=='undefined'&&_compMode) renderCompChart();
}
function _onYmDecomp(yyyymm){
  const dh=DASHBOARD_DATA?.decomp_history||SAMPLE_DECOMP_HISTORY;
  if(!dh) return;
  const entry=dh[yyyymm];
  if(!entry){
    const periodEl=document.getElementById('decompPeriod');
    const firstDh=Object.keys(dh).sort()[0];
    const hintYm=firstDh?`${firstDh.slice(0,4)}/${firstDh.slice(4,6)}以降`:'';
    if(periodEl) periodEl.innerHTML=`<span style="color:var(--muted);font-size:10px">データなし${hintYm?`（${hintYm}で選択）`:''}</span>`;
    return;
  }
  const top=entry.sectors.slice(0,16);
  const periodEl=document.getElementById('decompPeriod');
  if(periodEl) periodEl.textContent=`${entry.start}→${entry.end}`;
  if(charts.decomp){
    charts.decomp.data.labels=top.map(d=>d.n);
    charts.decomp.data.datasets[0].data=top.map(d=>d.na);
    charts.decomp.data.datasets[1].data=top.map(d=>d.pbr);
    charts.decomp.update();
  }
  renderPlotlyChart('decompC',[
    {type:'bar',orientation:'h',name:'純資産（BPS）成長',x:top.map(d=>d.na),y:top.map(d=>d.n),marker:{color:'rgba(41,201,154,.7)'}},
    {type:'bar',orientation:'h',name:'PBR倍率変化',x:top.map(d=>d.pbr),y:top.map(d=>d.n),marker:{color:'rgba(91,141,246,.7)'}}
  ],{barmode:'stack',margin:{l:100,r:24,t:24,b:44},
    xaxis:{title:'寄与度（率）',tickformat:'+.1%'},
    yaxis:{autorange:'reversed'}});
}
function _flashYmLinked(){
  const ids=['kpiRow','ov-trend-card'];
  // card要素はcard-titleのym-badge親を辿って取得
  document.querySelectorAll('.ym-badge').forEach(b=>{
    const card=b.closest('.card,.kpi-row');
    if(card) ids.push(card.id||null);
  });
  // スクリーニングカード（idなし）はclassで特定
  const screenCard=document.querySelector('#pg-screen .card');
  [
    document.getElementById('kpiRow'),
    document.getElementById('ov-trend-card'),
    screenCard,
    ...[...document.querySelectorAll('.ym-badge')].map(b=>b.closest('.card')).filter(Boolean)
  ].filter((el,i,a)=>el&&a.indexOf(el)===i).forEach(el=>{
    el.classList.remove('ym-flash');
    void el.offsetWidth; // reflow to restart animation
    el.classList.add('ym-flash');
    setTimeout(()=>el.classList.remove('ym-flash'),1100);
  });
}
function _sparkSvg(data,color,w=64,h=14){
  if(!data||data.length<2) return '';
  const d=data.filter(v=>v!=null).slice(-12);
  if(d.length<2) return '';
  const mn=Math.min(...d),mx=Math.max(...d),rng=mx-mn||0.001;
  const pts=d.map((v,i)=>`${(i/(d.length-1)*w).toFixed(1)},${(h-(v-mn)/rng*h).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
}
function _onYmKpi(yyyymm,ym){
  const idx=MONTHS.indexOf(ym);
  const el=document.querySelector('#pg-overview .kpi-row');
  if(!el) return;
  const kv=el.querySelectorAll('.kpi');
  const prevIdx=idx>0?idx-1:-1;
  if(idx!==-1){
    const pbr=PBR_TS[idx]??null;
    const per=PER_TS[idx]??null;
    const prevPbr=prevIdx>=0?(PBR_TS[prevIdx]??null):null;
    const pbrDiff=pbr!=null&&prevPbr!=null?pbr-prevPbr:null;
    const pbrBadge=pbrDiff!=null?`<span class="kpi-badge ${pbrDiff>0?'up':'dn'}">${pbrDiff>0?'▲':'▼'}${Math.abs(pbrDiff).toFixed(2)}x</span>`:'';
    if(kv[0]){
      kv[0].querySelector('.kpi-val').innerHTML=pbr!=null?`${pbr.toFixed(2)}<span style="font-size:12px;color:var(--muted)">x</span>${pbrBadge}`:'–';
      kv[0].querySelector('.kpi-sub').innerHTML=`<span class="fl">${ym}基準</span>`;
      const sp=kv[0].querySelector('.kpi-spark');
      if(sp) sp.innerHTML=_sparkSvg(PBR_TS.slice(0,idx+1),'var(--accent)');
    }
    const prevPer=prevIdx>=0?(PER_TS[prevIdx]??null):null;
    const perDiff=per!=null&&prevPer!=null?per-prevPer:null;
    const perBadge=perDiff!=null?`<span class="kpi-badge ${perDiff>0?'up':'dn'}">${perDiff>0?'▲':'▼'}${Math.abs(perDiff).toFixed(1)}x</span>`:'';
    if(kv[1]&&per!=null){
      kv[1].querySelector('.kpi-val').innerHTML=`${per.toFixed(1)}<span style="font-size:12px;color:var(--muted)">x</span>${perBadge}`;
      const sp=kv[1].querySelector('.kpi-spark');
      if(sp) sp.innerHTML=_sparkSvg(PER_TS.slice(0,idx+1),'var(--green)');
    }
    const metaEl=document.querySelector('#pg-overview .g2 .card:first-child .card-meta');
    if(metaEl) metaEl.textContent=ym;
  }
  const sh=DASHBOARD_DATA?.sectors_history?.[yyyymm]||SAMPLE_SECTORS_HISTORY[yyyymm]||null;
  if(!sh||!sh.length) return;
  const below1=sh.filter(s=>s.pbr!=null&&s.pbr<1.0).length;
  const totalCap=sh.reduce((a,s)=>a+(s.cap||0),0);
  const maxS=sh.reduce((m,s)=>(s.pbr||0)>(m.pbr||0)?s:m,sh[0]||{n:'',pbr:0});
  const prevYyyyMm=prevIdx>=0?MONTHS[prevIdx].replace('/',''):null;
  const prevSh=prevYyyyMm
    ? (DASHBOARD_DATA?.sectors_history?.[prevYyyyMm] || SAMPLE_SECTORS_HISTORY[prevYyyyMm] || null)
    : null;
  if(kv[2]){
    const prevBelow1=prevSh?prevSh.filter(s=>s.pbr!=null&&s.pbr<1.0).length:null;
    const belowDiff=prevBelow1!=null?below1-prevBelow1:null;
    const belowBadge=belowDiff!=null?`<span class="kpi-badge ${belowDiff>0?'dn':'up'}">${belowDiff>0?'▲':'▼'}${Math.abs(belowDiff)}</span>`:'';
    kv[2].querySelector('.kpi-val').innerHTML=`${below1}<span style="font-size:12px;color:var(--muted)">/${sh.length}</span>${belowBadge}`;
  }
  if(kv[3]){
    const capRound=Math.round(totalCap);
    const prevCap=prevSh?Math.round(prevSh.reduce((a,s)=>a+(s.cap||0),0)):null;
    const capDiff=prevCap!=null?capRound-prevCap:null;
    const capPct=capDiff!=null&&prevCap>0?capDiff/prevCap*100:null;
    const capBadge=capPct!=null?`<span class="kpi-badge ${capDiff>0?'up':'dn'}">${capDiff>0?'▲':'▼'}${Math.abs(capPct).toFixed(1)}%</span>`:'';
    kv[3].querySelector('.kpi-val').innerHTML=`${capRound}<span style="font-size:12px;color:var(--muted)">兆円</span>${capBadge}`;
  }
  if(kv[4]&&maxS.n){
    kv[4].querySelector('.kpi-val').innerHTML=`<span style="font-size:15px">${maxS.n}</span>`;
    kv[4].querySelector('.kpi-sub').innerHTML=`<span style="font-family:var(--mono);color:var(--purple)">${maxS.pbr!=null?maxS.pbr.toFixed(1):'–'}x</span>`;
  }
  document.getElementById('nb-below').textContent=below1;
  renderOverviewSignals();
  renderPbrHeatGrid(_activeSectors||SECTORS);
}
function _onYmVline(ym){
  const shape={type:'line',x0:ym,x1:ym,y0:0,y1:1,xref:'x',yref:'paper',
    line:{color:'rgba(255,200,50,.55)',width:1.5,dash:'dot'}};
  ['trendC','valTrendC','sizeC','mfgC','cyclePhaseC','cdRatioC','perTrendC'].forEach(id=>{
    const el=document.getElementById(id+'Plotly');
    if(el&&el.data) Plotly.relayout(el,{shapes:[shape]});
  });
}
function _onYmCycle(yyyymm){
  if(!_cycleInited) return;
  _updateMacroCards(yyyymm);
  const zs=_zScoresFor(yyyymm);
  renderCycleSectors(zs);
  renderCycleTheory(zs);
}
function _updateMacroCards(yyyymm){
  // yyyymm = "YYYYMM"、CYCLE_MONTHS は "YYYY/MM"
  const ymKey=yyyymm.slice(0,4)+'/'+yyyymm.slice(4,6);
  const idx=CYCLE_MONTHS.indexOf(ymKey);
  const _setEl=(id,html)=>{const e=document.getElementById(id);if(e)e.innerHTML=html;};
  const _dir=(v)=>v==null?'':v>0?'<span class="up">▲ 上昇</span>':'<span class="dn">▼ 低下</span>';

  if(idx<0){
    // 範囲外は最新値・最新フェーズ・最新シェア表示に戻す
    _activePhase=CURRENT_PHASE;
    const lm=_CYCLE_RAW.latest_macro||{};
    if(lm.ci_coin!=null) _setEl('mcCiCoin',(lm.ci_coin_mom!=null?(lm.ci_coin_mom>=0?'+':'')+lm.ci_coin_mom.toFixed(1):lm.ci_coin.toFixed(1))+'<span style="font-size:11px;color:var(--muted)"> pt</span>');
    if(lm.ci_leading!=null) _setEl('mcCiLead',(lm.ci_leading_mom!=null?(lm.ci_leading_mom>=0?'+':'')+lm.ci_leading_mom.toFixed(1):lm.ci_leading.toFixed(1))+'<span style="font-size:11px;color:var(--muted)"> pt</span>');
    if(lm.pol_rate!=null) _setEl('mcPolRate',lm.pol_rate.toFixed(2)+'<span style="font-size:11px;color:var(--muted)"> %</span>');
    if(lm.jgb_10y!=null){const per=(1/lm.jgb_10y*100).toFixed(1);_setEl('mcJgb',lm.jgb_10y.toFixed(2)+'<span style="font-size:11px;color:var(--muted)"> %</span>');_setEl('mcJgbSub','<span class="up">▲ PER理論値 '+per+'倍相当</span>');}
    _updateCdShareBar(null, null);
    return;
  }

  const ci=CI_COIN[idx], ciPrev=idx>0?CI_COIN[idx-1]:null;
  const ciMom=ci!=null&&ciPrev!=null?+(ci-ciPrev).toFixed(1):null;
  const lead=CI_LEADING[idx], leadPrev=idx>0?CI_LEADING[idx-1]:null;
  const leadMom=lead!=null&&leadPrev!=null?+(lead-leadPrev).toFixed(1):null;
  const rate=POL_RATE[idx], jgb=JGB10Y[idx];

  if(ci!=null){
    const disp=ciMom!=null?(ciMom>=0?'+':'')+ciMom.toFixed(1):ci.toFixed(1);
    _setEl('mcCiCoin',disp+'<span style="font-size:11px;color:var(--muted)"> pt</span>');
    _setEl('mcCiCoinSub',_dir(ciMom)+' '+ymKey+'時点');
  }
  if(lead!=null){
    const disp=leadMom!=null?(leadMom>=0?'+':'')+leadMom.toFixed(1):lead.toFixed(1);
    _setEl('mcCiLead',disp+'<span style="font-size:11px;color:var(--muted)"> pt</span>');
    _setEl('mcCiLeadSub',_dir(leadMom)+' '+ymKey+'時点');
  }
  if(rate!=null) _setEl('mcPolRate',rate.toFixed(2)+'<span style="font-size:11px;color:var(--muted)"> %</span>');
  if(jgb!=null){
    const per=(1/jgb*100).toFixed(1);
    _setEl('mcJgb',jgb.toFixed(2)+'<span style="font-size:11px;color:var(--muted)"> %</span>');
    _setEl('mcJgbSub','PER理論値 '+per+'倍相当　'+ymKey+'時点');
  }

  // フェーズバッジ・_activePhase も選択月に連動
  const ph=(_CYCLE_RAW.phase_history||[]).find(p=>p.month===ymKey);
  if(ph){
    _activePhase=ph.phase;
    const badge=document.getElementById('currentPhaseBadge');
    const _cls={'回復期':'phase-recovery','拡張期':'phase-expansion','後退前期':'phase-inflation','後退期':'phase-recession','新サイクル回復期':'phase-recovery'};
    if(badge){badge.className='phase-badge '+(_cls[ph.phase]||'phase-pending');badge.textContent='● '+ph.phase;}
    const lbl=document.getElementById('phaseSrcLabel');
    if(lbl) lbl.textContent='景気フェーズ（'+ymKey+'）';
  }

  // C/D シェアバー を選択月に連動
  _updateCdShareBar(idx>=0?CD_SHARE_HISTORY[idx]:null, idx>=0?ymKey:null);
}
function _updateCdShareBar(share, ymKey){
  let cds=share||(ymKey==null?(_CYCLE_RAW.cd_share||{}):null);
  if(!cds||cds.c_pct==null){
    const src=_curSectors();
    const totalCap=src.reduce((s,a)=>s+(a.cap||0),0);
    if(totalCap>0){
      const cCap=src.filter(s=>s.cat==='C').reduce((s,a)=>s+(a.cap||0),0);
      const dCap=src.filter(s=>s.cat==='D').reduce((s,a)=>s+(a.cap||0),0);
      cds={c_pct:+(cCap/totalCap*100).toFixed(1),d_pct:+(dCap/totalCap*100).toFixed(1)};
    } else return;
  }
  const total=cds.c_pct+cds.d_pct;
  const cW=total>0?Math.round(cds.c_pct/total*80):40;
  const dW=total>0?Math.round(cds.d_pct/total*80):20;
  document.getElementById('cdShareC').textContent='シクリカル '+cds.c_pct+'%';
  document.getElementById('cdShareD').textContent='ディフェンシブ '+cds.d_pct+'%';
  document.getElementById('cdShareBarC').style.width=cW+'%';
  document.getElementById('cdShareBarD').style.width=dW+'%';
  const lbl=document.getElementById('cdShareLabel');
  if(lbl) lbl.textContent='シクリカル/ディフェンシブ シェアバランス'+(ymKey?' ('+ymKey+')':cds.as_of?' ('+cds.as_of+')':'');
  _renderCdTopSectors(_curSectors());
}
function _onYmScatter(yyyymm,ym){
  const sh=DASHBOARD_DATA?.sectors_history?.[yyyymm]||SAMPLE_SECTORS_HISTORY[yyyymm]||null;
  _activeSectors=sh&&sh.length?sh:null;
  const src=_curSectors();

  // PBRがnullの月（mart データギャップ期間）はSECTORSからフォールバック
  const hasPbr=src.some(s=>s.pbr!=null);
  const pbrByName={};
  SECTORS.forEach(s=>{pbrByName[s.n]=s.pbr;});
  const _pbr=s=>s.pbr!=null?s.pbr:(pbrByName[s.n]??0);

  // バブルチャートのメタ表示（PBRがなければ注記）
  const scYmEl=document.getElementById('scYm');
  if(scYmEl){
    if(!hasPbr&&sh&&sh.length) scYmEl.innerHTML=`${ym}<span style="font-size:10px;color:var(--muted);margin-left:4px">(PBR: 最新値)</span>`;
    else scYmEl.textContent=ym;
  }

  // バブルチャート（Chart.js）
  if(charts.scatter){
    charts.scatter.data.datasets[0].data=src.map(s=>({x:_pbr(s),y:s.cap??0,r:Math.sqrt(s.cos??1)*1.1,sector:s.n}));
    charts.scatter.data.datasets[0].backgroundColor=src.map(s=>CAT_COL[s.cat]+'bb');
    charts.scatter.data.datasets[0].borderColor=src.map(s=>CAT_COL[s.cat]);
    charts.scatter.update();
  }
  // バブルチャート（Plotly）
  renderPlotlyChart('scatterC',[
    {type:'scatter',mode:'markers',name:'業種',
      x:src.map(s=>_pbr(s)),y:src.map(s=>s.cap),text:src.map(s=>s.n),
      customdata:src.map(s=>[CAT_LBL[s.cat],s.cos,s.per]),
      marker:{size:src.map(s=>Math.max(12,Math.sqrt(s.cos??1)*3.8)),color:src.map(s=>CAT_COL[s.cat]),
        sizemode:'diameter',opacity:0.78,line:{width:1,color:'rgba(255,255,255,.18)'}},
      hovertemplate:'%{text}<br>PBR: %{x:.1f}x<br>時価総額: %{y:.1f}兆円<br>カテゴリ: %{customdata[0]}<br>上場社数: %{customdata[1]}<br>加重PER: %{customdata[2]}<extra></extra>'}
  ],{showlegend:false,
    xaxis:{title:'加重PBR（倍）',ticksuffix:'x',range:[0,4.5]},
    yaxis:{title:'時価総額（兆円）'}});

  // C-1: ROE×PBR chart update
  if(charts.roe&&window._roeData&&window._roe){
    const filtSrc=src.filter(s=>window._roe(s)!=null);
    charts.roe.data.datasets[0].data=window._roeData(src);
    charts.roe.data.datasets[0].backgroundColor=filtSrc.map(s=>CAT_COL[s.cat]+'bb');
    charts.roe.data.datasets[0].borderColor=filtSrc.map(s=>CAT_COL[s.cat]);
    charts.roe.update();
  }
  const roeYmEl=document.getElementById('roeYm');
  if(roeYmEl) roeYmEl.textContent=ym;

  // 業種ランキング（Chart.js）
  if(charts.indRank){
    const byChg=[...src].sort((a,b)=>(b.chg??0)-(a.chg??0));
    charts.indRank.data.labels=byChg.map(s=>s.n);
    charts.indRank.data.datasets[0].data=byChg.map(s=>s.chg??0);
    charts.indRank.data.datasets[0].backgroundColor=byChg.map(s=>(s.chg??0)>=0?'rgba(91,141,246,.75)':'rgba(224,84,84,.75)');
    charts.indRank.update();
  }
  // 業種ランキング（Plotly）
  const byChgP=[...src].sort((a,b)=>(b.chg??0)-(a.chg??0));
  renderPlotlyChart('indRankC',[
    {type:'bar',orientation:'h',name:'PBR変化',x:byChgP.map(s=>s.chg??0),y:byChgP.map(s=>s.n),
      marker:{color:byChgP.map(s=>(s.chg??0)>=0?'rgba(91,141,246,.75)':'rgba(224,84,84,.75)')},
      hovertemplate:'%{y}<br>PBR変化: %{x:.1f}x<extra></extra>'}
  ],{margin:{l:92,r:24,t:24,b:44},showlegend:false,
    xaxis:{title:'PBR変化（倍）',ticksuffix:'x'},yaxis:{autorange:'reversed'}});

  // スプレッド（Chart.js）
  const sprD=_calcSprData(src);
  if(charts.spr){
    charts.spr.data.labels=sprD.map(s=>s.n);
    charts.spr.data.datasets[0].data=sprD.map(s=>s.v);
    charts.spr.data.datasets[0].backgroundColor=sprD.map(s=>s.v>=0?'rgba(245,166,35,.7)':'rgba(91,141,246,.7)');
    charts.spr.update();
  }
  // スプレッド（Plotly）
  renderPlotlyChart('sprC',[
    {type:'bar',orientation:'h',name:'単純−加重スプレッド',x:sprD.map(s=>s.v),y:sprD.map(s=>s.n),
      marker:{color:sprD.map(s=>s.v>=0?'rgba(245,166,35,.75)':'rgba(91,141,246,.75)')},
      hovertemplate:'%{y}<br>スプレッド: %{x:.2f}x<extra></extra>'}
  ],{margin:{l:100,r:24,t:24,b:44},showlegend:false,
    xaxis:{title:'単純−加重 PBR スプレッド',ticksuffix:'x',tickformat:'.1f'},yaxis:{autorange:'reversed'}});

  // 業種別 時価総額・純資産チャート（年月連動）
  const _nav2=s=>(s.cap&&s.pbr&&s.pbr>0)?+(s.cap/s.pbr).toFixed(2):null;
  const capSorted=[...src].sort((a,b)=>(b.cap??0)-(a.cap??0));
  const navSorted=[...src].filter(s=>_nav2(s)!=null).sort((a,b)=>(_nav2(b)??0)-(_nav2(a)??0));
  if(charts.decompCap){
    charts.decompCap.data.labels=capSorted.map(s=>s.n);
    charts.decompCap.data.datasets[0].data=capSorted.map(s=>s.cap??0);
    charts.decompCap.data.datasets[0].backgroundColor=capSorted.map(s=>(CAT_COL[s.cat]||'#6b7491')+'cc');
    charts.decompCap.update();
  }
  if(charts.decompNav){
    charts.decompNav.data.labels=navSorted.map(s=>s.n);
    charts.decompNav.data.datasets[0].data=navSorted.map(s=>_nav2(s));
    charts.decompNav.data.datasets[0].backgroundColor=navSorted.map(s=>(CAT_COL[s.cat]||'#6b7491')+'cc');
    charts.decompNav.update();
  }
  const capYmEl=document.getElementById('decompCapYm');
  const navYmEl=document.getElementById('decompNavYm');
  if(capYmEl) capYmEl.textContent=ym;
  if(navYmEl) navYmEl.textContent=ym;
  renderPlotlyDecompCap(capSorted);
  renderPlotlyDecompNav(navSorted);

  // スクリーニングテーブル・業種リスト
  renderScreen();
  renderSectList();
}


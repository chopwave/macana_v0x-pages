// ────── 景気循環データ（実データ優先、フォールバックはサンプル値）──────
const _CYCLE_RAW_BASE=DASHBOARD_DATA?.cycle||{};
const _CYCLE_RAW=(!_CYCLE_RAW_BASE.latest_macro&&_forceSample)?{
  latest_macro:{
    ci_coin:109.0,ci_coin_mom:0.9,ci_leading:112.0,ci_leading_mom:1.0,pol_rate:0.50,jgb_10y:1.35,pmi:51.2,as_of:'2025/07',
    as_of_by_series:{ci_coin:'2025/07',ci_leading:'2025/07',pol_rate:'2025/07',jgb_10y:'2025/07',pmi:'2025/07'}
  },
  cd_share:{c_pct:24.1,d_pct:23.7,as_of:'2025/07'},
  current_phase:'新サイクル回復期',
  ..._CYCLE_RAW_BASE
}:_CYCLE_RAW_BASE;
const CYCLE_MONTHS=_CYCLE_RAW.months?.length?_CYCLE_RAW.months:['2020/01','2020/07','2021/01','2021/07','2022/01','2022/07','2023/01','2023/07','2024/01','2024/07','2025/01','2025/07'];
const CI_COIN=_CYCLE_RAW.ci_coin?.length?_CYCLE_RAW.ci_coin:[98.2,97.1,99.4,101.8,103.2,104.1,102.8,104.5,105.9,107.2,108.1,109.0];
const CI_LEADING=_CYCLE_RAW.ci_leading?.length?_CYCLE_RAW.ci_leading:[99.8,97.5,101.2,103.5,104.8,103.2,102.0,105.5,107.5,109.8,111.0,112.0];
const POL_RATE=_CYCLE_RAW.pol_rate?.length?_CYCLE_RAW.pol_rate:[-0.1,-0.1,-0.1,-0.1,-0.1,-0.1,-0.1,0.0,0.1,0.25,0.5,0.5];
const JGB10Y=_CYCLE_RAW.jgb_10y?.length?_CYCLE_RAW.jgb_10y:[0.02,0.04,0.09,0.22,0.19,0.24,0.42,0.58,0.72,0.90,1.10,1.35];
const CD_RATIO=(_CYCLE_RAW.cd_ratio?.some(v=>v!=null))?_CYCLE_RAW.cd_ratio:[1.02,0.92,0.98,1.05,1.10,1.08,1.02,1.05,1.12,1.18,1.20,1.18];
const CD_SHARE_HISTORY=_CYCLE_RAW.cd_share_history?.length?_CYCLE_RAW.cd_share_history:CYCLE_MONTHS.map(()=>null);
// フェーズ帯: phase_history から動的生成（フォールバックは固定バンド）
const _PHASE_COLORS={'回復期':'rgba(41,201,154,.10)','拡張期':'rgba(91,141,246,.10)','後退前期':'rgba(245,166,35,.10)','後退期':'rgba(224,84,84,.10)','新サイクル回復期':'rgba(41,201,154,.12)'};
const PHASE_BANDS=(()=>{
  const ph=_CYCLE_RAW.phase_history||[];
  if(!ph.length) return [{s:0,e:2,phase:'回復期',col:'rgba(41,201,154,.10)'},{s:2,e:5,phase:'拡張期',col:'rgba(91,141,246,.10)'},{s:5,e:8,phase:'後退前期',col:'rgba(245,166,35,.10)'},{s:8,e:10,phase:'後退期',col:'rgba(224,84,84,.10)'},{s:10,e:12,phase:'新サイクル回復期',col:'rgba(41,201,154,.12)'}];
  const bands=[];
  let cur=ph[0].phase,start=0;
  for(let i=1;i<ph.length;i++){
    if(ph[i].phase!==cur){bands.push({s:start,e:i,phase:cur,col:_PHASE_COLORS[cur]||'rgba(107,116,145,.08)'});cur=ph[i].phase;start=i;}
  }
  bands.push({s:start,e:ph.length-1,phase:cur,col:_PHASE_COLORS[cur]||'rgba(107,116,145,.08)'});
  return bands;
})();
const PHASE_REC={
  '回復期':          {BUY:['G','V'],HOLD:['D'],SELL:['C']},
  '拡張期':          {BUY:['C','V'],HOLD:['G'],SELL:['D']},
  '後退前期':        {BUY:['V'],    HOLD:['C'],SELL:['G','D']},
  '後退期':          {BUY:['D'],    HOLD:['V'],SELL:['C','G']},
  '新サイクル回復期':{BUY:['G','V'],HOLD:['D'],SELL:['C']},
};
// 相場ステージ（金融相場/業績相場/逆金融相場/逆業績相場）
const PHASE_STAGE={
  '回復期':          {label:'金融相場',  col:'var(--green)'},
  '拡張期':          {label:'業績相場',  col:'var(--accent)'},
  '後退前期':        {label:'逆金融相場',col:'var(--amber)'},
  '後退期':          {label:'逆業績相場',col:'var(--red)'},
  '新サイクル回復期':{label:'金融相場',  col:'var(--green)'},
};
// フェーズ別マクロ環境チップ
const PHASE_ENV={
  '回復期':          ['金利低','インフレ低','景気↑'],
  '拡張期':          ['金利↑','インフレ↑','景気↑'],
  '後退前期':        ['金利高','インフレ高','景気↓'],
  '後退期':          ['金利高','インフレ低下','景気↓'],
  '新サイクル回復期':['金利正常化','インフレ安定','景気↑'],
};
const CURRENT_PHASE=_CYCLE_RAW.current_phase||'新サイクル回復期';
// 年月選択に連動して変わるアクティブフェーズ（phaseRec() が参照する）
let _activePhase=CURRENT_PHASE;

// ── cycle DOM 一括初期化（cycle タブ初回表示時に呼ぶ）──
function _initCycleDom(){
  // フェーズバッジ
  const badge=document.getElementById('currentPhaseBadge');
  const srcLbl=document.getElementById('phaseSrcLabel');
  const _cls={'回復期':'phase-recovery','拡張期':'phase-expansion','後退前期':'phase-inflation','後退期':'phase-recession','新サイクル回復期':'phase-recovery'};
  if(badge){badge.className='phase-badge '+(_cls[CURRENT_PHASE]||'phase-pending');badge.textContent='● '+CURRENT_PHASE;}
  if(srcLbl) srcLbl.textContent='現在の景気フェーズ（実データ）';

  // C-2: 景気フェーズ信頼スコア
  (function(){
    const ciLast2=CI_COIN.slice(-3);
    const ciTrend=ciLast2.length>=2?(ciLast2[ciLast2.length-1]-ciLast2[0]):0;
    const polRateLast=POL_RATE[POL_RATE.length-1]??0;
    const jgbLast=JGB10Y[JGB10Y.length-1]??0;
    // 各フェーズで期待される指標状態とのマッチ数 / 総チェック数
    const phaseChecks={
      '回復期':        [(ciTrend>0),(polRateLast<0.5),(jgbLast<1.0)],
      '拡張期':        [(ciTrend>0),(polRateLast>=0&&polRateLast<1.0),(jgbLast>=0.5)],
      '後退前期':      [(ciTrend<=0||ciTrend<0.5),(polRateLast>=0.5),(jgbLast>=1.0)],
      '後退期':        [(ciTrend<0),(polRateLast>0),(jgbLast>1.0)],
      '新サイクル回復期':[(ciTrend>0),(polRateLast<=0.5),(jgbLast<1.5)],
    };
    const checks=phaseChecks[CURRENT_PHASE]||[];
    const matched=checks.filter(Boolean).length;
    const score=checks.length?Math.round(matched/checks.length*100):50;
    const scoreColor=score>=70?'var(--green)':score>=40?'var(--amber)':'var(--red)';
    const scoreEl=document.getElementById('phaseScoreBadge');
    if(scoreEl){
      scoreEl.innerHTML=`信頼スコア <span style="font-family:var(--mono);font-size:13px;font-weight:600;color:${scoreColor}">${score}%</span><span style="font-size:9px;color:var(--hint);margin-left:4px">(${matched}/${checks.length}指標一致)</span>`;
    }
  })();

  // フェーズ説明文
  const _phDesc={
    '回復期':        'CI一致指数が上昇へ転換、政策金利は低位安定。<strong style="color:var(--green)">グロース・バリュー系が有利</strong>なフェーズ。',
    '拡張期':        'CI一致指数が上昇継続、PMI 50超、金利は横ばい。<strong style="color:var(--accent)">シクリカル・バリューが有利</strong>なフェーズ。',
    '後退前期':      'CI一致指数が高原付近、利上げ開始・エネルギー高。<strong style="color:var(--amber)">バリューのみ相対有利</strong>、グロース注意。',
    '後退期':        'CI一致指数が下降、PMI 50割れ、高金利継続。<strong style="color:var(--red)">ディフェンシブへシフト</strong>推奨。',
    '新サイクル回復期':'CI一致指数が再上昇、金利正常化済み。<strong style="color:var(--green)">グロース・バリュー系が有利</strong>なフェーズ。',
  };
  const phDesc=document.getElementById('phaseDesc');
  if(phDesc) phDesc.innerHTML=_phDesc[CURRENT_PHASE]||phDesc.innerHTML;
  const ciLast2=CI_COIN.slice(-3);
  const ciTrend=ciLast2.length>=2?(ciLast2[ciLast2.length-1]-ciLast2[0]):0;
  const polRateLast=POL_RATE[POL_RATE.length-1]??0;
  const jgbLast=JGB10Y[JGB10Y.length-1]??0;
  const ciMsg=ciTrend>0.4?`CI一致指数が直近で ${ciTrend.toFixed(1)}pt 上昇`:
    ciTrend<-0.2?`CI一致指数が直近で ${Math.abs(ciTrend).toFixed(1)}pt 低下`:
    'CI一致指数は横ばい圏';
  const polMsg=polRateLast>=0.5?`政策金利 ${polRateLast.toFixed(2)}% と引き締め寄り`:
    `政策金利 ${polRateLast.toFixed(2)}% でまだ低位圏`;
  const jgbMsg=jgbLast>=1.0?`10年国債 ${jgbLast.toFixed(2)}% と金利水準は高め`:
    `10年国債 ${jgbLast.toFixed(2)}% で長期金利は抑制的`;
  const phaseWhy=document.getElementById('phaseWhy');
  if(phaseWhy){
    phaseWhy.innerHTML=`<strong>判定根拠：</strong>${ciMsg}、${polMsg}、${jgbMsg}のため、現在は <strong>${CURRENT_PHASE}</strong> と判定しています。`;
  }

  // BUY/SELL バナー
  const recBP=document.getElementById('recBannerPhase');
  if(recBP) recBP.textContent='現フェーズ（'+CURRENT_PHASE+'）';
  const finalMeta=document.getElementById('finalPhaseMeta');
  if(finalMeta) finalMeta.textContent='現フェーズ: '+CURRENT_PHASE;
  // 推奨タブ: 相場ステージ + 環境チップ
  const recPhaseEnv=document.getElementById('recPhaseEnv');
  if(recPhaseEnv){
    const st=PHASE_STAGE[CURRENT_PHASE]||{label:'–',col:'var(--muted)'};
    const envChips=(PHASE_ENV[CURRENT_PHASE]||[]).map(t=>`<span class="chip" style="background:rgba(107,116,145,.12);color:var(--muted);font-size:10px">${t}</span>`).join('');
    recPhaseEnv.innerHTML=`<span style="font-size:11px;color:var(--muted);flex-shrink:0">相場ステージ</span><span class="chip" style="background:${st.col}22;color:${st.col};font-size:11px;padding:3px 12px;font-weight:600">${st.label}</span>${envChips}<span style="font-size:10px;color:var(--hint);margin-left:auto;flex-shrink:0">※株式は景気に3〜6ヶ月先行</span>`;
  }

  // マクロカード（実データ）
  const lm=_CYCLE_RAW.latest_macro||{};
  const lmAsOf=lm.as_of_by_series||{};
  const _setEl=(id,html)=>{const e=document.getElementById(id);if(e)e.innerHTML=html;};
  const _mom=(v)=>v==null?'–':((v>=0?'+':'')+v.toFixed(1)+' pt');
  const _dir=(v)=>v==null?'':v>0?'<span class="up">▲ 上昇</span>':'<span class="dn">▼ 低下</span>';
  const _latestSeriesAsOf=Object.values(lmAsOf).filter(Boolean).sort().slice(-1)[0]||null;
  const _ciAsOf=lmAsOf.ci_coin||lm.as_of||null;
  if(phaseWhy && _latestSeriesAsOf && _ciAsOf && _latestSeriesAsOf!==_ciAsOf){
    phaseWhy.innerHTML+=`<br><span style="color:var(--hint)">注: CI系の最新公表月は ${_ciAsOf}、一方で PMI・金利系は ${_latestSeriesAsOf} まで反映しています。</span>`;
  }
  if(lm.ci_coin!=null){
    _setEl('mcCiCoin',(lm.ci_coin_mom!=null?(lm.ci_coin_mom>=0?'+':'')+lm.ci_coin_mom.toFixed(1):lm.ci_coin.toFixed(1))+'<span style="font-size:11px;color:var(--muted)"> pt</span>');
    _setEl('mcCiCoinSub',_dir(lm.ci_coin_mom)+((lmAsOf.ci_coin||lm.as_of)?' '+(lmAsOf.ci_coin||lm.as_of)+'時点':''));
  }
  if(lm.ci_leading!=null){
    _setEl('mcCiLead',(lm.ci_leading_mom!=null?(lm.ci_leading_mom>=0?'+':'')+lm.ci_leading_mom.toFixed(1):lm.ci_leading.toFixed(1))+'<span style="font-size:11px;color:var(--muted)"> pt</span>');
    _setEl('mcCiLeadSub',_dir(lm.ci_leading_mom)+((lmAsOf.ci_leading||lm.as_of)?' '+(lmAsOf.ci_leading||lm.as_of)+'時点':''));
  }
  if(lm.pol_rate!=null){
    _setEl('mcPolRate',lm.pol_rate.toFixed(2)+'<span style="font-size:11px;color:var(--muted)"> %</span>');
    _setEl('mcPolRateSub','<span class="up">▲ 段階的利上げ継続</span>'+((lmAsOf.pol_rate||lm.as_of)?' '+(lmAsOf.pol_rate||lm.as_of)+'時点':''));
  }
  if(lm.jgb_10y!=null){
    const per=(1/lm.jgb_10y*100).toFixed(1);
    _setEl('mcJgb',lm.jgb_10y.toFixed(2)+'<span style="font-size:11px;color:var(--muted)"> %</span>');
    _setEl('mcJgbSub','<span class="up">▲ PER理論値 '+per+'倍相当</span>'+((lmAsOf.jgb_10y||lm.as_of)?' '+(lmAsOf.jgb_10y||lm.as_of)+'時点':''));
  }

  // C/D シェアバー（初期表示は最新月）
  _updateCdShareBar(null, null);

  // C/D シグナルリスト（phase_history から連続フェーズを集約）
  const ph=_CYCLE_RAW.phase_history||[];
  if(ph.length){
    const _phCol={'回復期':'var(--green)','拡張期':'var(--accent)','後退前期':'var(--amber)','後退期':'var(--red)','新サイクル回復期':'var(--green)'};
    const bands=[];
    let cur=ph[0],start=ph[0].month;
    for(let i=1;i<ph.length;i++){
      if(ph[i].phase!==cur.phase){bands.push({s:start,e:cur.month,phase:cur.phase});cur=ph[i];start=ph[i].month;}
    }
    bands.push({s:start,e:ph[ph.length-1].month,phase:cur.phase});
    const cdSig=document.getElementById('cdSignalList');
    if(cdSig) cdSig.innerHTML=bands.map(b=>{
      const col=_phCol[b.phase]||'var(--muted)';
      const sep=themeMode==='light'?'rgba(16,24,40,.06)':'rgba(255,255,255,.025)';
      return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid ${sep}">
        <span style="font-family:var(--mono);font-size:10px;color:var(--muted);width:130px;flex-shrink:0">${b.s}〜${b.e}</span>
        <span class="chip" style="background:${col}22;color:${col};border:1px solid ${col}44">${b.phase}</span>
      </div>`;
    }).join('');
  }else{
    const cdSig=document.getElementById('cdSignalList');
    if(cdSig) cdSig.innerHTML=`<div style="padding:18px 12px;text-align:center;color:var(--hint);font-size:11px;border:1px dashed var(--border2);border-radius:8px">フェーズシグナル履歴なし</div>`;
  }
}

// 業種別PBR乖離Zスコア（pbr1実データから計算、フォールバックは推定値）
const Z_SCORES=(()=>{
  const pbr1=DASHBOARD_DATA?.pbr1||SAMPLE_PBR1;
  if(pbr1?.sectors?.length&&pbr1?.matrix?.length){
    return pbr1.sectors.map((name,ri)=>{
      const s=SECTORS.find(x=>x.n===name)||{n:name,cat:'V',pbr:1.0};
      const vals=(pbr1.matrix[ri]||[]).filter(v=>v!=null);
      if(vals.length<3) return {n:name,cat:s.cat,pbr:s.pbr,z:0};
      const mean=vals.reduce((a,v)=>a+v,0)/vals.length;
      const std=Math.sqrt(vals.reduce((a,v)=>a+(v-mean)**2,0)/vals.length);
      const z=std>0?+((s.pbr-mean)/std).toFixed(2):0;
      return {n:name,cat:s.cat,pbr:s.pbr,z};
    }).sort((a,b)=>a.z-b.z);
  }
  const base={'G':0.3,'D':-0.2,'C':-0.8,'V':-1.1};
  return SECTORS.map(s=>({n:s.n,cat:s.cat,pbr:s.pbr,
    z:+(base[s.cat]+(s.pbr-1.2)*0.3).toFixed(2)})).sort((a,b)=>a.z-b.z);
})();

function phaseRec(cat){
  const r=PHASE_REC[_activePhase]||PHASE_REC[CURRENT_PHASE];
  if(r.BUY.includes(cat))  return 'BUY';
  if(r.SELL.includes(cat)) return 'SELL';
  return 'HOLD';
}
function phaseRecReason(cat){
  const label=CAT_LBL[cat]||'このカテゴリ';
  const rec=phaseRec(cat);
  if(rec==='BUY') return `${label} は現在フェーズ ${_activePhase} と相性が良く、相対的に追い風です。`;
  if(rec==='SELL') return `${label} は現在フェーズ ${_activePhase} では逆風になりやすく、慎重評価です。`;
  return `${label} は現在フェーズ ${_activePhase} では中立圏で、個別材料の確認が必要です。`;
}
function phaseRecDetail(sector,z){
  const catLabel=CAT_LBL[sector.cat]||'カテゴリ';
  const phaseText=phaseRecReason(sector.cat);
  const zText=z==null?'同フェーズ比較データは未取得です。':
    z<=-1?`同フェーズ比では Z=${fmtNum(z,2)} と割安側です。`:
    z>=1?`同フェーズ比では Z=${fmtNum(z,2)} と割高側です。`:
    `同フェーズ比では Z=${fmtNum(z,2)} で中立圏です。`;
  return `${catLabel}。${phaseText} ${zText}`;
}
function finalScore(s){
  const phase={'BUY':2,'HOLD':0,'SELL':-2}[phaseRec(s.cat)];
  const z=s.z!=null?-Math.round(Math.max(-1,Math.min(1,s.z))):0;
  const cd=(s.cat==='G'||s.cat==='V')?1:0; // 回復期ボーナス
  const total=phase+z+cd;
  return Math.max(-2,Math.min(2,total));
}
function scoreLabel(v){
  if(v>=2)  return {txt:'Strong BUY', cls:'signal-strong-buy'};
  if(v===1) return {txt:'BUY',        cls:'signal-buy'};
  if(v===0) return {txt:'HOLD',       cls:'signal-hold'};
  if(v===-1)return {txt:'SELL',       cls:'signal-sell'};
  return          {txt:'Strong SELL', cls:'signal-strong-sell'};
}

// 選択月のPBRを使ってZスコアを再計算（正規化は全期間固定）
function _zScoresFor(yyyymm){
  const pbr1=DASHBOARD_DATA?.pbr1||SAMPLE_PBR1;
  const sh=DASHBOARD_DATA?.sectors_history?.[yyyymm]||SAMPLE_SECTORS_HISTORY[yyyymm.replace('/','')];
  if(!pbr1?.sectors?.length||!sh) return Z_SCORES;
  return pbr1.sectors.map((name,ri)=>{
    const s=sh.find(x=>x.n===name)||{n:name,cat:'V',pbr:1.0};
    const vals=(pbr1.matrix[ri]||[]).filter(v=>v!=null);
    if(vals.length<3) return {n:name,cat:s.cat,pbr:s.pbr??1.0,z:0};
    const mean=vals.reduce((a,v)=>a+v,0)/vals.length;
    const std=Math.sqrt(vals.reduce((a,v)=>a+(v-mean)**2,0)/vals.length);
    const z=std>0?+((s.pbr-mean)/std).toFixed(2):0;
    return {n:name,cat:s.cat,pbr:s.pbr??1.0,z};
  }).sort((a,b)=>a.z-b.z);
}

function _zAxisBounds(zScores){
  const vals=(zScores||[]).map(s=>Math.abs(s?.z)).filter(Number.isFinite);
  const maxAbs=vals.length?Math.max(2.5,...vals):2.5;
  const pad=maxAbs<3?0.25:0.4;
  const bound=Math.ceil((maxAbs+pad)*2)/2;
  return [-bound,bound];
}

// BUY/HOLD/SELL・Zスコア・総合スコアを再描画（_curSectors()と任意のzScoresで動作）
function renderCycleSectors(zScores){
  const src=_curSectors();
  const zMap=new Map((zScores||[]).map(s=>[s.n,s]));
  const zBounds=_zAxisBounds(zScores);
  const recWhy=document.getElementById('cycleRecWhy');
  const phaseMap=PHASE_REC[_activePhase]||PHASE_REC[CURRENT_PHASE];
  if(recWhy){
    const buyCats=(phaseMap?.BUY||[]).map(c=>CAT_LBL[c]||c).join('・')||'–';
    const sellCats=(phaseMap?.SELL||[]).map(c=>CAT_LBL[c]||c).join('・')||'–';
    recWhy.innerHTML=`<strong>推奨の見方：</strong>${_activePhase} では <strong style="color:var(--green)">${buyCats}</strong> が追い風、<strong style="color:var(--red)">${sellCats}</strong> が逆風です。各行ではさらに同フェーズ比の Z スコアも加味しています。`;
  }
  // カード副題をフェーズ連動で更新
  const buyMeta=document.getElementById('recBuyMeta');
  const sellMeta=document.getElementById('recSellMeta');
  if(buyMeta) buyMeta.textContent=(phaseMap?.BUY||[]).map(c=>CAT_LBL[c]||c).join(' / ')+' カテゴリ';
  if(sellMeta) sellMeta.textContent=(phaseMap?.SELL||[]).map(c=>CAT_LBL[c]||c).join(' / ')+' カテゴリ';
  // ② BUY/HOLD/SELL推奨リスト
  const byRec={BUY:[],HOLD:[],SELL:[]};
  src.forEach(s=>{byRec[phaseRec(s.cat)].push(s);});
  const renderRecList=(elId,list,color)=>{
    const el=document.getElementById(elId);
    if(!el) return;
    el.innerHTML=list.map(s=>{
      const detail=phaseRecDetail(s,zMap.get(s.n)?.z);
      return `
      <div class="rec-row" title="${detail}">
        <span class="rec-name">${s.n}</span>
        <span class="rec-cat"><span class="chip" style="background:${CAT_COL[s.cat]}22;color:${CAT_COL[s.cat]}">${CAT_LBL[s.cat]}</span></span>
        <span class="rec-pbr" style="color:${color}">${s.pbr!=null?s.pbr.toFixed(1)+'x':'–'}</span>
        <span class="rec-detail">${detail}</span>
      </div>`;
    }).join('');
  };
  renderRecList('recBuyList',byRec.BUY,'var(--green)');
  renderRecList('recSellList',byRec.SELL,'var(--red)');
  const recBody=document.getElementById('recBody');
  if(recBody) recBody.innerHTML=src.map(s=>{
    const r=phaseRec(s.cat);
    const col=r==='BUY'?'var(--green)':r==='SELL'?'var(--red)':'var(--muted)';
    const z=zMap.get(s.n)?.z;
    const reason=phaseRecDetail(s,z);
    return `<tr title="${reason}">
      <td class="bold">${s.n}</td>
      <td><span class="chip" style="background:${CAT_COL[s.cat]}22;color:${CAT_COL[s.cat]}">${CAT_LBL[s.cat]}</span></td>
      <td style="font-family:var(--mono)">${s.pbr!=null?s.pbr.toFixed(1)+'x':'–'}</td>
      <td><span class="chip" style="font-size:10px;padding:1px 8px;border-radius:99px;${r==='BUY'?'background:rgba(41,201,154,.15);color:var(--green)':r==='SELL'?'background:rgba(224,84,84,.12);color:var(--red)':'background:rgba(107,116,145,.12);color:var(--muted)'}">${r}</span></td>
      <td style="color:var(--muted);font-size:10px;line-height:1.6;min-width:220px">${reason}</td>
    </tr>`;
  }).join('');
  // ③ Zスコアチャート更新
  if(charts.zscore){
    charts.zscore.data.labels=zScores.map(s=>s.n);
    charts.zscore.data.datasets[0].data=zScores.map(s=>s.z);
    charts.zscore.data.datasets[0].backgroundColor=zScores.map(s=>s.z<-1?'rgba(91,141,246,.8)':s.z>1?'rgba(224,84,84,.8)':'rgba(107,116,145,.4)');
    charts.zscore.options.plugins.tooltip.callbacks.label=c=>`Z=${c.parsed.x.toFixed(2)}　PBR:${zScores[c.dataIndex]?.pbr?.toFixed(1)||'?'}x`;
    charts.zscore.options.scales.x.min=zBounds[0];
    charts.zscore.options.scales.x.max=zBounds[1];
    charts.zscore.update();
    charts.zscore._zPbrData=zScores;
  }
  renderPlotlyChart('zscoreC',[
    {type:'bar',orientation:'h',name:'PBR乖離Zスコア',
      x:zScores.map(s=>s.z),y:zScores.map(s=>s.n),
      marker:{color:zScores.map(s=>s.z<-1?'rgba(91,141,246,.8)':s.z>1?'rgba(224,84,84,.8)':'rgba(107,116,145,.4)')},
      hovertemplate:'%{y}<br>Z=%{x:.2f}<extra></extra>'}
  ],{margin:{l:100,r:52,t:24,b:44},showlegend:false,
    xaxis:{title:'Zスコア',range:zBounds},yaxis:{autorange:'reversed'}});
  // ⑤ 総合スコアランキング
  const scored=src.map(s=>{
    const ze=zScores.find(z=>z.n===s.n);
    const sv={...s,z:ze?.z??0};
    return {...sv,total:finalScore(sv)};
  }).sort((a,b)=>b.total-a.total);
  const fsl=document.getElementById('finalSignalList');
  if(fsl) fsl.innerHTML=scored.map((s,i)=>{
    const {txt,cls}=scoreLabel(s.total);
    const barW=Math.min(100,(s.total+2)/4*100);
    const barCol=s.total>=1?'var(--green)':s.total<=-1?'var(--red)':'var(--muted)';
    return `<div class="rec-row" style="gap:10px">
      <span style="width:18px;font-family:var(--mono);font-size:10px;color:var(--muted);flex-shrink:0">${i+1}</span>
      <span class="rec-name">${s.n}</span>
      <span class="rec-cat"><span class="chip" style="background:${CAT_COL[s.cat]}22;color:${CAT_COL[s.cat]}">${CAT_LBL[s.cat]}</span></span>
      <span class="rec-pbr">${s.pbr!=null?s.pbr.toFixed(1)+'x':'–'}</span>
      <div class="bar-track" style="flex:1">
        <div class="bar-fill" style="width:${barW}%;background:${barCol}"></div>
      </div>
      <span style="width:22px;text-align:right;font-family:var(--mono);font-size:11px;color:${barCol}">${s.total>0?'+':''}${s.total}</span>
      <span class="chip ${cls}" style="padding:2px 9px;border-radius:99px;font-size:10px">${txt}</span>
    </div>`;
  }).join('');
}

function initCycleCharts(){
  // ① フェーズ判定チャート
  const phasePlugin={
    id:'phaseBands',
    beforeDraw(chart){
      const {ctx,chartArea,scales}=chart;
      if(!chartArea) return;
      PHASE_BANDS.forEach(b=>{
        const x0=scales.x.getPixelForValue(b.s);
        const x1=scales.x.getPixelForValue(b.e);
        ctx.fillStyle=b.col;
        ctx.fillRect(x0,chartArea.top,x1-x0,chartArea.bottom-chartArea.top);
      });
    }
  };
  const _y2DataMax=Math.max(...JGB10Y.filter(v=>v!=null),...POL_RATE.filter(v=>v!=null));
  const _y2Max=Math.max(2.0,Math.ceil((_y2DataMax+0.3)*10)/10);
  const _y2Min=Math.min(-0.3,...POL_RATE.filter(v=>v!=null));
  charts.cyclePhase=new Chart(document.getElementById('cyclePhaseC'),{
    type:'line',
    plugins:[phasePlugin],
    data:{labels:CYCLE_MONTHS,datasets:[
      {label:'CI一致指数',data:CI_COIN,borderColor:'#29c99a',backgroundColor:'rgba(41,201,154,.06)',
       fill:false,tension:.4,pointRadius:2,borderWidth:2,yAxisID:'y'},
      {label:'政策金利（%）',data:POL_RATE,borderColor:'#f5a623',
       fill:false,tension:.3,pointRadius:2,borderWidth:1.5,borderDash:[5,3],yAxisID:'y2'},
      {label:'10年国債（%）',data:JGB10Y,borderColor:'#9b7fe8',
       fill:false,tension:.3,pointRadius:2,borderWidth:1.5,borderDash:[3,3],yAxisID:'y2'},
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{
        title:chartTitle('景気フェーズ判定チャート'),
        legend:{labels:{color:chartTickColor(),font:{size:11},usePointStyle:true}},
        tooltip:{callbacks:{label:c=>ttLabel(c.dataset.label,c.parsed.y,c.dataset.yAxisID==='y2'?'%':'',c.dataset.yAxisID==='y2'?2:1)}},
        emptyState:{display:true,text:'景気循環データなし'}
      },
      scales:{
        x:{ticks:{color:chartTickColor(),font:{size:10}},grid:{color:chartGridColorSoft()}},
        y:{position:'left',ticks:{color:themeMode==='light' ? '#0f9f6e' : '#29c99a',font:{size:10}},
          grid:{color:chartGridColor()},title:{display:true,text:'CI一致指数',color:chartTickColor(),font:{size:10}}},
        y2:{position:'right',ticks:{color:accentAmber(),font:{size:10},callback:v=>v+'%'},
          grid:{display:false},min:_y2Min,max:_y2Max}
      }
    }
  });

  // ③ Zスコアチャート
  charts.zscore=new Chart(document.getElementById('zscoreC'),{
    type:'bar',
    data:{labels:Z_SCORES.map(s=>s.n),datasets:[{
      label:'PBR乖離Zスコア',
      data:Z_SCORES.map(s=>s.z),
      backgroundColor:Z_SCORES.map(s=>s.z<-1?'rgba(91,141,246,.8)':s.z>1?'rgba(224,84,84,.8)':'rgba(107,116,145,.4)'),
      borderRadius:3
    }]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      layout:{padding:{right:52}},
      plugins:{title:chartTitle('PBR乖離Zスコア'),legend:{display:false},
        tooltip:{callbacks:{label:c=>`Z=${fmtNum(c.parsed.x,2)} / PBR ${fmtNum(Z_SCORES[c.dataIndex].pbr,1)}x`}},
        emptyState:{display:true,text:'Zスコアデータなし'}},
      scales:{
        x:{ticks:{color:chartTickColor(),font:{size:10}},grid:{color:chartGridColor()},
          min:_zAxisBounds(Z_SCORES)[0],max:_zAxisBounds(Z_SCORES)[1]},
        y:{ticks:{color:chartLabelColor(),font:{size:9}},grid:{display:false}}
      }
    }
  });
  charts.zscore._zPbrData=Z_SCORES;

  // ④ C/Dシグナル
  charts.cdRatio=new Chart(document.getElementById('cdRatioC'),{
    type:'bar',
    data:{labels:CYCLE_MONTHS,datasets:[{
      label:'C/D相対強度',
      data:CD_RATIO,
      backgroundColor:CD_RATIO.map(v=>v>1.0?'rgba(245,166,35,.75)':v<0?'rgba(41,201,154,.75)':'rgba(107,116,145,.4)'),
      borderRadius:3
    }]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{title:chartTitle('C/D相対強度'),legend:{display:false},tooltip:{callbacks:{label:c=>ttLabel('C/D比率',c.parsed.y,'',2)}},emptyState:{display:true,text:'C/D比率データなし'}},
      scales:{
        x:{ticks:{color:chartTickColor(),font:{size:9}},grid:{display:false}},
        y:{ticks:{color:chartTickColor(),font:{size:10}},grid:{color:chartGridColor()},
          title:{display:true,text:'C/D比率',color:chartTickColor(),font:{size:10}}}
      }
    }
  });
  const cdSignalData=[
    {m:'2020/01〜2021/06',sig:'回復→拡張',col:'var(--accent)'},
    {m:'2021/07〜2022/06',sig:'拡張期シグナル',col:'var(--amber)'},
    {m:'2022/07〜2023/03',sig:'後退期シグナル',col:'var(--red)'},
    {m:'2023/04〜2025/07',sig:'ニュートラル→回復',col:'var(--green)'},
  ];
  document.getElementById('cdSignalList').innerHTML=cdSignalData.length
    ? cdSignalData.map(d=>`
    <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid ${themeMode==='light' ? 'rgba(16,24,40,.06)' : 'rgba(255,255,255,.025)'}">
      <span style="font-family:var(--mono);font-size:10px;color:var(--muted);width:130px;flex-shrink:0">${d.m}</span>
      <span class="chip" style="background:${d.col}22;color:${d.col};border:1px solid ${d.col}44">${d.sig}</span>
    </div>`).join('')
    : `<div style="padding:18px 12px;text-align:center;color:var(--hint);font-size:11px;border:1px dashed var(--border2);border-radius:8px">フェーズシグナル履歴なし</div>`;

  // ②③⑤ セクター依存レンダリング（年月連動対応）
  const initYm=document.getElementById('ymSel')?.value;
  renderCycleSectors(initYm?_zScoresFor(initYm):Z_SCORES);
  // ④ サイクル表タブ
  renderCycleTheory(initYm?_zScoresFor(initYm):Z_SCORES);
}

// ── サイクル表タブ: 4象限ハイライト + 業種BUY/HOLD表示（年月連動）──
function renderCycleTheory(zScores){
  const QUAD_MAP={
    '回復期':          'recovery',
    '拡張期':          'expansion',
    '後退前期':        'slowdown',
    '後退期':          'recession',
    '新サイクル回復期':'recovery',
  };
  const QUAD_PHASES={recovery:'回復期',expansion:'拡張期',slowdown:'後退前期',recession:'後退期'};
  const QUAD_COL={recovery:'var(--green)',expansion:'var(--accent)',slowdown:'var(--amber)',recession:'var(--red)'};
  const phase=_activePhase||CURRENT_PHASE;
  const activeId=QUAD_MAP[phase];

  // 象限ハイライト
  const bgColors={recovery:'rgba(41,201,154,.06)',expansion:'rgba(91,141,246,.06)',slowdown:'rgba(245,166,35,.06)',recession:'rgba(224,84,84,.06)'};
  ['recovery','expansion','slowdown','recession'].forEach(id=>{
    const el=document.getElementById('cquad-'+id);
    if(!el) return;
    el.classList.toggle('cq-active',id===activeId);
    el.style.background=id===activeId?'':bgColors[id];
  });
  const st=PHASE_STAGE[phase]||{label:'–',col:'var(--muted)'};
  const meta=document.getElementById('theoryCurPhase');
  if(meta) meta.innerHTML=`現在: <span style="color:${st.col};font-weight:600">${phase}</span>（${st.label}）`;

  // 業種リスト（年月連動）
  const sectors=_curSectors();
  const zMap=new Map((zScores||Z_SCORES).map(s=>[s.n,s]));
  Object.entries(QUAD_PHASES).forEach(([quadId,qPhase])=>{
    const el=document.getElementById('cqsec-'+quadId);
    if(!el) return;
    const rec=PHASE_REC[qPhase]||{BUY:[],HOLD:[],SELL:[]};
    // BUYカテゴリ業種のみ表示（最大8件、Zスコア昇順）
    const items=sectors.map(s=>{
      const z=zMap.get(s.n)?.z??null;
      if(!rec.BUY.includes(s.cat)) return null;
      let sig,col;
      if(z!=null&&z<=-1.0){sig='強BUY';col='var(--green)';}
      else if(z!=null&&z>=1.0){sig='HOLD'; col='var(--muted)';}
      else{sig='BUY';col=QUAD_COL[quadId]||'var(--accent)';}
      return{n:s.n,pbr:s.pbr,z,sig,col};
    }).filter(Boolean).sort((a,b)=>(a.z??99)-(b.z??99)).slice(0,8);
    if(!items.length){el.innerHTML='<span style="font-size:10px;color:var(--hint)">データなし</span>';return;}
    el.innerHTML=items.map(s=>`<div class="cquad-sec-row">
      <span class="cquad-sec-sig" style="background:${s.col}22;color:${s.col}">${s.sig}</span>
      <span class="cquad-sec-name">${s.n}</span>
      <span class="cquad-sec-pbr">${s.pbr!=null?s.pbr.toFixed(1)+'x':'–'}</span>
    </div>`).join('');
  });
}

window.addEventListener('macana-ready',()=>{
  initTheme();
  updateThemePill();
  populateYmOptions();
  updateDataModePill();
  updateGeneratedAt();
  updateReadmeDataFreshness();
  loadNotes();
  initCharts();
  const chartParam=getUrlParam('chart');
  if(chartParam==='chartjs'||chartParam==='plotly') setChartMode(chartParam);
  else setChartMode('chartjs');
  updateChartModePill();
  _restoreFilterUrl();
  const ymParam=getUrlParam('ym');
  const ymSel=document.getElementById('ymSel');
  if(ymSel && ymParam && Array.from(ymSel.options).some(o=>o.value===ymParam)){
    ymSel.value=ymParam;
    onYm(ymParam);
  }
});

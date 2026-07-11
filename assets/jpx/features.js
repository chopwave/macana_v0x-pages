// ────── C-7: 散布図アニメーション ──────
const _playTimers={};
function _togglePlay(btnId,lblId,key){
  const btn=document.getElementById(btnId);
  const lbl=document.getElementById(lblId);
  if(_playTimers[key]){
    clearInterval(_playTimers[key]);
    _playTimers[key]=null;
    if(btn) btn.textContent='▶ 再生';
    if(lbl) lbl.textContent='再生すると 2020/01 から最新月まで自動表示します';
    return;
  }
  const sel=document.getElementById('ymSel');
  if(!sel) return;
  if(btn) btn.textContent='⏸ 停止';
  // 最古月から最新月へ向かって再生
  sel.selectedIndex=sel.options.length-1;
  onYm(sel.value);
  _playTimers[key]=setInterval(()=>{
    const idx=sel.selectedIndex;
    if(idx<=0){
      clearInterval(_playTimers[key]);
      _playTimers[key]=null;
      if(btn) btn.textContent='▶ 再生';
      if(lbl) lbl.textContent='再生完了';
      return;
    }
    sel.selectedIndex=idx-1;
    onYm(sel.value);
    if(lbl) lbl.textContent=sel.options[sel.selectedIndex].text;
  },900);
}
function toggleScatterPlay(){ _togglePlay('scatterPlayBtn','scatterPlayLabel','scatter'); }
function toggleRoePlay(){      _togglePlay('roePlayBtn','roePlayLabel','roe'); }

// ────── C-6: フェーズ遷移履歴 ──────
function _inferPhase(ciVal,ciPrev,polRate,jgb){
  const ciMom=ciVal-ciPrev;
  if(ciMom<-0.5&&polRate>0.25) return '後退期';
  if(ciMom<0&&polRate>=0.5) return '後退前期';
  if(ciMom>0&&polRate<=0.5) return '回復期';
  if(ciMom>0&&polRate>0.5) return '拡張期';
  return '新サイクル回復期';
}
const _PHASE_COL_SOLID={'回復期':'var(--green)','拡張期':'var(--accent)','後退前期':'var(--amber)','後退期':'var(--red)','新サイクル回復期':'var(--green)'};
function _miniEmptyState(text){
  return `<div style="padding:18px 12px;text-align:center;color:var(--hint);font-size:11px;border:1px dashed var(--border2);border-radius:8px">${text}</div>`;
}
function renderPhaseHistory(){
  const wrap=document.getElementById('phaseHistoryBar');
  const durWrap=document.getElementById('phaseDurationBar');
  if(!wrap) return;
  // phase_historyがあれば使用、なければCIから推定
  const ph=_CYCLE_RAW.phase_history||[];
  const months=CYCLE_MONTHS;
  const phases=months.map((m,i)=>{
    if(ph.length){
      const phase = ph.find(p=>p.month===m)?.phase;
      return phase || CURRENT_PHASE || '新サイクル回復期';
    }
    const ci=CI_COIN[i]??CI_COIN[CI_COIN.length-1];
    const ciPrev=CI_COIN[Math.max(0,i-1)]??ci;
    const pol=POL_RATE[i]??POL_RATE[POL_RATE.length-1];
    const jgb=JGB10Y[i]??JGB10Y[JGB10Y.length-1];
    return _inferPhase(ci,ciPrev,pol,jgb);
  });
  if(!months.length || !phases.length){
    wrap.innerHTML=_miniEmptyState('フェーズ遷移データなし');
    if(durWrap) durWrap.innerHTML=_miniEmptyState('在籍期間データなし');
    return;
  }
  // タイムラインバー
  wrap.innerHTML=`<div style="display:flex;gap:2px;flex-wrap:wrap;align-items:flex-end">
    ${months.map((m,i)=>{
      const phase=phases[i];
      const col=_PHASE_COL_SOLID[phase]||'var(--muted)';
      const isLast=(i===months.length-1);
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;min-width:40px">
        <div title="${m}: ${phase}" style="width:100%;height:32px;background:${col};border-radius:3px;opacity:${isLast?1:.8};cursor:default"></div>
        <span style="font-size:9px;color:var(--muted);writing-mode:vertical-rl;transform:rotate(180deg);height:36px;text-align:center;white-space:nowrap">${m}</span>
      </div>`;
    }).join('')}
  </div>
  <div style="display:flex;gap:12px;margin-top:14px;flex-wrap:wrap">
    ${['回復期','拡張期','後退前期','後退期'].map(p=>`<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;color:var(--muted)"><span style="width:10px;height:10px;border-radius:2px;background:${_PHASE_COL_SOLID[p]};display:inline-block"></span>${p}</span>`).join('')}
  </div>`;
  // 在籍期間集計
  if(durWrap){
    const counts={};
    phases.forEach(p=>{counts[p]=(counts[p]||0)+1;});
    const total=phases.length;
    if(!Object.keys(counts).length){
      durWrap.innerHTML=_miniEmptyState('在籍期間データなし');
      return;
    }
    durWrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:6px;padding-top:4px">
      ${Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([p,c])=>{
        const pct=Math.round(c/total*100);
        const col=_PHASE_COL_SOLID[p]||'var(--muted)';
        return `<div style="display:flex;align-items:center;gap:8px">
          <span style="width:72px;font-size:11px;color:var(--text);flex-shrink:0">${p}</span>
          <div style="flex:1;height:10px;background:rgba(255,255,255,.05);border-radius:5px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${col};border-radius:5px"></div>
          </div>
          <span style="font-family:var(--mono);font-size:10px;color:${col};width:50px;text-align:right">${c}ヶ月 (${pct}%)</span>
        </div>`;
      }).join('')}
    </div>`;
  }
}

// ────── C-5: キーボードショートカット ──────
(function(){
  const PAGES=['overview','screen','val','pbr1','event','scatter','decomp','cycle','eval','stocks'];
  const PAGE_LABELS=['1:全体サマリー','2:スクリーニング','3:バリュエーション','4:PBR1倍割れ','5:イベント','6:散布図','7:成長要因','8:景気循環','9:銘柄別評価','0:銘柄一覧'];
  function advanceYm(dir){
    const sel=document.getElementById('ymSel');
    if(!sel) return;
    const idx=sel.selectedIndex+dir;
    if(idx>=0&&idx<sel.options.length){sel.selectedIndex=idx;onYm(sel.value);}
  }
  document.addEventListener('keydown',function(e){
    const tag=document.activeElement?.tagName;
    if(['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
    if(e.ctrlKey||e.metaKey||e.altKey) return;
    if(e.key==='ArrowLeft') advanceYm(1);
    else if(e.key==='ArrowRight') advanceYm(-1);
    else if(e.key>='1'&&e.key<='9'){
      const idx=parseInt(e.key)-1;
      if(idx<PAGES.length) goto(PAGES[idx],null,false);
    }
    else if(e.key==='0') goto(PAGES[9],null,false);
    else if(e.key==='t'||e.key==='T') toggleTheme();
    else if(e.key==='c'||e.key==='C') toggleCompMode();
    else if(e.key==='?') showShortcutHelp();
    else if(e.key==='Escape'){
      const dlg=document.querySelector('dialog[open]');
      if(dlg) dlg.close();
    }
  });
  window.showShortcutHelp=function(){
    let dlg=document.getElementById('shortcutDlg');
    if(!dlg){
      dlg=document.createElement('dialog');
      dlg.id='shortcutDlg';
      dlg.className='sector-dlg';
      dlg.style.maxWidth='360px';
      dlg.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <strong style="font-size:13px">キーボードショートカット</strong>
        <button onclick="this.closest('dialog').close()" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer">×</button>
      </div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:11px;line-height:1.8">
        <span style="font-family:var(--mono);color:var(--accent)">← / →</span><span style="color:var(--muted)">年月を前後に移動</span>
        ${PAGE_LABELS.map(l=>`<span style="font-family:var(--mono);color:var(--accent)">${l.split(':')[0]}</span><span style="color:var(--muted)">${l.split(':')[1]}へ移動</span>`).join('')}
        <span style="font-family:var(--mono);color:var(--accent)">C</span><span style="color:var(--muted)">比較モード ON/OFF（バリュエーション 市場トレンド）</span>
        <span style="font-family:var(--mono);color:var(--accent)">T</span><span style="color:var(--muted)">テーマ切替（Dark/Light）</span>
        <span style="font-family:var(--mono);color:var(--accent)">[</span><span style="color:var(--muted)">サイドバー開閉</span>
        <span style="font-family:var(--mono);color:var(--accent)">?</span><span style="color:var(--muted)">このヘルプを表示</span>
        <span style="font-family:var(--mono);color:var(--accent)">Esc</span><span style="color:var(--muted)">ダイアログを閉じる</span>
      </div>`;
      document.body.appendChild(dlg);
    }
    dlg.showModal();
  };
  function ensureShortcutFab(){
    if(document.getElementById('shortcutFab')) return;
    const btn=document.createElement('button');
    btn.id='shortcutFab';
    btn.className='shortcut-fab';
    btn.type='button';
    btn.title='キーボードショートカット一覧を表示';
    btn.setAttribute('aria-label','キーボードショートカット一覧を表示');
    btn.textContent='?';
    btn.onclick=()=>showShortcutHelp();
    document.body.appendChild(btn);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',ensureShortcutFab,{once:true});
  }else{
    ensureShortcutFab();
  }
})();

// ────── sidebar toggle ──────
function toggleSidebar(){
  const shell=document.querySelector('.shell');
  const collapsed=shell.classList.toggle('sidebar-collapsed');
  localStorage.setItem('sidebarCollapsed', collapsed?'1':'0');
}
(function(){
  if(localStorage.getItem('sidebarCollapsed')==='1')
    document.querySelector('.shell').classList.add('sidebar-collapsed');
  document.addEventListener('keydown',function(e){
    if((e.key==='['||e.key==='「')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&
       !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){
      toggleSidebar();
    }
  });
})();


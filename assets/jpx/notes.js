// ────── event ──────
function selEv(idx,btn){
  currentEv=idx;
  document.querySelectorAll('.ev').forEach(e=>e.classList.remove('act'));
  if(btn) btn.classList.add('act');
  const ev=EVENTS[idx];
  document.getElementById('evBanner').innerHTML=`<strong>${ev.label}</strong>（${ev.period}）：${ev.desc}`;
  document.getElementById('evPeriod').textContent=ev.period;
  const pbr=ev.pbr.sort((a,b)=>b[1]-a[1]);
  const shr=ev.shr.sort((a,b)=>b[1]-a[1]);
  if(evCharts.bar){evCharts.bar.destroy();evCharts.bar=null;}
  if(evCharts.shr){evCharts.shr.destroy();evCharts.shr=null;}
  evCharts.bar=mk('evBarC',{type:'bar',data:{labels:pbr.map(x=>x[0]),datasets:[{label:'PBR変化',
    data:pbr.map(x=>x[1]),backgroundColor:pbr.map(x=>x[1]>=0?'rgba(91,141,246,.8)':'rgba(224,84,84,.8)'),borderRadius:4}]},
    options:{indexAxis:'y',...GC,plugins:{legend:{display:false}},
      scales:{x:{ticks:{color:chartTickColor(),font:{size:10},callback:v=>parseFloat(v.toFixed(1))+'x'},grid:{color:chartGridColor()}},
        y:{ticks:{color:chartLabelColor(),font:{size:10}},grid:{display:false}}}}});
  evCharts.shr=mk('evShareC',{type:'bar',data:{labels:shr.map(x=>x[0]),datasets:[{label:'シェア変化',
    data:shr.map(x=>x[1]),backgroundColor:shr.map(x=>x[1]>=0?'rgba(41,201,154,.8)':'rgba(224,84,84,.8)'),borderRadius:4}]},
    options:{indexAxis:'y',...GC,plugins:{legend:{display:false}},
      scales:{x:{ticks:{color:chartTickColor(),font:{size:10},callback:v=>v+'pp'},grid:{color:chartGridColor()}},
        y:{ticks:{color:chartLabelColor(),font:{size:10}},grid:{display:false}}}}});
  renderPlotlyEvent(ev);
  applyChartMode();
}

// ────── notes ──────
const _NOTES_KEY='jpxTeamNotes';
let _noteFilterTeam='all', _noteFilterTag='all';

function _noteKey(n){return `${n.ts}|${n.author}|${n.text}`;}
function _notesMember(){
  try{return isMemberAuthorized();}catch(_e){return false;}
}
function _requireMemberNotes(action){
  if(_notesMember()) return true;
  if(typeof showMemberLogin==='function') showMemberLogin();
  return false;
}
function updateNotesAccessUI(){
  const isMember=_notesMember();
  const nb=document.getElementById('nb-notes');
  if(nb) nb.textContent=isMember?notes.length:0;
  const list=document.getElementById('noteList');
  if(list && !isMember){
    list.innerHTML=`<div style="color:var(--muted);font-size:11px;padding:14px 0;text-align:center">🔒 チームメモは有償会員限定です。会員ログイン後に利用できます。</div>`;
  }
  const text=document.getElementById('noteText');
  if(text){
    text.disabled=!isMember;
    text.placeholder=isMember?'Markdownでメモを書く…':'🔒 有償会員ログインでチームメモを利用できます';
  }
  ['noteAuthor','noteTeam','noteTag','noteFilterTeam','noteFilterTag'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.disabled=!isMember;
  });
}

function persistNotes(){
  try{localStorage.setItem(_NOTES_KEY,JSON.stringify(notes));}catch(_e){}
}
function loadNotes(){
  if(!_notesMember()){
    notes=[];
    updateNotesAccessUI();
    return;
  }
  let stored=[];
  try{stored=JSON.parse(localStorage.getItem(_NOTES_KEY)||'[]');}catch(_e){}
  // 共有メモ（DASHBOARD_DATA.team_notes）をマージ（重複除外）
  const shared=(DASHBOARD_DATA?.team_notes||[]).map(n=>({...n,_shared:true}));
  const storedKeys=new Set(stored.map(_noteKey));
  notes=[...stored,...shared.filter(n=>!storedKeys.has(_noteKey(n)))];
  updateNotesAccessUI();
  renderNotes();
}
function saveNote(){
  if(!_requireMemberNotes('メモ保存')) return;
  const t=document.getElementById('noteText').value.trim();
  if(!t) return;
  addNote(t,null,
    document.getElementById('noteTag').value,
    document.getElementById('noteAuthor').value||'匿名',
    document.getElementById('noteTeam').value);
  document.getElementById('noteText').value='';
}
function clearNote(){document.getElementById('noteText').value='';}
function addNote(text,context,tag,author,team){
  if(!_notesMember()) return;
  const n={text,context,tag,author,team:team||'全員',ts:new Date().toLocaleString('ja')};
  notes.unshift(n);
  persistNotes();
  updateNotesAccessUI();
  renderNotes();
}
function delNote(i){
  if(!_requireMemberNotes('メモ削除')) return;
  notes.splice(i,1);
  persistNotes();
  updateNotesAccessUI();
  renderNotes();
}
function filterNotes(type,val){
  if(!_notesMember()) return;
  if(type==='team') _noteFilterTeam=val;
  else _noteFilterTag=val;
  renderNotes();
}
function renderNotes(){
  const el=document.getElementById('noteList');
  if(!el) return;
  if(!_notesMember()){
    updateNotesAccessUI();
    return;
  }
  const filtered=notes.filter(n=>{
    if(_noteFilterTeam!=='all'&&(n.team||'全員')!==_noteFilterTeam) return false;
    if(_noteFilterTag!=='all'&&n.tag!==_noteFilterTag) return false;
    return true;
  }).sort((a,b)=>(b._pinned?1:0)-(a._pinned?1:0));
  if(!filtered.length){
    el.innerHTML=`<div style="color:var(--muted);font-size:11px;padding:14px 0;text-align:center">該当するメモがありません</div>`;
    return;
  }
  const useMd=typeof marked!=='undefined';
  el.innerHTML=filtered.map(n=>{
    const realIdx=notes.indexOf(n);
    const teamBadge=n.team&&n.team!=='全員'
      ?`<span style="background:rgba(155,127,232,.15);color:var(--purple);border-radius:99px;padding:1px 6px;font-size:10px;margin-left:5px">${n.team}</span>`:'' ;
    const sharedBadge=n._shared
      ?`<span style="background:rgba(41,201,154,.12);color:var(--green);border-radius:99px;padding:1px 6px;font-size:9px;margin-left:5px">共有</span>`:'';
    const pinBadge=n._pinned?`<span style="background:rgba(245,166,35,.18);color:var(--amber);border-radius:99px;padding:1px 6px;font-size:9px;margin-left:5px">📌</span>`:'';
    const body=useMd?`<div class="snote-md">${marked.parse(n.text)}</div>`:n.text.replace(/\n/g,'<br>');
    return `
    <div class="snote" style="${n._pinned?'border-left:2px solid var(--amber);':''}">
      <button class="del-btn" onclick="delNote(${realIdx})">×</button>
      <button class="del-btn" onclick="pinNote(${realIdx})" style="right:30px;color:${n._pinned?'var(--amber)':'var(--hint)'}">📌</button>
      <div style="font-size:10px;margin-bottom:4px;display:flex;align-items:center;flex-wrap:wrap;gap:2px">
        <span class="chip chip-b">${n.tag}</span>
        ${teamBadge}${sharedBadge}${pinBadge}
        <span style="color:var(--muted);margin-left:6px">${n.author}</span>
        ${n.context?`<span style="color:var(--hint);margin-left:6px">${n.context}</span>`:''}
      </div>
      ${body}
      <div class="snote-ts">${n.ts}</div>
    </div>`;
  }).join('');
}
function exportNotes(){
  if(!_requireMemberNotes('メモエクスポート')) return;
  const d=new Date();
  const fname=`team_notes_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}.json`;
  const blob=new Blob([JSON.stringify(notes.map(n=>{const {_shared,...rest}=n;return rest;}),null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=fname;
  a.click();
  URL.revokeObjectURL(a.href);
}
function importNotes(input){
  if(!_requireMemberNotes('メモインポート')){ input.value=''; return; }
  const file=input.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const imported=JSON.parse(e.target.result);
      if(!Array.isArray(imported)) throw new Error('invalid');
      const existingKeys=new Set(notes.map(_noteKey));
      const newNotes=imported.filter(n=>!existingKeys.has(_noteKey(n)));
      notes=[...newNotes,...notes];
      persistNotes();
      updateNotesAccessUI();
      renderNotes();
      alert(`${newNotes.length}件のメモをインポートしました（重複${imported.length-newNotes.length}件除外）`);
    }catch(_e){alert('JSONファイルの読み込みに失敗しました');}
    input.value='';
  };
  reader.readAsText(file);
}

// ────── export ──────
function updateCsvExportUI(){
  const btn=document.getElementById('csvExportBtn');
  if(!btn) return;
  const member=typeof _isMember==='function' && _isMember();
  btn.textContent=member?'CSV出力':'🔒 CSV出力';
  btn.title=member?'スクリーニング結果をCSV保存':'CSV出力は有償会員向けです';
  btn.setAttribute('data-tip',member
    ? 'スクリーニング結果をCSV保存できます。'
    : 'CSV出力は有償会員向けです。&#10;会員ログイン後に利用できます。');
}
function exportCSV(){
  if(typeof _isMember==='function' && !_isMember()){
    if(typeof showMemberLogin==='function') showMemberLogin();
    return;
  }
  const rows=[['業種','カテゴリ','加重PBR','PBR前期比','加重PER','時価総額(兆円)','上場社数','シグナル']];
  _curSectors().forEach(s=>rows.push([s.n,CAT_LBL[s.cat],s.pbr,s.chg,s.per??'',s.cap,s.cos,signal(s).txt]));
  const csv=rows.map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv);
  a.download='jpx_screening.csv';a.click();
}

(function initCsvExportUI(){
  const run=()=>updateCsvExportUI();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
})();


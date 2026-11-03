// ────── heatmap ──────
function renderHeatmap(){
  const wrap=document.getElementById('heatWrap');
  if(!wrap) return;
  const _pbr1=PBR1_FINE;
  const months6=_pbr1.months||SAMPLE_PBR1.months;
  const sectors=_pbr1.sectors||SAMPLE_PBR1.sectors;
  const matrix=_pbr1.matrix||SAMPLE_PBR1.matrix||null;
  const isLight=themeMode==='light';
  const headerColor=isLight ? '#475467' : '#6b7491';
  const nameBorder=isLight ? 'rgba(16,24,40,.08)' : 'rgba(255,255,255,.05)';
  const cellBorder='rgba(0,0,0,.08)';
  const missingBg=isLight ? '#f3f6fb' : '#131722';
  const missingFg=isLight ? '#667085' : '#6b7491';
  let h=`<table style="border-collapse:collapse;font-size:10px;min-width:100%">
    <tr><td style="width:100px"></td>${months6.map(m=>`<td style="padding:3px 5px;color:${headerColor};text-align:center;white-space:nowrap">${m}</td>`).join('')}</tr>`;
  sectors.forEach((name,rowIdx)=>{
    h+=`<tr><td style="padding:3px 10px;color:var(--text);white-space:nowrap;border-right:1px solid ${nameBorder}">${name}</td>`;
    months6.forEach((_,i)=>{
      const basePbr=SECTORS.find(s=>s.n===name)?.pbr ?? 1.0;
      const raw = matrix ? matrix[rowIdx]?.[i] : Math.max(0.2,basePbr+(i-5)*0.06);
      const v = raw == null ? null : Number(raw);
      if(v == null || Number.isNaN(v)){
        h+=`<td style="background:${missingBg};color:${missingFg};text-align:center;padding:3px 6px;border:1px solid ${cellBorder};font-family:var(--mono)">-</td>`;
        return;
      }
      const [bg,fg]=isLight
        ? (
            v>=1.5?['#e6f6ee','#0f9f6e']
            : v>=1.0?['#eef7f1','#0f9f6e']
            : v>=0.8?['#fff4de','#c98512']
            : ['#fdecec','#d14343']
          )
        : (
            v>=1.5?['#0a3020','#29c99a']
            : v>=1.0?['#1a3515','#29c99a']
            : v>=0.8?['#3a2a00','#f5a623']
            : ['#3a0e0e','#e05454']
          );
      h+=`<td class="heat-clickable" style="background:${bg};color:${fg};text-align:center;padding:3px 6px;border:1px solid ${cellBorder};font-family:var(--mono);cursor:pointer" onclick="showHeatDrilldown(this)"
        title="クリックで詳細を表示" data-sector="${name.replace(/'/g,'&#39;')}" data-months="${months6.join(',')}">${v.toFixed(2)}</td>`;
    });
    h+='</tr>';
  });
  wrap.innerHTML=h+'</table>';
}
// C-3: PBR1倍割れ ドリルダウン
function showHeatDrilldown(td){
  const name=td.dataset.sector;
  const months=td.dataset.months.split(',');
  const dlg=document.getElementById('heatDrillDlg');
  const body=document.getElementById('heatDlgBody');
  const title=document.getElementById('heatDlgTitle');
  if(!dlg||!body) return;
  const sect=SECTORS.find(s=>s.n===name)||{};
  const _pbr1d=PBR1_FINE;
  const matrix=_pbr1d.matrix||SAMPLE_PBR1.matrix||null;
  const allSectors=_pbr1d.sectors||SAMPLE_PBR1.sectors;
  const rowIdx=allSectors.indexOf(name);
  title.textContent=`${name}（${sect.cat?{G:'グロース',V:'バリュー',C:'シクリカル',D:'ディフェンシブ'}[sect.cat]:'–'}）`;
  // PBR推移データ
  const vals=months.map((_,i)=>{
    if(matrix&&rowIdx>=0) return matrix[rowIdx]?.[i]??null;
    const base=sect.pbr??1.0;
    return Math.max(0.2,+(base+(i-Math.floor(months.length/2))*0.06).toFixed(2));
  });
  const latest=vals.filter(v=>v!=null).at(-1);
  const signal=latest==null?'–':latest>=1.0?'<span style="color:var(--green)">1倍超 ✓</span>':latest>=0.8?'<span style="color:var(--amber)">改善途上</span>':'<span style="color:var(--red)">1倍割れ ✗</span>';
  // バーチャート形式で推移表示
  const maxV=Math.max(...vals.filter(v=>v!=null),1.5);
  const bars=months.map((m,i)=>{
    const v=vals[i];
    if(v==null) return `<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="width:56px;font-size:10px;color:var(--hint)">${m}</span><span style="font-size:10px;color:var(--hint)">–</span></div>`;
    const pct=Math.min(100,v/maxV*100);
    const col=v>=1.5?'var(--green)':v>=1.0?'rgba(41,201,154,.7)':v>=0.8?'var(--amber)':'var(--red)';
    return `<div style="display:flex;align-items:center;gap:6px;padding:2px 0">
      <span style="width:56px;font-size:10px;color:var(--muted);flex-shrink:0">${m}</span>
      <div style="flex:1;height:12px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${col};border-radius:3px"></div>
      </div>
      <span style="width:38px;text-align:right;font-family:var(--mono);font-size:10px;color:${col}">${v.toFixed(2)}x</span>
    </div>`;
  }).join('');
  body.innerHTML=`
    <div style="margin-bottom:10px;font-size:11px;color:var(--muted)">
      現在シグナル：${signal}　加重PBR最新：<span style="font-family:var(--mono);font-size:13px;color:var(--text)">${latest!=null?latest.toFixed(2)+'x':'–'}</span>
    </div>
    <div style="font-size:10px;color:var(--hint);margin-bottom:6px">月次PBR推移</div>
    <div>${bars}</div>
    <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px;display:flex;justify-content:flex-end">
      <button onclick="goto('screen',null);document.getElementById('heatDrillDlg').close();setTimeout(()=>{const el=document.getElementById('screenSearch');if(el){el.value='${name}';setSearch&&setSearch('${name}');}},100)"
        style="background:var(--accent);color:#fff;border:none;padding:5px 12px;border-radius:5px;font-size:11px;cursor:pointer">スクリーニングで確認 →</button>
    </div>`;
  dlg.showModal();
}

// 折れ線グラフ（C-*追加: 業種別PBR推移）
let _heatLineInited=false;
let _heatLineAll=false;
function renderHeatLineLegend(){
  const host=document.getElementById('heatLineLegend');
  const chart=charts.heatLine;
  if(!host||!chart) return;
  host.innerHTML=chart.data.datasets.map((ds,idx)=>{
    if(ds.label==='1.0x') return '';
    const visible=chart.isDatasetVisible(idx);
    return `<button type="button" class="legend-chip ${visible?'':'off'}" title="${visible?'クリックで非表示':'クリックで再表示'}" onclick="toggleHeatLineSeries(${idx})">
      <span class="legend-dot" style="background:${ds.borderColor}"></span>
      <span class="legend-label">${ds.label}</span>
    </button>`;
  }).join('');
}
function toggleHeatLineSeries(idx){
  const chart=charts.heatLine;
  if(!chart) return;
  chart.setDatasetVisibility(idx,!chart.isDatasetVisible(idx));
  chart.update();
  renderHeatLineLegend();
}

function toggleHeatLineFilter(){
  _heatLineAll=!_heatLineAll;
  const btn=document.getElementById('heatLineFilterBtn');
  if(btn) btn.textContent=_heatLineAll?'全業種':'PBR < 1.0 のみ';
  renderHeatmapChart(true);
}

function renderHeatmapChart(force){
  if(_heatLineInited&&!force) return;
  _heatLineInited=true;
  const _pbr1l=PBR1_FINE;
  const months=_pbr1l.months||SAMPLE_PBR1.months||[];
  const sectors=_pbr1l.sectors||SAMPLE_PBR1.sectors||[];
  const matrix=_pbr1l.matrix||SAMPLE_PBR1.matrix||[];
  if(!months.length||!sectors.length||!matrix.length) return;
  const lastIdx=months.length-1;
  const filteredIdx=sectors.map((name,i)=>{
    if(_heatLineAll) return i;
    const v=matrix[i]?.[lastIdx];
    return (v!=null&&v<1.0)?i:null;
  }).filter(i=>i!==null);
  const refDs={
    label:'1.0x',
    data:months.map(()=>1.0),
    borderColor:themeMode==='light'?'rgba(16,24,40,.25)':'rgba(255,255,255,.2)',
    borderDash:[4,3],
    borderWidth:1,
    pointRadius:0,
    fill:false,
    tension:0,
  };
  const datasets=[
    ...filteredIdx.map(ri=>{
      const name=sectors[ri];
      const cat=SECTORS.find(s=>s.n===name)?.cat||'V';
      return lineDs(name,matrix[ri].map(v=>v==null?null:+v.toFixed(2)),CAT_COL[cat]||'#6b7491');
    }),
    refDs
  ];
  const canvas=document.getElementById('heatLineC');
  if(!canvas) return;
  if(charts.heatLine){charts.heatLine.destroy();charts.heatLine=null;}
  charts.heatLine=new Chart(canvas,{
    type:'line',
    data:{labels:months,datasets},
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      spanGaps:true,
      plugins:{
        title:chartTitle('業種別 PBR推移（月次）'),
        legend:{
          display:false,
          labels:{
            color:chartLabelColor(),
            font:{size:10},
            boxWidth:10,
            padding:6,
            filter:item=>item.label!=='1.0x',
          }
        },
        tooltip:{
          callbacks:{
            label:ctx=>ctx.dataset.label==='1.0x'?null:ttLabel(ctx.dataset.label,ctx.parsed.y,'x',2)
          }
        },
        emptyState:{display:true,text:'PBR推移データなし'}
      },
      scales:{
        x:{ticks:{color:chartTickColor(),font:{size:9},maxTicksLimit:12},grid:{color:chartGridColor()}},
        y:{
          title:{display:true,text:'PBR（倍）',color:chartTickColor(),font:{size:10}},
          ticks:{color:chartTickColor(),font:{size:10},callback:v=>v.toFixed(1)+'x'},
          grid:{color:chartGridColor()}
        }
      }
    }
  });
  renderHeatLineLegend();
}

function applyHeatmapMode(){
  const tableHost=document.getElementById('heatWrap');
  const plotlyHost=document.getElementById('heatWrapPlotly');
  if(!tableHost || !plotlyHost) return;
  const usePlotly=chartMode==='plotly';
  tableHost.classList.toggle('chart-host-hide',usePlotly);
  plotlyHost.classList.toggle('act',usePlotly);
}
function renderPlotlyHeatmap(){
  const isLight=themeMode==='light';
  const wrap=document.getElementById('heatWrap');
  if(!wrap) return;
  wrap.classList.add('heat-table-host');
  let host=document.getElementById('heatWrapPlotly');
  if(!host){
    host=document.createElement('div');
    host.id='heatWrapPlotly';
    host.className='plotly-host';
    host.style.minHeight='720px';
    wrap.parentElement.appendChild(host);
  }
  const months6=DASHBOARD_DATA?.pbr1?.months || ['2020/01','2020/07','2021/01','2021/07','2022/01','2022/07','2023/01','2023/07','2024/01','2024/07','2025/01','2025/07'];
  const sectors=DASHBOARD_DATA?.pbr1?.sectors || SECTORS.map(s=>s.n);
  const z=DASHBOARD_DATA?.pbr1?.matrix || sectors.map(name=>{
    const basePbr=SECTORS.find(s=>s.n===name)?.pbr ?? 1.0;
    return months6.map((_,i)=>Math.max(0.2,basePbr+(i-5)*0.06));
  });
  Plotly.react(host,[{
    type:'heatmap',
    x:months6,
    y:sectors,
    z,
    colorscale:[
      [0.00,'#3a0e0e'],
      [0.24,'#e05454'],
      [0.40,'#3a2a00'],
      [0.58,'#f5a623'],
      [0.72,'#1a3515'],
      [1.00,'#29c99a']
    ],
    colorbar:{title:'PBR',titleside:'right',tickfont:{color:isLight?'#475467':'#6b7491',size:10}},
    hovertemplate:'%{y}<br>%{x}<br>PBR: %{z:.1f}x<extra></extra>'
  }],plotlyTheme({
    margin:{l:120,r:56,t:24,b:44},
    xaxis:{side:'top',tickangle:0},
    yaxis:{autorange:'reversed'},
    height:760
  }),{displayModeBar:false,responsive:true});
}


// ────── data ──────
const _forceSample=(()=>{try{return new URLSearchParams(window.location.search).get('mode')==='sample';}catch(_){return false;}})();
const DASHBOARD_DATA = (!_forceSample && window.JPX_DASHBOARD_DATA) || null;

const SAMPLE_SECTORS=[
  {n:'水産・農林', cat:'D',pbr:1.2,per:13.2,cap:0.6, cos:7,  chg:+0.0,dy:2.2},
  {n:'鉱業',       cat:'C',pbr:0.5,per:14.4,cap:1.8, cos:6,  chg:+0.1,dy:3.8},
  {n:'建設業',     cat:'V',pbr:1.2,per:9.9, cap:16.6,cos:100,chg:+0.3,dy:2.9},
  {n:'食料品',     cat:'D',pbr:1.7,per:18.7,cap:23.7,cos:83, chg:+0.0,dy:1.8},
  {n:'繊維製品',   cat:'V',pbr:1.0,per:17.7,cap:3.5, cos:41, chg:-0.2,dy:2.3},
  {n:'パルプ・紙', cat:'V',pbr:0.7,per:25.7,cap:1.6, cos:12, chg:+0.0,dy:2.6},
  {n:'化学',       cat:'C',pbr:1.6,per:16.6,cap:43.7,cos:146,chg:-0.2,dy:2.0},
  {n:'医薬品',     cat:'D',pbr:2.4,per:32.4,cap:40.0,cos:39, chg:+0.1,dy:1.2},
  {n:'石油・石炭', cat:'C',pbr:0.6,per:5.7, cap:2.7, cos:9,  chg:+0.4,dy:5.2},
  {n:'ゴム製品',   cat:'C',pbr:1.1,per:10.7,cap:4.2, cos:11, chg:-0.1,dy:2.7},
  {n:'ガラス・土石',cat:'C',pbr:1.0,per:10.7,cap:4.9,cos:33, chg:-0.1,dy:2.4},
  {n:'鉄鋼',       cat:'C',pbr:0.5,per:7.6, cap:4.7, cos:31, chg:+0.3,dy:4.1},
  {n:'非鉄金属',   cat:'C',pbr:0.7,per:13.0,cap:4.0, cos:24, chg:+0.5,dy:3.3},
  {n:'金属製品',   cat:'C',pbr:0.9,per:19.9,cap:3.6, cos:41, chg:+0.2,dy:2.5},
  {n:'機械',       cat:'C',pbr:1.4,per:16.0,cap:29.3,cos:142,chg:+0.1,dy:2.1},
  {n:'電気機器',   cat:'G',pbr:1.9,per:19.0,cap:83.0,cos:158,chg:+0.5,dy:1.5},
  {n:'輸送用機器', cat:'C',pbr:0.9,per:12.1,cap:52.9,cos:62, chg:+0.4,dy:3.5},
  {n:'精密機器',   cat:'G',pbr:3.4,per:31.6,cap:13.7,cos:33, chg:+0.2,dy:0.8},
  {n:'その他製品', cat:'G',pbr:1.8,per:28.9,cap:12.9,cos:53, chg:+0.2,dy:1.3},
  {n:'電気・ガス', cat:'D',pbr:0.7,per:10.9,cap:8.3, cos:22, chg:+0.3,dy:3.0},
  {n:'陸運業',     cat:'D',pbr:1.4,per:15.4,cap:24.8,cos:43, chg:-0.1,dy:2.2},
  {n:'海運業',     cat:'C',pbr:0.6,per:null,cap:0.9, cos:8,  chg:+1.6,dy:6.8},
  {n:'空運業',     cat:'C',pbr:1.0,per:8.7, cap:2.3, cos:3,  chg:-0.5,dy:1.0},
  {n:'倉庫・運輸', cat:'V',pbr:0.8,per:15.1,cap:1.3, cos:24, chg:+0.2,dy:2.8},
  {n:'情報・通信', cat:'G',pbr:1.7,per:14.9,cap:72.9,cos:220,chg:+0.3,dy:1.6},
  {n:'卸売業',     cat:'V',pbr:0.9,per:9.7, cap:29.6,cos:177,chg:+0.9,dy:3.8},
  {n:'小売業',     cat:'D',pbr:1.9,per:25.7,cap:36.4,cos:201,chg:-0.1,dy:1.4},
  {n:'銀行業',     cat:'V',pbr:0.4,per:10.0,cap:32.7,cos:82, chg:+0.4,dy:4.5},
  {n:'証券・先物', cat:'V',pbr:0.8,per:74.0,cap:4.5, cos:23, chg:+0.3,dy:3.2},
  {n:'保険業',     cat:'V',pbr:0.8,per:11.8,cap:13.0,cos:9,  chg:+0.5,dy:3.9},
  {n:'その他金融', cat:'V',pbr:1.1,per:11.0,cap:8.5, cos:27, chg:+0.1,dy:3.1},
  {n:'不動産業',   cat:'D',pbr:1.3,per:16.1,cap:15.0,cos:72, chg:+0.2,dy:2.6},
  {n:'サービス業', cat:'G',pbr:1.5,per:23.0,cap:36.3,cos:216,chg:+0.4,dy:1.7},
];
const CAT_COL={G:'#5b8df6',D:'#29c99a',C:'#f5a623',V:'#9b7fe8'};
const CAT_LBL={G:'グロース',D:'ディフェンシブ',C:'シクリカル',V:'バリュー'};
const SECTOR_CODE={'水産・農林':50,'鉱業':1050,'建設業':1300,'食料品':2050,'繊維製品':3050,'パルプ・紙':3100,'化学':3200,'医薬品':3250,'石油・石炭':3300,'ゴム製品':3350,'ガラス・土石':3400,'鉄鋼':3450,'非鉄金属':3500,'金属製品':3550,'機械':3600,'電気機器':3650,'輸送用機器':3700,'精密機器':3750,'その他製品':3800,'電気・ガス':4050,'陸運業':5050,'海運業':5100,'空運業':5150,'倉庫・運輸':5200,'情報・通信':5250,'卸売業':6050,'小売業':6100,'銀行業':7050,'証券・先物':7100,'保険業':7150,'その他金融':7200,'不動産業':8050,'サービス業':9050};
const SAMPLE_MONTHS=['2020/01','2020/07','2021/01','2021/07','2022/01','2022/07','2023/01','2023/07','2024/01','2024/07','2025/01','2025/07'];
const SAMPLE_PBR_TS=[1.20,1.25,1.35,1.48,1.42,1.38,1.30,1.45,1.52,1.60,1.65,1.68];
const SAMPLE_PER_TS=[15.5,16.2,17.8,20.1,18.4,17.2,16.5,19.2,21.0,22.5,23.1,23.8];
const SAMPLE_LG=[1.3,1.35,1.5,1.65,1.55,1.5,1.42,1.6,1.7,1.78,1.82,1.85];
const SAMPLE_MED=[1.2,1.28,1.38,1.52,1.45,1.40,1.33,1.48,1.55,1.62,1.67,1.70];
const SAMPLE_SM=[1.1,1.15,1.22,1.35,1.28,1.22,1.16,1.30,1.36,1.44,1.50,1.52];
const SAMPLE_MFG=[1.4,1.42,1.55,1.72,1.62,1.55,1.48,1.65,1.74,1.82,1.88,1.90];
const SAMPLE_NMFG=[1.4,1.45,1.60,1.78,1.68,1.60,1.52,1.68,1.78,1.88,1.94,1.97];
const SAMPLE_EVENTS=[
  {label:'コロナ底',period:'2020/01→2020/03',
   desc:'全業種が無差別に売られる局面。空運・海運・鉄鋼が最大打撃。情報・通信・医薬品は比較的軽傷（テレワーク・ヘルスケア期待）。',
   pbr:[['空運業',-0.5],['精密機器',-0.6],['電気機器',-0.4],['情報・通信',-0.2],['医薬品',-0.1],['食料品',-0.05]],
   shr:[['情報・通信',0.3],['医薬品',0.2],['電気機器',-0.5],['輸送用機器',-0.4],['空運業',-0.3]]},
  {label:'コロナ回復',period:'2020/03→2021/06',
   desc:'コンテナ不足で海運バブル（+1.4倍）。電気機器・情報通信もDX需要で急伸。卸売（商社）も資源高で台頭。銀行は低金利継続で恩恵薄く出遅れ。',
   pbr:[['海運業',1.4],['電気機器',1.7],['精密機器',1.4],['情報・通信',1.1],['卸売業',0.5],['繊維製品',-0.1]],
   shr:[['情報・通信',1.8],['電気機器',1.5],['海運業',0.3],['銀行業',-0.4]]},
  {label:'利上げ懸念',period:'2021/06→2022/06',
   desc:'海運が2.2倍でピーク。石油・石炭・卸売がさらに上昇。グロース株はFRB利上げ・割引率上昇で逆風。バリュー優位のローテーション。',
   pbr:[['石油・石炭',0.4],['卸売業',0.3],['銀行業',0.1],['精密機器',-1.2],['電気機器',-0.8],['情報・通信',-0.3]],
   shr:[['卸売業',1.2],['石油・石炭',0.4],['電気機器',-1.0],['精密機器',-0.8]]},
  {label:'東証PBR改革',period:'2023/03→2023/09',
   desc:'東証が「PBR1倍割れ企業への改善計画開示」を要請。銀行・保険・商社などのバリュー株が急騰。日銀YCC修正も銀行株を後押し。',
   pbr:[['銀行業',0.2],['保険業',0.2],['卸売業',0.2],['証券・先物',0.1],['情報・通信',0.2],['電気機器',0.1]],
   shr:[['銀行業',0.8],['保険業',0.4],['卸売業',0.5],['電気機器',0.3]]},
  {label:'日銀利上げ',period:'2024/01→2025/07',
   desc:'日銀の段階的利上げ継続で銀行がさらに回復。半導体・AI需要で電気機器・情報通信が再加速。海運は供給正常化でPBR 1.0倍まで下落。',
   pbr:[['銀行業',0.3],['電気機器',0.4],['情報・通信',0.4],['卸売業',0.2],['海運業',-1.2],['電気・ガス',0.3]],
   shr:[['情報・通信',0.8],['電気機器',0.5],['銀行業',0.6],['海運業',-0.5]]},
];
// ─── サンプル: 月次業種履歴 ─── SAMPLE_MONTHSの各月に対応するセクターデータ（PBR_TSで按分）
const _SAMPLE_PBR_LATEST=SAMPLE_PBR_TS[SAMPLE_PBR_TS.length-1];
const _SAMPLE_YMS=SAMPLE_MONTHS.map(m=>m.replace('/',''));
const SAMPLE_SECTORS_HISTORY=Object.fromEntries(
  _SAMPLE_YMS.map((ym,i)=>{
    const sc=SAMPLE_PBR_TS[i]/_SAMPLE_PBR_LATEST;
    const prevSc=i>0?SAMPLE_PBR_TS[i-1]/_SAMPLE_PBR_LATEST:sc;
    return [ym,SAMPLE_SECTORS.map(s=>({
      ...s,
      pbr:s.pbr!=null?+(s.pbr*sc).toFixed(2):null,
      chg:s.pbr!=null?+(s.pbr*(sc-prevSc)).toFixed(2):s.chg,
      cap:s.cap!=null?+(s.cap*(sc*0.8+0.2)).toFixed(1):null
    }))];
  })
);
// ─── サンプル: 月次成長要因分解 ───
const SAMPLE_DECOMP_HISTORY=Object.fromEntries(
  _SAMPLE_YMS.slice(1).map((ym,i)=>{
    const sc=SAMPLE_PBR_TS[i+1]/_SAMPLE_PBR_LATEST;
    const prevSc=SAMPLE_PBR_TS[i]/_SAMPLE_PBR_LATEST;
    const sectors=[...SAMPLE_SECTORS].map(s=>{
      const chg=s.pbr!=null?+(s.pbr*(sc-prevSc)).toFixed(3):0;
      return {n:s.n,na:+(chg*0.62).toFixed(3),pbr:+(chg*0.38).toFixed(3)};
    }).sort((a,b)=>Math.abs(b.na+b.pbr)-Math.abs(a.na+a.pbr));
    return [ym,{start:SAMPLE_MONTHS[i],end:SAMPLE_MONTHS[i+1],sectors}];
  })
);
// ─── サンプル: PBR1倍割れヒートマップ（月次マトリクス）───
// matrix[i][j] = 業種i の j番目の月のPBR値
const SAMPLE_PBR1=(()=>{
  const sectorNames=SAMPLE_SECTORS.map(s=>s.n);
  const matrix=SAMPLE_SECTORS.map(s=>{
    const base=s.pbr!=null?s.pbr:1.0;
    return SAMPLE_MONTHS.map((_,j)=>{
      const sc=SAMPLE_PBR_TS[j]/_SAMPLE_PBR_LATEST;
      return +(base*sc).toFixed(2);
    });
  });
  return {months:SAMPLE_MONTHS,sectors:sectorNames,matrix};
})();
// ─── サンプル: 成長要因分解（最新月スナップショット）───
// na=純資産寄与率(%)、pbr=PBR変化寄与率(%)、total=合計(%)
const SAMPLE_DECOMP=(()=>{
  const latestSc=1.0;
  const prevSc=SAMPLE_PBR_TS[SAMPLE_PBR_TS.length-2]/_SAMPLE_PBR_LATEST;
  return [...SAMPLE_SECTORS].map(s=>{
    const chg=s.pbr!=null?+(s.pbr*(latestSc-prevSc)).toFixed(3):0;
    const na=+(chg*0.62).toFixed(3);
    const pbr=+(chg*0.38).toFixed(3);
    return {n:s.n,na,pbr,total:+(na+pbr).toFixed(3)};
  }).sort((a,b)=>Math.abs(b.total)-Math.abs(a.total));
})();
const SECTORS=DASHBOARD_DATA?.sectors_latest || SAMPLE_SECTORS;
const MONTHS=DASHBOARD_DATA?.months || SAMPLE_MONTHS;
// 単純平均-加重平均スプレッド（avg_pbrが実データにあれば優先、なければ近似値）
function _calcSprData(sectors){
  const hasAvp=sectors.some(s=>s.avp!=null);
  return [...sectors].map(s=>({
    n:s.n,
    v:hasAvp?(s.avp!=null&&s.pbr!=null?+(s.avp-s.pbr).toFixed(2):0):+(0.25-s.pbr*.08).toFixed(2)
  })).sort((a,b)=>b.v-a.v);
}
const SPR_DATA=_calcSprData(SECTORS);
// 選択月セクター（null=最新月）
let _activeSectors=null;
function _curSectors(){return _activeSectors||SECTORS;}
const PBR_TS=DASHBOARD_DATA?.pbr_ts || SAMPLE_PBR_TS;
const PER_TS=DASHBOARD_DATA?.per_ts || SAMPLE_PER_TS;
const LG=DASHBOARD_DATA?.lg || SAMPLE_LG;
const MED=DASHBOARD_DATA?.med || SAMPLE_MED;
const SM=DASHBOARD_DATA?.sm || SAMPLE_SM;
const MFG=DASHBOARD_DATA?.mfg || SAMPLE_MFG;
const NMFG=DASHBOARD_DATA?.nmfg || SAMPLE_NMFG;
const EVENTS=DASHBOARD_DATA?.events || SAMPLE_EVENTS;

// ─── サンプル: 銘柄一覧 ───
// steps配列: [step1,step2,...,step7] 各要素 1=通過 0=非通過
// step1=基本条件(時価総額・流動性・上場年数・業種)
// step2=配当利回り(2-8%・特配除外)  step3=配当持続性(ペイアウト・DOE・FCF)
// step4=財務健全性(自己資本比率・営業利益率)  step5=成長安定性(CAGR・利益ボラ)
// step6=バリュエーション(PER/PBR)  step7=タイミング(テクニカル)
const SAMPLE_STOCKS={
  as_of:'2025/07/31',
  by_sector:{
    '情報・通信':[
      {code:'9433',name:'KDDI',         score:75,rank:'A',dy:3.4,pbr:2.10,per:14.2,price:4800, cap:1100.0,steps:[1,1,1,1,1,1,1]},
      {code:'9432',name:'NTT',          score:72,rank:'B',dy:3.5,pbr:1.80,per:12.3,price:155,  cap:2400.0,steps:[1,1,1,1,1,1,0]},
      {code:'4689',name:'LYコーポレーション',score:68,rank:'B',dy:3.2,pbr:1.20,per:18.5,price:450,  cap:210.0, steps:[1,1,1,0,1,1,0]},
      {code:'4755',name:'楽天グループ', score:28,rank:'D',dy:0.0,pbr:2.90,per:null,price:920,  cap:185.0, steps:[1,0,0,0,0,0,0]},
      {code:'9984',name:'ソフトバンクG',score:20,rank:'D',dy:0.8,pbr:1.60,per:null,price:8200, cap:1200.0,steps:[0,0,0,0,0,0,0]},
    ],
    '電気機器':[
      {code:'6501',name:'日立製作所',   score:78,rank:'A',dy:1.2,pbr:2.30,per:18.4,price:3800, cap:980.0, steps:[1,1,1,1,1,1,1]},
      {code:'6861',name:'キーエンス',   score:70,rank:'B',dy:0.4,pbr:5.20,per:40.2,price:65000,cap:1580.0,steps:[1,0,1,1,1,1,1]},
      {code:'6758',name:'ソニーG',      score:65,rank:'B',dy:0.7,pbr:1.95,per:20.1,price:13500,cap:1700.0,steps:[1,0,1,1,1,1,0]},
      {code:'6702',name:'富士通',       score:55,rank:'C',dy:0.9,pbr:3.50,per:28.0,price:3200, cap:650.0, steps:[1,0,1,1,0,0,0]},
      {code:'6594',name:'日本電産',     score:40,rank:'C',dy:0.5,pbr:3.80,per:55.0,price:2400, cap:450.0, steps:[1,0,0,1,0,0,0]},
    ],
    '銀行業':[
      {code:'8306',name:'三菱UFJ FG',   score:80,rank:'A',dy:3.8,pbr:0.85,per:10.5,price:1680, cap:2300.0,steps:[1,1,1,1,1,1,1]},
      {code:'8316',name:'三井住友FG',   score:78,rank:'A',dy:4.1,pbr:0.90,per:9.8, price:9800, cap:1400.0,steps:[1,1,1,1,1,1,1]},
      {code:'8411',name:'みずほFG',     score:72,rank:'B',dy:4.0,pbr:0.70,per:9.2, price:3200, cap:850.0, steps:[1,1,1,1,0,1,1]},
      {code:'8308',name:'りそなHD',     score:65,rank:'B',dy:3.5,pbr:0.65,per:10.1,price:820,  cap:380.0, steps:[1,1,1,0,1,1,0]},
      {code:'8309',name:'三井住友TH',   score:48,rank:'C',dy:2.8,pbr:0.55,per:12.0,price:320,  cap:95.0,  steps:[1,1,0,0,0,1,0]},
    ],
    '卸売業':[
      {code:'8058',name:'三菱商事',     score:82,rank:'A',dy:3.6,pbr:1.10,per:10.2,price:2800, cap:450.0, steps:[1,1,1,1,1,1,1]},
      {code:'8031',name:'三井物産',     score:80,rank:'A',dy:3.9,pbr:1.00,per:9.5, price:3200, cap:420.0, steps:[1,1,1,1,1,1,1]},
      {code:'8001',name:'伊藤忠商事',   score:78,rank:'A',dy:3.2,pbr:1.50,per:11.8,price:7800, cap:1080.0,steps:[1,1,1,1,1,1,0]},
      {code:'8002',name:'丸紅',         score:72,rank:'B',dy:3.8,pbr:1.00,per:9.8, price:2600, cap:380.0, steps:[1,1,1,1,1,0,1]},
      {code:'8053',name:'住友商事',     score:70,rank:'B',dy:4.0,pbr:0.90,per:9.2, price:3100, cap:420.0, steps:[1,1,1,1,0,1,1]},
    ],
    '輸送用機器':[
      {code:'7203',name:'トヨタ自動車', score:75,rank:'A',dy:3.0,pbr:0.92,per:12.1,price:3000, cap:4800.0,steps:[1,1,1,1,1,1,1]},
      {code:'7267',name:'ホンダ',       score:68,rank:'B',dy:3.8,pbr:0.70,per:8.5, price:1680, cap:890.0, steps:[1,1,1,1,0,1,1]},
      {code:'7201',name:'日産自動車',   score:22,rank:'D',dy:0.0,pbr:0.30,per:null, price:380,  cap:160.0, steps:[1,0,0,0,0,0,0]},
      {code:'7269',name:'スズキ',       score:60,rank:'B',dy:2.2,pbr:1.40,per:14.0,price:1850, cap:320.0, steps:[1,1,0,1,1,1,0]},
    ],
    '食料品':[
      {code:'2914',name:'日本たばこ産業',score:72,rank:'B',dy:5.8,pbr:1.70,per:13.5,price:4200,cap:800.0, steps:[1,1,1,1,0,1,1]},
      {code:'2802',name:'味の素',        score:68,rank:'B',dy:1.5,pbr:3.20,per:24.5,price:4800,cap:620.0, steps:[1,0,1,1,1,1,1]},
      {code:'2503',name:'キリンHD',      score:55,rank:'C',dy:2.5,pbr:1.90,per:22.0,price:2100,cap:370.0, steps:[1,1,0,1,0,0,0]},
      {code:'2282',name:'日本ハム',      score:45,rank:'C',dy:2.0,pbr:1.20,per:28.0,price:3500,cap:155.0, steps:[1,0,0,1,0,0,0]},
    ],
    '医薬品':[
      {code:'4519',name:'中外製薬',     score:65,rank:'B',dy:1.2,pbr:6.10,per:38.2,price:5800, cap:960.0, steps:[1,0,1,1,1,1,0]},
      {code:'4568',name:'第一三共',     score:60,rank:'B',dy:0.8,pbr:4.80,per:45.0,price:4500, cap:880.0, steps:[1,0,1,1,0,1,0]},
      {code:'4502',name:'武田薬品',     score:52,rank:'C',dy:3.8,pbr:1.50,per:null, price:4200, cap:680.0, steps:[1,1,0,0,0,0,0]},
      {code:'4523',name:'エーザイ',     score:38,rank:'D',dy:0.5,pbr:3.20,per:null, price:5200, cap:310.0, steps:[1,0,0,0,0,0,0]},
    ],
  }
};
// ─── サンプル: 銘柄一覧（上場銘柄マスター ベース）───
const SAMPLE_STOCK_LIST={
  as_of:'2025-07-31',
  by_sector:{
    '水産・農林業':[
      {code:'1301',name:'極洋',                  s17:1,s17nm:'食品',          s33:'0050',  s33nm:'水産・農林業',  mkt:'プライム',scale:'TOPIX Small 1',mktcap:700},
      {code:'1332',name:'日本水産',              s17:1,s17nm:'食品',          s33:'0050',  s33nm:'水産・農林業',  mkt:'プライム',scale:'TOPIX Mid400',mktcap:1600},
    ],
    '鉱業':[
      {code:'1605',name:'INPEX',                 s17:2,s17nm:'エネルギー資源',s33:'1050',s33nm:'鉱業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:22000},
      {code:'1662',name:'石油資源開発',          s17:2,s17nm:'エネルギー資源',s33:'1050',s33nm:'鉱業',          mkt:'プライム',scale:'TOPIX Small 1',mktcap:2000},
    ],
    '建設業':[
      {code:'1801',name:'大成建設',              s17:3,s17nm:'建設・資材',    s33:'1350',s33nm:'建設業',         mkt:'プライム',scale:'TOPIX Mid400',mktcap:5000},
      {code:'1802',name:'大林組',                s17:3,s17nm:'建設・資材',    s33:'1350',s33nm:'建設業',         mkt:'プライム',scale:'TOPIX Mid400',mktcap:5500},
      {code:'1803',name:'清水建設',              s17:3,s17nm:'建設・資材',    s33:'1350',s33nm:'建設業',         mkt:'プライム',scale:'TOPIX Mid400',mktcap:4800},
      {code:'1808',name:'長谷工コーポレーション',s17:3,s17nm:'建設・資材',    s33:'1350',s33nm:'建設業',         mkt:'プライム',scale:'TOPIX Mid400',mktcap:4200},
    ],
    '食料品':[
      {code:'2914',name:'日本たばこ産業',        s17:1,s17nm:'食品',          s33:'2050',s33nm:'食料品',          mkt:'プライム',scale:'TOPIX Core30',mktcap:90000},
      {code:'2802',name:'味の素',                s17:1,s17nm:'食品',          s33:'2050',s33nm:'食料品',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:30000},
      {code:'2503',name:'キリンホールディングス',s17:1,s17nm:'食品',          s33:'2050',s33nm:'食料品',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:16000},
      {code:'2282',name:'日本ハム',              s17:1,s17nm:'食品',          s33:'2050',s33nm:'食料品',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:5500},
      {code:'2269',name:'明治ホールディングス',  s17:1,s17nm:'食品',          s33:'2050',s33nm:'食料品',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:12000},
    ],
    '繊維製品':[
      {code:'3401',name:'帝人',                  s17:4,s17nm:'素材・化学',    s33:'3050',s33nm:'繊維製品',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:3000},
      {code:'3402',name:'東レ',                  s17:4,s17nm:'素材・化学',    s33:'3050',s33nm:'繊維製品',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:7500},
      {code:'3404',name:'三菱ケミカルグループ',  s17:4,s17nm:'素材・化学',    s33:'3050',s33nm:'繊維製品',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:9000},
    ],
    'パルプ・紙':[
      {code:'3861',name:'王子ホールディングス',  s17:4,s17nm:'素材・化学',    s33:'3100',s33nm:'パルプ・紙',      mkt:'プライム',scale:'TOPIX Mid400',mktcap:4500},
      {code:'3863',name:'日本製紙',              s17:4,s17nm:'素材・化学',    s33:'3100',s33nm:'パルプ・紙',      mkt:'プライム',scale:'TOPIX Mid400',mktcap:2000},
    ],
    '化学':[
      {code:'4063',name:'信越化学工業',          s17:4,s17nm:'素材・化学',    s33:'3150',s33nm:'化学',            mkt:'プライム',scale:'TOPIX Core30',mktcap:90000},
      {code:'4183',name:'三井化学',              s17:4,s17nm:'素材・化学',    s33:'3150',s33nm:'化学',            mkt:'プライム',scale:'TOPIX Mid400',mktcap:5000},
      {code:'4188',name:'三菱ケミカルグループ',  s17:4,s17nm:'素材・化学',    s33:'3150',s33nm:'化学',            mkt:'プライム',scale:'TOPIX Mid400',mktcap:9000},
      {code:'4452',name:'花王',                  s17:4,s17nm:'素材・化学',    s33:'3150',s33nm:'化学',            mkt:'プライム',scale:'TOPIX Mid400',mktcap:28000},
    ],
    '医薬品':[
      {code:'4502',name:'武田薬品工業',          s17:5,s17nm:'医薬品・バイオ',s33:'3250',s33nm:'医薬品',          mkt:'プライム',scale:'TOPIX Core30',mktcap:60000},
      {code:'4519',name:'中外製薬',              s17:5,s17nm:'医薬品・バイオ',s33:'3250',s33nm:'医薬品',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:110000},
      {code:'4568',name:'第一三共',              s17:5,s17nm:'医薬品・バイオ',s33:'3250',s33nm:'医薬品',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:130000},
      {code:'4523',name:'エーザイ',              s17:5,s17nm:'医薬品・バイオ',s33:'3250',s33nm:'医薬品',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:11000},
      {code:'4578',name:'大塚ホールディングス',  s17:5,s17nm:'医薬品・バイオ',s33:'3250',s33nm:'医薬品',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:25000},
    ],
    '石油・石炭製品':[
      {code:'5019',name:'出光興産',              s17:2,s17nm:'エネルギー資源',s33:'3350',s33nm:'石油・石炭製品',  mkt:'プライム',scale:'TOPIX Mid400',mktcap:18000},
      {code:'5020',name:'ENEOSホールディングス', s17:2,s17nm:'エネルギー資源',s33:'3350',s33nm:'石油・石炭製品',  mkt:'プライム',scale:'TOPIX Mid400',mktcap:25000},
    ],
    'ゴム製品':[
      {code:'5108',name:'ブリヂストン',          s17:6,s17nm:'自動車・輸送機',s33:'3400',s33nm:'ゴム製品',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:35000},
      {code:'5110',name:'住友ゴム工業',          s17:6,s17nm:'自動車・輸送機',s33:'3400',s33nm:'ゴム製品',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:5000},
    ],
    'ガラス・土石製品':[
      {code:'5201',name:'AGC',                   s17:3,s17nm:'建設・資材',    s33:'3450',s33nm:'ガラス・土石製品',mkt:'プライム',scale:'TOPIX Mid400',mktcap:12000},
      {code:'5214',name:'日本電気硝子',          s17:3,s17nm:'建設・資材',    s33:'3450',s33nm:'ガラス・土石製品',mkt:'プライム',scale:'TOPIX Mid400',mktcap:5000},
    ],
    '鉄鋼':[
      {code:'5401',name:'日本製鉄',              s17:7,s17nm:'鉄鋼・非鉄',   s33:'3500',s33nm:'鉄鋼',            mkt:'プライム',scale:'TOPIX Mid400',mktcap:30000},
      {code:'5411',name:'JFEホールディングス',   s17:7,s17nm:'鉄鋼・非鉄',   s33:'3500',s33nm:'鉄鋼',            mkt:'プライム',scale:'TOPIX Mid400',mktcap:15000},
      {code:'5461',name:'中部鋼鈑',              s17:7,s17nm:'鉄鋼・非鉄',   s33:'3500',s33nm:'鉄鋼',            mkt:'プライム',scale:'TOPIX Small 1',mktcap:500},
    ],
    '非鉄金属':[
      {code:'5711',name:'三菱マテリアル',        s17:7,s17nm:'鉄鋼・非鉄',   s33:'3550',s33nm:'非鉄金属',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:6000},
      {code:'5713',name:'住友金属鉱山',          s17:7,s17nm:'鉄鋼・非鉄',   s33:'3550',s33nm:'非鉄金属',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:18000},
      {code:'5802',name:'住友電気工業',          s17:7,s17nm:'鉄鋼・非鉄',   s33:'3550',s33nm:'非鉄金属',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:16000},
    ],
    '金属製品':[
      {code:'5901',name:'東洋製罐グループHD',    s17:3,s17nm:'建設・資材',    s33:'3600',s33nm:'金属製品',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:5000},
      {code:'5938',name:'LIXIL',                 s17:3,s17nm:'建設・資材',    s33:'3600',s33nm:'金属製品',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:6000},
    ],
    '機械':[
      {code:'6301',name:'小松製作所',            s17:8,s17nm:'機械',          s33:'3650',s33nm:'機械',            mkt:'プライム',scale:'TOPIX Core30',mktcap:60000},
      {code:'6326',name:'クボタ',                s17:8,s17nm:'機械',          s33:'3650',s33nm:'機械',            mkt:'プライム',scale:'TOPIX Mid400',mktcap:50000},
      {code:'6367',name:'ダイキン工業',          s17:8,s17nm:'機械',          s33:'3650',s33nm:'機械',            mkt:'プライム',scale:'TOPIX Mid400',mktcap:80000},
      {code:'6506',name:'安川電機',              s17:8,s17nm:'機械',          s33:'3650',s33nm:'機械',            mkt:'プライム',scale:'TOPIX Mid400',mktcap:22000},
    ],
    '電気機器':[
      {code:'6758',name:'ソニーグループ',        s17:9,s17nm:'電機・精密',    s33:'3700',s33nm:'電気機器',        mkt:'プライム',scale:'TOPIX Core30',mktcap:200000},
      {code:'6861',name:'キーエンス',            s17:9,s17nm:'電機・精密',    s33:'3700',s33nm:'電気機器',        mkt:'プライム',scale:'TOPIX Core30',mktcap:160000},
      {code:'6501',name:'日立製作所',            s17:9,s17nm:'電機・精密',    s33:'3700',s33nm:'電気機器',        mkt:'プライム',scale:'TOPIX Core30',mktcap:130000},
      {code:'6702',name:'富士通',                s17:9,s17nm:'電機・精密',    s33:'3700',s33nm:'電気機器',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:50000},
      {code:'6594',name:'ニデック',              s17:9,s17nm:'電機・精密',    s33:'3700',s33nm:'電気機器',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:30000},
    ],
    '輸送用機器':[
      {code:'7203',name:'トヨタ自動車',          s17:6,s17nm:'自動車・輸送機',s33:'3750',s33nm:'輸送用機器',      mkt:'プライム',scale:'TOPIX Core30',mktcap:400000},
      {code:'7267',name:'本田技研工業',          s17:6,s17nm:'自動車・輸送機',s33:'3750',s33nm:'輸送用機器',      mkt:'プライム',scale:'TOPIX Core30',mktcap:70000},
      {code:'7201',name:'日産自動車',            s17:6,s17nm:'自動車・輸送機',s33:'3750',s33nm:'輸送用機器',      mkt:'プライム',scale:'TOPIX Mid400',mktcap:12000},
      {code:'7269',name:'スズキ',                s17:6,s17nm:'自動車・輸送機',s33:'3750',s33nm:'輸送用機器',      mkt:'プライム',scale:'TOPIX Mid400',mktcap:28000},
      {code:'7270',name:'SUBARU',                s17:6,s17nm:'自動車・輸送機',s33:'3750',s33nm:'輸送用機器',      mkt:'プライム',scale:'TOPIX Mid400',mktcap:18000},
    ],
    '精密機器':[
      {code:'7733',name:'オリンパス',            s17:9,s17nm:'電機・精密',    s33:'3800',s33nm:'精密機器',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:30000},
      {code:'7741',name:'HOYA',                  s17:9,s17nm:'電機・精密',    s33:'3800',s33nm:'精密機器',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:90000},
      {code:'7832',name:'バンダイナムコHD',      s17:9,s17nm:'電機・精密',    s33:'3800',s33nm:'精密機器',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:30000},
    ],
    'その他製品':[
      {code:'7951',name:'ヤマハ',                s17:9,s17nm:'電機・精密',    s33:'3900',s33nm:'その他製品',      mkt:'プライム',scale:'TOPIX Mid400',mktcap:9000},
      {code:'7912',name:'大日本印刷',            s17:3,s17nm:'建設・資材',    s33:'3900',s33nm:'その他製品',      mkt:'プライム',scale:'TOPIX Mid400',mktcap:10000},
      {code:'7911',name:'TOPPAN',                s17:3,s17nm:'建設・資材',    s33:'3900',s33nm:'その他製品',      mkt:'プライム',scale:'TOPIX Mid400',mktcap:10000},
    ],
    '電気・ガス業':[
      {code:'9501',name:'東京電力ホールディングス',s17:11,s17nm:'電力・ガス',  s33:'4050',s33nm:'電気・ガス業',   mkt:'プライム',scale:'TOPIX Mid400',mktcap:8000},
      {code:'9502',name:'中部電力',              s17:11,s17nm:'電力・ガス',   s33:'4050',s33nm:'電気・ガス業',   mkt:'プライム',scale:'TOPIX Mid400',mktcap:15000},
      {code:'9503',name:'関西電力',              s17:11,s17nm:'電力・ガス',   s33:'4050',s33nm:'電気・ガス業',   mkt:'プライム',scale:'TOPIX Mid400',mktcap:20000},
      {code:'9531',name:'東京ガス',              s17:11,s17nm:'電力・ガス',   s33:'4050',s33nm:'電気・ガス業',   mkt:'プライム',scale:'TOPIX Mid400',mktcap:16000},
    ],
    '陸運業':[
      {code:'9020',name:'東日本旅客鉄道',        s17:12,s17nm:'運輸・物流',   s33:'5050',s33nm:'陸運業',          mkt:'プライム',scale:'TOPIX Core30',mktcap:25000},
      {code:'9022',name:'東海旅客鉄道',          s17:12,s17nm:'運輸・物流',   s33:'5050',s33nm:'陸運業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:35000},
      {code:'9064',name:'ヤマトホールディングス',s17:12,s17nm:'運輸・物流',   s33:'5050',s33nm:'陸運業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:12000},
    ],
    '海運業':[
      {code:'9101',name:'日本郵船',              s17:12,s17nm:'運輸・物流',   s33:'5100',s33nm:'海運業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:22000},
      {code:'9104',name:'商船三井',              s17:12,s17nm:'運輸・物流',   s33:'5100',s33nm:'海運業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:18000},
      {code:'9107',name:'川崎汽船',              s17:12,s17nm:'運輸・物流',   s33:'5100',s33nm:'海運業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:8000},
    ],
    '空運業':[
      {code:'9202',name:'ANAホールディングス',   s17:12,s17nm:'運輸・物流',   s33:'5150',s33nm:'空運業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:8000},
      {code:'9201',name:'日本航空',              s17:12,s17nm:'運輸・物流',   s33:'5150',s33nm:'空運業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:11000},
    ],
    '倉庫・運輸関連業':[
      {code:'9301',name:'三菱倉庫',              s17:12,s17nm:'運輸・物流',   s33:'5200',s33nm:'倉庫・運輸関連業',mkt:'プライム',scale:'TOPIX Mid400',mktcap:4000},
      {code:'9302',name:'三井倉庫ホールディングス',s17:12,s17nm:'運輸・物流', s33:'5200',s33nm:'倉庫・運輸関連業',mkt:'プライム',scale:'TOPIX Mid400',mktcap:2000},
    ],
    '情報・通信業':[
      {code:'9432',name:'日本電信電話',          s17:10,s17nm:'IT・サービス他',s33:'5250',s33nm:'情報・通信業',   mkt:'プライム',scale:'TOPIX Core30',mktcap:130000},
      {code:'9433',name:'KDDI',                  s17:10,s17nm:'IT・サービス他',s33:'5250',s33nm:'情報・通信業',   mkt:'プライム',scale:'TOPIX Core30',mktcap:100000},
      {code:'9984',name:'ソフトバンクグループ',  s17:10,s17nm:'IT・サービス他',s33:'5250',s33nm:'情報・通信業',   mkt:'プライム',scale:'TOPIX Core30',mktcap:120000},
      {code:'4689',name:'LYコーポレーション',    s17:10,s17nm:'IT・サービス他',s33:'5250',s33nm:'情報・通信業',   mkt:'プライム',scale:'TOPIX Mid400',mktcap:12000},
      {code:'4755',name:'楽天グループ',          s17:10,s17nm:'IT・サービス他',s33:'5250',s33nm:'情報・通信業',   mkt:'プライム',scale:'TOPIX Mid400',mktcap:14000},
    ],
    '卸売業':[
      {code:'8058',name:'三菱商事',              s17:13,s17nm:'商社・卸売',   s33:'6050',s33nm:'卸売業',          mkt:'プライム',scale:'TOPIX Core30',mktcap:180000},
      {code:'8031',name:'三井物産',              s17:13,s17nm:'商社・卸売',   s33:'6050',s33nm:'卸売業',          mkt:'プライム',scale:'TOPIX Core30',mktcap:150000},
      {code:'8001',name:'伊藤忠商事',            s17:13,s17nm:'商社・卸売',   s33:'6050',s33nm:'卸売業',          mkt:'プライム',scale:'TOPIX Core30',mktcap:150000},
      {code:'8002',name:'丸紅',                  s17:13,s17nm:'商社・卸売',   s33:'6050',s33nm:'卸売業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:30000},
      {code:'8053',name:'住友商事',              s17:13,s17nm:'商社・卸売',   s33:'6050',s33nm:'卸売業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:40000},
    ],
    '小売業':[
      {code:'3382',name:'セブン＆アイ・ホールディングス',s17:14,s17nm:'小売', s33:'6100',s33nm:'小売業',          mkt:'プライム',scale:'TOPIX Core30',mktcap:60000},
      {code:'8267',name:'イオン',                s17:14,s17nm:'小売',         s33:'6100',s33nm:'小売業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:25000},
      {code:'3088',name:'マツキヨHD',            s17:14,s17nm:'小売',         s33:'6100',s33nm:'小売業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:14000},
      {code:'2651',name:'ローソン',              s17:14,s17nm:'小売',         s33:'6100',s33nm:'小売業',          mkt:'プライム',scale:'TOPIX Mid400',mktcap:20000},
    ],
    '銀行業':[
      {code:'8306',name:'三菱UFJフィナンシャル・グループ',s17:15,s17nm:'銀行',s33:'7050',s33nm:'銀行業',         mkt:'プライム',scale:'TOPIX Core30',mktcap:230000},
      {code:'8316',name:'三井住友フィナンシャルグループ',  s17:15,s17nm:'銀行',s33:'7050',s33nm:'銀行業',         mkt:'プライム',scale:'TOPIX Core30',mktcap:120000},
      {code:'8411',name:'みずほフィナンシャルグループ',    s17:15,s17nm:'銀行',s33:'7050',s33nm:'銀行業',         mkt:'プライム',scale:'TOPIX Core30',mktcap:60000},
      {code:'8308',name:'りそなホールディングス',          s17:15,s17nm:'銀行',s33:'7050',s33nm:'銀行業',         mkt:'プライム',scale:'TOPIX Mid400',mktcap:25000},
      {code:'8309',name:'三井住友トラスト・ホールディングス',s17:15,s17nm:'銀行',s33:'7050',s33nm:'銀行業',      mkt:'プライム',scale:'TOPIX Mid400',mktcap:18000},
    ],
    '証券、商品先物取引業':[
      {code:'8601',name:'大和証券グループ本社',  s17:16,s17nm:'金融（除く銀行）',s33:'7100',s33nm:'証券、商品先物取引業',mkt:'プライム',scale:'TOPIX Mid400',mktcap:8000},
      {code:'8604',name:'野村ホールディングス',  s17:16,s17nm:'金融（除く銀行）',s33:'7100',s33nm:'証券、商品先物取引業',mkt:'プライム',scale:'TOPIX Mid400',mktcap:20000},
    ],
    '保険業':[
      {code:'8725',name:'MS&ADインシュアランス',s17:16,s17nm:'金融（除く銀行）',s33:'7150',s33nm:'保険業',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:35000},
      {code:'8750',name:'第一生命ホールディングス',s17:16,s17nm:'金融（除く銀行）',s33:'7150',s33nm:'保険業',     mkt:'プライム',scale:'TOPIX Mid400',mktcap:25000},
      {code:'8766',name:'東京海上ホールディングス',s17:16,s17nm:'金融（除く銀行）',s33:'7150',s33nm:'保険業',    mkt:'プライム',scale:'TOPIX Mid400',mktcap:80000},
    ],
    'その他金融業':[
      {code:'8591',name:'オリックス',            s17:16,s17nm:'金融（除く銀行）',s33:'7200',s33nm:'その他金融業',mkt:'プライム',scale:'TOPIX Mid400',mktcap:50000},
      {code:'8697',name:'日本取引所グループ',    s17:16,s17nm:'金融（除く銀行）',s33:'7200',s33nm:'その他金融業',mkt:'プライム',scale:'TOPIX Mid400',mktcap:15000},
    ],
    '不動産業':[
      {code:'8801',name:'三井不動産',            s17:17,s17nm:'不動産',        s33:'8050',s33nm:'不動産業',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:30000},
      {code:'8802',name:'三菱地所',              s17:17,s17nm:'不動産',        s33:'8050',s33nm:'不動産業',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:30000},
      {code:'8830',name:'住友不動産',            s17:17,s17nm:'不動産',        s33:'8050',s33nm:'不動産業',        mkt:'プライム',scale:'TOPIX Mid400',mktcap:28000},
    ],
    'サービス業':[
      {code:'6098',name:'リクルートホールディングス',s17:10,s17nm:'IT・サービス他',s33:'9050',s33nm:'サービス業', mkt:'プライム',scale:'TOPIX Core30',mktcap:130000},
      {code:'9021',name:'西日本旅客鉄道',        s17:12,s17nm:'運輸・物流',   s33:'9050',s33nm:'サービス業',      mkt:'プライム',scale:'TOPIX Mid400',mktcap:18000},
      {code:'2371',name:'カカクコム',            s17:10,s17nm:'IT・サービス他',s33:'9050',s33nm:'サービス業',     mkt:'プライム',scale:'TOPIX Mid400',mktcap:8000},
      {code:'6619',name:'W-SCOPE CORPORATION',   s17:10,s17nm:'IT・サービス他',s33:'9050',s33nm:'サービス業',     mkt:'プライム',scale:'TOPIX Small 1',mktcap:200},
    ],
  }
};
const STOCK_LIST=DASHBOARD_DATA?.stock_list || SAMPLE_STOCK_LIST;
function _sampleStocksFromStockList(stockList){
  const bySector=Object.fromEntries(
    Object.entries(stockList?.by_sector||{}).map(([sector, rows])=>[
      sector,
      rows.map(r=>({
        code:r.code,
        name:r.name,
        score:null,
        rank:null,
        dy:null,
        pbr:null,
        per:null,
        price:null,
        cap:r.mktcap ?? null,
        steps:[0,0,0,0,0,0,0],
      }))
    ])
  );
  return {
    as_of: stockList?.as_of || SAMPLE_STOCKS.as_of,
    by_sector: bySector,
  };
}
const STOCKS=DASHBOARD_DATA?.stocks || _sampleStocksFromStockList(SAMPLE_STOCK_LIST);
// 有償会員アクセス制御
// static site のため完全秘匿はできないが、bundle には平文キーを持たせず
// PBKDF2 ハッシュ比較 + sessionStorage 保存に寄せる。
const MEMBER_AUTH_STORAGE_KEY='jpxMemberAuthToken';
const MEMBER_KEY_HASH=DASHBOARD_DATA?.member_key_hash || '';
const MEMBER_KEY_SALT=DASHBOARD_DATA?.member_key_salt || 'jpx-v6-member-auth';
const MEMBER_KEY_ITERATIONS=Number(DASHBOARD_DATA?.member_key_iterations || 120000);
const MEMBER_KEY=DASHBOARD_DATA ? (DASHBOARD_DATA.member_key || '') : 'demo';

function _memberStorage(){
  return window.sessionStorage;
}
function _legacyMemberStorage(){
  return window.localStorage;
}
function _readMemberToken(){
  try{
    const current=_memberStorage().getItem(MEMBER_AUTH_STORAGE_KEY);
    if(current) return current;
  }catch(_e){}
  try{
    const legacy=_legacyMemberStorage().getItem('jpxMemberAuth');
    if(legacy===MEMBER_KEY || legacy===MEMBER_KEY_HASH){
      _legacyMemberStorage().removeItem('jpxMemberAuth');
      if(legacy===MEMBER_KEY_HASH){
        _memberStorage().setItem(MEMBER_AUTH_STORAGE_KEY, legacy);
        return legacy;
      }
    }
  }catch(_e){}
  return null;
}
function isMemberAuthorized(){
  if(!DASHBOARD_DATA) return false;
  if(MEMBER_KEY_HASH){
    return _readMemberToken()===MEMBER_KEY_HASH;
  }
  if(!MEMBER_KEY) return false;
  return _readMemberToken()===MEMBER_KEY;
}
async function _deriveMemberKeyHash(input){
  const enc=new TextEncoder();
  const keyMaterial=await crypto.subtle.importKey(
    'raw',
    enc.encode(input),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits=await crypto.subtle.deriveBits(
    {name:'PBKDF2',salt:enc.encode(MEMBER_KEY_SALT),iterations:MEMBER_KEY_ITERATIONS,hash:'SHA-256'},
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// ────── state ──────
let fCat='all', fPbr='all', fChgMin=-1, fSearch='';
let _screenSort={key:'code',asc:true};
let notes=[], evNotes={};
let charts={};
let evCharts={bar:null,shr:null};
let currentEv=0;
let chartMode='chartjs';
let themeMode='dark';

function getUrlParam(name){
  try{
    const params=new URLSearchParams(window.location.search);
    return params.get(name);
  }catch(_e){
    return null;
  }
}

const GC={color:'rgba(255,255,255,0)',border:'rgba(255,255,255,0)',
  responsive:true,maintainAspectRatio:false,
  plugins:{legend:{labels:{color:'#6b7491',font:{size:11},usePointStyle:true}}},
  scales:{
    x:{ticks:{color:'#6b7491',font:{size:10}},grid:{color:'rgba(255,255,255,.04)'}},
    y:{ticks:{color:'#6b7491',font:{size:10}},grid:{color:'rgba(255,255,255,.04)'}}
  }
};
function syncChartDefaults(){
  GC.plugins.legend.labels.color = chartTickColor();
  GC.scales.x.ticks.color = chartTickColor();
  GC.scales.y.ticks.color = chartTickColor();
  GC.scales.x.grid.color = chartGridColor();
  GC.scales.y.grid.color = chartGridColor();
}
// テーマ切り替え時に既存チャートインスタンスの色を一括更新
function refreshChartColors(){
  const tick=chartTickColor(),label=chartLabelColor(),grid=chartGridColor();
  const gridS=chartGridColorSoft(),blue=accentBlue(),amber=accentAmber();
  const ciColor=themeMode==='light'?'#0f9f6e':'#29c99a';
  function _upd(ch,xCol,yCol,extra){
    if(!ch) return;
    const s=ch.options.scales;
    if(ch.options.plugins?.legend?.labels) ch.options.plugins.legend.labels.color=tick;
    if(s?.x?.ticks) s.x.ticks.color=xCol;
    if(s?.x?.grid) s.x.grid.color=grid;
    if(s?.y?.ticks) s.y.ticks.color=yCol;
    if(extra) extra(ch.options,s);
    ch.update('none');
  }
  _upd(charts.trend,tick,tick);
  _upd(charts.valTrend,tick,blue,(_,s)=>{if(s?.y2?.ticks) s.y2.ticks.color=amber;});
  _upd(charts.indRank,tick,label);
  _upd(charts.decomp,tick,label);
  _upd(charts.zscore,tick,label);
  _upd(charts.cyclePhase,tick,ciColor,(_,s)=>{
    if(s?.y?.title) s.y.title.color=tick;
    if(s?.y?.grid) s.y.grid.color=grid;
    if(s?.x?.grid) s.x.grid.color=gridS;
    if(s?.y2?.ticks) s.y2.ticks.color=amber;
  });
  _upd(charts.cdRatio,tick,tick,(_,s)=>{
    if(s?.y?.title) s.y.title.color=tick;
    if(s?.y?.grid) s.y.grid.color=grid;
  });
  _upd(charts.heatLine,tick,tick);
  _upd(charts.decompCap,tick,label);
  _upd(charts.decompNav,tick,label);
  _upd(charts.decompCapLine,tick,tick);
  _upd(charts.decompNavLine,tick,tick);
  _upd(charts.perTrend,tick,amber,(_,s)=>{
    if(s?.y?.title) s.y.title.color=tick;
  });
  _upd(charts.perSector,tick,tick,(_,s)=>{
    if(s?.y?.title) s.y.title.color=tick;
  });
}


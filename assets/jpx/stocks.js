// ────── 銘柄一覧 ──────
let _stocksInited = false;
let _selectedSector = null;
let _stocksSortState = { key: 'score', asc: false };
let _stocksSearchVal = '';
let _stocksRankFilter = 'all';
let _stocksStepMin = 0;
let _stocksCarryover = '';
let _stocksPage = 1;
let _stocksPageSize = 50;
let _stocksFilteredCount = 0;

// ── 会員認証 ──────────────────────────────────────────
function _isMember() {
  return isMemberAuthorized();
}

function showMemberLogin() { window.MacanaMembers?.loginDialog(); }
function _doMemberLogout() { window.MacanaMembers?.logout(); }

function _updateMemberUI() {
  const member = _isMember();
  const badge = document.getElementById('stocksMemberBadge');
  const lockBtn = document.getElementById('stocksLockBtn');
  if (badge) badge.style.display = member ? 'inline' : 'none';
  if (lockBtn) {
    lockBtn.textContent = member ? '🔓 会員メニュー' : '🔒 会員ログイン';
    lockBtn.title = member
      ? 'ログイン中。クリックでメニューを表示。'
      : 'スコア・ランク・ステップ通過は有償会員限定の情報です。';
  }
  if(typeof updateDataModePill==='function') updateDataModePill();
  if(typeof updateNotesAccessUI==='function') updateNotesAccessUI();
  if(typeof updateCsvExportUI==='function') updateCsvExportUI();
}

// ── 初期化 ─────────────────────────────────────────────
function initStocks() {
  if (_stocksInited) return;
  _stocksInited = true;

  _setAsOfLabel(STOCKS.as_of);
  _buildSectorPills(STOCKS);
  _updateMemberUI();
  _updateCarryoverHint();
  _renderStocksTable();
}
function _findEvalSectorFromStockList(sector) {
  if (!sector) return null;
  const sectors = Object.keys(STOCKS.by_sector || {});
  return sectors.includes(sector) ? sector : null;
}
function _updateCarryoverHint() {
  const el = document.getElementById('stocksCarryoverHint');
  if (!el) return;
  if (!_stocksCarryover) {
    el.style.display = 'none';
    el.textContent = '';
    return;
  }
  el.style.display = '';
  el.textContent = _stocksCarryover;
}
function _applyEvalFilters({ sector = null, search = '', carryover = '' } = {}) {
  _selectedSector = _findEvalSectorFromStockList(sector);
  _stocksSearchVal = search || '';
  _stocksRankFilter = 'all';
  _stocksStepMin = 0;
  _stocksCarryover = carryover || '';
  _stocksPage = 1;

  const searchEl = document.getElementById('stocksSearch');
  const rankEl = document.getElementById('stocksRankSel');
  const stepEl = document.getElementById('stocksStepSel');
  if (searchEl) searchEl.value = _stocksSearchVal;
  if (rankEl) rankEl.value = 'all';
  if (stepEl) stepEl.value = '0';

  document.querySelectorAll('#stocksSectorPills span').forEach(p => {
    const active = _selectedSector ? p.dataset.sector === _selectedSector : p.dataset.sector === '';
    _setPillActive(p, active);
  });
  _updateCarryoverHint();
  _renderStocksTable();
}
function applyStockListToEval() {
  goto('eval', null, true);
  const parts = [];
  if (_slSector) parts.push(`業種: ${_slSector}`);
  if (_slSearchVal) parts.push(`検索: ${_slSearchVal}`);
  _applyEvalFilters({
    sector: _slSector,
    search: _slSearchVal,
    carryover: parts.length ? `銘柄一覧から反映: ${parts.join(' / ')}` : '銘柄一覧から反映: 現在の絞り込み'
  });
}
function openEvalForStock(code, sector, name) {
  goto('eval', null, true);
  _applyEvalFilters({
    sector,
    search: code,
    carryover: `銘柄一覧から反映: ${name}（${code}）`
  });
}

function _setAsOfLabel(asOf) {
  const el = document.getElementById('stocksAsOf');
  if (!el) return;
  el.textContent = asOf ? `評価日: ${asOf}` : '評価日: 不明';
  el.title = '直近スクリーニング実行時点の評価結果（年月セレクターとは連動しません）';
}

// ── 業種ピル ────────────────────────────────────────────
function _buildSectorPills(data) {
  const container = document.getElementById('stocksSectorPills');
  if (!container) return;
  const sectors = Object.keys(data.by_sector || {});
  container.appendChild(_makePill('すべて', null));
  sectors.forEach(sec => container.appendChild(_makePill(sec, sec)));
}

function _makePill(label, sector) {
  const pill = document.createElement('span');
  pill.textContent = label;
  pill.dataset.sector = sector || '';
  pill.style.cssText = 'display:inline-block;padding:3px 10px;border-radius:99px;font-size:10px;cursor:pointer;border:1px solid var(--border2);transition:.15s';
  _setPillActive(pill, sector === _selectedSector || (sector === null && _selectedSector === null));
  pill.addEventListener('click', () => {
    _selectedSector = sector;
    _stocksCarryover = '';
    _stocksPage = 1;
    document.querySelectorAll('#stocksSectorPills span').forEach(p => {
      _setPillActive(p, p.dataset.sector === (sector || ''));
    });
    _updateCarryoverHint();
    _renderStocksTable();
  });
  return pill;
}

function _setPillActive(pill, active) {
  pill.style.background = active ? 'var(--accent)' : 'var(--bg4)';
  pill.style.color = active ? '#fff' : 'var(--muted)';
  pill.style.borderColor = active ? 'var(--accent)' : 'var(--border2)';
}

// ── フィルター・ソート ───────────────────────────────────
function filterStocksTable() {
  _stocksSearchVal = (document.getElementById('stocksSearch')?.value || '').toLowerCase();
  _stocksRankFilter = document.getElementById('stocksRankSel')?.value || 'all';
  _stocksStepMin = parseInt(document.getElementById('stocksStepSel')?.value || '0', 10);
  _stocksCarryover = '';
  _stocksPage = 1;
  _updateCarryoverHint();
  _renderStocksTable();
}

function _stocksSort(key) {
  if (_stocksSortState.key === key) {
    _stocksSortState.asc = !_stocksSortState.asc;
  } else {
    _stocksSortState.key = key;
    _stocksSortState.asc = key === 'code' || key === 'name';
  }
  _renderStocksTable();
}

function changeStocksPageSize(value) {
  const size = parseInt(value, 10);
  if (![50, 100, 300].includes(size)) return;
  _stocksPageSize = size;
  _stocksPage = 1;
  _renderStocksTable();
}

function changeStocksPage(delta) {
  const pageCount = Math.max(1, Math.ceil(_stocksFilteredCount / _stocksPageSize));
  _stocksPage = Math.max(1, Math.min(pageCount, _stocksPage + delta));
  _renderStocksTable();
}

// ── テーブル描画 ────────────────────────────────────────
function _renderStocksTable() {
  const tbody = document.getElementById('stocksTbody');
  const emptyEl = document.getElementById('stocksEmpty');
  if (!tbody) return;

  const bySector = STOCKS.by_sector || {};
  const sectorKeys = _selectedSector ? [_selectedSector] : Object.keys(bySector);

  let rows = [];
  sectorKeys.forEach(sec => {
    (bySector[sec] || []).forEach(s => rows.push({ ...s, sector: sec }));
  });

  if (_stocksStepMin > 0) {
    rows = rows.filter(r => {
      const steps = r.steps || [];
      for (let i = 0; i < _stocksStepMin; i++) {
        if (!steps[i]) return false;
      }
      return true;
    });
  }
  if (_stocksSearchVal) {
    rows = rows.filter(r =>
      r.name.toLowerCase().includes(_stocksSearchVal) ||
      r.code.includes(_stocksSearchVal)
    );
  }
  if (_stocksRankFilter !== 'all') {
    rows = rows.filter(r => r.rank === _stocksRankFilter);
  }

  const { key, asc } = _stocksSortState;
  rows.sort((a, b) => {
    const av = a[key] ?? (asc ? Infinity : -Infinity);
    const bv = b[key] ?? (asc ? Infinity : -Infinity);
    if (typeof av === 'string') return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    return asc ? av - bv : bv - av;
  });

  const badge = document.getElementById('nb-eval');
  if (badge) badge.textContent = rows.length || '';
  _stocksFilteredCount = rows.length;
  const pageCount = Math.max(1, Math.ceil(rows.length / _stocksPageSize));
  _stocksPage = Math.min(_stocksPage, pageCount);
  const start = rows.length ? (_stocksPage - 1) * _stocksPageSize : 0;
  const pageRows = rows.slice(start, start + _stocksPageSize);
  const pageStatus = document.getElementById('stocksPageStatus');
  const prevButton = document.getElementById('stocksPrevPage');
  const nextButton = document.getElementById('stocksNextPage');
  if (pageStatus) pageStatus.textContent = rows.length
    ? `${(start + 1).toLocaleString()}–${Math.min(start + _stocksPageSize, rows.length).toLocaleString()} / ${rows.length.toLocaleString()}件（${_stocksPage} / ${pageCount}ページ）`
    : '0件';
  if (prevButton) prevButton.disabled = _stocksPage <= 1 || rows.length === 0;
  if (nextButton) nextButton.disabled = _stocksPage >= pageCount || rows.length === 0;

  if (rows.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  tbody.innerHTML = pageRows.map(r => _stocksRow(r)).join('');
}

function _stocksRow(r) {
  const member = _isMember();

  // 会員限定セル
  const _lock = (content, hint) => member
    ? content
    : `<span style="color:var(--border2);font-size:10px" title="${hint || '有償会員限定の情報です'}">🔒</span>`;

  // スコア
  const score = Number(r.score);
  const scoreCell = _lock(
    `<span style="font-family:var(--mono);color:var(--accent)">${r.score != null && Number.isFinite(score) ? score.toFixed(1) : '–'}</span>`,
    '総合スコアは有償会員限定です'
  );

  // ランク
  const rankColor = { S: '#f5a623', A: '#29c99a', B: '#5b8df6', C: '#9b7fe8', D: '#6b7491' }[r.rank] || '#6b7491';
  const rankCell = _lock(
    `<span style="padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;background:${rankColor}22;color:${rankColor}">${r.rank ?? '–'}</span>`,
    'ランク評価は有償会員限定です'
  );

  // ステップ通過
  const stepsHtml = (r.steps || []).map((v, i) =>
    `<span title="Step${i + 1}" style="display:inline-block;width:14px;height:14px;border-radius:2px;font-size:9px;line-height:14px;text-align:center;background:${v ? '#29c99a22' : '#ff000022'};color:${v ? '#29c99a' : '#f87171'}">${i + 1}</span>`
  ).join('');
  const stepsCell = _lock(stepsHtml,'ステップ通過状況は有償会員限定です');

  const dy = r.dy != null ? r.dy.toFixed(1) + '%' : '–';
  const pbr = r.pbr != null ? r.pbr.toFixed(2) + 'x' : '–';
  const per = r.per != null ? r.per.toFixed(1) + 'x' : '–';
  const price = r.price != null ? (+r.price).toLocaleString() : '–';
  const cap = r.cap != null ? (+r.cap).toFixed(0) : '–';

  return `<tr style="border-bottom:1px solid var(--border);line-height:2">
    <td style="padding:4px 8px;font-family:var(--mono);color:var(--muted)">${r.code}</td>
    <td style="padding:4px 8px;color:var(--text)">${r.name}<span style="font-size:9px;color:var(--hint);margin-left:4px">${r.sector}</span></td>
    <td style="padding:4px 8px;text-align:right">${scoreCell}</td>
    <td style="padding:4px 8px;text-align:center">${rankCell}</td>
    <td style="padding:4px 8px;text-align:right;font-family:var(--mono);color:var(--purple)">${dy}</td>
    <td style="padding:4px 8px;text-align:right;font-family:var(--mono)">${pbr}</td>
    <td style="padding:4px 8px;text-align:right;font-family:var(--mono)">${per}</td>
    <td style="padding:4px 8px;text-align:right;font-family:var(--mono)">${price}</td>
    <td style="padding:4px 8px;text-align:right;font-family:var(--mono)">${cap}</td>
    <td style="padding:4px 8px;text-align:center;white-space:nowrap">${stepsCell}</td>
  </tr>`;
}

// ════════════════════════════════════════════════════════
// 銘柄一覧 (上場銘柄マスター ベース)
// ════════════════════════════════════════════════════════
let _slInited = false;
let _slSector = null;
let _slSortState = { key: 'code', asc: true };
let _slSearchVal = '';
let _slMktFilter = 'all';
let _slScaleFilter = 'all';
let _slRows = [];  // フィルター前の全行キャッシュ

function initStockList() {
  if (_slInited) return;
  _slInited = true;

  const data = STOCK_LIST;
  const isSample = !DASHBOARD_DATA?.stock_list;
  const asOfEl = document.getElementById('slAsOf');
  if (asOfEl && data.as_of) asOfEl.textContent = `マスタ取得日: ${data.as_of}`;
  const noticeEl = document.getElementById('slSampleNotice');
  if (noticeEl) noticeEl.style.display = isSample ? '' : 'none';

  // 全行を事前展開してキャッシュ
  _slRows = [];
  const bySector = data.by_sector || {};
  Object.keys(bySector).forEach(sec => {
    (bySector[sec] || []).forEach(s => _slRows.push({ ...s, sector: sec }));
  });

  _slBuildSectorPills(Object.keys(bySector));
  _slRenderTable();
}

function _slBuildSectorPills(sectors) {
  const container = document.getElementById('slSectorPills');
  if (!container) return;
  container.appendChild(_slMakePill('すべて', null));
  sectors.forEach(sec => container.appendChild(_slMakePill(sec, sec)));
}

function _slMakePill(label, sector) {
  const pill = document.createElement('span');
  pill.textContent = label;
  pill.dataset.sector = sector || '';
  pill.style.cssText = 'display:inline-block;padding:3px 10px;border-radius:99px;font-size:10px;cursor:pointer;border:1px solid var(--border2);transition:.15s';
  _slSetPillActive(pill, sector === _slSector || (sector === null && _slSector === null));
  pill.addEventListener('click', () => {
    _slSector = sector;
    document.querySelectorAll('#slSectorPills span').forEach(p => {
      _slSetPillActive(p, p.dataset.sector === (sector || ''));
    });
    _slRenderTable();
  });
  return pill;
}

function _slSetPillActive(pill, active) {
  pill.style.background = active ? 'var(--accent)' : 'var(--bg4)';
  pill.style.color = active ? '#fff' : 'var(--muted)';
  pill.style.borderColor = active ? 'var(--accent)' : 'var(--border2)';
}

function filterStockList() {
  _slSearchVal = (document.getElementById('slSearch')?.value || '').toLowerCase();
  _slMktFilter = document.getElementById('slMktSel')?.value || 'all';
  _slScaleFilter = document.getElementById('slScaleSel')?.value || 'all';
  _slRenderTable();
}

function slSort(key) {
  if (_slSortState.key === key) {
    _slSortState.asc = !_slSortState.asc;
  } else {
    _slSortState.key = key;
    _slSortState.asc = true;
  }
  _slRenderTable();
}

function _slRenderTable() {
  const tbody = document.getElementById('slTbody');
  const emptyEl = document.getElementById('slEmpty');
  const countEl = document.getElementById('slCount');
  if (!tbody) return;

  let rows = _slSector
    ? _slRows.filter(r => r.sector === _slSector)
    : [..._slRows];

  if (_slMktFilter !== 'all') rows = rows.filter(r => r.mkt === _slMktFilter);
  if (_slScaleFilter !== 'all') rows = rows.filter(r => r.scale === _slScaleFilter);
  if (_slSearchVal) {
    rows = rows.filter(r =>
      r.name.toLowerCase().includes(_slSearchVal) ||
      (r.s33nm || '').toLowerCase().includes(_slSearchVal) ||
      (r.s17nm || '').toLowerCase().includes(_slSearchVal) ||
      r.code.includes(_slSearchVal)
    );
  }

  const _slNumericKeys = new Set(['s17', 'mktcap']);
  const { key, asc } = _slSortState;
  rows.sort((a, b) => {
    if (_slNumericKeys.has(key)) {
      const av = a[key] ?? (asc ? Infinity : -Infinity);
      const bv = b[key] ?? (asc ? Infinity : -Infinity);
      return asc ? av - bv : bv - av;
    }
    const av = (a[key] ?? '').toString();
    const bv = (b[key] ?? '').toString();
    return asc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  // バッジ更新
  const badge = document.getElementById('nb-stocklist');
  if (badge) badge.textContent = rows.length || '';

  if (rows.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    if (countEl) countEl.textContent = '';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  if (countEl) countEl.textContent = `${rows.length.toLocaleString()} 銘柄`;

  tbody.innerHTML = rows.map(r => _slRow(r)).join('');
}

function _slRow(r) {
  const mktColor = {
    'プライム': 'var(--accent)', 'スタンダード': 'var(--green)',
    'グロース': 'var(--amber)', 'TOKYO PRO MARKET': 'var(--muted)'
  }[r.mkt] || 'var(--hint)';

  const scaleBadge = r.scale && r.scale !== '-'
    ? `<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:var(--bg3);color:var(--hint)">${r.scale.replace('TOPIX ', '')}</span>`
    : '<span style="color:var(--border2)">–</span>';

  const mktcapCell = r.mktcap != null
    ? r.mktcap.toLocaleString()
    : '<span style="color:var(--border2)">–</span>';
  const yfUrl = `https://finance.yahoo.co.jp/quote/${r.code}.T`;
  const safeSector = (r.sector || '').replace(/'/g, "\\'");
  const safeName = (r.name || '').replace(/'/g, "\\'");

  return `<tr style="border-bottom:1px solid var(--border);line-height:2">
    <td style="padding:4px 8px;font-family:var(--mono);color:var(--muted);white-space:nowrap">${r.code}</td>
    <td style="padding:4px 8px;color:var(--text);white-space:nowrap;width:220px;max-width:220px;overflow:hidden;text-overflow:ellipsis">${r.name}</td>
    <td style="padding:4px 8px;text-align:right;font-family:var(--mono);color:var(--hint)">${r.s17 || '–'}</td>
    <td style="padding:4px 8px;color:var(--muted);white-space:nowrap;font-size:10px">${r.s17nm || '–'}</td>
    <td style="padding:4px 8px;text-align:right;font-family:var(--mono);color:var(--hint)">${r.s33 || '–'}</td>
    <td style="padding:4px 8px;color:var(--muted);white-space:nowrap;font-size:10px">${r.s33nm || '–'}</td>
    <td style="padding:4px 8px;white-space:nowrap">
      <span style="font-size:10px;color:${mktColor}">${r.mkt || '–'}</span></td>
    <td style="padding:4px 8px">${scaleBadge}</td>
    <td style="padding:4px 8px;text-align:right;font-family:var(--mono);font-size:11px;color:var(--text)">${mktcapCell}</td>
    <td style="padding:4px 8px;text-align:center">
      <a href="${yfUrl}" target="_blank" rel="noopener"
         style="font-size:10px;padding:1px 6px;border-radius:3px;background:var(--bg3);color:var(--accent);text-decoration:none;border:1px solid var(--border2)">↗</a>
    </td>
    <td style="padding:4px 8px;text-align:center">
      <button onclick="openEvalForStock('${r.code}','${safeSector}','${safeName}')"
        style="font-size:10px;padding:1px 6px;border-radius:3px;background:var(--bg3);color:var(--green);border:1px solid var(--border2);cursor:pointer">評価</button>
    </td>
  </tr>`;
}

_updateMemberUI();

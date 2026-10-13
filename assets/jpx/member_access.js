// Private data is fetched only after the server verifies the account and membership.
(function () {
  'use strict';
  const config = window.JPX_DASHBOARD_PUBLIC_CONFIG?.auth || {};
  const sessionKey = 'macanaMemberSessionV1';
  let authorized = false;
  let expiry = 0;
  let session = null;
  function clearSession() {
    session = null;
    authorized = false;
    window.JPX_DASHBOARD_DATA = null;
    try { sessionStorage.removeItem(sessionKey); } catch (_) {}
  }
  function readSession() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(sessionKey));
      if (saved?.url === config.url && typeof saved.access_token === 'string' && saved.expires_at * 1000 > Date.now()) return saved;
    } catch (_) {}
    return null;
  }
  const configured = () => /^https:\/\//.test(config.url || '') && !!config.publishable_key;
  async function authRequest(path, body) {
    const response = await fetch(config.url + '/auth/v1/' + path, {
      method: 'POST', headers: {apikey: config.publishable_key, 'Content-Type': 'application/json'},
      body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('認証できませんでした。入力内容を確認し、時間をおいてお試しください。');
    return response.json();
  }
  async function loadMemberData(token, visit = false) {
    const headers = {apikey: config.publishable_key, Authorization: 'Bearer ' + token};
    if (visit) headers['X-Macana-Visit'] = 'open';  // counted as a dashboard open; rechecks are not
    const response = await fetch(config.url + '/functions/v1/member-dashboard', {
      headers,
      cache: 'no-store', signal: AbortSignal.timeout(20000),
    });
    if (response.status === 401) throw new Error('ログインの有効期限が切れました。再ログインしてください。');
    if (response.status === 403) throw new Error('有効な会員資格が確認できません。会員期限をご確認ください。');
    if (!response.ok) throw new Error('会員データを取得できません。時間をおいてお試しください。');
    const data = await response.json();
    const memberExpiry = Date.parse(data._access?.valid_until || '');
    if (!Number.isFinite(memberExpiry) || memberExpiry <= Date.now() || !Array.isArray(data.months)) throw new Error('会員データの確認に失敗しました。');
    expiry = Math.min(memberExpiry, session.expires_at * 1000);
    return data;
  }
  function message(text) {
    const node = document.getElementById('memberLoginMsg');
    if (node) node.textContent = text;
  }
  function loginDialog() {
    let dialog = document.getElementById('memberLoginDlg');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'memberLoginDlg';
      dialog.className = 'sector-dlg';
      dialog.style.maxWidth = '380px';
      dialog.style.margin = 'auto';
      const title = document.createElement('h3');
      title.textContent = '会員ログイン';
      dialog.appendChild(title);
      const description = document.createElement('p');
      description.textContent = '登録済みのメールアドレスへ確認コードを送信します。';
      dialog.appendChild(description);
      for (const [id, type, label] of [['memberEmailInput', 'email', 'メールアドレス'], ['memberCodeInput', 'text', '確認コード']]) {
        const wrapper = document.createElement('label');
        wrapper.textContent = label;
        wrapper.style.display = 'block';
        const input = document.createElement('input');
        input.id = id;
        input.type = type;
        input.autocomplete = type === 'email' ? 'email' : 'one-time-code';
        input.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin:8px 0;padding:8px';
        wrapper.appendChild(input);
        dialog.appendChild(wrapper);
      }
      const status = document.createElement('p');
      status.id = 'memberLoginMsg';
      status.setAttribute('role', 'status');
      dialog.appendChild(status);
      const buttons = [['コード送信', sendCode], ['ログイン', verifyCode], ['ログアウト', logout], ['閉じる', () => dialog.close()]];
      for (const [label, handler] of buttons) {
        const button = document.createElement('button');
        button.className = 'tb-btn';
        button.type = 'button';
        button.textContent = label;
        button.dataset.memberAction = handler === logout ? 'logout' : handler === sendCode ? 'send' : handler === verifyCode ? 'verify' : 'close';
        button.addEventListener('click', async () => {
          button.disabled = true;
          try { await handler(); } catch (err) { message(err.message || '通信に失敗しました。'); }
          finally { button.disabled = false; }
        });
        dialog.appendChild(button);
      }
      document.body.appendChild(dialog);
    }
    for (const button of dialog.querySelectorAll('button')) {
      const action = button.dataset.memberAction;
      button.hidden = action === 'logout' ? !authorized : authorized && ['send', 'verify'].includes(action);
      button.disabled = ['send', 'verify'].includes(action) && !configured();
    }
    for (const label of dialog.querySelectorAll('label')) label.hidden = authorized;
    dialog.showModal();
    message(configured() ? (authorized ? '会員ログイン中です。' : '') : '会員ログインの準備中です。現在はサンプルをご覧いただけます。');
  }
  async function sendCode() {
    if (!configured()) return message('会員ログインの準備中です。');
    const email = document.getElementById('memberEmailInput').value.trim();
    if (!document.getElementById('memberEmailInput').checkValidity() || !email) return message('メールアドレスを入力してください。');
    await authRequest('otp', {email, create_user: false});
    message('確認コードを送信しました。メールをご確認ください。');
  }
  async function verifyCode() {
    if (!configured()) return message('会員ログインの準備中です。');
    const email = document.getElementById('memberEmailInput').value.trim();
    const token = document.getElementById('memberCodeInput').value.trim();
    if (!email || !/^\d{6,8}$/.test(token)) return message('メールアドレスと確認コードを入力してください。');
    const result = await authRequest('verify', {email, token, type: 'email'});
    if (!result.access_token || !Number.isFinite(result.expires_in)) throw new Error('認証結果を確認できません。');
    session = {url: config.url, access_token: result.access_token, expires_at: Math.floor(Date.now() / 1000) + result.expires_in};
    try { await loadMemberData(session.access_token); }
    catch (err) { clearSession(); throw err; }
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    const next = new URL(location.href);
    next.searchParams.delete('mode');
    location.replace(next.toString());
  }
  function logout() {
    clearSession();
    location.reload();
  }
  async function initialize() {
    window.JPX_DASHBOARD_DATA = null;
    try { sessionStorage.removeItem('jpxMemberAuthToken'); localStorage.removeItem('jpxMemberAuth'); } catch (_) {}
    session = readSession();
    if (!configured() || !session) return;
    try {
      const data = await loadMemberData(session.access_token, true);
      if (new URLSearchParams(location.search).get('mode') !== 'sample') window.JPX_DASHBOARD_DATA = data;
      authorized = true;
      // Recheck revocation while a tab remains open; data is never persisted to storage.
      setInterval(async () => {
        try { if (expiry <= Date.now()) throw new Error('expired'); await loadMemberData(session.access_token); }
        catch (_) { clearSession(); location.reload(); }
      }, 60000);
    } catch (_) { clearSession(); }
  }
  window.MacanaMembers = {loginDialog, logout, isAuthorized: () => authorized && expiry > Date.now()};
  initialize().then(async () => {
    for (const file of ['data', 'overview', 'heatmap', 'charts', 'notes', 'features', 'navigation', 'cycle', 'stocks']) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './assets/jpx/' + file + '.js?v=members-v4';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }
    window.dispatchEvent(new Event('macana-ready'));
  }).catch(() => {
    const note = document.createElement('p');
    note.textContent = '画面を読み込めませんでした。再読み込みしてください。';
    document.body.prepend(note);
  });
})();

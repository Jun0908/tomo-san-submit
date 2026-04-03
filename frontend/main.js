const app = document.getElementById('app');

const router = () => {
  const hash = location.hash.replace('#', '');
  if (hash.startsWith('/conversation')) return renderConversationPage();
  if (hash.startsWith('/cases')) return renderCasesPage();
  return renderTopPage();
};

const loadSessions = () => JSON.parse(localStorage.getItem('talking-sessions') || '[]');
const saveSessions = (sessions) => localStorage.setItem('talking-sessions', JSON.stringify(sessions));

const renderTopPage = () => {
  const sessions = loadSessions();
  app.innerHTML = `
    <section class="card">
      <h2>トップページ</h2>
      <p>新しい会話を開始して、成果物（行政メモ等）を作成します。</p>
      <button class="button" id="start">新規会話開始</button>
    </section>
    <section class="card">
      <h3>過去のセッション</h3>
      ${sessions.length ? `<ul>${sessions.map(s => `<li>${s.id} - ${s.title} - <a href="#/conversation/${s.id}">続き</a> | <a href="#/cases/${s.id}">成果物</a></li>`).join('')}</ul>` : '<p>まだセッションがありません。</p>'}
    </section>
  `;

  document.getElementById('start').addEventListener('click', () => {
    const id = Date.now().toString();
    const newSession = { id, title: `会話 ${new Date().toLocaleString()}`, createdAt: new Date().toISOString(), messages: [] };
    sessions.unshift(newSession);
    saveSessions(sessions);
    location.hash = `#/conversation/${id}`;
  });
};

const renderConversationPage = () => {
  const id = location.hash.replace('#/conversation/', '') || '';
  const sessions = loadSessions();
  const session = sessions.find(s => s.id === id);
  if (!session) { app.innerHTML = `<div class="card"><h2>会話が見つかりません</h2><p><a href="#/">トップに戻る</a></p></div>`; return; }

  const transcript = session.messages.map(m => `<div class="message ${m.role}"><strong>${m.role === 'user' ? 'ユーザー' : 'AI'}:</strong> ${m.text}</div>`).join('');

  app.innerHTML = `
    <section class="card">
      <h2>会話ページ</h2>
      <p>セッション: ${session.title}</p>
      <div class="chat-logs">${transcript || '<p>メッセージはまだありません。</p>'}</div>
      <div class="input-row">
        <input type="text" id="message" placeholder="メッセージを入力してください" />
        <button class="button" id="send">送信</button>
      </div>
      <hr />
      <button class="button" id="generate">成果物を生成</button>
    </section>
  `;

  const chatLogs = app.querySelector('.chat-logs');
  const messageInput = document.getElementById('message');

  document.getElementById('send').addEventListener('click', async () => {
    const text = messageInput.value.trim();
    if (!text) return;
    session.messages.push({ role: 'user', text });
    session.messages.push({ role: 'agent', text: 'AIが応答中…' });
    saveSessions(sessions);
    renderConversationPage();

    // モックAI応答
    await new Promise(resolve => setTimeout(resolve, 700));
    const aiResponse = `（モック応答）「${text}」について検討しました。成果物に反映します。`;

    session.messages.pop();
    session.messages.push({ role: 'agent', text: aiResponse });
    saveSessions(sessions);
    renderConversationPage();
  });

  document.getElementById('generate').addEventListener('click', () => {
    const output = session.messages.map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.text}`).join('\n');
    session.generated = { id: `case-${session.id}`, title: `${session.title} の成果物`, summary: `会話から生成された成果物（モック）\n\n${output}` };
    saveSessions(sessions);
    location.hash = `#/cases/${session.id}`;
  });
};

const renderCasesPage = () => {
  const id = location.hash.replace('#/cases/', '') || '';
  const sessions = loadSessions();
  const session = sessions.find(s => s.id === id);
  if (!session || !session.generated) {
    app.innerHTML = `<div class="card"><h2>成果物がありません</h2><p>まず会話ページで成果物を生成してください。</p><a href="#/">トップに戻る</a></div>`;
    return;
  }

  app.innerHTML = `
    <section class="card">
      <h2>生成された案件ページ</h2>
      <h3>${session.generated.title}</h3>
      <pre>${session.generated.summary}</pre>
      <button class="button" id="download">PDFダウンロード（に見せかけ）</button>
    </section>
  `;

  document.getElementById('download').addEventListener('click', () => {
    const blob = new Blob([session.generated.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.generated.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });
};

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

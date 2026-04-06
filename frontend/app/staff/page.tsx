import Link from 'next/link';
import { cookies } from 'next/headers';

import StaffLoginForm from './staff-login-form';
import StaffLogoutButton from './staff-logout-button';
import { listOpenClawPublicCases } from '@/lib/server/openclaw-bridge';
import {
  isValidStaffSession,
  MOCK_STAFF_ID,
  MOCK_STAFF_PASSWORD,
  STAFF_SESSION_COOKIE,
} from '@/lib/server/staff-auth';

function StaffLoginCard() {
  return (
    <section className="card">
      <span className="eyebrow">Staff Entry</span>
      <h2>スタッフ向け入口</h2>
      <p className="lede">
        ここは内部確認用のモック入口です。今回は固定の ID とパスワードで入れる形にしています。
      </p>

      <div className="helperCard">
        <p className="sessionTitle">今回のモック認証情報</p>
        <p className="credentialLine">
          <strong>ID:</strong> <code>{MOCK_STAFF_ID}</code>
        </p>
        <p className="credentialLine">
          <strong>PW:</strong> <code>{MOCK_STAFF_PASSWORD}</code>
        </p>
      </div>

      <StaffLoginForm
        defaultId={MOCK_STAFF_ID}
        defaultPassword={MOCK_STAFF_PASSWORD}
  />
    </section>
  );
}

async function StaffDashboard() {
  const publicCases = await listOpenClawPublicCases();

  return (
    <section className="card">
      <span className="eyebrow">Staff Entry</span>
      <div className="sectionHeader">
        <div>
          <h2>スタッフ画面</h2>
          <p className="lede">
            モック認証でログイン済みです。ここから公開相談の確認と内部処理の接続を育てていけます。
          </p>
        </div>
        <StaffLogoutButton />
      </div>

      <div className="twoColumn">
        <div className="helperCard">
          <p className="sessionTitle">次に置くもの</p>
          <ul className="featureList">
            <li>公開相談の一覧</li>
            <li>案件ごとの公開ステータス更新</li>
            <li>OpenClaw の内部処理への連携</li>
          </ul>
        </div>

        <div className="helperCard">
          <p className="sessionTitle">入口の性質</p>
          <ul className="featureList">
            <li>今回は固定 ID / PW のモック認証</li>
            <li>cookie ベースで簡易セッションを保持</li>
            <li>本番では Auth.js などへ差し替え予定</li>
          </ul>
        </div>
      </div>

      <div className="helperCard">
        <div className="sectionHeader">
          <p className="sessionTitle">OpenClaw 公開案件一覧</p>
          <span className="mutedText">{publicCases.length} 件</span>
        </div>
        {publicCases.length === 0 ? (
          <p className="mutedText">
            まだ公開案件はありません。OpenClaw で `case_ingest.py --json` を通すとここに表示されます。
          </p>
        ) : (
          <ul className="sessionList">
            {publicCases.map((item) => (
              <li key={item.id} className="sessionListItem">
                <div>
                  <p className="sessionTitle">{item.title}</p>
                  <p className="mutedText">OpenClaw ID: {item.id}</p>
                  <p className="mutedText">
                    更新: {new Date(item.updatedAt).toLocaleString('ja-JP')}
                  </p>
                  <p className="mutedText">{item.latestPublicMessage}</p>
                </div>
                <div className="sessionLinks">
                  <span className={`statusBadge status-${item.statusPublic}`}>{item.statusPublic}</span>
                  <span className="mutedText">
                    {item.requiresUserInput ? '追加情報あり' : '追加情報なし'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p>
        <Link href="/">トップへ戻る</Link>
      </p>
    </section>
  );
}

export default async function StaffPage() {
  const sessionValue = cookies().get(STAFF_SESSION_COOKIE)?.value;
  const isLoggedIn = isValidStaffSession(sessionValue);

  return isLoggedIn ? <StaffDashboard /> : <StaffLoginCard />;
}

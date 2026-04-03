import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Talking Photo - Frontend',
  description: '会話から成果物を作るフロントエンド',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header style={{ background: '#1c3a7f', color: '#fff', padding: '1rem' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Talking Photo</h1>
            <nav style={{ display: 'flex', gap: '1rem' }}>
              <a href="/">トップ</a>
              <a href="/conversation/0">会話</a>
              <a href="/cases/0">案件</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';

import './globals.css';

export const metadata: Metadata = {
  title: 'Public Intake Frontend',
  description: '相談を案件化し、公開できる範囲で進行状況を返すフロントエンド。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="siteHeader">
          <div className="container siteHeaderInner">
            <div>
              <p className="siteLabel">Political Intake</p>
              <h1>公開相談フロント</h1>
            </div>
            <nav className="siteNav">
              <Link href="/">トップ</Link>
              <Link href="/tomo">Tomoさんと話す</Link>
              <Link href="/staff">スタッフ入口</Link>
            </nav>
          </div>
        </header>
        <main className="container pageShell">{children}</main>
      </body>
    </html>
  );
}

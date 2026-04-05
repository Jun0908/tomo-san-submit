import Link from 'next/link';

export default function StaffPage() {
  return (
    <section className="card">
      <span className="eyebrow">Staff Entry</span>
      <h2>スタッフ向け画面の入口</h2>
      <p className="lede">
        ここは公開面と内部面を分けるための仮置きページです。認証や内部情報の表示は今後ここに集約します。
      </p>
      <ul className="featureList">
        <li>公開相談から上がってきた案件の確認</li>
        <li>公開ステータスの更新や返信送信</li>
        <li>OpenClaw や Google 連携とつながる内部導線</li>
      </ul>
      <p>
        <Link href="/">トップへ戻る</Link>
      </p>
    </section>
  );
}

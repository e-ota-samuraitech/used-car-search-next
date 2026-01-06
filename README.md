# 中古車検索アプリ（Next.js版）

オリジナルのReact（Vite）プロジェクトをNext.js（Pages Router）+ TypeScript + Tailwind CSSに変換したプロジェクトです。

## 技術スタック

- **Next.js 14** - Reactフレームワーク（Pages Router）
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストCSS
- **Context API** - 状態管理

## プロジェクト構成

```
src/
├── components/          # 再利用可能なコンポーネント
│   ├── common/         # 共通コンポーネント（Topbar, Footer, Layout）
│   ├── filters/        # フィルタリング機能
│   ├── results/        # 検索結果関連
│   ├── detail/         # 車両詳細
│   └── estimate/       # 見積もりフォーム
├── pages/              # ページコンポーネント（Next.js Pages Router）
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx
│   ├── results.tsx
│   ├── thanks.tsx
│   ├── terms.tsx
│   ├── privacy.tsx
│   ├── contact.tsx
│   ├── car/
│   │   └── [id].tsx
│   └── estimate/
│       └── [id].tsx
├── context/            # Context API（グローバル状態管理）
│   └── AppContext.tsx
├── hooks/              # カスタムフック
│   └── useGeoFilters.ts
├── types/              # TypeScript型定義
│   └── index.ts
├── utils/              # ユーティリティ関数
│   ├── data.ts
│   └── helpers.ts
└── styles/             # グローバルスタイル
    └── globals.css
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

### 3. ビルド

```bash
npm run build
```

### 4. プロダクションサーバー起動

```bash
npm start
```

## 主な変更点（React版からの移行）

### 1. ルーティング

React Router → Next.js Pages Router

| React版 | Next.js版 |
|---------|-----------|
| `/results` | `/pages/results.tsx` |
| `/car/:id` | `/pages/car/[id].tsx` |
| `/estimate/:id` | `/pages/estimate/[id].tsx` |

### 2. ナビゲーション

```tsx
// React版
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/results');

// Next.js版
import { useRouter } from 'next/router';
const router = useRouter();
router.push('/results');
```

### 3. リンク

```tsx
// React版
import { Link } from 'react-router-dom';
<Link to="/results">検索結果</Link>

// Next.js版
import Link from 'next/link';
<Link href="/results">検索結果</Link>
```

### 4. スタイリング

CSS → Tailwind CSS

```tsx
// React版（CSS）
<div className="card">...</div>

// Next.js版（Tailwind）
<div className="border border-gray-200 rounded-xl p-3 bg-white">...</div>
```

### 5. TypeScript

JavaScript → TypeScript

- 型定義を`src/types/index.ts`に集約
- コンポーネントにprops型を追加
- イベントハンドラに型を追加

## 主な機能

### 検索機能

- キーワード検索
- メーカーフィルター
- 地域・都道府県・市区町村フィルター
- 価格帯フィルター
- 価格変動フィルター

### ソート機能

- おすすめ順（価格変動→新規→更新）
- 更新が新しい順
- 価格が安い順
- 価格が高い順

### その他

- 車両詳細表示
- 見積もり申し込みフォーム
- 申し込み完了画面

## ライセンス

MIT

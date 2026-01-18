Phase A のゴール（再確認）

Cloud Run → Vertex AI Search → 検索結果を返す

既存フロント/SSRが期待する /api/search のレスポンス形は維持（items: Car[]）

Vertex 側はダミー100%（後から Cloud SQL に移行）

0) 先に決め打ちする“互換最小”の設計（重要）
Vertex に入れるドキュメント（構造）

Vertex の structData に、今のフロントが期待する Car の必須フィールドをそのまま入れるのが最短です。

例：id, maker, model, year, mileage, priceYen, updatedAt, pref, city, ...

余裕があれば、将来のカーセンサーAPI本体に寄せるために raw（推定API shape）も structData.raw に入れてOK（UIは無視してもよい）

こうしておけば Phase A は**「Vertex結果を Car に薄くマッピング」**で終わり、UI破壊が起きにくいです。

1) GCP管理画面でやること（Vertex AI Search の作成）

Vertex AI Search は Discovery Engine API を使います。

1-1. 事前準備：GCS バケットを作ってダミーJSONLを置く

Cloud Storage でバケット作成（プロジェクト内、適当なリージョンでOK）

cars_dummy.jsonl をアップロード（中身は後述の形式）

※ 公式ドキュメント上、Cloud Storage からのデータストア作成がコンソールで失敗する既知問題があるので、先に新規バケットを作ってから進めるのが安全です。

1-2. Data Store（データストア）作成

公式のコンソール手順（要約）

Google Cloud Console → AI Applications

Data Stores → Create data store

Source を Cloud Storage

gs://... のファイル or フォルダを指定

データ種別は Structured data を選ぶ

One-time ingestion（まずは一回取り込みでOK）

Map fields to key properties（title/uri などの紐付け。最低限 title は付ける）

Region：まずは docs 例と合わせて global 推奨（APIパスも locations/global が基本形）

Create → Import completed まで待つ

1-3. App（Engine / 検索アプリ）作成

Data Store を作ったら、Search App（エンジン）を作って Data Store をアタッチします（Vertex は “engine/app” を作るのが基本動線）。

あとで API から叩く際、Google は engines.servingConfigs.search を推奨しています。

1-4. Schema で「絞り込み用フィールド」を Indexable にする

maker/pref/city/feature/price で絞るなら、Schema の該当フィールドを Indexable にする必要があります。
（例：structData.makerSlug, structData.prefSlug, structData.featureSlugs, structData.priceYen）

2) Vertex 側で“検索できる”ことを先に検証（curlでOK）

フィルタの式は Vertex の仕様があり、文字は ANY(...)、数値は IN(a,b) や比較演算子が使えます。
構造化データは structData.xxx のフルパスで指定するのが明記されています。

例（概念）

structData.makerSlug: ANY("toyota")

structData.priceYen: IN(1000000, 3000000)（上限はデフォルト排他的）

structData.priceYen >= 1000000 AND structData.priceYen < 3000000

ここで「query だけ」「filter付き」「sort付き」まで curl で通しておくと、コード実装が一気に楽になります。

3) IAM（Cloud Run から叩けるようにする）

Cloud Run の 実行サービスアカウントに、最低限 roles/discoveryengine.user を付与します。
（閲覧だけなら viewer もありますが、まず user でOK）

4) コード実装ステップ（最小差分・UI互換）

あなたの現状構造に合わせて「SearchClient差し替え」でいきます（調査結果の “方針A”）。

4-1. 依存追加

Node/TS なら @google-cloud/discoveryengine を使うのが素直（Vertex AI Search は Discovery Engine のクライアントライブラリを使う前提）

4-2. env を追加（例）

SEARCH_CLIENT=vertex

VERTEX_SERVING_CONFIG=<projects/.../locations/global/collections/default_collection/engines/.../servingConfigs/...>

ServingConfig は “フルリソース名”を env で持つのが事故が少ない（default 名が環境でズレるのを避ける）

4-3. SearchClient 実装追加（やることだけ）

src/server/search/searchClient.ts

SEARCH_CLIENT=vertex の分岐を追加

VertexSearchClient.search(query) を実装

VertexSearchClient.search でやること

query.q を SearchRequest の query に入れる

page/pageSize を offset/limit に変換

maker/pref/city/feature/minMan/maxMan/priceChangedOnly を filter文字列に変換

文字：structData.xxx: ANY("...")

数値：IN(lower, upper) or >= など

sort を orderBy にマップ（可能なら）

price_asc → structData.priceYen asc

price_desc → structData.priceYen desc

updated_desc → structData.updatedAtEpoch desc

orderBy は SearchRequest にある項目

返ってきた results[].document.structData を Car に詰める

totalCount は Vertex の totalSize 相当を入れる（UI必須）

lastUpdatedAt は new Date().toISOString() でまずOK（後で改善）

4-4. 互換のための「落とし穴回避」

Vertex にダミーデータを入れる段階で、Carの必須フィールドは必ず入れておく

ないと描画で落ちやすい

Vertex からの結果が欠けても壊れないように、Car マッピング時にデフォルト値を用意

Vertex が死んだら MockSearchClient にフォールバック、みたいな“保険”を入れると開発が止まりにくい

5) デプロイ＆動作確認

Cloud Run に env をセットしてデプロイ

SEARCH_CLIENT=vertex

VERTEX_SERVING_CONFIG=...

Cloud Run の SA に roles/discoveryengine.user

確認手順

/api/search?q=...

/cars/ と /cars/...segments（SSRが SearchClient を使うのでここも Vertex に変わる）

maker/pref/feature を含む URL を開いて “絞り込みが効いているか”確認

6) まず作るべき Vertex 用ダミーデータ（JSONLの方針）

ドキュメントの作り方は2系統あります：

(A) Cloud Storage 取り込み（コンソールの導線）

(B) API で documents に structData を直接 POST（確実で制御しやすい）

Phase A は (A) で良いですが、コンソール取り込みが不安定なら (B) に寄せると安定します。

7) あなたの次アクション（この順でやれば詰まりにくい）

GCSバケット作成 → ダミーJSONL配置

Data Store作成（structured / one-time / global）

Search App作成（engine）して Data Store を attach

Schema で maker/pref/city/feature/price を Indexable

curl で query + filter が通ることを確認

Cloud Run SA に roles/discoveryengine.user

コードは SearchClient 差し替え（vertex 実装追加）

/api/search と SSR ページの両方で動作確認
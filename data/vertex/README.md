# Vertex AI Search Phase A 用ダミーデータ

このディレクトリには、Vertex AI Search に投入するためのダミー車両データを配置します。

## ファイル

| ファイル | 形式 | 説明 |
|---------|------|------|
| `cars_dummy.jsonl` | NDJSON | ダミー車両データ（1行1JSON、Car型互換） |
| `cars_dummy.discoveryengine.jsonl` | NDJSON | Discovery Engine 取り込み用（変換後） |

## データ仕様

### フィールド一覧

**必須フィールド（Car型互換）:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string | 車両ID（例: `car-000001`） |
| `maker` | string | メーカー名 |
| `model` | string | 車種名 |
| `year` | number | 年式 |
| `mileage` | number | 走行距離(km) |
| `hasRepairHistory` | boolean | 修復歴 |
| `hasInspection` | boolean | 法定整備 |
| `shaken` | string | 車検（例: `車検整備付`, `2025年3月`） |
| `warranty` | string | 保証 |
| `region` | string | 地方（例: `関東`） |
| `pref` | string | 都道府県 |
| `city` | string | 市区町村 |
| `priceYen` | number | 価格(円) |
| `prevPriceYen` | number | 変更前価格(円) |
| `updatedAt` | number | 更新日時(epoch ms) |
| `postedAt` | number | 掲載日時(epoch ms) |
| `priceChangedAt` | number \| null | 価格変更日時 |
| `shop` | string | 販売店名 |

**検索/SEO用（Car型互換）:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `makerSlug` | string | メーカーslug |
| `modelSlug` | string | 車種slug |
| `prefSlug` | string | 都道府県slug |
| `citySlug` | string | 市区町村slug |
| `featureSlugs` | string[] | 装備slug一覧 |

**Vertex拡張:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `title` | string | 表示用タイトル |
| `updatedAtIso` | string | ISO8601形式の更新日時 |
| `imageMain` | string | メイン画像URL |
| `raw.carsensor` | object | カーセンサーAPIからの生データ（将来用） |

## 生成スクリプト

### 実行方法

```bash
# 500件生成（デフォルト）
npx tsx tools/generate-dummy-data.ts

# 件数を指定
npx tsx tools/generate-dummy-data.ts 1000
```

### 特徴

- seed固定の疑似乱数（再生成しても同一データ）
- 外部通信なし
- `src/types/index.ts` の `Car` 型に完全互換

## Discovery Engine 用変換

Vertex AI Search (Discovery Engine) の Data Store に取り込むには、
ドキュメントID付きの形式に変換する必要があります。

### 変換スクリプト実行

```bash
npx tsx tools/convert-for-discovery-engine.ts
```

### 変換形式

入力（cars_dummy.jsonl）:
```json
{"id":"car-000001","maker":"スバル",...}
```

出力（cars_dummy.discoveryengine.jsonl）:
```json
{"id":"car-000001","structData":{"id":"car-000001","maker":"スバル",...}}
```

- `id`: ドキュメントID（Discovery Engine が認識）
- `structData`: 元のJSONをそのまま格納（フィールド変更なし）

## GCSへのアップロード

変換後のJSONLファイルをGoogle Cloud Storageにアップロードし、
Vertex AI SearchのData Storeに取り込みます。

```bash
# Discovery Engine 用ファイルをアップロード
gsutil cp data/vertex/cars_dummy.discoveryengine.jsonl gs://<YOUR_BUCKET>/vertex/cars_dummy.discoveryengine.jsonl
```

## Phase A での利用

1. このダミーデータをVertex AI Searchに投入
2. `SearchClient` を Vertex AI Search 用に差し替え
3. UIには変更なしで動作確認

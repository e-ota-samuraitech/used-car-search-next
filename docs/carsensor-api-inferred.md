# カーセンサーAPI 逆算ドキュメント（PHP残骸2件からの推定）
対象：`drilldown.car.zip` / `search.car.zip`（過去にカーセンサー連携で動いていたPHPコード）

> ⚠️ 注意（重要）
> - これは **過去実装のコードから「当時こう扱っていた」ことを逆算した推定資料**です。  
> - あなたの「今回届くカーセンサーAPI」が同一とは限りません（認証方式・URL・フィールド名・上限・形式が変わる可能性あり）。
> - ただし **「データ構造（在庫一覧・詳細・写真・店舗・メーカー/車種/グレードのコード体系）」は、今の開発で先に作っておける**レベルで得られます。

---

## 1. この2つの残骸に何が入っているか（役割）
### A. `drilldown.car` 側（クローラ / 取り込み）
- **カーセンサー在庫を外部APIで取得**し、DBへ保存する想定。
- さらに **メーカー/車種/グレードのマスタ**を “別API（リクルートWebサービス）” から取得してDB化。
- 取得した在庫/タグをSolrで検索する「ドリルダウン検索API」も持っていた。

主に見るべきファイル：
- 在庫API呼び出し：`drilldown.car/crawl/crawl.php`（`action=api`）
- 在庫APIの保存処理：`drilldown.car/crawl/crawl.car.php`
- ブランド/カタログAPI：`drilldown.car/crawl/crawl.car.php`（`action=carsensor_brand_api`, `action=carsensor_catalog_api`）

### B. `search.car` 側（フロント）
- DBに入った在庫やカタログを使って表示するCakePHPアプリ。
- ここから **「欲しい検索機能/フィルタ」と「データ項目の使い方」**が分かる。

---

## 2. 推定できた “外部API” は大きく3系統
1) **カーセンサー在庫API（XML）**  
2) **カーセンサー ブランドAPI（JSON / リクルートWebサービス）**  
3) **カーセンサー カタログAPI（JSON / リクルートWebサービス）**

---

# 3. カーセンサー在庫API（XML）の推定仕様
> 呼び出し元：`drilldown.car/crawl/crawl.php` → `crawl.car.php`

## 3.1 エンドポイント（推定）
| 種別 | URL（推定） | 形式 | 用途 |
|---|---|---:|---|
| 一覧（検索/新着） | `http://carsensor.net/webapi/b/p/usedcar/` | XML | 在庫の一覧取得（ページングあり） |
| 詳細 | `http://carsensor.net/webapi/b/p/usedcar/` | XML | `id` 指定で詳細情報を取得（装備・プラン含む） |

※当時の実装では同一URLでパラメータを変えて叩いています。

---

## 3.2 一覧取得のクエリパラメータ（推定）
`crawl.php` の `action=api` で固定値として使っていたもの：

| param | 例 | 必須 | 意味（推定） |
|---|---|---:|---|
| `key` | `********` | ✅ | APIキー（コード上はハードコードされていた） |
| `pn` | `csjs0006521320000` | ✅ | パートナーIDっぽい（固定） |
| `mode` | `3` | ✅ | “検索/一覧” モード指定っぽい |
| `count` | `100` | ✅ | 1回の取得件数（当時100固定） |
| `start` | `0,100,200...` | ✅ | 開始オフセット（100刻み） |
| `order` | `7` | ✅ | ソート条件（当時7固定） |

### ページングの挙動（当時）
- `page=1..20` を回して最大2000件/回を想定
- `start = 100 * (page-1)`

---

## 3.3 一覧レスポンス構造（推定）
コードで参照していた要素：
- ルート：`results_available`（総件数っぽい）
- 配列：`used_car`（在庫1件）

### 在庫1件（used_car）の “保存対象フィールド” 一覧
> `save_api_list()` が `usedcars` テーブルへ保存していたカラム

| フィールド | 例/型 | 説明（推定） |
|---|---|---|
| `id` | string | 在庫ID（詳細取得にも使う） |
| `maker_cd` | string | メーカーコード（例: `TO` など） |
| `maker` | string | メーカー名 |
| `shashu_cd` | string | 車種コード |
| `shashu` | string | 車種名 |
| `grade_cd` | string | グレードコード（後述の連結コードの可能性） |
| `grade` | string | グレード名 |
| `price` | number/string | 価格 |
| `mileage` | number/string | 走行距離 |
| `color` | string | 色 |
| `year` | string | 年式 |
| `syaken` | string | 車検（残/期限） |
| `syaken_disp` | string | 車検表示用文字列 |
| `body` | string | ボディ形状名 |
| `mission` | string | ミッション表記 |
| `inspection` | string | 法定整備 |
| `inspection_cost` | string | 整備費用 |
| `warranty` | string | 保証有無 |
| `warranty_cost` | string | 保証費用 |
| `warranty_kikan` | string | 保証期間 |
| `warranty_distance` | string | 保証距離 |
| `displacement` | string | 排気量 |
| `coupon` | string | クーポン有無等 |
| `m_photo` | string(URL) | “メイン写真”っぽいURL |
| `photo` | string(URL) | 写真URL（別枠） |
| `cart` | string(URL) | カートURL？（当時そのまま保存） |
| `inquiry` | string(URL) | 問い合わせURL？ |
| `mobile_detail` | string(URL) | モバイル詳細URL |
| `mobile_inquiry` | string(URL) | モバイル問い合わせURL |
| `inquiry_type` | string | 問い合わせ種別 |
| `body_cd` | string | ボディコード |
| `pref_cd` | string | 都道府県コード（数値系） |
| `nintei` | string | 認定中古車フラグ？ |
| `movie` | string | 動画有無/URL？ |
| `budget` | string | 予算帯？ |
| `is_new` | string | 新着フラグ？ |
| `recycle` | string | リサイクル料 |
| `repair` | string | 修復歴 |
| `dealer` | string | ディーラー系？ |
| `person` | string | 個人/法人？ |
| `door` | string | ドア数 |
| `description` | string | 短い説明（一覧でも来る想定） |

**観測ポイント**
- “一覧”だけでもかなり項目が揃う前提で実装されている（=APIがリッチ）
- ただし **更新差分の扱いは雑**で、当時は `m_photo` と `photo` だけ更新して他は固定扱い

---

## 3.4 詳細取得のクエリ（推定）
`save_api_detail()` が叩いていた形：

| param | 例 | 必須 | 意味（推定） |
|---|---|---:|---|
| `key` | `********` | ✅ | APIキー |
| `pn` | `csjs0006521320000` | ✅ | パートナーID |
| `a` | `2` | ✅ | 詳細取得モードっぽい |
| `id` | `<usedcar_id>` | ✅ | 在庫ID |
| `plan_ext` | `1` | - | “プラン情報も拡張で付ける”指定っぽい |

---

## 3.5 詳細レスポンスで拾っていた追加情報
### (1) 装備 `equip`
`used_car->equip->item[]` を見て、`{code}_{value}` の配列にして保存。

- 保存先：`usedcars.equip`（CSV文字列として保存していた）

| 取得要素 | 説明 |
|---|---|
| `equip.item.code` | 装備コード（例: `one_owner` などの可能性） |
| `equip.item.value` | 値（0/1 や enum） |

> `search.car/app/models/base_item.php` に **装備コードの辞書（251件）**があり、かなり高い確度で一致してる。  
> つまり「詳細APIの equip は base_item.php のキー群に対応している」可能性が高い。

装備コード例（抜粋）：
| code | 意味（base_item.phpより） | 値例 |
|---|---|---|
| `one_owner` | ワンオーナー | 0/1 |
| `no_smoking` | 禁煙車 | 0/1 |
| `four_wheel` | 4WD | 0/1 |
| `car_navi` | カーナビ | 0..4 |
| `car_tv` | TV | 0/2/3 |
| `slide_door` | スライドドア | 0..5 |
| `engine` | エンジン種別 | 1..4/9 |

---

### (2) プラン `plan`
`used_car->plan->item[]` を同様に `{code}_{value}` として保存。

- 保存先：`usedcars.plan`

※プランの辞書はこの2zipからは確定できない（少なくともbase_item.phpには装備ほど整理されていない）

---

### (3) メーター改ざん・車台番号など
詳細で拾って保存していた項目（= APIが出してくる想定）：

| フィールド | 説明（推定） |
|---|---|
| `syadai` | 車台番号 |
| `before_meter_change` / `_disp` | メーター交換前（値/表示） |
| `after_meter_change` / `_disp` | メーター交換後（値/表示） |

---

### (4) 写真（複数） `usedcar_images`
詳細APIには写真が複数入る想定で、下記ロールでDBへ保存：

| role | 内容（推定） |
|---|---|
| `small_photo` | サムネ |
| `main_photo` | メイン |
| `shop_photo` | 店舗写真 |
| `main_caption` | メインキャプション |
| `multi_photo1..9` | 複数写真 |
| `multi_caption1..9` | 複数キャプション |

保存テーブル（推定）：`usedcar_images`
| カラム | 説明 |
|---|---|
| `usedcar_id` | 在庫ID |
| `role` | 上のrole |
| `source` | URL/文字列 |
| `caption` | キャプション（roleにより） |
| `update_at` | 更新日時 |

---

### (5) 店舗情報 `shops`
在庫詳細の中に “店舗ノード” があり、それを `shops` として保存していた：

| フィールド | 説明 |
|---|---|
| `shop_id` | 店舗ID |
| `name` | 店舗名 |
| `pref` | 都道府県名？ |
| `cs_shop_url` | カーセンサー店舗URL |
| `navi` | “販売店ナビ有り” などの文言 |

---

# 4. ブランドAPI（JSON / リクルートWebサービス）
> 呼び出し元：`drilldown.car/crawl/crawl.car.php` の `action=carsensor_brand_api`

## 4.1 エンドポイント（コード上）
| URL | 形式 |
|---|---|
| `http://webservice.recruit.co.jp/carsensor/brand/v1/?key=<KEY>` | JSON |

## 4.2 取れるデータ（推定）
`json->results->brand[]` を DB（`makers`）に保存していた。

| フィールド | 説明 |
|---|---|
| `code` | メーカーコード（= 在庫APIの `maker_cd` と同系の可能性） |
| `name` | メーカー名 |

---

# 5. カタログAPI（JSON / リクルートWebサービス）
> 呼び出し元：`action=carsensor_catalog_api`

## 5.1 エンドポイント（コード上）
| URL例 | 形式 |
|---|---|
| `http://webservice.recruit.co.jp/carsensor/catalog/v1/?key=<KEY>&maker=<maker_code>&start=<n>&count=100` | JSON |

## 5.2 取れるデータ（推定）
`json->results->catalog[]` を `catalog_cars` として保存。

保存対象フィールド（コードから確定）：
| DBカラム | 由来 | 説明（推定） |
|---|---|---|
| `maker_id` | makers.id | 内部ID |
| `brand_code` | `catalog.brand.code` | ブランドコード |
| `model` | `catalog.model` | 車種名 |
| `body` | `catalog.body` | ボディ |
| `price` | `catalog.price` | 価格（カタログ側） |
| `desc` | `catalog.desc` | 説明 |
| `grade` | `catalog.grade` | グレード名 |
| `sales_period` | `catalog.sales_period` | 販売期間文字列 |

さらに “重要”：カタログの `code` から各種コードを生成している：

### カタログの `code` の分解（コード上のロジック）
`catalog.code` を `:` 分割し、特定のキーを抽出：

| キー | 意味（推定） |
|---|---|
| `GRDC` | グレードコード（数値） |
| `MODEL` | “モデルコード” の中に `-` 区切りで2段（例：`F-M`） |
| `GRADE_CODE` | 追加のグレード管理コード（主にcatalog_grades用） |
| `MODEL_CODE` | 車種コード（= carsensor_sh_code） |

そしてDBに以下を保存：

| 生成カラム | 作り方 | 用途 |
|---|---|---|
| `carsensor_sh_code` | `MODEL_CODE` | 車種コード（在庫 `shashu_cd` と一致候補） |
| `carsensor_g_code` | `GRDC` | グレードコード（数値） |
| `carsensor_shg_code` | `maker.code + carsensor_sh_code + carsensor_g_code` | **連結コード**（後述：在庫 `grade_cd` の本命） |
| `carsensor_f_code` | `MODEL` の前半 | “F”系コード |
| `carsensor_m_code` | `MODEL` の後半 | “M”系コード |
| `carsensor_grade_code` | `GRADE_CODE` | グレード辞書用 |

---

## 5.3 `catalog_grades` の生成（グレード辞書）
カタログ取り込み後に、`catalog_cars` を集約して `catalog_grades` を作っている（=グレード候補一覧）。

保存していたもの（推定）：
| カラム | 説明 |
|---|---|
| `maker_cd` | maker.code |
| `shashu_cd` | carsensor_sh_code |
| `grade_name` | grade |
| `carsensor_shg_code` | maker + sh + g（連結） |
| `carsensor_grade_code` | GRADE_CODE |
| `grade_cd` | GRDC |

---

# 6. ここから “今の開発でAPIが来るまで使える” 具体情報
## 6.1 先に作れる：データモデル（最低限）
カーセンサーAPIが来た瞬間に差し替えやすい形で、DB/型を先に固められます。

### 推奨テーブル（最小セット）
| テーブル | 主キー | 中身 |
|---|---|---|
| `usedcars` | `id` | 在庫本体（一覧+詳細の統合） |
| `usedcar_images` | `(usedcar_id, role)` | 写真/キャプション |
| `shops` | `shop_id` | 店舗 |
| `makers` | `id` | メーカー辞書（brand API） |
| `catalog_cars` | `id` | 車種/グレード候補（catalog API） |
| `catalog_grades` | `id` | （maker×車種×グレード）辞書 |

### `usedcars` カラム案（一覧＋詳細の統合）
> 一旦 “型は全部stringでもOK”、後から整形でも回る

| カラム | 由来 |
|---|---|
| `id` | 一覧/詳細（必須） |
| `maker_cd`, `maker` | 一覧 |
| `shashu_cd`, `shashu` | 一覧 |
| `grade_cd`, `grade` | 一覧（欠損時は後述で補完） |
| `price`, `mileage`, `year`, `color` | 一覧 |
| `pref_cd` | 一覧 |
| `body_cd`, `body` | 一覧 |
| `mission`, `door`, `displacement` | 一覧 |
| `repair`, `dealer`, `person`, `nintei` | 一覧 |
| `description` | 一覧/詳細 |
| `syadai` | 詳細 |
| `before_meter_change*`, `after_meter_change*` | 詳細 |
| `equip` | 詳細（CSV or JSON配列） |
| `plan` | 詳細（CSV or JSON配列） |
| `shop_id` | 詳細（店舗紐付け） |
| `updated_at` | 取り込み時刻（内部管理） |

---

## 6.2 先に作れる：コード体系の扱い（SEO URL設計にも効く）
### 「grade_cd」は連結コードの可能性が高い
カタログ取り込みで作っていた：
- `carsensor_shg_code = maker_cd + carsensor_sh_code + carsensor_g_code`

さらに在庫側では：
- `grade_cd` が空の時に、**`grade`文字列で catalog_grades を引いて carsensor_shg_code を埋める**処理がある

つまり **在庫APIが `grade_cd` を常に返すとは限らない**が、
あなたのサイト側は「最終的に `maker_cd + shashu_cd + grade_cd(数値)` の連結で安定IDが作れる」前提で設計しておくと強い。

---

## 6.3 先に作れる：メーカー/車種ページ（在庫なしでも作れる）
在庫APIが来てなくても、ブランドAPI＋カタログAPIだけで
- メーカー一覧
- メーカー別 車種一覧（`maker -> models`）
- 車種別 グレード候補（`catalog_grades`）
- 車種画像（`catalog.images` 由来）

までは組めるので、SEO・URL設計・テンプレを先に固められます。

---

## 6.4 “API差し替え” を安全にするためのProviderインターフェース案（TS）
カーセンサーAPIが来るまで、ダミー実装（DB/JSON）で動かし、後で本物に差し替える形。

```ts
export type UsedCar = {
  id: string;
  maker_cd: string;
  maker: string;
  shashu_cd: string;
  shashu: string;
  grade_cd?: string;
  grade?: string;
  price?: string;
  mileage?: string;
  year?: string;
  color?: string;
  pref_cd?: string;
  body_cd?: string;
  body?: string;
  mission?: string;
  door?: string;
  displacement?: string;
  repair?: string;
  dealer?: string;
  person?: string;
  nintei?: string;
  description?: string;

  // detail
  syadai?: string;
  before_meter_change?: string;
  before_meter_change_disp?: string;
  after_meter_change?: string;
  after_meter_change_disp?: string;
  equip?: string[]; // ["one_owner_1", ...]
  plan?: string[];
  shop_id?: string;
};

export type UsedCarImage = {
  usedcar_id: string;
  role: string;     // "main_photo" | "multi_photo1" | ...
  source?: string;  // URL or text
  caption?: string;
};

export type Shop = {
  shop_id: string;
  name?: string;
  pref?: string;
  cs_shop_url?: string;
  navi?: string;
};

export type SearchResult = {
  totalCount: number;
  items: UsedCar[];
};

export interface CarsensorProvider {
  search(params: Record<string, string | string[]>): Promise<SearchResult>;
  getDetail(id: string): Promise<{ item: UsedCar; images: UsedCarImage[]; shop?: Shop }>;

  listMakers(): Promise<Array<{ code: string; name: string }>>;
  listCatalogByMaker(makerCode: string): Promise<any>; // 後で型を詰める
}

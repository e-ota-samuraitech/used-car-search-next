中古車検索サイト SEO仕様書 Ver.1.1（最新版）

1. 目的と基本思想
中古車検索サイトは URLが無限に増殖しやすく、薄いページが発生しやすい
そのためSEOは「網羅」ではなく 制御・選別 が最重要
UX（画面表示）と SEO（index可否）は分離して考える
indexさせるURLは人間が意図的に決める
速報性（更新が早い・新着が多い）を SEO上の差別化要素として活用する

2. 最重要グローバルルール（全URL共通・最優先）
2.1 検索結果数ガード（件数ガード）
検索結果画面は レンダリング前（SSR）に必ず検索を実行し、検索結果数（totalCount）を取得する
以下の場合、URL種別・DB登録・構造ホワイトリストの有無に関係なく必ず noindex,follow とする
totalCount < MIN_INDEX_COUNT



2.2 基準値（設定値）
全国軸：300〜500件以上
都道府県配下：50〜100件以上
市区町村：50件以上
featureページ：全国500件以上 / 都道府県50件以上
MVP段階では 共通値（例：50件）から開始可能
すべて 設定値として変更可能 にする
👉 この件数ガードは すべてのSEO判定において最優先 とする

3. index / noindex の基本方針
index対象URLは ホワイトリスト方式
ホワイトリスト外は原則 noindex
noindexでも follow は必ず維持
同一内容は canonical により 必ず1URLに集約
sitemap.xml には index対象URLのみ を含める
trailing slash（/）は統一し、正規URLは必ず / あり

4. URL設計方針（短いURL優先）
4.1 大原則
pref / city / maker / feature などの カテゴリ語はURLに含めない
代わりに slug先頭の接頭辞でカテゴリを一意に識別する
正規URLは1つに固定し、それ以外は 301 または canonical で集約する

5. 正規URL構造（短URL・接頭辞方式）
すべて /cars/ 配下に統一する。
5.1 地域
都道府県
/cars/p-{pref}/
例：/cars/p-kanagawa/
市区町村
/cars/p-{pref}/c-{city}/
例：/cars/p-kanagawa/c-yokohama/

5.2 メーカー・車種
メーカー
/cars/m-{maker}/
例：/cars/m-toyota/
車種（メーカー配下）
/cars/m-{maker}/s-{model}/
例：/cars/m-toyota/s-prius/

5.3 feature（属性）
全国
/cars/f-{feature}/
都道府県配下
/cars/p-{pref}/f-{feature}/

5.4 組み合わせ
都道府県 × メーカー
/cars/p-{pref}/m-{maker}/
都道府県 × feature
/cars/p-{pref}/f-{feature}/

5.5 車両詳細
/cars/d-{id}/

6. slug命名規約（衝突防止の核）
6.1 接頭辞（必須）
p-：都道府県
c-：市区町村
m-：メーカー
s-：車種
f-：feature
d-：車両ID
※ 接頭辞なしのURLは 正規URLとして使用しない

6.2 文字種
[a-z0-9-] のみ
日本語はURLに含めない（表示名はページ内で日本語）

7. クエリ検索（q / keyword）の扱い
7.1 基本ルール
?q=xxx / ?keyword=xxx を含む検索結果URLは 原則 noindex,follow
ただし 選択肢として定義済みの語 に一致する場合は、短URLへ昇格させる

8. クエリ検索から短URLへの昇格ルール
8.1 対象ワード
メーカー名（トヨタ等）
feature（4WD、ハイブリッド等）
都道府県名
車種名（メーカーが特定できる場合のみ）
8.2 優先順位（必須）
メーカー
車種（メーカー特定できる場合のみ）
feature
都道府県
それ以外 → フリーワード検索（noindex）
8.3 挙動
昇格できる場合：301リダイレクトで短URLへ
昇格できない場合：検索結果は表示するが noindex
フリーワード検索結果URL：
/results/freeword/{検索ワード}/index.html

9. featureページ（SEO用着地URL）
9.1 featureホワイトリスト（暫定）
4wd / hybrid / mt / diesel / suv / minivan / kei / wagon / sedan / hatchback
9.2 feature index条件（すべて必須）
ホワイトリストに含まれる
検索結果数ガードを満たす
検索需要が明確
意味が単一軸
固定説明文（300〜800字）を置ける
内部リンクで孤立しない

10. DBホワイトリスト（index化希望ページ）
10.1 概要
Cloud SQL に index化を希望する正規URL（短URL） を登録する
例：/cars/p-kanagawa/c-yokohama/
10.2 判定ルール
DB登録ページは 原則 index対象
ただし 件数ガードが最優先
totalCount < MIN_INDEX_COUNT → 必ず noindex
totalCount >= MIN_INDEX_COUNT かつ DB登録あり → index
10.3 重要な考え方
DB登録は 「indexを許可する条件」
indexを保証する条件ではない

11. index / noindex 判定の最終優先順位
クエリ検索の昇格（301）
検索結果数ガード（最優先）
ヒステリシス制御
DBホワイトリスト登録有無
構造ホワイトリスト判定
URL種別ルール（クエリ・feature・正規パス）
canonical決定

12. 日次変動への対応方針
在庫変動により、同一URLが
ある日は index
別の日は noindex
となることは 仕様上許容
ただしSEO安定性の観点から ヒステリシス制御を採用する

13. title / h1 / description 設計ルール
13.1 共通ルール
title：32〜40文字目安
h1：1ページ1つ、titleと完全一致させない
description：80〜120文字
「最新更新」「更新が早い」を必ず差別化ワードとして含める
13.2 ページ種別別テンプレ
検索トップ
都道府県
市区町村
メーカー
都道府県×メーカー
feature（全国／都道府県）
車両詳細
（テンプレ文言は別紙定義）

13.3 title / h1 / description 具体例
検索トップ /cars/
title：中古車検索｜更新が早い中古車情報
h1：更新が早い中古車検索
description：更新が早い中古車情報をまとめて検索。全国の最新在庫を条件別に探せます。
都道府県 /cars/p-kanagawa/
title：神奈川の中古車｜最新更新順で探せる中古車一覧
h1：神奈川の中古車一覧
description：神奈川で販売中の中古車を最新更新順で掲載。条件別に在庫を確認できます。
市区町村 /cars/p-kanagawa/c-yokohama/
title：横浜の中古車｜最新更新順の中古車一覧
h1：横浜の中古車一覧
description：横浜市で販売されている中古車を最新更新順で紹介します。
メーカー /cars/m-toyota/
title：トヨタの中古車｜最新更新順で探せるトヨタ車
h1：トヨタの中古車一覧
description：トヨタの中古車を最新更新順で掲載。人気車種の在庫を確認できます。
feature /cars/f-4wd/
title：4WD中古車｜最新更新順で探せる四駆の中古車
h1：4WD（四駆）の中古車一覧
description：4WD（四駆）の中古車を最新更新順で掲載しています。
車両詳細 /cars/d-123456/
title：トヨタ プリウス 1.8 S｜129.8万円｜中古車情報
h1：トヨタ プリウス 1.8 S
description：トヨタ プリウス 1.8 Sの中古車情報。価格や年式、装備などの詳細を掲載。

14. canonical / 301 の統合ルール
正規URL以外の同等ページは原則 301
301できない場合でも canonicalで正規URLへ集約
sort / page>=2 / 細かい条件は noindex

15. 仕様まとめ（要点）
薄いページは必ず弾く
indexは選ばれたページだけに与える
短URLは接頭辞で安全に成立させる
クエリ検索は原則indexさせない
DB・構造でindex候補を管理しつつ、件数ガードで上書き

16. ヒステリシス制御による index / noindex 安定化仕様
16.1 基本
INDEX_ON_THRESHOLD / INDEX_OFF_THRESHOLD の 2つの基準値を用いる
16.2 判定
totalCount < INDEX_OFF_THRESHOLD → noindex
totalCount >= INDEX_ON_THRESHOLD → index候補
中間値 → 前回状態を維持
16.3 初回
初回は単純判定
判定結果を前回状態として保存

17. 構造ホワイトリスト（URL構造による index 候補判定）
17.1 対象構造
都道府県 / 市町村
/cars/p-{pref}/c-{city}/
都道府県 / メーカー
/cars/p-{pref}/m-{maker}/
都道府県 / 市町村 / メーカー
/cars/p-{pref}/c-{city}/m-{maker}/
17.2 注意
構造ホワイトリストは indexを保証しない
必ず
件数ガード
ヒステリシス
DBホワイトリスト
を適用する

18. 最終まとめ（設計思想）
件数で弾き
ヒステリシスで安定させ
構造で候補を決め
人の意思で最終調整する




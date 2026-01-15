// 検索パラメータの型定義（正規化済み）
export interface SearchParams {
  q: string;
  maker: string;
  region: string;
  pref: string;
  city: string;
  minMan: string;
  maxMan: string;
  priceChangedOnly: boolean;
  // slug ベースの検索（URLから抽出される）
  makerSlug?: string;
  modelSlug?: string;
  prefSlug?: string;
  citySlug?: string;
}

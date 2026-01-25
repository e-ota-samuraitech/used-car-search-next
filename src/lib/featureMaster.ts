/**
 * feature slug → 日本語ラベル マッピング
 *
 * 実データに存在する feature slugs:
 * auto_brake, back_camera, car_navi, cruise_control, electric,
 * four_wheel, heated_seat, hybrid, lane_assist, leather_seat,
 * no_smoking, one_owner, parking_assist, sunroof
 */

export const FEATURE_LABELS: Record<string, string> = {
  // 安全装備
  auto_brake: '自動ブレーキ',
  lane_assist: '車線逸脱防止',
  cruise_control: 'クルーズコントロール',
  back_camera: 'バックカメラ',
  parking_assist: 'パーキングアシスト',

  // パワートレイン
  hybrid: 'ハイブリッド',
  electric: '電気自動車',
  four_wheel: '4WD',

  // 快適装備
  car_navi: 'カーナビ',
  leather_seat: 'レザーシート',
  heated_seat: 'シートヒーター',
  sunroof: 'サンルーフ',

  // 履歴・状態
  one_owner: 'ワンオーナー',
  no_smoking: '禁煙車',
};

/**
 * feature slug から日本語ラベルを取得
 * 未定義の場合は slug をそのまま整形して返す
 */
export function getFeatureLabel(slug: string): string {
  if (FEATURE_LABELS[slug]) {
    return FEATURE_LABELS[slug];
  }

  // fallback: snake_case → スペース区切り
  return slug.replace(/_/g, ' ');
}

/**
 * UI に表示する feature 候補リスト
 * 表示順序を制御したい場合はここで定義
 */
export const FEATURE_DISPLAY_ORDER: string[] = [
  'hybrid',
  'electric',
  'four_wheel',
  'auto_brake',
  'car_navi',
  'back_camera',
  'cruise_control',
  'lane_assist',
  'parking_assist',
  'leather_seat',
  'heated_seat',
  'sunroof',
  'one_owner',
  'no_smoking',
];

/**
 * facets の値をラベル付きリストに変換
 */
export function featureSlugsToOptions(slugs: string[]): Array<{ slug: string; label: string }> {
  return slugs.map((slug) => ({
    slug,
    label: getFeatureLabel(slug),
  }));
}

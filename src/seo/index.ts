export type {
	AbsoluteUrl,
	Pathname,
	QueryParamValue,
	QueryParams,
	PrefSlug,
	MakerSlug,
	RobotsMetaContent,
	SeoDecision,
	SeoRouteType,
} from './types';
export {
	PREF_SLUGS,
	MAKER_SLUGS,
	normalizeQueryParam,
	buildRobotsContent,
	joinAbsoluteUrl,
} from './types';

export {
	PREF_SLUG_TO_NAME,
	PREF_NAME_TO_SLUG,
	MAKER_SLUG_TO_NAME,
	MAKER_NAME_TO_SLUG,
	toPrefSlug,
	toMakerSlug,
} from './slugMapping';

export type { CarsSeoParams } from './urlConverter';
export {
	extractCarsSeoParamsFromQuery,
	toCarsRoutingPathFromSeoParams,
	canRedirectToCarsRoutingUrl,
	toCarsRedirectPathFromQuery,
	toCarsCanonicalPathFromQuery,
} from './urlConverter';

export type { DecideSearchUiSeoInput } from './decideSeo';
export { decideSeoForCarsSearchUi } from './decideSeo';

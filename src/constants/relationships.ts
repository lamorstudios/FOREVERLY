import type {
  RelationshipType,
  RelationshipCategory,
} from '@/types/models';

/** Deutsche Anzeigenamen der Beziehungstypen. */
export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  vater: 'Vater',
  mutter: 'Mutter',
  sohn: 'Sohn',
  tochter: 'Tochter',
  bruder: 'Bruder',
  schwester: 'Schwester',
  oma: 'Oma',
  opa: 'Opa',
  tante: 'Tante',
  onkel: 'Onkel',
  cousin: 'Cousin',
  cousine: 'Cousine',
  ehepartner: 'Ehepartner',
  lebenspartner: 'Lebenspartner',
  stiefvater: 'Stiefvater',
  stiefmutter: 'Stiefmutter',
  stiefkind: 'Stiefkind',
  adoptivkind: 'Adoptivkind',
  pflegekind: 'Pflegekind',
  sonstige: 'Sonstige Familienperson',
};

/** Vorgeschlagene Kategorie (Farbe) je Beziehungstyp – in der App änderbar. */
export const DEFAULT_CATEGORY_FOR_TYPE: Record<
  RelationshipType,
  RelationshipCategory
> = {
  vater: 'biological',
  mutter: 'biological',
  sohn: 'biological',
  tochter: 'biological',
  bruder: 'biological',
  schwester: 'biological',
  oma: 'biological',
  opa: 'biological',
  tante: 'biological',
  onkel: 'biological',
  cousin: 'biological',
  cousine: 'biological',
  ehepartner: 'married',
  lebenspartner: 'married',
  stiefvater: 'patchwork',
  stiefmutter: 'patchwork',
  stiefkind: 'patchwork',
  adoptivkind: 'adoption',
  pflegekind: 'adoption',
  sonstige: 'biological',
};

export const CATEGORY_LABELS: Record<RelationshipCategory, string> = {
  biological: 'Biologische Verwandtschaft',
  married: 'Angeheiratete Familie',
  patchwork: 'Patchwork / Stieffamilie',
  adoption: 'Adoption / Pflegefamilie',
};

export const RELATIONSHIP_TYPE_OPTIONS = Object.keys(
  RELATIONSHIP_LABELS,
) as RelationshipType[];

export const CATEGORY_OPTIONS = Object.keys(
  CATEGORY_LABELS,
) as RelationshipCategory[];

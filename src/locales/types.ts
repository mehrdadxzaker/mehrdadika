export interface PortugueseSense {
  gloss: string;
  definition: string;
}

export interface PortugueseTextPair {
  en: string;
  translation: string;
}

export interface PortugueseTranslation {
  sourceWord: string;
  senses: Record<string, PortugueseSense>;
  examples: PortugueseTextPair[];
  collocations: PortugueseTextPair[];
  tip: string;
}

export interface PortugueseCatalog {
  schemaVersion: number;
  locale: "pt-BR";
  status: "preview";
  review: { humanReviewed: false };
  categories: Record<string, { label: string; subcategoryLabels?: string[] }>;
  groupLabels: Record<string, string>;
  entries: Record<string, PortugueseTranslation>;
}

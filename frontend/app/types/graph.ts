/**
 * Grafik bileşenleri için TypeScript tip tanımları
 */

/**
 * Kavram düğümü
 */
export interface Node {
  id: string;
  group?: number;
  label?: string;
  value?: number;
  title?: string;
  color?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  type?: string;
}

/**
 * Kavramlar arası ilişki bağlantısı
 */
export interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
  type?: string;
  relation?: string;
  description?: string;
  strengthClass?: string;
  label?: string;
  color?: string;
  strength?: number;
}

/**
 * D3.js formatında grafik verisi
 */
export interface GraphData {
  nodes: Node[];
  links: Link[];
}

/**
 * Ağırlıklı kenarları olan grafik
 */
export interface WeightedGraph {
  nodes: Node[];
  links: Link[];
  threshold: number;
}

/**
 * Grafik oluşturma yanıtı
 */
export interface GraphCreationResponse {
  success: boolean;
  concepts: number;
  relations: number;
  threshold: number;
  nodes: Node[];
  links: Link[];
}

/**
 * İlişki analizi sonucu
 */
export interface RelationAnalysis {
  relation: string;
  strength: number;
  description: string;
}

/**
 * Kavram karşılaştırma sonucu
 */
export interface ConceptComparison {
  concept1: string;
  concept2: string;
  cosineSimilarity: number;
  dbSimilarity: number;
  relation: string;
  relationStrength: number;
  description: string;
  relationClass: string;
}

/**
 * Benzerlik sınıfları
 */
export type StrengthClass = 'weak' | 'moderate' | 'strong' | 'very-strong';

/**
 * Benzerlik sınıfı renk eşlemeleri 
 */
export const STRENGTH_CLASS_COLORS: Record<StrengthClass, string> = {
  'weak': '#8da0cb',
  'moderate': '#66c2a5',
  'strong': '#fc8d62',
  'very-strong': '#e78ac3'
};

/**
 * İlişki türlerine göre renkler
 */
export const RELATION_TYPE_COLORS: Record<string, string> = {
  'CONTAINS': '#e41a1c',
  'IS_PART_OF': '#377eb8',
  'IS_A': '#4daf4a',
  'DEPENDS_ON': '#984ea3',
  'SIMILAR_TO': '#ff7f00',
  'OPPOSITE_OF': '#a65628',
  'RELATED_TO': '#999999'
};

/**
 * İlişki türünün Türkçe karşılıkları
 */
export const RELATION_TYPE_LABELS: Record<string, string> = {
  'CONTAINS': 'İçerir',
  'IS_PART_OF': 'Parçasıdır',
  'IS_A': 'Türüdür',
  'DEPENDS_ON': 'Bağlıdır',
  'SIMILAR_TO': 'Benzerdir',
  'OPPOSITE_OF': 'Zıttıdır',
  'RELATED_TO': 'İlişkilidir'
}; 
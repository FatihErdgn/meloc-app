/**
 * Kavramlar arası ilişki tipleri işlemleri için yardımcı fonksiyonlar
 */

/**
 * Geçerli ilişki tipleri
 */
export const VALID_RELATION_TYPES = [
  "CONTAINS",   // İçerir
  "IS_PART_OF", // Parçasıdır
  "IS_A",       // Türüdür
  "DEPENDS_ON", // Bağlıdır
  "SIMILAR_TO", // Benzerdir
  "OPPOSITE_OF", // Zıttıdır
  "RELATED_TO"  // İlişkilidir (genel)
];

/**
 * İlişki tipini doğrular ve geçerli forma dönüştürür
 * @param {string} relationType - İlişki tipi
 * @returns {string} - Doğrulanmış ilişki tipi
 */
export function validateRelationType(relationType) {
  if (!relationType) return "RELATED_TO";
  
  const normalizedType = relationType.toUpperCase();
  
  if (VALID_RELATION_TYPES.includes(normalizedType)) {
    return normalizedType;
  }
  
  // İlişki tipi Türkçe girilmiş olabilir, eşleşmeye çalış
  const turkishToEnglish = {
    "İÇERİR": "CONTAINS",
    "ICERIR": "CONTAINS",
    "PARÇASIDIR": "IS_PART_OF",
    "PARCASIDIR": "IS_PART_OF", 
    "TÜRÜDÜR": "IS_A",
    "TURUDUR": "IS_A",
    "BAĞLIDIR": "DEPENDS_ON",
    "BAGLIDIR": "DEPENDS_ON",
    "BENZERDİR": "SIMILAR_TO",
    "BENZERDIR": "SIMILAR_TO",
    "ZITTIDIR": "OPPOSITE_OF",
    "İLİŞKİLİDİR": "RELATED_TO",
    "ILISKILIDIR": "RELATED_TO"
  };
  
  return turkishToEnglish[normalizedType] || "RELATED_TO";
}

/**
 * İlişki tipinin Türkçe karşılığını döndürür
 * @param {string} relationType - İlişki tipi (İngilizce)
 * @returns {string} - İlişki tipinin Türkçe karşılığı
 */
export function getRelationTypeLabel(relationType) {
  const labels = {
    "CONTAINS": "İçerir",
    "IS_PART_OF": "Parçasıdır",
    "IS_A": "Türüdür",
    "DEPENDS_ON": "Bağlıdır",
    "SIMILAR_TO": "Benzerdir",
    "OPPOSITE_OF": "Zıttıdır",
    "RELATED_TO": "İlişkilidir"
  };
  
  return labels[validateRelationType(relationType)] || "İlişkilidir";
}

/**
 * İki kavram arasında ilişki kurulabilir mi kontrol eder
 * @param {number} similarity - Benzerlik skoru (0-1 arası)
 * @param {number} relationStrength - İlişki gücü (0-1 arası)
 * @param {number} threshold - Minimum benzerlik eşiği
 * @returns {boolean} - İlişki kurulabilir mi
 */
export function shouldCreateRelation(similarity, relationStrength, threshold = 0.25) {
  // Benzerlik skoru eşik değerinden düşükse ilişki kurulmamalı
  if (similarity < threshold) return false;
  
  // İlişki gücü çok düşükse ilişki kurulmamalı (anlamsız ilişkiler)
  if (relationStrength < 0.2) return false;
  
  return true;
}

/**
 * İlişki türü ve gücüne göre ilişki kurulabilir mi kontrol eder
 * @param {string} relationType - İlişki türü
 * @param {number} relationStrength - İlişki gücü (0-1 arası)
 * @param {number} similarity - Benzerlik skoru (0-1 arası)
 * @returns {boolean} - İlişki kurulabilir mi
 */
export function shouldCreateRelationWithType(relationType, relationStrength, similarity) {
  // İlişki tipi RELATED_TO ise daha katı filtreleme uygula
  if (relationType === "RELATED_TO") {
    // RELATED_TO ilişkileri için daha yüksek benzerlik ve güç eşiği
    if (similarity < 0.4 || relationStrength < 0.4) {
      return false;
    }
    
    // Çok düşük güçlü ilişkileri reddet
    if (relationStrength <= 0.2) {
      return false;
    }
  } else {
    // Diğer ilişki türleri için normal kontrol
    if (similarity < 0.25 || relationStrength < 0.3) {
      return false;
    }
  }
  
  return true;
}

export default {
  VALID_RELATION_TYPES,
  validateRelationType,
  getRelationTypeLabel,
  shouldCreateRelation,
  shouldCreateRelationWithType
}; 
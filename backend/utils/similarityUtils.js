/**
 * Anlamsal benzerlik hesaplama yardımcı fonksiyonları
 */

/**
 * İki vektör arasında kosinüs benzerliği hesaplar
 * @param {number[]} a - Birinci vektör
 * @param {number[]} b - İkinci vektör
 * @returns {number} - Benzerlik değeri (0-1 arası)
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || !a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  // Nokta çarpımı
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  
  // Vektör büyüklükleri
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * İki vektör arasında Öklid mesafesi hesaplar
 * @param {number[]} a - Birinci vektör
 * @param {number[]} b - İkinci vektör
 * @returns {number} - Mesafe değeri
 */
export function euclideanDistance(a, b) {
  if (!a || !b || !a.length || !b.length || a.length !== b.length) {
    return Infinity;
  }
  
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
}

/**
 * Öklid mesafesini benzerlik skoruna dönüştürür (0-1 arası)
 * @param {number} distance - Öklid mesafesi
 * @returns {number} - Benzerlik değeri (0-1 arası)
 */
export function distanceToSimilarity(distance) {
  // Mesafeyi [0,1] aralığına sıkıştır
  return 1 / (1 + distance);
}

/**
 * Birden çok benzerlik skorunu ağırlıklı olarak birleştirir
 * @param {Object} scores - Benzerlik skorları {method1: score1, method2: score2, ...}
 * @param {Object} weights - Her yöntemin ağırlığı {method1: weight1, method2: weight2, ...}
 * @returns {number} - Ağırlıklı toplam benzerlik skoru
 */
export function combineSimilarityScores(scores, weights = null) {
  if (!scores || typeof scores !== 'object') {
    return 0;
  }
  
  const methods = Object.keys(scores);
  
  // Varsayılan ağırlıklar eşit dağılımlı
  if (!weights) {
    weights = {};
    const equalWeight = 1 / methods.length;
    methods.forEach(method => {
      weights[method] = equalWeight;
    });
  }
  
  // Ağırlıkların toplamının 1 olması için normalleştirme
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const normalizedWeights = {};
  
  Object.keys(weights).forEach(key => {
    normalizedWeights[key] = weights[key] / totalWeight;
  });
  
  // Ağırlıklı toplam
  return methods.reduce((sum, method) => {
    if (typeof scores[method] === 'number' && typeof normalizedWeights[method] === 'number') {
      return sum + (scores[method] * normalizedWeights[method]);
    }
    return sum;
  }, 0);
}

/**
 * İlişki gücüne göre ilişki sınıfını belirler
 * @param {number} strength - İlişki gücü (0-1 arası)
 * @returns {string} - İlişki sınıfı (weak, moderate, strong, very-strong)
 */
export function classifyRelationStrength(strength) {
  if (strength < 0.3) return 'weak';
  if (strength < 0.6) return 'moderate';
  if (strength < 0.85) return 'strong';
  return 'very-strong';
} 
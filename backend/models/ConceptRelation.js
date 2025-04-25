/**
 * Kavramlar arası ilişki modeli
 */
class ConceptRelation {
  /**
   * Yeni bir kavram ilişkisi nesnesi oluşturur
   * @param {string} sourceText - Kaynak kavram metni
   * @param {string} targetText - Hedef kavram metni
   * @param {string} type - İlişki türü
   * @param {number} weight - İlişki ağırlığı (0-1 arası)
   * @param {string} description - İlişki açıklaması
   * @param {object} properties - Ek ilişki özellikleri
   */
  constructor(sourceText, targetText, type = "RELATED_TO", weight = 0.5, description = "", properties = {}) {
    this.sourceText = sourceText;
    this.targetText = targetText;
    this.type = type;
    this.weight = weight;
    this.description = description;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Ek özellikleri ekle
    Object.assign(this, properties);
  }

  /**
   * Veritabanından gelen verileri modele dönüştürür
   * @param {object} record - Neo4j kaydı veya nesne
   * @returns {ConceptRelation} - ConceptRelation nesnesi
   */
  static fromRecord(record) {
    if (!record || !record.sourceText || !record.targetText) {
      throw new Error('Geçersiz ilişki verisi');
    }

    const {
      sourceText,
      targetText,
      relationType,
      weight,
      description = "",
      ...properties
    } = record;

    return new ConceptRelation(
      sourceText,
      targetText,
      relationType || "RELATED_TO",
      weight || 0.5,
      description,
      properties
    );
  }

  /**
   * İlişki gücüne göre sınıf belirler
   * @returns {string} - İlişki sınıfı (weak, moderate, strong, very-strong)
   */
  getStrengthClass() {
    if (this.weight < 0.3) return 'weak';
    if (this.weight < 0.6) return 'moderate';
    if (this.weight < 0.85) return 'strong';
    return 'very-strong';
  }

  /**
   * İlişkinin düğüm ve kenar formatına dönüştürülmesi (D3.js uyumlu)
   * @returns {object} - {source, target, value, type, description} formatında nesne
   */
  toGraphFormat() {
    return {
      source: this.sourceText,
      target: this.targetText,
      value: this.weight,
      type: this.type,
      description: this.description || "",
      strengthClass: this.getStrengthClass()
    };
  }

  /**
   * İlişkinin JSON formatına dönüştürülmesi
   * @returns {object} - JSON formatında nesne
   */
  toJSON() {
    return {
      sourceText: this.sourceText,
      targetText: this.targetText,
      type: this.type,
      weight: this.weight,
      description: this.description,
      strengthClass: this.getStrengthClass(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default ConceptRelation; 
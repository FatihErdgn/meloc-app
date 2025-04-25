/**
 * Kavram modeli - Neo4j veritabanını kullanırken referans olarak kullanılacak
 */
class Concept {
  /**
   * Yeni bir kavram nesnesi oluşturur
   * @param {string} text - Kavram metni
   * @param {number[]} embedding - Kavram vektörü
   * @param {object} metadata - Ek kavram bilgileri
   */
  constructor(text, embedding = null, metadata = {}) {
    this.text = text;
    this.embedding = embedding;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Metadata özelliklerini ekle
    Object.assign(this, metadata);
  }

  /**
   * Veritabanından gelen verileri modele dönüştürür
   * @param {object} dbRecord - Veritabanından gelen kayıt
   * @returns {Concept} - Concept nesnesi
   */
  static fromDbRecord(dbRecord) {
    if (!dbRecord || !dbRecord.text) {
      throw new Error('Geçersiz kavram verisi');
    }
    
    const { text, embedding, ...metadata } = dbRecord;
    return new Concept(text, embedding, metadata);
  }

  /**
   * Modeli veritabanı formatına dönüştürür
   * @returns {object} - Veritabanına kaydedilebilir nesne
   */
  toDbFormat() {
    const { text, embedding, createdAt, updatedAt, ...rest } = this;
    
    return {
      text,
      embedding,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      ...rest
    };
  }

  /**
   * Modeli JSON formatına dönüştürür (embedding hariç - çok uzun olabilir)
   * @returns {object} - JSON formatında nesne
   */
  toJSON() {
    const { embedding, ...rest } = this;
    return {
      ...rest,
      hasEmbedding: Boolean(embedding)
    };
  }
}

export default Concept; 
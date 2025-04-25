import neo4j from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

/**
 * Neo4j veritabanı servis sınıfı
 */
class Neo4jService {
  constructor() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
    );
  }

  /**
   * Kavramı ve embeddingini veritabanına kaydeder
   * @param {string} text - Kavram metni
   * @param {number[]} embedding - Kavram embedding vektörü
   * @param {object} metadata - Ek metadata (kategori, tür vb.)
   * @returns {Promise<object>} - Kayıt sonucu
   */
  async saveConcept(text, embedding, metadata = {}) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MERGE (c:Concept {text: $text})
        SET c.embedding = $embedding,
            c.updatedAt = datetime(),
            c += $metadata
        RETURN c
        `,
        {
          text,
          embedding,
          metadata
        }
      );
      
      return result.records[0].get("c").properties;
    } catch (error) {
      console.error("Neo4j Concept Kayıt Hatası:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * İki kavram arasında ilişki oluşturur
   * @param {string} source - Kaynak kavram metni
   * @param {string} target - Hedef kavram metni
   * @param {string} relationName - İlişki türü
   * @param {number} weight - İlişki ağırlığı (0-1 arası)
   * @param {object} properties - İlişki için ek özellikler
   * @returns {Promise<object>} - İlişki sonucu
   */
  async createRelation(source, target, relationName = "RELATED_TO", weight = 0.5, properties = {}) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (a:Concept {text: $source})
        MATCH (b:Concept {text: $target})
        MERGE (a)-[r:${relationName} {weight: $weight}]->(b)
        SET r += $properties,
            r.updatedAt = datetime()
        RETURN r, a, b
        `,
        {
          source,
          target,
          weight,
          properties
        }
      );

      return {
        relation: result.records[0].get("r").properties,
        source: result.records[0].get("a").properties,
        target: result.records[0].get("b").properties
      };
    } catch (error) {
      console.error(`Neo4j İlişki Oluşturma Hatası: ${error.message}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Bir konseptin tüm ilişkilerini getirir
   * @param {string} conceptText - Konsept metni
   * @returns {Promise<Array>} - İlişkiler dizisi
   */
  async getConceptRelations(conceptText) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (c:Concept {text: $conceptText})-[r]-(related)
        RETURN type(r) as relationType, r.weight as weight, r.description as description, 
               related.text as relatedConcept, r as relation, related as node
        ORDER BY r.weight DESC
        `,
        { conceptText }
      );

      return result.records.map(record => ({
        sourceText: conceptText,
        targetText: record.get("relatedConcept"),
        relationType: record.get("relationType"),
        weight: record.get("weight"),
        description: record.get("description") || "",
        relation: record.get("relation").properties,
        relatedNode: record.get("node").properties
      }));
    } catch (error) {
      console.error(`Neo4j İlişki Getirme Hatası: ${error.message}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Tüm kavram ağını getirir
   * @param {number} limit - Maksimum kavram sayısı
   * @returns {Promise<{nodes: Array, links: Array}>} - Kavram ve ilişki ağı
   */
  async getConceptNetwork(limit = 100) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (c:Concept)
        WITH c LIMIT $limit
        OPTIONAL MATCH (c)-[r]-(related)
        WHERE related:Concept
        RETURN DISTINCT c.text as source, related.text as target, 
               type(r) as relationType, r.weight as weight, r.description as description
        `,
        { limit: neo4j.int(limit) }
      );

      // Benzersiz düğümleri oluştur
      const uniqueNodes = new Map();
      const links = [];

      result.records.forEach(record => {
        const source = record.get("source");
        const target = record.get("target");
        
        if (source && !uniqueNodes.has(source)) {
          uniqueNodes.set(source, { id: source });
        }
        
        if (target && !uniqueNodes.has(target)) {
          uniqueNodes.set(target, { id: target });
        }
        
        if (source && target) {
          links.push({
            source,
            target,
            relationType: record.get("relationType"),
            weight: record.get("weight"),
            description: record.get("description") || ""
          });
        }
      });

      return {
        nodes: Array.from(uniqueNodes.values()),
        links
      };
    } catch (error) {
      console.error(`Neo4j Ağ Getirme Hatası: ${error.message}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * İki metin arasındaki anlamsal benzerliği hesaplar
   * @param {string} text1 - Birinci metin
   * @param {string} text2 - İkinci metin
   * @returns {Promise<{similarity: number, text1: string, text2: string}>}
   */
  async computeSimilarity(text1, text2) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (a:Concept {text: $text1}), (b:Concept {text: $text2})
        WHERE a.embedding IS NOT NULL AND b.embedding IS NOT NULL
        RETURN gds.similarity.cosine(a.embedding, b.embedding) as similarity
        `,
        { text1, text2 }
      );

      return {
        text1,
        text2,
        similarity: result.records.length > 0 ? result.records[0].get("similarity") : 0
      };
    } catch (error) {
      console.error(`Neo4j Benzerlik Hesaplama Hatası: ${error.message}`);
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Veritabanı bağlantısını kapatır
   */
  async close() {
    await this.driver.close();
  }
}

export default new Neo4jService(); 
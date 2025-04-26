import openaiService from '../services/openaiService.js';
import neo4jService from '../services/neo4jService.js';
import * as similarityUtils from '../utils/similarityUtils.js';
import * as relationUtils from '../utils/relationUtils.js';

/**
 * Kavram grafiği kontrolcüsü
 */
class GraphController {
  /**
   * Kavramsasl grafik oluşturur ve döndürür
   * @param {Request} req - Express isteği
   * @param {Response} res - Express yanıtı
   */
  async createGraph(req, res) {
    const { terms, similarityThreshold = 0.7, includeRelations = true } = req.body;

    if (!Array.isArray(terms) || terms.length === 0) {
      return res.status(400).json({ 
        error: "Geçerli bir kavram dizisi gerekli",
        details: "terms parametresi en az bir kavram içeren bir dizi olmalıdır"
      });
    }

    try {
      // Kavramlar için embeddingler alınır
      const conceptsWithEmbeddings = await openaiService.getBatchEmbeddings(terms);
      const savedConcepts = [];

      // Her kavram ve embeddingi veritabanına kaydedilir
      for (const { text, embedding } of conceptsWithEmbeddings) {
        const savedConcept = await neo4jService.saveConcept(text, embedding);
        savedConcepts.push(savedConcept);
      }

      // İlişkiler oluşturulur
      const relations = [];

      if (includeRelations && terms.length > 1) {
        // İkili kavram kombinasyonları için ilişkiler hesaplanır
        for (let i = 0; i < conceptsWithEmbeddings.length; i++) {
          for (let j = i + 1; j < conceptsWithEmbeddings.length; j++) {
            const concept1 = conceptsWithEmbeddings[i];
            const concept2 = conceptsWithEmbeddings[j];
            
            // Kosinüs benzerliği hesaplanır
            const similarity = similarityUtils.cosineSimilarity(
              concept1.embedding, 
              concept2.embedding
            );
            
            // Benzerlik eşiğinden büyükse ilişki oluşturulur
            if (similarity >= similarityThreshold) {
              // İki kavram arasındaki ilişki türü ve açıklaması belirlenir
              const relationDetails = await openaiService.analyzeConceptRelation(
                concept1.text,
                concept2.text
              );
              
              // İlişki kurulmalı mı kontrol et
              if (!relationUtils.shouldCreateRelation(similarity, relationDetails.strength, 0.25)) {
                console.log(`Düşük benzerlik/ilişki gücü nedeniyle atlandı: ${concept1.text} - ${concept2.text} (${similarity}/${relationDetails.strength})`);
                continue;
              }
              
              // İlişki türünün doğrulanması
              const relationType = relationUtils.validateRelationType(relationDetails.relation);
              
              // Kavram ilişkisi veritabanına kaydedilir
              const relationResult = await neo4jService.createRelation(
                concept1.text,
                concept2.text,
                relationType,
                relationDetails.strength,
                { description: relationDetails.description }
              );
              
              relations.push({
                source: concept1.text,
                target: concept2.text,
                similarity,
                relation: relationType,
                strength: relationDetails.strength,
                description: relationDetails.description,
                ...relationResult
              });
            }
          }
        }
      }

      res.json({
        success: true,
        concepts: savedConcepts.length,
        relations: relations.length,
        threshold: similarityThreshold,
        nodes: savedConcepts.map(c => ({ id: c.text })),
        links: relations.map(r => ({
          source: r.source,
          target: r.target,
          value: r.strength || r.similarity,
          relation: r.relation,
          description: r.description
        }))
      });
    } catch (error) {
      console.error("Grafik oluşturma hatası:", error);
      res.status(500).json({ 
        error: "Grafik oluşturulurken bir hata oluştu", 
        details: error.message 
      });
    }
  }

  /**
   * Kavram ağını getirir
   * @param {Request} req - Express isteği
   * @param {Response} res - Express yanıtı
   */
  async getConceptNetwork(req, res) {
    try {
      const { limit = 100 } = req.query;
      const numLimit = parseInt(limit);
      
      const network = await neo4jService.getConceptNetwork(numLimit);
      
      // Ağ verilerini D3.js formatına dönüştür
      const formattedNetwork = {
        nodes: network.nodes.map(node => ({
          id: node.id,
          group: 1 // Gruplandırma için gelecekte metadata kullanılabilir
        })),
        links: network.links.map(link => ({
          source: link.source,
          target: link.target,
          value: link.weight || 0.5,
          type: link.relationType,
          description: link.description || ''
        }))
      };
      
      res.json(formattedNetwork);
    } catch (error) {
      console.error("Ağ getirme hatası:", error);
      res.status(500).json({ 
        error: "Kavram ağı getirilirken bir hata oluştu",
        details: error.message
      });
    }
  }

  /**
   * Bir kavramın tüm ilişkilerini getirir
   * @param {Request} req - Express isteği
   * @param {Response} res - Express yanıtı
   */
  async getConceptRelations(req, res) {
    try {
      const { concept } = req.params;
      
      if (!concept) {
        return res.status(400).json({ error: "Kavram parametresi gerekli" });
      }
      
      const relations = await neo4jService.getConceptRelations(concept);
      
      res.json({
        concept,
        relations,
        relationsCount: relations.length
      });
    } catch (error) {
      console.error("İlişki getirme hatası:", error);
      res.status(500).json({ 
        error: "Kavram ilişkileri getirilirken bir hata oluştu",
        details: error.message
      });
    }
  }
  
  /**
   * İki kavramın benzerliğini hesaplar
   * @param {Request} req - Express isteği
   * @param {Response} res - Express yanıtı
   */
  async compareConcepts(req, res) {
    try {
      const { concept1, concept2 } = req.body;
      
      if (!concept1 || !concept2) {
        return res.status(400).json({ error: "İki kavram da gerekli" });
      }
      
      // Eğer veri tabanında bu kavramlar yoksa, embed edilip kaydedilir
      let embed1, embed2;
      
      try {
        embed1 = await openaiService.getEmbedding(concept1);
        embed2 = await openaiService.getEmbedding(concept2);
        
        await neo4jService.saveConcept(concept1, embed1);
        await neo4jService.saveConcept(concept2, embed2);
      } catch (embedError) {
        console.error("Embedding hatası:", embedError);
      }
      
      // Kosinüs benzerliği direkt hesaplanır
      const directSimilarity = similarityUtils.cosineSimilarity(embed1, embed2);
      
      // Neo4j üzerinden de benzerlik hesaplanır
      const dbSimilarity = await neo4jService.computeSimilarity(concept1, concept2);
      
      // İlişki analizi yapılır
      const relation = await openaiService.analyzeConceptRelation(concept1, concept2);
      
      // İlişki türünün doğrulanması
      const relationType = relationUtils.validateRelationType(relation.relation);
      
      res.json({
        concept1,
        concept2,
        cosineSimilarity: directSimilarity,
        dbSimilarity: dbSimilarity.similarity,
        relation: relationType,
        relationStrength: relation.strength,
        description: relation.description,
        relationClass: similarityUtils.classifyRelationStrength(relation.strength)
      });
    } catch (error) {
      console.error("Kavram karşılaştırma hatası:", error);
      res.status(500).json({ 
        error: "Kavramlar karşılaştırılırken bir hata oluştu",
        details: error.message 
      });
    }
  }
}

export default new GraphController(); 
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

/**
 * OpenAI servis sınıfı - embeddings ve anlamsal analiz için
 */
class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Verilen metin için embedding vektörü oluşturur
   * @param {string} text - Embedding alınacak metin
   * @returns {Promise<number[]>} - Embedding vektörü
   */
  async getEmbedding(text) {
    try {
      // Text-embedding-3-small kullanılarak daha kaliteli embeddings
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 1536, // Daha yüksek boyut, daha iyi anlamsal yakalama
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error(`OpenAI Embedding Hatası: ${error.message}`);
      throw new Error(`Embedding alınamadı: ${error.message}`);
    }
  }

  /**
   * Toplu metin verileri için embedding vektörleri oluşturur
   * @param {string[]} texts - Embedding alınacak metin dizisi
   * @returns {Promise<Array<{text: string, embedding: number[]}>>} - Metin ve embeddingleri içeren dizi
   */
  async getBatchEmbeddings(texts) {
    try {
      const results = [];
      
      // Rate limiting için batch işlem
      for (const text of texts) {
        const embedding = await this.getEmbedding(text);
        results.push({ text, embedding });
        
        // API rate limitlerini aşmamak için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return results;
    } catch (error) {
      console.error(`Toplu Embedding Hatası: ${error.message}`);
      throw new Error(`Toplu embeddingler alınamadı: ${error.message}`);
    }
  }

  /**
   * İki kavram arasındaki ilişkiyi anlamak için OpenAI'yi kullanır
   * @param {string} concept1 - Birinci kavram
   * @param {string} concept2 - İkinci kavram
   * @returns {Promise<{relation: string, strength: number, description: string}>} - İlişki bilgisi
   */
  async analyzeConceptRelation(concept1, concept2) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // En güncel model kullanılıyor
        messages: [
          {
            role: "system",
            content: `Sen bir bilgi ağı uzmanısın. İki kavram arasındaki ilişkiyi dikkatlice analiz et.
            
            Sadece aşağıdaki ilişki türlerinden birini seçmelisin:
            - CONTAINS (İçerir): Bir kavram diğerini içerir/kapsar
            - IS_PART_OF (Parçasıdır): Bir kavram diğerinin parçasıdır
            - IS_A (Türüdür): Bir kavram diğerinin alt türüdür
            - DEPENDS_ON (Bağlıdır): Bir kavram diğerine bağımlıdır
            - SIMILAR_TO (Benzerdir): İki kavram benzerdir
            - OPPOSITE_OF (Zıttıdır): İki kavram birbirinin zıttıdır
            - RELATED_TO (İlişkilidir): Sadece yukarıdaki kategorilere uymayan ilişkiler için kullan
            
            ÖNEMLİ: "RELATED_TO" ilişki türü, sadece diğer spesifik türler uygun olmadığında ve kavramlar arasında GERÇEKLİK VE DOĞRULUK temelinde anlamlı bir bağlantı olduğunda kullanılmalıdır.
            
            Aralarında gerçekten hiçbir mantıklı ilişki bulunmayan kavramlar için kesinlikle "RELATED_TO" İLİŞKİSİ KULLANMA.
            Geniş veya zorlama bağlantılar kurma. Örneğin "döner" ve "trigonometri" arasında anlamlı bir ilişki yoktur.
            
            Gerçekten ilişkisiz kavramlarda yanıtın şöyle olmalıdır:
            {
              "relation": "RELATED_TO",
              "strength": 0.1,
              "description": "Anlamlı bir ilişki bulunamadı"
            }
            
            Verilen iki kavramın mantıklı bir ilişkisi olmadığından eminsen, ilişki gücünü 0.1 olarak belirle.`
          },
          {
            role: "user",
            content: `"${concept1}" ve "${concept2}" kavramları arasındaki ilişkiyi analiz et. 
            İlişkisiz veya çok zorlama bir bağlantı ise, bunu açıkça belirt.
            
            Aşağıdaki JSON formatında yanıt ver:
            {
              "relation": "CONTAINS, IS_PART_OF, IS_A, DEPENDS_ON, SIMILAR_TO, OPPOSITE_OF veya RELATED_TO türlerinden biri olmalı",
              "strength": 0 ile 1 arası ilişki gücü (0.1 - çok zayıf/ilişkisiz, 1.0 - çok güçlü),
              "description": "İlişkinin kısa açıklaması (maksimum 100 karakter)"
            }`
          }
        ],
        response_format: { type: "json_object" }
      });

      try {
        const parsed = JSON.parse(response.choices[0].message.content);
        
        // İlişki türünü doğrula ve düzelt
        const validRelationTypes = ["CONTAINS", "IS_PART_OF", "IS_A", "DEPENDS_ON", "SIMILAR_TO", "OPPOSITE_OF", "RELATED_TO"];
        if (!validRelationTypes.includes(parsed.relation.toUpperCase())) {
          parsed.relation = "RELATED_TO";
        } else {
          parsed.relation = parsed.relation.toUpperCase();
        }
        
        // İlişki gücünü kontrol et - çok zayıf ilişkileri ele al
        if (parsed.relation === "RELATED_TO" && parsed.strength <= 0.3) {
          // İlişki açıklamasını kontrol et
          const lowStrengthKeywords = ["bulunamadı", "ilişki yok", "bağlantı yok", "zayıf", "zorla", "belirsiz"];
          
          if (lowStrengthKeywords.some(keyword => parsed.description.toLowerCase().includes(keyword))) {
            parsed.strength = 0.1; // İlişki gücünü minimum yap
            parsed.description = "Anlamlı bir ilişki bulunamadı";
          }
        }
        
        return parsed;
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError);
        return {
          relation: "RELATED_TO",
          strength: 0.1,
          description: "İlişki belirlenemedi (parse hatası)"
        };
      }
    } catch (error) {
      console.error(`Kavram Analizi Hatası: ${error.message}`);
      return {
        relation: "RELATED_TO",
        strength: 0.1,
        description: "API hatası nedeniyle ilişki analiz edilemedi"
      };
    }
  }
}

export default new OpenAIService(); 
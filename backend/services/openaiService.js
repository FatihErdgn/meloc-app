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
            content: "Sen bir bilgi ağı uzmanısın. İki kavram arasındaki ilişkiyi analiz et."
          },
          {
            role: "user",
            content: `"${concept1}" ve "${concept2}" kavramları arasındaki ilişkiyi analiz et. 
            Aşağıdaki JSON formatında yanıt ver:
            {
              "relation": "İlişki türü (örn: 'içerir', 'türüdür', 'kullanır', 'benzerdir')",
              "strength": 0 ile 1 arası ilişki gücü (0.1 - çok zayıf, 1.0 - çok güçlü),
              "description": "İlişkinin kısa açıklaması (maksimum 100 karakter)"
            }`
          }
        ],
        response_format: { type: "json_object" }
      });

      try {
        return JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        console.error("JSON parse hatası:", parseError);
        return {
          relation: "belirsiz",
          strength: 0.5,
          description: "İlişki belirlenemedi"
        };
      }
    } catch (error) {
      console.error(`Kavram Analizi Hatası: ${error.message}`);
      return {
        relation: "hata",
        strength: 0,
        description: "API hatası nedeniyle ilişki analiz edilemedi"
      };
    }
  }
}

export default new OpenAIService(); 
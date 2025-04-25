/**
 * API ile iletişimi sağlayan servis
 */

// API temel URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * API isteği yapar
 * @param endpoint - API endpoint
 * @param options - İstek seçenekleri
 * @returns - İstek sonucu
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  // Varsayılan header'ları ekle
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, options);

    // JSON yanıtı parse et
    const data = await response.json();
    
    // Başarısız yanıt kontrolü
    if (!response.ok) {
      throw new Error(data.error || 'API isteği başarısız oldu');
    }
    
    return data as T;
  } catch (error) {
    console.error(`API isteği başarısız: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Kavram grafiği oluşturur
 * @param terms - Kavram dizisi
 * @param similarityThreshold - Benzerlik eşiği
 * @param includeRelations - İlişkiler dahil edilsin mi
 */
export async function createGraph(
  terms: string[], 
  similarityThreshold = 0.7,
  includeRelations = true
) {
  return apiRequest('/graph', {
    method: 'POST',
    body: JSON.stringify({ 
      terms, 
      similarityThreshold, 
      includeRelations 
    }),
  });
}

/**
 * Kavram ağını getirir
 * @param limit - Maksimum kavram sayısı
 */
export async function getConceptNetwork(limit = 100) {
  return apiRequest(`/graph?limit=${limit}`);
}

/**
 * Bir kavramın ilişkilerini getirir
 * @param concept - Kavram
 */
export async function getConceptRelations(concept: string) {
  return apiRequest(`/concepts/${encodeURIComponent(concept)}/relations`);
}

/**
 * İki kavramı karşılaştırır
 * @param concept1 - Birinci kavram
 * @param concept2 - İkinci kavram
 */
export async function compareConcepts(concept1: string, concept2: string) {
  return apiRequest('/concepts/compare', {
    method: 'POST',
    body: JSON.stringify({ concept1, concept2 }),
  });
}

/**
 * Virgülle ayrılmış metni kavram dizisine dönüştürür
 * @param text - Virgülle ayrılmış metin
 * @returns - Diziye dönüştürülmüş kavramlar
 */
export function parseTermsInput(text: string): string[] {
  if (!text) return [];
  return text.split(',')
    .map(term => term.trim())
    .filter(Boolean);
}

// İçerik önerileri almak için fonksiyon
async function getContentRecommendations(concepts: string[], type?: string): Promise<ContentRecommendation[]> {
  try {
    // Burada gerçek bir API çağrısı olacak, şu an için örnek veri döndürüyoruz
    const response = await mockRecommendationsAPI(concepts, type);
    return response;
  } catch (error) {
    console.error("İçerik önerileri alınamadı:", error);
    throw error;
  }
}

// Gerçek API bağlantısı yapılana kadar mock veri
function mockRecommendationsAPI(concepts: string[], type?: string): Promise<ContentRecommendation[]> {
  // Simüle edilmiş bir gecikme ekliyoruz
  return new Promise((resolve) => {
    setTimeout(() => {
      // Gelen kavramlara göre içerik önerileri oluştur
      const recommendations: ContentRecommendation[] = [];
      
      // Bazı örnek içerik önerileri (gerçek uygulamada API'den gelecek)
      const mockDatabase = [
        {
          title: "Bilgi Haritalaması ve Anlambilimsel Ağlar",
          type: "article",
          author: "Dr. Ayşe Yılmaz",
          url: "https://example.com/articles/semantic-networks",
          description: "Bu makale, bilgi haritalaması ve anlambilimsel ağların öğrenme üzerindeki etkilerini incelemektedir.",
          concepts: ["bilgi", "ağ", "öğrenme", "zihin"]
        },
        {
          title: "Düşünme Sanatı: Zihin Haritaları",
          type: "book",
          author: "Tony Buzan",
          url: "https://example.com/books/mind-mapping",
          description: "Zihin haritaları yöntemiyle düşünce süreçlerinizi nasıl geliştirebileceğinizi anlatan klasik kitap.",
          concepts: ["zihin", "harita", "düşünme", "bellek"]
        },
        {
          title: "Bilişsel Ağlar ve Yapay Zeka",
          type: "video",
          author: "Prof. Mehmet Demir",
          url: "https://example.com/videos/cognitive-networks-ai",
          description: "Bilişsel ağların yapay zeka teknolojilerindeki uygulamalarını anlatan video ders.",
          concepts: ["ağ", "yapay zeka", "bilişsel", "teknoloji"]
        },
        {
          title: "Bilgi Görselleştirme Teknikleri",
          type: "article",
          author: "Zeynep Kaya",
          url: "https://example.com/articles/data-visualization",
          description: "Karmaşık bilgilerin görselleştirme yöntemleri ile daha anlaşılır hale getirilmesi.",
          concepts: ["grafik", "görselleştirme", "bilgi", "veri"]
        },
        {
          title: "Anlamsal Ağların Eğitimde Kullanımı",
          type: "course",
          author: "Eğitim Teknolojileri Akademisi",
          url: "https://example.com/courses/semantic-networks-education",
          description: "Eğitimciler için anlamsal ağların öğretim süreçlerinde kullanımına dair online kurs.",
          concepts: ["ağ", "eğitim", "öğrenme", "anlamsal"]
        },
        {
          title: "Hafıza Teknikleri ve Bilgi Sarayları",
          type: "book",
          author: "Joshua Foer",
          url: "https://example.com/books/memory-techniques",
          description: "Antik hafıza teknikleri ve bilgi sarayları yöntemiyle hafızanızı nasıl geliştirebilirsiniz.",
          concepts: ["bellek", "saray", "hafıza", "zihin"]
        }
      ];
      
      // Kavramlara göre filtreleme
      for (const item of mockDatabase) {
        // En az bir kavram eşleşiyorsa listeye ekle
        const hasMatchingConcept = concepts.some(concept => 
          item.concepts.includes(concept.toLowerCase().trim())
        );
        
        // İçerik türü belirtildiyse ona göre de filtrele
        const matchesType = !type || item.type === type;
        
        if (hasMatchingConcept && matchesType) {
          recommendations.push({
            id: Math.random().toString(36).substring(2, 9),
            title: item.title,
            type: item.type as ContentType,
            author: item.author,
            url: item.url,
            description: item.description,
            relevance: calculateRelevance(concepts, item.concepts)
          });
        }
      }
      
      // Alaka düzeyine göre sırala
      recommendations.sort((a, b) => b.relevance - a.relevance);
      
      resolve(recommendations);
    }, 800); // 800ms gecikme
  });
}

// Kavramların eşleşme oranına göre alaka düzeyini hesapla
function calculateRelevance(userConcepts: string[], itemConcepts: string[]): number {
  let matchCount = 0;
  
  for (const concept of userConcepts) {
    if (itemConcepts.includes(concept.toLowerCase().trim())) {
      matchCount++;
    }
  }
  
  // Alaka düzeyi: (eşleşen kavram sayısı / toplam kavram sayısı) olarak hesaplanıyor
  return (matchCount / userConcepts.length) * 100;
}

// Tip tanımlamaları
export type ContentType = 'article' | 'book' | 'video' | 'course' | 'tool';

export interface ContentRecommendation {
  id: string;
  title: string;
  type: ContentType;
  author: string;
  url: string;
  description: string;
  relevance: number;
}

/**
 * API servis fonksiyonları
 */
const ApiService = {
  createGraph,
  getConceptNetwork,
  getConceptRelations,
  compareConcepts,
  parseTermsInput,
  getContentRecommendations
};

export default ApiService; 
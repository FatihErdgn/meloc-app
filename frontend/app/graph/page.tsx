"use client";
import { useState, useEffect } from "react";
import ApiService, { parseTermsInput } from "../services/api";
import GraphVisualizer from "../components/GraphVisualizer";
import ContentRecommendations from "../components/ContentRecommendations";
import { ConceptComparison, GraphData, Link, Node, RELATION_TYPE_COLORS, RELATION_TYPE_LABELS, StrengthClass, STRENGTH_CLASS_COLORS } from "../types/graph";

// For the API response data
type ApiResponseNode = {
  id: string;
  label?: string;
  group?: number;
  value?: number;
  title?: string;
  type?: string;
  [key: string]: string | number | boolean | undefined;
};

type ApiResponseLink = {
  source: string | number | { id: string };
  target: string | number | { id: string };
  value?: number;
  type?: string;
  relation?: string;
  weight?: number;
  description?: string;
  [key: string]: string | number | boolean | object | undefined;
};

type ApiGraphResponse = {
  nodes: ApiResponseNode[];
  links: ApiResponseLink[];
};

export default function GraphPage() {
  // Temel durumlar
  const [terms, setTerms] = useState("bellek,ağ,grafik,saray,zihin,bilgi,öğrenme");
  const [threshold, setThreshold] = useState(0.7);
  const [darkMode, setDarkMode] = useState(true);
  const [showRelationTypes, setShowRelationTypes] = useState(true);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  
  // Gelişmiş ayarlar ve UI durumları
  const [nodeSize, setNodeSize] = useState(20);
  const [linkStrength, setLinkStrength] = useState(300);
  const [chargeStrength, setChargeStrength] = useState(-1500);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [comparison, setComparison] = useState<ConceptComparison | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Grafikte seçilen kavramları takip etmek için yeni state
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);

  // Hidrasyon uyumsuzluğunu önlemek için
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Grafik verilerini yükle
  const fetchGraphData = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedNode(null);
    setSelectedLink(null);
    setComparison(null);
    
    try {
      const termsArray = parseTermsInput(terms);
      
      if (termsArray.length === 0) {
        setError("Lütfen en az bir kavram girin");
        setIsLoading(false);
        return;
      }
      
      const response = await ApiService.createGraph(termsArray, threshold, true) as ApiGraphResponse;
      
      console.log("API Yanıtı:", response); // Bağlantıların gelip gelmediğini kontrol et
      
      // Düğümleri hazırla
      const nodes: Node[] = response.nodes.map((apiNode) => ({
        id: apiNode.id,
        label: apiNode.label || apiNode.id,
        group: apiNode.group || 0,
        color: apiNode.type ? RELATION_TYPE_COLORS[apiNode.type] : undefined
      }));
      
      // API'den gelen bağlantıları kontrol et ve işle
      let links: Link[] = [];
      if (Array.isArray(response.links) && response.links.length > 0) {
        // API'den gelen bağlantıları kullan
        links = response.links.map((apiLink) => {
          const source = typeof apiLink.source === 'object' ? apiLink.source.id : String(apiLink.source);
          const target = typeof apiLink.target === 'object' ? apiLink.target.id : String(apiLink.target);
          const value = apiLink.value || apiLink.weight || 1;
          const type = apiLink.type || apiLink.relation || '';
          
          return {
            source,
            target,
            value,
            type,
            description: apiLink.description || '',
            strengthClass: getStrengthClass(value),
            label: type ? RELATION_TYPE_LABELS[type] || type : '',
            color: type ? RELATION_TYPE_COLORS[type] : undefined
          };
        });
      } else if (nodes.length > 1) {
        // Bağlantı yoksa MANUEL bağlantılar oluştur
        console.warn("API'den bağlantı verisi gelmedi! MANUEL bağlantılar oluşturulacak.");
        
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            // Her iki düğüm arasında rastgele bir bağlantı değeri hesapla
            const randomValue = Math.random() * 0.7 + 0.3; // 0.3 ile 1.0 arası
            
            // Eşik değerine göre bağlantıyı ekle veya ekleme
            if (randomValue >= threshold) {
              links.push({
                source: nodes[i].id,
                target: nodes[j].id,
                value: randomValue,
                type: "RELATED_TO",
                strengthClass: getStrengthClass(randomValue)
              } as Link);
            }
          }
        }
      }
      
      // Grafik verilerini formatla ve kaydet
      const formattedData: GraphData = {
        nodes: nodes,
        links: links
      };
      
      console.log("Formatlanmış Veri:", formattedData); // Formatlanmış veriyi kontrol et
      
      setGraphData(formattedData);
    } catch (error) {
      console.error("Grafik verisi alınırken hata:", error);
      setError(error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  // İlişki gücüne göre sınıf belirle
  const getStrengthClass = (strength: number): StrengthClass => {
    if (strength < 0.3) return 'weak';
    if (strength < 0.6) return 'moderate';
    if (strength < 0.85) return 'strong';
    return 'very-strong';
  };

  // Form submit edildiğinde grafik verilerini yükle
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGraphData();
  };

  // Düğüm tıklandığında
  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    setSelectedLink(null);
    setComparison(null);
    
    // Seçilen kavramları liste halinde tut
    if (node?.label) {
      // Eğer aynı kavram zaten varsa çıkar, yoksa ekle
      if (selectedConcepts.includes(node.label)) {
        setSelectedConcepts(selectedConcepts.filter(c => c !== node.label));
      } else {
        setSelectedConcepts([...selectedConcepts, node.label]);
      }
    }
  };

  // Bağlantı tıklandığında
  const handleLinkClick = async (link: Link) => {
    setSelectedLink(link);
    setSelectedNode(null);
    
    // Kaynak ve hedef düğümleri al
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    try {
      // İki kavramı karşılaştır
      const comparisonData = await ApiService.compareConcepts(sourceId, targetId);
      setComparison(comparisonData as ConceptComparison);
    } catch (error) {
      console.error("Kavram karşılaştırılırken hata:", error);
    }
  };

  // İlk render'da grafik verilerini yükle
  useEffect(() => {
    if (isClient) {
      fetchGraphData();
    }
  }, [isClient]);

  // Tema değiştirme
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Ayarlar panelini aç/kapat
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <main className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-slate-50 to-slate-100 text-gray-800'} p-4 md:p-6`}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="group">
              <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-2 transition-transform duration-200 group-hover:translate-x-1`}>
                MeLoc
                <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                  Anlamsal Kavram Grafiği
                </span>
              </h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-slate-600'} text-sm md:text-base transition-all duration-200 ease-in-out`}>
                Kavramlar arasındaki anlamsal ilişkileri keşfedin ve ilgili kaynaklara ulaşın
              </p>
            </div>
            
            <div className="flex items-center gap-3 self-end md:self-auto">
              <button
                onClick={toggleSettings}
                className={`p-2 rounded-full ${darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 hover:scale-110' 
                  : 'bg-white hover:bg-gray-100 shadow-sm hover:shadow-md hover:scale-110'} 
                  transition-all duration-200 ease-in-out`}
                title="Görselleştirme Ayarları"
                aria-label="Görselleştirme Ayarları"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 hover:scale-110' 
                  : 'bg-white hover:bg-gray-100 shadow-sm hover:shadow-md hover:scale-110'} 
                  transition-all duration-200 ease-in-out`}
                title={darkMode ? "Açık Moda Geç" : "Koyu Moda Geç"}
                aria-label={darkMode ? "Açık Moda Geç" : "Koyu Moda Geç"}
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Mobil responsive bilgilendirme */}
          <div className={`text-xs text-center md:hidden mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>Daha iyi bir deneyim için yatay ekranı veya geniş ekranlı bir cihazı tercih edin</p>
          </div>
          
          {/* İlerleme çubuğu - yükleme durumu için */}
          {isLoading && (
            <div className="w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse" 
                style={{ width: '100%' }}></div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Ana ayarlar ve kontroller - Sol Panel */}
          <div className={`lg:col-span-1 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'} rounded-2xl border transition-all duration-300 p-4 md:p-6 h-fit sticky top-6`}>
            <form onSubmit={handleSubmit} className="mb-5 space-y-4">
              <div className="space-y-2">
                <label htmlFor="terms" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                  Kavramlar
                  <span className="ml-1 text-xs opacity-70">(virgülle ayırın)</span>
                </label>
                <div className="relative">
                  <textarea
                    id="terms"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:outline-none transition-all duration-200 ${darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-400 focus:border-indigo-500' 
                      : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Örnek: bellek, ağ, öğrenme, zihin..."
                  />
                  <div className="absolute right-2 bottom-2 pointer-events-none">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {parseTermsInput(terms).length} kavram
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                    Benzerlik Eşiği
                  </label>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    threshold < 0.5 
                      ? darkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700' 
                      : threshold > 0.85 
                        ? darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                        : darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                  }`}>
                    {threshold.toFixed(2)} - {threshold < 0.5 ? 'Geniş' : threshold > 0.85 ? 'Çok Sıkı' : 'Dengeli'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.01"
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-all ${darkMode 
                    ? 'bg-gray-700 accent-indigo-400' 
                    : 'bg-slate-200 accent-indigo-600'}`}
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                />
                <div className={`flex justify-between text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                  <span>Daha Fazla Bağlantı</span>
                  <span>Daha Az Bağlantı</span>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-2.5 px-4 font-medium rounded-lg shadow-sm transition-all duration-200 ${
                    darkMode
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-indigo-700 disabled:to-purple-800 disabled:opacity-50'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:opacity-50'
                  } text-white relative overflow-hidden group`}
                >
                  <span className="relative z-10">
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Yükleniyor...
                      </span>
                    ) : "Grafiği Oluştur"}
                  </span>
                  <span className="absolute top-0 left-0 w-0 h-full bg-white/10 group-hover:w-full transition-all duration-500 ease-out"></span>
                </button>
              </div>
            </form>

            {/* Gelişmiş ayarlar - açılır kapanır panel */}
            {showSettings && (
              <div className={`rounded-xl mb-5 transition-all duration-300 ${darkMode ? 'bg-gray-700/70' : 'bg-slate-50'}`}>
                <div className="p-4">
                  <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Görselleştirme Ayarları
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`text-xs ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                          Düğüm Boyutu
                        </label>
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {nodeSize}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="30"
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${darkMode 
                          ? 'bg-gray-600 accent-indigo-400' 
                          : 'bg-slate-200 accent-indigo-600'}`}
                        value={nodeSize}
                        onChange={(e) => setNodeSize(parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`text-xs ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                          Bağlantı Uzunluğu
                        </label>
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {linkStrength}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="600"
                        step="50"
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${darkMode 
                          ? 'bg-gray-600 accent-indigo-400' 
                          : 'bg-slate-200 accent-indigo-600'}`}
                        value={linkStrength}
                        onChange={(e) => setLinkStrength(parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`text-xs ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                          İtme Kuvveti
                        </label>
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                          {Math.abs(chargeStrength)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="3000"
                        step="100"
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${darkMode 
                          ? 'bg-gray-600 accent-indigo-400' 
                          : 'bg-slate-200 accent-indigo-600'}`}
                        value={Math.abs(chargeStrength)}
                        onChange={(e) => setChargeStrength(-parseInt(e.target.value))}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className={`text-xs ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                        İlişki Türlerini Göster
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRelationTypes(!showRelationTypes)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                          showRelationTypes 
                            ? darkMode ? 'bg-indigo-500' : 'bg-indigo-600' 
                            : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                            showRelationTypes ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hata mesajları */}
            {error && (
              <div className={`mb-5 p-4 rounded-lg border ${darkMode 
                ? 'bg-red-900/30 border-red-800 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'} flex items-start gap-3`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Seçili kavramlar */}
            {selectedConcepts.length > 0 && (
              <div className={`mb-5 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Seçili Kavramlar
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedConcepts.map(concept => (
                    <div key={concept} 
                      className={`group px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                        darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {concept}
                      <button 
                        onClick={() => setSelectedConcepts(selectedConcepts.filter(c => c !== concept))}
                        className={`rounded-full p-0.5 ${
                          darkMode ? 'hover:bg-indigo-800' : 'hover:bg-indigo-200'
                        } transition-colors`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {selectedConcepts.length > 0 && (
                    <button 
                      onClick={() => setSelectedConcepts([])}
                      className={`px-2 py-1 text-xs rounded-full ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      } transition-colors`}
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* İlişki ve renk açıklamaları */}
            {graphData.links.length > 0 && (
              <div className={`${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
                    </svg>
                    İlişki Türleri
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(RELATION_TYPE_LABELS).map(([type, label]) => (
                      <div key={type} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RELATION_TYPE_COLORS[type] }} />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    İlişki Gücü
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { class: 'very-strong', label: 'Çok Güçlü (0.85-1.0)' },
                      { class: 'strong', label: 'Güçlü (0.6-0.85)' },
                      { class: 'moderate', label: 'Orta (0.3-0.6)' },
                      { class: 'weak', label: 'Zayıf (0.1-0.3)' }
                    ].map(item => (
                      <div key={item.class} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STRENGTH_CLASS_COLORS[item.class as StrengthClass] }} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ana grafik alanı ve detay paneli */}
          <div className="lg:col-span-3 space-y-6">
            {/* Grafik görselleştirme */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} transition-all duration-300 rounded-2xl shadow-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className={`relative ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-r from-slate-50 to-slate-100'} h-[600px]`}>
                {isLoading && (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center ${darkMode 
                    ? 'bg-gray-900/95' 
                    : 'bg-white/90'} z-10 backdrop-blur-sm transition-all duration-500`}>
                    <div className={`animate-spin rounded-full h-16 w-16 border-4 ${darkMode 
                      ? 'border-indigo-400 border-t-transparent' 
                      : 'border-indigo-500 border-t-transparent'}`}></div>
                    <p className={`mt-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Grafik oluşturuluyor...
                    </p>
                  </div>
                )}
                
                {graphData.nodes.length > 0 ? (
                  <GraphVisualizer
                    data={graphData}
                    width={graphData.nodes.length > 10 ? 800 : 700}
                    height={600}
                    darkMode={darkMode}
                    showLabels={true}
                    showRelationTypes={showRelationTypes}
                    nodeSize={nodeSize}
                    linkStrength={linkStrength}
                    chargeStrength={chargeStrength}
                    onNodeClick={handleNodeClick}
                    onLinkClick={handleLinkClick}
                  />
                ) : (
                  <div className={`h-full flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {!isLoading && (
                      <div className="text-center max-w-md p-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                        </svg>
                        <h3 className="text-lg font-medium mb-2">Anlamsal Grafik Oluşturun</h3>
                        <p className="text-sm opacity-80 mb-4">
                          Kavramları girin ve aralarındaki anlamsal ilişkileri görselleştirmek için "Grafiği Oluştur" düğmesine tıklayın.
                        </p>
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              // Otomatik olarak örnek kavramları ekleyelim
                              if (!terms) {
                                setTerms("bellek,ağ,grafik,zihin,bilgi,öğrenme");
                              }
                              handleSubmit(new Event('click') as any);
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-full ${
                              darkMode 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                            } transition-colors`}
                          >
                            Örnek Grafik Oluştur
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Graf kontrol araç çubuğu */}
              {graphData.nodes.length > 0 && (
                <div className={`flex items-center justify-between px-4 py-2 border-t ${
                  darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {graphData.nodes.length} kavram, {graphData.links.length} bağlantı
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className={`p-1.5 rounded-md ${darkMode 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                      title="Grafiği Sıfırla"
                      onClick={() => fetchGraphData()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Detay paneli */}
            {(selectedNode || selectedLink || comparison) && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-5 border ${darkMode ? 'border-gray-700' : 'border-gray-100'} transition-all duration-300`}>
                {selectedNode && (
                  <div className="animate-fadeIn">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedNode.color || '#6366f1' }}></div>
                        {selectedNode.label || selectedNode.id}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        ID: {selectedNode.id}
                      </span>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                      Bu kavramın diğer kavramlarla olan bağlantılarını görmek için grafikte üzerine gelin veya dokunun.
                    </p>
                    <div className={`text-xs p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <p className="font-medium mb-1">Tavsiye:</p>
                      <p>Bu kavramı diğer kavramlarla karşılaştırmak için aralarındaki bağlantıya tıklayın.</p>
                    </div>
                  </div>
                )}
                
                {selectedLink && (
                  <div className="animate-fadeIn">
                    <div className="flex items-center mb-3 gap-2">
                      <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                        darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {typeof selectedLink.source === 'object' ? selectedLink.source.id : selectedLink.source}
                      </div>
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={{ color: selectedLink.color || '#6366f1' }}>
                          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                        darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {typeof selectedLink.target === 'object' ? selectedLink.target.id : selectedLink.target}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {selectedLink.type ? RELATION_TYPE_LABELS[selectedLink.type] || selectedLink.type : 'İlişkili'}
                      </div>
                      
                      {selectedLink.description && (
                        <p className={`mb-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedLink.description}
                        </p>
                      )}
                      
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        selectedLink.strengthClass === 'very-strong' 
                          ? darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800' 
                          : selectedLink.strengthClass === 'strong' 
                            ? darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                            : selectedLink.strengthClass === 'moderate' 
                              ? darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                              : darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                      }`}>
                        İlişki gücü: {(selectedLink.value * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    {!comparison && (
                      <div className={`text-xs p-3 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <svg className="animate-spin h-3 w-3 text-indigo-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Kavramlar arasındaki ilişki analiz ediliyor...</span>
                      </div>
                    )}
                  </div>
                )}
                
                {comparison && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                      </svg>
                      Karşılaştırma Analizi
                    </h3>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            İlişki Türü: 
                          </span>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {RELATION_TYPE_LABELS[comparison.relation.toUpperCase()] || comparison.relation}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          comparison.relationClass === 'very-strong' 
                            ? darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800' 
                            : comparison.relationClass === 'strong' 
                              ? darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                              : comparison.relationClass === 'moderate' 
                                ? darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                                : darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                        }`}>
                          %{(comparison.relationStrength * 100).toFixed(0)} Eşleşme
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {comparison.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Benzerlik ve ilişki metrikleri */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Kosinüs Benzerliği
                          </div>
                          <div className={`font-mono text-lg font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                            %{(comparison.cosineSimilarity * 100).toFixed(1)}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 mt-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${comparison.cosineSimilarity * 100}%` }}></div>
                          </div>
                        </div>
                        
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Neo4j Benzerliği
                          </div>
                          <div className={`font-mono text-lg font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                            %{(comparison.dbSimilarity * 100).toFixed(1)}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 mt-2 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full" style={{ width: `${comparison.dbSimilarity * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* İçerik Önerileri Paneli */}
            {graphData.nodes.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-5 border ${darkMode ? 'border-gray-700' : 'border-gray-100'} transition-all duration-300`}>
                <ContentRecommendations 
                  concepts={selectedConcepts.length > 0 ? selectedConcepts : parseTermsInput(terms)} 
                  darkMode={darkMode} 
                />
              </div>
            )}
          </div>
        </div>

        <footer className={`mt-8 py-4 text-center ${darkMode ? 'text-gray-500' : 'text-slate-400'} border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="max-w-2xl mx-auto space-y-2">
            <p className="text-xs">MeLoc Anlamsal Grafik Görselleştirme · {new Date().getFullYear()}</p>
            <p className="text-xs opacity-75">
              Kavramlar arasındaki anlamsal ilişkileri görselleştirir ve ilgili öğrenme kaynaklarını önerir.
            </p>
          </div>
        </footer>
      </div>
      
      {/* Sayfa içi CSS animasyonları */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </main>
  );
}

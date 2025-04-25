"use client";

import { useState, useEffect } from "react";
import ApiService, { ContentRecommendation, ContentType } from "../services/api";

interface ContentRecommendationsProps {
  concepts: string[];
  darkMode?: boolean;
}

export default function ContentRecommendations({ concepts, darkMode = true }: ContentRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ContentType | 'all'>('all');
  
  // İçerik önerilerini yükle
  useEffect(() => {
    if (!concepts.length) return;
    
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await ApiService.getContentRecommendations(concepts);
        setRecommendations(data);
      } catch (err) {
        setError("İçerik önerileri yüklenirken bir hata oluştu.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [concepts]);
  
  // İçerik türüne göre filtrele
  const filteredRecommendations = activeFilter === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.type === activeFilter);
  
  // İçerik türüne göre ikon belirle
  const getIcon = (type: ContentType) => {
    switch (type) {
      case 'article':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'book':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'course':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
        );
      case 'tool':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  // İçerik tipine göre renk sınıfı belirle
  const getTypeColorClass = (type: ContentType) => {
    switch (type) {
      case 'article':
        return darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'book':
        return darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800';
      case 'video':
        return darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800';
      case 'course':
        return darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800';
      case 'tool':
        return darkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      default:
        return darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };
  
  // İçerik önerileri filtre butonları
  const filterOptions = [
    { value: 'all', label: 'Tümü' },
    { value: 'article', label: 'Makaleler' },
    { value: 'book', label: 'Kitaplar' },
    { value: 'video', label: 'Videolar' },
    { value: 'course', label: 'Kurslar' },
    { value: 'tool', label: 'Araçlar' }
  ];

  // Her bir kategori için öğe sayısını hesapla
  const getCategoryCount = (type: string) => {
    if (type === 'all') return recommendations.length;
    return recommendations.filter(rec => rec.type === type).length;
  };

  return (
    <div className={`${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
      <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
          </svg>
          İçerik Önerileri
        </span>
      </h3>
      
      {/* Kavram etiketleri */}
      {concepts.length > 0 && !loading && (
        <div className="mb-4">
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
            Aranan kavramlar:
          </div>
          <div className="flex flex-wrap gap-2">
            {concepts.map(concept => (
              <span 
                key={concept}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Filtre butonları */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setActiveFilter(option.value as ContentType | 'all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
              activeFilter === option.value
                ? darkMode 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-indigo-500 text-white'
                : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {option.label}
            {!loading && (
              <span className={`ml-1 ${
                activeFilter === option.value
                  ? 'bg-white/20 text-white' 
                  : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-300 text-gray-600'
              } text-xs px-1.5 py-0.5 rounded-full`}>{getCategoryCount(option.value)}</span>
            )}
          </button>
        ))}
      </div>
      
      {/* Yükleniyor */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex flex-col items-center">
            <div className={`animate-spin rounded-full h-10 w-10 border-2 ${darkMode 
              ? 'border-indigo-400 border-t-transparent' 
              : 'border-indigo-600 border-t-transparent'}`}>
            </div>
            <p className={`mt-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              İçerik önerileri getiriliyor...
            </p>
          </div>
        </div>
      )}
      
      {/* Hata */}
      {error && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium mb-1">Hata</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* İçerik yok */}
      {!loading && !error && filteredRecommendations.length === 0 && (
        <div className={`p-6 text-center rounded-lg ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
            {activeFilter === 'all' 
              ? "Seçilen kavramlar için içerik önerisi bulunamadı." 
              : `Seçilen kavramlar için "${filterOptions.find(f => f.value === activeFilter)?.label}" türünde içerik bulunamadı.`}
          </p>
          <p className="text-xs opacity-75">
            Daha fazla içerik önermesi için farklı kavramlar deneyebilir veya sayfa üstündeki kavram formuna daha fazla kavram ekleyebilirsiniz.
          </p>
        </div>
      )}
      
      {/* İçerik listesi */}
      <div className="space-y-4">
        {filteredRecommendations.map(item => (
          <div 
            key={item.id}
            className={`p-4 rounded-lg border ${darkMode 
              ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600' 
              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'} transition-all duration-150 group`}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-md ${getTypeColorClass(item.type)} transform transition-transform group-hover:scale-110`}>
                  {getIcon(item.type)}
                </div>
                <div>
                  <h4 className="font-medium mb-1 group-hover:text-indigo-500 transition-colors">
                    <a 
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`hover:underline ${darkMode ? 'text-indigo-300 group-hover:text-indigo-200' : 'text-indigo-600 group-hover:text-indigo-700'}`}
                    >
                      {item.title}
                    </a>
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.author}
                  </p>
                </div>
              </div>
              <div className="flex items-center self-start sm:self-auto">
                <span 
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    item.relevance > 80
                      ? darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                      : item.relevance > 50 
                        ? darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                        : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  %{Math.round(item.relevance)} Alakalı
                </span>
              </div>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {item.description}
            </p>
            <div className="mt-3 flex justify-between items-center">
              <div className={`text-xs uppercase tracking-wide font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {item.type}
              </div>
              <a 
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center text-xs font-medium ${
                  darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                } transition-colors`}
              >
                İncele
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>
      
      {/* Daha fazla içerik yok ama mevcut içerikler varsa */}
      {!loading && !error && filteredRecommendations.length > 0 && (
        <div className="mt-6 text-center">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Daha fazla alakalı içerik bulunamadı. Farklı kavramlar ekleyerek daha fazla içerik önerisi alabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
} 
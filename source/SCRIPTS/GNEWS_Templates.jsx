import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Download, Loader } from 'lucide-react';

const GNEWS_Templates = () => {
  const [selectedProduction, setSelectedProduction] = useState('');
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Iniciando carregamento...');
  const [preloadedAssets, setPreloadedAssets] = useState({});
  const videoRefs = useRef({});

  // Configuração das produções
  const productions = {
    jornalNacional: {
      name: 'Jornal Nacional',
      templates: [
        {
          id: 'template1',
          name: 'Abertura Principal',
          thumbnail: 'https://picsum.photos/400/225?random=1',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: '0:30'
        },
        {
          id: 'template2',
          name: 'Vinheta Esporte',
          thumbnail: 'https://picsum.photos/400/225?random=2',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          duration: '0:15'
        },
        {
          id: 'template3',
          name: 'Lower Third',
          thumbnail: 'https://picsum.photos/400/225?random=3',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          duration: '0:08'
        }
      ]
    },
    bomDiaBrasil: {
      name: 'Bom Dia Brasil',
      templates: [
        {
          id: 'template4',
          name: 'Abertura Matinal',
          thumbnail: 'https://picsum.photos/400/225?random=4',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          duration: '0:25'
        },
        {
          id: 'template5',
          name: 'Previsão do Tempo',
          thumbnail: 'https://picsum.photos/400/225?random=5',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          duration: '0:20'
        }
      ]
    },
    fantastico: {
      name: 'Fantástico',
      templates: [
        {
          id: 'template6',
          name: 'Abertura Show',
          thumbnail: 'https://picsum.photos/400/225?random=6',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          duration: '0:45'
        },
        {
          id: 'template7',
          name: 'Transição Musical',
          thumbnail: 'https://picsum.photos/400/225?random=7',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
          duration: '0:12'
        }
      ]
    }
  };

  // Função para pré-carregar uma imagem
  const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Função para pré-carregar um vídeo
  const preloadVideo = (src, templateId) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      
      const onLoadedData = () => {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        
        // Armazena a referência do vídeo pré-carregado
        videoRefs.current[templateId] = video;
        resolve(src);
      };

      const onError = () => {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        reject(new Error(`Erro ao carregar vídeo: ${src}`));
      };

      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('error', onError);
      video.src = src;
    });
  };

  // Função principal de pré-carregamento
  const preloadAllAssets = async () => {
    const allTemplates = Object.values(productions).flatMap(prod => prod.templates);
    const totalAssets = allTemplates.length * 2; // imagem + vídeo para cada template
    let loadedCount = 0;

    setLoadingMessage('Carregando imagens...');

    // Carregar todas as imagens
    const imagePromises = allTemplates.map(async (template) => {
      try {
        await preloadImage(template.thumbnail);
        loadedCount++;
        setLoadingProgress((loadedCount / totalAssets) * 100);
        return { type: 'image', id: template.id, success: true };
      } catch (error) {
        console.error(`Erro ao carregar imagem ${template.id}:`, error);
        loadedCount++;
        setLoadingProgress((loadedCount / totalAssets) * 100);
        return { type: 'image', id: template.id, success: false };
      }
    });

    await Promise.all(imagePromises);
    setLoadingMessage('Carregando vídeos...');

    // Carregar todos os vídeos
    const videoPromises = allTemplates.map(async (template) => {
      try {
        await preloadVideo(template.videoUrl, template.id);
        loadedCount++;
        setLoadingProgress((loadedCount / totalAssets) * 100);
        return { type: 'video', id: template.id, success: true };
      } catch (error) {
        console.error(`Erro ao carregar vídeo ${template.id}:`, error);
        loadedCount++;
        setLoadingProgress((loadedCount / totalAssets) * 100);
        return { type: 'video', id: template.id, success: false };
      }
    });

    const videoResults = await Promise.all(videoPromises);
    
    // Armazenar resultados do pré-carregamento
    const assetResults = {};
    [...await Promise.all(imagePromises), ...videoResults].forEach(result => {
      if (!assetResults[result.id]) assetResults[result.id] = {};
      assetResults[result.id][result.type] = result.success;
    });

    setPreloadedAssets(assetResults);
    setLoadingMessage('Finalizando...');
    
    // Pequeno delay para suavizar a transição
    setTimeout(() => {
      setIsFullyLoaded(true);
      // Define primeira produção como padrão
      setSelectedProduction(Object.keys(productions)[0]);
    }, 500);
  };

  // Iniciar pré-carregamento ao montar o componente
  useEffect(() => {
    preloadAllAssets();
    
    // Cleanup function para limpar vídeos pré-carregados
    return () => {
      Object.values(videoRefs.current).forEach(video => {
        if (video && video.src) {
          video.src = '';
        }
      });
    };
  }, []);

  // Componente de tela de carregamento
  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-blue-300 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 border-4 border-t-white border-blue-300 rounded-full animate-spin"></div>
            <Loader className="absolute inset-0 m-auto w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">
          Carregando Templates GNEWS
        </h2>
        
        <p className="text-blue-200 mb-8 text-lg">
          {loadingMessage}
        </p>
        
        <div className="w-80 mx-auto">
          <div className="bg-blue-800 rounded-full h-3 mb-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-400 to-white h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-blue-300 text-sm">
            {Math.round(loadingProgress)}% concluído
          </p>
        </div>
      </div>
    </div>
  );

  // Componente do template
  const TemplateCard = ({ template, productionKey }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const cardVideoRef = useRef(null);

    const handlePlay = () => {
      if (cardVideoRef.current) {
        // Use o vídeo pré-carregado se disponível
        const preloadedVideo = videoRefs.current[template.id];
        if (preloadedVideo) {
          cardVideoRef.current.src = preloadedVideo.src;
        }
        
        cardVideoRef.current.play();
        setIsPlaying(true);
      }
    };

    const handleVideoEnd = () => {
      setIsPlaying(false);
      if (cardVideoRef.current) {
        cardVideoRef.current.currentTime = 0;
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <div className="relative aspect-video bg-gray-100">
          <img 
            src={template.thumbnail} 
            alt={template.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
          />
          <video
            ref={cardVideoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
            muted
            onEnded={handleVideoEnd}
          />
          
          {!isPlaying && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <button 
                onClick={handlePlay}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transform scale-0 group-hover:scale-100 transition-all duration-300 shadow-lg"
              >
                <Play className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" />
              </button>
            </div>
          )}
          
          <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
            {template.duration}
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="font-semibold text-lg text-gray-800 mb-3">{template.name}</h3>
          <div className="flex gap-2">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Usar Template
            </button>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors duration-200">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Se ainda não carregou completamente, mostra tela de loading
  if (!isFullyLoaded) {
    return <LoadingScreen />;
  }

  const currentProduction = productions[selectedProduction];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Templates GNEWS</h1>
            <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              ✓ Todos os recursos carregados
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto py-4">
            {Object.entries(productions).map(([key, production]) => (
              <button
                key={key}
                onClick={() => setSelectedProduction(key)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedProduction === key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {production.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentProduction && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{currentProduction.name}</h2>
              <p className="text-gray-600">{currentProduction.templates.length} templates disponíveis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentProduction.templates.map(template => (
                <TemplateCard 
                  key={template.id} 
                  template={template} 
                  productionKey={selectedProduction}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GNEWS_Templates;
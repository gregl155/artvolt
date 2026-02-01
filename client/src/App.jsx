import { useState } from 'react';
import axios from 'axios';
import ImageUploader from './components/ImageUploader';
import ResultsGrid from './components/ResultsGrid';
import LoadingSpinner from './components/LoadingSpinner';
import AnalysisView from './components/AnalysisView';
import TabView from './components/TabView';

// API URL - uses environment variable in production, relative path in development
const API_URL = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [timing, setTiming] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis');

  const handleUpload = async (file) => {
    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setError(null);
    setResults(null);
    setAnalysis(null);
    setTiming(null);
    setIsLoading(true);
    setActiveTab('analysis');

    // Capture compression info if available
    const compressionInfo = file.compressionInfo || null;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/api/search`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 120 second timeout for LLM analysis
      });

      setResults(response.data.results);
      setAnalysis(response.data.analysis);
      setTiming({
        ...response.data.timing,
        compression: compressionInfo,
      });
    } catch (err) {
      console.error('Search failed:', err);
      setError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'analysis', label: 'AI Analysis', icon: '\u2728' },
    { id: 'matches', label: 'Visual Matches', icon: '\uD83D\uDDBC\uFE0F', count: results?.totalResults || 0 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white text-artvolt-black sticky top-0 z-50 border-b border-artvolt-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo Placeholder - Text based for now matching the font */}
              <div>
                <h1 className="text-4xl font-bold tracking-tight font-serif">
                  ArtVolt
                </h1>
                <p className="text-artvolt-cyan-bluish-gray text-sm tracking-wide font-medium">
                  CARRY YOUR ART WITH YOU
                </p>
              </div>
            </div>
            {timing && <TimingDisplay timing={timing} />}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        <section className="mb-8">
          <ImageUploader
            onUpload={handleUpload}
            preview={preview}
            isLoading={isLoading}
          />
        </section>

        {/* Error Message */}
        {error && (
          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* Results with Tabs */}
        {(results || analysis) && !isLoading && (
          <section className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-artvolt-gray-200 overflow-hidden">
              <TabView
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={tabs}
              />

              <div className="p-6">
                {activeTab === 'analysis' && (
                  <AnalysisView analysis={analysis} />
                )}
                {activeTab === 'matches' && (
                  <ResultsGrid results={results} />
                )}
              </div>
            </div>
          </section>
        )}
      </main>

    </div>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function TimingDisplay({ timing }) {
  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-4 py-2 bg-artvolt-gray-100 rounded-full cursor-default hover:bg-artvolt-gray-200 transition-colors">
        <svg className="w-4 h-4 text-artvolt-vivid-cyan-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium text-artvolt-black">{timing.total}</span>
      </div>

      {/* Hover tooltip */}
      <div className="absolute right-0 top-full mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-white text-artvolt-black text-xs rounded-xl shadow-xl p-4 border border-artvolt-gray-200">
          <div className="font-semibold mb-3 text-artvolt-gray-500 uppercase tracking-wide text-xs">
            Performance Breakdown
          </div>
          <div className="space-y-2">
            {timing.compression && (
              <div className="flex justify-between">
                <span className="text-artvolt-gray-600">Compression</span>
                <span className="font-mono text-artvolt-vivid-purple">
                  {timing.compression.time}ms ({formatBytes(timing.compression.originalSize)} → {formatBytes(timing.compression.compressedSize)})
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-artvolt-gray-600">Image Upload</span>
              <span className="font-mono text-artvolt-vivid-cyan-blue">{timing.upload}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-artvolt-gray-600">Lens Search</span>
              <span className="font-mono text-artvolt-vivid-cyan-blue">{timing.search} ({timing.searchRetries ?? 0})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-artvolt-gray-600">AI Analysis</span>
              <span className="font-mono text-artvolt-vivid-cyan-blue">{timing.analysis}</span>
            </div>
            <div className="border-t border-artvolt-gray-100 pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-artvolt-vivid-green-cyan font-mono">{timing.total}</span>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute -top-1 right-6 w-2 h-2 bg-white border-l border-t border-artvolt-gray-200 rotate-45"></div>
        </div>
      </div>
    </div>
  );
}

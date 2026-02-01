import { useState } from 'react';

export default function AnalysisView({ analysis }) {
  const [showJson, setShowJson] = useState(false);

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-artvolt-gray-500">No analysis available.</p>
      </div>
    );
  }

  const {
    artist_name,
    artist_confidence_score,
    artwork_title,
    artwork_confidence_score,
    style_and_medium,
    reasoning_summary,
    visual_characteristics,
  } = analysis;

  return (
    <div className="space-y-8">
      {/* Artist & Artwork Identification Card */}
      <div className="bg-white border border-artvolt-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-artvolt-black text-white px-8 py-5">
          <h3 className="text-xl font-bold font-serif flex items-center gap-3">
            <span className="text-2xl">&#127912;</span>
            Artist & Artwork Identification
          </h3>
        </div>

        <div className="p-8 space-y-8">
          {/* Artist */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <p className="text-xs text-artvolt-cyan-bluish-gray uppercase tracking-widest font-bold mb-2">Artist</p>
              <p className="text-3xl font-bold text-artvolt-black font-serif">
                {artist_name || 'Unable to identify'}
              </p>
            </div>
            {artist_confidence_score > 0 && (
              <ConfidenceBadge value={artist_confidence_score} />
            )}
          </div>

          {/* Artwork Title */}
          <div className="flex items-start justify-between gap-6 pt-6 border-t border-artvolt-gray-100">
            <div className="flex-1">
              <p className="text-xs text-artvolt-cyan-bluish-gray uppercase tracking-widest font-bold mb-2">Artwork</p>
              <p className="text-2xl font-medium text-artvolt-gray-800 font-serif italic">
                {artwork_title || 'Title not identified'}
              </p>
            </div>
            {artwork_confidence_score > 0 && (
              <ConfidenceBadge value={artwork_confidence_score} />
            )}
          </div>

          {/* Style & Medium */}
          {style_and_medium && (
            <div className="pt-6 border-t border-artvolt-gray-100">
              <p className="text-xs text-artvolt-cyan-bluish-gray uppercase tracking-widest font-bold mb-2">Style & Medium</p>
              <p className="text-base text-artvolt-gray-700">{style_and_medium}</p>
            </div>
          )}

          {/* Visual Characteristics */}
          {visual_characteristics && (
            <div className="pt-6 border-t border-artvolt-gray-100">
              <p className="text-xs text-artvolt-cyan-bluish-gray uppercase tracking-widest font-bold mb-2">Visual Characteristics</p>
              <p className="text-base text-artvolt-gray-700">{visual_characteristics}</p>
            </div>
          )}
        </div>
      </div>

      {/* Developer JSON Toggle */}
      <div className="border border-artvolt-gray-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full px-6 py-4 bg-artvolt-gray-50 text-left flex items-center justify-between text-sm font-medium text-artvolt-gray-500 hover:bg-artvolt-gray-100 transition-colors uppercase tracking-wide"
        >
          <span className="flex items-center gap-2">
            <span>&#128295;</span>
            Developer JSON
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${showJson ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showJson && (
          <div className="p-6 bg-artvolt-gray-900 overflow-x-auto">
            <pre className="text-xs text-artvolt-vivid-green-cyan font-mono">
              {JSON.stringify({
                artist_name,
                artist_confidence_score,
                artwork_title,
                artwork_confidence_score,
                style_and_medium,
                reasoning_summary,
                visual_characteristics,
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidenceBadge({ value }) {
  const getColor = (v) => {
    if (v >= 80) return 'bg-artvolt-vivid-green-cyan text-white';
    if (v >= 50) return 'bg-artvolt-vivid-cyan-blue text-white';
    if (v >= 30) return 'bg-artvolt-luminous-orange text-white';
    return 'bg-artvolt-gray-400 text-white';
  };

  return (
    <div className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${getColor(value)}`}>
      {value}% CONFIDENT
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-artvolt-gray-50 border border-artvolt-gray-200 rounded-full">
      <span className="text-xs text-artvolt-gray-400 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-artvolt-black">{value}</span>
    </div>
  );
}

function MarkdownRenderer({ content }) {
  // Remove the developer JSON section from display
  const cleanContent = content.replace(/## .*Developer Information[\s\S]*$/m, '').trim();

  // Simple markdown to JSX conversion
  const lines = cleanContent.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-3 text-artvolt-gray-700">
          {listItems.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  lines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) {
      if (inList) flushList();
      return;
    }

    // Headers
    if (line.startsWith('## ')) {
      if (inList) flushList();
      elements.push(
        <h2 key={index} className="text-lg font-semibold text-artvolt-black mt-6 mb-3 flex items-center gap-2">
          {line.replace('## ', '')}
        </h2>
      );
      return;
    }

    // List items
    if (line.match(/^[-*]\s/)) {
      inList = true;
      const text = line.replace(/^[-*]\s/, '');
      listItems.push(formatInlineMarkdown(text));
      return;
    }

    // Numbered list items
    if (line.match(/^\d+\.\s/)) {
      inList = true;
      const text = line.replace(/^\d+\.\s/, '');
      listItems.push(formatInlineMarkdown(text));
      return;
    }

    // Regular paragraph
    if (inList) flushList();
    elements.push(
      <p key={index} className="text-artvolt-gray-700 my-2">
        {formatInlineMarkdown(line)}
      </p>
    );
  });

  if (inList) flushList();

  return <div>{elements}</div>;
}

function formatInlineMarkdown(text) {
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Return as HTML
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
}

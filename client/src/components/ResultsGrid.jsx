export default function ResultsGrid({ results }) {
  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-artvolt-gray-500">No results available.</p>
      </div>
    );
  }

  const { organic, exactMatch, totalResults } = results;
  const allResults = [...(exactMatch || []), ...(organic || [])];

  if (allResults.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-artvolt-gray-500">No visual matches found for this image.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {exactMatch && exactMatch.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-artvolt-cyan uppercase tracking-wide">
            Exact Matches
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exactMatch.map((item, index) => (
              <ResultCard key={`exact-${index}`} item={item} isExact />
            ))}
          </div>
        </div>
      )}

      {organic && organic.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-artvolt-gray-600 uppercase tracking-wide">
            Visual Matches ({totalResults || organic.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {organic.map((item, index) => (
              <ResultCard key={`organic-${index}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ item, isExact }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        block rounded-3xl overflow-hidden bg-white border
        hover:shadow-xl transition-all duration-300 group
        ${isExact ? 'border-artvolt-vivid-cyan-blue ring-2 ring-artvolt-vivid-cyan-blue/20' : 'border-artvolt-gray-200'}
      `}
    >
      {item.thumbnail && (
        <div className="aspect-video bg-artvolt-gray-50 overflow-hidden">
          <img
            src={item.thumbnail}
            alt={item.title || 'Result'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-5">
        <h4 className="font-bold text-artvolt-black text-base line-clamp-2 group-hover:text-artvolt-vivid-cyan-blue transition-colors font-serif leading-tight">
          {item.title || 'Untitled'}
        </h4>
        {item.source && (
          <p className="text-xs text-artvolt-gray-500 mt-2 truncate font-medium uppercase tracking-wide">
            {item.source}
          </p>
        )}
        {item.price && (
          <p className="text-sm font-bold text-artvolt-vivid-green-cyan mt-3">
            {item.price}
          </p>
        )}
      </div>
    </a>
  );
}

export default function TabView({ activeTab, onTabChange, tabs }) {
  return (
    <div className="border-b border-artvolt-gray-100">
      <nav className="flex gap-2 px-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative px-4 py-4 text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'text-artvolt-black'
                : 'text-artvolt-gray-400 hover:text-artvolt-gray-600'
              }
            `}
          >
            <span className="flex items-center gap-2">
              {tab.icon && <span className="text-lg">{tab.icon}</span>}
              <span className={activeTab === tab.id ? 'font-bold' : ''}>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`
                  ml-1 px-2.5 py-0.5 text-xs rounded-full font-bold
                  ${activeTab === tab.id
                    ? 'bg-artvolt-black text-white'
                    : 'bg-artvolt-gray-100 text-artvolt-gray-500'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </span>

            {/* Active indicator */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-artvolt-black rounded-t-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

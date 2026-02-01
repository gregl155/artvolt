import { useEffect, useState } from 'react';

export default function LoadingSpinner() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Cycle through steps every 2.5 seconds to simulate progress
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < 2 ? prev + 1 : prev));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const steps = [
    { label: "Uploading image", icon: "📤" },
    { label: "Scanning visual matches", icon: "🔍" },
    { label: "Analyzing art style", icon: "✨" }
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      {/* Modern Spinner */}
      <div className="relative w-20 h-20 mb-8">
        {/* Background Ring */}
        <div className="absolute inset-0 border-4 border-artvolt-gray-100 rounded-full"></div>
        
        {/* Animated Rings */}
        <div className="absolute inset-0 border-4 border-transparent border-t-artvolt-vivid-cyan-blue rounded-full animate-spin"></div>
        <div className="absolute inset-0 border-4 border-transparent border-b-artvolt-vivid-purple rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        
        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">
          🎨
        </div>
      </div>

      <div className="text-center space-y-6 max-w-xs w-full">
        <h3 className="text-xl font-serif font-bold text-artvolt-black">
          Analyzing Artwork
        </h3>
        
        {/* Progress Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex items-center gap-3 transition-all duration-500 ${
                index <= activeStep 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-40 translate-x-2'
              }`}
            >
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs border
                ${index < activeStep 
                  ? 'bg-artvolt-vivid-green-cyan border-artvolt-vivid-green-cyan text-white' 
                  : index === activeStep
                    ? 'border-artvolt-vivid-cyan-blue text-artvolt-vivid-cyan-blue animate-pulse'
                    : 'border-artvolt-gray-200 text-artvolt-gray-300'
                }
              `}>
                {index < activeStep ? '✓' : index + 1}
              </div>
              <span className={`text-sm font-medium ${
                index === activeStep ? 'text-artvolt-black' : 'text-artvolt-gray-500'
              }`}>
                {step.label}
              </span>
              {index === activeStep && (
                <div className="ml-auto w-1.5 h-1.5 bg-artvolt-vivid-cyan-blue rounded-full animate-ping" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

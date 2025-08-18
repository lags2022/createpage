/* @ts-nocheck */
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

// ============================================================================
// ICON COMPONENTS (SVG)
// ============================================================================
/* @ts-nocheck */
const LogoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="url(#gradient)" />
    <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" stroke="white" strokeWidth="1.5" fill="none" />
    <circle cx="16" cy="16" r="2" fill="white" />
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RocketIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const BookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const Button = ({ children, onClick, variant = 'primary', className = '' }: ButtonProps) => {
  const baseClasses = "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 transform";
  const variantClasses = variant === 'primary' 
    ? "bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white shadow-lg hover:shadow-xl hover:scale-105"
    : "border border-gray-700 bg-gray-800/50 text-gray-200 hover:bg-gray-700/50 hover:border-gray-600";
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

interface CardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

const Card = ({ icon, title, description, className = '' }: CardProps) => {
  return (
    <div className={`group relative p-6 rounded-xl bg-gray-800/30 border border-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-gray-800/50 hover:border-gray-600 ${className}`}>
      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ANIMATED BACKGROUND COMPONENT
// ============================================================================

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-gray-950" />
      
      {/* Animated gradient aurora */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-6000" />
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIgZmlsbC1vcGFjaXR5PSIwLjMiLz4KPHN2Zz4=')] opacity-20" />
    </div>
  );
};

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

const Header = () => {
  return (
    <header className="relative z-10 w-full">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon className="w-8 h-8" />
            <span className="text-xl font-bold text-white">WebContainer</span>
          </div>
          <Link 
            to="/docs" 
            className="inline-flex items-center gap-2 text-gray-300 hover:text-cyan-400 transition-colors duration-200"
          >
            <span>Documentation</span>
            <ExternalLinkIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        {/* Status indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-8">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Container Status: Active
        </div>

        {/* Main title */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-6">
          Your Web Container is
          <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent"> Live</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          This is a default fallback page. Deploy your application code to replace this placeholder and bring your project to life.
        </p>

        {/* CTA Button */}
        <Button className="text-lg">
          <RocketIcon className="w-5 h-5" />
          View Deployment Guide
          <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
};

const InfoSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const cards = [
    {
      icon: <CheckIcon className="w-6 h-6 text-green-400" />,
      title: "Status",
      description: "Your container is running smoothly and ready to serve your application."
    },
    {
      icon: <RocketIcon className="w-6 h-6 text-cyan-400" />,
      title: "Next Steps",
      description: "Connect your Git repository and deploy your application to replace this page."
    },
    {
      icon: <BookIcon className="w-6 h-6 text-violet-400" />,
      title: "Need Help?",
      description: "Consult our official documentation for detailed deployment guides and tutorials."
    }
  ];

  return (
    <section className="relative z-10 px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {cards.map((card, index) => (
            <Card
              key={index}
              icon={card.icon}
              title={card.title}
              description={card.description}
              className={`animation-delay-${(index + 1) * 200}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative z-10 w-full py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} Your Company. Built with React, TypeScript & Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
};

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBackground />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <InfoSection />
      </main>
      <Footer />
    </div>
  );
};

// ============================================================================
// DOCUMENTATION PAGE (Simple placeholder)
// ============================================================================

const DocsPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 relative">
      <AnimatedBackground />
      <Header />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Documentation</h1>
          <p className="text-xl text-gray-400">Get started with your web container deployment</p>
        </div>
        
        <div className="prose prose-invert max-w-none">
          <Card
            icon={<BookIcon className="w-6 h-6 text-cyan-400" />}
            title="Quick Start Guide"
            description="Learn how to deploy your first application to this web container. Follow our step-by-step guide to get up and running in minutes."
          />
        </div>
        
        <div className="text-center mt-12">
          <Link to="/">
            <Button variant="secondary">
              <ArrowRightIcon className="w-4 h-4 rotate-180" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/docs" element={<DocsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
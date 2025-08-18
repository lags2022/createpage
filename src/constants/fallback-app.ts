export const fallbackAppCode = `import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Menu, X, ChevronDown, ChevronRight, Star, Check, ArrowRight, 
  Play, Zap, Shield, Users, BarChart3, Globe, Slack, Github, 
  Figma, Mail, MapPin, Phone, Twitter, Linkedin, Youtube,
  MessageSquare, TrendingUp, Clock, Database, Plus, Minus
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface TestimonialProps {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

interface PricingPlanProps {
  name: string;
  price: { monthly: number; annual: number };
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
}

interface FAQItemProps {
  question: string;
  answer: string;
}

interface BlogPostProps {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  image: string;
  readTime: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

// ============================================================================
// LOGO COMPONENT
// ============================================================================

const NexusLogo = ({ className }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="relative">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white rounded-sm relative">
          <div className="absolute inset-0 border border-white rotate-45"></div>
        </div>
      </div>
    </div>
    <span className="text-xl font-bold text-white">Nexus</span>
  </div>
);

// ============================================================================
// REUSABLE UI COMPONENTS
// ============================================================================

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', href }: ButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 transform hover:scale-105";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600",
    outline: "border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm gap-1",
    md: "px-6 py-3 text-base gap-2",
    lg: "px-8 py-4 text-lg gap-3"
  };

  const Component = href ? Link : 'button';
  const props = href ? { to: href } : { onClick };

  return (
    <Component 
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Component>
  );
};

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="group p-6 rounded-xl bg-gray-800/30 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/50 hover:border-blue-500/50 transition-all duration-300">
    <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 w-fit">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

const TestimonialCard = ({ name, role, company, avatar, content, rating }: TestimonialProps) => (
  <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
    <div className="flex items-center gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />
      ))}
    </div>
    <p className="text-gray-300 mb-6 leading-relaxed">"{content}"</p>
    <div className="flex items-center gap-3">
      <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
      <div>
        <p className="text-white font-medium">{name}</p>
        <p className="text-gray-400 text-sm">{role} at {company}</p>
      </div>
    </div>
  </div>
);

const PricingCard = ({ name, price, description, features, popular, buttonText }: PricingPlanProps) => {
  const [isAnnual, setIsAnnual] = useState(false);
  
  return (
    <div className={`relative p-8 rounded-2xl border-2 ${popular ? 'border-blue-500 bg-gray-800/50' : 'border-gray-700 bg-gray-800/30'} backdrop-blur-sm`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
        <p className="text-gray-400 mb-4">{description}</p>
        <div className="mb-6">
          <span className="text-4xl font-bold text-white">${isAnnual ? price.annual : price.monthly}</span>
          <span className="text-gray-400 ml-2">/month</span>
          {isAnnual && <span className="text-green-400 text-sm ml-2">Save 20%</span>}
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <Button variant={popular ? 'primary' : 'outline'} className="w-full">
        {buttonText}
      </Button>
    </div>
  );
};

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-700 rounded-lg">
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-white font-medium">{question}</span>
        {isOpen ? <Minus className="w-5 h-5 text-gray-400" /> : <Plus className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

const BlogPostCard = ({ title, excerpt, author, date, image, readTime }: BlogPostProps) => (
  <article className="group bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden hover:bg-gray-800/50 transition-all duration-300">
    <div className="aspect-video overflow-hidden">
      <img 
        src={image} 
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="p-6">
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 mb-4 leading-relaxed">{excerpt}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>By {author}</span>
        <div className="flex items-center gap-4">
          <span>{date}</span>
          <span>{readTime} read</span>
        </div>
      </div>
    </div>
  </article>
);

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/">
            <NexusLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
            >
              Home
            </Link>
            <Link 
              to="/pricing" 
              className={`text-sm font-medium transition-colors ${isActive('/pricing') ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
            >
              Pricing
            </Link>
            <Link 
              to="/blog" 
              className={`text-sm font-medium transition-colors ${isActive('/blog') ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
            >
              Blog
            </Link>
            <Link 
              to="/contact" 
              className={`text-sm font-medium transition-colors ${isActive('/contact') ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}
            >
              Contact
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="secondary" size="sm" href="/login">
              Login
            </Button>
            <Button variant="primary" size="sm" href="/register">
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
              <Link to="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link>
              <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
              <div className="pt-4 border-t border-gray-800 flex flex-col space-y-2">
                <Button variant="secondary" size="sm" href="/login">Login</Button>
                <Button variant="primary" size="sm" href="/register">Sign Up</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="bg-gray-950 border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <NexusLogo className="mb-4" />
          <p className="text-gray-400 mb-6">
            The ultimate collaboration platform for modern teams. Connect, create, and deliver extraordinary results.
          </p>
          <div className="flex space-x-4">
            <Twitter className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
            <Linkedin className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
            <Youtube className="w-5 h-5 text-gray-400 hover:text-red-400 cursor-pointer transition-colors" />
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Product</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Company</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Partners</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Resources</h3>
          <ul className="space-y-2">
            <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
            <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-12 pt-8 text-center">
        <p className="text-gray-400">© 2024 Nexus. All rights reserved. Built with React, TypeScript & Tailwind CSS.</p>
      </div>
    </div>
  </footer>
);

// ============================================================================
// PAGE COMPONENTS
// ============================================================================

const HomePage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials: TestimonialProps[] = [
    {
      name: "Sarah Chen",
      role: "VP of Engineering",
      company: "TechFlow",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
      content: "Nexus transformed how our team collaborates. The seamless integration and intuitive interface boosted our productivity by 40%.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Product Manager",
      company: "InnovateCorp",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
      content: "Finally, a platform that understands modern workflow. Nexus bridges the gap between planning and execution perfectly.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Design Lead",
      company: "CreativeStudio",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
      content: "The visual collaboration features in Nexus are game-changing. Our design process has never been more streamlined.",
      rating: 5
    }
  ];

  const faqs: FAQItemProps[] = [
    {
      question: "How does Nexus integrate with existing tools?",
      answer: "Nexus offers native integrations with 100+ popular tools including Slack, GitHub, Figma, and more. Our API allows custom integrations for enterprise needs."
    },
    {
      question: "Is my data secure on Nexus?",
      answer: "Absolutely. We use enterprise-grade encryption, SOC 2 compliance, and follow industry best practices to ensure your data remains secure and private."
    },
    {
      question: "Can I migrate my existing projects to Nexus?",
      answer: "Yes! Our migration tools support importing from major project management platforms. Our team provides white-glove migration assistance for enterprise customers."
    },
    {
      question: "What's included in the free plan?",
      answer: "The free plan includes core collaboration features for up to 5 team members, 10GB storage, and basic integrations. Perfect for small teams getting started."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-gray-950" />
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Where Teams
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent"> Connect</span>
            <br />and Ideas Flow
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Nexus brings your team, tools, and projects together in one powerful platform. 
            Collaborate seamlessly, ship faster, and scale with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" href="/register">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mb-20">
            <p className="text-gray-500 mb-8">Trusted by 10,000+ teams worldwide</p>
            <div className="flex items-center justify-center gap-8 opacity-50 grayscale hover:opacity-80 transition-all">
              <div className="text-2xl font-bold">TechCorp</div>
              <div className="text-2xl font-bold">InnovateLab</div>
              <div className="text-2xl font-bold">FlowStudio</div>
              <div className="text-2xl font-bold">DataSync</div>
            </div>
          </div>

          {/* Product Showcase */}
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80" 
              alt="Nexus Dashboard"
              className="rounded-2xl shadow-2xl border border-gray-700 mx-auto"
              style={{
                filter: 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.3))'
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything Your Team Needs
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Powerful features designed to enhance collaboration and boost productivity across your entire organization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="w-8 h-8 text-blue-400" />}
              title="Team Collaboration"
              description="Real-time collaboration with instant messaging, video calls, and shared workspaces that keep everyone in sync."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-purple-400" />}
              title="Advanced Analytics"
              description="Gain insights into team performance, project progress, and productivity metrics with beautiful, actionable dashboards."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-green-400" />}
              title="Enterprise Security"
              description="Bank-level security with end-to-end encryption, SSO integration, and compliance with SOC 2 and GDPR standards."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Workflow Automation"
              description="Automate repetitive tasks and create custom workflows that save time and reduce human error across projects."
            />
            <FeatureCard
              icon={<Globe className="w-8 h-8 text-cyan-400" />}
              title="Global Integration"
              description="Connect with 100+ tools including Slack, GitHub, Figma, and more. Build custom integrations with our robust API."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-orange-400" />}
              title="Scalable Growth"
              description="Scale from startup to enterprise with flexible plans, unlimited projects, and dedicated support for growing teams."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How Nexus Works
            </h2>
            <p className="text-xl text-gray-400">
              Get started in minutes with our intuitive three-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Connect Your Tools</h3>
              <p className="text-gray-400">
                Integrate your existing workflow with one-click connections to popular tools and platforms.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Invite Your Team</h3>
              <p className="text-gray-400">
                Add team members, set permissions, and create shared workspaces for seamless collaboration.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Start Collaborating</h3>
              <p className="text-gray-400">
                Begin working together with powerful tools designed to boost productivity and streamline workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Integrates With Your Favorite Tools
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Connect Nexus with the tools you already use and love
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            <div className="p-6 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 transition-colors">
              <Slack className="w-8 h-8 text-gray-400 mx-auto" />
            </div>
            <div className="p-6 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 transition-colors">
              <Github className="w-8 h-8 text-gray-400 mx-auto" />
            </div>
            <div className="p-6 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 transition-colors">
              <Figma className="w-8 h-8 text-gray-400 mx-auto" />
            </div>
            <div className="p-6 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 transition-colors">
              <Database className="w-8 h-8 text-gray-400 mx-auto" />
            </div>
            <div className="p-6 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 transition-colors">
              <MessageSquare className="w-8 h-8 text-gray-400 mx-auto" />
            </div>
            <div className="p-6 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 transition-colors">
              <BarChart3 className="w-8 h-8 text-gray-400 mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Loved by Teams Worldwide
            </h2>
            <p className="text-xl text-gray-400">
              See what our customers have to say about their Nexus experience
            </p>
          </div>

          <div className="relative">
            <TestimonialCard {...testimonials[currentTestimonial]} />
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about Nexus
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Team?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of teams already using Nexus to collaborate better and deliver faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" href="/register">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" href="/contact">
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans: PricingPlanProps[] = [
    {
      name: "Starter",
      price: { monthly: 0, annual: 0 },
      description: "Perfect for small teams getting started",
      features: [
        "Up to 5 team members",
        "10GB storage",
        "Basic integrations",
        "Community support",
        "Mobile apps"
      ],
      buttonText: "Get Started Free"
    },
    {
      name: "Professional",
      price: { monthly: 29, annual: 24 },
      description: "Advanced features for growing teams",
      features: [
        "Up to 50 team members",
        "100GB storage",
        "Advanced integrations",
        "Priority support",
        "Custom workflows",
        "Advanced analytics",
        "Guest access"
      ],
      popular: true,
      buttonText: "Start Free Trial"
    },
    {
      name: "Enterprise",
      price: { monthly: 99, annual: 79 },
      description: "Complete solution for large organizations",
      features: [
        "Unlimited team members",
        "Unlimited storage",
        "All integrations",
        "24/7 dedicated support",
        "Advanced security",
        "Custom branding",
        "API access",
        "SSO integration"
      ],
      buttonText: "Contact Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your team. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-800 rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md transition-colors ${!isAnnual ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors ${isAnnual ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
              onClick={() => setIsAnnual(true)}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-4">
            All plans include our core collaboration features. Need something custom?
          </p>
          <Button variant="outline" href="/contact">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
};

const BlogPage = () => {
  const posts: BlogPostProps[] = [
    {
      title: "The Future of Remote Collaboration",
      excerpt: "Exploring how distributed teams are reshaping the workplace and the tools they need to succeed.",
      author: "Sarah Chen",
      date: "Mar 15, 2024",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&auto=format&q=80",
      readTime: "5 min"
    },
    {
      title: "Building Better Workflows with Automation",
      excerpt: "Learn how to streamline your team's processes and eliminate repetitive tasks with smart automation.",
      author: "Marcus Johnson",
      date: "Mar 12, 2024",
      image: "https://images.unsplash.com/photo-1518186233392-c232efbf2373?w=800&h=600&fit=crop&auto=format&q=80",
      readTime: "7 min"
    },
    {
      title: "Design System Best Practices for 2024",
      excerpt: "Creating consistent, scalable design systems that grow with your product and team.",
      author: "Elena Rodriguez",
      date: "Mar 10, 2024",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop&auto=format&q=80",
      readTime: "4 min"
    },
    {
      title: "Security in the Modern Workplace",
      excerpt: "Essential security practices for protecting your team's data in an increasingly connected world.",
      author: "David Kim",
      date: "Mar 8, 2024",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&auto=format&q=80",
      readTime: "6 min"
    },
    {
      title: "Scaling Engineering Teams Effectively",
      excerpt: "Strategies for maintaining culture and productivity as your engineering organization grows.",
      author: "Alex Thompson",
      date: "Mar 5, 2024",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&auto=format&q=80",
      readTime: "8 min"
    },
    {
      title: "The Art of Async Communication",
      excerpt: "Mastering asynchronous communication to build more inclusive and efficient remote teams.",
      author: "Maria Garcia",
      date: "Mar 3, 2024",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop&auto=format&q=80",
      readTime: "5 min"
    }
  ];

  const featuredPost = posts[0];
  const recentPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The Nexus Blog
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Insights, tips, and stories from the world of modern collaboration and team productivity.
          </p>
        </div>

        {/* Featured Post */}
        <div className="mb-20">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="order-2 lg:order-1 p-8 flex flex-col justify-center">
                <span className="text-blue-400 text-sm font-medium mb-2">Featured Article</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>By {featuredPost.author}</span>
                    <span>{featuredPost.date}</span>
                    <span>{featuredPost.readTime} read</span>
                  </div>
                  <Button variant="outline">
                    Read More
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&auto=format&q=80" 
                  alt={featuredPost.title}
                  className="w-full h-64 lg:h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-12">Recent Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post, index) => (
              <BlogPostCard key={index} {...post} />
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-20 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-gray-700/50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
          <p className="text-gray-400 mb-6">
            Get the latest insights and updates delivered to your inbox weekly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <Button variant="primary">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Get In Touch
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Have questions about Nexus? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Send us a message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Your Company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Tell us about your project..."
                />
              </div>
              <Button variant="primary" className="w-full">
                Send Message
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Mail className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Email</p>
                    <p className="text-gray-400">hello@nexus.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Phone</p>
                    <p className="text-gray-400">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Office</p>
                    <p className="text-gray-400">
                      123 Innovation Drive<br />
                      San Francisco, CA 94105
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Office Hours</h3>
              <div className="space-y-2 text-gray-400">
                <p>Monday - Friday: 9:00 AM - 6:00 PM PST</p>
                <p>Saturday: 10:00 AM - 4:00 PM PST</p>
                <p>Sunday: Closed</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <Twitter className="w-6 h-6 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
                <Linkedin className="w-6 h-6 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
                <Github className="w-6 h-6 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
                <Youtube className="w-6 h-6 text-gray-400 hover:text-red-400 cursor-pointer transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <NexusLogo className="justify-center mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your Nexus account</p>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-8">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-700 bg-gray-800 text-blue-600" />
                <span className="ml-2 text-sm text-gray-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
                Forgot password?
              </a>
            </div>
            <Button variant="primary" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" className="w-full">
                <Github className="w-5 h-5" />
                GitHub
              </Button>
              <Button variant="secondary" className="w-full">
                <Mail className="w-5 h-5" />
                Google
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <NexusLogo className="justify-center mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-gray-400">Join thousands of teams using Nexus</p>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-8">
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Your Company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Create a strong password"
              />
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="rounded border-gray-700 bg-gray-800 text-blue-600" />
              <span className="ml-2 text-sm text-gray-400">
                I agree to the{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
              </span>
            </div>
            <Button variant="primary" className="w-full">
              Create account
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" className="w-full">
                <Github className="w-5 h-5" />
                GitHub
              </Button>
              <Button variant="secondary" className="w-full">
                <Mail className="w-5 h-5" />
                Google
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
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
      <div className="min-h-screen bg-gray-950">
        <Routes>
          <Route path="/" element={
            <>
              <Header />
              <HomePage />
              <Footer />
            </>
          } />
          <Route path="/pricing" element={
            <>
              <Header />
              <PricingPage />
              <Footer />
            </>
          } />
          <Route path="/blog" element={
            <>
              <Header />
              <BlogPage />
              <Footer />
            </>
          } />
          <Route path="/contact" element={
            <>
              <Header />
              <ContactPage />
              <Footer />
            </>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}`;


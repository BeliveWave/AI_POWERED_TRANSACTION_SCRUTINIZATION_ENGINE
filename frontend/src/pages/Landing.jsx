import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Activity, Zap, Cpu, ArrowRight, Lock, Database, Search, Layers, Server, TrendingUp, CheckCircle, Clock, Twitter, Facebook, Linkedin } from 'lucide-react';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (email) {
      try {
        // Calling the backend endpoint to send the welcome email
        const response = await fetch('http://localhost:8000/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        
        if (response.ok) {
          alert(`Successfully subscribed! A welcome email has been sent to ${email}`);
          setEmail('');
        } else {
          alert('Failed to subscribe. Please try again later.');
        }
      } catch (error) {
        console.error('Error subscribing:', error);
        alert('An error occurred. Please check if the backend server is running.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#FFFFFF] font-sans selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      {/* 1. Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0B0B0F]/80 backdrop-blur-md border-b border-[#ffffff14]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-amber-600 flex items-center justify-center p-[1px]">
              <div className="w-full h-full bg-[#0B0B0F] rounded-[7px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#D4AF37]" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-wider text-white block">SENTINEL</span>
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] opacity-80 block -mt-1">Fraud Intelligence Middleware</span>
            </div>
          </div>
          
          <div className="hidden md:flex space-x-8 text-sm font-medium text-[#A8A8B3]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#technology" className="hover:text-white transition-colors">Technology</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium text-white hover:text-[#D4AF37] transition-colors">
              Log In
            </Link>
            <Link to="/register" className="px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)]">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. & 3. Hero Section & Visual Area */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden min-h-screen flex items-center">
        {/* Background Effects */}
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[#D4AF37] rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#ffffff0a] border border-[#ffffff14]">
              <span className="flex h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              <span className="text-xs font-medium text-[#A8A8B3]">Sentinel Middleware System v2.0 Live</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
              AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-500">
                Transaction Fraud
              </span><br />
              Detection
            </h1>
            
            <p className="text-xl text-[#A8A8B3] max-w-xl leading-relaxed">
              Real-time intelligent transaction monitoring that detects fraud patterns, analyzes risk behavior, and protects payment systems before fraud occurs.
            </p>
            
            <p className="text-sm text-[#A8A8B3] max-w-xl border-l-2 border-[#D4AF37] pl-4 opacity-80">
              Built for banks, fintech companies, payment gateways, and e-commerce systems. TSE acts as an intelligent middleware layer that evaluates every transaction instantly and returns a fraud risk score within milliseconds.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
              <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold bg-[#ffffff0a] text-white border border-[#ffffff14] hover:bg-[#ffffff14] transition-colors">
                View Dashboard
              </Link>
            </div>
          </div>
          
          <div className="relative lg:h-[600px] flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Main Visual Composition */}
            <div className="relative w-full max-w-lg aspect-square">
              {/* Central Glowing Ring */}
              <div className="absolute inset-0 rounded-full border border-[#D4AF37]/30 border-dashed animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute inset-4 rounded-full border border-blue-500/20 animate-[spin_40s_linear_infinite_reverse]"></div>
              
              {/* Credit Card Graphic */}
              <div className="absolute top-[10%] left-[10%] w-[280px] h-[160px] bg-gradient-to-br from-[#1A1A24] to-[#0B0B0F] rounded-2xl border border-[#ffffff14] shadow-2xl p-6 transform -rotate-6 animate-float backdrop-blur-xl z-20">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-10 h-8 bg-gradient-to-br from-[#D4AF37] to-amber-600 rounded opacity-80"></div>
                  <Shield className="text-[#A8A8B3] w-5 h-5" />
                </div>
                <div className="flex space-x-4 text-xl tracking-widest text-white/90 mb-4 font-mono">
                  <span>****</span><span>****</span><span>****</span><span>4291</span>
                </div>
                <div className="text-xs text-[#A8A8B3] uppercase">Status: Evaluating...</div>
              </div>
              
              {/* Main Dashboard Panel */}
              <div className="absolute bottom-[5%] right-[-5%] w-[320px] bg-[#121217]/90 backdrop-blur-xl rounded-2xl border border-[#ffffff14] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 z-30 animate-float-delayed">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white font-semibold">Real-Time Analysis</h3>
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#A8A8B3]">Fraud Score</span>
                      <span className="text-red-400 font-mono">0.92</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#ffffff0a] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 w-[92%]"></div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-[#ffffff14]">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="text-sm">
                        <div className="text-white">High Risk Alert</div>
                        <div className="text-[#A8A8B3] text-xs">Device mismatch detected</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Search className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div className="text-sm">
                        <div className="text-white">Location Anomaly</div>
                        <div className="text-[#A8A8B3] text-xs">2000mi jump in 5 mins</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* 4. Small Feature Cards */}
      <section id="features" className="py-20 bg-[#0B0B0F] border-t border-[#ffffff0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Real-Time Fraud Scoring', desc: 'Analyze financial transactions under 200 milliseconds.', icon: Zap },
              { title: 'Behavioral Profiling', desc: 'Detect unusual customer behavior using AI models.', icon: Activity },
              { title: 'Explainable AI', desc: 'Provide clear fraud reasons instead of black-box decisions.', icon: Search },
              { title: 'Continuous Learning', desc: 'Adaptive model retraining against new fraud tactics.', icon: Cpu },
            ].map((feature, i) => (
              <div key={i} className="group p-6 bg-[#121217] rounded-2xl border border-[#ffffff14] hover:border-[#D4AF37]/50 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#ffffff0a] flex items-center justify-center mb-6 group-hover:bg-[#D4AF37]/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[#A8A8B3] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. About The System Section */}
      <section className="py-24 bg-[#121217]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Traditional Fraud Detection Fails</h2>
            <p className="text-[#A8A8B3] max-w-2xl mx-auto text-lg">
              Legacy systems rely on static rules. The modern financial ecosystem requires dynamic, AI-driven intelligence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Traditional Card */}
            <div className="p-8 rounded-3xl bg-[#0B0B0F] border border-red-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lock className="w-24 h-24 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Traditional Rule-Based System</h3>
              <ul className="space-y-4">
                {[
                  'Static, easily bypassed rules',
                  'High rate of false positives',
                  'Friction in user experience',
                  'Limited adaptability to new threats',
                  'Slow manual reviews required'
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-[#A8A8B3]">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-3"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Modern Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1A1A24] to-[#0B0B0F] border border-[#D4AF37]/30 relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.1)]">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="w-24 h-24 text-[#D4AF37]" />
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] to-amber-600"></div>
              <h3 className="text-2xl font-bold text-white mb-6">AI-Powered TSE Middleware</h3>
              <ul className="space-y-4">
                {[
                  'Behavioral intelligence & profiling',
                  'Adaptive, real-time risk scoring',
                  'Dramatically lower false positives',
                  'Continuous learning from new data',
                  'Automated sub-200ms decisions'
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-white">
                    <CheckCircle className="w-5 h-5 text-[#D4AF37] mr-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Technology Stack Section */}
      <section id="technology" className="py-24 bg-[#0B0B0F]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Enterprise Technology Stack</h2>
            <p className="text-[#A8A8B3] max-w-2xl mx-auto text-lg">
              Built with industry-leading technologies for maximum performance, scale, and security.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { category: 'Backend', tech: ['Python', 'FastAPI'], icon: Server },
              { category: 'Machine Learning', tech: ['Scikit-learn', 'XGBoost', 'Pandas', 'NumPy'], icon: Cpu },
              { category: 'Frontend', tech: ['React.js', 'TailwindCSS', 'Chart.js'], icon: Layers },
              { category: 'Data & DevOps', tech: ['PostgreSQL', 'Redis', 'Docker', 'GitHub Actions'], icon: Database },
            ].map((stack, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#121217] border border-[#ffffff14]">
                <stack.icon className="w-8 h-8 text-[#D4AF37] mb-4" />
                <h3 className="text-white font-bold mb-4">{stack.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {stack.tech.map((t, j) => (
                    <span key={j} className="text-xs px-2.5 py-1 rounded bg-[#ffffff0a] text-[#A8A8B3] border border-[#ffffff14]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#121217] border-y border-[#ffffff0a]">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Intelligent Processing Flow</h2>
            <p className="text-[#A8A8B3] max-w-2xl mx-auto text-lg">
              A seamless integration that sits between your payment gateway and your core banking system.
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent -translate-y-1/2"></div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Transaction Sent', desc: 'User initiates payment via your application.' },
                { step: '02', title: 'Middleware Intercepts', desc: 'TSE instantly receives the transaction payload.' },
                { step: '03', title: 'AI Analysis', desc: 'Behavioral profiling & ML models evaluate risk.' },
                { step: '04', title: 'Decision Returned', desc: 'Risk score returned to gateway to allow or block.' },
              ].map((process, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#0B0B0F] border-2 border-[#D4AF37] flex items-center justify-center text-xl font-bold text-[#D4AF37] mb-6 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    {process.step}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{process.title}</h3>
                  <p className="text-[#A8A8B3] text-sm">{process.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Stats Section */}
      <section className="py-24 bg-[#0B0B0F]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '200ms', label: 'Response Time', icon: Clock },
              { value: '99.2%', label: 'Detection Accuracy', icon: Shield },
              { value: '1M+', label: 'Transactions Processed', icon: TrendingUp },
              { value: '24/7', label: 'Continuous Monitoring', icon: Activity },
            ].map((stat, i) => (
              <div key={i} className="p-8 rounded-2xl bg-gradient-to-b from-[#121217] to-[#0B0B0F] border border-[#ffffff14] text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#D4AF37] opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500"></div>
                <stat.icon className="w-6 h-6 text-[#D4AF37]/50 mx-auto mb-4" />
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">{stat.value}</div>
                <div className="text-sm font-medium text-[#A8A8B3] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#D4AF37] opacity-[0.02]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#D4AF37] rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 border border-[#ffffff14] bg-[#121217]/50 backdrop-blur-xl p-12 md:p-20 rounded-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Protect Every Transaction With AI Intelligence</h2>
          <p className="text-xl text-[#A8A8B3] mb-10 max-w-2xl mx-auto">
            Deploy a real-time fraud detection middleware that learns and adapts to evolving fraud patterns, safeguarding your revenue.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register" className="px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              Start Now
            </Link>
            <Link to="/login" className="px-8 py-4 rounded-xl text-base font-bold bg-[#ffffff0a] text-white border border-[#ffffff14] hover:bg-[#ffffff14] transition-colors">
              Explore Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-[#0B0B0F] border-t border-[#ffffff14] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Newsletter Section */}
          <div className="mb-16">
            <h3 className="text-[#D4AF37] font-semibold text-xl mb-2">Sign up for our newsletter!</h3>
            <p className="text-[#A8A8B3] mb-6">Stay up to date with tips, trends and offers about our system and security.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-full">
              <input 
                type="email" 
                placeholder="Enter your email address here" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-grow bg-[#121217] border border-[#ffffff14] rounded-lg px-5 py-4 text-white placeholder:text-[#A8A8B3] focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
              <button 
                type="submit" 
                className="px-8 py-4 rounded-lg font-bold bg-[#D4AF37] text-black hover:bg-[#c2a033] transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>

          <div className="w-full h-px bg-[#ffffff14] mb-12"></div>

          {/* Links Section */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-16">
            <div className="md:col-span-2 pr-8">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-lg font-bold tracking-wider text-white">SENTINEL</span>
              </div>
              <p className="text-[#A8A8B3] text-sm leading-relaxed mb-6">
                Sentinel is the online platform that brings together transaction monitoring, risk scoring, and security services. Sign up now for free to take advantage of the benefits.
              </p>
              <div className="flex space-x-5">
                <a href="#" className="text-[#A8A8B3] hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#A8A8B3] hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#A8A8B3] hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-[#D4AF37] font-semibold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-[#A8A8B3]">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fraud Scoring</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[#D4AF37] font-semibold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-[#A8A8B3]">
                <li><a href="#" className="hover:text-white transition-colors">About Sentinel</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-[#D4AF37] font-semibold mb-6">Contact details</h4>
              <ul className="space-y-4 text-sm text-[#A8A8B3]">
                <li><a href="https://share.google/2M7iiyiEMwq8kwPJ7" target="_blank" rel="noreferrer" className="hover:text-[#D4AF37] transition-colors">Location Map</a></li>
                <li>Phone: 0760355773</li>
                <li>info@sentinel.com</li>
                <li>Customer service</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#ffffff14] pt-8 text-sm text-[#A8A8B3]">
            <p>© 2026 Sentinel. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Terms of Policy</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

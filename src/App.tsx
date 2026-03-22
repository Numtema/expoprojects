import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IdeaInput } from './components/IdeaInput';
import { PlanViewer } from './components/PlanViewer';
import { AgentStudio } from './components/AgentStudio';
import { generateAppPlan } from './services/geminiService';
import { AppPlan } from './types';
import { Terminal, Github, Cpu, ArrowLeft, Layers, Bot, History, Trash2, ExternalLink } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [plan, setPlan] = useState<AppPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'architect' | 'studio'>('architect');
  const [history, setHistory] = useState<AppPlan[]>([]);

  const [backendData, setBackendData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => setBackendData(data))
      .catch(err => console.error("Failed to fetch backend data", err));
  }, []);

  const templates = [
    { id: 'saas', name: 'SaaS Starter', icon: <Layers className="w-4 h-4" />, prompt: 'A modern SaaS boilerplate with user management, subscriptions, and a dashboard.' },
    { id: 'ecommerce', name: 'E-commerce', icon: <Github className="w-4 h-4" />, prompt: 'A mobile-first e-commerce app with product listings, cart, and checkout.' },
    { id: 'social', name: 'Social Network', icon: <Bot className="w-4 h-4" />, prompt: 'A social app with user profiles, posts, likes, and real-time feed.' },
  ];

  useEffect(() => {
    const savedHistory = localStorage.getItem('expogo_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (newPlan: AppPlan) => {
    const updatedHistory = [newPlan, ...history.filter(p => p.name !== newPlan.name)].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('expogo_history', JSON.stringify(updatedHistory));
  };

  const deleteFromHistory = (name: string) => {
    const updatedHistory = history.filter(p => p.name !== name);
    setHistory(updatedHistory);
    localStorage.setItem('expogo_history', JSON.stringify(updatedHistory));
  };

  const handleGenerate = async (idea: string, audioData?: { data: string, mimeType: string }, style?: string) => {
    setIsLoading(true);
    setIsStopping(false);
    setError(null);
    try {
      const generatedPlan = await generateAppPlan(idea, audioData, style);
      
      // If user stopped while generating, don't update state
      if (isStopping) return;

      setPlan(generatedPlan);
      saveToHistory(generatedPlan);
      setActiveTab('architect');
    } catch (err) {
      if (isStopping) return;
      console.error(err);
      setError('Failed to generate plan. Please try again.');
    } finally {
      setIsLoading(false);
      setIsStopping(false);
    }
  };

  const stopGeneration = () => {
    setIsStopping(true);
    setIsLoading(false);
  };

  const reset = () => {
    setPlan(null);
    setError(null);
    setActiveTab('architect');
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
            <span className="font-mono font-black tracking-tighter text-2xl uppercase text-stone-900">ExpoGo.Builder</span>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-stone-100 rounded-lg border border-stone-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono text-stone-500 uppercase font-bold tracking-tighter">Backend API Ready</span>
            </div>
          </div>
          
          {plan && (
            <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200">
              <NavTab 
                active={activeTab === 'architect'} 
                onClick={() => setActiveTab('architect')}
                icon={<Layers className="w-4 h-4" />}
                label="Architect"
              />
              <NavTab 
                active={activeTab === 'studio'} 
                onClick={() => setActiveTab('studio')}
                icon={<Bot className="w-4 h-4" />}
                label="Agent Studio"
              />
            </div>
          )}

          <div className="hidden md:flex items-center gap-6">
            <a 
              href="https://github.com/expo-starter/expo-local-first-template" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-mono font-bold text-stone-400 hover:text-stone-900 flex items-center gap-2 transition-colors uppercase tracking-widest"
            >
              <Github className="w-4 h-4" />
              Template Base
            </a>
          </div>
        </div>
      </nav>

      <main className="py-12">
        <AnimatePresence mode="wait">
          {!plan ? (
            <motion.div
              key="input-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              <div className="text-center space-y-0 px-6 relative pt-12">
                <h2 className="text-[12vw] md:text-[10vw] font-sans font-black tracking-tighter text-stone-900 uppercase max-w-7xl mx-auto leading-[0.8] flex flex-col items-center">
                  <span className="block">ARCHITECT <span className="text-stone-300">&</span> BUILD YOUR</span>
                  <span className="block">NEXT <span className="text-stone-300">LOCAL-FIRST</span></span>
                  <span className="block">EXPERIENCE.</span>
                </h2>
                <div className="relative mt-12">
                  <div className="absolute -top-6 left-1/2 -translate-x-[180px] w-12 h-2 bg-blue-500 rounded-full hidden md:block" />
                  <p className="text-stone-400 font-serif italic text-xl md:text-3xl max-w-4xl mx-auto leading-relaxed">
                    A multi-agent system powered by Gemini 3.1 Pro that plans and generates full Expo projects.
                  </p>
                </div>
              </div>

              <IdeaInput onGenerate={handleGenerate} onStop={stopGeneration} isLoading={isLoading} />

              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
                {templates.map(t => (
                  <motion.button
                    key={t.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenerate(t.prompt)}
                    className="p-8 bg-white border border-stone-200 rounded-[2rem] text-left space-y-4 shadow-sm hover:border-stone-400 transition-all group"
                  >
                    <div className="p-3 bg-stone-50 rounded-xl w-fit group-hover:bg-stone-900 group-hover:text-white transition-colors">
                      {t.icon}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-mono font-black uppercase tracking-widest text-xs text-stone-900">{t.name}</h4>
                      <p className="text-[10px] text-stone-400 font-serif italic leading-relaxed">{t.prompt}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {error && (
                <div className="max-w-2xl mx-auto px-6">
                  <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-mono flex items-center gap-3 shadow-sm">
                    <Terminal className="w-4 h-4" />
                    {error}
                  </div>
                </div>
              )}

              {/* Features Grid */}
              <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 pt-12">
                <FeatureCard 
                  title="Architect Agent" 
                  desc="Plans your data schema, navigation structure, and implementation roadmap."
                />
                <FeatureCard 
                  title="Coder Agent" 
                  desc="Generates full source code for every file in your project workspace."
                />
                <FeatureCard 
                  title="Full Export" 
                  desc="Download your entire project as a structured JSON workspace ready for patching."
                />
              </div>

              {/* History Section */}
              {history.length > 0 && (
                <div className="max-w-5xl mx-auto px-6 space-y-8 pt-12">
                  <div className="flex items-center gap-4 border-b border-stone-200 pb-4">
                    <History className="w-5 h-5 text-stone-400" />
                    <h3 className="text-xs font-mono uppercase tracking-[0.2em] font-black text-stone-400">Recent Projects</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {history.map((h) => (
                      <div key={h.name} className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm flex items-center justify-between group hover:border-stone-400 transition-all">
                        <div className="space-y-1">
                          <h4 className="font-bold text-stone-900">{h.name}</h4>
                          <p className="text-xs text-stone-400 font-serif italic">{h.tagline}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setPlan(h)}
                            className="p-2 bg-stone-50 text-stone-400 hover:bg-stone-900 hover:text-white rounded-xl transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteFromHistory(h.name)}
                            className="p-2 bg-stone-50 text-stone-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="plan-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="max-w-6xl mx-auto px-6 mb-12">
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-[10px] font-mono font-bold text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-[0.2em]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Architect
                </button>
              </div>
              
              {activeTab === 'architect' ? (
                <PlanViewer plan={plan} onUpdatePlan={setPlan} />
              ) : (
                <AgentStudio plan={plan} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-16 mt-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-3 text-center md:text-left">
            <p className="text-lg font-mono font-black uppercase tracking-tighter text-stone-900">ExpoGo.Builder</p>
            <p className="text-sm text-stone-400 font-serif italic max-w-sm leading-relaxed">
              Automating the architectural planning and code generation of local-first mobile applications.
            </p>
            {backendData && (
              <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100 text-[10px] font-mono text-stone-400">
                <span className="block uppercase font-bold text-stone-500 mb-1">Backend API Response:</span>
                <pre className="whitespace-pre-wrap">{JSON.stringify(backendData, null, 2)}</pre>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-8 md:gap-12">
            <FooterLink label="Documentation" />
            <FooterLink label="Template Source" />
            <FooterLink label="AI Studio" />
          </div>
        </div>
      </footer>
    </div>
  );
}

const NavTab = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all",
      active ? "bg-stone-900 text-white shadow-lg" : "text-stone-400 hover:text-stone-600"
    )}
  >
    {icon}
    {label}
  </button>
);

const FeatureCard = ({ title, desc }: { title: string, desc: string }) => (
  <div className="p-10 bg-white border border-stone-200 rounded-[2rem] shadow-sm space-y-6 hover:border-stone-400 transition-all duration-500 group">
    <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all duration-500">
      <Cpu className="w-6 h-6" />
    </div>
    <div className="space-y-3">
      <h3 className="text-xs font-mono font-black uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-900 transition-colors">
        {title}
      </h3>
      <p className="text-stone-500 text-sm leading-relaxed font-serif italic">
        {desc}
      </p>
    </div>
  </div>
);

const FooterLink = ({ label }: { label: string }) => (
  <button className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
    {label}
  </button>
);

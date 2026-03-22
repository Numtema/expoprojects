import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Cpu, 
  FileCode, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Zap,
  Terminal,
  Layers,
  Code,
  Palette,
  MessageSquare,
  Send,
  BookOpen,
  Sparkles,
  History,
  Paperclip,
  FileText,
  X,
  Smartphone,
  Pause,
  Play,
  Square
} from 'lucide-react';
import { AppPlan, ProjectFile } from '../types';
import { 
  generateFileContent, 
  generateReadme, 
  generateTailwindConfig, 
  generateTests, 
  generateDevOpsConfigs 
} from '../services/geminiService';
import { cn } from '../lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  files?: { name: string, content: string }[];
}

interface AgentStudioProps {
  plan: AppPlan;
}

export const AgentStudio: React.FC<AgentStudioProps> = ({ plan }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const isStoppedRef = useRef(false);
  const isPausedRef = useRef(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'agent', text: `Hello! I'm your Team Lead. I've assembled a specialized team of agents to build "${plan.name}". We'll handle everything from UI design to deployment configs.` }
  ]);
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string, content: string }[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const checkPause = async () => {
    while (isPausedRef.current) {
      if (isStoppedRef.current) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedFiles(prev => [...prev, { name: file.name, content }]);
    };
    reader.readAsText(file);
  };

  const removeAttachedFile = (name: string) => {
    setAttachedFiles(prev => prev.filter(f => f.name !== name));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachedFiles.length === 0) return;
    
    setChatMessages(prev => [...prev, { role: 'user', text: input, files: attachedFiles }]);
    const userMsg = input;
    const currentContext = [...attachedFiles];
    setInput('');
    setAttachedFiles([]);

    // Simulate agent response
    setTimeout(() => {
      let responseText = `I've noted your request: "${userMsg}".`;
      if (currentContext.length > 0) {
        responseText += ` I've also analyzed the ${currentContext.length} document(s) you provided for context. I will incorporate this logic into the relevant files during the build process.`;
      }
      setChatMessages(prev => [...prev, { 
        role: 'agent', 
        text: responseText
      }]);
    }, 1000);
  };

  const buildProject = async () => {
    setIsBuilding(true);
    setIsPaused(false);
    setIsStopped(false);
    isStoppedRef.current = false;
    isPausedRef.current = false;
    setFiles([]);
    setLogs([]);
    addLog("Initializing Agent Team Studio...");
    addLog("Agent 1 (Architect) reviewing architectural plan...");
    
    const filesToGenerate = [
      'db/schema.ts',
      'db/drizzle.ts',
      'db/provider.tsx',
      'lib/utils.ts',
      'lib/useColorScheme.tsx',
      'lib/storage.ts',
      'app/_layout.tsx',
      'app/(tabs)/_layout.tsx',
      ...plan.screens.map(s => s.path),
    ];

    for (const path of filesToGenerate) {
      if (isStoppedRef.current) break;
      await checkPause();
      if (isStoppedRef.current) break;

      setCurrentFile(path);
      addLog(`Agent 2 (Coder) implementing: ${path}`);
      try {
        const contextFiles = chatMessages
          .filter(m => m.files)
          .flatMap(m => m.files || []);
          
        const content = await generateFileContent(plan, path, contextFiles);
        setFiles(prev => [...prev, { path, content }]);
        addLog(`Successfully implemented ${path}`);
      } catch (err) {
        addLog(`Error implementing ${path}: ${err}`);
      }
    }

    if (!isStoppedRef.current) {
      // New Agents
      try {
        await checkPause();
        if (isStoppedRef.current) throw new Error("Stopped");
        
        addLog("Agent 3 (UI Designer) crafting theme & style...");
        const twConfig = await generateTailwindConfig(plan);
        setFiles(prev => [...prev, { path: 'tailwind.config.ts', content: twConfig }]);
        addLog("Tailwind configuration successfully implemented.");

        await checkPause();
        if (isStoppedRef.current) throw new Error("Stopped");

        addLog("Agent 4 (QA Engineer) writing test suites...");
        const tests = await generateTests(plan);
        setFiles(prev => [...prev, ...tests]);
        addLog(`${tests.length} test files successfully implemented.`);

        await checkPause();
        if (isStoppedRef.current) throw new Error("Stopped");

        addLog("Agent 5 (DevOps Specialist) configuring CI/CD & deployment...");
        const devops = await generateDevOpsConfigs(plan);
        setFiles(prev => [...prev, ...devops]);
        addLog("Deployment configurations successfully implemented.");

        await checkPause();
        if (isStoppedRef.current) throw new Error("Stopped");

        addLog("Agent 6 (Technical Writer) drafting project documentation...");
        const readme = await generateReadme(plan);
        setFiles(prev => [...prev, { path: 'README.md', content: readme }]);
        addLog("README.md successfully implemented.");
      } catch (err) {
        if (err instanceof Error && err.message === "Stopped") {
          addLog("Build stopped by user.");
        } else {
          addLog(`Error in post-processing agents: ${err}`);
        }
      }
    }

    setIsBuilding(false);
    setIsPaused(false);
    setCurrentFile(null);
    if (isStoppedRef.current) {
      addLog("Project build stopped.");
    } else {
      addLog("Project build complete. Your specialized agent team has successfully finished the task.");
    }
  };

  const togglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    isPausedRef.current = nextPaused;
    addLog(nextPaused ? "Build paused." : "Build resumed.");
  };

  const stopBuild = () => {
    setIsStopped(true);
    isStoppedRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    addLog("Stopping build process...");
  };

  const exportAsZip = async () => {
    const zip = new JSZip();
    
    // Add files to zip
    files.forEach(file => {
      zip.file(file.path, file.content);
    });

    // Add plan as JSON
    zip.file('app-plan.json', JSON.stringify(plan, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${plan.name.toLowerCase().replace(/\s+/g, '-')}-project.zip`);
    addLog("Project exported as ZIP successfully.");
  };

  const downloadProject = () => {
    const projectData = {
      plan,
      files,
      generatedAt: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${plan.name.toLowerCase().replace(/\s+/g, '-')}-full-project.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-12 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-stone-200 pb-8 gap-6 sm:gap-8">
        <div className="flex items-center gap-4">
          <div className="p-2 sm:p-3 bg-stone-900 rounded-xl sm:rounded-2xl shadow-xl">
            <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-sans font-black uppercase tracking-tighter text-stone-900">Agent Team Studio</h2>
            <p className="text-xs sm:text-sm text-stone-500 font-serif italic">A specialized squad of AI agents collaborating to build your application.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {isBuilding ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePause}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-stone-200 text-stone-900 rounded-xl sm:rounded-2xl font-mono text-xs sm:text-sm uppercase tracking-widest shadow-lg hover:bg-stone-300 transition-all"
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                {isPaused ? "Resume" : "Pause"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopBuild}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-rose-100 text-rose-600 rounded-xl sm:rounded-2xl font-mono text-xs sm:text-sm uppercase tracking-widest shadow-lg hover:bg-rose-200 transition-all border border-rose-200"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop
              </motion.button>
            </div>
          ) : files.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={buildProject}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-stone-900 text-white rounded-xl sm:rounded-2xl font-mono text-xs sm:text-sm uppercase tracking-widest shadow-2xl hover:bg-stone-800 transition-all"
            >
              <Zap className="w-5 h-5 fill-current" />
              Run Agents & Build
            </motion.button>
          )}

          {files.length > 0 && !isBuilding && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportAsZip}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-4 sm:px-8 py-3 sm:py-4 bg-stone-900 text-white rounded-xl sm:rounded-2xl font-mono text-xs sm:text-sm uppercase tracking-widest shadow-2xl hover:bg-stone-800 transition-all"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                ZIP
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadProject}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-4 sm:px-8 py-3 sm:py-4 bg-emerald-600 text-white rounded-xl sm:rounded-2xl font-mono text-xs sm:text-sm uppercase tracking-widest shadow-2xl hover:bg-emerald-700 transition-all"
              >
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                JSON
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Agent Team Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <AgentCard icon={<Cpu className="w-4 h-4" />} name="Architect" role="Planning" active={isBuilding && logs.some(l => l.includes("Agent 1"))} />
        <AgentCard icon={<Code className="w-4 h-4" />} name="Coder" role="Generation" active={isBuilding && logs.some(l => l.includes("Agent 2"))} />
        <AgentCard icon={<Palette className="w-4 h-4" />} name="UI Designer" role="Styling" active={isBuilding && logs.some(l => l.includes("Agent 3"))} />
        <AgentCard icon={<CheckCircle2 className="w-4 h-4" />} name="QA Engineer" role="Testing" active={isBuilding && logs.some(l => l.includes("Agent 4"))} />
        <AgentCard icon={<Zap className="w-4 h-4" />} name="DevOps" role="Deployment" active={isBuilding && logs.some(l => l.includes("Agent 5"))} />
        <AgentCard icon={<BookOpen className="w-4 h-4" />} name="Writer" role="Docs" active={isBuilding && logs.some(l => l.includes("Agent 6"))} />
      </div>

      {/* Dependencies Section */}
      {plan.dependencies && plan.dependencies.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-[2rem] p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-stone-400" />
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-stone-900">Required Dependencies</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.dependencies.map(dep => (
              <div key={dep} className="px-3 py-1 bg-stone-50 border border-stone-100 rounded-lg text-[10px] font-mono text-stone-500">
                {dep}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Sidebar: Logs & Chat */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          {/* Chat Interface */}
          <div className="bg-white border border-stone-200 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl overflow-hidden flex flex-col h-[400px] sm:h-[500px]">
            <div className="p-5 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-xs font-mono font-black uppercase tracking-widest text-stone-900 block">Team Lead</span>
                  <span className="text-[8px] font-mono text-stone-400 uppercase">Orchestrating Agents</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isBuilding && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-emerald-600 uppercase font-bold tracking-tighter">Collaborating</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-emerald-600 uppercase">Online</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn(
                  "max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed space-y-3",
                  msg.role === 'agent' 
                    ? "bg-stone-100 text-stone-600 rounded-tl-none font-serif italic" 
                    : "bg-stone-900 text-white ml-auto rounded-tr-none font-mono"
                )}>
                  <p>{msg.text}</p>
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-800/20">
                      {msg.files.map(f => (
                        <div key={f.name} className="flex items-center gap-1 bg-stone-800/50 px-2 py-1 rounded text-[9px] uppercase tracking-widest">
                          <FileText className="w-3 h-3" />
                          {f.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {attachedFiles.length > 0 && (
              <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 flex flex-wrap gap-2">
                {attachedFiles.map(f => (
                  <div key={f.name} className="flex items-center gap-2 bg-white border border-stone-200 px-3 py-1 rounded-full text-[10px] font-mono">
                    <FileText className="w-3 h-3 text-stone-400" />
                    {f.name}
                    <button onClick={() => removeAttachedFile(f.name)} className="text-stone-400 hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-stone-100 flex gap-2 items-center">
              <label className="p-2 text-stone-400 hover:text-stone-900 cursor-pointer transition-colors">
                <Paperclip className="w-4 h-4" />
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".md,.txt,.json,.ts,.tsx,.js,.jsx" />
              </label>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask agent to adjust code..."
                className="flex-1 bg-stone-50 border-none rounded-xl px-4 py-2 text-xs font-mono focus:ring-0"
              />
              <button type="submit" className="p-2 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Logs */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
              <History className="w-3 h-3" />
              Agent Activity
            </h3>
            <div className="bg-stone-900 rounded-3xl p-6 font-mono text-[10px] text-stone-400 space-y-2 min-h-[200px] shadow-2xl border border-stone-800">
              {logs.map((log, i) => (
                <div key={i} className={cn(
                  "border-l-2 pl-3 py-1 transition-colors",
                  log.includes('Error') ? "border-rose-500 text-rose-400" : "border-stone-700 hover:text-stone-200"
                )}>
                  {log}
                </div>
              ))}
              {isBuilding && (
                <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Agent is thinking...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: File Explorer / Preview */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <h3 className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                Project Workspace
              </h3>
              <div className="h-4 w-px bg-stone-200 hidden sm:block" />
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono text-stone-400">
                <Smartphone className="w-3 h-3" />
                Live Preview
              </div>
            </div>
            {currentFile && (
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                GENERATING: {currentFile.split('/').pop()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
            {/* Code Editor */}
            <div className="xl:col-span-8 bg-white border border-stone-200 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-xl min-h-[400px] sm:min-h-[600px] flex flex-col">
              {files.length === 0 && !isBuilding ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                  <div className="p-8 bg-stone-50 rounded-full">
                    <Sparkles className="w-16 h-16 text-stone-200" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-stone-400 font-serif italic text-lg">Workspace is ready for build.</p>
                    <p className="text-xs text-stone-300 font-mono uppercase tracking-widest">Click 'Run Agents' to start the generation process.</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-stone-100 flex gap-2 overflow-x-auto custom-scrollbar bg-stone-50/50">
                    {files.map(f => (
                      <div key={f.path} className="px-4 py-2 bg-white rounded-xl border border-stone-200 text-[10px] font-mono text-stone-500 whitespace-nowrap shadow-sm">
                        {f.path.split('/').pop()}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-8 bg-stone-50/30">
                    <AnimatePresence mode="wait">
                      {files.length > 0 ? (
                        <motion.div
                          key={files[files.length - 1].path}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Code className="w-4 h-4 text-stone-400" />
                              <span className="text-xs font-mono font-bold text-stone-800">{files[files.length - 1].path}</span>
                            </div>
                          </div>
                          <pre className="text-[11px] font-mono text-stone-600 bg-white p-8 rounded-3xl border border-stone-100 shadow-sm leading-relaxed overflow-x-auto max-h-[500px]">
                            <code>{files[files.length - 1].content}</code>
                          </pre>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Phone Preview */}
            <div className="xl:col-span-4 flex flex-col items-center">
              <div className="relative w-[240px] sm:w-[280px] h-[500px] sm:h-[580px] bg-stone-900 rounded-[2.5rem] sm:rounded-[3rem] border-[6px] sm:border-[8px] border-stone-800 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-5 sm:h-6 bg-stone-800 rounded-b-2xl z-20" />
                
                <div className="absolute inset-0 bg-white flex flex-col">
                  {/* Status Bar */}
                  <div className="h-8 sm:h-10 bg-white flex items-center justify-between px-4 sm:px-6 pt-3 sm:pt-4">
                    <span className="text-[8px] sm:text-[10px] font-bold">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-stone-200" />
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-stone-200" />
                    </div>
                  </div>

                  {/* App Content Mock */}
                  <div className="flex-1 p-6 space-y-6">
                    <div className="h-8 w-3/4 bg-stone-100 rounded-lg animate-pulse" />
                    <div className="aspect-square bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-center">
                      {isBuilding ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-stone-200 animate-spin" />
                          <span className="text-[8px] font-mono text-stone-300 uppercase tracking-widest">Building UI...</span>
                        </div>
                      ) : files.length > 0 ? (
                        <div className="flex flex-col items-center gap-3 text-center p-4">
                          <div className="p-4 bg-emerald-50 rounded-full">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          </div>
                          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-tight">
                            {currentFile || files[files.length-1].path}
                          </span>
                        </div>
                      ) : (
                        <Smartphone className="w-12 h-12 text-stone-100" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-stone-50 rounded-lg" />
                      <div className="h-4 w-5/6 bg-stone-50 rounded-lg" />
                      <div className="h-4 w-4/6 bg-stone-50 rounded-lg" />
                    </div>
                  </div>

                  {/* Tab Bar Mock */}
                  <div className="h-20 border-t border-stone-100 flex items-center justify-around px-4 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-stone-100" />
                    <div className="w-8 h-8 rounded-xl bg-stone-900 shadow-lg" />
                    <div className="w-8 h-8 rounded-xl bg-stone-100" />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[10px] font-mono text-stone-400 uppercase tracking-widest">Live Preview Mockup</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentCard = ({ icon, name, role, active }: { icon: React.ReactNode, name: string, role: string, active: boolean }) => (
  <div className={cn(
    "p-4 rounded-2xl border transition-all duration-500 flex flex-col items-center text-center gap-2",
    active 
      ? "bg-stone-900 border-stone-900 shadow-xl scale-105" 
      : "bg-white border-stone-100 opacity-50"
  )}>
    <div className={cn(
      "p-2 rounded-xl",
      active ? "bg-stone-800 text-emerald-400" : "bg-stone-50 text-stone-400"
    )}>
      {icon}
    </div>
    <div>
      <p className={cn("text-[10px] font-mono font-black uppercase tracking-widest", active ? "text-white" : "text-stone-900")}>{name}</p>
      <p className={cn("text-[8px] font-mono uppercase opacity-50", active ? "text-stone-400" : "text-stone-400")}>{role}</p>
    </div>
    {active && (
      <div className="flex gap-1">
        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    )}
  </div>
);

const StatCard = ({ label, value, icon }: { label: string, value: number | string, icon: React.ReactNode }) => (
  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
    <div className="p-2 bg-white rounded-lg text-stone-400 shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-sans font-black text-stone-900">{value}</p>
    </div>
  </div>
);

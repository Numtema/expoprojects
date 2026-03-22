import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Database, 
  Layout, 
  Settings, 
  Code2, 
  Box, 
  ArrowRight,
  Table as TableIcon,
  Smartphone,
  ChevronRight,
  Download,
  FileCode,
  CheckSquare,
  Square,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Network,
  Palette
} from 'lucide-react';
import { AppPlan, AppTask, DataModel, Artifact, DataColumn } from '../types';
import { cn } from '../lib/utils';

interface PlanViewerProps {
  plan: AppPlan;
  onUpdatePlan: (plan: AppPlan) => void;
}

export const PlanViewer: React.FC<PlanViewerProps> = ({ plan, onUpdatePlan }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showSchemaGraph, setShowSchemaGraph] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportPlan = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${plan.name.toLowerCase().replace(/\s+/g, '-')}-plan.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-16 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4 flex-1"
        >
          <h1 className="text-6xl font-sans font-bold tracking-tighter text-stone-900 uppercase leading-[0.85]">
            {plan.name}
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-serif italic text-stone-500">
              {plan.tagline}
            </p>
            {plan.style && (
              <span className="px-3 py-1 bg-stone-900 text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-2">
                <Palette className="w-3 h-3" />
                {plan.style}
              </span>
            )}
          </div>
        </motion.div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportPlan}
          className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl font-mono text-xs uppercase tracking-widest shadow-lg hover:bg-stone-800 transition-all"
        >
          <Download className="w-4 h-4" />
          Export Plan
        </motion.button>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-3xl space-y-6"
      >
        <p className="text-stone-500 leading-relaxed text-lg font-serif italic border-l-4 border-stone-200 pl-6">
          {plan.description}
        </p>
        
        {plan.dependencies && (
          <div className="flex flex-wrap gap-2 pl-6">
            {plan.dependencies.map(dep => (
              <span key={dep} className="text-[9px] font-mono font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded uppercase tracking-widest">
                {dep}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Implementation Roadmap */}
        <div className="lg:col-span-2 space-y-8">
          <SectionHeader icon={<CheckCircle2 className="w-5 h-5" />} title="Implementation Roadmap" />
          <div className="space-y-6">
            {plan.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* Screens / Architecture */}
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <SectionHeader icon={<Smartphone className="w-5 h-5" />} title="Screen Structure" />
              <button 
                onClick={() => setShowVisualizer(!showVisualizer)}
                className="text-[10px] font-mono font-bold text-stone-400 hover:text-stone-900 flex items-center gap-1 uppercase"
              >
                <Network className="w-3 h-3" />
                {showVisualizer ? 'Hide Graph' : 'Show Graph'}
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              {showVisualizer ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 bg-stone-900 rounded-3xl border border-stone-800 shadow-2xl space-y-8 relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  {plan.screens.map((screen, idx) => (
                    <div key={screen.path} className="relative z-10 flex flex-col items-center">
                      <div className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-xl text-[10px] font-mono text-stone-300 shadow-lg">
                        {screen.name}
                      </div>
                      {idx < plan.screens.length - 1 && (
                        <div className="w-px h-8 bg-gradient-to-b from-stone-700 to-transparent" />
                      )}
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {plan.screens.map((screen) => (
                    <ScreenCard key={screen.path} screen={screen} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <SectionHeader icon={<Box className="w-5 h-5" />} title="Architecture" />
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl shadow-inner">
              <p className="text-sm text-stone-600 leading-relaxed font-mono">
                {plan.architecture}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Schema */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <SectionHeader icon={<Database className="w-5 h-5" />} title="Local-First Data Schema (Drizzle)" />
          <button 
            onClick={() => setShowSchemaGraph(!showSchemaGraph)}
            className="text-[10px] font-mono font-bold text-stone-400 hover:text-stone-900 flex items-center gap-1 uppercase"
          >
            <Network className="w-3 h-3" />
            {showSchemaGraph ? 'Hide Schema Graph' : 'Show Schema Graph'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showSchemaGraph ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-12 bg-stone-900 rounded-[3rem] border border-stone-800 shadow-2xl relative overflow-hidden min-h-[400px] flex items-center justify-center flex-wrap gap-12"
            >
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              {plan.schema.map((model) => (
                <div key={model.name} className="relative z-10 p-6 bg-stone-800 border border-stone-700 rounded-2xl shadow-xl w-64 space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-700 pb-2">
                    <TableIcon className="w-4 h-4 text-stone-400" />
                    <span className="text-xs font-mono font-black text-white uppercase">{model.name}</span>
                  </div>
                  <div className="space-y-1">
                    {model.columns.map(col => (
                      <div key={col.name} className="flex items-center justify-between text-[10px] font-mono">
                        <span className={cn(col.isPrimary ? "text-amber-400" : "text-stone-400")}>
                          {col.isPrimary && "🔑 "}{col.name}
                        </span>
                        <span className="text-stone-600 uppercase">{col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {plan.schema.map((model, modelIdx) => (
                <SchemaCard 
                  key={model.name} 
                  model={model} 
                  onUpdate={(updatedModel) => {
                    const newSchema = [...plan.schema];
                    newSchema[modelIdx] = updatedModel;
                    onUpdatePlan({ ...plan, schema: newSchema });
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Artifacts */}
      <div className="space-y-8">
        <SectionHeader icon={<FileCode className="w-5 h-5" />} title="Initial Artifacts" />
        <div className="space-y-8">
          {plan.artifacts.map((artifact, idx) => (
            <ArtifactCard 
              key={idx} 
              artifact={artifact} 
              onCopy={() => handleCopy(artifact.code, `art-${idx}`)}
              isCopied={copied === `art-${idx}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <div className="flex items-center gap-4 border-b border-stone-200 pb-4">
    <div className="p-2.5 bg-stone-100 rounded-xl text-stone-600 shadow-sm">
      {icon}
    </div>
    <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-black text-stone-400">
      {title}
    </h2>
  </div>
);

const TaskCard = ({ task }: { task: AppTask }) => {
  const categoryIcons = {
    setup: <Settings className="w-4 h-4" />,
    database: <Database className="w-4 h-4" />,
    ui: <Layout className="w-4 h-4" />,
    logic: <Code2 className="w-4 h-4" />,
    feature: <Box className="w-4 h-4" />
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden group hover:border-stone-400 transition-all duration-300">
      <div className="p-6 flex items-start gap-5">
        <div className={cn(
          "mt-1 p-3 rounded-xl shadow-sm transition-transform group-hover:scale-110",
          task.category === 'setup' && "bg-blue-50 text-blue-600",
          task.category === 'database' && "bg-amber-50 text-amber-600",
          task.category === 'ui' && "bg-purple-50 text-purple-600",
          task.category === 'logic' && "bg-emerald-50 text-emerald-600",
          task.category === 'feature' && "bg-rose-50 text-rose-600"
        )}>
          {categoryIcons[task.category]}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-stone-900 tracking-tight">{task.title}</h3>
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-stone-100 text-stone-500 rounded-lg font-bold tracking-wider">
              {task.category}
            </span>
          </div>
          <p className="text-stone-500 leading-relaxed font-serif italic">
            {task.description}
          </p>
          
          {/* Morsels */}
          <div className="pt-4 space-y-2 border-t border-stone-50">
            {task.morsels.map((morsel, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-stone-600 font-mono group/morsel">
                <Square className="w-4 h-4 text-stone-300 group-hover/morsel:text-stone-900 transition-colors cursor-pointer" />
                <span>{morsel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScreenCard = ({ screen }: { screen: AppPlan['screens'][0] }) => (
  <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-4 group hover:border-stone-400 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-stone-200 group-hover:bg-stone-900 transition-colors" />
        <span className="text-sm font-mono font-black text-stone-800 uppercase tracking-tighter">{screen.name}</span>
      </div>
      <span className="text-[10px] font-mono text-stone-400 bg-stone-50 px-2 py-0.5 rounded-md">{screen.path}</span>
    </div>
    <p className="text-xs text-stone-500 leading-relaxed italic font-serif border-l-2 border-stone-100 pl-3">
      {screen.description}
    </p>
    <div className="flex flex-wrap gap-2 pt-2">
      {screen.components.map(comp => (
        <span key={comp} className="text-[9px] font-mono bg-stone-900 text-stone-400 px-2 py-1 rounded-md group-hover:text-white transition-colors">
          {comp}
        </span>
      ))}
    </div>
  </div>
);

const SchemaCard = ({ model, onUpdate }: { model: DataModel, onUpdate: (model: DataModel) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedModel, setEditedModel] = useState(model);

  const handleAddColumn = () => {
    const newCol: DataColumn = {
      name: 'new_column',
      type: 'text',
      description: 'New column description'
    };
    setEditedModel({ ...editedModel, columns: [...editedModel.columns, newCol] });
  };

  const handleUpdateColumn = (idx: number, updates: Partial<DataColumn>) => {
    const newCols = [...editedModel.columns];
    newCols[idx] = { ...newCols[idx], ...updates };
    setEditedModel({ ...editedModel, columns: newCols });
  };

  const handleRemoveColumn = (idx: number) => {
    const newCols = editedModel.columns.filter((_, i) => i !== idx);
    setEditedModel({ ...editedModel, columns: newCols });
  };

  const handleSave = () => {
    onUpdate(editedModel);
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden group hover:border-stone-400 transition-all duration-300">
      <div className="p-6 bg-stone-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-800 rounded-xl">
            <TableIcon className="w-5 h-5 text-stone-400" />
          </div>
          {isEditing ? (
            <input 
              value={editedModel.name}
              onChange={(e) => setEditedModel({ ...editedModel, name: e.target.value })}
              className="bg-stone-800 border-none font-mono font-black text-lg tracking-tighter uppercase focus:ring-0 w-32"
            />
          ) : (
            <h3 className="font-mono font-black text-lg tracking-tighter uppercase">{model.name}</h3>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="p-2 hover:bg-emerald-600 rounded-lg transition-colors text-emerald-400 hover:text-white">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => { setIsEditing(false); setEditedModel(model); }} className="p-2 hover:bg-rose-600 rounded-lg transition-colors text-rose-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-stone-800 rounded-lg transition-colors text-stone-400 hover:text-white">
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold">SQLite</span>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {isEditing ? (
          <textarea 
            value={editedModel.description}
            onChange={(e) => setEditedModel({ ...editedModel, description: e.target.value })}
            className="w-full bg-stone-50 border border-stone-100 rounded-xl p-3 text-sm text-stone-500 italic font-serif leading-relaxed focus:ring-0"
            rows={2}
          />
        ) : (
          <p className="text-sm text-stone-500 italic font-serif leading-relaxed">
            {model.description}
          </p>
        )}
        <div className="space-y-3">
          {(isEditing ? editedModel.columns : model.columns).map((col, idx) => (
            <div key={idx} className="flex items-start justify-between py-3 border-b border-stone-50 last:border-0 group/col">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input 
                      value={col.name}
                      onChange={(e) => handleUpdateColumn(idx, { name: e.target.value })}
                      className="text-sm font-mono font-bold text-stone-800 bg-stone-50 border-none p-0 focus:ring-0 w-full"
                    />
                  ) : (
                    <span className="text-sm font-mono font-bold text-stone-800">{col.name}</span>
                  )}
                  {col.isPrimary && <span className="text-[8px] bg-amber-900 text-amber-100 px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest">PK</span>}
                </div>
                {isEditing ? (
                  <input 
                    value={col.description}
                    onChange={(e) => handleUpdateColumn(idx, { description: e.target.value })}
                    className="text-[11px] text-stone-400 leading-relaxed font-serif italic bg-stone-50 border-none p-0 focus:ring-0 w-full"
                  />
                ) : (
                  <p className="text-[11px] text-stone-400 leading-relaxed font-serif italic">{col.description}</p>
                )}
              </div>
              <div className="text-right space-y-1 ml-4">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <select 
                      value={col.type}
                      onChange={(e) => handleUpdateColumn(idx, { type: e.target.value })}
                      className="text-[10px] font-mono text-stone-400 uppercase font-bold tracking-widest bg-stone-50 border-none p-0 focus:ring-0"
                    >
                      <option value="text">text</option>
                      <option value="integer">integer</option>
                      <option value="real">real</option>
                      <option value="blob">blob</option>
                    </select>
                    <button onClick={() => handleRemoveColumn(idx)} className="p-1 text-rose-400 hover:text-rose-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-stone-400 uppercase font-bold tracking-widest">{col.type}</span>
                )}
                {col.default && <div className="text-[9px] text-stone-300 font-mono">DEF: {col.default}</div>}
              </div>
            </div>
          ))}
          {isEditing && (
            <button 
              onClick={handleAddColumn}
              className="w-full py-2 border-2 border-dashed border-stone-100 rounded-xl text-stone-300 hover:text-stone-500 hover:border-stone-200 transition-all flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest"
            >
              <Plus className="w-3 h-3" />
              Add Column
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ArtifactCard = ({ artifact, onCopy, isCopied }: { artifact: Artifact, onCopy: () => void, isCopied: boolean }) => (
  <div className="bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 group">
    <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-stone-800 rounded-xl">
          <FileCode className="w-5 h-5 text-stone-400" />
        </div>
        <div>
          <h4 className="text-sm font-mono font-bold text-stone-200 uppercase tracking-tight">{artifact.title}</h4>
          <p className="text-[10px] font-mono text-stone-500">{artifact.file}</p>
        </div>
      </div>
      <button 
        onClick={onCopy}
        className="p-2.5 hover:bg-stone-800 rounded-xl transition-colors text-stone-400 hover:text-white"
      >
        {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
    <div className="p-6 overflow-x-auto custom-scrollbar">
      <pre className="text-xs font-mono text-stone-300 leading-relaxed">
        <code>{artifact.code}</code>
      </pre>
    </div>
  </div>
);

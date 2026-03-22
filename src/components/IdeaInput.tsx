import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, Loader2, Mic, Square, Volume2, Palette } from 'lucide-react';
import { cn } from '../lib/utils';

interface IdeaInputProps {
  onGenerate: (idea: string, audioData?: { data: string, mimeType: string }, style?: string) => void;
  onStop?: () => void;
  isLoading: boolean;
}

export const IdeaInput: React.FC<IdeaInputProps> = ({ onGenerate, onStop, isLoading }) => {
  const [idea, setIdea] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'minimal' | 'brutalist' | 'modern' | 'glassmorphism'>('modern');

  const styles = [
    { id: 'minimal', name: 'Minimal', desc: 'Clean & Simple' },
    { id: 'brutalist', name: 'Brutalist', desc: 'Bold & Raw' },
    { id: 'modern', name: 'Modern', desc: 'Sleek & Fluid' },
    { id: 'glassmorphism', name: 'Glass', desc: 'Frosted & Depth' }
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setIdea(prev => prev || "Audio input recorded...");
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((idea.trim() || audioBlob) && !isLoading) {
      let audioData;
      if (audioBlob) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
          };
        });
        reader.readAsDataURL(audioBlob);
        const base64 = await base64Promise;
        audioData = { data: base64, mimeType: audioBlob.type };
      }
      onGenerate(idea, audioData, selectedStyle);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-stone-200 p-3 rounded-[3rem] shadow-2xl">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="app minimall todo list"
            className={cn(
              "w-full min-h-[220px] p-10 rounded-[2.5rem] bg-white border-none shadow-inner transition-all duration-300",
              "focus:ring-0 resize-none text-2xl font-sans leading-relaxed text-stone-800",
              "placeholder:text-stone-300"
            )}
            disabled={isLoading}
          />
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3 text-[11px] font-mono font-black uppercase tracking-[0.2em] text-stone-400">
            <Palette className="w-4 h-4" />
            Visual Aesthetic
          </div>
          <div className="flex flex-wrap gap-4">
            {styles.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStyle(s.id as any)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[11px] font-mono font-bold uppercase tracking-widest transition-all border-2",
                  selectedStyle === s.id 
                    ? "bg-stone-900 text-white border-stone-900 shadow-xl scale-105" 
                    : "bg-white text-stone-400 border-stone-100 hover:border-stone-300"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-10 right-10 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={cn(
              "p-3 rounded-xl transition-all duration-300 shadow-sm",
              isRecording 
                ? "bg-rose-500 text-white animate-pulse" 
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            )}
          >
            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type={isLoading ? "button" : "submit"}
            onClick={isLoading ? onStop : undefined}
            disabled={(!idea.trim() && !audioBlob) && !isLoading}
            className={cn(
              "px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300",
              isLoading 
                ? "bg-rose-100 text-rose-600 hover:bg-rose-200 border border-rose-200 shadow-lg" 
                : (idea.trim() || audioBlob)
                  ? "bg-stone-900 text-white hover:bg-stone-800 shadow-md" 
                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                Stop Planning
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Plan
              </>
            )}
          </motion.button>
        </div>
      </form>
      {audioBlob && !isRecording && (
        <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-mono text-xs uppercase tracking-widest">
          <Volume2 className="w-4 h-4" />
          Voice input captured
          <button 
            onClick={() => setAudioBlob(null)}
            className="ml-2 text-stone-400 hover:text-rose-500 underline"
          >
            Clear
          </button>
        </div>
      )}
      <p className="mt-4 text-center text-stone-500 text-sm italic font-serif">
        "Every great app starts with a single, well-defined plan."
      </p>
    </div>
  );
};

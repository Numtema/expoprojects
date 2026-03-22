import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, Loader2, Mic, Square, Volume2, Palette } from 'lucide-react';
import { cn } from '../lib/utils';

interface IdeaInputProps {
  onGenerate: (idea: string, audioData?: { data: string, mimeType: string }, style?: string) => void;
  isLoading: boolean;
}

export const IdeaInput: React.FC<IdeaInputProps> = ({ onGenerate, isLoading }) => {
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
    <div className="w-full max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Describe your app idea (e.g., 'A local-first plant watering tracker with reminders and photo logs')... Our agent team will handle the rest."
          className={cn(
            "w-full min-h-[160px] p-6 rounded-2xl bg-white border-2 border-stone-200 shadow-sm transition-all duration-300",
            "focus:border-stone-800 focus:ring-0 resize-none text-lg font-sans leading-relaxed",
            "placeholder:text-stone-400"
          )}
          disabled={isLoading}
        />
        
        {/* Style Selector */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest text-stone-400">
            <Palette className="w-3 h-3" />
            Visual Aesthetic
          </div>
          <div className="flex flex-wrap gap-3">
            {styles.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStyle(s.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all border",
                  selectedStyle === s.id 
                    ? "bg-stone-900 text-white border-stone-900 shadow-md" 
                    : "bg-white text-stone-400 border-stone-200 hover:border-stone-400"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 flex items-center gap-3">
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
            type="submit"
            disabled={(!idea.trim() && !audioBlob) || isLoading}
            className={cn(
              "px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors",
              (idea.trim() || audioBlob) && !isLoading 
                ? "bg-stone-900 text-white hover:bg-stone-800 shadow-md" 
                : "bg-stone-100 text-stone-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Planning...
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

import { useEffect, useState } from 'react';
import { Snack } from 'snack-sdk';
import { Loader2 } from 'lucide-react';

interface ExpoSnackPreviewProps {
  files: { path: string; content: string }[];
  dependencies: string[];
}

export const ExpoSnackPreview = ({ files, dependencies }: ExpoSnackPreviewProps) => {
  const [snackId, setSnackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const saveSnack = async () => {
      try {
        setIsLoading(true);
        const snackFiles: Record<string, any> = {};
        files.forEach(f => {
          const cleanPath = f.path.replace(/^\.\//, '').replace(/^\//, '');
          snackFiles[cleanPath] = { type: 'CODE', contents: f.content };
        });

        const snackDeps: Record<string, any> = {};
        dependencies.forEach(d => {
          snackDeps[d] = { version: '*' };
        });

        const snack = new Snack({
          sdkVersion: '51.0.0',
          name: 'Agent Studio Output',
          files: snackFiles,
          dependencies: snackDeps,
        });

        const { id } = await snack.saveAsync();
        if (isMounted) {
          setSnackId(id);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };
    saveSnack();
    return () => { isMounted = false; };
  }, [files, dependencies]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 text-rose-500 text-xs text-center p-6 rounded-3xl border border-rose-100 gap-3">
        <span>Failed to load Expo Preview</span>
        <span className="opacity-70">{error}</span>
      </div>
    );
  }

  if (isLoading || !snackId) {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-stone-50 rounded-3xl border border-stone-200 gap-4">
        <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Generating Live Preview...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] xl:h-full min-h-[600px] bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
      <iframe
        src={`https://snack.expo.dev/embedded/@snack/${snackId}?platform=web&theme=light&preview=true`}
        className="w-full h-full border-none"
        allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
        sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
      />
    </div>
  );
};

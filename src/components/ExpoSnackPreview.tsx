import { useEffect, useState } from 'react';
import { Snack } from 'snack-sdk';
import { Loader2, Monitor, Smartphone, QrCode, ExternalLink, Copy, Check } from 'lucide-react';

interface ExpoSnackPreviewProps {
  files: { path: string; content: string }[];
  dependencies: string[];
}

export const ExpoSnackPreview = ({ files, dependencies }: ExpoSnackPreviewProps) => {
  const [snackId, setSnackId] = useState<string | null>(null);
  const [snackUrl, setSnackUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'web' | 'expogo'>('web');
  const [copied, setCopied] = useState(false);

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

        // Ensure App.js exists for Expo Snack if it's an Expo Router app
        if (!snackFiles['App.js'] && !snackFiles['App.tsx']) {
          snackFiles['App.js'] = {
            type: 'CODE',
            contents: `import "expo-router/entry";\n`
          };
        }

        // Ensure package.json exists with the correct main entry
        if (!snackFiles['package.json']) {
          snackFiles['package.json'] = {
            type: 'CODE',
            contents: JSON.stringify({
              name: "expo-snack",
              main: "expo-router/entry"
            }, null, 2)
          };
        }

        const snackDeps: Record<string, any> = {};
        dependencies.forEach(d => {
          snackDeps[d] = { version: '*' };
        });
        
        if (!snackDeps['expo-router']) {
          snackDeps['expo-router'] = { version: '*' };
        }

        const snack = new Snack({
          sdkVersion: '54.0.0',
          name: 'Agent Studio Output',
          files: snackFiles,
          dependencies: snackDeps,
        });

        const { id, url } = await snack.saveAsync();
        if (isMounted) {
          setSnackId(id);
          setSnackUrl(url);
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

  const copyToClipboard = () => {
    if (!snackUrl) return;
    navigator.clipboard.writeText(snackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div className="w-full h-[650px] xl:h-full min-h-[650px] bg-white rounded-3xl border border-stone-200 flex flex-col overflow-hidden shadow-sm">
      {/* Tab Switcher */}
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('web')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === 'web'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Web view</span>
          </button>
          <button
            onClick={() => setActiveTab('expogo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === 'expogo'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Expo Go</span>
          </button>
        </div>

        {snackId && (
          <a
            href={`https://snack.expo.dev/${snackId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
            title="Open on snack.expo.dev"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative">
        {activeTab === 'web' ? (
          <iframe
            src={`https://snack.expo.dev/embedded/${snackId}?platform=web&theme=light&preview=true`}
            className="w-full h-full border-none"
            allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
            sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
          />
        ) : (
          <div className="w-full h-full overflow-y-auto p-6 sm:p-8 flex flex-col items-center justify-center bg-stone-50/30 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center gap-4 w-full max-w-sm">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400">Scan with Expo Go</span>
              
              {/* QR Code Container */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 aspect-square w-48 h-48 flex items-center justify-center">
                {snackUrl ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(snackUrl)}`}
                    alt="Expo Go QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 font-mono text-[10px] uppercase font-bold tracking-wider rounded-xl transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bilingual Instructions */}
            <div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-black uppercase tracking-widest text-stone-900">Instructions</h4>
                <p className="text-[10px] text-stone-400 font-mono">BILINGUAL SUPPORT</p>
              </div>
              
              <div className="border-t border-stone-100 pt-3 space-y-2">
                <p className="text-[11px] text-stone-600 font-serif italic leading-relaxed">
                  🇬🇧 **English**: Open the **Expo Go** app on your phone. For iOS, scan using your system Camera app. For Android, use the Expo Go scanner.
                </p>
                <p className="text-[11px] text-stone-600 font-serif italic leading-relaxed">
                  🇫🇷 **Français**: Ouvrez l'application **Expo Go** sur votre téléphone. Pour iOS, scannez avec l'appareil photo système. Pour Android, utilisez le scanneur de l'application Expo Go.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

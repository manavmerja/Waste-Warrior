import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X, PlayCircle } from 'lucide-react';

export default function VideoPlayer({ module, onClose, onComplete }) {

  const handleMarkComplete = () => {
    // Sidha complete mark karo aur quiz kholo
    onComplete(); 
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black text-white border-gray-800">
        
        {/* Header */}
        <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
          <div>
            <DialogTitle className="text-lg font-semibold text-white">{module.title}</DialogTitle>
            <DialogDescription className="text-gray-400 text-xs mt-1">
              Watch the video below to understand the topic.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* YOUTUBE IFRAME (Simple & Stable) */}
        <div className="relative aspect-video bg-black w-full">
          <iframe 
            width="100%" 
            height="100%" 
            src={`${module.video_url}?autoplay=0&rel=0`} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>

        {/* Footer Controls (No Progress Bar, Just Action) */}
        <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-between items-center">
          
          <p className="text-sm text-gray-400">
            <PlayCircle className="inline w-4 h-4 mr-1 text-emerald-500" />
            Video loaded successfully
          </p>

          {/* Button is ALWAYS Enabled */}
          <Button 
            onClick={handleMarkComplete} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/20"
          >
            I'm Ready for the Quiz <CheckCircle2 className="ml-2 h-4 w-4" />
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
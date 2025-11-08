import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, CheckCircle2 } from 'lucide-react';

import ReactPlayer from 'react-player';

export default function VideoPlayer({ module, onClose, onComplete }) {
  const { t } = useTranslation();
  const [watchProgress, setWatchProgress] = useState(0);
  const [canComplete, setCanComplete] = useState(false);
  const videoRef = useRef(null);

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{module.title}</DialogTitle>
          <DialogDescription>{module.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Player */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            {/* <video
              ref={videoRef}
              src={module.video_url}
              controls
              className="w-full h-full"
              controlsList="nodownload"
            >
              Your browser does not support the video tag.
            </video> */}
            <iframe
              // ref={videoRef}
              src={module.video_url}
              // controls
              className="w-full h-full"
              // controlsList="nodownload"
            >
              Your browser does not support the video tag.
            </iframe>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('learning.progress')}</span>
              <span className="font-medium">{Math.round(watchProgress)}%</span>
            </div>
            <Progress value={watchProgress} className="h-2" />
            {!canComplete && (
              <p className="text-xs text-muted-foreground">
                Watch at least 90% of the video to mark as complete
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.close')}
            </Button>
            {canComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Button onClick={handleComplete}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('learning.markComplete')}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

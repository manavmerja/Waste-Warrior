import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download, Award } from 'lucide-react';

export default function CertificateGenerator({ userName, completionDate }) {
  const { t } = useTranslation();

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(1, '#059669');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    ctx.strokeStyle = '#d1fae5';
    ctx.lineWidth = 5;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(t('learning.certificate').toUpperCase(), canvas.width / 2, 150);

    // Subtitle
    ctx.font = '30px Arial';
    ctx.fillText(t('learning.certifiedWarrior'), canvas.width / 2, 210);

    // Decorative line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 300, 240);
    ctx.lineTo(canvas.width / 2 + 300, 240);
    ctx.stroke();

    // Body text
    ctx.fillStyle = '#fff';
    ctx.font = '28px Arial';
    ctx.fillText('This certifies that', canvas.width / 2, 320);

    // Name
    ctx.font = 'bold 50px Arial';
    ctx.fillText(userName || 'Waste Warrior', canvas.width / 2, 400);

    // Completion text
    ctx.font = '28px Arial';
    ctx.fillText('has successfully completed all required', canvas.width / 2, 470);
    ctx.fillText('waste management training modules', canvas.width / 2, 510);

    // Date
    ctx.font = '24px Arial';
    const date = new Date(completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    ctx.fillText(t('learning.completionDate') + ': ' + date, canvas.width / 2, 600);

    // Award icon (simplified)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 690, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 50px Arial';
    ctx.fillText('★', canvas.width / 2, 710);

    // Download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waste-warrior-certificate-${userName?.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <Button onClick={handleDownload} className="w-full" variant="secondary">
      <Download className="mr-2 h-4 w-4" />
      {t('learning.downloadCertificate')}
    </Button>
  );
}

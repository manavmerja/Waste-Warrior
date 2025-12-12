import LearningModules from '@/components/features/LearningModules';

export default function LearningPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Hum seedha component call kar rahe hain taaki duplication na ho */}
      <LearningModules />
    </div>
  );
}
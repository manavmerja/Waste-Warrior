import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Languages, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white text-[#006400] hover:bg-gray-100 border border-gray-300"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
          <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>

      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent
            align="end"
            className="w-48 bg-background/95 backdrop-blur-sm border-border/50"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className="flex items-center justify-between cursor-pointer hover:bg-accent/50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{language.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{language.name}</span>
                  </div>
                  {i18n.language === language.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </DropdownMenuItem>
              ))}
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
}
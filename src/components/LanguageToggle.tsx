import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/use-i18n';
const VietnamFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="20" height="20">
    <rect width="900" height="600" fill="#da251d"/>
    <path d="M450 183l83.1 255.9-217.3-158.2h268.4L366.9 438.9z" fill="#ff0"/>
  </svg>
);
export function LanguageToggle({ className = "fixed top-4 right-20 z-50" }: { className?: string }) {
  const { language, setLanguage } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button variant="ghost" size="icon" className={className}>
            {language === 'vi' ? <VietnamFlag /> : <Globe className="size-5" />}
            <span className="sr-only">Toggle language</span>
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage('en')}>
          <Globe className="size-4 mr-2" />
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('vi')}>
          <VietnamFlag />
          <span className="ml-2">Tiếng Việt</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
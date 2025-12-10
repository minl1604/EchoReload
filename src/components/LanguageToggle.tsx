import React from 'react';


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
export function LanguageToggle({ className = "absolute top-4 right-20 z-50" }: { className?: string }) {
  const { language, setLanguage } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Toggle language"
          className={`${className} h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-all focus-visible:outline-none`}
        >
          {language === 'vi' ? <VietnamFlag /> : <Globe className="size-5" />}
          <span className="sr-only">Toggle language</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50">
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
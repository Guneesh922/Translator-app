"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import { detectLanguage, type DetectLanguageInput } from '@/ai/flows/detect-language';
import { translateText, type TranslateTextInput } from '@/ai/flows/translate-text';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRightLeft, LanguagesIcon, X, Copy, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const popularLanguages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
];

const allLanguages = [
  ...popularLanguages,
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'ur', label: 'Urdu' },
  { value: 'id', label: 'Indonesian' },
  { value: 'tr', label: 'Turkish' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'pl', label: 'Polish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'fi', label: 'Finnish' },
  { value: 'da', label: 'Danish' },
  { value: 'no', label: 'Norwegian' },
  { value: 'el', label: 'Greek' },
  { value: 'he', label: 'Hebrew' },
  { value: 'cs', label: 'Czech' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'ro', label: 'Romanian' },
  { value: 'th', label: 'Thai' },
].filter((lang, index, self) => 
  index === self.findIndex((l) => l.value === lang.value && l.label === lang.label)
).sort((a, b) => a.label.localeCompare(b.label));


export default function Translator() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [detectedLanguageName, setDetectedLanguageName] = useState(''); // Full name from AI e.g. "English"
  const [sourceLanguageForAPI, setSourceLanguageForAPI] = useState(''); // Language name for translateText API
  const [targetLanguageCode, setTargetLanguageCode] = useState('es'); // Code e.g. "es"
  
  const [isDetecting, startDetectTransition] = useTransition();
  const [isTranslating, startTranslateTransition] = useTransition();
  
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      setDetectedLanguageName('');
      setSourceLanguageForAPI('');
      setOutputText('');
      setError(null);
      return;
    }

    const timerId = setTimeout(() => {
      startDetectTransition(async () => {
        setError(null);
        try {
          const detectionInput: DetectLanguageInput = { text: trimmedInput };
          const result = await detectLanguage(detectionInput);
          const detectedName = result.language;
          setDetectedLanguageName(detectedName);
          // The translate API might prefer names or codes. Let's assume names from detection work.
          setSourceLanguageForAPI(detectedName); 
        } catch (e) {
          console.error("Error detecting language:", e);
          setDetectedLanguageName('');
          setSourceLanguageForAPI('');
          // Don't set a global error here, just indicate detection failure subtly or rely on translate error
          toast({
            title: "Language Detection Failed",
            description: "Could not automatically detect the input language.",
            variant: "destructive",
            duration: 3000,
          });
        }
      });
    }, 750); // Debounce for 750ms

    return () => clearTimeout(timerId);
  }, [inputText]);

  const handleTranslate = useCallback(async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || !targetLanguageCode || !sourceLanguageForAPI) {
      let errorMsg = 'Please enter text to translate.';
      if (trimmedInput && !sourceLanguageForAPI) errorMsg = 'Could not determine source language. Try typing more text or check if the language is supported.';
      else if (trimmedInput && !targetLanguageCode) errorMsg = 'Please select a target language.';
      setError(errorMsg);
      toast({ title: "Translation Error", description: errorMsg, variant: "destructive" });
      return;
    }
    startTranslateTransition(async () => {
      setOutputText('');
      setError(null);
      try {
        const targetLangObj = allLanguages.find(l => l.value === targetLanguageCode);
        if (!targetLangObj) {
          throw new Error("Invalid target language selected.");
        }

        const translationInput: TranslateTextInput = {
          text: trimmedInput,
          sourceLanguage: sourceLanguageForAPI, // Name from detection
          targetLanguage: targetLangObj.label, // Full name for target language
        };
        const result = await translateText(translationInput);
        setOutputText(result.translatedText);
      } catch (e) {
        console.error("Error translating text:", e);
        const errorMsg = "Error translating text. The language pair might not be supported or an API error occurred.";
        setError(errorMsg);
        toast({
          title: "Translation Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    });
  }, [inputText, targetLanguageCode, sourceLanguageForAPI, toast]);

  const handleSwapLanguages = () => {
    if (!outputText || !detectedLanguageName || !targetLanguageCode) return;

    const currentOutputText = outputText;
    const currentDetectedLangName = detectedLanguageName;
    
    setInputText(currentOutputText); // This will trigger auto-detection for the new input text

    const oldSourceLangObj = allLanguages.find(lang => lang.label.toLowerCase() === currentDetectedLangName.toLowerCase());
    if (oldSourceLangObj && allLanguages.some(tl => tl.value === oldSourceLangObj.value)) {
      setTargetLanguageCode(oldSourceLangObj.value);
    } else {
      // If we can't map the original source language to a selectable target, keep current target or clear.
      // For simplicity, we'll keep the current target language if the old source isn't directly swappable.
      toast({
        title: "Swap Info",
        description: `Could not automatically set target to "${currentDetectedLangName}". Please select manually if needed.`,
        duration: 4000,
      });
    }
    setOutputText(''); // Clear output, will be re-translated
  };

  const handleClearInput = () => {
    setInputText('');
    // Other states (outputText, detectedLanguageName, etc.) will clear via useEffect on inputText change
  };

  const handleCopyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({ title: "Copied!", description: "Text copied to clipboard." });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast({ title: "Error", description: "Failed to copy text.", variant: "destructive" });
      });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-foreground">Your Text</CardTitle>
              {inputText && (
                <Button variant="ghost" size="icon" onClick={handleClearInput} aria-label="Clear input" className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="h-6 mt-1">
              {isDetecting && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-accent" />
                  <span>Detecting...</span>
                </div>
              )}
              {detectedLanguageName && !isDetecting && (
                <CardDescription className="flex items-center text-sm text-accent font-medium">
                  <LanguagesIcon className="mr-2 h-4 w-4" /> Detected: {detectedLanguageName}
                </CardDescription>
              )}
              {!detectedLanguageName && !isDetecting && inputText.trim() && (
                 <CardDescription className="flex items-center text-sm text-destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" /> Detection failed
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[200px] text-base rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-shadow duration-200 ease-in-out shadow-sm resize-none"
              aria-label="Input text for translation"
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-foreground">Translation</CardTitle>
               <Select value={targetLanguageCode} onValueChange={setTargetLanguageCode}>
                <SelectTrigger className="w-auto md:w-[180px] text-sm focus:ring-2 focus:ring-accent focus:border-accent rounded-md" aria-label="Select target language">
                  <SelectValue placeholder="Target Language" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectGroup>
                    <SelectLabel>Popular</SelectLabel>
                    {popularLanguages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value} className="text-sm">
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>All Languages</SelectLabel>
                    {allLanguages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value} className="text-sm">
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
             <div className="h-6 mt-1">
                {isTranslating && (
                <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-accent" />
                    <span>Translating...</span>
                </div>
                )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Translation appears here..."
              value={outputText}
              readOnly
              className="min-h-[200px] text-base rounded-lg bg-secondary/30 cursor-default shadow-sm resize-none"
              aria-label="Translated text"
            />
          </CardContent>
           {outputText && (
            <CardFooter className="pt-3 pb-4 justify-end">
                <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(outputText)} aria-label="Copy translated text" className="text-muted-foreground hover:text-foreground border-border hover:bg-muted">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
            </CardFooter>
            )}
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
        <Button
          onClick={handleTranslate}
          disabled={isTranslating || isDetecting || !inputText.trim() || !sourceLanguageForAPI || !targetLanguageCode}
          className="w-full sm:w-auto text-base px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-150 ease-in-out hover:shadow-lg active:scale-95 rounded-lg shadow-md"
          aria-label="Translate text"
        >
          {isTranslating ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <LanguagesIcon className="mr-2 h-5 w-5" />
          )}
          Translate
        </Button>
        <Button
          variant="outline"
          onClick={handleSwapLanguages}
          disabled={!outputText || !detectedLanguageName || !targetLanguageCode || isTranslating || isDetecting}
          className="w-full sm:w-auto text-base px-10 py-6 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-150 ease-in-out hover:shadow-lg active:scale-95 rounded-lg shadow-md"
          aria-label="Swap languages"
        >
          <ArrowRightLeft className="mr-2 h-5 w-5" />
          Swap
        </Button>
      </div>

      {error && (
        <div className="text-center text-destructive p-3 bg-destructive/10 rounded-md shadow-sm mt-4 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 mr-2"/> {error}
        </div>
      )}
    </div>
  );
}

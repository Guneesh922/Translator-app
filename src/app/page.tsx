import Translator from '@/components/translator';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-5xl font-bold text-foreground tracking-tight">
            Lingua-Link
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
            Break down language barriers with AI-powered translation. Instantly detect and translate text between numerous languages.
          </p>
        </header>
        <Translator />
        <footer className="text-center text-sm text-muted-foreground mt-12">
          <p>&copy; {new Date().getFullYear()} LinguaLink. Powered by GenAI.</p>
        </footer>
      </div>
    </main>
  );
}

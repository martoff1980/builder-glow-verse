export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="container-px max-w-7xl mx-auto py-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Ukrainian Broker Simulator</p>
        <p className="text-sm flex items-center gap-2">
          <span className="text-muted-foreground">Made in Ukraine</span>
          <span className="inline-flex overflow-hidden rounded-sm h-3 w-5 ring-1 ring-border">
            <span className="w-full h-1/2 bg-[hsl(212,100%,36%)]" />
            <span className="w-full h-1/2 bg-[hsl(51,100%,50%)]" />
          </span>
        </p>
      </div>
    </footer>
  );
}

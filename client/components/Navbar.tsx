import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

function FlagUA() {
  return (
    <span className="inline-flex overflow-hidden rounded-sm h-4 w-6 ring-1 ring-border">
      <span className="w-full h-1/2 bg-[hsl(212,100%,36%)]" />
      <span className="w-full h-1/2 bg-[hsl(51,100%,50%)]" />
    </span>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-px max-w-7xl mx-auto flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 font-extrabold text-lg">
          <FlagUA />
          <span className="tracking-tight">Ukrainian Broker</span>
        </NavLink>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/" className={({ isActive }) => `transition-colors hover:text-foreground/80 ${isActive ? "text-foreground" : "text-foreground/60"}`}>Головна</NavLink>
          <NavLink to="/trade" className={({ isActive }) => `transition-colors hover:text-foreground/80 ${isActive ? "text-foreground" : "text-foreground/60"}`}>Торгувати</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <a href="#simulate" className="hidden sm:block">
            <Button size="sm" className="bg-primary hover:bg-primary/90">Почати</Button>
          </a>
        </div>
      </div>
    </header>
  );
}

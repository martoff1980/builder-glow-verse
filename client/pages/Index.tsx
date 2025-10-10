import TradingSimulator from "@/components/TradingSimulator";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <div className="">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(212,100%,36%)]/10 via-transparent to-[hsl(51,100%,50%)]/10 pointer-events-none" />
        <div className="container-px max-w-7xl mx-auto py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <span className="inline-flex overflow-hidden rounded-sm h-3 w-5 ring-1 ring-border">
                <span className="w-full h-1/2 bg-[hsl(212,100%,36%)]" />
                <span className="w-full h-1/2 bg-[hsl(51,100%,50%)]" />
              </span>
              Зроблено в Україні
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              Український симулятор біржового брокера
            </h1>
            <p className="text-lg text-muted-foreground max-w-prose">
              Практикуйтеся у торгівлі акціями, відточуйтe стратегії та керуйте віртуальним портфелем у реальному часі.
              Сучасний дизайн, швидка робота та відчуття професійної торгової платформи.
            </p>
            <div className="flex items-center gap-3">
              <a href="#simulate"><Button size="lg">Почати симуляцію</Button></a>
              <a href="/trade"><Button size="lg" variant="secondary">Режим трейдера</Button></a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 bg-gradient-to-tr from-primary/10 to-accent/10 rounded-3xl blur-2xl" />
            <div className="rounded-2xl border bg-card shadow">
              <TradingSimulator compact autoStart />
            </div>
          </div>
        </div>
      </section>

      <section className="container-px max-w-7xl mx-auto py-12 sm:py-16">
        <TradingSimulator />
      </section>
    </div>
  );
}

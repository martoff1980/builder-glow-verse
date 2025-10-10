import TradingSimulator from "@/components/TradingSimulator";

export default function TradePage() {
  return (
    <div className="py-8 sm:py-12">
      <div className="mb-6 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Режим трейдера</h1>
        <p className="text-muted-foreground mt-2">Повноекранний режим для зосередженої торгівлі та аналізу графіків.</p>
      </div>
      <TradingSimulator />
    </div>
  );
}

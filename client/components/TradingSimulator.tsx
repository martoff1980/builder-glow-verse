import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
  CartesianGrid,
  Brush,
} from "recharts";
import { toast } from "sonner";
import { Game } from "@/game/sim";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CreateRumorResponse } from "@shared/api";

const SUGGESTED_RUMORS = {
  bullish: [
    { text: "Звітність перевищила очікування аналітиків", cred: 0.8 },
    { text: "Оголошено програму викупу акцій (buyback)", cred: 0.75 },
    { text: "Підвищення прогнозу виручки на наступний квартал", cred: 0.7 },
    { text: "Укладено великий експортний контракт", cred: 0.75 },
  ],
  bearish: [
    { text: "Попередження про зниження прибутку (profit warning)", cred: 0.7 },
    { text: "Зрив поставок та перебої в ланцюгах", cred: 0.65 },
    { text: "Регуляторні ризики зростають", cred: 0.6 },
    { text: "Скасовано дивіденди/зменшено виплати", cred: 0.7 },
  ],
  macro: [
    { text: "Зниження облікової ставки стимулює ринок", cred: 0.7 },
    { text: "Інфляція сповільнилася швидше очікувань", cred: 0.65 },
    { text: "Слабкі макродані — ризик рецесії", cred: 0.6 },
    { text: "Зміцнення гривні підтримує експортерів", cred: 0.7 },
  ],
  sector: [
    { text: "Зростання цін на агропродукцію підтримує сектор", cred: 0.7 },
    { text: "Здешевлення енергоносіїв тисне на видобувників", cred: 0.65 },
    { text: "Фінсектор посилює капіталізацію, кредити відновлюються", cred: 0.7 },
    { text: "Техсектор отримує пільги та гранти", cred: 0.75 },
  ],
} as const;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(n);
}

export default function TradingSimulator({ compact = false, autoStart = true }: { compact?: boolean; autoStart?: boolean }) {
  const gameRef = useRef<Game | null>(null);
  if (!gameRef.current) {
    gameRef.current = new Game();
    gameRef.current.startGame();
  }
  const game = gameRef.current;

  const [selected, setSelected] = useState(game.market.tradePairs[0].name);
  const [qty, setQty] = useState(10);
  const [tick, setTick] = useState(0);
  const [auto, setAuto] = useState<boolean>(autoStart);
  const [speed, setSpeed] = useState<"1x" | "2x" | "4x">("1x");
  const timer = useRef<number | null>(null);

  const [openRumor, setOpenRumor] = useState(false);
  const [rumorText, setRumorText] = useState("Позитивні новини");
  const [rumorCred, setRumorCred] = useState(0.7);
  const [rumorTarget, setRumorTarget] = useState<string>("MARKET");

  const [openLocal, setOpenLocal] = useState(false);
  const [localTarget, setLocalTarget] = useState<string>("CURRENT");

  async function createRumorServer() {
    try {
      const body = {
        content: rumorText,
        credibility: rumorCred,
        target: rumorTarget === "MARKET" ? null : rumorTarget,
      };
      const resp = await fetch("/api/rumors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error("Помилка сервера");
      const data = (await resp.json()) as CreateRumorResponse;
      game.createRumor(data.content, data.credibility, (data.target || undefined) as string | undefined);
      setTick((t) => t + 1);
      toast.success(`Чутка створена${data.flagged ? " (позначено)" : ""}`);
    } catch (e: any) {
      toast.error(String(e.message || e));
    }
  }

  const price = useMemo(() => game.market.getCurrentPrice(selected), [game, selected, tick]);

  const holdings = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of game.player.portfolio.entries()) map[p[0]] = p[1];
    return map;
  }, [game, tick]);

  const totalHoldingsValue = useMemo(() => game.player.getPortfolioValue(game.market), [game, tick]);
  const balance = game.player.capital;
  const total = balance + totalHoldingsValue;
  const initial = 10000;
  const pnl = total - initial;

  useEffect(() => {
    const ms = speed === "4x" ? 250 : speed === "2x" ? 500 : 900;
    if (auto) {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = window.setInterval(() => {
        game.nextDay();
        setTick((t) => t + 1);
      }, ms) as unknown as number;
    } else if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [auto, speed]);

  const onBuy = () => {
    try {
      game.player.buy(selected, qty, game.market);
      toast.success(`Куплено ${qty} ${selected} по ${price.toFixed(2)}₴`);
      setTick((t) => t + 1);
    } catch (e: any) {
      toast.error(String(e.message || e));
    }
  };

  const onSell = () => {
    try {
      game.player.sell(selected, qty, game.market);
      toast.success(`Продано ${qty} ${selected} по ${price.toFixed(2)}₴`);
      setTick((t) => t + 1);
    } catch (e: any) {
      toast.error(String(e.message || e));
    }
  };

  const selectedInfo = game.market.tradePairs.find((t) => t.name === selected)!;

  const history = (game.market.history.get(selected) || []).map((p) => ({ t: p.day, price: p.price }));

  return (
    <div id="simulate" className={compact ? "" : "py-4 sm:py-8"}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span>{selectedInfo.name} ({selected})</span>
              <span className="text-primary font-bold">{price.toFixed(2)}₴</span>
            </CardTitle>
            <CardDescription>День {game.timeSystem.currentDay} • Репутація {Math.round(game.player.reputation)} • Розслідування {Math.round(game.legalSystem.investigationLevel)}%{game.player.jailTime>0?` • В'язниця ${game.player.jailTime}д`:''}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="line">
              <TabsList>
                <TabsTrigger value="line">Лінія</TabsTrigger>
                <TabsTrigger value="area">Область</TabsTrigger>
              </TabsList>
              <TabsContent value="line">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="t" hide />
                      <YAxis domain={["auto", "auto"]} width={40} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip cursor={{ stroke: "#94a3b8" }} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                      <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 1.5 }} isAnimationActive animationDuration={400} />
                      <Brush dataKey="t" travellerWidth={8} height={24} stroke="hsl(var(--primary))" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="area">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="t" hide />
                      <YAxis domain={["auto", "auto"]} width={40} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip cursor={{ stroke: "#94a3b8" }} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                      <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} isAnimationActive animationDuration={400} />
                      <Brush dataKey="t" travellerWidth={8} height={24} stroke="hsl(var(--primary))" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Тикер</label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть актив" />
                  </SelectTrigger>
                  <SelectContent>
                    {game.market.tradePairs.map((t) => (
                      <SelectItem key={t.name} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Кількість</label>
                <Input type="number" value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value)))} min={0} />
              </div>
              <div className="flex items-end gap-2">
                <Button className="flex-1" onClick={onBuy} disabled={game.player.jailTime>0}>Купити</Button>
                <Button variant="secondary" className="flex-1" onClick={onSell} disabled={game.player.jailTime>0}>Продати</Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant={auto?"secondary":"default"} onClick={()=>setAuto((v)=>!v)}>{auto?"Пауза":"Авто"}</Button>
              <Button variant="outline" onClick={()=>{game.nextDay(); setTick((t)=>t+1);}}>Наступний день</Button>

              <Collapsible open={openLocal} onOpenChange={setOpenLocal}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost">Створити чутку (локально)</Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-3">
                      <p className="text-sm text-muted-foreground mb-2">Популярні біржові чутки</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(SUGGESTED_RUMORS).map(([group, items]) => (
                          <div key={group} className="border rounded-md p-2">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{group}</p>
                            <div className="flex flex-wrap gap-2">
                              {items.map((it, idx) => (
                                <Button key={idx} size="sm" variant="outline" onClick={()=>{const tgt = localTarget==="MARKET"?undefined:(localTarget==="CURRENT"?selected:localTarget); game.createRumor(it.text, it.cred, tgt as string|undefined); setTick((t)=>t+1);}}>{it.text}</Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Мета</label>
                      <Select value={localTarget} onValueChange={setLocalTarget}>
                        <SelectTrigger><SelectValue placeholder="Ринок" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MARKET">Ринок</SelectItem>
                          <SelectItem value="CURRENT">Поточний ({selected})</SelectItem>
                          {game.market.tradePairs.map((t)=> (
                            <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Натисніть на чутку, щоб застосувати.</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openRumor} onOpenChange={setOpenRumor}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost">Чутка (сервер)</Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm text-muted-foreground">Текст</label>
                      <Input value={rumorText} onChange={(e)=>setRumorText(e.target.value)} placeholder="Новина..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Мета</label>
                      <Select value={rumorTarget} onValueChange={setRumorTarget}>
                        <SelectTrigger><SelectValue placeholder="Ринок" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MARKET">Ринок</SelectItem>
                          {game.market.tradePairs.map((t)=> (
                            <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Достовірність (0..1)</label>
                      <Input type="number" min={0} max={1} step={0.1} value={rumorCred} onChange={(e)=>setRumorCred(Math.max(0, Math.min(1, Number(e.target.value))))} />
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full" onClick={createRumorServer}>Надіслати</Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <div className="ml-auto flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">Швидкість:</span>
                <Button size="sm" variant={speed==="1x"?"default":"outline"} onClick={()=>setSpeed("1x")}>1x</Button>
                <Button size="sm" variant={speed==="2x"?"default":"outline"} onClick={()=>setSpeed("2x")}>2x</Button>
                <Button size="sm" variant={speed==="4x"?"default":"outline"} onClick={()=>setSpeed("4x")}>4x</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Портфель</CardTitle>
            <CardDescription>Баланс та позиції</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Баланс</p>
                <p className="text-xl font-bold">{formatCurrency(balance)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Вартість активів</p>
                <p className="text-xl font-bold">{formatCurrency(totalHoldingsValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Загальна вартість</p>
                <p className="text-xl font-bold">{formatCurrency(total)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">P/L</p>
                <p className={`text-xl font-bold ${pnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(pnl)}</p>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Тикер</th>
                    <th className="px-3 py-2 font-medium">К-сть</th>
                    <th className="px-3 py-2 font-medium">Ціна</th>
                    <th className="px-3 py-2 font-medium">Вартість</th>
                  </tr>
                </thead>
                <tbody>
                  {game.market.tradePairs.map(({ name }) => {
                    const qty = holdings[name] || 0;
                    const p = game.market.getCurrentPrice(name);
                    const value = qty * p;
                    return (
                      <tr key={name} className="border-t">
                        <td className="px-3 py-2 font-medium">{name}</td>
                        <td className="px-3 py-2">{qty}</td>
                        <td className="px-3 py-2">{p.toFixed(2)}</td>
                        <td className="px-3 py-2">{formatCurrency(value)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Останні події</p>
              <ul className="space-y-1 text-sm max-h-40 overflow-auto pr-1">
                {game.log.slice(0, 8).map((l, i) => (
                  <li key={i} className="text-foreground/80">• {l}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

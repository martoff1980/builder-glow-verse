export type HistoryPoint = { day: number; price: number };

export class TradePair {
  name: string;
  basePrice: number;
  volatility: number; // percent daily std dev
  currentPrice: number;
  constructor(name: string, basePrice: number, volatility: number) {
    this.name = name;
    this.basePrice = basePrice;
    this.volatility = volatility;
    this.currentPrice = basePrice;
  }
}

export class Event {
  type: "політичний" | "економічний" | "технологічний" | "галузевий";
  description: string;
  impact: number; // -0.2..+0.2 percent shift per day (fraction)
  duration: number; // days remaining
  credibility: number; // 0..1
  target?: string; // optional symbol
  constructor(
    type: Event["type"],
    description: string,
    impact: number,
    duration: number,
    credibility: number,
    target?: string,
  ) {
    this.type = type;
    this.description = description;
    this.impact = impact;
    this.duration = duration;
    this.credibility = credibility;
    this.target = target;
  }
}

export class EventSystem {
  events: Event[] = [];
  activeEvents: Event[] = [];

  generateEvent(pairs: TradePair[], rng = Math.random) {
    // 35% шанс події щодня
    if (rng() > 0.35) return null;
    const types: Event["type"][] = [
      "економічний",
      "політичний",
      "технологічний",
      "галузевий",
    ];
    const type = types[Math.floor(rng() * types.length)];
    const sign = rng() < 0.5 ? -1 : 1;
    const impact = sign * (0.003 + rng() * 0.027); // ~0.3%..3%
    const duration = 1 + Math.floor(rng() * 5);
    const credibility = 0.5 + rng() * 0.5;
    const targeted = rng() < 0.4;
    const target = targeted
      ? pairs[Math.floor(rng() * pairs.length)].name
      : undefined;
    const description = targeted
      ? `${type} подія впливає на ${target}`
      : `${type} подія впливає на ринок`;
    const ev = new Event(type, description, impact, duration, credibility, target);
    this.activeEvents.push(ev);
    return ev;
  }

  applyEventEffects(pairs: TradePair[]) {
    // Повертає сумарний вплив по символам
    const map: Record<string, number> = {};
    for (const p of pairs) map[p.name] = 0;
    this.activeEvents = this.activeEvents
      .map((e) => ({ ...e, duration: e.duration - 1 }))
      .filter((e) => e.duration >= 0);
    for (const e of this.activeEvents) {
      if (e.target) map[e.target] += e.impact * e.credibility;
      else for (const p of pairs) map[p.name] += e.impact * e.credibility * 0.6;
    }
    return map; // fractional daily shift
  }
}

export class Rumor {
  source: string;
  content: string;
  credibility: number; // 0..1
  duration: number;
  target?: string;
  constructor(source: string, content: string, credibility: number, target?: string) {
    this.source = source;
    this.content = content;
    this.credibility = credibility;
    this.target = target;
    this.duration = 1 + Math.floor(Math.random() * 3);
  }
}

export class RumorSystem {
  activeRumors: Rumor[] = [];
  generateRumor(source: string, content: string, credibility: number, target?: string) {
    const r = new Rumor(source, content, Math.max(0, Math.min(1, credibility)), target);
    this.activeRumors.push(r);
    return r;
  }
  processRumors(pairs: TradePair[]) {
    const impacts: Record<string, number> = {};
    for (const p of pairs) impacts[p.name] = 0;
    this.activeRumors = this.activeRumors
      .map((r) => ({ ...r, duration: r.duration - 1 }))
      .filter((r) => r.duration >= 0 && r.credibility > 0.05);
    for (const r of this.activeRumors) {
      const sign = r.content.toLowerCase().includes("пад") ? -1 : 1; // дуже проста полярність
      if (r.target) impacts[r.target] += sign * 0.01 * r.credibility;
      else for (const p of pairs) impacts[p.name] += sign * 0.006 * r.credibility;
    }
    return impacts;
  }
}

export class LegalSystem {
  investigationLevel = 0; // 0..100
  strikes = 0;
  noteRumor(credibility: number) {
    // більш агресивні чутки підвищують ризик розслідування
    this.investigationLevel = Math.min(100, this.investigationLevel + credibility * 8);
  }
  checkForFraud(player: Trader) {
    // ризик розслідування залежить від інтенсивності дій та репутації
    const risk = (this.investigationLevel / 100) * (60 - player.reputation) / 60;
    return Math.random() < risk * 0.15;
  }
  conductInvestigation(player: Trader) {
    if (this.checkForFraud(player)) {
      this.strikes += 1;
      if (Math.random() < 0.4) {
        player.jailTime = 2 + Math.floor(Math.random() * 5);
      }
      player.reputation = Math.max(0, player.reputation - (10 + Math.floor(Math.random() * 10)));
      this.investigationLevel = Math.max(0, this.investigationLevel - 20);
      return { type: "penalty", message: "Розслідування: штраф/санкції. Репутацію знижено." } as const;
    }
    // природне зменшення рівня
    this.investigationLevel = Math.max(0, this.investigationLevel - 2);
    return null;
  }
}

export class Market {
  tradePairs: TradePair[] = [];
  history: Map<string, HistoryPoint[]> = new Map();

  constructor() {
    const seed: TradePair[] = [
      new TradePair("KSE50", 100, 2.2),
      new TradePair("UKRBANK", 95, 1.8),
      new TradePair("AGROUA", 90, 2.5),
      new TradePair("ENERGO", 88, 2.0),
    ];
    this.tradePairs = seed;
    for (const p of seed) this.history.set(p.name, [{ day: 0, price: p.basePrice }]);
  }

  getCurrentPrice(symbol: string) {
    const p = this.tradePairs.find((t) => t.name === symbol);
    return p ? p.currentPrice : 0;
  }

  updatePrices(day: number, eventImpacts: Record<string, number>, rumorImpacts: Record<string, number>) {
    for (const pair of this.tradePairs) {
      const prev = pair.currentPrice;
      const vol = pair.volatility / 100; // std deviation
      const shock = normal() * vol; // daily random
      const drift = 0.0005; // ~0.05% стабільне зростання
      const impact = (eventImpacts[pair.name] ?? 0) + (rumorImpacts[pair.name] ?? 0);
      const change = drift + shock + impact;
      const next = Math.max(1, +(prev * (1 + change)).toFixed(2));
      pair.currentPrice = next;
      const arr = this.history.get(pair.name)!;
      arr.push({ day, price: next });
      if (arr.length > 365) arr.splice(0, arr.length - 365);
    }
  }
}

export class Investor {
  name: string;
  investment: number;
  trustLevel: number; // 0..100
  riskTolerance: number; // 0..100
  constructor(name: string, investment: number, trustLevel: number, riskTolerance: number) {
    this.name = name;
    this.investment = investment;
    this.trustLevel = trustLevel;
    this.riskTolerance = riskTolerance;
  }
}

export class InvestorManager {
  investors: Investor[] = [];
  private lastTotal: number | null = null;

  attractInvestors(player: Trader) {
    if (player.reputation > 65 && Math.random() < 0.25) {
      const inv = new Investor(
        `Інвестор #${this.investors.length + 1}`,
        2000 + Math.floor(Math.random() * 6000),
        60 + Math.floor(Math.random() * 30),
        30 + Math.floor(Math.random() * 60),
      );
      this.investors.push(inv);
      player.capital += inv.investment;
      return inv;
    }
    return null;
  }

  calculateReturns(player: Trader, market: Market) {
    const total = player.capital + player.getPortfolioValue(market);
    if (this.lastTotal == null) {
      this.lastTotal = total;
      return { delta: 0 };
    }
    const delta = total - this.lastTotal;
    this.lastTotal = total;
    for (const inv of this.investors) {
      inv.trustLevel = clamp(inv.trustLevel + Math.sign(delta) * Math.min(3, Math.abs(delta) / 2000), 0, 100);
    }
    return { delta };
  }
}

export class Trader {
  capital = 10000;
  portfolio = new Map<string, number>();
  reputation = 50;
  riskLevel = 50;
  jailTime = 0;

  getPortfolioValue(market: Market) {
    let sum = 0;
    for (const [sym, qty] of this.portfolio.entries()) {
      sum += (market.getCurrentPrice(sym) || 0) * qty;
    }
    return +sum.toFixed(2);
  }

  buy(symbol: string, amount: number, market: Market) {
    if (this.jailTime > 0) throw new Error("Торгівля заблокована (в'язниця)");
    if (amount <= 0) throw new Error("Некоректна кількість");
    const price = market.getCurrentPrice(symbol);
    const fee = 0.001; // 0.1%
    const cost = amount * price * (1 + fee);
    if (cost > this.capital) throw new Error("Недостатньо коштів");
    this.capital = +(this.capital - cost).toFixed(2);
    this.portfolio.set(symbol, (this.portfolio.get(symbol) || 0) + amount);
    this.reputation = clamp(this.reputation + 0.2, 0, 100);
    return { price, cost };
  }

  sell(symbol: string, amount: number, market: Market) {
    if (this.jailTime > 0) throw new Error("Торгівля заблокована (в'язниця)");
    if (amount <= 0) throw new Error("Некоректна кількість");
    const held = this.portfolio.get(symbol) || 0;
    if (held < amount) throw new Error("Недостатньо акцій для продажу");
    const price = market.getCurrentPrice(symbol);
    const fee = 0.001;
    const proceeds = amount * price * (1 - fee);
    this.capital = +(this.capital + proceeds).toFixed(2);
    const left = held - amount;
    if (left <= 0) this.portfolio.delete(symbol);
    else this.portfolio.set(symbol, left);
    return { price, proceeds };
  }
}

export class TimeSystem {
  currentDay = 1;
  speed = 1; // days per tick for авто
  advanceDay() {
    this.currentDay += 1;
  }
}

export class Game {
  player = new Trader();
  market = new Market();
  eventSystem = new EventSystem();
  timeSystem = new TimeSystem();
  investorManager = new InvestorManager();
  rumorSystem = new RumorSystem();
  legalSystem = new LegalSystem();
  log: string[] = [];

  startGame() {
    this.log.push("Старт симуляції");
  }

  createRumor(content: string, credibility: number, target?: string) {
    const r = this.rumorSystem.generateRumor("Гравець", content, credibility, target);
    this.legalSystem.noteRumor(credibility);
    this.log.unshift(`Чутка: ${content}${target ? ` щодо ${target}` : ""}`);
    return r;
  }

  nextDay() {
    // розгортання подій/чуток
    const ev = this.eventSystem.generateEvent(this.market.tradePairs);
    if (ev) this.log.unshift(`Подія: ${ev.description} (${(ev.impact * 100).toFixed(1)}% x ${ev.duration}д)`);

    const eventImpacts = this.eventSystem.applyEventEffects(this.market.tradePairs);
    const rumorImpacts = this.rumorSystem.processRumors(this.market.tradePairs);

    // оновлення цін
    this.market.updatePrices(this.timeSystem.currentDay, eventImpacts, rumorImpacts);

    // інвестори
    const ret = this.investorManager.calculateReturns(this.player, this.market);
    if (ret.delta !== 0) this.log.unshift(`Зміна капіталу: ${ret.delta > 0 ? "+" : ""}${ret.delta.toFixed(0)}₴`);
    const newInv = this.investorManager.attractInvestors(this.player);
    if (newInv) this.log.unshift(`Новий інвестор: ${newInv.name} (+${newInv.investment}₴)`);

    // юридична система
    const legal = this.legalSystem.conductInvestigation(this.player);
    if (legal) this.log.unshift(legal.message);

    // час і стани гравця
    if (this.player.jailTime > 0) this.player.jailTime -= 1;
    this.timeSystem.advanceDay();
  }
}

// helpers
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normal() {
  // Box–Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

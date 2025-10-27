import path from "path";
import "dotenv/config";
import * as express from "express";
import express__default from "express";
import cors from "cors";
import { z } from "zod";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const schema = z.object({
  content: z.string().min(3).max(200),
  credibility: z.number().min(0).max(1),
  target: z.string().min(1).max(20).optional().nullable()
});
const banned = ["інсайд", "інсайдер", "маніпуляц", "фрод", "шахрай"];
const handleCreateRumor = (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { content, credibility, target } = parsed.data;
  const lower = content.toLowerCase();
  const flagged = banned.some((w) => lower.includes(w));
  const lengthPenalty = Math.max(0, 1 - content.trim().length / 100) * 0.15;
  const credibilityAdj = Math.max(0, Math.min(1, +(credibility - lengthPenalty).toFixed(2)));
  const resp = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: content.trim(),
    credibility: credibilityAdj,
    target: target ?? null,
    flagged,
    notes: flagged ? "Може містити чутливу інформацію — дотримуйтесь закону." : void 0
  };
  res.json(resp);
};
function createServer() {
  const app2 = express__default();
  app2.use(cors());
  app2.use(express__default.json());
  app2.use(express__default.urlencoded({ extended: true }));
  app2.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app2.get("/api/demo", handleDemo);
  app2.post("/api/rumors", handleCreateRumor);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("/*", (req, res) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map

import { RequestHandler } from "express";
import { z } from "zod";
import { CreateRumorRequest, CreateRumorResponse } from "@shared/api";

const schema = z.object({
  content: z.string().min(3).max(200),
  credibility: z.number().min(0).max(1),
  target: z.string().min(1).max(20).optional().nullable(),
});

const banned = ["інсайд", "інсайдер", "маніпуляц", "фрод", "шахрай"];

export const handleCreateRumor: RequestHandler = (req, res) => {
  const parsed = schema.safeParse(req.body as CreateRumorRequest);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { content, credibility, target } = parsed.data;

  const lower = content.toLowerCase();
  const flagged = banned.some((w) => lower.includes(w));

  // Simple server-side adjustment: very short rumors reduce credibility
  const lengthPenalty = Math.max(0, 1 - content.trim().length / 100) * 0.15;
  const credibilityAdj = Math.max(0, Math.min(1, +(credibility - lengthPenalty).toFixed(2)));

  const resp: CreateRumorResponse = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: content.trim(),
    credibility: credibilityAdj,
    target: target ?? null,
    flagged,
    notes: flagged ? "Може містити чутливу інформацію — дотримуйтесь закону." : undefined,
  };

  res.json(resp);
};

/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

export interface DemoResponse {
  message: string;
}

export interface CreateRumorRequest {
  content: string;
  credibility: number; // 0..1
  target?: string | null; // symbol or null for market
}

export interface CreateRumorResponse {
  id: string;
  content: string;
  credibility: number; // 0..1
  target?: string | null;
  flagged: boolean; // requires attention (e.g., insider-like)
  notes?: string;
}

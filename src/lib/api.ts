import { ChatMessage, SummaryExtraction } from '../types';

export interface ReflectPayload {
  title?: string;
  content: string;
  mood?: string;
  messages?: ChatMessage[];
  prompt?: string;
}

export async function requestReflection(payload: ReflectPayload): Promise<{ reply: string; modelUsed: string; timestamp?: string }> {
  const res = await fetch('/api/gemini/reflect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${res.status}`);
  }

  return res.json();
}

export async function requestSummary(payload: {
  title?: string;
  content: string;
  conversation?: ChatMessage[];
}): Promise<{ data: SummaryExtraction; modelUsed: string }> {
  const res = await fetch('/api/gemini/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${res.status}`);
  }

  return res.json();
}

export async function fetchWritingSparks(category: string, recentMood?: string): Promise<string[]> {
  const res = await fetch('/api/gemini/sparks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, recentMood }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch writing sparks');
  }

  const data = await res.json();
  return data.prompts || [];
}

export async function checkServerHealth(): Promise<{ status: string; geminiConfigured: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { status: 'error', geminiConfigured: false };
    return res.json();
  } catch {
    return { status: 'offline', geminiConfigured: false };
  }
}

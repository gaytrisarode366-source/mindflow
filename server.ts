import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// 1. Top-Level Request Deserialization & Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. Resilient Gemini Client & Fallback Ladder
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables. AI calls will fail until configured.');
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}

async function generateContentWithFallback(
  contents: any,
  options: FallbackOptions = {}
): Promise<{ text: string; modelUsed: string }> {
  const ai = getAiClient();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required to generate AI reflections. Please add it to your environment secrets.');
  }

  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const config: any = {
        temperature: options.temperature ?? 0.7,
      };

      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${model} failed:`, err?.message || err);
      lastError = err;
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(`All Gemini models failed in fallback ladder. Last error: ${lastError?.message || 'Unknown error'}`);
}

// 3. API Routes

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Multi-turn Reflection Assistant Endpoint
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const entryTitle = typeof body.title === 'string' ? body.title : 'Untitled Reflection';
    const entryContent = typeof body.content === 'string' ? body.content : '';
    const mood = typeof body.mood === 'string' ? body.mood : '';
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!entryContent && !prompt && messages.length === 0) {
      res.status(400).json({ error: 'Journal content or prompt is required.' });
      return;
    }

    const systemInstruction = `You are MindFlow AI, a compassionate, insightful, and empathetic journaling and reflection mentor.
Your role is to help the user unpack their thoughts, explore deeper emotional nuances, uncover blind spots, and foster personal growth.
Guidelines:
1. Be warm, non-judgmental, grounded, and concise (keep responses between 2-4 short, structured paragraphs unless asked for more).
2. Offer 1-2 thoughtful inquiry questions to spark deeper self-discovery.
3. If the user expresses distress, offer validation and grounding perspectives.
4. Highlight constructive takeaways and cognitive reframings.
5. Format key thoughts cleanly with Markdown (bullet points, bold highlights) for effortless scanning.`;

    // Construct conversation payload
    const formattedContents: any[] = [];

    // Context preamble
    let contextPreamble = `[Journal Context]\nTitle: "${entryTitle}"\n${mood ? `Mood Tag: ${mood}\n` : ''}Entry:\n"""\n${entryContent}\n"""\n`;
    formattedContents.push({ role: 'user', parts: [{ text: contextPreamble }] });
    formattedContents.push({
      role: 'model',
      parts: [{ text: "I have read your reflection. I am here to help you explore your thoughts, gain clarity, or brainstorm action steps. How can I assist you with this entry?" }]
    });

    // Add prior conversation turns if any
    for (const msg of messages) {
      const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';
      const text = typeof msg.text === 'string' ? msg.text : (typeof msg.content === 'string' ? msg.content : '');
      if (text) {
        formattedContents.push({ role, parts: [{ text }] });
      }
    }

    // Add latest prompt if provided separately
    if (prompt) {
      formattedContents.push({ role: 'user', parts: [{ text: prompt }] });
    }

    const result = await generateContentWithFallback(formattedContents, {
      systemInstruction,
      temperature: 0.7,
    });

    res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate reflection from Gemini.',
    });
  }
});

// Comprehensive Journal Entry Summarizer & Insights Extractor
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const title = typeof body.title === 'string' ? body.title : 'Reflection';
    const content = typeof body.content === 'string' ? body.content : '';
    const conversation = Array.isArray(body.conversation) ? body.conversation : [];

    if (!content && conversation.length === 0) {
      res.status(400).json({ error: 'Entry content or conversation history is required for summarization.' });
      return;
    }

    let fullText = `Title: ${title}\nContent:\n${content}\n`;
    if (conversation.length > 0) {
      fullText += `\nSubsequent Reflections / Discussion:\n`;
      for (const msg of conversation) {
        const role = msg.role === 'model' || msg.role === 'assistant' ? 'AI' : 'User';
        const text = typeof msg.text === 'string' ? msg.text : (typeof msg.content === 'string' ? msg.content : '');
        fullText += `${role}: ${text}\n`;
      }
    }

    const systemInstruction = `You are an expert cognitive synthesizer and mental wellness coach. 
Analyze the provided journal entry and dialogue, and return a JSON object with this exact structure:
{
  "summary": "A 2-3 sentence clear, objective summary of the user's reflection and state of mind.",
  "keyTakeaways": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "actionItems": ["Actionable step 1", "Actionable step 2"],
  "detectedMood": "e.g. Grateful, Calibrated, Reflective, Anxious, Inspired, or Fatigued",
  "suggestedTags": ["Tag1", "Tag2", "Tag3"],
  "suggestedHabit": "A specific, small micro-habit directly inspired by this reflection to practice tomorrow."
}`;

    const result = await generateContentWithFallback(
      [{ role: 'user', parts: [{ text: fullText }] }],
      {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    );

    let parsedData: any;
    try {
      parsedData = JSON.parse(result.text);
    } catch {
      parsedData = {
        summary: result.text,
        keyTakeaways: [],
        actionItems: [],
        detectedMood: 'Reflective',
        suggestedTags: ['Journal'],
        suggestedHabit: 'Take 5 minutes of mindful reflection tomorrow.',
      };
    }

    res.json({
      data: parsedData,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    res.status(500).json({
      error: error.message || 'Failed to summarize journal entry.',
    });
  }
});

// Daily Writing Prompts & Introspective Sparks
app.post('/api/gemini/sparks', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const category = typeof body.category === 'string' ? body.category : 'General Reflection';
    const recentMood = typeof body.recentMood === 'string' ? body.recentMood : '';

    const systemInstruction = `You are a creative introspective prompt generator. Generate 3 unique, thought-provoking journaling prompts for the category "${category}" ${recentMood ? `considering the user recently felt ${recentMood}` : ''}.
Return a clean JSON array of strings:
["Prompt 1", "Prompt 2", "Prompt 3"]`;

    const result = await generateContentWithFallback(
      [{ role: 'user', parts: [{ text: `Generate 3 prompts for category: ${category}` }] }],
      {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.8,
      }
    );

    let prompts: string[] = [];
    try {
      prompts = JSON.parse(result.text);
      if (!Array.isArray(prompts)) prompts = [result.text];
    } catch {
      prompts = [
        "What is something you learned about yourself this week that surprised you?",
        "Where in your life do you need to grant yourself more patience right now?",
        "What is one boundary you can set today to protect your energy and peace?"
      ];
    }

    res.json({ prompts, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/sparks:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate prompts.',
    });
  }
});

// 4. Vite Dev Middleware & Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MindFlow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

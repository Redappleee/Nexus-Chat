import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;
  return new GoogleGenAI({ apiKey });
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;
  return new OpenAI({ apiKey });
}

async function generateWithGemini(prompt: string): Promise<string> {
  const gemini = getGeminiClient();
  if (!gemini) throw new Error('GEMINI_API_KEY is not set');

  const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const res = await gemini.models.generateContent({
        model,
        contents: prompt,
      });
      if (res.text) return res.text.trim();
    } catch (err: unknown) {
      lastError = err;
      const msg = (err as { message?: string })?.message || String(err);
      if (msg.includes('404') || msg.includes('not found') || msg.includes('no longer available')) {
        continue; // try next model
      }
      throw err;
    }
  }

  throw lastError || new Error('Failed to generate with available Gemini models');
}

export class AIService {
  static async smartReplies(context: string[]): Promise<string[]> {
    try {
      const gemini = getGeminiClient();
      if (gemini) {
        const prompt = `Generate exactly 3 short casual chat reply suggestions based on this conversation:\n${context.slice(-5).join('\n')}\n\nReturn ONLY a valid JSON array of strings, e.g. ["Sure!", "Sounds good!", "See you soon!"]`;

        const text = await generateWithGemini(prompt);
        try {
          const match = text.match(/\[[\s\S]*\]/);
          if (match) return JSON.parse(match[0]);
          return JSON.parse(text);
        } catch {
          return text
            .split('\n')
            .map((s) => s.replace(/^[-*0-9.]\s*/, '').trim())
            .filter(Boolean)
            .slice(0, 3);
        }
      }

      const openai = getOpenAIClient();
      if (openai) {
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Generate exactly 3 short casual reply suggestions. Return ONLY a JSON array.',
            },
            {
              role: 'user',
              content: context.slice(-5).join('\n'),
            },
          ],
        });

        const text = res.choices[0]?.message?.content ?? '[]';
        return JSON.parse(text.replace(/```json|```/g, '').trim());
      }

      return ['Sounds good! 👍', 'On my way!', 'Let me check', 'Thanks!'];
    } catch (e) {
      console.warn('[ai] Smart replies fallback:', e);
      return ['Sounds good! 👍', 'Got it!', 'Talk soon!'];
    }
  }

  static async translate(text: string, targetLang: string): Promise<string> {
    try {
      const gemini = getGeminiClient();
      if (gemini) {
        const prompt = `Translate the following text to ${targetLang}. Return ONLY the direct translation without extra commentary:\n\n${text}`;
        return await generateWithGemini(prompt);
      }

      const openai = getOpenAIClient();
      if (openai) {
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Translate to ${targetLang}. Return ONLY the translation.`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
        });

        return res.choices[0]?.message?.content ?? text;
      }

      return `[${targetLang}] ${text}`;
    } catch {
      return text;
    }
  }

  static async chatAssistant(
    message: string,
    history: { role: string; content: string }[]
  ): Promise<string> {
    try {
      const gemini = getGeminiClient();
      if (gemini) {
        const historyText = history
          .slice(-8)
          .map((h) => `${h.role === 'assistant' ? 'AI' : 'User'}: ${h.content}`)
          .join('\n');

        const prompt = `You are Nexus AI, a smart, friendly, and helpful AI assistant embedded directly inside Nexus Chat.\n\nConversation Context:\n${historyText}\n\nUser Question:\n${message}\n\nProvide a clear, helpful, and concise answer.`;

        return await generateWithGemini(prompt);
      }

      const openai = getOpenAIClient();
      if (openai) {
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are Nexus AI, a helpful, concise assistant inside Nexus Chat.',
            },
            ...history.slice(-8).map((h) => ({
              role: h.role as 'user' | 'assistant',
              content: h.content,
            })),
            { role: 'user', content: message },
          ],
        });

        return res.choices[0]?.message?.content ?? '';
      }

      return `💡 Nexus AI requires a Gemini or OpenAI API key.\n\nTo enable live AI answers, generate a free API key at https://aistudio.google.com/apikey and add \`GEMINI_API_KEY=your_key\` to your Render environment variables or apps/server/.env!`;
    } catch (error) {
      console.error('[ai] Assistant error:', error);
      return 'Sorry, I ran into an error connecting to the AI provider. Please verify your GEMINI_API_KEY.';
    }
  }
}
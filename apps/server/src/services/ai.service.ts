import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;
  return new GoogleGenAI({ apiKey });
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;
  return new OpenAI({ apiKey });
}

export class AIService {
  static async smartReplies(context: string[]): Promise<string[]> {
    try {
      const gemini = getGeminiClient();
      if (gemini) {
        const prompt = `Generate exactly 3 short casual chat reply suggestions based on this conversation:\n${context.slice(-5).join('\n')}\n\nReturn ONLY a valid JSON array of strings, e.g. ["Sure!", "Sounds good!", "See you soon!"]`;

        const res = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = (res.text ?? '').trim();
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
        const res = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Translate the following text to ${targetLang}. Return ONLY the direct translation without extra commentary:\n\n${text}`,
        });

        return res.text?.trim() || text;
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

        const res = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        return res.text?.trim() || 'No response generated.';
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
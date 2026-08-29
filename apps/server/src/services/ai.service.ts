import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

const openai =
  env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      })
    : null;

const gemini =
  env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: env.GEMINI_API_KEY,
      })
    : null;

export class AIService {
  static async smartReplies(context: string[]): Promise<string[]> {
    try {
      if (env.AI_PROVIDER === 'gemini') {
        if (!gemini) {
          return ['Sounds good!', 'On my way', 'Let me check', 'Thanks!'];
        }

        const prompt = `
Generate exactly 3 short casual chat reply suggestions.

Conversation:
${context.slice(-5).join('\n')}

Return ONLY a JSON array.
Example:
["Sure!", "Sounds good!", "See you soon!"]
`;

        const res = await gemini.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        const text = (res.text ?? '').trim();

        try {
          return JSON.parse(text);
        } catch {
          return text
            .split('\n')
            .map((s) => s.replace(/^[-*]\s*/, '').trim())
            .filter(Boolean)
            .slice(0, 3);
        }
      }

      if (!openai) {
        return ['Sounds good!', 'On my way', 'Let me check', 'Thanks!'];
      }

      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Generate exactly 3 short casual reply suggestions. Return ONLY a JSON array.',
          },
          {
            role: 'user',
            content: context.slice(-5).join('\n'),
          },
        ],
      });

      const text = res.choices[0]?.message?.content ?? '[]';

      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return ['Got it', 'Sure!', 'Okay'];
    }
  }

  static async translate(
    text: string,
    targetLang: string
  ): Promise<string> {
    try {
      if (env.AI_PROVIDER === 'gemini') {
        if (!gemini) return `[${targetLang}] ${text}`;

        const res = await gemini.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Translate the following text to ${targetLang}. Return ONLY the translated text.\n\n${text}`,
        });

        return res.text?.trim() || text;
      }

      if (!openai) {
        return `[${targetLang}] ${text}`;
      }

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
    } catch {
      return text;
    }
  }

  static async chatAssistant(
    message: string,
    history: { role: string; content: string }[]
  ): Promise<string> {
    try {
      if (env.AI_PROVIDER === 'gemini') {
        if (!gemini) {
          return 'Gemini is not configured.';
        }

        const prompt = `
You are Nexus AI, a helpful assistant inside a messaging application.

Be:
- Friendly
- Concise
- Helpful
- Accurate

Conversation History:

${history
  .slice(-10)
  .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
  .join('\n')}

USER:
${message}
`;

        const res = await gemini.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        return res.text?.trim() || '';
      }

      if (!openai) {
        return 'OpenAI is not configured.';
      }

      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are Nexus AI, a helpful assistant inside a messaging app. Be concise and friendly.',
          },
          ...history.slice(-10).map((h) => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          })),
          {
            role: 'user',
            content: message,
          },
        ],
      });

      return res.choices[0]?.message?.content ?? '';
    } catch (error) {
      console.error('AI Service Error:', error);
      return 'Sorry, I am unable to respond right now.';
    }
  }
}
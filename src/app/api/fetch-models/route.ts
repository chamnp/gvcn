import { NextRequest, NextResponse } from 'next/server';
import { AIProviderType } from '@/types';

export const runtime = 'nodejs';

const FALLBACK_MODELS_BY_PROVIDER: Record<AIProviderType, string[]> = {
  GEMINI: ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
  OPENAI: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-mini'],
  ANTHROPIC: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  CUSTOM_OPENAI: ['mimo-v1', 'mimo-pro', 'milm-7b', 'deepseek-chat', 'deepseek-coder', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-haiku', 'qwen/qwen3.8-flash'],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider = 'GEMINI', apiKey = '', baseUrl = '' } = body as {
      provider?: AIProviderType;
      apiKey?: string;
      baseUrl?: string;
    };

    const cleanKey = apiKey.trim() || (provider === 'GEMINI' ? process.env.GEMINI_API_KEY || '' : '');
    const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '');

    // 1. GOOGLE GEMINI
    if (provider === 'GEMINI') {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey || process.env.GEMINI_API_KEY || ''}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models)) {
            const models = data.models
              .map((m: any) => m.name.replace(/^models\//, ''))
              .filter((name: string) => name.includes('gemini') && !name.includes('embedding') && !name.includes('aqa'));
            if (models.length > 0) {
              return NextResponse.json({ success: true, models, source: 'live_api' });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch Gemini live models list, using fallbacks:', e);
      }
      return NextResponse.json({
        success: true,
        models: FALLBACK_MODELS_BY_PROVIDER.GEMINI,
        source: 'preset',
      });
    }

    // 2. OPENAI & CUSTOM OPENAI-COMPATIBLE (Xiaomi MIMO, DeepSeek, OpenRouter, Groq, etc.)
    if (provider === 'OPENAI' || provider === 'CUSTOM_OPENAI') {
      const endpoint = cleanBaseUrl
        ? `${cleanBaseUrl}/models`
        : provider === 'OPENAI'
        ? 'https://api.openai.com/v1/models'
        : 'https://api.openai.com/v1/models';

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (cleanKey) {
          headers['Authorization'] = `Bearer ${cleanKey}`;
        }

        const res = await fetch(endpoint, {
          headers,
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const data = await res.json();
          let rawList = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
          const models = rawList
            .map((m: any) => (typeof m === 'string' ? m : m.id || m.name || ''))
            .filter((id: string) => id && !id.includes('whisper') && !id.includes('tts') && !id.includes('dall-e') && !id.includes('embedding') && !id.includes('bge') && !id.includes('rerank'))
            .sort((a: string, b: string) => a.localeCompare(b));

          if (models.length > 0) {
            return NextResponse.json({ success: true, models, source: 'live_api', total: models.length });
          }
        }
      } catch (e: any) {
        console.warn(`Failed to fetch models from ${endpoint}:`, e?.message || e);
      }

      // Return preset fallbacks
      return NextResponse.json({
        success: true,
        models: FALLBACK_MODELS_BY_PROVIDER[provider],
        source: 'preset',
      });
    }

    // 3. ANTHROPIC CLAUDE
    if (provider === 'ANTHROPIC') {
      try {
        const endpoint = cleanBaseUrl ? `${cleanBaseUrl}/models` : 'https://api.anthropic.com/v1/models';
        const res = await fetch(endpoint, {
          headers: {
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.data)) {
            const models = data.data.map((m: any) => m.id).filter(Boolean);
            if (models.length > 0) {
              return NextResponse.json({ success: true, models, source: 'live_api' });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch Anthropic models live:', e);
      }

      return NextResponse.json({
        success: true,
        models: FALLBACK_MODELS_BY_PROVIDER.ANTHROPIC,
        source: 'preset',
      });
    }

    return NextResponse.json({
      success: true,
      models: FALLBACK_MODELS_BY_PROVIDER.GEMINI,
      source: 'preset',
    });
  } catch (error: any) {
    console.error('API /api/fetch-models error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Lỗi khi tải danh sách mô hình',
      models: FALLBACK_MODELS_BY_PROVIDER.GEMINI,
    });
  }
}

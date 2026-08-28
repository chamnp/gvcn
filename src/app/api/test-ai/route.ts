import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { AIConfig } from '@/types';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    // Auth check if Authorization header is provided
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      const { data: { user } } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { aiConfig } = body as { aiConfig: AIConfig };

    if (!aiConfig) {
      return NextResponse.json({ success: false, error: 'Thiếu cấu hình AI' }, { status: 400 });
    }

    const provider = aiConfig.provider || 'CUSTOM_OPENAI';
    const effectiveKey = (aiConfig.apiKey || (provider === 'GEMINI' ? process.env.GEMINI_API_KEY : '') || '').trim();
    let modelName = (aiConfig.modelName || '').trim();
    const baseUrl = (aiConfig.baseUrl || '').trim().replace(/\/+$/, '');

    // Normalize Xiaomi MIMO model name
    if (baseUrl.includes('xiaomimimo') || provider === 'CUSTOM_OPENAI') {
      if (!modelName || modelName === 'mimo-v1' || modelName === 'mimo') {
        modelName = 'mimo-v2.5';
      }
    }

    if (!effectiveKey) {
      return NextResponse.json({
        success: false,
        error: 'Vui lòng nhập API Key để kiểm tra kết nối!',
      });
    }

    const testPrompt = 'Bạn là AI trợ lý giáo viên tiểu học. Hãy trả lời ngắn gọn: "Kết nối thành công!".';

    // 1. OPENAI / CUSTOM OPENAI-COMPATIBLE (Xiaomi MIMO, DeepSeek, OpenRouter, etc.)
    if (provider === 'OPENAI' || provider === 'CUSTOM_OPENAI') {
      const endpoint = baseUrl
        ? `${baseUrl}/chat/completions`
        : provider === 'OPENAI'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://api.xiaomimimo.com/v1/chat/completions';

      const selectedModel = modelName || (baseUrl.includes('xiaomimimo') ? 'mimo-v2.5' : 'gpt-4o-mini');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 300,
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content?.trim() || json.choices?.[0]?.message?.reasoning_content?.trim() || 'Kết nối thành công!';
        return NextResponse.json({
          success: true,
          provider: baseUrl.includes('xiaomimimo') ? 'Xiaomi MIMO AI' : provider === 'OPENAI' ? 'OpenAI GPT' : 'Custom OpenAI',
          model: selectedModel,
          latencyMs,
          message: text,
        });
      } else {
        const errorText = await res.text();
        return NextResponse.json({
          success: false,
          error: `API trả về mã lỗi ${res.status}: ${errorText.substring(0, 200)}`,
        });
      }
    }

    // 2. GEMINI
    if (provider === 'GEMINI') {
      const selectedModel = modelName || 'gemini-2.5-flash';
      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: testPrompt,
      });

      const text = response.text?.trim();
      const latencyMs = Date.now() - startTime;

      if (text) {
        return NextResponse.json({
          success: true,
          provider: 'Google Gemini',
          model: selectedModel,
          latencyMs,
          message: text,
        });
      }
    }

    // 3. ANTHROPIC CLAUDE
    if (provider === 'ANTHROPIC') {
      const endpoint = baseUrl ? `${baseUrl}/messages` : 'https://api.anthropic.com/v1/messages';
      const selectedModel = modelName || 'claude-3-5-haiku-20241022';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': effectiveKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 200,
          messages: [{ role: 'user', content: testPrompt }],
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const json = await res.json();
        const text = json.content?.[0]?.text?.trim() || 'Kết nối thành công!';
        return NextResponse.json({
          success: true,
          provider: 'Anthropic Claude',
          model: selectedModel,
          latencyMs,
          message: text,
        });
      } else {
        const errorText = await res.text();
        return NextResponse.json({
          success: false,
          error: `Anthropic API trả về mã lỗi ${res.status}: ${errorText.substring(0, 200)}`,
        });
      }
    }

    return NextResponse.json({ success: false, error: 'Không hỗ trợ provider này' }, { status: 400 });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json({
      success: false,
      error: `Lỗi kết nối: ${err?.message || 'Không thể kết nối đến AI provider'}`,
      latencyMs,
    });
  }
}

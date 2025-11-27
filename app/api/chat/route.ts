import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API Key 未設定" }), { status: 500 });
  }

  try {
    // --- 🕵️‍♂️ 偵探模式 (保留原本成功的模型偵測邏輯) ---
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    let selectedModel = 'gemini-1.5-flash';

    if (listResponse.ok) {
      const listData = await listResponse.json();
      const availableModels = listData.models
        .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
        .map((m: any) => m.name.replace('models/', ''));
      
      const foundModel = availableModels.find((m: string) => m.includes('flash'));
      if (foundModel) selectedModel = foundModel;
    }
    // -------------------------------------------

    const body = await req.json();
    const { messages, characters, topic, subTopics, rounds } = body;

    // 1. 組裝參與者名單
    const safeCharacters = Array.isArray(characters) ? characters : [];
    const participantsDesc = safeCharacters
      .map((c: any) => `- ${c.name} (${c.role}): ${c.system_prompt || ''}`)
      .join('\n');

    // 2. 組裝子議題流程 (這是關鍵修改)
    const safeSubTopics = Array.isArray(subTopics) && subTopics.length > 0 
      ? subTopics 
      : [{ content: '一般討論' }]; // 如果沒有子議題，就預設一個

    const subTopicsList = safeSubTopics
      .map((st: any, index: number) => `   議題 ${index + 1}: ${st.content}`)
      .join('\n');

    // 3. 【全新】包含主持人的系統提示詞
    const systemPrompt = `你是一個焦點座談模擬器。
討論主題：${topic}

參與者名單：
${participantsDesc}

【你的任務】：
請模擬一場包含「主持人」與「受訪者」的完整座談會。
你必須一人分飾多角，包含一位專業的【主持人】。

【劇本流程要求】：
請依照以下順序進行模擬 (總共 ${safeSubTopics.length} 個階段)：

${safeSubTopics.map((st: any, i: number) => `
階段 ${i + 1}：
1. [主持人]: 開場介紹子議題「${st.content}」，並邀請大家發言。
2. (受訪者們進行約 ${Math.ceil((rounds || 3) / safeSubTopics.length)} 輪的討論，確保觀點衝突)。
3. [主持人]: 針對剛剛的討論做簡短總結，並為這個子議題收尾。
`).join('\n')}

最後：
[主持人]: 感謝大家參與，做全場總結。

【嚴格格式規則】：
1. 每一句發言都要換行。
2. 格式必須是： [角色名]: 內容
   (例如： [主持人]: 大家好...)
3. 請勿使用 Markdown 的 **加粗** 或標題語法，只要純文字。
4. 主持人的名字請統一使用「主持人」。
`;

    // 4. 執行生成
    const result = streamText({
      model: google(selectedModel),
      system: systemPrompt,
      messages: messages || [], // 這裡其實只會用到 system prompt 來驅動
      temperature: 0.7, //稍微降低溫度，讓主持人控場更精準
    });

    // 5. 回傳純文字流
    return new Response(result.textStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error: any) {
    console.error('🔥 [嚴重錯誤]:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
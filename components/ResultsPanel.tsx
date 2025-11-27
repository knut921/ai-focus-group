import React, { useEffect, useRef } from 'react';
import { Message, Participant } from '@/types';

interface ResultsPanelProps {
  participants: Participant[];
  messages: Message[];
  streamContent: string;
  currentRound: number;
  totalRounds: number;
  isComplete: boolean;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export default function ResultsPanel({
  participants,
  messages,
  streamContent,
  currentRound,
  totalRounds,
  isComplete,
  onExportCSV,
  onExportPDF,
}: ResultsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自動捲動
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamContent]);

  // --- 核心魔法：根據人設生成頭像 URL ---
  const getAvatarUrl = (name: string, participant?: Participant) => {
    // 1. 如果是主持人，使用特定的機器人或專業圖標
    if (name === '主持人') {
      return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Host&backgroundColor=facc15`;
    }

    // 2. 預設值
    let seed = name; // 使用名字當種子，確保同一個人永遠長一樣
    let gender = 'male';
    let glasses = false;
    let age = 30;

    // 3. 如果找得到角色設定，進行特徵提取
    if (participant) {
      seed = participant.id; // 用 ID 更穩定
      
      // 判斷性別
      const tagsString = participant.tags.join(',');
      if (tagsString.includes('女')) gender = 'female';
      
      // 判斷是否可能戴眼鏡 (標籤有「資深」、「專家」、「技術」時機率較高)
      if (tagsString.includes('技術') || tagsString.includes('專家') || tagsString.includes('資深')) {
        glasses = true; // 這裡只是增加機率，DiceBear 會自己處理
      }
      
      // 判斷年齡 (從標籤抓數字)
      const ageMatch = tagsString.match(/(\d+)歲/);
      if (ageMatch) {
        age = parseInt(ageMatch[1]);
      }
    }

    // 4. 組合 DiceBear API 網址
    // 使用 'notionists' 風格 (很適合商務/座談會的素描風格)
    // 也可以換成 'miniavs' (可愛風) 或 'avataaars' (卡通風)
    const style = 'notionists'; 
    
    // 組裝參數
    // probability=... 可以控制特徵出現的機率
    let url = `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
    
    // 強制性別特徵 (Notionists 風格不一定有 gender 參數，但我們可以用 flip 或其他參數微調，
    // 不過最簡單的是直接讓 seed 決定。如果是 avataaars 風格則支援 gender)
    // 這裡我們改用 'micah' 風格，它對性別支援比較好，且畫風乾淨
    
    // --- 方案 B: 使用 Micah 風格 (簡潔扁平風) ---
    // 文檔: https://www.dicebear.com/styles/micah/
    // 為了讓男女區分更明顯，我們可以透過 baseColor 或髮型來區分，但最簡單的是直接依賴 Seed。
    // 為了更精準，我們手動加後綴
    if (gender === 'female') url += `&baseColor=f9c9b6`; // 膚色微調
    
    // 為了讓視覺更豐富，我們混用風格：
    // 如果您喜歡手繪風，請保留 notionists
    return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed + gender}&backgroundColor=transparent`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* 標題列 */}
      <div className="p-4 border-b bg-white shadow-sm flex justify-between items-center flex-shrink-0 z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-800">焦點座談模擬結果</h2>
          <p className="text-sm text-slate-500">
            進度：第 <span className="text-blue-600 font-bold">{currentRound}</span> / {totalRounds} 輪
            {isComplete && <span className="ml-2 text-green-600 font-bold">(已完成)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onExportCSV} disabled={messages.length === 0} className="px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 disabled:opacity-50">
            匯出 CSV
          </button>
          <button onClick={onExportPDF} disabled={messages.length === 0} className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50">
            匯出/列印
          </button>
        </div>
      </div>

      {/* 訊息列表 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {messages.length === 0 && !streamContent && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>請點擊「開始座談」以生成對話</p>
          </div>
        )}

        {messages.map((msg) => {
          // 找出對應的角色資料
          const participant = participants.find(p => 
            p.name === msg.participantCode || p.role === msg.participantCode
          );
          
          const isModerator = msg.participantCode === '主持人';
          
          // 生成頭像 URL
          const avatarUrl = getAvatarUrl(msg.participantCode, participant);

          return (
            <div key={msg.id} className={`flex gap-4 ${isModerator ? 'justify-center' : 'justify-start'}`}>
              
              {/* 頭像區域 */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full border-2 overflow-hidden bg-white shadow-sm
                  ${isModerator ? 'border-yellow-400' : 'border-slate-200'}`}>
                  <img 
                    src={avatarUrl} 
                    alt={msg.participantCode}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 如果不是主持人，顯示編號 */}
                {!isModerator && participant && (
                   <span className="text-[10px] text-slate-400 mt-1">
                     {participants.indexOf(participant) + 1}
                   </span>
                )}
              </div>

              {/* 對話氣泡 */}
              <div className={`flex flex-col max-w-[75%] ${isModerator ? 'items-center' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-slate-800 text-sm">
                    {msg.participantCode}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                  ${isModerator 
                    ? 'bg-amber-50 text-slate-800 border border-amber-200 text-center' 
                    : 'bg-white text-slate-700 border border-slate-100'}
                `}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* 正在生成的動畫 */}
        {streamContent && (
           <div className="flex gap-4 opacity-70">
             <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse" />
             <div className="bg-white p-4 rounded-2xl text-sm text-gray-400 shadow-sm border border-slate-100">
               正在撰寫回應...
             </div>
           </div>
        )}

      </div>
    </div>
  );
}
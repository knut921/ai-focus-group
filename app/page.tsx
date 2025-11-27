'use client';

import { useState, useCallback, useRef } from 'react';
import SettingsPanel from '@/components/SettingsPanel';
import ResultsPanel from '@/components/ResultsPanel';
import { Participant, SubTopic, Message } from '@/types';
import { defaultAgents } from '@/data/defaultAgents';

// 定義圖示元件 (用於手機版切換按鈕)
const Icons = {
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Chat: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  )
};

export default function Home() {
  // --- 狀態管理 ---
  const [characters, setCharacters] = useState<Participant[]>(defaultAgents || []);
  const [topic, setTopic] = useState<string>('');
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [rounds, setRounds] = useState<number>(3);
  
  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  
  // 手機版切換狀態 ('settings' | 'results')
  const [mobileTab, setMobileTab] = useState<'settings' | 'results'>('settings');

  const rawContentRef = useRef<string>('');

  // --- 解析邏輯 ---
  const parseContent = (fullText: string) => {
    const lines = fullText.split('\n').filter((line) => line.trim());
    const newMessages: Message[] = [];
    let round = 1;
    const regex = /^\[([^\]]+)\]:\s*(?:\([^)]+\)\s*)?(.+)$/;

    lines.forEach((line) => {
      const match = line.match(regex);
      if (match) {
        const name = match[1].trim();
        const text = match[2].trim();
        const character = characters.find(c => c.name === name || c.role === name);

        newMessages.push({
          id: `msg-${newMessages.length}`,
          participantId: character ? character.id : 'unknown',
          participantCode: name,
          content: text,
          timestamp: new Date(),
          round: round
        });

        if (newMessages.length % Math.max(1, characters.length) === 0) {
          round++;
        }
      }
    });
    
    if (newMessages.length > 0) {
      setParsedMessages(newMessages);
      setCurrentRound(round);
    }
  };

  // --- 核心：Fetch 請求 ---
  const handleStart = useCallback(async () => {
    if (isLoading) return;
    if (!topic.trim()) { alert('請輸入主題'); return; }

    setIsLoading(true);
    setIsComplete(false);
    setParsedMessages([]);
    rawContentRef.current = '';
    
    // 【手機版優化】開始後自動切換到結果分頁
    setMobileTab('results');

    try {
      console.log("🚀 [前端] 開始發送請求...");
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `模擬焦點座談：${topic}` }],
          characters,
          topic,
          subTopics,
          rounds
        }),
      });

      if (!response.ok) throw new Error('伺服器回應錯誤');
      if (!response.body) throw new Error('沒有回傳資料流');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        rawContentRef.current += chunk;
        parseContent(rawContentRef.current);
      }

      setIsComplete(true);
    } catch (error: any) {
      console.error('API Error:', error);
      alert('發生錯誤：' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [characters, topic, subTopics, rounds, isLoading]);

  // --- 輔助函式 ---
  const handleAddCharacter = () => setCharacters(p => [...p, { id: Date.now().toString(), name: '新角色', role: '路人', tags: [], system_prompt: '' }]);
  const handleRemoveCharacter = (id: string) => setCharacters(p => p.filter(c => c.id !== id));
  const handleUpdateCharacter = (u: Participant) => setCharacters(p => p.map(c => c.id === u.id ? u : c));
  
  const handleExportCSV = () => {
    if (parsedMessages.length === 0) return;
    const csv = "\ufeff" + ['輪次,參與者,內容', ...parsedMessages.map(m => `${m.round},"${m.participantCode}","${m.content.replace(/"/g, '""')}"`)].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `chat-${Date.now()}.csv`;
    link.click();
  };

  const handleExportPDF = useCallback(() => {
    if (parsedMessages.length === 0) {
      alert('目前沒有對話紀錄可供列印');
      return;
    }
    const getAvatarUrl = (name: string, participant?: Participant) => {
      if (name === '主持人') return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Host&backgroundColor=facc15`;
      let seed = name;
      let gender = 'male';
      if (participant) {
        seed = participant.id;
        if (participant.tags.join(',').includes('女')) gender = 'female';
      }
      let url = `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`;
      if (gender === 'female') url += `&baseColor=f9c9b6`;
      return url + '&backgroundColor=transparent';
    };

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const settingsHtml = `
      <div class="settings-box">
        <h2>會議設定摘要</h2>
        <div class="grid-info">
          <div class="info-item"><strong>討論主題：</strong>${topic}</div>
          <div class="info-item"><strong>預計輪數：</strong>${rounds} 輪</div>
          <div class="info-item"><strong>列印時間：</strong>${new Date().toLocaleString('zh-TW')}</div>
        </div>
        <div class="section-title">參與者名單</div>
        <ul class="tag-list">
          ${characters.map(c => `<li><span class="role-badge">${c.role}</span>${c.name} <span class="tags">(${c.tags.join(', ') || '無標籤'})</span></li>`).join('')}
        </ul>
        <div class="section-title">待討論子議題</div>
        <ol class="subtopic-list">
          ${subTopics.length > 0 ? subTopics.map(s => `<li>${s.content}</li>`).join('') : '<li>自由討論</li>'}
        </ol>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>焦點座談逐字稿</title>
          <style>
            @page { size: A4; margin: 1.5cm; }
            body { font-family: "Microsoft JhengHei", sans-serif; color: #333; max-width: 800px; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .settings-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; font-size: 13px; }
            .settings-box h2 { margin-top: 0; border-bottom: 2px solid #333; padding-bottom: 8px; }
            .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            .section-title { font-weight: bold; margin-top: 10px; color: #475569; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;}
            .tag-list, .subtopic-list { margin: 5px 0; padding-left: 20px; }
            .role-badge { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 5px; }
            .tags { color: #64748b; font-size: 12px; }
            .transcript-title { text-align: center; margin-bottom: 20px; font-size: 18px; font-weight: bold; }
            .message-block { margin-bottom: 20px; page-break-inside: avoid; display: flex; gap: 15px; }
            .avatar-box { width: 50px; display: flex; flex-col: column; align-items: center; flex-shrink: 0; }
            .avatar-img { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #e2e8f0; background-color: #fff; object-fit: cover; }
            .host-avatar { border-color: #facc15; }
            .content-box { flex: 1; }
            .speaker-header { font-size: 14px; font-weight: bold; margin-bottom: 4px; color: #1e293b; display: flex; align-items: center; gap: 8px; }
            .round-badge { background: #f1f5f9; color: #64748b; font-size: 10px; padding: 1px 6px; border-radius: 10px; font-weight: normal; }
            .text-content { text-align: justify; white-space: pre-wrap; font-size: 14px; line-height: 1.6; padding: 10px 15px; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 0 12px 12px 12px; }
            .host-bubble { background-color: #fffbeb; border-color: #fde68a; }
          </style>
        </head>
        <body>
          <h1>焦點座談模擬報告</h1>
          ${settingsHtml}
          <div class="transcript-title">--- 對話逐字稿 ---</div>
          <div class="transcript">
            ${parsedMessages.map(msg => {
              const participant = characters.find(c => c.name === msg.participantCode || c.role === msg.participantCode);
              const avatarUrl = getAvatarUrl(msg.participantCode, participant);
              const isModerator = msg.participantCode === '主持人';
              return `
                <div class="message-block">
                  <div class="avatar-box">
                    <img src="${avatarUrl}" class="avatar-img ${isModerator ? 'host-avatar' : ''}" />
                  </div>
                  <div class="content-box">
                    <div class="speaker-header">
                      ${msg.participantCode}
                      <span class="round-badge">第 ${msg.round} 輪</span>
                    </div>
                    <div class="text-content ${isModerator ? 'host-bubble' : ''}">
                      ${msg.content}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => { document.body.removeChild(iframe); }, 5000);
      }, 800);
    }
  }, [parsedMessages, topic, characters, subTopics, rounds]);

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-gray-50 text-slate-900">
      
      {/* 手機版標籤切換按鈕 
         (只在手機上顯示，固定在底部)
      */}
      <div className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white rounded-full shadow-lg p-1 flex gap-1">
        <button 
          onClick={() => setMobileTab('settings')}
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${mobileTab === 'settings' ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
        >
          <Icons.Settings /> 設定
        </button>
        <button 
          onClick={() => setMobileTab('results')}
          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${mobileTab === 'results' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
        >
          <Icons.Chat /> 結果
          {parsedMessages.length > 0 && <span className="w-2 h-2 bg-green-400 rounded-full"></span>}
        </button>
      </div>

      {/* 左側設定區 */}
      <div className={`
        w-full md:w-[30%] md:min-w-[320px] border-r bg-white flex flex-col
        ${mobileTab === 'settings' ? 'flex' : 'hidden md:flex'} 
      `}>
        <SettingsPanel
          participants={characters}
          topic={topic}
          rounds={rounds}
          subTopics={subTopics}
          isRunning={isLoading}
          onAddCharacter={handleAddCharacter}
          onRemoveCharacter={handleRemoveCharacter}
          onUpdateCharacter={handleUpdateCharacter}
          onTopicChange={setTopic}
          onRoundsChange={setRounds}
          onSubTopicsChange={setSubTopics}
          onStart={handleStart}
        />
      </div>

      {/* 右側結果區 */}
      <div className={`
        flex-1 flex flex-col bg-slate-50 relative
        ${mobileTab === 'results' ? 'flex' : 'hidden md:flex'}
      `}>
        <ResultsPanel
          participants={characters}
          messages={parsedMessages}
          streamContent=""
          currentRound={currentRound}
          totalRounds={rounds}
          isComplete={isComplete}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
        {isLoading && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm animate-pulse flex items-center gap-2 z-10">
            <span>AI 正在模擬討論...</span>
          </div>
        )}
      </div>
    </div>
  );
}
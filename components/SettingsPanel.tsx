'use client';

import { Participant, SubTopic } from '@/types';
import ParticipantCard from './ParticipantCard';

interface SettingsPanelProps {
  participants: Participant[];
  topic: string;
  rounds: number;
  subTopics: SubTopic[];
  isRunning: boolean;
  onAddCharacter: () => void;
  onRemoveCharacter: (id: string) => void;
  onUpdateCharacter: (participant: Participant) => void;
  onTopicChange: (topic: string) => void;
  onRoundsChange: (rounds: number) => void;
  onSubTopicsChange: (subTopics: SubTopic[]) => void;
  onStart: () => void;
}

export default function SettingsPanel({
  participants,
  topic,
  rounds,
  subTopics,
  isRunning,
  onAddCharacter,
  onRemoveCharacter,
  onUpdateCharacter,
  onTopicChange,
  onRoundsChange,
  onSubTopicsChange,
  onStart,
}: SettingsPanelProps) {
  const handleAddSubTopic = () => {
    const newTopic: SubTopic = {
      id: Date.now().toString(),
      content: '',
    };
    onSubTopicsChange([...subTopics, newTopic]);
  };

  const handleDeleteSubTopic = (id: string) => {
    onSubTopicsChange(subTopics.filter((topic) => topic.id !== id));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      <div className="p-6 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-800">設定區</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 人物設定區 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">人物設定</h3>
            <button
              onClick={onAddCharacter}
              disabled={isRunning}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + 新增
            </button>
          </div>
          <div className="space-y-3">
            {participants.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>尚無人物設定</p>
                <p className="text-sm mt-2">點擊「新增」按鈕開始</p>
              </div>
            ) : (
              participants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  onUpdate={onUpdateCharacter}
                  onDelete={() => onRemoveCharacter(participant.id)}
                  canDelete={participants.length > 1 && !isRunning}
                />
              ))
            )}
          </div>
        </div>

        {/* 議程設定區 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">議程設定</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                討論主題
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => onTopicChange(e.target.value)}
                placeholder="例如：新產品使用體驗"
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                討論輪數：{rounds}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rounds}
                onChange={(e) => onRoundsChange(parseInt(e.target.value))}
                disabled={isRunning}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((rounds - 1) / 9) * 100}%, #e5e7eb ${((rounds - 1) / 9) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  子議題
                </label>
                <button
                  onClick={handleAddSubTopic}
                  disabled={isRunning}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  + 新增子議題
                </button>
              </div>
              <div className="space-y-2">
                {subTopics.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">尚無子議題，點擊「新增子議題」開始</p>
                ) : (
                  subTopics.map((subTopic) => (
                    <div
                      key={subTopic.id}
                      className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2"
                    >
                      <input
                        type="text"
                        value={subTopic.content}
                        onChange={(e) => {
                          const updated = subTopics.map((st) =>
                            st.id === subTopic.id
                              ? { ...st, content: e.target.value }
                              : st
                          );
                          onSubTopicsChange(updated);
                        }}
                        placeholder="輸入子議題內容"
                        disabled={isRunning}
                        className="flex-1 text-sm border-none outline-none bg-transparent text-gray-700 placeholder-gray-400 disabled:opacity-50"
                      />
                      {!isRunning && (
                        <button
                          onClick={() => handleDeleteSubTopic(subTopic.id)}
                          className="text-red-500 hover:text-red-700 text-xl font-bold leading-none"
                          aria-label="刪除子議題"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 開始座談按鈕 */}
      <div className="p-6 border-t border-gray-200 bg-white">
        <button
          onClick={onStart}
          disabled={isRunning || participants.length === 0 || !topic.trim()}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl relative overflow-hidden"
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              進行中...
            </span>
          ) : (
            '開始座談 (Start Focus Group)'
          )}
        </button>
      </div>
    </div>
  );
}


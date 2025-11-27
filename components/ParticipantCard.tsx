'use client';

import { Participant } from '@/types';
import { useState, useEffect } from 'react';

interface ParticipantCardProps {
  participant: Participant;
  onUpdate: (participant: Participant) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export default function ParticipantCard({
  participant,
  onUpdate,
  onDelete,
  canDelete,
}: ParticipantCardProps) {
  const [tagsInput, setTagsInput] = useState(participant.tags.join(', '));

  useEffect(() => {
    setTagsInput(participant.tags.join(', '));
  }, [participant.tags]);

  const handleTagChange = (value: string) => {
    setTagsInput(value);
    const tags = value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    onUpdate({ ...participant, tags });
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500',
    ];
    const index = parseInt(id) % colors.length;
    return colors[index] || colors[0];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${getAvatarColor(participant.id)} flex items-center justify-center text-white font-semibold`}
          >
            {participant.name ? participant.name.charAt(participant.name.length - 1) : '?'}
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="名稱"
              value={participant.name}
              onChange={(e) =>
                onUpdate({ ...participant, name: e.target.value })
              }
              className="w-full text-sm font-medium border-none outline-none bg-transparent placeholder-gray-400"
            />
          </div>
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 text-xl font-bold leading-none"
            aria-label="刪除人物"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 w-20">角色：</label>
          <input
            type="text"
            placeholder="例如：技術先鋒"
            value={participant.role}
            onChange={(e) =>
              onUpdate({ ...participant, role: e.target.value })
            }
            className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-start gap-2">
          <label className="text-xs text-gray-500 w-20 pt-1">標籤：</label>
          <div className="flex-1">
            <input
              type="text"
              placeholder="例如：理性, 謹慎, 創新"
              value={tagsInput}
              onChange={(e) => handleTagChange(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              用逗號分隔多個標籤
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <label className="text-xs text-gray-500 w-20 pt-1">系統提示：</label>
          <div className="flex-1">
            <textarea
              placeholder="輸入系統提示詞，定義角色的行為和思考方式"
              value={participant.system_prompt}
              onChange={(e) =>
                onUpdate({ ...participant, system_prompt: e.target.value })
              }
              rows={4}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              定義角色的行為模式和思考方式
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


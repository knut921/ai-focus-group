'use client';

import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
  participantColor: string;
}

export default function ChatMessage({ message, participantColor }: ChatMessageProps) {
  return (
    <div className="flex gap-3 mb-4 animate-fade-in">
      <div
        className={`w-10 h-10 rounded-full ${participantColor} flex items-center justify-center text-white font-semibold flex-shrink-0`}
      >
        {message.participantCode ? message.participantCode.charAt(message.participantCode.length - 1) : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-800">
            {message.participantCode}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="text-gray-700 prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-100 p-2 rounded overflow-x-auto mb-2">
                    {children}
                  </pre>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}


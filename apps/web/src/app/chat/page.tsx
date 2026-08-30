'use client';

import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatWindow } from '@/components/chat/chat-window';
import { useChatStore } from '@/store/chat-store';

export default function ChatPage() {
  const activeChatId = useChatStore((s) => s.activeChatId);

  return (
    <div className="fixed inset-0 flex h-full w-full max-w-full min-w-0 overflow-hidden bg-[#07090e]">
      {/* Sidebar Container */}
      <div
        className={`${
          activeChatId ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 shrink-0 h-full flex-col min-h-0 min-w-0 overflow-hidden`}
      >
        <ChatSidebar />
      </div>

      {/* Main Chat Window Container */}
      <div
        className={`${
          !activeChatId ? 'hidden md:flex' : 'flex'
        } flex-1 min-w-0 w-full md:w-auto h-full flex-col min-h-0 overflow-hidden`}
      >
        <ChatWindow />
      </div>
    </div>
  );
}

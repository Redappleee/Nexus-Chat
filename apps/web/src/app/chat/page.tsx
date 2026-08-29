'use client';

import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatWindow } from '@/components/chat/chat-window';
import { useChatStore } from '@/store/chat-store';

export default function ChatPage() {
  const activeChatId = useChatStore((s) => s.activeChatId);

  return (
    <div className="flex h-screen h-[100dvh] w-screen max-w-[100vw] overflow-hidden bg-[#07090e]">
      {/* Sidebar Container */}
      <div
        className={`${
          activeChatId ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 shrink-0 h-full flex-col min-h-0 overflow-hidden`}
      >
        <ChatSidebar />
      </div>

      {/* Main Chat Window Container */}
      <div
        className={`${
          !activeChatId ? 'hidden md:flex' : 'flex'
        } flex-1 min-w-0 h-full flex-col min-h-0 overflow-hidden`}
      >
        <ChatWindow />
      </div>
    </div>
  );
}

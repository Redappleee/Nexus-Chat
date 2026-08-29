'use client';

import Link from 'next/link';
import {
  Zap,
  Video,
  Bot,
  ArrowRight,
  Lock,
  Globe,
  Smile,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#080c16] text-zinc-100 selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-12 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Nexus Logo"
            className="h-9 w-9 rounded-xl object-cover shadow-md shadow-blue-500/20 ring-1 ring-white/10"
          />
          <span className="text-base font-bold tracking-tight text-white">Nexus Chat</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06]">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-5xl px-6 pt-16 text-center pb-24">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#101626] px-3.5 py-1 text-xs font-medium text-zinc-300 mb-8">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Real-time communication & WebRTC calling</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-[1.1]">
          Modern messaging.
          <span className="block mt-2 text-emerald-400">
            Fast, private, and focused.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
          Direct & group chats, peer-to-peer voice and video calls, built-in Gemini AI assistance, translation, and reactions in a clean, high-performance interface.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-3.5">
          <Link href="/register">
            <Button size="lg" className="h-11 px-7 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-sm">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="h-11 px-7 text-xs font-semibold rounded-xl bg-[#141b2c] hover:bg-[#1b243b] text-zinc-200 border border-white/[0.08]">
              Open Chat Console
            </Button>
          </Link>
        </div>

        {/* App Cover Showcase Card */}
        <div className="mt-14 mx-auto max-w-md rounded-3xl p-3 border border-white/[0.1] bg-[#0e1424]/90 shadow-2xl backdrop-blur-2xl">
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] relative group">
            <img
              src="/app-cover.png"
              alt="Nexus Chat Cover"
              className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
          {[
            {
              icon: Zap,
              title: 'Instant Messaging',
              desc: 'Sub-millisecond WebSocket delivery with typing indicators, delivery states, and double-check read receipts.',
            },
            {
              icon: Video,
              title: 'Voice & Video Calls',
              desc: 'Encrypted peer-to-peer WebRTC voice and video streams with microphone and camera controls.',
            },
            {
              icon: Bot,
              title: 'AI Smart Assistant',
              desc: 'Context-aware smart reply suggestions, instant translation, and multi-turn chat powered by Gemini.',
            },
            {
              icon: Lock,
              title: 'Security & 2FA',
              desc: 'End-to-end user privacy controls, TOTP Two-Factor Authentication, and granular visibility rules.',
            },
            {
              icon: Globe,
              title: 'Universal Translation',
              desc: 'Translate incoming messages in foreign languages into English with a single tap.',
            },
            {
              icon: Smile,
              title: 'Rich Reactions',
              desc: 'Emoji reaction bars, quoted replies, file attachments, and image/video previews.',
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.08] bg-[#0d1220] p-6 hover:border-white/[0.14] transition-colors"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#141b2c] border border-white/[0.08] text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">{item.title}</h3>
                <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
        <img src="/logo.png" alt="Nexus" className="h-6 w-6 rounded-lg object-cover opacity-80" />
        <p>© 2026 Nexus Chat. Designed for fast and focused conversations.</p>
      </footer>
    </div>
  );
}

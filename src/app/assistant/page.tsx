'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquareText, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SourcedClaim } from '@/components/trust/SourcedClaim';
import type { SourcedClaimData } from '@/lib/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  claims?: SourcedClaimData[];
  timestamp: Date;
}

export default function AssistantPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history: messages.slice(-4).map(m => ({
            role: m.role,
            content: m.role === 'assistant'
              ? JSON.stringify({ answer: m.content, claims: [] })
              : m.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.answer || 'No specific answer generated.',
        claims: data.claims || [],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get answer:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while trying to answer your question.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const EXAMPLE_QUERIES = [
    'What BIS requirements apply to an electric kettle?',
    'What tests are needed for electrical appliance certification?',
    'What are the marking requirements for household appliances?',
    'Tell me about IS 2062 steel specifications',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{
            background: 'var(--color-primary-50)',
            color: 'var(--color-primary-700)',
          }}
        >
          <Sparkles size={12} />
          Tier 1 — Full Implementation
        </div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t('assistant.title')}
        </h1>
        <p
          className="text-sm max-w-xl mx-auto"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {t('assistant.welcome')}
        </p>
      </div>

      {/* Chat Area */}
      <div
        className="card"
        style={{
          minHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'var(--color-primary-50)',
                  color: 'var(--color-primary-500)',
                }}
              >
                <MessageSquareText size={28} />
              </div>
              <p
                className="text-lg font-medium mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Ask me about BIS Standards
              </p>
              <p
                className="text-sm mb-6"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Try one of these example queries:
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {EXAMPLE_QUERIES.map(query => (
                  <button
                    key={query}
                    onClick={() => setInput(query)}
                    className="btn btn-secondary btn-sm text-left"
                    style={{ whiteSpace: 'normal', textAlign: 'left' }}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : ''
                  }`}
              >
                {msg.role === 'user' ? (
                  <div
                    className="max-w-lg px-4 py-3 rounded-2xl rounded-br-md text-sm"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                      color: 'white',
                    }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div className="space-y-3 max-w-full">
                    <p
                      className="text-sm mb-2"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {msg.content}
                    </p>
                    {msg.claims?.map(claim => (
                      <SourcedClaim
                        key={claim.id}
                        content={claim.content}
                        confidenceLevel={claim.confidenceLevel}
                        sources={claim.sources}
                        reasoning={claim.reasoning}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-2 animate-pulse-soft">
              <Loader2
                size={16}
                className="animate-spin"
                style={{ color: 'var(--color-primary-500)' }}
              />
              <span
                className="text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t('assistant.thinking')}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="p-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('assistant.placeholder')}
                className="input"
                rows={1}
                style={{
                  resize: 'none',
                  paddingRight: '3rem',
                  minHeight: '44px',
                }}
                disabled={isLoading}
                data-testid="assistant-input"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!input.trim() || isLoading}
              data-testid="assistant-send"
              style={{
                opacity: !input.trim() || isLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <span className="hidden sm:inline">{t('assistant.send')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

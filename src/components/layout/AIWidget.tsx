"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Minus, Plus, User, Bot, MoreVertical, Trash2 } from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const QUICK_SUGGESTIONS = [
  "Não consigo acessar meu curso",
  "Meu pagamento não foi confirmado",
  "Como vejo meu progresso?",
  "Falar com humano",
];

export function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [hasPulse, setHasPulse] = useState(true);
  const [ticketCreated, setTicketCreated] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Remove pulse animation after first interaction
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('ai-widget-visited');
    if (hasVisited) {
      setHasPulse(false);
    }
  }, []);

  // Save visited state when opened
  useEffect(() => {
    if (isOpen) {
      sessionStorage.setItem('ai-widget-visited', 'true');
      setHasPulse(false);
    }
  }, [isOpen]);

  // Fetch existing messages when opening
  useEffect(() => {
    if (isOpen && !isMinimized && messages.length === 0 && !threadId) {
      fetchRecentThread();
    }
  }, [isOpen, isMinimized]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRecentThread = async () => {
    try {
      const response = await fetch('/api/ai/threads');
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.threads && data.threads.length > 0) {
        const recentThread = data.threads[0];
        setThreadId(recentThread.id);
        
        // Fetch messages for this thread
        const messagesResponse = await fetch(`/api/ai/threads?threadId=${recentThread.id}`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          if (messagesData.messages && messagesData.messages.length > 0) {
            setMessages(messagesData.messages);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    }
  };

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim(), threadId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.threadId) {
        setThreadId(data.threadId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente ou clique em "Falar com humano" para suporte.',
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, threadId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(message);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === "Falar com humano") {
      handleCreateTicket();
    } else {
      handleSendMessage(suggestion);
    }
  };

  const handleCreateTicket = async () => {
    if (!threadId) {
      // First create a thread by sending a message
      await handleSendMessage("Gostaria de falar com um atendente humano.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, category: 'general' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      const data = await response.json();
      setTicketCreated(true);

      const ticketMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, ticketMessage]);
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    setMessages([]);
    setThreadId(null);
    setTicketCreated(false);
    setShowMenu(false);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const showSuggestions = messages.length === 0;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange text-white shadow-lg transition-all duration-300 hover:bg-brand-orange-hover hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        } ${hasPulse ? 'animate-pulse' : ''}`}
        aria-label="Abrir assistente virtual"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] rounded-2xl bg-white shadow-2xl border border-brand-gray-200 transition-all duration-300 flex flex-col overflow-hidden ${
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        } ${isMinimized ? "h-14" : "h-[500px] max-h-[calc(100vh-2rem)]"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-gray-200 bg-brand-orange flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Assistente Gestalt</h3>
              <p className="text-white/70 text-xs">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label={isMinimized ? "Expandir" : "Minimizar"}
            >
              {isMinimized ? <Plus size={18} /> : <Minus size={18} />}
            </button>
            
            {/* Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                aria-label="Menu"
              >
                <MoreVertical size={18} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-brand-gray-200 py-1 z-50">
                  <button
                    onClick={handleNewConversation}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-brand-gray-700 hover:bg-brand-gray-50 transition-colors"
                  >
                    <Plus size={16} />
                    Nova conversa
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Fechar assistente"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-brand-gray-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange/10 mb-3">
                    <Bot size={24} className="text-brand-orange" />
                  </div>
                  <p className="text-brand-gray-600 text-sm mb-1">
                    Olá! Sou o assistente virtual da Gestalt EDU.
                  </p>
                  <p className="text-brand-gray-500 text-xs">
                    Como posso ajudar você hoje?
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${
                        msg.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 ${
                          msg.role === 'user'
                            ? 'bg-brand-orange text-white'
                            : 'bg-brand-gray-200 text-brand-gray-600'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <User size={14} />
                        ) : (
                          <Bot size={14} />
                        )}
                      </div>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-brand-orange text-white rounded-br-md'
                            : 'bg-white text-brand-gray-800 rounded-bl-md shadow-sm border border-brand-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <span
                          className={`text-[10px] mt-1 block ${
                            msg.role === 'user' ? 'text-white/70' : 'text-brand-gray-400'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-start gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gray-200 text-brand-gray-600 flex-shrink-0">
                        <Bot size={14} />
                      </div>
                      <div className="bg-white rounded-2xl rounded-bl-md shadow-sm border border-brand-gray-200 px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-brand-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-brand-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-brand-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            {showSuggestions && (
              <div className="px-4 py-3 bg-white border-t border-brand-gray-200 flex-shrink-0">
                <p className="text-xs text-brand-gray-500 mb-2">Sugestões rápidas:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={isLoading}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                        suggestion === "Falar com humano"
                          ? 'border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white'
                          : 'border-brand-gray-300 text-brand-gray-600 hover:border-brand-orange hover:text-brand-orange'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-brand-gray-200 p-3 bg-white flex-shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1 rounded-lg border border-brand-gray-300 px-3 py-2 text-sm text-brand-gray-900 placeholder:text-brand-gray-400 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all duration-200 disabled:bg-brand-gray-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange text-white transition-all duration-200 hover:bg-brand-orange-hover disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Enviar mensagem"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { ChatMessage, SummaryExtraction } from '../types';
import { requestReflection, requestSummary } from '../lib/api';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  Cpu, 
  CheckCircle2, 
  ArrowUpRight, 
  Compass, 
  Lightbulb, 
  ListOrdered,
  AlertCircle
} from 'lucide-react';

interface GeminiReflectionPanelProps {
  entryTitle: string;
  entryContent: string;
  entryMood?: string;
  conversation: ChatMessage[];
  onUpdateConversation: (newMessages: ChatMessage[]) => void;
  onApplySummary: (summaryData: SummaryExtraction) => void;
  isOffline: boolean;
}

export const GeminiReflectionPanel: React.FC<GeminiReflectionPanelProps> = ({
  entryTitle,
  entryContent,
  entryMood,
  conversation,
  onUpdateConversation,
  onApplySummary,
  isOffline,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastModelUsed, setLastModelUsed] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputText).trim();
    if (!promptToSend && !entryContent) {
      setErrorMsg('Please write something in your journal entry or ask a question first.');
      return;
    }

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      text: promptToSend || 'Reflect on what I have written in my journal entry above.',
      timestamp: new Date().toISOString(),
    };

    const updatedConversation = [...conversation, userMsg];
    onUpdateConversation(updatedConversation);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await requestReflection({
        title: entryTitle,
        content: entryContent,
        mood: entryMood,
        messages: conversation,
        prompt: promptToSend || undefined,
      });

      setLastModelUsed(response.modelUsed);

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'model',
        text: response.reply,
        timestamp: response.timestamp || new Date().toISOString(),
      };

      onUpdateConversation([...updatedConversation, aiMsg]);
    } catch (err: any) {
      console.error('Reflection request failed:', err);
      setErrorMsg(err.message || 'Unable to connect to Gemini API. Please check network or API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeAndExtract = async () => {
    if (!entryContent && conversation.length === 0) {
      setErrorMsg('Add some journal content or conversation turns before generating a summary.');
      return;
    }

    setIsSummarizing(true);
    setErrorMsg(null);

    try {
      const result = await requestSummary({
        title: entryTitle,
        content: entryContent,
        conversation,
      });

      setLastModelUsed(result.modelUsed);
      onApplySummary(result.data);

      // Add a small confirmation turn in the conversation
      const summaryMsg: ChatMessage = {
        id: `msg_${Date.now()}_summary`,
        role: 'model',
        text: `✨ **Generated Summary & Insights**\n\n*${result.data.summary}*\n\n**Action Items:**\n${result.data.actionItems.map((a) => `- ${a}`).join('\n')}`,
        timestamp: new Date().toISOString(),
      };
      onUpdateConversation([...conversation, summaryMsg]);
    } catch (err: any) {
      console.error('Summarization failed:', err);
      setErrorMsg(err.message || 'Failed to synthesize summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const quickPrompts = [
    { label: 'Deepen Reflection', prompt: 'Ask me 2 thought-provoking questions to help me explore this deeper.' },
    { label: 'Uncover Blind Spots', prompt: 'Are there any cognitive biases or unexamined assumptions in my reflection?' },
    { label: 'Next Action Steps', prompt: 'Help me turn these reflections into 2 concrete, realistic action steps.' },
    { label: 'Cognitive Reframe', prompt: 'Offer an alternative, constructive, and empowering reframing of this situation.' },
  ];

  return (
    <div className="flex flex-col h-full bg-stone-100/70 border border-stone-200/90 rounded-2xl overflow-hidden shadow-xs">
      
      {/* Header */}
      <div className="p-4 bg-white border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Gemini Reflection Mentor</h2>
            <p className="text-[11px] text-stone-700">Multi-turn introspective dialogue</p>
          </div>
        </div>

        {/* Model Attribution Badge */}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md">
            <Cpu className="w-3 h-3 text-stone-600" />
            <span>{lastModelUsed || 'gemini-3.6-flash'}</span>
          </span>
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-medium text-stone-600 shrink-0">Sparks:</span>
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            id={`btn-spark-${idx}`}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={isLoading || isOffline}
            className="text-xs shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-stone-200/80 border border-stone-300/80 text-stone-700 hover:text-stone-900 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Compass className="w-3 h-3 text-stone-600" />
            <span>{item.label}</span>
          </button>
        ))}

        <button
          id="btn-trigger-summary"
          onClick={handleSummarizeAndExtract}
          disabled={isSummarizing || isLoading || isOffline}
          className="text-xs shrink-0 px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300/80 text-amber-900 font-medium transition-colors disabled:opacity-50 flex items-center gap-1 ml-auto"
        >
          {isSummarizing ? (
            <RotateCcw className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 text-amber-600" />
          )}
          <span>Synthesize</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {conversation.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
            <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center mb-3">
              <Lightbulb className="w-6 h-6 text-amber-500" />
            </div>
            <h4 className="text-sm font-semibold text-stone-800 mb-1">Start Your Reflection</h4>
            <p className="text-xs text-stone-700 max-w-xs leading-relaxed">
              Write your journal entry on the left, then click a spark above or ask Gemini for guidance, clarity, and summarization.
            </p>
          </div>
        ) : (
          conversation.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-stone-900 text-stone-50 rounded-br-xs'
                      : 'bg-white text-stone-800 border border-stone-200/90 rounded-bl-xs'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="prose prose-xs max-w-none text-stone-800 prose-headings:font-semibold prose-headings:text-stone-900 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-stone-600 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {/* Loading Indicator Bubble */}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="bg-white border border-stone-200 rounded-2xl p-3.5 rounded-bl-xs shadow-xs flex items-center gap-2 text-xs text-stone-600">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-75" />
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-150" />
              <span className="ml-1 text-stone-500">Gemini is reflecting...</span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to process reflection</p>
              <p className="text-rose-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-gemini-prompt"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isOffline ? 'Offline mode: Gemini requires internet' : 'Ask Gemini a question or seek reflection...'}
            disabled={isLoading || isOffline}
            className="flex-1 px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            id="btn-send-gemini"
            type="submit"
            disabled={isLoading || !inputText.trim() || isOffline}
            className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};

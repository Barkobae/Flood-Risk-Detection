
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Zap, MessageSquare, ShieldCheck, Siren, AlertCircle, Home, LogOut } from 'lucide-react';
import { ChatMessage, FloodDataPoint, PredictionOutput, RiskLevel } from '../types';
import { getAssistantChatResponse } from '../services/geminiService';

interface Props {
  currentData: FloodDataPoint;
  prediction: PredictionOutput;
}

const DecisionAssistant: React.FC<Props> = ({ currentData, prediction }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: prediction.riskLevel === RiskLevel.HIGH 
        ? `⚠️ WARNING: CRITICAL FLOOD RISK DETECTED in ${currentData.locationName}. Elevation is only ${currentData.elevation}m. Rainfall is at ${currentData.rainfall}mm. I am standing by for immediate life-safety guidance. What is your current situation?`
        : `Monitoring ${currentData.locationName}. Risk state: ${prediction.riskLevel}. I can provide preparedness checklists or evacuation planning advice. How can I help?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getAssistantChatResponse(text, { data: currentData, prediction }, messages);
      const assistantMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    { label: 'Immediate Life-Safety Checklist', icon: <AlertCircle className="w-3 h-3" />, color: 'bg-red-600' },
    { label: 'Evacuation Route Planning', icon: <LogOut className="w-3 h-3" />, color: 'bg-slate-700' },
    { label: 'Securing My Home', icon: <Home className="w-3 h-3" />, color: 'bg-slate-700' }
  ];

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden flex flex-col h-[600px] border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className={`px-5 py-4 border-b border-slate-800 flex justify-between items-center ${prediction.riskLevel === RiskLevel.HIGH ? 'bg-red-950/40' : 'bg-slate-800/50'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className={`w-5 h-5 ${prediction.riskLevel === RiskLevel.HIGH ? 'text-red-400' : 'text-blue-400'}`} />
            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse border border-slate-900 ${prediction.riskLevel === RiskLevel.HIGH ? 'bg-red-500' : 'bg-emerald-500'}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">Emergency Support AI</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
              {prediction.riskLevel === RiskLevel.HIGH ? 'Critical Hazard Analysis' : 'Tactical Analysis Active'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <ShieldCheck className="w-4 h-4 text-slate-500" />
           {prediction.riskLevel === RiskLevel.HIGH && <Siren className="w-4 h-4 text-red-500 animate-pulse" />}
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`shrink-0 w-8 h-8 rounded flex items-center justify-center border transition-colors ${msg.role === 'user' ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className={`w-4 h-4 ${prediction.riskLevel === RiskLevel.HIGH ? 'text-red-400' : 'text-blue-400'}`} />}
              </div>
              <div className={`p-3 rounded-lg text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white font-medium' 
                : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 bg-slate-800 border border-slate-700 p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800/30 border-t border-slate-800 space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Quick Protocols</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(action.label)}
                className={`px-3 py-2 ${action.color} hover:brightness-110 text-white text-[10px] font-bold rounded-md border border-white/10 transition-all flex items-center gap-1.5 shadow-sm active:scale-95`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="E.g., 'Water is in my kitchen, what do I do?'"
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-2 text-blue-500 hover:text-blue-400 disabled:opacity-30 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-2 opacity-30">
          <ShieldCheck className="w-3 h-3 text-white" />
          <span className="text-[9px] text-white font-bold uppercase tracking-widest">Life-Safety Override Active</span>
        </div>
      </div>
    </div>
  );
};

export default DecisionAssistant;

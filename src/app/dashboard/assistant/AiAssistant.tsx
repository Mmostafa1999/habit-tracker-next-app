"use client";

import { useGeminiAI } from "@/lib/hooks/useGeminiAI";
import React, { useEffect, useRef, useState } from "react";
import { HiOutlineLightBulb, HiOutlinePaperAirplane } from "react-icons/hi";

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AiAssistant() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi there! I'm your habit assistant. I can help answer questions about your habits, achievements, and provide personalized tips. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the AI hook
  const { generateResponse, isLoading, error } = useGeminiAI();

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      // Show loading state
      setMessages(prev => [
        ...prev,
        {
          text: "...",
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      // Generate AI response
      const response = await generateResponse(inputValue);

      // Replace loading message with actual response
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1),
        {
          text: response,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } catch {
      // Handle error
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1),
        {
          text: "Sorry, I couldn't process your request. Please try again.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Helper function to format messages
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Example suggestion questions for the user
  const suggestions = [
    "What are my current achievements?",
    "How is my streak going?",
    "Suggest tips to improve my consistency",
    "Which habits need attention today?",
  ];

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg h-[500px] max-w-lg w-full mx-auto overflow-hidden">
      <div className="bg-[#E50046] text-white p-4 flex items-center gap-2 shadow">
        <HiOutlineLightBulb className="text-xl" />
        <h2 className="font-medium">AI Habit Assistant</h2>
      </div>

      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${message.isUser
                    ? "bg-[#E50046] text-white rounded-tr-none"
                    : "bg-gray-100 text-gray-800 rounded-tl-none"
                  }`}>
                <p className="text-sm">{message.text}</p>
                <span className="text-xs mt-1 opacity-70 block text-right">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestion chips */}
      {messages.length < 3 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                setInputValue(suggestion);
              }}
              className="whitespace-nowrap text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-gray-700">
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Error message if any */}
      {error && (
        <div className="px-4 py-2 text-xs text-red-500">Error: {error}</div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className=" p-2 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Ask me anything about your habits..."
          className="flex-1 px-3 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-[#E50046] focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className={`rounded-full p-2 ${isLoading || !inputValue.trim()
              ? "bg-gray-200 text-gray-400"
              : "bg-[#E50046] text-white"
            }`}>
          <HiOutlinePaperAirplane className="text-lg transform rotate-90" />
        </button>
      </form>
    </div>
  );
}

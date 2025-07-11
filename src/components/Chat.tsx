import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

interface ApiResponse {
  answer: string;
  chat_id: string;
}

const Chat: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize a new chat when the app first loads
  useEffect(() => {
    if (chats.length === 0) {
      const newChat = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
        createdAt: new Date().toISOString()
      };
      setChats([newChat]);
      setActiveChat(newChat);
    }
  }, []);

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString()
    };
    setChats(prevChats => [...prevChats, newChat]);
    setActiveChat(newChat);
    setInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChat || loading) return;

    setLoading(true);
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    const updatedChat = {
      ...activeChat,
      messages: [...activeChat.messages, userMessage],
      title: activeChat.messages.length === 0 ? input.substring(0, 30) : activeChat.title
    };

    setChats(prevChats => 
      prevChats.map(chat => chat.id === activeChat.id ? updatedChat : chat)
    );
    setActiveChat(updatedChat);
    const currentInput = input;
    setInput('');

    try {
      const response = await axios.post<ApiResponse>('/answer', {
        question: currentInput,
        chat_id: activeChat.id,
        previous_messages: updatedChat.messages
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date().toISOString()
      };

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage]
      };

      setChats(prevChats => 
        prevChats.map(chat => chat.id === activeChat.id ? finalChat : chat)
      );
      setActiveChat(finalChat);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChat(chat);
      setInput('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <button
          onClick={createNewChat}
          className="w-full p-4 text-left hover:bg-gray-100 flex items-center"
        >
          <span className="mr-2">+</span> New Chat
        </button>
        <div className="overflow-y-auto">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => switchChat(chat.id)}              className={`w-full p-4 text-left hover:bg-gray-100 ${
                chat.id === activeChat?.id ? 'bg-gray-100' : ''
              }`}
            >
              {chat.messages[0]?.content.substring(0, 30) || 'New Chat'}...
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeChat && activeChat.messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-center">
              <div className="inline-block p-4 rounded-lg bg-gray-100">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border p-2 mr-2"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;

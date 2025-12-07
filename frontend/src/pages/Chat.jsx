import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { Loader2, MessageCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import ChatBox from './ChatBox';
import { formatDistanceToNow } from 'date-fns';

export default function Chat() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatIdFromUrl = searchParams.get('chatId');
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChats = async (updateSelectedChat = true, preserveSelectedChatId = null) => {
    if (!user) return;
    
    try {
      // Don't show loading if we're just refreshing the list
      if (!chats.length) {
        setLoading(true);
      }
      const response = await api.get('/chats/');
      const chatsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setChats(chatsData);
      
      // Only update selected chat if explicitly requested and chatIdFromUrl exists
      if (updateSelectedChat && chatIdFromUrl) {
        const chatToSelect = chatsData.find(chat => chat.id.toString() === chatIdFromUrl.toString());
        if (chatToSelect) {
          setSelectedChat(chatToSelect);
          // Clear URL parameter after selecting
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('chatId');
          setSearchParams(newSearchParams, { replace: true });
        }
      } else if (preserveSelectedChatId && !updateSelectedChat) {
        // Only update selectedChat if we're preserving a specific chat ID
        // and the ID still exists in the new data
        const preservedChat = chatsData.find(c => c.id === preserveSelectedChatId);
        if (preservedChat) {
          // Use functional update to avoid closure issues
          setSelectedChat(prev => {
            // Only update if ID matches and it's actually different
            if (prev && prev.id === preserveSelectedChatId) {
              return preservedChat;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to load chats';
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setError(`Failed to load chats: ${errorMessage}`);
      toast.error(`Failed to load chats: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when chatIdFromUrl changes
  useEffect(() => {
    if (user) {
      fetchChats(true, null); // Update selected chat if chatIdFromUrl exists
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, chatIdFromUrl]);
  
  // Separate effect for message updates to avoid loops - only refresh chat list, don't change selection
  useEffect(() => {
    if (!user) return;
    
    let timeoutId;
    const handleMessageUpdate = () => {
      // Debounce to avoid too many rapid updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Get current selected chat ID before fetching to preserve it
        const currentSelectedChatId = selectedChat?.id;
        // Only refresh the chat list, preserve selected chat ID but don't force update
        // Passing null as preserveSelectedChatId means we won't update selectedChat at all
        fetchChats(false, currentSelectedChatId);
      }, 300);
    };
    
    window.addEventListener('messageUpdated', handleMessageUpdate);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('messageUpdated', handleMessageUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedChat?.id]); // Include selectedChat.id so we capture it in closure

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Chat List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500">
              <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
              <p>No chats yet</p>
              <p className="text-sm mt-2">Start a conversation with someone!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {chats.map((chat) => {
                const hasUnreadMessages = chat.unread_count > 0;
                const isSelected = selectedChat?.id === chat.id;
                return (
                <div
                  key={chat.id}
                  onClick={() => {
                    // Only update if clicking a different chat
                    if (!isSelected) {
                      setSelectedChat(chat);
                    }
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected
                      ? 'bg-primary/5 border-l-4 border-primary' 
                      : hasUnreadMessages
                      ? 'border-l-4 border-primary/60 bg-primary/5'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {chat.other_user_avatar ? (
                        <img
                          src={chat.other_user_avatar}
                          alt={chat.other_user}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center" style={{ display: chat.other_user_avatar ? 'none' : 'flex' }}>
                        <User className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    
                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {chat.other_user}
                        </h3>
                        {chat.last_message && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {chat.last_message ? (
                        <p className="text-sm text-gray-600 truncate">
                          {chat.last_message.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No messages yet</p>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Box */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <ChatBox chat={selectedChat} currentUser={user} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


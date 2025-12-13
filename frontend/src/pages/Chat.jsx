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
      
      if (!chats.length) {
        setLoading(true);
      }
      const response = await api.get('/chats/');
      const chatsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setChats(chatsData);
      
      
      if (updateSelectedChat && chatIdFromUrl) {
        const chatToSelect = chatsData.find(chat => chat.id.toString() === chatIdFromUrl.toString());
        if (chatToSelect) {
          setSelectedChat(chatToSelect);
          
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('chatId');
          setSearchParams(newSearchParams, { replace: true });
        }
      } else if (preserveSelectedChatId && !updateSelectedChat) {
        const preservedChat = chatsData.find(c => c.id === preserveSelectedChatId);
        if (preservedChat) {
         
          setSelectedChat(prev => {
            
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

  
  useEffect(() => {
    if (user) {
      fetchChats(true, null); 
    }
    
  }, [user, chatIdFromUrl]);
  
  
  useEffect(() => {
    if (!user) return;
    
    let timeoutId;
    const handleMessageUpdate = () => {
      // Debounce to avoid too many rapid updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentSelectedChatId = selectedChat?.id;
        fetchChats(false, currentSelectedChatId);
      }, 300);
    };
    
    window.addEventListener('messageUpdated', handleMessageUpdate);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('messageUpdated', handleMessageUpdate);
    };
  }, [user, selectedChat?.id]); 

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
                      {chat.post_title && (
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {chat.post_type === 'offer' ? 'Offer' : chat.post_type === 'need' ? 'Need' : 'Post'}: {chat.post_title}
                        </p>
                      )}
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
          <>
            {/* Post Title above ChatBox */}
            {selectedChat.post_title && (
              <div className="bg-primary/5 border-b border-gray-200 px-4 py-2">
                <p className="text-sm font-medium text-gray-700">
                  {selectedChat.post_type === 'offer' ? 'Offer' : selectedChat.post_type === 'need' ? 'Need' : 'Post'}: <span className="text-primary">{selectedChat.post_title}</span>
                </p>
              </div>
            )}
            <ChatBox chat={selectedChat} currentUser={user} />
          </>
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


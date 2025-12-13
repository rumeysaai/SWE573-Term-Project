import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2, Send, Check, CheckCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function ChatBox({ chat, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const chatIdRef = useRef(null);
  
  useEffect(() => {
    if (!chat || !currentUser) return;
    
    // Use chat.id instead of chat object to prevent re-fetching when chat object reference changes
    const chatId = chat.id;
    
    // Only fetch if chat ID actually changed
    if (chatIdRef.current === chatId) {
      return; // Don't refetch if it's the same chat
    }
    
    chatIdRef.current = chatId;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/chats/${chatId}/messages/`);
        const messagesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.results || []);
        
        
        setMessages(messagesData);
        
        
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('messageUpdated'));
        });
      } catch (err) {
        console.error('Error fetching messages:', err);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
   
  }, [chat?.id, currentUser?.id]); 


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await api.post(`/chats/${chat.id}/messages/`, {
        content: messageContent,
      });

      // Add new message to list optimistically
      setMessages((prev) => [...prev, response.data]);

      // Dispatch event to update unread count in Header
      window.dispatchEvent(new CustomEvent('messageUpdated'));
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      setNewMessage(messageContent); 
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = () => {
    if (!chat || !currentUser) return null;
    return chat.other_user;
  };

  const getOtherUserAvatar = () => {
    if (!chat || !currentUser) return null;
    return chat.other_user_avatar;
  };

  if (!chat || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {getOtherUserAvatar() ? (
              <img
                src={getOtherUserAvatar()}
                alt={getOtherUser()}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="w-full h-full bg-primary/20 flex items-center justify-center" style={{ display: getOtherUserAvatar() ? 'none' : 'flex' }}>
              <User className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{getOtherUser()}</h3>
            {chat.post_title && (
              <p className="text-sm text-gray-500 mt-1">
                {chat.post_type === 'offer' ? 'Offer' : chat.post_type === 'need' ? 'Need' : 'Post'}: {chat.post_title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMyMessage = message.sender_id === currentUser.id;
            // Check if message was unread before fetch (backend sends was_unread_before_fetch field)
            const isUnread = !isMyMessage && (message.was_unread_before_fetch === true || (!message.is_read && message.was_unread_before_fetch !== false));
            
            return (
              <div
                key={message.id}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex flex-col max-w-xs lg:max-w-md ${isMyMessage ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name (only for messages from other user) */}
                  {!isMyMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${isUnread ? 'text-primary' : 'text-gray-600'}`}>
                        {message.sender_username || getOtherUser()}
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                      )}
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isMyMessage
                        ? 'bg-primary text-primary-foreground'
                        : isUnread
                        ? 'bg-blue-100 border-2 border-primary/30 text-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className={`text-sm whitespace-pre-wrap break-words ${isUnread ? 'font-medium' : ''}`}>
                      {message.content}
                    </p>
                  </div>
                  
                  {/* Timestamp and Read Status */}
                  <div className={`flex items-center gap-1 mt-1 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    
                    {/* Read Status Icons (only for my messages) */}
                    {isMyMessage && (
                      <div className="ml-1">
                        {message.is_read ? (
                          <CheckCheck className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

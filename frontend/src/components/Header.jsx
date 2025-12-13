import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import api from '../api';
import notificationService from '../services/notificationService';
import {
  Bell,
  MessageCircle,
  Clock,
  Leaf,
  Home as HomeIcon,
  PenLine,
  MessageSquare,
  Shield,
  LogOut,
  X,
  Send,
  Loader2,
  Calendar,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showProposals, setShowProposals] = useState(false);
  const [sentProposals, setSentProposals] = useState([]);
  const [receivedProposals, setReceivedProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [visibleSentCount, setVisibleSentCount] = useState(3);
  const [visibleReceivedCount, setVisibleReceivedCount] = useState(3);

  // Debug: Check user admin status
  useEffect(() => {
    if (user) {
      console.log('User object:', user);
      console.log('is_staff:', user.is_staff);
      console.log('is_superuser:', user.is_superuser);
      console.log('isAdmin calculated:', user?.is_staff || user?.is_superuser);
    }
  }, [user]);

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (showProposals) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [showProposals]);

  const isAdmin = user?.is_staff || user?.is_superuser;

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowMenu(false);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setShowMenu(false);
  };

  const fetchProposals = async () => {
    if (!user) return;
    
    try {
      setLoadingProposals(true);
      
      // Fetch sent proposals
      const sentResponse = await api.get('/proposals/', { params: { sent: 'true' } });
      const sentData = Array.isArray(sentResponse.data) ? sentResponse.data : (sentResponse.data?.results || []);
      setSentProposals(sentData);
      
      // Fetch received proposals
      const receivedResponse = await api.get('/proposals/', { params: { received: 'true' } });
      const receivedData = Array.isArray(receivedResponse.data) ? receivedResponse.data : (receivedResponse.data?.results || []);
      setReceivedProposals(receivedData);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleMessageClick = () => {
    // Navigate to ChatBox page
    navigate('/chat');
    setShowMenu(false);
    setShowProposals(false);
    // Refresh unread count when navigating to chat page
    fetchUnreadCount();
  };

  const handleNotificationClick = () => {
    setShowProposals(!showProposals);
    setShowMenu(false);
    if (!showProposals) {
      fetchProposals();
      // Reset visible counts when opening drawer
      setVisibleSentCount(3);
      setVisibleReceivedCount(3);
    }
  };

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }
    
    try {
      const response = await api.get('/chats/unread-count/');
      const count = response.data?.unread_count || 0;
      setUnreadMessageCount(count);
      console.log('Unread message count:', count); // Debug log
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      console.error('Error response:', error.response?.data);
      setUnreadMessageCount(0);
    }
  }, [user]);

  // Fetch unread count on mount
  // Note: Real-time updates are now handled by notificationService in App.jsx
  useEffect(() => {
    if (!user) return;
    
    fetchUnreadCount();
    
    // Subscribe to message updates from notification service
    const unsubscribe = notificationService.onMessageUpdate((unreadCount) => {
      setUnreadMessageCount(unreadCount);
    });
    
    return () => {
      unsubscribe();
    };
  }, [user, fetchUnreadCount]);

  // Fetch proposals on mount and subscribe to updates
  useEffect(() => {
    if (!user) return;
    
    // Fetch proposals on mount
    fetchProposals();
    
    // Subscribe to proposal updates from notification service
    const unsubscribeProposals = notificationService.onProposalUpdate(() => {
      fetchProposals();
    });
    
    // Listen for custom events (for backward compatibility)
    const handleProposalUpdate = () => {
      fetchProposals();
    };
    
    const handleMessageUpdate = () => {
      fetchUnreadCount();
    };
    
    window.addEventListener('proposalUpdated', handleProposalUpdate);
    window.addEventListener('messageUpdated', handleMessageUpdate);
    
    return () => {
      unsubscribeProposals();
      window.removeEventListener('proposalUpdated', handleProposalUpdate);
      window.removeEventListener('messageUpdated', handleMessageUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Check if there are waiting proposals (only received proposals, not sent ones)
  const hasWaitingProposal = useMemo(() => {
    return receivedProposals.some(p => p.status === 'waiting' || p.status === 'pending');
  }, [receivedProposals]);

  // Login/Register sayfalarında header gösterme
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-primary/20 shadow-sm">
      <div className="flex items-center justify-between py-5 px-6 md:px-8 lg:px-12 bg-gradient-to-r from-primary/5 to-orange-500/10">
        {/* Left side - Logo and Title */}
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/home')}
        >
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-md">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-primary font-normal text-lg">The Hive</h3>
            <p className="text-xs text-gray-500 hidden sm:block">
              Community-Oriented Service Offering Platform
            </p>
          </div>
        </div>

        {/* Center - Navigation Links */}
        <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
          <button
            onClick={() => navigate('/home')}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === '/home' ? 'text-primary' : 'text-gray-700'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigate('/forums')}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === '/forums' || location.pathname.startsWith('/forum/') ? 'text-primary' : 'text-gray-700'
            }`}
          >
            Forum
          </button>
          <button
            onClick={() => navigate('/how-to')}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === '/how-to' ? 'text-primary' : 'text-gray-700'
            }`}
          >
            How To
          </button>
          <button
            onClick={() => navigate('/about')}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === '/about' ? 'text-primary' : 'text-gray-700'
            }`}
          >
            About
          </button>
        </div>

        {/* Right side - Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Balance */}
          <div className="flex items-center gap-2 bg-white px-3 md:px-4 py-2 rounded-full shadow-sm border">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium hidden sm:inline">
              Balance: {user?.profile?.time_balance || 0} Hours
            </span>
          </div>

          {/* Notification Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotificationClick}
              className="relative hover:bg-primary/10"
            >
              <Bell className="w-5 h-5 text-primary" />
              {hasWaitingProposal && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </div>

          {/* Message Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMessageClick}
              className="hover:bg-primary/10"
            >
              <MessageCircle className="w-5 h-5 text-primary" />
            </Button>
            {unreadMessageCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full z-10"></span>
            )}
          </div>

          {/* Profile Avatar Button (Menu) */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowMenu(!showMenu);
                setShowProposals(false);
              }}
              className="hover:bg-primary/10 p-0 rounded-full"
            >
              {user?.profile?.avatar ? (
                <img 
                  src={user.profile.avatar} 
                  alt={user.username}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/20 aspect-square"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-primary/20 flex items-center justify-center aspect-square">
                  <span className="text-base font-medium text-gray-600">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </Button>

            {/* Overlay */}
            {showMenu && (
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowMenu(false)}
              />
            )}

            {/* Profile Menu Drawer */}
            {showMenu && (
              <div className="fixed top-0 right-0 h-screen w-80 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
                <div className="p-6 pt-4">
                  {/* User Info */}
                  {user && (
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        onClick={() => {
                          handleMenuClick('/my-profile');
                        }}
                      >
                        {user.profile?.avatar && (
                          <img 
                            src={user.profile.avatar} 
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{user.username}</p>
                          {user.first_name || user.last_name ? (
                            <p className="text-sm text-gray-600">
                              {user.first_name} {user.last_name}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12"
                      onClick={() => handleMenuClick('/home')}
                    >
                      <HomeIcon className="w-5 h-5 mr-3" />
                      Home
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12"
                      onClick={() => handleMenuClick('/post/new')}
                    >
                      <PenLine className="w-5 h-5 mr-3" />
                      Create Post
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12"
                      onClick={() => handleMenuClick('/forums')}
                    >
                      <MessageSquare className="w-5 h-5 mr-3" />
                      Community Forum
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12"
                      onClick={() => handleMenuClick('/approval')}
                    >
                      <CheckCircle className="w-5 h-5 mr-3" />
                      My Approvals
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12"
                      onClick={() => handleMenuClick('/chat')}
                    >
                      <MessageCircle className="w-5 h-5 mr-3" />
                      My Messages
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                        onClick={() => handleMenuClick('/admin-panel')}
                      >
                        <Shield className="w-5 h-5 mr-3" />
                        Admin Panel
                      </Button>
                    )}
                  </div>
                  <div className="border-t border-gray-200 my-6"></div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Proposals Drawer (triggered by notification button) */}
          {showProposals && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowProposals(false)}
              />
              
              {/* Messages Drawer */}
              <div className="fixed top-0 right-0 h-screen w-80 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Proposals</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowProposals(false)}
                      className="hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {loadingProposals ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Sent Proposals */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Send className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-gray-900">Sent Proposals</h3>
                        </div>
                        {sentProposals.length === 0 ? (
                          <Card>
                            <CardContent className="py-8 text-center text-gray-500">
                              <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p>No sent proposals</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            <div className="space-y-3">
                              {sentProposals.slice(0, visibleSentCount).map((proposal) => (
                                <Card 
                                  key={proposal.id} 
                                  className="hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => {
                                    navigate(`/negotiate/${proposal.post_id}`);
                                    setShowProposals(false);
                                  }}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                          {proposal.post_title}
                                        </h4>
                                      </div>
                                      <Badge
                                        variant={
                                          proposal.status === 'completed'
                                            ? 'default'
                                            : proposal.status === 'accepted'
                                            ? 'default'
                                            : proposal.status === 'declined'
                                            ? 'destructive'
                                            : proposal.status === 'cancelled'
                                            ? 'destructive'
                                            : 'secondary'
                                        }
                                        className={
                                          proposal.status === 'completed'
                                            ? 'bg-blue-600 text-white'
                                            : proposal.status === 'accepted'
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : proposal.status === 'cancelled'
                                            ? 'bg-red-600 text-white'
                                            : ''
                                        }
                                      >
                                        {proposal.status === 'completed'
                                          ? 'Completed'
                                          : proposal.status === 'accepted'
                                          ? 'Accepted'
                                          : proposal.status === 'declined'
                                          ? 'Declined'
                                          : proposal.status === 'cancelled'
                                          ? 'Cancelled'
                                          : 'Waiting'}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {proposal.notes?.split('\n').find(line => line.startsWith('Location:'))?.replace('Location:', '').trim() || 'N/A'}
                                        </span>
                                        {proposal.proposed_date && (
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(proposal.proposed_date).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                      {proposal.notes && proposal.notes.includes('[Response from') && (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                          <p className="font-medium text-blue-900 mb-1">Response:</p>
                                          <p className="text-blue-800">
                                            {proposal.notes.split('\n').find(line => line.includes('[Response from'))?.replace(/\[Response from .+?\]:\s*/, '') || ''}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                            {sentProposals.length > visibleSentCount && (
                              <Button
                                variant="outline"
                                className="w-full mt-3"
                                onClick={() => setVisibleSentCount(prev => prev + 3)}
                              >
                                Show More ({sentProposals.length - visibleSentCount} more)
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Received Proposals */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <MessageCircle className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-gray-900">Received Proposals</h3>
                        </div>
                        {receivedProposals.length === 0 ? (
                          <Card>
                            <CardContent className="py-8 text-center text-gray-500">
                              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p>No received proposals</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            <div className="space-y-3">
                              {receivedProposals.slice(0, visibleReceivedCount).map((proposal) => (
                                <Card 
                                  key={proposal.id} 
                                  className="hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => {
                                    navigate(`/proposal-review/${proposal.id}`);
                                    setShowProposals(false);
                                  }}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                          {proposal.post_title}
                                        </h4>
                                        <span className="text-xs text-gray-500">
                                          from {proposal.requester_username}
                                        </span>
                                      </div>
                                      <Badge
                                        variant={
                                          proposal.status === 'completed'
                                            ? 'default'
                                            : proposal.status === 'accepted'
                                            ? 'default'
                                            : proposal.status === 'declined'
                                            ? 'destructive'
                                            : proposal.status === 'cancelled'
                                            ? 'destructive'
                                            : 'secondary'
                                        }
                                        className={
                                          proposal.status === 'completed'
                                            ? 'bg-blue-600 text-white'
                                            : proposal.status === 'accepted'
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : proposal.status === 'cancelled'
                                            ? 'bg-red-600 text-white'
                                            : ''
                                        }
                                      >
                                        {proposal.status === 'completed'
                                          ? 'Completed'
                                          : proposal.status === 'accepted'
                                          ? 'Accepted'
                                          : proposal.status === 'declined'
                                          ? 'Declined'
                                          : proposal.status === 'cancelled'
                                          ? 'Cancelled'
                                          : 'Waiting'}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {proposal.notes?.split('\n').find(line => line.startsWith('Location:'))?.replace('Location:', '').trim() || 'N/A'}
                                      </span>
                                      {proposal.proposed_date && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(proposal.proposed_date).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                            {receivedProposals.length > visibleReceivedCount && (
                              <Button
                                variant="outline"
                                className="w-full mt-3"
                                onClick={() => setVisibleReceivedCount(prev => prev + 3)}
                              >
                                Show More ({receivedProposals.length - visibleReceivedCount} more)
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


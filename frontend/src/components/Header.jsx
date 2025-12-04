import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import api from '../api';
import {
  Menu,
  Bell,
  MessageCircle,
  Clock,
  Leaf,
  Home as HomeIcon,
  PenLine,
  User,
  MessageSquare,
  Shield,
  LogOut,
  X,
  Send,
  Loader2,
  Calendar,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [sentProposals, setSentProposals] = useState([]);
  const [receivedProposals, setReceivedProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Debug: Check user admin status
  useEffect(() => {
    if (user) {
      console.log('User object:', user);
      console.log('is_staff:', user.is_staff);
      console.log('is_superuser:', user.is_superuser);
      console.log('isAdmin calculated:', user?.is_staff || user?.is_superuser);
    }
  }, [user]);

  const isAdmin = user?.is_staff || user?.is_superuser;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
    setShowMessages(!showMessages);
    setShowMenu(false);
    setShowNotifications(false);
    if (!showMessages) {
      fetchProposals();
    }
  };

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
          onClick={() => navigate('/')}
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
            onClick={() => navigate('/')}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === '/' ? 'text-primary' : 'text-gray-700'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigate('/forum')}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === '/forum' ? 'text-primary' : 'text-gray-700'
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
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowMenu(false);
              }}
              className="relative hover:bg-primary/10"
            >
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96 overflow-auto z-50">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold text-sm text-gray-900">Notifications</h4>
                </div>
                <div className="p-4 text-sm text-gray-500 text-center">
                  No new notifications
                </div>
              </div>
            )}
          </div>

          {/* Message Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMessageClick}
            className="hover:bg-primary/10"
          >
            <MessageCircle className="w-5 h-5 text-primary" />
          </Button>

          {/* Hamburger Menu Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowMenu(!showMenu);
                setShowNotifications(false);
              }}
              className="hover:bg-primary/10"
            >
              <Menu className="w-6 h-6 text-primary" />
            </Button>

            {/* Overlay */}
            {showMenu && (
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowMenu(false)}
              />
            )}

            {/* Hamburger Menu Drawer */}
            {showMenu && (
              <div className="fixed top-0 right-0 h-screen w-80 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-semibold text-gray-900">The Hive</h2>
                    <h4 className="text-lg font-semibold text-gray-900">Community Oriented Platform</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowMenu(false)}
                      className="hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12"
                      onClick={() => handleMenuClick('/')}
                    >
                      <HomeIcon className="w-5 h-5 mr-3" />
                      Home Page
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
                      onClick={() => handleMenuClick('/my-profile')}
                    >
                      <User className="w-5 h-5 mr-3" />
                      My Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12"
                      onClick={() => handleMenuClick('/forum')}
                    >
                      <MessageSquare className="w-5 h-5 mr-3" />
                      Community Forum
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

          {/* Messages Drawer */}
          {showMessages && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowMessages(false)}
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
                      onClick={() => setShowMessages(false)}
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
                          <div className="space-y-3">
                            {sentProposals.map((proposal) => (
                              <Card 
                                key={proposal.id} 
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => {
                                  navigate(`/negotiate/${proposal.post_id}`);
                                  setShowMessages(false);
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
                                        proposal.status === 'accepted'
                                          ? 'default'
                                          : proposal.status === 'declined'
                                          ? 'destructive'
                                          : 'secondary'
                                      }
                                    >
                                      {proposal.status === 'accepted'
                                        ? 'Accepted'
                                        : proposal.status === 'declined'
                                        ? 'Declined'
                                        : 'Waiting'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {proposal.notes?.split('\n').find(line => line.startsWith('Location:'))?.replace('Location:', '').trim() || 'N/A'}
                                    </span>
                                    {proposal.date && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(proposal.date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
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
                          <div className="space-y-3">
                            {receivedProposals.map((proposal) => (
                              <Card 
                                key={proposal.id} 
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => {
                                  navigate(`/proposal-review/${proposal.id}`);
                                  setShowMessages(false);
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                        {proposal.post_title}
                                      </h4>
                                      <span className="text-xs text-gray-500">
                                        from {proposal.sender_username}
                                      </span>
                                    </div>
                                    <Badge
                                      variant={
                                        proposal.status === 'accepted'
                                          ? 'default'
                                          : proposal.status === 'declined'
                                          ? 'destructive'
                                          : 'secondary'
                                      }
                                    >
                                      {proposal.status === 'accepted'
                                        ? 'Accepted'
                                        : proposal.status === 'declined'
                                        ? 'Declined'
                                        : 'Waiting'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {proposal.notes?.split('\n').find(line => line.startsWith('Location:'))?.replace('Location:', '').trim() || 'N/A'}
                                    </span>
                                    {proposal.date && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(proposal.date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
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


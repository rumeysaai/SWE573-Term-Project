import api from '../api';
import { toast } from 'sonner';

/**
 * Real-time notification service
 * Polls backend for updates and triggers notifications
 */
class NotificationService {
  constructor() {
    this.intervals = {};
    this.callbacks = {
      proposals: [],
      messages: [],
      timeBalance: [],
    };
    this.lastProposalCount = 0;
    this.lastMessageCount = 0;
    this.lastTimeBalance = null;
    this.isRunning = false;
    // Request cancellation controllers
    this.abortControllers = {
      proposals: null,
      messages: null,
      timeBalance: null,
    };
    // Track if requests are in progress to prevent overlapping calls
    this.pendingRequests = {
      proposals: false,
      messages: false,
      timeBalance: false,
    };
    // Track if page is visible
    this.isPageVisible = !document.hidden;
    this.setupVisibilityListener();
  }

  /**
   * Setup Page Visibility API listener to pause/resume polling
   */
  setupVisibilityListener() {
    const handleVisibilityChange = () => {
      this.isPageVisible = !document.hidden;
      // Optionally trigger immediate check when page becomes visible again
      if (this.isPageVisible && this.isRunning && this.currentUser) {
        // Small delay to avoid immediate burst when switching tabs
        setTimeout(() => {
          this.checkProposals(this.currentUser);
          this.checkMessages(this.currentUser);
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /**
   * Subscribe to proposal updates
   */
  onProposalUpdate(callback) {
    this.callbacks.proposals.push(callback);
    return () => {
      this.callbacks.proposals = this.callbacks.proposals.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to message updates
   */
  onMessageUpdate(callback) {
    this.callbacks.messages.push(callback);
    return () => {
      this.callbacks.messages = this.callbacks.messages.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to time balance updates
   */
  onTimeBalanceUpdate(callback) {
    this.callbacks.timeBalance.push(callback);
    return () => {
      this.callbacks.timeBalance = this.callbacks.timeBalance.filter(cb => cb !== callback);
    };
  }

  /**
   * Check for new proposals
   */
  async checkProposals(user) {
    if (!user || !this.isPageVisible) return;
    
    // Prevent overlapping requests
    if (this.pendingRequests.proposals) return;

    // Cancel previous request if still pending
    if (this.abortControllers.proposals) {
      this.abortControllers.proposals.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    this.abortControllers.proposals = abortController;
    this.pendingRequests.proposals = true;

    try {
      // Use lightweight count endpoint that doesn't fetch images or proposal details
      const response = await api.get('/proposals/for-approval/count/', {
        signal: abortController.signal,
      });
      
      // Check if request was aborted
      if (abortController.signal.aborted) return;
      
      const waitingCount = response.data?.count || response.data?.waiting_count || 0;

      // Check if there are new proposals
      if (waitingCount > this.lastProposalCount && this.lastProposalCount > 0) {
        const newCount = waitingCount - this.lastProposalCount;
        toast.info(`You have ${newCount} new proposal${newCount > 1 ? 's' : ''} waiting for approval`);
        
        // Trigger custom event for Header component
        window.dispatchEvent(new CustomEvent('proposalUpdated'));
      }

      this.lastProposalCount = waitingCount;

      // Notify all subscribers (pass empty array since we don't have proposal details)
      // Subscribers that need full proposal data should fetch it separately
      this.callbacks.proposals.forEach(callback => {
        try {
          callback([], waitingCount);
        } catch (error) {
          console.error('Error in proposal callback:', error);
        }
      });
    } catch (error) {
      // Ignore aborted requests (axios uses ERR_CANCELED code)
      if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error checking proposals:', error);
    } finally {
      this.pendingRequests.proposals = false;
      if (this.abortControllers.proposals === abortController) {
        this.abortControllers.proposals = null;
      }
    }
  }

  /**
   * Check for new messages
   */
  async checkMessages(user) {
    if (!user || !this.isPageVisible) return;
    
    // Prevent overlapping requests
    if (this.pendingRequests.messages) return;

    // Cancel previous request if still pending
    if (this.abortControllers.messages) {
      this.abortControllers.messages.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    this.abortControllers.messages = abortController;
    this.pendingRequests.messages = true;

    try {
      const response = await api.get('/chats/unread-count/', {
        signal: abortController.signal,
      });
      
      // Check if request was aborted
      if (abortController.signal.aborted) return;
      
      const unreadCount = response.data?.unread_count || 0;

      // Check if there are new messages
      if (unreadCount > this.lastMessageCount && this.lastMessageCount > 0) {
        const newCount = unreadCount - this.lastMessageCount;
        toast.info(`You have ${newCount} new message${newCount > 1 ? 's' : ''}`);
        
        // Trigger custom event for Header component
        window.dispatchEvent(new CustomEvent('messageUpdated'));
      }

      this.lastMessageCount = unreadCount;

      // Notify all subscribers
      this.callbacks.messages.forEach(callback => {
        try {
          callback(unreadCount);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      });
    } catch (error) {
      // Ignore aborted requests (axios uses ERR_CANCELED code)
      if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error checking messages:', error);
    } finally {
      this.pendingRequests.messages = false;
      if (this.abortControllers.messages === abortController) {
        this.abortControllers.messages = null;
      }
    }
  }

  /**
   * Check for time balance changes
   */
  async checkTimeBalance(user) {
    if (!user || !this.isPageVisible) return;
    
    // Prevent overlapping requests
    if (this.pendingRequests.timeBalance) return;

    // Cancel previous request if still pending
    if (this.abortControllers.timeBalance) {
      this.abortControllers.timeBalance.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    this.abortControllers.timeBalance = abortController;
    this.pendingRequests.timeBalance = true;

    try {
      // Try lightweight endpoint first
      const response = await api.get('/users/me/', { 
        params: { fields: 'time_balance' },
        signal: abortController.signal,
      });
      
      // Check if request was aborted
      if (abortController.signal.aborted) return;
      
      const timeBalance = response.data?.time_balance || response.data?.profile?.time_balance || 0;

      // Check if balance changed
      if (this.lastTimeBalance !== null && this.lastTimeBalance !== timeBalance) {
        const difference = timeBalance - this.lastTimeBalance;
        if (difference > 0) {
          toast.success(`Time balance increased by ${difference.toFixed(2)} hours`);
        } else if (difference < 0) {
          toast.info(`Time balance decreased by ${Math.abs(difference).toFixed(2)} hours`);
        }
      }

      this.lastTimeBalance = timeBalance;

      // Notify all subscribers
      this.callbacks.timeBalance.forEach(callback => {
        try {
          callback(timeBalance);
        } catch (error) {
          console.error('Error in time balance callback:', error);
        }
      });
    } catch (error) {
      // Ignore aborted requests (axios uses ERR_CANCELED code)
      if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      
      // Only log error, don't retry with full profile to avoid double requests
      // The next poll will try again
      console.error('Error checking time balance:', error);
    } finally {
      this.pendingRequests.timeBalance = false;
      if (this.abortControllers.timeBalance === abortController) {
        this.abortControllers.timeBalance = null;
      }
    }
  }

  /**
   * Start polling for updates
   */
  start(user, options = {}) {
    if (this.isRunning) {
      this.stop();
    }

    this.isRunning = true;
    this.currentUser = user;
    const {
      proposalInterval = 60000, // 60 seconds (1 minute)
      messageInterval = 20000,  // 20 seconds
      timeBalanceInterval = 30000, // 30 seconds
      initialDelay = 2000, // Delay initial checks to let page load first
    } = options;

    // Defer initial checks to prevent blocking page load
    // Use setTimeout to allow page to render first
    setTimeout(() => {
      if (this.isRunning && this.isPageVisible) {
        this.checkProposals(user);
        this.checkMessages(user);
        this.checkTimeBalance(user);
      }
    }, initialDelay);

    // Set up intervals
    this.intervals.proposals = setInterval(() => {
      if (this.isPageVisible) {
        this.checkProposals(user);
      }
    }, proposalInterval);

    this.intervals.messages = setInterval(() => {
      if (this.isPageVisible) {
        this.checkMessages(user);
      }
    }, messageInterval);

    this.intervals.timeBalance = setInterval(() => {
      if (this.isPageVisible) {
        this.checkTimeBalance(user);
      }
    }, timeBalanceInterval);
  }

  /**
   * Stop polling
   */
  stop() {
    this.isRunning = false;
    this.currentUser = null;
    
    // Clear intervals
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    this.intervals = {};
    
    // Cancel any pending requests
    Object.values(this.abortControllers).forEach(controller => {
      if (controller) {
        controller.abort();
      }
    });
    this.abortControllers = {
      proposals: null,
      messages: null,
      timeBalance: null,
    };
    
    // Reset pending flags
    this.pendingRequests = {
      proposals: false,
      messages: false,
      timeBalance: false,
    };
    
    // Reset counters
    this.lastProposalCount = 0;
    this.lastMessageCount = 0;
    this.lastTimeBalance = null;
  }

  /**
   * Reset counters (useful after manual refresh)
   */
  reset() {
    this.lastProposalCount = 0;
    this.lastMessageCount = 0;
    this.lastTimeBalance = null;
  }
}

// Export singleton instance
export default new NotificationService();
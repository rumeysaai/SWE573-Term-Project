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
    if (!user) return;

    try {
      const response = await api.get('/proposals/for-approval/', {
        params: { page: 1, page_size: 10 }
      });
      
      const proposals = response.data.results || response.data || [];
      
      // Count waiting/pending proposals
      const waitingCount = proposals.filter(p => 
        p.status === 'waiting' || p.status === 'pending'
      ).length;

      // Check if there are new proposals
      if (waitingCount > this.lastProposalCount && this.lastProposalCount > 0) {
        const newCount = waitingCount - this.lastProposalCount;
        toast.info(`You have ${newCount} new proposal${newCount > 1 ? 's' : ''} waiting for approval`);
        
        // Trigger custom event for Header component
        window.dispatchEvent(new CustomEvent('proposalUpdated'));
      }

      this.lastProposalCount = waitingCount;

      // Notify all subscribers
      this.callbacks.proposals.forEach(callback => {
        try {
          callback(proposals, waitingCount);
        } catch (error) {
          console.error('Error in proposal callback:', error);
        }
      });
    } catch (error) {
      console.error('Error checking proposals:', error);
    }
  }

  /**
   * Check for new messages
   */
  async checkMessages(user) {
    if (!user) return;

    try {
      const response = await api.get('/chats/unread-count/');
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
      console.error('Error checking messages:', error);
    }
  }

  /**
   * Check for time balance changes
   */
  async checkTimeBalance(user) {
    if (!user) return;

    try {
      const response = await api.get('/users/me/', { params: { fields: 'time_balance' } });
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
      // If lightweight endpoint fails, try full profile
      try {
        const response = await api.get('/users/me/');
        const timeBalance = response.data?.profile?.time_balance || 0;
        
        if (this.lastTimeBalance !== null && this.lastTimeBalance !== timeBalance) {
          const difference = timeBalance - this.lastTimeBalance;
          if (difference > 0) {
            toast.success(`Time balance increased by ${difference.toFixed(2)} hours`);
          } else if (difference < 0) {
            toast.info(`Time balance decreased by ${Math.abs(difference).toFixed(2)} hours`);
          }
        }

        this.lastTimeBalance = timeBalance;
        this.callbacks.timeBalance.forEach(callback => {
          try {
            callback(timeBalance);
          } catch (error) {
            console.error('Error in time balance callback:', error);
          }
        });
      } catch (fallbackError) {
        console.error('Error checking time balance:', fallbackError);
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
    const {
      proposalInterval = 30000, // 30 seconds
      messageInterval = 20000,  // 20 seconds
      timeBalanceInterval = 30000, // 30 seconds
    } = options;

    // Initial checks
    this.checkProposals(user);
    this.checkMessages(user);
    this.checkTimeBalance(user);

    // Set up intervals
    this.intervals.proposals = setInterval(() => {
      this.checkProposals(user);
    }, proposalInterval);

    this.intervals.messages = setInterval(() => {
      this.checkMessages(user);
    }, messageInterval);

    this.intervals.timeBalance = setInterval(() => {
      this.checkTimeBalance(user);
    }, timeBalanceInterval);
  }

  /**
   * Stop polling
   */
  stop() {
    this.isRunning = false;
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    this.intervals = {};
    
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


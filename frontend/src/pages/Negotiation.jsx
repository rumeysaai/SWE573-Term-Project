import React, { useState } from 'react';
// Removed imports for custom UI components as they are not available
// in this environment. Will use standard HTML elements with Tailwind.

import { 
  ArrowLeft, 
  Send, 
  Calendar, 
  Clock, 
  CheckCircle, 
  MapPin, 
  User,
  MessageCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
// Removed toast import, will use console.log

// Mock current user data (as it was imported in the original file)
const currentUser = {
  id: 'user-1',
  userName: 'Alex Johnson',
};

// Interface definition for a Proposal
// Removed TypeScript interface
/*
interface Proposal {
  id:string;
  fromUserId: string;
  fromUserName: string;
  hours: number;
  date: string;
  time: string;
  location: string;
  notes: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
}
*/

// Helper components to mimic shadcn/ui with standard elements
const Button = ({ variant = 'default', className = '', children, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 shadow-md";
  
  let variantStyle = '';
  switch (variant) {
    case 'destructive':
      variantStyle = 'bg-red-600 text-white hover:bg-red-600/90';
      break;
    case 'outline':
      variantStyle = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground border-primary/30';
      break;
    default:
      variantStyle = 'bg-primary text-primary-foreground hover:bg-primary/90 bg-slate-900 text-white hover:bg-slate-900/90';
  }
  
  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }) => (
  <input 
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-primary/20 focus:border-primary ${className}`} 
    {...props} 
  />
);

const Textarea = ({ className = '', ...props }) => (
  <textarea 
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-primary/20 focus:border-primary ${className}`} 
    {...props} 
  />
);

const Badge = ({ variant = 'default', className = '', children }) => {
  const baseStyle = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  let variantStyle = '';
  switch (variant) {
    case 'secondary':
      variantStyle = 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 bg-slate-100 text-slate-900';
      break;
    case 'destructive':
      variantStyle = 'border-transparent bg-red-600 text-white hover:bg-red-600/80';
      break;
    case 'outline':
      variantStyle = 'text-foreground';
      break;
    default:
      variantStyle = 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80 bg-slate-900 text-white';
  }

  return (
    <div className={`${baseStyle} ${variantStyle} ${className}`}>
      {children}
    </div>
  );
};

const Card = ({ className = '', children }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm border-primary/20 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ className = '', children }) => (
  <div className={`flex flex-col space-y-1.5 p-6 bg-gradient-to-r from-primary/5 to-secondary/20 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ className = '', children }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ className = '', children }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const Label = ({ className = '', ...props }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
);

const Separator = ({ className = '' }) => (
  <hr className={`shrink-0 bg-border h-[1px] w-full bg-primary/20 ${className}`} />
);


export default function Negotiation() {
  const [proposals, setProposals] = useState([
    {
      id: 'p1',
      fromUserId: 'user-2',
      fromUserName: 'Maria Garcia',
      hours: 2,
      date: '2025-11-15',
      time: '14:00',
      location: 'Central Kadikoy',
      notes: 'I want to practice my Spanish speaking. I am at a beginner level.',
      timestamp: new Date('2025-11-08T09:00:00'),
      status: 'pending',
    },
    {
      id: 'p2',
      fromUserId: currentUser.id,
      fromUserName: currentUser.userName,
      hours: 1.5,
      date: '2025-11-16',
      time: '15:00',
      location: 'Kadikoy - Online is also an option',
      notes: 'That day is more suitable for me. We can do it online if you prefer, it would be more flexible.',
      timestamp: new Date('2025-11-08T10:30:00'),
      status: 'countered',
    },
  ]);

  const [showNewProposal, setShowNewProposal] = useState(false);
  const [proposalData, setProposalData] = useState({
    hours: 2,
    date: '',
    time: '',
    location: '',
    notes: '',
  });

  // Mock data for the post being negotiated
  const postDetails = {
    title: 'Language Tutoring (Spanish)',
    type: 'offer',
    owner: 'Maria Garcia',
    tags: ['Education', 'Language'],
    location: 'Kadikoy',
  };

  const latestProposal = proposals[proposals.length - 1];
  const pendingProposal = proposals.find(p => p.status === 'pending' && p.fromUserId !== currentUser.id);

  const handleSubmitProposal = () => {
    if (!proposalData.date || !proposalData.time) {
      console.error('Please select a date and time');
      return;
    }

    const newProposal = {
      id: `p${proposals.length + 1}`,
      fromUserId: currentUser.id,
      fromUserName: currentUser.userName,
      hours: proposalData.hours,
      date: proposalData.date,
      time: proposalData.time,
      location: proposalData.location,
      notes: proposalData.notes,
      timestamp: new Date(),
      status: 'countered',
    };

    // Mark previous proposals as countered
    const updatedProposals = proposals.map(p => 
      p.status === 'pending' ? { ...p, status: 'countered' } : p
    );

    setProposals([...updatedProposals, newProposal]);
    setShowNewProposal(false);
    setProposalData({ hours: 2, date: '', time: '', location: '', notes: '' });
    console.log('Counter-proposal sent');
  };

  const handleAcceptProposal = (proposalId) => {
    setProposals(proposals.map(p => 
      p.id === proposalId ? { ...p, status: 'accepted' } : p
    ));
    console.log('Proposal accepted! A TimeBank agreement has been created.');
  };

  const handleRejectProposal = (proposalId) => {
    setProposals(proposals.map(p => 
      p.id === proposalId ? { ...p, status: 'rejected' } : p
    ));
    console.error('Proposal rejected');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-primary/20">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-md bg-slate-900 text-white">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-primary text-slate-900 font-semibold">Negotiation: {postDetails.title}</h2>
            <p className="text-muted-foreground text-sm text-slate-600">
              Negotiating with {postDetails.owner}
            </p>
          </div>
        </div>

        {/* Post Summary */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-primary text-slate-900">{postDetails.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4 text-primary text-slate-900" />
                  <span className="text-sm text-muted-foreground text-slate-600">{postDetails.location}</span>
                </div>
              </div>
              <Badge 
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {postDetails.type === 'offer' ? 'Offer' : 'Request'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {postDetails.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current/Pending Proposal */}
          {pendingProposal && (
            <Card className="border-accent shadow-md border-blue-400">
              <CardHeader className="bg-gradient-to-r from-accent/10 to-secondary/20 from-blue-500/10 to-slate-100/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent text-blue-500" />
                  <CardTitle className="text-accent text-blue-500">Pending Proposal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 bg-secondary/10 p-3 rounded-lg border border-primary/10">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center bg-slate-900/10">
                    <User className="w-5 h-5 text-primary text-slate-900" />
                  </div>
                  <div>
                    <p className="font-medium">{pendingProposal.fromUserName}</p>
                    <p className="text-xs text-muted-foreground text-slate-600">
                      {pendingProposal.timestamp.toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary text-slate-900" />
                    <div>
                      <p className="text-sm text-muted-foreground text-slate-600">Duration</p>
                      <p className="font-medium text-primary text-slate-900">{pendingProposal.hours} hours</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary text-slate-900" />
                    <div>
                      <p className="text-sm text-muted-foreground text-slate-600">Date & Time</p>
                      <p className="font-medium">
                        {new Date(pendingProposal.date).toLocaleDateString('en-US')} - {pendingProposal.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary text-slate-900" />
                    <div>
                      <p className="text-sm text-muted-foreground text-slate-600">Location</p>
                      <p className="font-medium">{pendingProposal.location}</p>
                    </div>
                  </div>

                  {pendingProposal.notes && (
                    <div className="bg-muted/30 p-3 rounded-lg border border-primary/10 bg-slate-50/30">
                      <p className="text-sm text-muted-foreground mb-1 text-slate-600">Notes:</p>
                      <p className="text-sm">{pendingProposal.notes}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleAcceptProposal(pendingProposal.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowNewProposal(true)}
                  >
                    Counter-Offer
                  </Button>
                </div>
                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleRejectProposal(pendingProposal.id)}
                >
                  Reject
                </Button>
              </CardContent>
            </Card>
          )}

          {/* New Proposal Form */}
          <Card className={`shadow-md ${!pendingProposal ? 'md:col-span-2' : ''}`}>
            <CardHeader>
              <CardTitle className="text-primary text-slate-900">
                {pendingProposal ? 'Send Counter-Offer' : 'Create New Proposal'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {showNewProposal || !pendingProposal ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hours" className="text-primary text-slate-900">Duration (Hours)</Label>
                      <Input
                        id="hours"
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={proposalData.hours}
                        onChange={(e) => setProposalData({ ...proposalData, hours: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-primary text-slate-900">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={proposalData.time}
                        onChange={(e) => setProposalData({ ...proposalData, time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-primary text-slate-900">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={proposalData.date}
                      onChange={(e) => setProposalData({ ...proposalData, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-primary text-slate-900">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Central Kadikoy or Online"
                      value={proposalData.location}
                      onChange={(e) => setProposalData({ ...proposalData, location: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-primary text-slate-900">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      rows={4}
                      placeholder="Additional details about your proposal..."
                      value={proposalData.notes}
                      onChange={(e) => setProposalData({ ...proposalData, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1"
                      onClick={handleSubmitProposal}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Proposal
                    </Button>
                    {pendingProposal && (
                      <Button 
                        variant="outline"
                        onClick={() => setShowNewProposal(false)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4 text-slate-600">
                    Please evaluate the current proposal or send a counter-offer first
                  </p>
                  <Button onClick={() => setShowNewProposal(true)}>
                    Create Counter-Offer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Proposal History */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-primary text-slate-900" />
              <CardTitle className="text-primary text-slate-900">Proposal History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {proposals.slice().reverse().map((proposal, index) => {
                const isOwn = proposal.fromUserId === currentUser.id;
                
                return (
                  <div
                    key={proposal.id}
                    className={`relative pl-8 pb-4 ${index !== proposals.length - 1 ? 'border-l-2 border-primary/20' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-0 w-4 h-4 rounded-full border-2 ${
                      proposal.status === 'accepted' 
                        ? 'bg-green-500 border-green-500' 
                        : proposal.status === 'rejected'
                        ? 'bg-red-500 border-red-500'
                        : isOwn
                        ? 'bg-primary border-primary bg-slate-900 border-slate-900'
                        : 'bg-secondary border-secondary bg-slate-100 border-slate-400'
                    }`} />

                    <div className={`rounded-lg border-2 p-4 ${
                      proposal.status === 'accepted'
                        ? 'bg-green-50 border-green-200'
                        : proposal.status === 'rejected'
                        ? 'bg-red-50 border-red-200'
                        : isOwn
                        ? 'bg-primary/5 border-primary/30 bg-slate-900/5 border-slate-900/30'
                        : 'bg-secondary/10 border-secondary/30 bg-slate-100/10 border-slate-400/30'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{proposal.fromUserName}</p>
                          <p className="text-xs text-muted-foreground text-slate-600">
                            {proposal.timestamp.toLocaleString('en-US')}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            proposal.status === 'accepted' 
                              ? 'default' 
                              : proposal.status === 'rejected'
                              ? 'destructive'
                              : 'outline'
                          }
                          className={
                            proposal.status === 'pending'
                              ? 'bg-accent text-accent-foreground border-accent bg-blue-500 text-white border-blue-500'
                              : proposal.status === 'countered'
                              ? 'bg-muted text-muted-foreground bg-slate-200 text-slate-600'
                              : proposal.status === 'accepted'
                              ? 'bg-green-600 text-white'
                              : ''
                          }
                        >
                          {proposal.status === 'pending' && 'Pending'}
                          {proposal.status === 'accepted' && 'Accepted'}
                          {proposal.status === 'rejected' && 'Rejected'}
                          {proposal.status === 'countered' && 'Countered'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary text-slate-900" />
                          <span>{proposal.hours}h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary text-slate-900" />
                          <span>{new Date(proposal.date).toLocaleDateString('en-US')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary text-slate-900" />
                          <span>{proposal.time}</span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2 md:col-span-3">
                          <MapPin className="w-4 h-4 text-primary text-slate-900" />
                          <span>{proposal.location}</span>
                        </div>
                      </div>

                      {proposal.notes && (
                        <div className="mt-3 pt-3 border-t border-primary/10">
                          <p className="text-sm text-muted-foreground text-slate-600">{proposal.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
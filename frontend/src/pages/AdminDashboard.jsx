import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, ArrowRightLeft, Eye, EyeOff, Shield, TrendingUp, Loader2, FileText, MessageSquare, Calendar } from "lucide-react";
import api from "../api";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview'); // overview, posts, reportedPostComments, forums, reportedForumComments, timebank
  const [metrics, setMetrics] = useState({
    totalExchanges: 0,
    activeUsers: 0,
    bestUsers: [],
  });
  const [postTagData, setPostTagData] = useState([]);
  const [forumTagData, setForumTagData] = useState([]);
  const [posts, setPosts] = useState([]);
  const [forumTopics, setForumTopics] = useState([]);
  const [reportedPostComments, setReportedPostComments] = useState([]);
  const [reportedForumComments, setReportedForumComments] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin-dashboard/');
      const data = response.data;
      
      setMetrics({
        totalExchanges: data.metrics.totalExchanges || 0,
        activeUsers: data.metrics.activeUsers || 0,
        bestUsers: data.metrics.bestUsers || [],
      });
      setPostTagData(data.postTagData || []);
      setForumTagData(data.forumTagData || []);
      setPosts(data.posts || []);
      setForumTopics(data.forumTopics || []);
      setReportedPostComments(data.reportedPostComments || []);
      setReportedForumComments(data.reportedForumComments || []);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load dashboard data';
      const errorDetails = error.response?.data;
      console.error('Error details:', errorDetails);
      toast.error(errorMessage);
      
      // If 403, show more details
      if (error.response?.status === 403 && errorDetails) {
        console.error('403 Forbidden - User info:', {
          username: errorDetails.user,
          is_staff: errorDetails.is_staff,
          is_superuser: errorDetails.is_superuser
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHide = async (type, id, currentStatus) => {
    try {
      let endpoint = '';
      if (type === 'post') {
        endpoint = `/posts/${id}/toggle_hide/`;
      } else if (type === 'forum') {
        endpoint = `/forum-topics/${id}/toggle_hide/`;
      } else if (type === 'comment') {
        endpoint = `/comments/${id}/toggle_hide/`;
      } else if (type === 'forum-comment') {
        endpoint = `/forum-comments/${id}/toggle_hide/`;
      }
      
      const response = await api.post(endpoint);
      
      // Update local state
      if (type === 'post') {
        setPosts(posts.map(p => 
          p.id === id ? { ...p, is_hidden: response.data.is_hidden, status: response.data.is_hidden ? 'Hidden' : 'Active' } : p
        ));
      } else if (type === 'forum') {
        setForumTopics(forumTopics.map(t => 
          t.id === id ? { ...t, is_hidden: response.data.is_hidden, status: response.data.is_hidden ? 'Hidden' : 'Active' } : t
        ));
      } else if (type === 'comment') {
        setReportedPostComments(reportedPostComments.map(c => 
          c.id === id ? { ...c, is_hidden: response.data.is_hidden, status: response.data.is_hidden ? 'Hidden' : 'Active' } : c
        ));
      } else if (type === 'forum-comment') {
        setReportedForumComments(reportedForumComments.map(c => 
          c.id === id ? { ...c, is_hidden: response.data.is_hidden, status: response.data.is_hidden ? 'Hidden' : 'Active' } : c
        ));
      }
      
      const typeNames = {
        'post': 'Post',
        'forum': 'Forum topic',
        'comment': 'Comment',
        'forum-comment': 'Forum comment'
      };
      
      toast.success(`${typeNames[type] || type} visibility updated`);
    } catch (error) {
      console.error(`Error toggling ${type} visibility:`, error);
      toast.error(`Failed to update ${type} visibility`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar Navigation */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-2">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Admin Panel</h3>
          </div>
        </div>
        
        <button
          onClick={() => setActiveSection('overview')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'overview'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Overview
        </button>
        
        <button
          onClick={() => setActiveSection('posts')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'posts'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Posts
        </button>
        
        <button
          onClick={() => setActiveSection('reportedPostComments')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'reportedPostComments'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Post Comments
        </button>
        
        <button
          onClick={() => setActiveSection('forums')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'forums'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Forums
        </button>
        
        <button
          onClick={() => setActiveSection('reportedForumComments')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'reportedForumComments'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Forum Comments
        </button>
        
        <button
          onClick={() => setActiveSection('timebank')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'timebank'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          TimeBank
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-primary/20">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-primary">Admin Panel</h2>
            <p className="text-muted-foreground text-sm">Platform management and monitoring</p>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <>

      {/* Metrics - FR-AD-501 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary/5 to-secondary/20">
            <CardTitle className="text-sm text-primary">Total Exchanges</CardTitle>
            <ArrowRightLeft className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl text-primary">{metrics.totalExchanges}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Active community
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary/5 to-secondary/20">
            <CardTitle className="text-sm text-primary">Active Users</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl text-primary">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Growing daily
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary/5 to-secondary/20">
            <CardTitle className="text-sm text-primary">Users Rating</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2">
              {metrics.bestUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No users with reviews yet</p>
              ) : (
                metrics.bestUsers.map((user, index) => (
                  <div key={user.username || index} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-secondary">
                        #{index + 1} {user.username}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {user.rating ? user.rating.toFixed(1) : '0.0'} ⭐
                    </span>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Highest rated users</p>
          </CardContent>
        </Card>
      </div>

      {/* Post Tags Chart */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <CardTitle className="text-primary">Most Popular Post Tags</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {postTagData.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No post tag data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={postTagData} margin={{ bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(61, 107, 46, 0.15)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#3D6B2E" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                />
                <YAxis stroke="#3D6B2E" allowDecimals={false} interval={1} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF8F3',
                    border: '1px solid rgba(61, 107, 46, 0.2)',
                    borderRadius: '0.75rem',
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#3D6B2E">
                  {postTagData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Forum Tags Chart */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <CardTitle className="text-primary">Most Popular Forum Tags</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {forumTagData.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No forum tag data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={forumTagData} margin={{ bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(61, 107, 46, 0.15)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#3D6B2E" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                />
                <YAxis stroke="#3D6B2E" allowDecimals={false} interval={1} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF8F3',
                    border: '1px solid rgba(61, 107, 46, 0.2)',
                    borderRadius: '0.75rem',
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#3D6B2E">
                  {forumTagData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

          </>
        )}

        {/* Posts Section */}
        {activeSection === 'posts' && (
          <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <CardTitle className="text-primary">Post Moderation</CardTitle>
          <p className="text-sm text-muted-foreground">All active posts displayed</p>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-primary">Title</TableHead>
                <TableHead className="text-primary">Author</TableHead>
                <TableHead className="text-primary">Date</TableHead>
                <TableHead className="text-primary">Status</TableHead>
                <TableHead className="text-primary">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No posts found
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id} className="border-primary/10 hover:bg-secondary/20">
                    <TableCell>{post.title}</TableCell>
                    <TableCell className="text-muted-foreground">{post.author_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={post.status === "Hidden" ? "destructive" : "outline"}
                        className={post.status === "Active" ? "border-primary text-primary bg-primary/10" : ""}
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={post.is_hidden ? "default" : "destructive"} 
                          className="shadow-sm"
                          onClick={() => handleToggleHide('post', post.id, post.is_hidden)}
                        >
                          {post.is_hidden ? (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Show
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Hide
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        )}

        {/* Forums Section */}
        {activeSection === 'forums' && (
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
              <CardTitle className="text-primary">Forum Moderation</CardTitle>
          <p className="text-sm text-muted-foreground">All forum topics displayed</p>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-primary">Title</TableHead>
                <TableHead className="text-primary">Author</TableHead>
                <TableHead className="text-primary">Date</TableHead>
                <TableHead className="text-primary">Status</TableHead>
                <TableHead className="text-primary">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forumTopics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No forum topics found
                  </TableCell>
                </TableRow>
              ) : (
                forumTopics.map((topic) => {
                  const truncatedTitle = topic.title && topic.title.length > 40 
                    ? topic.title.substring(0, 40) + '...' 
                    : topic.title;
                  return (
                  <TableRow key={topic.id} className="border-primary/10 hover:bg-secondary/20">
                    <TableCell 
                      className="max-w-[300px] truncate" 
                      title={topic.title}
                    >
                      {truncatedTitle}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{topic.author_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{topic.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={topic.status === "Hidden" ? "destructive" : "outline"}
                        className={topic.status === "Active" ? "border-primary text-primary bg-primary/10" : ""}
                      >
                        {topic.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={topic.is_hidden ? "default" : "destructive"} 
                          className="shadow-sm"
                          onClick={() => handleToggleHide('forum', topic.id, topic.is_hidden)}
                        >
                          {topic.is_hidden ? (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Show
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Hide
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
            </CardContent>
          </Card>
        )}

        {/* Reported Post Comments Section */}
        {activeSection === 'reportedPostComments' && (
          <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <CardTitle className="text-primary">Reported Post Comments</CardTitle>
          <p className="text-sm text-muted-foreground">Comments reported by users</p>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-primary">Comment</TableHead>
                <TableHead className="text-primary">Author</TableHead>
                <TableHead className="text-primary">Post</TableHead>
                <TableHead className="text-primary">Reports</TableHead>
                <TableHead className="text-primary">Status</TableHead>
                <TableHead className="text-primary">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportedPostComments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No reported comments found
                  </TableCell>
                </TableRow>
              ) : (
                reportedPostComments.map((comment) => {
                  const truncatedText = comment.text && comment.text.length > 40 
                    ? comment.text.substring(0, 40) + '...' 
                    : comment.text;
                  return (
                    <TableRow key={comment.id} className="border-primary/10 hover:bg-secondary/20">
                      <TableCell className="max-w-[200px] truncate" title={comment.text}>
                        {truncatedText}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{comment.author_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{comment.post_title}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{comment.report_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={comment.status === "Hidden" ? "destructive" : "outline"}
                          className={comment.status === "Active" ? "border-primary text-primary bg-primary/10" : ""}
                        >
                          {comment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant={comment.is_hidden ? "default" : "destructive"} 
                          className="shadow-sm"
                          onClick={() => handleToggleHide('comment', comment.id, comment.is_hidden)}
                        >
                          {comment.is_hidden ? (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Show
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Hide
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        )}

        {/* Reported Forum Comments Section */}
        {activeSection === 'reportedForumComments' && (
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
              <CardTitle className="text-primary">Reported Forum Comments</CardTitle>
          <p className="text-sm text-muted-foreground">Forum comments reported by users</p>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-primary">Comment</TableHead>
                <TableHead className="text-primary">Author</TableHead>
                <TableHead className="text-primary">Topic</TableHead>
                <TableHead className="text-primary">Reports</TableHead>
                <TableHead className="text-primary">Status</TableHead>
                <TableHead className="text-primary">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportedForumComments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No reported comments found
                  </TableCell>
                </TableRow>
              ) : (
                reportedForumComments.map((comment) => {
                  const truncatedContent = comment.content && comment.content.length > 40 
                    ? comment.content.substring(0, 40) + '...' 
                    : comment.content;
                  return (
                    <TableRow key={comment.id} className="border-primary/10 hover:bg-secondary/20">
                      <TableCell className="max-w-[200px] truncate" title={comment.content}>
                        {truncatedContent}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{comment.author_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{comment.topic_title}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{comment.report_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={comment.status === "Hidden" ? "destructive" : "outline"}
                          className={comment.status === "Active" ? "border-primary text-primary bg-primary/10" : ""}
                        >
                          {comment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant={comment.is_hidden ? "default" : "destructive"} 
                          className="shadow-sm"
                          onClick={() => handleToggleHide('forum-comment', comment.id, comment.is_hidden)}
                        >
                          {comment.is_hidden ? (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Show
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Hide
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
            </CardContent>
          </Card>
        )}

        {/* TimeBank Section */}
        {activeSection === 'timebank' && (
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
              <CardTitle className="text-primary flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                TimeBank Transactions
              </CardTitle>
            </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-primary">Date</TableHead>
                <TableHead className="text-primary">From</TableHead>
                <TableHead className="text-primary">To</TableHead>
                <TableHead className="text-primary">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx, index) => (
                  <TableRow key={tx.id || index} className="border-primary/10 hover:bg-secondary/20">
                    <TableCell className="text-sm text-muted-foreground">{tx.date || 'N/A'}</TableCell>
                    <TableCell>{tx.sender_name}</TableCell>
                    <TableCell>{tx.receiver_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                        {tx.amount}h
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        )}
      </div>
    </div>
  );
}

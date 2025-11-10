import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  ArrowRightLeft,
  Tag,
  Eye,
  EyeOff,
  Shield,
  TrendingUp,
} from "lucide-react";

export function Admin() {
  const metrics = {
    totalExchanges: 1247,
    activeUsers: 328,
    topTags: ["Education", "Design", "Cooking", "Repair"],
  };

  const tagData = [
    { name: "Education", count: 145, fill: "#2A77EB" },
    { name: "Design", count: 98, fill: "#708EC1" },
    { name: "Cooking", count: 87, fill: "#B6A597" },
    { name: "Repair", count: 76, fill: "#FCBC6C" },
  ];

  const posts = [
    {
      id: 1,
      title: "Story Telling For Kids",
      author: "storyteller_94",
      status: "Active",
      date: "Oct 14, 2025",
    },
    {
      id: 2,
      title: "Web Design Services",
      author: "designer_can",
      status: "Active",
      date: "Oct 13, 2025",
    },
    {
      id: 3,
      title: "Piano Tutoring For Adults",
      author: "miss_chopin",
      status: "Active",
      date: "Oct 12, 2025",
    },
    {
      id: 4,
      title: "Car Repair Assistance",
      author: "stronghelper",
      status: "Flagged",
      date: "Oct 11, 2025",
    },
  ];

  const transactions = [
    {
      date: "Oct 14, 2025",
      from: "storyteller_94",
      to: "alican_89",
      hours: 3,
    },
    {
      date: "Oct 13, 2025",
      from: "miss_chopin",
      to: "merveyilmaz",
      hours: 1,
    },
    {
      date: "Oct 13, 2025",
      from: "designer_can",
      to: "stronghelper",
      hours: 1,
    },
    {
      date: "Oct 12, 2025",
      from: "stronghelper",
      to: "erensoz",
      hours: 2,
    },
    {
      date: "Oct 11, 2025",
      from: "rumeysaa",
      to: "emrahakdeniz",
      hours: 4,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-primary/20">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-md">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-primary">Admin Panel</h2>
          <p className="text-muted-foreground text-sm">
            Platform management and monitoring
          </p>
        </div>
      </div>

      {/* Metrics - FR-AD-501 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary/5 to-secondary/20">
            <CardTitle className="text-sm text-primary">
              Total Exchanges
            </CardTitle>
            <ArrowRightLeft className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl text-primary">
              {metrics.totalExchanges}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Active community
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary/5 to-secondary/20">
            <CardTitle className="text-sm text-primary">
              Active Users
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl text-primary">
              {metrics.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Growing daily
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary/5 to-secondary/20">
            <CardTitle className="text-sm text-primary">
              Popular Tags
            </CardTitle>
            <Tag className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-1">
              {metrics.topTags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-secondary"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Top categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tag Chart */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <CardTitle className="text-primary">
            Most Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tagData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(61, 107, 46, 0.15)"
              />
              <XAxis dataKey="name" stroke="#3D6B2E" />
              <YAxis stroke="#3D6B2E" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FAF8F3",
                  border: "1px solid rgba(61, 107, 46, 0.2)",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Post Moderation - FR-AD-500 */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <CardTitle className="text-primary">
            Post Moderation
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            All active posts displayed
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-primary">
                  Title
                </TableHead>
                <TableHead className="text-primary">
                  Author
                </TableHead>
                <TableHead className="text-primary">
                  Date
                </TableHead>
                <TableHead className="text-primary">
                  Status
                </TableHead>
                <TableHead className="text-primary">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow
                  key={post.id}
                  className="border-primary/10 hover:bg-secondary/20"
                >
                  <TableCell>{post.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.author}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {post.date}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "Flagged"
                          ? "destructive"
                          : "outline"
                      }
                      className={
                        post.status === "Active"
                          ? "border-primary text-primary bg-primary/10"
                          : ""
                      }
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-primary/10"
                      >
                        <Eye className="w-4 h-4 text-primary" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="shadow-sm"
                      >
                        <EyeOff className="w-4 h-4 mr-1" />
                        Hide
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Viewer - FR-AD-502 */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <CardTitle className="text-primary flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Global TimeBank Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-primary">
                  Date
                </TableHead>
                <TableHead className="text-primary">
                  From
                </TableHead>
                <TableHead className="text-primary">
                  To
                </TableHead>
                <TableHead className="text-primary">
                  Hours
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, index) => (
                <TableRow
                  key={index}
                  className="border-primary/10 hover:bg-secondary/20"
                >
                  <TableCell className="text-sm text-muted-foreground">
                    {tx.date}
                  </TableCell>
                  <TableCell>{tx.from}</TableCell>
                  <TableCell>{tx.to}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-primary text-primary bg-primary/10"
                    >
                      {tx.hours}h
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

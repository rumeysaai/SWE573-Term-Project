import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { SimpleTabs, SimpleTabsList, SimpleTabsTrigger, SimpleTabsContent } from "../components/ui/SimpleTabs";
import {
  Clock,
  User,
  Leaf,
  Sprout,
  MapPin,
  Shield,
  Award,
  Timer,
  Smile,
} from "lucide-react";

export default function Profile() {
  const providedServices = [
    {
      title: "Story Telling For Kids",
      hours: 4,
      date: "Oct 10, 2025",
      tags: ["Literature", "Book", "Story", "Novel"],
    },
    {
      title: "Web Design Consultation",
      hours: 2,
      date: "Feb 5, 2025",
      tags: ["Design", "Digital"],
    },
  ];

  const receivedServices = [
    {
      title: "Car Repair Assistance",
      hours: 2,
      date: "Jun 8, 2025",
      tags: ["Mechanics", "Repair"],
    },
    {
      title: "Home Baking Lessons",
      hours: 1,
      date: "Sep 30, 2025",
      tags: ["Cooking", "Education"],
    },
  ];

  const tagCloud = [
    "Literature",
    "Design",
    "Education",
    "Language",
    "Cooking",
    "Repair",
    "Digital",
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Info */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
              <User className="w-6 h-6" />
            </div>
            <CardTitle className="text-primary" style={{ fontWeight: 400 }}>Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* User Photo, Basic Info & Rating Categories */}
          <div className="flex flex-col lg:flex-row lg:items-stretch items-start gap-6">
            {/* Left Side: Avatar & Basic Info */}
            <div className="flex items-start gap-4 flex-1 w-full">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-md">
                <AvatarImage
                  src="https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMHdvbWFufGVufDF8fHx8MTc2MTAyOTM3Mnww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Pınar Deniz"
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  PD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Pınar Deniz</Label>
                    <p className="text-muted-foreground">StoryTeller_94</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Kadıköy, Istanbul</span>
                  </div>
                </div>
                {/* TimeBank Balance */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/30 p-4 rounded-xl border border-primary/30 mt-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      TimeBank Balance
                    </p>
                    <p className="text-2xl text-primary font-normal">3 Hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Rating Categories (Compact) */}
            <div className="w-full lg:w-auto lg:min-w-[320px] space-y-3 bg-gradient-to-r from-primary/5 to-secondary/10 p-4 rounded-xl border border-primary/20 flex flex-col">
              <h4 className="flex items-center gap-2 text-primary text-sm">
                <Award className="w-4 h-4" />
                Community Ratings
              </h4>
              <div className="space-y-3">
                {/* Reliability */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Shield className="w-3 h-3 text-primary" />
                      Reliability
                    </Label>
                    <span className="text-xs text-primary">4.8/5</span>
                  </div>
                  <Progress value={96} className="h-1.5" />
                </div>
                {/* Service Quality */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Award className="w-3 h-3 text-primary" />
                      Service Quality
                    </Label>
                    <span className="text-xs text-primary">4.9/5</span>
                  </div>
                  <Progress value={98} className="h-1.5" />
                </div>
                {/* Time Management */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Timer className="w-3 h-3 text-primary" />
                      Time Management
                    </Label>
                    <span className="text-xs text-primary">4.7/5</span>
                  </div>
                  <Progress value={94} className="h-1.5" />
                </div>
                {/* Friendliness */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Smile className="w-3 h-3 text-primary" />
                      Friendliness
                    </Label>
                    <span className="text-xs text-primary">5.0/5</span>
                  </div>
                  <Progress value={100} className="h-1.5" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contributions - FR-RA-402 */}
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
              <Leaf className="w-5 h-5" />
            </div>
            <CardTitle className="text-primary" style={{ fontWeight: 400 }}>
              Contributions to The Hive
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <SimpleTabs defaultValue="provided">
            <SimpleTabsList>
              <SimpleTabsTrigger value="provided">
                <Leaf className="w-4 h-4 mr-2" />
                Provided Services
              </SimpleTabsTrigger>
              <SimpleTabsTrigger value="received">
                <Sprout className="w-4 h-4 mr-2" />
                Received Services
              </SimpleTabsTrigger>
              <SimpleTabsTrigger value="history">
                <Clock className="w-4 h-4 mr-2" />
                Transaction History
              </SimpleTabsTrigger>
            </SimpleTabsList>

            <SimpleTabsContent value="provided" className="space-y-3 mt-6">
              {providedServices.map((service, index) => (
                <div
                  key={index}
                  className="border-2 border-primary/40 bg-primary/5 rounded-xl p-4 space-y-2 hover:border-primary/60 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-primary">{service.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.date}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-primary text-primary bg-primary/10"
                    >
                      {service.hours}h
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {service.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </SimpleTabsContent>

            <SimpleTabsContent value="received" className="space-y-3 mt-6">
              {receivedServices.map((service, index) => (
                <div
                  key={index}
                  className="border-2 border-accent/60 bg-accent/10 rounded-xl p-4 space-y-2 hover:border-accent/80 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-orange-600 font-medium">{service.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.date}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-accent text-orange-600 bg-accent/20"
                    >
                      {service.hours}h
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {service.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </SimpleTabsContent>

            <SimpleTabsContent value="history" className="space-y-3 mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                <p>No transaction history available yet.</p>
              </div>
            </SimpleTabsContent>
          </SimpleTabs>
        </CardContent>
      </Card>
    </div>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Heart, Clock, Sparkles, RefreshCw, Shield, Handshake } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            🐝 About The Hive: Time-Based Community Exchange
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Introduction */}
            <div>
              <p className="text-gray-700 leading-relaxed">
                The Hive is an entirely community-driven service platform that connects people by using time as the basic currency. This volunteer-based structure allows members to generously share their skills and time, building a stronger, more supportive, and mutual-aid ecosystem.
              </p>
            </div>

            {/* Mission */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                🌟 Our Mission: Bonds Built on Trust
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Our mission is to ensure that individuals feel valued within their own communities and can easily access the help they need. At The Hive, we believe that every individual has a skill, and every skill has a value. We are creating a space where these skills are exchanged not only for a financial cost but through mutual time exchange. Our goal is not just to facilitate the exchange of services, but also to build lasting bonds based on trust, respect, and solidarity among members.
              </p>
            </div>

            {/* How It Works */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                🔄 How It Works: Time, Our Valuable Currency
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The operation of The Hive is simple, transparent, and people-focused. Our platform allows members to either offer a service or request help from the community.
              </p>
              <div className="space-y-3 ml-4">
                <div>
                  <p className="font-medium text-gray-800">Service Provision:</p>
                  <p className="text-gray-700">Every hour you dedicate to others is credited to your TimeBank account as an equivalent hour.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Service Request:</p>
                  <p className="text-gray-700">You spend hours from your TimeBank balance for a service you need.</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                Every exchange is not just a transaction, but an act of mutual aid that nourishes the community spirit. This system strengthens individuals' interdependence and collective well-being.
              </p>
            </div>

            {/* TimeBank System */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                ⏳ TimeBank System: Discover the Value of Your Time
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The TimeBank system is the heart of The Hive. In this system, unlike traditional money, everyone's hour is of equal value. There is no difference in our system between one hour of gardening and one hour of web design assistance.
              </p>
              <div className="space-y-3 ml-4">
                <div>
                  <p className="font-medium text-gray-800">Initial Support:</p>
                  <p className="text-gray-700">Every new member who joins The Hive family receives a 3-hour starting bonus to immediately integrate into the community and make their first requests.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Balance Increase:</p>
                  <p className="text-gray-700">Every moment you spend helping others increases your TimeBank balance, creating security for your future needs.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Flexible Use:</p>
                  <p className="text-gray-700">You can use the time you earn to request any service on the platform, from any member. This creates a sustainable cycle where everyone can be both a giver and a receiver.</p>
                </div>
              </div>
            </div>

            {/* Community Values */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                🙏 Community Values: Who Are We?
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Hive is not just a platform; it is a vibrant community gathered around shared values. Our core values form the foundation of every interaction on the platform:
              </p>
              <div className="space-y-3 ml-4">
                <div className="flex items-start gap-2">
                  <Handshake className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Mutual Respect:</p>
                    <p className="text-gray-700">Every member's time and skill are equally valued.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Trust and Transparency:</p>
                    <p className="text-gray-700">All service exchanges are clearly tracked, and trust is built through a feedback mechanism.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Inclusivity:</p>
                    <p className="text-gray-700">Everyone's contribution is accepted, and every skill set is needed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Solidarity:</p>
                    <p className="text-gray-700">The desire to help and support each other is the driving force of our community.</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                Every member of The Hive is a vital part of this thriving ecosystem. Come, make your time your most valuable investment, and be a part of this unique community.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Heart, Clock, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>About The Hive</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Our Mission
              </h3>
              <p className="text-gray-600">
                The Hive is a community-oriented service offering platform that connects people through 
                time-based exchanges. We believe in building stronger communities by enabling members to 
                share their skills and services with one another.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                How It Works
              </h3>
              <p className="text-gray-600">
                Members can offer services or request help from the community. Every service exchange 
                is tracked through our TimeBank system, where time is the currency. Earn time by helping 
                others and spend it when you need assistance.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                TimeBank System
              </h3>
              <p className="text-gray-600">
                New members receive a starting bonus of 3 hours. You can earn more time by providing 
                services to others and use your time balance to request services you need.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Community Values
              </h3>
              <p className="text-gray-600">
                We foster a community built on trust, respect, and mutual support. Every member plays 
                a vital role in creating a thriving ecosystem where everyone can contribute and benefit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


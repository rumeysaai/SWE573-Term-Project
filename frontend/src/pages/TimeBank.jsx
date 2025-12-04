import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Clock } from 'lucide-react';
import { useAuth } from '../App';

export default function TimeBank() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary" />
            <CardTitle>TimeBank</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Your Current Balance</p>
              <p className="text-2xl font-bold text-primary">
                {user?.profile?.time_balance || 0} Hours
              </p>
            </div>
            <p className="text-gray-600">
              This page will contain information about the TimeBank system and how to earn and spend time credits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


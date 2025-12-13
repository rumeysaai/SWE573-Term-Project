import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { HelpCircle, Clock, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';

export default function FAQ() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            ❓ Frequently Asked Questions (FAQ) - TimeBank System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <p className="text-gray-700 leading-relaxed">
              Our TimeBank system forms the foundation of The Hive community. Here are the most frequently asked questions about how it works:
            </p>

            {/* Question 1 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                1. What is TimeBank and how does it work?
              </h3>
              <p className="text-gray-700 leading-relaxed ml-7">
                TimeBank is a mutual aid-based exchange system where time is used as the currency. The core principle of the system is this: Every hour you spend serving the community returns to your TimeBank account as one hour. You then use this accumulation to request services offered by others. Everyone's time is of equal value.
              </p>
            </div>

            {/* Question 2 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
                2. How do I earn time when I first join TimeBank?
              </h3>
              <p className="text-gray-700 leading-relaxed ml-7">
                New members are rewarded with a 3-hour starting bonus to easily adapt to The Hive community and create their first requests immediately. After using this starting balance, the only way to increase your balance is by providing services to others through the platform. For example, if you give a member a 1-hour English lesson, 1 hour is instantly added to your account.
              </p>
            </div>

            {/* Question 3 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <TrendingDown className="w-5 h-5 text-primary flex-shrink-0" />
                3. How is my time spent when I request a service?
              </h3>
              <p className="text-gray-700 leading-relaxed ml-7">
                When you request a service from a member and the service provider accepts it, the estimated duration of the service (e.g., 2 hours) is immediately deducted from your TimeBank balance. This deducted amount instantly appears as "Pending Credit" on the service provider's profile.
              </p>
              <p className="text-gray-700 leading-relaxed ml-7">
                This system ensures that the service provider's effort is guaranteed and maintains the consistency of the system by pre-reserving the requestor's balance. The transfer automatically and definitively occurs after the service is completed and mutually approved by both the requestor and the provider.
              </p>
            </div>

            {/* Question 4 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Users className="w-5 h-5 text-primary flex-shrink-0" />
                4. Is everyone's time truly of equal value?
              </h3>
              <p className="text-gray-700 leading-relaxed ml-7">
                Yes. At The Hive, one hour of legal consultation provided by a lawyer and one hour of gardening done by a student have the same value in the TimeBank system. This is a core value of ours that encourages contribution from everyone, regardless of expertise, and prioritizes social equality.
              </p>
            </div>

            {/* Question 5 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <DollarSign className="w-5 h-5 text-primary flex-shrink-0" />
                5. What are the TimeBank System Balance Limitations?
              </h3>
              <p className="text-gray-700 leading-relaxed ml-7 mb-4">
                The Hive aims to ensure that every member both receives and provides services. Therefore, our system has two important balance rules:
              </p>
              
              <div className="ml-7 space-y-4">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <p className="font-semibold text-gray-900 mb-2">Negative Balance Restriction (Minimum Balance: 0 Hours):</p>
                  <p className="text-gray-700">
                    Your TimeBank balance can never fall into the negative. Once your balance reaches 0 (zero) hours, you must first start providing services to the community and increase your balance before you can receive services again. This rule ensures the system remains in a continuous cycle of mutual aid.
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="font-semibold text-gray-900 mb-2">Maximum Balance Restriction (Maximum Balance: 10 Hours):</p>
                  <p className="text-gray-700">
                    Similarly, once your balance reaches 10 hours, you can no longer provide new services. To offer more services, you must start receiving services from the community using your accumulated time. This upper limit encourages members to actively use their time credits, meet their needs, and protects the system from becoming a structure composed solely of "givers" or solely of "receivers."
                  </p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed ml-7 mt-4">
                These balancing rules form the foundation for The Hive to remain a sustainable and active mutual exchange platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


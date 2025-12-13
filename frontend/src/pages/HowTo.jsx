import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Rocket, UserPlus, Lightbulb, Search, CheckCircle, Clock, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function HowTo() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" />
            🚀 How To Use The Hive & TimeBank System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <p className="text-gray-700 leading-relaxed">
              Welcome to The Hive! Our platform connects you with your community through time-based service exchange. Follow these simple steps to start earning and spending time credits.
            </p>

            {/* Section I */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">I. Getting Started: The 4 Steps to Hive Membership</h3>
              
              {/* Step 1 */}
              <div className="space-y-3 ml-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-900 mb-2">
                      <UserPlus className="w-5 h-5 text-primary" />
                      Step 1: Join The Hive Community
                    </h4>
                    <div className="space-y-2 ml-7">
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Register:</p>
                        <p className="text-gray-700 text-sm">
                          Sign up by providing your basic information and agreeing to the Terms of Service and Community Rules (including the TimeBank balance limits).
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Receive Your Bonus:</p>
                        <p className="text-gray-700 text-sm">
                          Your TimeBank account is immediately credited with a 3-hour starting bonus to help you initiate your first service request.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3 ml-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-900 mb-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      Step 2: Define Your Skills
                    </h4>
                    <div className="space-y-2 ml-7">
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Create Service Offers:</p>
                        <p className="text-gray-700 text-sm">
                          List the services you are willing to provide (e.g., teaching an hour of Spanish, helping with gardening, simple web support).
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Be Specific:</p>
                        <p className="text-gray-700 text-sm">
                          Clearly describe what the service includes and the estimated time duration (e.g., "1-hour beginner guitar lesson").
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3 ml-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-900 mb-2">
                      <Search className="w-5 h-5 text-primary" />
                      Step 3: Find Help or Offer Assistance
                    </h4>
                    <div className="space-y-2 ml-7">
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Request Service:</p>
                        <p className="text-gray-700 text-sm">
                          Use your initial bonus or earned time credits to search for services you need. Submit a request to a member who offers that skill.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Accept Offer:</p>
                        <p className="text-gray-700 text-sm">
                          If you are a Service Provider, review pending requests and accept the ones you can fulfill.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-3 ml-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-900 mb-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      Step 4: Complete the Exchange and Confirm Credit
                    </h4>
                    <div className="space-y-2 ml-7">
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Perform Service:</p>
                        <p className="text-gray-700 text-sm">
                          Complete the agreed-upon service in the time allotted.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 mb-1">Mutual Confirmation:</p>
                        <p className="text-gray-700 text-sm">
                          Both the Service Requester and the Service Provider must independently confirm the completion of the task for the time credit transfer to finalize.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section II */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">II. Understanding the TimeBank System Flow</h3>
              <p className="text-gray-700 leading-relaxed">
                The TimeBank system ensures a continuous and balanced cycle of giving and receiving. Remember: Time is our only currency, and everyone's time is valued equally.
              </p>
              <p className="text-gray-700 leading-relaxed">
                The entire platform revolves around a two-part loop that keeps your balance in check:
              </p>

              {/* Part A */}
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-900 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Part A: Earning Time (The Giving Phase)
                </h4>
                <p className="text-gray-700 text-sm mb-3">When you help another member:</p>
                <div className="space-y-2 ml-4">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-800">Offer & Acceptance:</p>
                      <p className="text-gray-700 text-sm">You agree to provide a service (e.g., 2 hours of dog walking).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-800">Service Delivery:</p>
                      <p className="text-gray-700 text-sm">You complete the 2 hours of service.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-800">Credit Received:</p>
                      <p className="text-gray-700 text-sm">Upon mutual confirmation, 2 hours are added to your TimeBank balance.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part B */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-900 mb-3">
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                  Part B: Spending Time (The Receiving Phase)
                </h4>
                <p className="text-gray-700 text-sm mb-3">When you receive help from another member:</p>
                <div className="space-y-2 ml-4">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-800">Request & Acceptance:</p>
                      <p className="text-gray-700 text-sm">You request a service (e.g., 2 hours of home repair).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-800">Pending Credit:</p>
                      <p className="text-gray-700 text-sm">2 hours are immediately deducted from your available balance and marked as 'Pending Credit' for the provider.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-800">Credit Spent:</p>
                      <p className="text-gray-700 text-sm">Upon mutual confirmation, the 2 hours are officially spent, and the credit is transferred to the provider.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagram Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                <AlertCircle className="w-5 h-5 text-primary" />
                🔁 The Hive TimeBank Sustainable Exchange Cycle
              </h3>
              <p className="text-gray-700 leading-relaxed">
                This diagram visually represents the mandatory steps and the equilibrium rules that drive The Hive community.
              </p>
              
              {/* Diagram Image */}
              <div className="flex justify-center my-6 bg-gray-50 p-4 rounded-lg border-2 border-primary/20">
                <img 
                  src="/images/timebank-diagram.png" 
                  alt="TimeBank System Flow Diagram" 
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxWidth: '800px' }}
                  onError={(e) => {
                    console.error('Failed to load diagram image');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Diagram Nodes Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Node 1: Offer a Service
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">Action: Share your skills and time.</p>
                  <p className="text-xs text-red-600 font-medium">Rule Check: Must be below 10 Hours Max Balance</p>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Node 2: Earn Time Credits
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">Action: Your TimeBank balance grows.</p>
                  <p className="text-xs text-gray-600">Link: Links back to Node 1 via the Max Balance Rule.</p>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" />
                    Node 3: Request Help
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">Action: Find services you need.</p>
                  <p className="text-xs text-red-600 font-medium">Rule Check: Must be above 0 Hours Min Balance</p>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-primary" />
                    Node 4: Spend Time Credits
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">Action: Receive community support.</p>
                  <p className="text-xs text-gray-600">Link: Links back to Node 3 via the Min Balance Rule.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


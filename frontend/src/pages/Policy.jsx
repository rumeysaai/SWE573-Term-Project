import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Database, Target, Share2, Lock, UserCheck } from 'lucide-react';

export default function Policy() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            🔒 The Hive Privacy Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy explains how your personal data is collected, used, and protected when you use The Hive platform. User security and privacy are our priority.
            </p>

            {/* Section 1 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Database className="w-5 h-5 text-primary flex-shrink-0" />
                1. Information We Collect
              </h3>
              <p className="text-gray-700 leading-relaxed ml-7 mb-3">
                The Platform collects the following types of information:
              </p>
              <div className="space-y-3 ml-7">
                <div>
                  <p className="font-medium text-gray-800 mb-1">1.1. Membership Information:</p>
                  <p className="text-gray-700 text-sm">
                    Name, surname, email address, password (in encrypted format), city/region of residence, and optionally, a profile picture.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">1.2. Service Information:</p>
                  <p className="text-gray-700 text-sm">
                    Records of services you offer and request, TimeBank transaction history, mutual approval records, and feedback.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">1.3. Technical Information:</p>
                  <p className="text-gray-700 text-sm">
                    Usage data such as IP address, browser type, access times, and duration spent on the Platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Target className="w-5 h-5 text-primary flex-shrink-0" />
                2. Purposes of Information Use
              </h3>
              <p className="text-gray-700 leading-relaxed ml-7 mb-3">
                Your collected personal data is primarily used for the following purposes:
              </p>
              <div className="space-y-2 ml-7">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-800">Service Provision:</p>
                    <p className="text-gray-700 text-sm">
                      To execute TimeBank transactions, make service matches, and ensure the functionality of the Platform.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-800">Communication:</p>
                    <p className="text-gray-700 text-sm">
                      To inform you about account management, security notifications, and important system updates.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-800">Security:</p>
                    <p className="text-gray-700 text-sm">
                      To verify user identities and prevent violations of the Community Rules and Terms of Service.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-800">Development:</p>
                    <p className="text-gray-700 text-sm">
                      To improve the user experience and optimize platform features.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Share2 className="w-5 h-5 text-primary flex-shrink-0" />
                3. Sharing of Information
              </h3>
              <p className="text-gray-700 leading-relaxed ml-7 mb-3">
                Your personal data will not be shared or sold to third parties, except in the limited circumstances outlined below:
              </p>
              <div className="space-y-3 ml-7">
                <div>
                  <p className="font-medium text-gray-800 mb-1">3.1. Intra-Community Sharing:</p>
                  <p className="text-gray-700 text-sm">
                    For the purpose of enabling service exchange, only your name, profile picture, and region of residence are shared with other relevant members when you make a service request or offer a service. Communication details such as your email address are not shared without your consent.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">3.2. Legal Requirements:</p>
                  <p className="text-gray-700 text-sm">
                    Your information may be shared with authorized bodies in the event of a valid court order, legal process, or legal obligation.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Lock className="w-5 h-5 text-primary flex-shrink-0" />
                4. Data Security
              </h3>
              <div className="ml-7">
                <p className="text-gray-700 leading-relaxed">
                  Technical and administrative security measures are implemented to protect your personal data against unauthorized access, alteration, disclosure, or destruction. Your passwords are stored in an irreversibly encrypted format. However, no internet transmission is 100% secure; therefore, we cannot guarantee absolute security.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <UserCheck className="w-5 h-5 text-primary flex-shrink-0" />
                5. User Rights
              </h3>
              <p className="text-gray-700 leading-relaxed ml-7 mb-3">
                You have the following rights over your own data:
              </p>
              <div className="space-y-2 ml-7">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-sm">
                    The right to access and rectify your data.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-sm">
                    The right to request the deletion of your data (as long as it does not affect our legal obligations).
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-sm">
                    The right to object to the processing of your data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


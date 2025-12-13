import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Users, Clock, AlertTriangle, XCircle } from 'lucide-react';

export default function ToS() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            The Hive Terms of Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <p className="text-gray-700 leading-relaxed font-medium">
              Please read these Terms of Service carefully. By registering for or using The Hive platform, you agree to the terms and conditions set forth below.
            </p>

            {/* Section 1 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                1. Introduction and Definitions
              </h3>
              <div className="space-y-2 ml-7">
                <div>
                  <p className="font-medium text-gray-800">Platform:</p>
                  <p className="text-gray-700 text-sm">Refers to The Hive website and mobile applications.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Service:</p>
                  <p className="text-gray-700 text-sm">Refers to the platform services that enable Users to conduct time exchanges via the TimeBank system.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">TimeBank Credit:</p>
                  <p className="text-gray-700 text-sm">Refers to the unit of time (hour) used as the medium of exchange on the Platform.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">User/Member:</p>
                  <p className="text-gray-700 text-sm">Refers to any natural person registered on the Platform and who has accepted the Terms of Service.</p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Users className="w-5 h-5 text-primary flex-shrink-0" />
                2. Membership and User Obligations
              </h3>
              <div className="space-y-3 ml-7">
                <div>
                  <p className="font-medium text-gray-800 mb-1">2.1. Registration:</p>
                  <p className="text-gray-700 text-sm">
                    Members are obliged to provide accurate, current, and complete personal information.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">2.2. Age Restriction:</p>
                  <p className="text-gray-700 text-sm">
                    Users must have reached the legal age of majority in their jurisdiction to use the Platform (e.g., 18 years for Turkey).
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">2.3. Compliance with Community Rules:</p>
                  <p className="text-gray-700 text-sm">
                    Users must always comply with The Hive Community Rules they have accepted. Violation of these rules may lead to the suspension or termination of membership.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">2.4. Voluntary Basis:</p>
                  <p className="text-gray-700 text-sm">
                    All service exchanges on the Platform are based on a voluntary principle. The Hive cannot be held liable for damages that may arise from service disputes between members.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                3. TimeBank Credit Rules
              </h3>
              <div className="space-y-3 ml-7">
                <div>
                  <p className="font-medium text-gray-800 mb-1">3.1. Credit Nature:</p>
                  <p className="text-gray-700 text-sm">
                    TimeBank Credit is solely a medium of exchange used for service exchange within The Hive Platform. This credit has no monetary value, cannot be converted to cash, sold, or transferred outside the Platform.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">3.2. Balance Limits:</p>
                  <p className="text-gray-700 text-sm">
                    Users must adhere to the minimum (0 hours) and maximum (10 hours) balance restrictions stated in the Community Rules.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">3.3. Cancellation and Refund:</p>
                  <p className="text-gray-700 text-sm">
                    In the event of the cancellation of an agreed-upon service, the deducted (pending) credit is automatically refunded. Credit transfers made after mutual confirmation that the service has been completed are irreversible.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <XCircle className="w-5 h-5 text-primary flex-shrink-0" />
                4. Termination and Suspension
              </h3>
              <div className="space-y-3 ml-7">
                <div>
                  <p className="font-medium text-gray-800 mb-2">4.1. The Hive's Right to Terminate:</p>
                  <p className="text-gray-700 text-sm mb-2">
                    The Hive reserves the right to immediately terminate or suspend membership, with or without notice, in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                    <li>Violation of these Terms of Service or the Community Rules.</li>
                    <li>Illegal, fraudulent, or malicious use of the Platform.</li>
                    <li>Disrespectful or harassing behavior toward other members.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">4.2. User's Right to Terminate:</p>
                  <p className="text-gray-700 text-sm">
                    Members may terminate their accounts at any time. Upon termination of the account, any remaining credits in the TimeBank balance are permanently reset to zero and will not be refunded.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0" />
                5. Disclaimer of Liability and Warranty
              </h3>
              <div className="ml-7">
                <p className="text-gray-700 leading-relaxed">
                  The Hive provides the Platform "as is" and makes no warranties. The Platform does not guarantee the quality of services or the outcomes of services provided by members. The Hive cannot be held responsible for indirect or direct damages resulting from the use of the Platform.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Leaf, Mail, HelpCircle, MessageCircle, FileText } from 'lucide-react';
import { Button } from './ui/button';

export function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  // Login/Register sayfalarında footer gösterme
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <footer className="bg-gradient-to-r from-primary/5 to-orange-500/10 border-t border-primary/20 mt-auto">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-primary font-semibold text-lg">The Hive</h3>
            </div>
            <p className="text-sm text-gray-600">
              Community-Oriented Service Offering Platform
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/home" className="text-sm text-gray-600 hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/post/new" className="text-sm text-gray-600 hover:text-primary transition-colors">
                Create Post
              </Link>
              <Link to="/forum" className="text-sm text-gray-600 hover:text-primary transition-colors">
                Community Forum
              </Link>
              <Link to="/my-profile" className="text-sm text-gray-600 hover:text-primary transition-colors">
                My Profile
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Support</h4>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                className="justify-start text-gray-600 hover:text-primary p-0 h-auto font-normal"
                onClick={() => {
                  // TODO: Implement contact functionality
                  console.log('Contact clicked');
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-gray-600 hover:text-primary p-0 h-auto font-normal"
                onClick={() => navigate('/faq')}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQ
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-gray-600 hover:text-primary p-0 h-auto font-normal"
                onClick={() => {
                  // TODO: Implement help functionality
                  console.log('Help clicked');
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Legal</h4>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                className="justify-start text-gray-600 hover:text-primary p-0 h-auto font-normal"
                onClick={() => navigate('/tos')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Terms of Service
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-gray-600 hover:text-primary p-0 h-auto font-normal"
                onClick={() => navigate('/policy')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Privacy Policy
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} The Hive. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Social media link clicked');
                }}
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Social media link clicked');
                }}
              >
                Facebook
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Social media link clicked');
                }}
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


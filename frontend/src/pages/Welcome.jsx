import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Leaf, ChevronRight, Mail, HelpCircle, MessageCircle, FileText } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigate = (path) => {
    setIsNavigating(true);
    // Add slide animation
    const container = document.querySelector('.welcome-container');
    if (container) {
      container.style.transform = 'translateX(-100%)';
      container.style.transition = 'transform 0.5s ease-in-out';
    }
    
    setTimeout(() => {
      navigate(path);
    }, 300);
  };

  return (
    <div className={`welcome-container relative min-h-screen w-full overflow-y-auto flex flex-col ${isNavigating ? 'slide-out' : ''}`}>
      {/* Background Image */}
      <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <div 
          className="absolute inset-0 bg-cover bg-center w-full h-full"
          style={{
            backgroundImage: 'url(/images/welcome.jpg)',
            minHeight: '100%',
          }}
        />
      </div>
      {/* Dark overlay for better text readability */}
      <div className="fixed inset-0 w-full h-full bg-black/40" style={{ zIndex: 0 }} />

      {/* Header */}
      <div className="relative z-20 w-full">
        <div className="w-full px-6 md:px-8 py-4 backdrop-blur-sm bg-white/20 border-b border-white/30">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-white font-bold text-xl drop-shadow-lg">The Hive</h3>
            </div>

            {/* Right side - Navigation Links */}
            <div className="flex items-center gap-6 mr-8 md:mr-12">
              <button
                onClick={() => handleNavigate('/login')}
                className="text-base font-medium text-white hover:text-blue-200 transition-colors drop-shadow-lg"
              >
                Home
              </button>
              <button
                onClick={() => handleNavigate('/login')}
                className="text-base font-medium text-white hover:text-blue-200 transition-colors drop-shadow-lg"
              >
                Forum
              </button>
              <button
                onClick={() => handleNavigate('/login')}
                className="text-base font-medium text-white hover:text-blue-200 transition-colors drop-shadow-lg"
              >
                How To
              </button>
              <button
                onClick={() => handleNavigate('/login')}
                className="text-base font-medium text-white hover:text-blue-200 transition-colors drop-shadow-lg"
              >
                About
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 pt-24 pb-28">
        
        {/* Stronger Together Title - Higher and Bigger */}
        <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-12 mt-8 drop-shadow-lg">
          Stronger Together :
        </h1>

        {/* Blurred Rectangle Container */}
        <div className="relative max-w-4xl w-full backdrop-blur-[2px] bg-white/20 rounded-2xl p-8 md:p-12 shadow-2xl border border-white/30">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <Leaf className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-blue-600">
              The Hive
            </h2>
          </div>

          {/* Subtext - Equal padding on left and right */}
          <div className="w-full px-4 md:px-8">
            <p className="text-lg lg:text-xl leading-relaxed text-left text-white drop-shadow-lg" style={{ textAlign: 'left', textIndent: 0, paddingLeft: 0 }}>
              Turn tasks you struggle with alone into easy wins with the power of community. Share your knowledge, build new friendships, and transform your time into good.
            </p>
            <p className="text-lg lg:text-xl leading-relaxed text-left text-white drop-shadow-lg mt-6" style={{ textAlign: 'left', textIndent: 0, paddingLeft: 0 }}>
              Here, no one has to face challenges by themselves; we lift each other up through every exchange. Join a network where your neighbors are your biggest supporters, and every hour given is an investment in a stronger, more connected neighborhood.
            </p>
          </div>
        </div>

        {/* Right Arrow Icon - Aligned to blurred div center */}
        <div className="absolute right-8 md:right-12 top-[55%] transform -translate-y-1/2 z-20 flex items-center">
          <button
            onClick={() => handleNavigate('/login')}
            className="w-16 h-16 bg-white/90 hover:bg-white text-blue-600 rounded-full shadow-lg flex items-center justify-center transform transition-all hover:scale-110 border border-blue-200"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-20 w-full mt-auto pt-24">
        <div className="w-full px-6 md:px-8 py-6 backdrop-blur-sm bg-white/20 border-t border-white/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Brand Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                  <Leaf className="w-5 h-5" />
                </div>
                <h3 className="text-white font-semibold text-lg drop-shadow-lg">The Hive</h3>
              </div>
              <p className="text-sm text-white/90 drop-shadow-md">
                Community-Oriented Service Offering Platform
              </p>
            </div>

            {/* Support */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white drop-shadow-lg">Support</h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleNavigate('/login')}
                  className="text-sm text-white/90 hover:text-white transition-colors drop-shadow-md flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact
                </button>
                <button
                  onClick={() => handleNavigate('/login')}
                  className="text-sm text-white/90 hover:text-white transition-colors drop-shadow-md flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  FAQ
                </button>
                <button
                  onClick={() => handleNavigate('/login')}
                  className="text-sm text-white/90 hover:text-white transition-colors drop-shadow-md flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Help
                </button>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white drop-shadow-lg">Legal</h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleNavigate('/login')}
                  className="text-sm text-white/90 hover:text-white transition-colors drop-shadow-md flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Terms of Service
                </button>
                <button
                  onClick={() => handleNavigate('/login')}
                  className="text-sm text-white/90 hover:text-white transition-colors drop-shadow-md flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-6 pt-4 border-t border-white/30">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white/80 drop-shadow-md">
                © {new Date().getFullYear()} The Hive. All rights reserved.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleNavigate('/login')}
                  className="text-sm text-white/80 hover:text-white transition-colors drop-shadow-md"
                >
                  Twitter
                </button>
                <button
                  onClick={() => handleNavigate('/login')}
                  className="text-sm text-white/80 hover:text-white transition-colors drop-shadow-md"
                >
                  Facebook
                </button>
                <button
                  onClick={() => handleNavigate('/login')}
                  className="text-sm text-white/80 hover:text-white transition-colors drop-shadow-md"
                >
                  LinkedIn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

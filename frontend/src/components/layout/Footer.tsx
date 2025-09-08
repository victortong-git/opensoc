import React from 'react';
import { Shield, Heart, Github, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-soc-dark-900 border-t border-soc-dark-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section - Logo and version */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-opensoc-600 rounded-md flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-white">OpenSOC</span>
              <span className="text-slate-400 ml-2">(Community POC Edition)</span>
            </div>
          </div>
          <span className="text-slate-600">•</span>
          <div className="text-xs text-slate-400">
            AI-Powered Micro Security Operations Center
          </div>
          <span className="text-slate-600">•</span>
          <div className="text-xs text-slate-400">
            <a
              href="https://openai.devpost.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-opensoc-400 transition-colors duration-200"
            >
              POC Build for OpenAI Hackathon project
            </a>
          </div>
        </div>

        {/* Right section - Links and copyright */}
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-4">
            <a
              href="https://github.com/victortong-git/open-soc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-opensoc-400 transition-colors duration-200"
            >
              <Github className="h-3 w-3" />
              <span>GitHub</span>
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="https://www.linkedin.com/in/vsctong/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-opensoc-400 transition-colors duration-200"
            >
              <Linkedin className="h-3 w-3" />
              <span>LinkedIn</span>
            </a>
            <span className="text-slate-600">•</span>
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-500" />
              <span>for Security Teams</span>
            </div>
          </div>
          
          <div className="text-xs text-slate-500">
            © {currentYear} OpenSOC Project
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
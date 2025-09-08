import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AISocConsultantPanel from '../chat/AISocConsultantPanel';
import { RootState } from '../../store';
import { toggleChat, setChatWidth } from '../../store/chatSlice';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { isOpen: isChatOpen, width: chatWidth } = useSelector((state: RootState) => state.chat);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleChatToggle = () => {
    dispatch(toggleChat());
  };

  const handleChatWidthChange = (width: number) => {
    dispatch(setChatWidth(width));
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-soc-dark-950">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block w-64 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={handleMobileSidebarClose}
          />
          {/* Sidebar */}
          <div className="relative w-64 h-full">
            <Sidebar onMobileClose={handleMobileSidebarClose} />
          </div>
        </div>
      )}
      
      {/* Main content container */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <div className="sticky top-0 z-40">
          <Navbar 
            onChatToggle={handleChatToggle} 
            isChatOpen={isChatOpen}
            onMobileSidebarToggle={handleMobileSidebarToggle}
            isMobileSidebarOpen={isMobileSidebarOpen}
          />
        </div>
        
        {/* Content area with chat panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex">
            {/* Page content */}
            <main 
              className="flex-1 bg-soc-dark-950 p-6 transition-all duration-300"
              style={{ 
                marginRight: isChatOpen ? `${chatWidth}px` : '0px'
              }}
            >
              {children}
            </main>

            {/* AI SOC Consultant Chat Panel */}
            <AISocConsultantPanel
              isOpen={isChatOpen}
              onClose={handleChatToggle}
              width={chatWidth}
              onWidthChange={handleChatWidthChange}
            />
          </div>
          
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
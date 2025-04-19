import React, { useState, useEffect } from "react";
import { BiLogOut } from "react-icons/bi";
import { CgCalendarDates } from "react-icons/cg";
import { LuUsersRound } from "react-icons/lu";
import { MdOutlineMedicalServices, MdDashboard, MdSettings } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

const SideBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    { path: "/", icon: <MdDashboard className="text-xl" />, label: "ادارة الخدمات" },
    { path: "/aservice", icon: <MdOutlineMedicalServices className="text-xl" />, label: "الخدمات" },
    { path: "/appointment", icon: <CgCalendarDates className="text-xl" />, label: "ادارة المواعيد" },
    { path: "/user", icon: <LuUsersRound className="text-xl" />, label: "اداره المستخدمين" },
    { path: "/settings", icon: <MdSettings className="text-xl" />, label: "الإعدادات" },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 ease-in-out z-50 shadow-xl
          ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          {isOpen && (
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-blue-700 transition-colors duration-200 focus:outline-none"
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isOpen ? <FaTimes className="text-white" /> : <FaBars className="text-white" />}
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="py-4 overflow-y-auto h-[calc(100%-4rem)]">
          <ul className="space-y-2 px-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleItemClick}
                  className={`flex items-center p-3 rounded-lg transition-all duration-200 group
                    ${isActive(item.path) 
                      ? 'bg-blue-700 text-white shadow-md' 
                      : 'text-blue-100 hover:bg-blue-700/50'}`}
                >
                  <div className={`${isOpen ? 'ml-3' : 'mx-auto'}`}>
                    {item.icon}
                  </div>
                  {isOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  {!isOpen && (
                    <div className="absolute right-0 mr-2 bg-blue-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-blue-700">
          <button
            className="flex items-center w-full p-3 rounded-lg text-blue-100 hover:bg-blue-700/50 transition-colors duration-200"
            onClick={() => {
              // Add logout logic here
              console.log("Logout clicked");
            }}
          >
            <BiLogOut className={`text-xl ${isOpen ? 'ml-3' : 'mx-auto'}`} />
            {isOpen && <span className="font-medium">تسجيل الخروج</span>}
          </button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className={`transition-all duration-300 ${isOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        {/* Your main content goes here */}
      </div>
    </>
  );
};

export default SideBar;

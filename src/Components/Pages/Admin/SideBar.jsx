import React, { useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { CgCalendarDates } from "react-icons/cg";
import { LuUsersRound } from "react-icons/lu";
import { MdOutlineMedicalServices } from "react-icons/md";
import { Link } from "react-router-dom";

const SideBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = () => {
    // يغلق الشريط الجانبي فقط إذا كان في وضع الهاتف
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex h-screen pt-[3.2rem] fixed">
      {/* Sidebar */}
      <div
        className={`fixed h-full bg-gray-800 text-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 w-48`}
      >
        <div className="p-4 text-xl font-bold border-b border-gray-700 pt-10 md:pt-3">
          Admin Panel
        </div>
        <ul className="mt-4 space-y-2">
          <li
            className="p-2 hover:bg-gray-700 cursor-pointer"
            onClick={handleItemClick}
          >
            <Link to="/">
              <div className="flex items-center gap-1">
                <MdOutlineMedicalServices />
                <span> ادارة الخدمات</span>
              </div>
            </Link>
          </li>
          <li
            className="p-2 hover:bg-gray-700 cursor-pointer"
            onClick={handleItemClick}
          >
            <Link to="appointment">
              <div className="flex items-center gap-1">
                <CgCalendarDates />
                <span> ادارة المواعيد</span>
              </div>
            </Link>
          </li>
          <li
            className="p-2 hover:bg-gray-700 cursor-pointer"
            onClick={handleItemClick}
          >
            <Link to="user">
              <div className="flex items-center gap-1">
                <LuUsersRound />
                <span>اداره المستخدمين</span>
              </div>
            </Link>
          </li>
        </ul>
      </div>

      {/* Toggle Button */}
      <button
        className="absolute z-50 text-white bg-gray-800 p-2 pr-4 pl-4 rounded-r-md md:hidden"
        onClick={toggleSidebar}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default SideBar;

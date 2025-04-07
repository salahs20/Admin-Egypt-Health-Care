import React from "react";
import { Route, Routes } from "react-router-dom";

import HeaderAdmin from "../Component/HeaderAdmin";
import ServiceTable from "../Pages/Admin/ServiceTable";
import AppointmentTable from "../Pages/Admin/AppointmentTable";
import UserTable from "../Pages/Admin/UserTable";
import SideBar from "../Pages/Admin/SideBar";
import Help from "../Pages/Admin/Help";

const AdminLayout = () => {
  return (
    <>
      <HeaderAdmin />
      <SideBar />
      <div className="pt-16  md:ps-[16rem] text-center text-blue-700 text-5xl font-mono font-bold">
        {" "}
        Hello Ya Admin
      </div>
      <Routes future={{ v7_startTransition: true }}>
        <Route path="/" element={<ServiceTable />} />
        <Route path="/appointment" element={<AppointmentTable />} />
        <Route path="/user" element={<UserTable />} />

      </Routes>
      <Help/>
    </>
  );
};

export default AdminLayout;

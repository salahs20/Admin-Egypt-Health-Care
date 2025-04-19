import React from "react";
import { Route, Routes } from "react-router-dom";


import SideBar from "../Pages/Admin/SideBar";
import AppointmentTable from "../Pages/Admin/AppointmentTable";
import AdminServices from "../Pages/Admin/AdminServices";
import ServiceTable from "../Pages/Admin/ServiceTable";
import UserTable from "../Pages/Admin/UserTable";
import Help from "../Pages/Admin/Help";

const HeaderAdmin = () => {
 
};

const AdminLayout = () => {
  return (
    <>
      <HeaderAdmin />
      <SideBar />
     
      <Routes future={{ v7_startTransition: true }}>
        <Route path="/" element={<ServiceTable />} />
        <Route path="/appointment" element={<AppointmentTable />} />
        <Route path="/user" element={<UserTable />} />
        <Route path="/aservice" element={<AdminServices />} />

      </Routes>
      <Help/>
    </>
  );
};

export default AdminLayout;

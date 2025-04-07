import React from "react";

import { Route, Routes } from "react-router-dom";
import AdminLayout from "./Components/AdminLayout/AdminLayout";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/*" element={<AdminLayout />} />
      </Routes>
    </>
  );
};

export default App;

import React from "react";
import logo from "./logo.svg";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";
import B9device from "./components/B9device";
import B9admin from "./components/B9deviceadmin";
import LayoutKho from "./components/LayoutKho";
import StorageLayout from "./components/StorageLayout";
import SeatingChart from "./components/HoiTruong";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/B9" element={<B9device />} />
        <Route path="/B9admin" element={<B9admin />} />
        <Route path="/LayoutKho" element={<LayoutKho />} />
        <Route path="/StorageLayout" element={<StorageLayout />} />
        <Route path="/SeatingChart" element={<SeatingChart eventId={1} />} />
        {/* Redirect all other paths to LayoutKho */}
        <Route path="*" element={<Navigate to="/StorageLayout" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

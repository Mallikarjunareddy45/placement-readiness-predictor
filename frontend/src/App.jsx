import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Technical from "./pages/Technical";
import Aptitude from "./pages/Aptitude";
import Resume from "./pages/Resume";
import Coding from "./pages/Coding";
import MockInterview from "./pages/MockInterview";
import Prediction from "./pages/Prediction";
import Admin from "./pages/Admin";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Nested client layout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/technical" element={<Technical />} />
          <Route path="/aptitude" element={<Aptitude />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/coding" element={<Coding />} />
          <Route path="/interview" element={<MockInterview />} />
          <Route path="/ai-interview" element={<MockInterview />} />
          <Route path="/predict" element={<Prediction />} />
        </Route>

        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
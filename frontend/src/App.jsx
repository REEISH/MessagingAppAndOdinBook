import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth onLogin={setUser} />} />
        <Route
          path="/"
          element={user ? <Dashboard user={user} /> : <Navigate to="/auth" />}
        />
        <Route
          path="/messages"
          element={user ? <Messages user={user} /> : <Navigate to="/auth" />}
        />
        <Route
          path="/user/:userId"
          element={
            user ? <Profile currentUser={user} /> : <Navigate to="/auth" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

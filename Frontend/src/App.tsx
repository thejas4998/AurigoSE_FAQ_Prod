import React, { JSX } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Home from './Pages/Home';
import QuestionDetail from './Pages/QuestionDetail';
import NewQuestion from './Pages/NewQuestion';
import CategoryQuestions from './Pages/CategoryQuestions';
import Layout from './Components/Layout';
import Login from './Pages/Login';
import SearchResults from './Pages/SearchResults';
// Dummy auth check (replace with real logic)
const isAuthenticated = () => {
  return !!localStorage.getItem('token'); // or use context/auth hook
};

// Protected route wrapper
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<Layout />}>
        <Route
          path="/"
          element={<PrivateRoute><Home /></PrivateRoute>}
        />
        <Route
          path="/categories/:categoryName"
          element={<PrivateRoute><CategoryQuestions /></PrivateRoute>}
        />
        <Route
          path="/questions/:id"
          element={<PrivateRoute><QuestionDetail /></PrivateRoute>}
        />
        <Route
          path="/ask"
          element={<PrivateRoute><NewQuestion /></PrivateRoute>}
        />
        <Route
          path="/search"
          element={<PrivateRoute><SearchResults /></PrivateRoute>}
        />
      </Route>

      {/* Catch-all route: redirect unknown routes to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
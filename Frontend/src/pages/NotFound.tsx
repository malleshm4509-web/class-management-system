import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => (
  <div className="container mx-auto p-6 text-center">
    <h1 className="text-3xl font-bold mb-4">Page not found</h1>
    <p className="mb-6">The page you are looking for does not exist.</p>
    <Link to="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded">Go home</Link>
  </div>
);

export default NotFound;

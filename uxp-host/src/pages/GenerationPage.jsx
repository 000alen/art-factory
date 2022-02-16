import React from "react";
import { Link } from "react-router-dom";

export function GenerationPage() {
  return (
    <div>
      <Link to="/">Home</Link>
      <Link to="/generation">Generation</Link>
      <Link to="/quality">Quality</Link>
      <Link to="/deploy">Deploy</Link>
      GenerationPage
    </div>
  );
}

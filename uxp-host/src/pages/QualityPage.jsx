import React from "react";
import { Link } from "react-router-dom";

export function QualityPage() {
  return (
    <div>
      <Link to="/">Home</Link>
      <Link to="/generation">Generation</Link>
      <Link to="/quality">Quality</Link>
      <Link to="/deploy">Deploy</Link>
      QualityPage
    </div>
  );
}

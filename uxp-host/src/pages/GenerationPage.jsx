import React from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

export function GenerationPage() {
  const { state } = useLocation();
  const { inputDir, outputDir, configuration } = state;

  return (
    <div>
      GenerationPage
      <br />
      {inputDir}
      <br />
      {outputDir}
      <br />
      {JSON.stringify(configuration)}
    </div>
  );
}

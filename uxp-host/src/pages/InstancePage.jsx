import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function InstancePage() {
  const navigator = useNavigate();
  const { state } = useLocation();
  const {
    id,
    attributes,
    inputDir,
    outputDir,
    configuration,
    contractAddress,
  } = state;

  return <div>InstancePage</div>;
}

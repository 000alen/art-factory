import React from "react";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const doc = app.activeDocument;

export function TestPanel() {
  const onClick = () => {};

  return (
    <div>
      <button onClick={onClick}>Test</button>
    </div>
  );
}

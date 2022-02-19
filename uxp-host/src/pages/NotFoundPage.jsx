import React from "react";

import Kodkod from "../images/kodkod.png";

export function NotFoundPage() {
  return (
    <div className="relative w-screen h-screen flex justify-center items-center">
      <img className="absolute opacity-5 -z-1" src={Kodkod} alt="A kodkod" />
      <h1 className="m-2 font-bold text-9xl select-none"> OMA WA MOU SHINDEIRU NANI?! </h1>
    </div>
  );
}

import React from "react";
import { Heading, Text, Button } from "@adobe/react-spectrum";

export function TestTab() {
  const onClickFactoryTest = () => {
    // window.ipcRenderer.once("factoryTestResult", ({ imagesCID, jsonCID }) => {
    //   console.log(imagesCID, jsonCID);
    // });

    // window.ipcRenderer.send(
    //   "factoryTest",
    //   "C:\\Users\\alenk\\Desktop\\art-factory\\uxp-host\\sample\\input",
    //   "C:\\Users\\alenk\\Desktop\\art-factory\\uxp-host\\sample\\output"
    // );
  };

  const onClickGetContract = () => {
    // window.ipcRenderer.once("getContractResult", (output) => {
    //   console.log(output);
    // });

    // window.ipcRenderer.send("getContract");
  };

  return (
    <>
      <Button marginTop={8} onPress={onClickFactoryTest}>
        Test Factory
      </Button>

      <Button marginTop={8} onPress={onClickGetContract}>
        Get Contract
      </Button>
    </>
  );
}

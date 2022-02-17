import React from "react";
import { Button } from "@adobe/react-spectrum";
import { useNavigate } from "react-router-dom";

export function TestTab() {
  const navigator = useNavigate();

  const onClickTest = async () => {
    navigator("/quality");
  };

  return (
    <>
      <Button marginTop={8} onPress={onClickTest}>
        Test
      </Button>
    </>
  );
}

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Button } from "@adobe/react-spectrum";
import Web3 from "web3";
import QRCode from "react-qr-code";

export function DeployPage() {
  const [provider, setProvider] = useState(null);
  const [web3, setWeb3] = useState(null);
  // const [qrUri, setQrUri] = useState(null);

  useEffect(() => {
    const _provider = new WalletConnectProvider({
      infuraId: "50adf8db20234b2d80ea3f1e23acef34",
      // qrcode: false,
    });

    // _provider.connector.on("display_uri", (err, payload) => {
    //   const uri = payload.params[0];
    //   setQrUri(uri);
    // });

    setProvider(_provider);
  }, []);

  const onClickConnect = async () => {
    await provider.enable();
    const _web3 = new Web3(provider);

    setWeb3(_web3);
  };

  return (
    <div>
      {/* {qrUri ? (
        <div className="w-screen h-screen flex justify-center items-center">
          <QRCode value={qrUri} />
        </div>
      ) : ( */}
        <>
          <Link to="/">Home</Link>
          <br />
          DeployPage
          <br />
          <Button onPress={onClickConnect}>Connect</Button>
        </>
      {/* )} */}
    </div>
  );
}

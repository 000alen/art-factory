import React from "react";
import { Flex } from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { TaskItem } from "./TaskItem";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { Contract, utils } from "ethers";
import { chopAddress } from "../utils";
// import { OpenSeaPort } from "opensea-js";

interface Panel721Props {
  task: (name: string, callback: (...args: any[]) => void) => () => void;
  contract: Contract;
  addOutput: (output: any) => void;
  // seaport: OpenSeaPort;
}

export const Panel721: React.FC<Panel721Props> = ({
  task,
  contract,
  addOutput,
  // seaport,
}) => {
  const onCost = task("cost", async () => {
    const cost = await contract.cost();

    addOutput({
      title: "Cost",
      text: utils.formatUnits(cost.toString(), "ether"),
      isCopiable: true,
    });
  });

  const onBalanceOf = task("balance of", async ({ address }) => {
    if (!address) return;

    const balance = await contract.balanceOf(address);

    addOutput({
      title: `Balance of ${chopAddress(address)}`,
      text: balance.toString(),
      isCopiable: true,
    });
  });

  const onTokenOfOwnerByIndex = task(
    "token of owner by index",
    async ({ address, index }) => {
      if (!address || !index) return;

      const n = await contract.tokenOfOwnerByIndex(address, index);

      addOutput({
        title: "Token of owner by index",
        text: n.toString(),
        isCopiable: true,
      });
    }
  );

  const onTokenURI = task("token URI", async ({ index }) => {
    if (!index) return;

    const uri = await contract.tokenURI(index);

    addOutput({
      title: "Token URI",
      text: uri,
      isCopiable: true,
    });
  });

  const onMint = task("mint", async ({ payable, mint }) => {
    if (!payable || !mint) return;

    let tx;
    // let receipt;

    tx = await contract.mint(mint, {
      value: utils.parseEther(payable),
    });
    // receipt =
    await tx.wait();

    addOutput({
      title: "Minted",
      text: mint.toString(),
      isCopiable: true,
    });
  });

  const onSetCost = task("set cost", async ({ cost }) => {
    if (!cost) return;

    let tx;
    // let receipt;

    tx = await contract.setCost(utils.parseEther(cost));
    // receipt =
    await tx.wait();

    addOutput({
      title: "Cost set",
      text: cost.toString(),
      isCopiable: true,
    });
  });

  const onSetMaxMintAmount = task("set max mint amount", async ({ amount }) => {
    if (!amount) return;

    let tx;
    // let receipt;

    tx = await contract.setMaxMintAmount(utils.parseEther(amount));
    // receipt =
    await tx.wait();

    addOutput({
      title: "Max mint amount set",
      text: amount.toString(),
      isCopiable: true,
    });
  });

  const onWithdraw = task("withdraw", async () => {
    let tx;
    // let receipt;

    tx = await contract.withdraw();
    // receipt =
    await tx.wait();

    addOutput({
      title: "Withdrawn",
      text: "true",
      isCopiable: true,
    });
  });

  const onSell = task("sell", async () => {
    // const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * 24);
    // const auction = await seaport.createSellOrder({
    //   expirationTime,
    //   accountAddress: "0xa4BfC85ad65428E600864C9d6C04065670996c1e",
    //   startAmount: 1,
    //   asset: {
    //     tokenId: "1",
    //     tokenAddress: contract.address,
    //   },
    // });

    addOutput({
      title: "Sell order created",
      text: "true",
      isCopiable: true,
    });
  });

  return (
    <>
      <Flex direction="column" gap="size-100">
        <TaskItem task="Cost" onRun={onCost} />
        <TaskItem
          task="Balance of"
          onRun={onBalanceOf}
          fields={[
            {
              key: "address",
              type: "address",
              label: "Address",
            },
          ]}
        />

        <TaskItem
          task="Token of owner by index"
          onRun={onTokenOfOwnerByIndex}
          fields={[
            {
              key: "address",
              type: "address",
              label: "Address",
            },
            {
              key: "index",
              type: "int",
              label: "Index",
            },
          ]}
        />

        <TaskItem
          task="Token URI"
          onRun={onTokenURI}
          fields={[
            {
              key: "index",
              type: "int",
              label: "Token Index",
            },
          ]}
        />
      </Flex>

      <Flex direction="column" gap="size-100">
        <TaskItem
          task="Mint"
          onRun={onMint}
          fields={[
            {
              key: "payable",
              type: "string",
              label: "Payable amount",
            },
            {
              key: "mint",
              type: "int",
              label: "Mint amount",
            },
          ]}
        />

        <TaskItem
          task="Set cost"
          onRun={onSetCost}
          fields={[
            {
              key: "cost",
              type: "string",
              label: "Cost",
            },
          ]}
        />

        <TaskItem
          task="Set max Mint amount"
          onRun={onSetMaxMintAmount}
          fields={[
            {
              key: "amount",
              type: "int",
              label: "Amount",
            },
          ]}
        />

        <TaskItem task="Withdraw" onRun={onWithdraw} />

        <TaskItem task="Sell" onRun={onSell} />
      </Flex>
    </>
  );
};

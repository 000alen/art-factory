import React, { useContext } from "react";
import { Flex } from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { TaskItem } from "./TaskItem";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { utils } from "ethers";
import { chopAddress } from "../utils";
import { GenericDialogContext } from "./GenericDialog";

export function Panel721({ contract, setIsLoading, addOutput }) {
  const genericDialogContext = useContext(GenericDialogContext);

  const onCost = async () => {
    setIsLoading(true);

    const cost = await contract.cost();

    addOutput({
      title: "Cost",
      text: utils.formatUnits(cost.toString(), "ether"),
      isCopiable: true,
    });

    setIsLoading(false);
  };

  const onBalanceOf = async ({ address }) => {
    if (!address) return;

    setIsLoading(true);

    const balance = await contract.balanceOf(address);

    addOutput({
      title: `Balance of ${chopAddress(address)}`,
      text: balance.toString(),
      isCopiable: true,
    });

    setIsLoading(false);
  };

  const onTokenOfOwnerByIndex = async ({ address, index }) => {
    if (!address || !index) return;

    setIsLoading(true);

    const n = await contract.tokenOfOwnerByIndex(address, index);

    addOutput({
      title: "Token of owner by index",
      text: n.toString(),
      isCopiable: true,
    });

    setIsLoading(false);
  };

  const onTokenURI = async ({ index }) => {
    if (!index) return;

    setIsLoading(true);

    const uri = await contract.tokenURI(index);

    addOutput({
      title: "Token URI",
      text: uri,
      isCopiable: true,
    });

    setIsLoading(false);
  };

  const onMint = async ({ payable, mint }) => {
    if (!payable || !mint) return;

    setIsLoading(true);

    let tx;
    // let receipt;

    try {
      tx = await contract.mint(mint, {
        value: utils.parseEther(payable),
      });
      // receipt =
      await tx.wait();
    } catch (error) {
      setIsLoading(false);
      genericDialogContext.show("Error", error.message, null);
      return;
    }

    addOutput({
      title: "Minted",
      text: mint.toString(),
      isCopiable: true,
    });

    setIsLoading(false);
  };

  const onSetCost = async ({ cost }) => {
    if (!cost) return;

    setIsLoading(true);

    let tx;
    // let receipt;

    try {
      tx = await contract.setCost(utils.parseEther(cost));
      // receipt =
      await tx.wait();
    } catch (error) {
      setIsLoading(false);
      genericDialogContext.show("Error", error.message, null);
      return;
    }

    addOutput({
      title: "Cost set",
      text: cost.toString(),
      isCopiable: true,
    });

    setIsLoading(false);
  };

  const onSetMaxMintAmount = async ({ amount }) => {
    if (!amount) return;

    setIsLoading(true);

    let tx;
    // let receipt;

    try {
      tx = await contract.setMaxMintAmount(utils.parseEther(amount));
      // receipt =
      await tx.wait();
    } catch (error) {
      setIsLoading(false);
      genericDialogContext.show("Error", error.message, null);
      return;
    }

    addOutput({
      title: "Max mint amount set",
      text: amount.toString(),
      isCopiable: true,
    });

    setIsLoading(false);
  };

  const onWithdraw = async () => {
    setIsLoading(true);

    let tx;
    // let receipt;

    try {
      tx = await contract.withdraw();
      // receipt =
      await tx.wait();
    } catch (error) {
      setIsLoading(false);
      genericDialogContext.show("Error", error.message, null);
      return;
    }

    addOutput({
      title: "Withdrawn",
      text: "true",
      isCopiable: true,
    });

    setIsLoading(false);
  };

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
      </Flex>
    </>
  );
}

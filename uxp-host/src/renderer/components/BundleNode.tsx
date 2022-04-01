import {
  ActionButton,
  ActionGroup,
  Flex,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  Text,
  TextField,
} from "@adobe/react-spectrum";
import React, { memo, RefObject, useState } from "react";
import { BundleNodeData } from "../typings";
import { ArrayOf } from "./ArrayOf";
import { ImageItem } from "./ImageItem";
import Remove from "@spectrum-icons/workflow/Remove";
import ChevronLeft from "@spectrum-icons/workflow/ChevronLeft";
import ChevronRight from "@spectrum-icons/workflow/ChevronRight";

export interface BundleNodeComponentData extends BundleNodeData {
  readonly factoryId: string;
  readonly bundleId: string;

  readonly composedUrls?: RefObject<Map<string, string>>;
  readonly renderIds?: RefObject<Map<string, string>>;
  readonly renderNodesHashes?: RefObject<Map<string, Set<string>>>;
  readonly ns?: RefObject<Map<string, number>>;

  onChangeBundle?: (id: string, value: string) => void;
}

interface BundleNodeProps {
  sidebar: boolean;
  id: string;
  data: BundleNodeComponentData;
}

interface BundleItemProps {
  value: string;
  composedUrls: Map<string, string>;
  renderIds: Map<string, string>;
  renderNodesHashes: Map<string, Set<string>>;
  ns: Map<string, number>;

  moveable: boolean;
  onChange: (value: string) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
}

export const BundleItem: React.FC<BundleItemProps> = memo(
  ({
    value,
    composedUrls,
    renderIds,
    onMoveDown,
    onMoveUp,
    onRemove,
    moveable,
  }) => {
    const onAction = (action: string) => {
      switch (action) {
        case "moveDown":
          return onMoveDown();
        case "moveUp":
          return onMoveUp();
        case "remove":
          return onRemove();
        default:
          break;
      }
    };

    return (
      <div className="w-48 p-3">
        <Flex direction="column" gap="size-100">
          <ImageItem src={composedUrls.get(value)} />
          <MenuTrigger>
            <ActionButton>{renderIds.get(value)}</ActionButton>
            <Menu
              items={[...renderIds.values()].map((renderId) => ({
                id: renderId,
                name: renderId,
              }))}
              selectionMode="single"
              disallowEmptySelection={true}
              selectedKeys={[composedUrls.get(value)]}
              // onSelectionChange={(selectedKeys) =>
              //   sidebar
              //     ? null
              //     : data.onChangeLayerId(
              //         id,
              //         [...selectedKeys].shift() as string
              //       )
              // }
            >
              {({ id, name }) => <Item key={id}>{name}</Item>}
            </Menu>
          </MenuTrigger>
          <ActionGroup overflowMode="collapse" onAction={onAction}>
            {moveable && (
              <Item key="moveUp">
                <ChevronLeft />
              </Item>
            )}
            {moveable && (
              <Item key="moveDown">
                <ChevronRight />
              </Item>
            )}
            <Item key="remove">
              <Remove />
            </Item>
          </ActionGroup>
        </Flex>
      </div>
    );
  }
);

export const BundleNode: React.FC<BundleNodeProps> =
  // memo(
  ({ sidebar, id, data }) => {
    const [items, setItems] = useState([]);

    const { composedUrls, renderIds, renderNodesHashes, ns } = data;

    const x = renderIds !== undefined && renderIds.current.size > 0;
    const hashes = x ? [...renderIds.current.keys()] : null;
    const emptyValue = x
      ? hashes[Math.floor(Math.random() * hashes.length)]
      : null;

    return (
      <div className="w-48 min-w-max p-3 border-1 border-dashed border-white rounded">
        {x ? (
          <ArrayOf
            width="100%"
            Component={(props) => <BundleItem {...props} />}
            props={{ composedUrls, renderIds, renderNodesHashes, ns }}
            label="Bundle"
            emptyValue={emptyValue}
            items={items}
            setItems={setItems}
            moveable={true}
            heading={true}
            border={false}
            direction="row"
          >
            <TextField label="Name" />
          </ArrayOf>
        ) : (
          <div className="h-48 flex justify-center items-center">
            <Text>Nothing to bundle yet</Text>
          </div>
        )}
      </div>
    );
  };
// );

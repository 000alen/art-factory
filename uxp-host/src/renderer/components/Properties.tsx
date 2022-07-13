import React, { useEffect } from "react";

import {
  ActionButton,
  Button,
  ButtonGroup,
  Heading,
  Item,
  Menu,
  MenuTrigger,
} from "@adobe/react-spectrum";

import { Collection, Trait } from "../typings";
import { QualityItem } from "../pages/QualityPage";

interface PropertiesProps {
  traits: Record<string, Trait[]>;
  filteredCollection: Collection;
  items: QualityItem[];
  selectedItem: string;
  onReplace: (n: string, traits: Trait[]) => void;
  onRegenerate: (n: string) => void;
  onEdit: (n: string) => void;
}

export const Properties: React.FC<PropertiesProps> = ({
  traits,
  filteredCollection,
  items,
  selectedItem,
  onReplace: _onReplace,
  onRegenerate: _onRegenerate,
  onEdit: _onEdit,
}) => {
  const [selectedTraits, setSelectedTraits] = React.useState<Trait[]>(null);

  useEffect(() => {
    if (filteredCollection.length > 0 && items.length > 0)
      setSelectedTraits(
        JSON.parse(
          JSON.stringify(
            filteredCollection.find((i) => i.name === selectedItem).traits
          )
        )
      );
  }, [filteredCollection, items, selectedItem]);

  const onSelectedTraitsChange = (n: string, v: string) =>
    setSelectedTraits((p) =>
      p.map((t) =>
        t.name === n
          ? {
              ...traits[n].find((t) => t.value === v),
              opacity: t.opacity,
              blending: t.blending,
            }
          : t
      )
    );

  const onReplace = () => _onReplace(selectedItem, selectedTraits);

  const onRegenerate = () => _onRegenerate(selectedItem);

  const onEdit = () => _onEdit(selectedItem);

  return (
    <>
      {items.length > 0 && filteredCollection.length > 0 && traits && (
        <>
          <Heading zIndex={1001} position="sticky" top={0} level={2}>
            {filteredCollection.find((i) => i.name === selectedItem).name}
          </Heading>
          {/* !!! TODO */}
          {selectedTraits &&
            selectedTraits.map(({ name, value }, i) => (
              <>
                <Heading>{name}</Heading>
                <MenuTrigger>
                  <ActionButton width="100%">{value}</ActionButton>
                  <Menu
                    items={traits[name].map(({ value }) => ({
                      id: value,
                      name: value,
                    }))}
                    selectionMode="single"
                    disallowEmptySelection={true}
                    selectedKeys={[value]}
                    onSelectionChange={(selectedKeys) => {
                      const selectedKey = [...selectedKeys].shift() as string;
                      onSelectedTraitsChange(name, selectedKey);
                    }}
                  >
                    {({ id, name }) => <Item key={id}>{name}</Item>}
                  </Menu>
                </MenuTrigger>
              </>
            ))}
        </>
      )}
      <ButtonGroup
        width="100%"
        zIndex={1001}
        position="sticky"
        bottom={0}
        align="end"
      >
        <Button variant="cta" onPress={onReplace}>
          Replace
        </Button>
        <Button variant="cta" onPress={onRegenerate}>
          Regenerate
        </Button>
        <Button variant="cta" onPress={onEdit}>
          Edit in Photoshop
        </Button>
      </ButtonGroup>
    </>
  );
};

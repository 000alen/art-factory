import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ActionButton,
  Button,
  ButtonGroup,
  Flex,
  Grid,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  NumberField,
  TabList,
  Tabs,
  View,
} from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";
import Folder from "@spectrum-icons/workflow/Folder";

import { useErrorHandler } from "../components/ErrorHandler";
import { Filters } from "../components/Filters";
import { ToolbarContext } from "../components/Toolbar";
import { UXPContext } from "../components/UXPContext";
import { BUILD_DIR_NAME, MAX_SIZE, PAGE_N } from "../constants";
import {
  factoryGetImage,
  factoryGetTraitsByLayerName,
  factoryRemoveItems,
  openInExplorer,
} from "../ipc";
import {
  Bundles,
  Collection,
  CollectionItem,
  Generation,
  Instance,
  Trait,
} from "../typings";
import {
  computeGenerationRepeats,
  regenerateItems,
  replaceItems,
} from "../commands";
import { GalleryBundles } from "../components/GalleryBundles";
import { GalleryItems } from "../components/GalleryItems";

interface QualityPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  generationId: string;
  dirty: boolean;
}

type Filters = Record<string, string[]>;

interface Item {
  name: string;
  url: string;
}

export interface BundleItem {
  bundleName: string;
  names: string[];
  urls: string[];
}

export type setter<T> = (value: T | ((p: T) => T)) => void;

export const QualityPage = () => {
  const toolbarContext = useContext(ToolbarContext);
  const uxpContext = useContext(UXPContext);
  const navigate = useNavigate();
  const { state } = useLocation();
  const task = useErrorHandler();

  const {
    projectDir,
    instance,
    id,
    generationId,
    dirty: _dirty,
  } = state as QualityPageState;
  const { configuration, generations } = instance;

  const [dirty, setDirty] = useState(_dirty);

  const [selectedTab, setSelectedTab] = useState("items");

  const [generation] = useState(
    generations.find((generation) => generation.id === generationId)
  );
  const [name] = useState(generation.name);
  const [collection, setCollection] = useState(generation.collection);
  const [bundles] = useState(generation.bundles);
  const [traits, setTraits] = useState<Record<string, Trait[]>>(null);

  const [filtersInfo, setFiltersInfo] = useState<Filters>({});
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [filteredCollection, setFilteredCollection] =
    useState<Collection>(collection);
  const [items, setItems] = useState<Item[]>([]);

  const [selectedItem, setSelectedItem] = useState(0);
  const [selectedItemTraits, setSelectedItemTraits] = useState<Trait[]>(
    JSON.parse(JSON.stringify(filteredCollection[selectedItem].traits))
  );
  const [itemsToRemove, setItemsToRemove] = useState<string[]>([]);

  const [repeatedFilter, setRepeatedFilter] = useState<boolean>(false);
  const [stringFilter, setStringFilter] = useState<string>(null);

  const [bundlesFiltersInfo, setBundlesFiltersInfo] = useState<string[]>([]);
  const [bundlesFilters, setBundlesFilters] = useState<string[]>([]);
  const [bundlesPage, setBundlesPage] = useState(1);
  const [bundlesMaxPage, setBundlesMaxPage] = useState(1);
  const [filteredBundles, setFilteredBundles] = useState<Bundles>(bundles);
  const [bundlesItems, setBundleSItems] = useState<BundleItem[]>([]);

  // #region One-time setups
  // ? Toolbar setup
  useEffect(() => {
    toolbarContext.addButton("back", "Back", <Back />, () => onBack());
    toolbarContext.addButton(
      "open-explorer",
      "Open in Explorer",
      <Folder />,
      () => {
        openInExplorer(projectDir, BUILD_DIR_NAME, "images", name);
      }
    );

    return () => {
      toolbarContext.removeButton("back");
      toolbarContext.removeButton("open-explorer");
    };
  }, []);

  // ? Traits setup
  useEffect(() => {
    task("traits", async () => {
      setTraits(
        Object.fromEntries(
          await Promise.all(
            configuration.layers.map(async (layerName) => [
              layerName,
              await factoryGetTraitsByLayerName(id, layerName),
            ])
          )
        )
      );
    })();
  }, []);
  // #endregion

  // #region UXP setup
  // ? UXP setup
  // useEffect(() => {
  //   const uxpReload = async ({ name: itemName }: { name: string }) => {
  //     if (filteredCollection.some((item) => item.name === itemName)) {
  //       const url = `data:image/png;base64,${await factoryGetImage(
  //         id,
  //         generation,
  //         collection.find((collectionItem) => collectionItem.name === itemName),
  //         MAX_SIZE
  //       )}`;
  //       reload(itemName, url);
  //     }
  //     return () => {
  //       uxpContext.off("uxp-reload", uxpReload);
  //     };
  //   };
  // }, []);

  const onEdit = (i: number) => {
    uxpContext.hostEdit({
      width: configuration.width,
      height: configuration.height,
      ...filteredCollection[i],
    });
  };

  // #endregion

  // ? Collection filters setup
  useEffect(() => {
    const filtersInfo: Filters = {};
    for (const { traits } of collection)
      for (const { name, value } of traits)
        if (name in filtersInfo && !filtersInfo[name].includes(value))
          filtersInfo[name].push(value);
        else if (!(name in filtersInfo)) filtersInfo[name] = [value];

    setFiltersInfo(filtersInfo);
  }, [collection]);

  // ? Bundles filters setup
  useEffect(() => {
    const bundlesFiltersInfo: string[] = [];
    for (const { name } of bundles)
      if (!bundlesFiltersInfo.includes(name)) bundlesFiltersInfo.push(name);
    setBundlesFiltersInfo(bundlesFiltersInfo);
  }, [bundles]);

  // ? Collection filtering
  useEffect(() => {
    let filteredCollection = Object.entries(filters)
      .reduce((filtered, [name, values]) => {
        console.log(filtered, name, values);

        if (values.length === 0) return filtered;
        else
          return filtered.filter(({ traits }) =>
            traits.some(
              ({ name: n, value: v }) => n === name && values.includes(v)
            )
          );
      }, collection)
      .filter(({ name }) =>
        stringFilter ? name.includes(stringFilter) : true
      );

    if (repeatedFilter)
      filteredCollection = computeGenerationRepeats({
        collection: filteredCollection,
      } as Generation);

    setPage(1);
    setSelectedItem(0);
    setMaxPage(Math.ceil(filteredCollection.length / PAGE_N));
    setFilteredCollection(filteredCollection);
  }, [collection, filters, stringFilter, repeatedFilter]);

  // ? Bundles filtering
  useEffect(() => {
    const filteredBundles = bundles
      .filter(({ name }) => bundlesFilters.includes(name))
      .filter(({ name }) => name.includes(stringFilter));

    setBundlesPage(1);
    setBundlesMaxPage(Math.ceil(filteredBundles.length / PAGE_N));
    setFilteredBundles(filteredBundles);
  }, [bundles, bundlesFilters, stringFilter]);

  const loadPreviews = task("loading previews", async () => {
    const items = (
      await Promise.all(
        Array.from({ length: PAGE_N }).map(async (_, i) => {
          const cursor = (page - 1) * PAGE_N;

          if (cursor + i >= filteredCollection.length) return null;
          const collectionItem = filteredCollection[
            cursor + i
          ] as CollectionItem;
          const url = `data:image/png;base64,${await factoryGetImage(
            id,
            generation,
            collectionItem,
            MAX_SIZE
          )}`;
          return { name: collectionItem.name, url };
        })
      )
    ).filter((item) => item !== null);

    setItems(items);
  });

  useEffect(() => {
    loadPreviews();
  }, [filteredCollection, page]);

  const loadBundlesPreviews = task("loading bundles previews", async () => {
    const flatFilteredBundles: { name: string; ids: string[] }[] = [];
    for (const { name, ids } of filteredBundles)
      flatFilteredBundles.push(...ids.map((ids) => ({ name, ids })));

    const bundlesItems = (
      await Promise.all(
        Array.from({ length: PAGE_N }).map(async (_, i) => {
          const bundlesCursor = (bundlesPage - 1) * PAGE_N;

          if (bundlesCursor + i >= flatFilteredBundles.length) return null;
          const { ids: names, name: bundleName } =
            flatFilteredBundles[bundlesCursor + i];
          const collectionItems = names.map((id) =>
            collection.find((item) => item.name === id)
          );
          const base64Strings = await Promise.all(
            collectionItems.map((collectionItem) =>
              factoryGetImage(id, generation, collectionItem, MAX_SIZE)
            )
          );
          const urls = base64Strings.map(
            (b64) => `data:image/png;base64,${b64}`
          );
          return { bundleName, names, urls };
        })
      )
    ).filter((item) => item !== null);
    setBundleSItems(bundlesItems);
  });

  useEffect(() => {
    loadBundlesPreviews();
  }, [filteredBundles, bundlesPage]);

  const onBack = () =>
    navigate("/factory", { state: { projectDir, instance, id, dirty } });

  const onSave = task("filtering", async () => {
    const _collectionItemsToRemove: Collection = itemsToRemove.map((name) =>
      collection.find((collectionItem) => collectionItem.name === name)
    );
    const _collection = await factoryRemoveItems(
      id,
      generation,
      _collectionItemsToRemove
    );

    let generations = instance.generations.map((generation) =>
      generation.id === generationId
        ? { ...generation, collection: _collection }
        : generation
    );

    generations = JSON.parse(JSON.stringify(generations));

    navigate("/factory", {
      state: {
        projectDir,
        instance: { ...instance, generations },
        id,
        dirty,
      },
    });
  });

  // ? TODO
  // const reload = (name: string, url: string) =>
  //   setItems((prevItems) =>
  //     prevItems.map((item) => (item.name === name ? { name, url } : item))
  //   );

  // #region Selected Item
  const onSelect = (i: number) => {
    setSelectedItem(i);
    setSelectedItemTraits(
      JSON.parse(JSON.stringify(filteredCollection[selectedItem].traits))
    );
  };

  const onSelectedTraitChange = (name: string, value: string) => {
    setSelectedItemTraits((prevTraits) =>
      prevTraits.map((trait) =>
        trait.name === name ? { ...trait, value } : trait
      )
    );
  };
  // #endregion

  const addFilter = (name: string, value: string) =>
    setFilters((prevFilters) =>
      name in prevFilters
        ? {
            ...prevFilters,
            [name]: [...prevFilters[name], value],
          }
        : {
            ...prevFilters,
            [name]: [value],
          }
    );

  const hasFilter = (name: string, value: string) =>
    name in filters && filters[name].includes(value);

  const removeFilter = (name: string, value: string) =>
    setFilters((prevFilters) =>
      name in prevFilters
        ? {
            ...prevFilters,
            [name]: prevFilters[name].filter((v) => v !== value),
          }
        : prevFilters
    );

  const addBundlesFilter = (bundle: string) =>
    setBundlesFilters((prevFilters) => [...prevFilters, bundle]);

  const removeBundlesFilter = (bundle: string) =>
    setBundlesFilters((prevFilters) => prevFilters.filter((v) => v !== bundle));

  const onRemoveRepeated = () =>
    computeGenerationRepeats(generation).forEach(({ name }) => onRemove(name));

  const onRemove = (name: string) =>
    setItemsToRemove((prevItemsToRemove) => [...prevItemsToRemove, name]);

  const onUndoRemove = (name: string) =>
    setItemsToRemove((prevItemsToRemove) =>
      prevItemsToRemove.filter((n) => n !== name)
    );

  const onRegenerateRepeated = async () => {
    const { collection } = await regenerateItems(
      id,
      generation,
      computeGenerationRepeats(generation)
    );
    setCollection(collection);
  };

  const onRegenerate = async (i: number) => {
    const { collection } = await regenerateItems(id, generation, [
      filteredCollection[i],
    ]);
    setCollection(collection);
  };

  const onReplace = async (i: number, traits: Trait[]) => {
    const { collection } = await replaceItems(id, generation, [
      {
        name: filteredCollection[i].name,
        traits,
      },
    ]);
    setCollection(collection);
  };

  return (
    <Grid
      UNSAFE_className="overflow-hidden"
      areas={["left center right"]}
      columns={["1fr", "4fr", "1fr"]}
      rows={["auto"]}
      height="100%"
      gap="size-100"
      margin="size-100"
    >
      <View UNSAFE_className="p-2 space-y-2" gridArea="left" overflow="auto">
        <Filters
          {...{
            setStringFilter,
            repeatedFilter,
            setRepeatedFilter,
            onRegenerateRepeated,
            onRemoveRepeated,
            bundlesFiltersInfo,
            bundlesFilters,
            addBundlesFilter,
            removeBundlesFilter,
            filtersInfo,
            hasFilter,
            addFilter,
            removeFilter,
          }}
        />
      </View>

      <View UNSAFE_className="p-2 space-y-2" gridArea="center" overflow="auto">
        <Flex
          zIndex={1001}
          position="sticky"
          top={0}
          gap="size-100"
          alignItems="center"
          justifyContent="space-between"
        >
          <Tabs
            isQuiet={true}
            selectedKey={selectedTab}
            onSelectionChange={(selectedKey) =>
              setSelectedTab(selectedKey as string)
            }
          >
            <TabList>
              <Item key="items">Items</Item>
              <Item key="bundles">Bundles</Item>
            </TabList>
          </Tabs>

          <Flex
            width="100%"
            gap="size-100"
            justifyContent="end"
            alignItems="center"
          >
            Page{" "}
            <NumberField
              aria-label="page"
              value={
                selectedTab === "items"
                  ? page
                  : selectedTab === "bundles"
                  ? bundlesPage
                  : 0
              }
              minValue={1}
              maxValue={
                selectedTab === "items"
                  ? maxPage
                  : selectedTab === "bundles"
                  ? bundlesMaxPage
                  : 0
              }
              onChange={(value: number) => {
                if (selectedTab === "items") setPage(value);
                else if (selectedTab === "bundles") setBundlesPage(value);
              }}
            />{" "}
            of{" "}
            {selectedTab === "items"
              ? maxPage
              : selectedTab === "bundles"
              ? bundlesMaxPage
              : 0}
          </Flex>
        </Flex>

        {selectedTab === "items" ? (
          <GalleryItems
            {...{
              selectedItem,
              items,
              itemsToRemove,
              onRemove,
              onUndoRemove,
              onEdit,
              onSelect,
              onRegenerate,
            }}
          />
        ) : selectedTab === "bundles" ? (
          <GalleryBundles
            {...{
              bundlesItems,
            }}
          />
        ) : null}
      </View>

      <View UNSAFE_className="p-2 space-y-2" gridArea="right" overflow="auto">
        {filteredCollection.length > 0 && traits && (
          <>
            <Heading zIndex={1001} position="sticky" top={0} level={1}>
              {filteredCollection[selectedItem].name}
            </Heading>
            {selectedItemTraits.map(({ name, value }, i) => (
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
                    onSelectionChange={(selectedKeys) =>
                      onSelectedTraitChange(
                        name,
                        [...selectedKeys].shift() as string
                      )
                    }
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
          <Button
            variant="cta"
            onPress={() => onReplace(selectedItem, selectedItemTraits)}
          >
            Replace
          </Button>
          <Button variant="cta">Regenerate</Button>
        </ButtonGroup>
      </View>
    </Grid>
  );
};

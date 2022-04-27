import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ActionButton,
  Flex,
  Grid,
  Heading,
  Item,
  NumberField,
  TabList,
  Tabs,
  View,
} from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";
import Folder from "@spectrum-icons/workflow/Folder";
import SaveFloppy from "@spectrum-icons/workflow/SaveFloppy";

import {
  computeGenerationRepeats,
  regenerateItems,
  replaceItems,
} from "../commands";
import { useErrorHandler } from "../components/ErrorHandler";
import { Filters } from "../components/Filters";
import { GalleryBundles } from "../components/GalleryBundles";
import { GalleryItems } from "../components/GalleryItems";
import { Loading } from "../components/Loading";
import { Properties } from "../components/Properties";
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

interface QualityPageState {
  projectDir: string;
  id: string;
  instance: Instance;
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

export const QualityPage = () => {
  const toolbarContext = useContext(ToolbarContext);
  const uxpContext = useContext(UXPContext);
  const navigate = useNavigate();
  const { state } = useLocation();

  const [working, setWorking] = useState(false);
  const [workingTitle, setWorkingTitle] = useState("");

  const {
    projectDir,
    id,
    instance,
    generationId,
    dirty: _dirty,
  } = state as QualityPageState;

  const { configuration, generations, sources } = instance;

  // const [dirty, setDirty] = useState(_dirty);
  const [dirty] = useState(_dirty);

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
  const [itemsToRemove, setItemsToRemove] = useState<string[]>([]);

  const [repeatedFilter, setRepeatedFilter] = useState<boolean>(false);
  const [stringFilter, setStringFilter] = useState<string>(null);

  const [bundlesFiltersInfo, setBundlesFiltersInfo] = useState<string[]>([]);
  const [bundlesFilters, setBundlesFilters] = useState<string[]>([]);
  const [bundlesPage, setBundlesPage] = useState(1);
  const [bundlesMaxPage, setBundlesMaxPage] = useState(1);
  const [filteredBundles, setFilteredBundles] = useState<Bundles>(bundles);
  const [bundlesItems, setBundleSItems] = useState<BundleItem[]>([]);
  const task = useErrorHandler(setWorking);

  // ? Toolbar setup
  useEffect(() => {
    toolbarContext.addButton("back", "Back", <Back />, () => onBack());
    toolbarContext.addButton(
      "open-explorer",
      "Open in Explorer",
      <Folder />,
      () => openInExplorer(projectDir, BUILD_DIR_NAME, "images", name)
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

  // #region UXP setup
  useEffect(() => {
    // const uxpReload = async () => loadPreviews();
    const uxpReload = async () => {};

    uxpContext.on("uxp-reload", uxpReload);

    return () => {
      uxpContext.off("uxp-reload", uxpReload);
    };
  }, []);

  const onEdit = task("edit", async (i: number) => {
    const { name, traits } = filteredCollection[i];
    const traitsSources = traits.map((trait) =>
      sources.find(({ items }) =>
        items.some(
          ({ name, value }) => trait.name === name && trait.value === value
        )
      )
    );
    const photoshopTraitsLayers = traits.map(
      (trait, i) =>
        traitsSources[i].items.find(
          (item) => item.name === trait.name && item.value === trait.value
        ).photoshopTraitLayer
    );
    const layers = traits.map((trait, i) => ({
      document: traitsSources[i].name,
      photoshopTraitLayer: photoshopTraitsLayers[i],
      name: trait.name,
      value: trait.value,
    }));

    uxpContext.hostEdit({
      width: configuration.width,
      height: configuration.height,
      name,
      generation: generation.name,
      layers,
    });
  });
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
    navigate("/factory", { state: { projectDir, id, instance, dirty } });

  const onSave = task("filtering", async () => {
    setWorkingTitle("Saving...");
    const { collection: _collection, drops: _drops } = await factoryRemoveItems(
      id,
      generation,
      itemsToRemove.map((name) => collection.find((item) => item.name === name))
    );

    const generations = instance.generations.map((generation) =>
      generation.id === generationId
        ? { ...generation, collection: _collection, drops: _drops }
        : generation
    );

    navigate("/factory", {
      state: {
        projectDir,
        id,
        instance: {
          ...instance,
          generations,
        },
        dirty,
      },
    });
  });

  const onSelect = (i: number) => setSelectedItem(i);

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

  const onRegenerateRepeated = task("regenerating repeated", async () => {
    setWorkingTitle("Regenerating repeated...");
    const { collection: _collection } = await regenerateItems(
      id,
      { ...generation, collection },
      computeGenerationRepeats(generation)
    );
    setCollection(_collection);
  });

  const onRegenerate = task("regenerating", async (i: number) => {
    setWorkingTitle("Regenerating item...");
    const { collection: _collection } = await regenerateItems(
      id,
      { ...generation, collection },
      [filteredCollection[i]]
    );
    setCollection(_collection);
  });

  const onReplace = task("replacing", async (i: number, traits: Trait[]) => {
    setWorkingTitle("Replacing traits...");
    const { collection: _collection } = await replaceItems(
      id,
      { ...generation, collection },
      [
        {
          ...filteredCollection[i],
          traits,
        },
      ]
    );
    setCollection(_collection);
  });

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
      {working && <Loading title={workingTitle} />}

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
        <Flex gap="size-100" alignItems="center">
          <Heading level={1}>
            {dirty && "*"} {configuration.name}
          </Heading>

          <ActionButton onPress={onSave}>
            <SaveFloppy />
          </ActionButton>
        </Flex>

        <Properties
          traits={traits}
          filteredCollection={filteredCollection}
          selectedItem={selectedItem}
          onReplace={onReplace}
          onRegenerate={onRegenerate}
          onEdit={onEdit}
        />
      </View>
    </Grid>
  );
};

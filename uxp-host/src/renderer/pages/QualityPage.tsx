import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ActionGroup,
  Button,
  ButtonGroup,
  Flex,
  Grid,
  Heading,
  Item,
  TextField,
  View,
} from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";
import ChevronLeft from "@spectrum-icons/workflow/ChevronLeft";
import ChevronRight from "@spectrum-icons/workflow/ChevronRight";
import Close from "@spectrum-icons/workflow/Close";
import Folder from "@spectrum-icons/workflow/Folder";

import { useErrorHandler } from "../components/ErrorHandler";
import { Filters } from "../components/Filters";
import { Gallery } from "../components/Gallery";
import { ImageItem } from "../components/ImageItem";
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
  Instance,
  Trait,
} from "../typings";
import { hash } from "../utils";
import { regenerateItems } from "../commands";

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

  const [_generation] = useState(
    generations.find((generation) => generation.id === generationId)
  );

  const [name] = useState(_generation.name);
  const [collection, setCollection] = useState(_generation.collection);
  const [bundles, setBundles] = useState(_generation.bundles);

  const [traits, setTraits] = useState<Record<string, Trait[]>>(null);
  const [collectionFiltersInfo, setCollectionFiltersInfo] = useState<Filters>(
    {}
  );
  const [collectionFilters, setCollectionFilters] = useState<Filters>({});
  const [collectionCursor, setCollectionCursor] = useState(0);
  const [collectionPage, setCollectionPage] = useState(1);
  const [collectionMaxPage, setCollectionMaxPage] = useState(1);
  const [filteredCollection, setFilteredCollection] = useState<Collection>(
    generations.find((generation) => generation.id === generationId).collection
  );
  const [collectionItems, setCollectionItems] = useState<Item[]>([]);
  const [selectedCollectionItem, setSelectedCollectionItem] = useState(0);
  const [collectionItemsToRemove, setCollectionItemsToRemove] = useState<
    string[]
  >([]);
  const [collectionRepeatedFilter, setCollectionRepeatedFilter] =
    useState<boolean>(false);
  const [stringFilter, setStringFilter] = useState<string>(null);

  const [bundlesFiltersInfo, setBundlesFiltersInfo] = useState<string[]>([]);
  const [bundlesFilters, setBundlesFilters] = useState<string[]>([]);
  const [bundlesCursor, setBundlesCursor] = useState(0);
  const [bundlesPage, setBundlesPage] = useState(1);
  const [bundlesMaxPage, setBundlesMaxPage] = useState(1);
  const [filteredBundles, setFilteredBundles] = useState<Bundles>(bundles);
  const [bundlesItems, setBundleSItems] = useState<BundleItem[]>([]);

  useEffect(() => {
    task("XXX", async () => {
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
    });
  }, []);

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

  // ? UXP setup
  useEffect(() => {
    const uxpReload = async ({ name: itemName }: { name: string }) => {
      if (filteredCollection.some((item) => item.name === itemName)) {
        const url = `data:image/png;base64,${await factoryGetImage(
          id,
          _generation,
          collection.find((collectionItem) => collectionItem.name === itemName),
          MAX_SIZE
        )}`;
        reload(itemName, url);
      }

      return () => {
        uxpContext.off("uxp-reload", uxpReload);
      };
    };
  }, []);

  // ? Collection setup
  useEffect(() => {
    const filtersInfo: Filters = {};
    for (const { traits } of collection)
      for (const { name, value } of traits)
        if (name in filtersInfo && !filtersInfo[name].includes(value))
          filtersInfo[name].push(value);
        else if (!(name in filtersInfo)) filtersInfo[name] = [value];

    setCollectionFiltersInfo(filtersInfo);
  }, [collection]);

  // ? Bundles setup
  useEffect(() => {
    const bundlesFiltersInfo: string[] = [];
    for (const { name } of bundles)
      if (!bundlesFiltersInfo.includes(name)) bundlesFiltersInfo.push(name);
    setBundlesFiltersInfo(bundlesFiltersInfo);
  }, [bundles]);

  // ? Collection filtering
  useEffect(() => {
    const filteredCollection = Object.entries(collectionFilters)
      .reduce((filtered, [name, values]) => {
        if (values.length === 0) return filtered;
        else
          return filtered.filter(({ traits }) =>
            traits.some(
              ({ name: n, value: v }) => n === name && values.includes(v)
            )
          );
      }, collection)
      .filter(({ name }) => name.includes(stringFilter));

    setCollectionCursor(0);
    setCollectionPage(1);
    setSelectedCollectionItem(0);
    setCollectionMaxPage(Math.ceil(filteredCollection.length / PAGE_N));
    setFilteredCollection(filteredCollection);
  }, [collectionFilters, stringFilter]);

  // ? Bundles filtering
  useEffect(() => {
    const filteredBundles = bundles
      .filter(({ name }) => bundlesFilters.includes(name))
      .filter(({ name }) => name.includes(stringFilter));

    setBundlesCursor(0);
    setBundlesPage(1);
    setBundlesMaxPage(Math.ceil(filteredBundles.length / PAGE_N));
    setFilteredBundles(filteredBundles);
  }, [bundlesFilters, stringFilter]);

  useEffect(() => {
    task("loading previews", async () => {
      const items = (
        await Promise.all(
          Array.from({ length: PAGE_N }).map(async (_, i) => {
            if (collectionCursor + i >= filteredCollection.length) return null;
            const collectionItem = filteredCollection[
              collectionCursor + i
            ] as CollectionItem;
            const url = `data:image/png;base64,${await factoryGetImage(
              id,
              _generation,
              collectionItem,
              MAX_SIZE
            )}`;
            return { name: collectionItem.name, url };
          })
        )
      ).filter((item) => item !== null);

      setCollectionItems(items);
    })();
  }, [filteredCollection, collectionCursor]);

  useEffect(() => {
    task("loading bundles previews", async () => {
      const flatFilteredBundles: { name: string; ids: string[] }[] = [];
      for (const { name, ids } of filteredBundles)
        flatFilteredBundles.push(...ids.map((ids) => ({ name, ids })));

      const bundlesItems = (
        await Promise.all(
          Array.from({ length: PAGE_N }).map(async (_, i) => {
            if (bundlesCursor + i >= flatFilteredBundles.length) return null;
            const { ids: names, name: bundleName } =
              flatFilteredBundles[bundlesCursor + i];
            const collectionItems = names.map((id) =>
              collection.find((item) => item.name === id)
            );
            const base64Strings = await Promise.all(
              collectionItems.map((collectionItem) =>
                factoryGetImage(id, _generation, collectionItem, MAX_SIZE)
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
    })();
  }, [filteredBundles, bundlesCursor]);

  const onBack = () =>
    navigate("/factory", { state: { projectDir, instance, id, dirty } });

  const reload = (name: string, url: string) =>
    setCollectionItems((prevItems) =>
      prevItems.map((item) => (item.name === name ? { name, url } : item))
    );

  const addFilter = (name: string, value: string) =>
    setCollectionFilters((prevFilters) =>
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
    name in collectionFilters && collectionFilters[name].includes(value);

  const removeFilter = (name: string, value: string) =>
    setCollectionFilters((prevFilters) =>
      name in prevFilters
        ? {
            ...prevFilters,
            [name]: prevFilters[name].filter((v) => v !== value),
          }
        : prevFilters
    );

  const computeRepeatedCollection = () => {
    const keys = new Set<string>();
    const filteredCollection: Collection = [];
    for (const { name, traits } of collection) {
      const key = hash(traits);
      if (keys.has(key)) filteredCollection.push({ name, traits });
      else keys.add(key);
    }
    return filteredCollection;
  };

  const addRepeatedFilter = () => {
    const filteredCollection = computeRepeatedCollection();

    setCollectionRepeatedFilter(true);
    setCollectionCursor(0);
    setCollectionPage(1);
    setSelectedCollectionItem(0);
    setCollectionMaxPage(Math.ceil(filteredCollection.length / PAGE_N));
    setFilteredCollection(filteredCollection);
  };

  const removeRepeatedFilter = () => {
    setCollectionRepeatedFilter(false);
    setCollectionFilters((prevFilters) => ({ ...prevFilters }));
  };

  const onRegenerateRepeated = async () => {
    const { collection: _collection } = await regenerateItems(
      id,
      _generation,
      computeRepeatedCollection()
    );
    setCollection(_collection);
    setFilteredCollection((p) => [...p]);
    if (collectionRepeatedFilter) addRepeatedFilter();
  };

  const onRemoveRepeated = () => {
    computeRepeatedCollection().forEach(({ name }) => onRemove(name));
  };

  const addBundlesFilter = (bundle: string) =>
    setBundlesFilters((prevFilters) => [...prevFilters, bundle]);

  const removeBundlesFilter = (bundle: string) =>
    setBundlesFilters((prevFilters) => prevFilters.filter((v) => v !== bundle));

  const onEdit = (i: number) => {
    uxpContext.hostEdit({
      width: configuration.width,
      height: configuration.height,
      ...filteredCollection[i],
    });
  };

  const onRemove = (name: string) =>
    setCollectionItemsToRemove((prevItemsToRemove) => [
      ...prevItemsToRemove,
      name,
    ]);

  const onUndoRemove = (name: string) =>
    setCollectionItemsToRemove((prevItemsToRemove) =>
      prevItemsToRemove.filter((n) => n !== name)
    );

  const onSelect = (i: number) => setSelectedCollectionItem(i);

  const onRegenerate = async (i: number) => {
    const { collection: _collection } = await regenerateItems(id, _generation, [
      filteredCollection[i],
    ]);
    setCollection(_collection);
    setFilteredCollection((p) => [...p]);
  };

  const onSave = task("filtering", async () => {
    const _collectionItemsToRemove: Collection = collectionItemsToRemove.map(
      (name) =>
        collection.find((collectionItem) => collectionItem.name === name)
    );
    const _collection = await factoryRemoveItems(
      id,
      _generation,
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
            collectionRepeatedFilter,
            addRepeatedFilter,
            removeRepeatedFilter,
            onRegenerateRepeated,
            onRemoveRepeated,
            bundlesFiltersInfo,
            bundlesFilters,
            addBundlesFilter,
            removeBundlesFilter,
            collectionFiltersInfo,
            hasFilter,
            addFilter,
            removeFilter,
          }}
        />
      </View>

      <View UNSAFE_className="p-2 space-y-2" gridArea="center" overflow="auto">
        <Gallery
          {...{
            selectedCollectionItem,
            filteredCollection,
            collectionPage,
            collectionMaxPage,
            setCollectionCursor,
            setCollectionPage,
            collectionItems,
            collectionItemsToRemove,
            onUndoRemove,
            onEdit,
            onRemove,
            onSelect,
            onRegenerate,
            filteredBundles,
            bundlesPage,
            bundlesMaxPage,
            setBundlesCursor,
            setBundlesPage,
            bundlesItems,
            bundlesFilters,
            bundlesCursor,
          }}
        />
      </View>

      <View UNSAFE_className="p-2 space-y-2" gridArea="right" overflow="auto">
        {collectionItems.length > 0 && filteredCollection.length > 0 && (
          <>
            <Heading zIndex={1001} position="sticky" top={0}>
              {filteredCollection[selectedCollectionItem].name}
            </Heading>
            {filteredCollection[selectedCollectionItem].traits.map(
              ({ name, value }, i) => (
                <TextField
                  width="100%"
                  key={i}
                  label={name}
                  value={value}
                  isReadOnly={true}
                />
              )
            )}
          </>
        )}
        <Flex
          zIndex={1001}
          position="sticky"
          bottom={0}
          direction="row-reverse"
        >
          <Button variant="cta">Replace</Button>
          {/* <Button variant="cta" onPress={onSave}>
            Save
          </Button> */}
        </Flex>
      </View>
    </Grid>
  );
};

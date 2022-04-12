import {
  ActionGroup,
  Button,
  Flex,
  Grid,
  Heading,
  Item,
  TextField,
  View,
} from "@adobe/react-spectrum";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useErrorHandler } from "../components/ErrorHandler";
import { ToolbarContext } from "../components/Toolbar";
import { UXPContext } from "../components/UXPContext";
import { Bundles, Collection, CollectionItem, Instance } from "../typings";
import {
  factoryGetImage,
  factoryRegenerateCollectionItems,
  factoryRemoveCollectionItems,
  openFolder,
} from "../ipc";
import { MAX_SIZE, PAGE_N } from "../constants";
import { ImageItem } from "../components/ImageItem";
import path from "path";
import { hash } from "../utils";
import { Gallery } from "../components/Gallery";
import { Filters } from "../components/Filters";
import Back from "@spectrum-icons/workflow/Back";
import ChevronLeft from "@spectrum-icons/workflow/ChevronLeft";
import ChevronRight from "@spectrum-icons/workflow/ChevronRight";
import Close from "@spectrum-icons/workflow/Close";
import Folder from "@spectrum-icons/workflow/Folder";

interface QualityPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  generationId: string;
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

  const { projectDir, instance, id, generationId } = state as QualityPageState;
  const { configuration, generations } = instance;

  const [name] = useState(
    generations.find((generation) => generation.id === generationId).name
  );

  const [collection, setCollection] = useState<Collection>(
    generations.find((generation) => generation.id === generationId).collection
  );

  const [bundles, setBundles] = useState<Bundles>(
    generations.find((generation) => generation.id === generationId).bundles
  );

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
  const [collectionStringFilter, setCollectionStringFilter] =
    useState<string>(null);

  const [bundlesFiltersInfo, setBundlesFiltersInfo] = useState<string[]>([]);
  const [bundlesFilters, setBundlesFilters] = useState<string[]>([]);
  const [bundlesCursor, setBundlesCursor] = useState(0);
  const [bundlesPage, setBundlesPage] = useState(1);
  const [bundlesMaxPage, setBundlesMaxPage] = useState(1);
  const [filteredBundles, setFilteredBundles] = useState<Bundles>(bundles);
  const [bundlesItems, setBundleSItems] = useState<BundleItem[]>([]);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("back", "Back", <Back />, () =>
      navigate("/factory", {
        state: {
          projectDir,
          instance,
          id,
        },
      })
    );
    toolbarContext.addButton(
      "open-explorer",
      "Open in Explorer",
      <Folder />,
      () => {
        openFolder(path.join(projectDir, "images", name));
      }
    );

    const uxpReload = async ({ name: itemName }: { name: string }) => {
      if (filteredCollection.some((item) => item.name === itemName)) {
        const url = `data:image/png;base64,${await factoryGetImage(
          id,
          name,
          collection.find((collectionItem) => collectionItem.name === itemName),
          MAX_SIZE
        )}`;
        reload(itemName, url);
      }
    };

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("back");
      toolbarContext.removeButton("open-explorer");

      uxpContext.off("uxp-reload", uxpReload);
    };
  }, []);

  useEffect(() => {
    const filtersInfo: Filters = {};
    for (const { traits } of collection)
      for (const { name, value } of traits)
        if (name in filtersInfo && !filtersInfo[name].includes(value))
          filtersInfo[name].push(value);
        else if (!(name in filtersInfo)) filtersInfo[name] = [value];

    setCollectionFiltersInfo(filtersInfo);
  }, [collection]);

  useEffect(() => {
    const filtersInfo: string[] = [];
    for (const { name } of bundles)
      if (!filtersInfo.includes(name)) filtersInfo.push(name);
    setBundlesFiltersInfo(filtersInfo);
  }, [bundles]);

  useEffect(() => {
    let filteredCollection = [...collection];
    for (const [name, values] of Object.entries(collectionFilters)) {
      if (values.length === 0) continue;
      filteredCollection = filteredCollection.filter(({ traits }) =>
        traits.some(({ name: n, value: v }) => n === name && values.includes(v))
      );
    }

    setCollectionCursor(0);
    setCollectionPage(1);
    setSelectedCollectionItem(0);
    setCollectionMaxPage(Math.ceil(filteredCollection.length / PAGE_N));
    setFilteredCollection(filteredCollection);
  }, [collectionFilters]);

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
              name,
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
    let filteredBundles = bundles.filter(({ name }) =>
      bundlesFilters.includes(name)
    );

    setBundlesCursor(0);
    setBundlesPage(1);
    setBundlesMaxPage(Math.ceil(filteredBundles.length / PAGE_N));
    setFilteredBundles(filteredBundles);
  }, [bundlesFilters]);

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
                factoryGetImage(id, name, collectionItem, MAX_SIZE)
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
    const _collection = await factoryRegenerateCollectionItems(
      id,
      name,
      collection,
      computeRepeatedCollection()
    );
    setCollection(_collection);
    setFilteredCollection((p) => [...p]);
    if (collectionRepeatedFilter) addRepeatedFilter();
  };

  const onRemoveRepeated = () => {
    computeRepeatedCollection().forEach(({ name }) => onRemove(name));
  };

  const computeCollectionQuery = (query: string) => {
    return collection.filter(({ name }) => name.includes(query));
  };

  const addStringFilter = (query: string) => {
    const filteredCollection = computeCollectionQuery(query);

    setCollectionStringFilter(query);
    setCollectionCursor(0);
    setCollectionPage(1);
    setSelectedCollectionItem(0);
    setCollectionMaxPage(Math.ceil(filteredCollection.length / PAGE_N));
    setFilteredCollection(filteredCollection);
  };

  const removeStringFilter = () => {
    setCollectionStringFilter(null);
    setCollectionFilters((prevFilters) => ({ ...prevFilters }));
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
    const _collection = await factoryRegenerateCollectionItems(
      id,
      name,
      collection,
      [filteredCollection[i]]
    );
    setCollection(_collection);
    setFilteredCollection((p) => [...p]);
  };

  const onAction = (action: string) => {
    switch (action) {
      case "back":
        setSelectedCollectionItem((prevSelectedItem) =>
          Math.max(0, prevSelectedItem - 1)
        );
        break;
      case "forward":
        setSelectedCollectionItem((prevSelectedItem) =>
          Math.min(collectionItems.length - 1, prevSelectedItem + 1)
        );
        break;
      default:
        break;
    }
  };

  const onSave = task("filtering", async () => {
    const _collectionItemsToRemove: Collection = collectionItemsToRemove.map(
      (name) =>
        collection.find((collectionItem) => collectionItem.name === name)
    );
    const _collection = await factoryRemoveCollectionItems(
      id,
      name,
      collection,
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
      },
    });
  });

  return (
    <Grid
      areas={["filters gallery viewer right"]}
      columns={["1fr", "3fr", "4fr", "1fr"]}
      rows={["auto"]}
      height="100%"
      gap="size-100"
    >
      <View gridArea="filters">
        <Filters
          {...{
            addStringFilter,
            removeStringFilter,
            repeatedFilter: collectionRepeatedFilter,
            addRepeatedFilter,
            removeRepeatedFilter,
            onRegenerateRepeated,
            onRemoveRepeated,
            bundlesFiltersInfo,
            bundlesFilters,
            addBundlesFilter,
            removeBundlesFilter,
            filtersInfo: collectionFiltersInfo,
            hasFilter,
            addFilter,
            removeFilter,
          }}
        />
      </View>

      <View gridArea="gallery">
        <Gallery
          {...{
            filteredCollection,
            page: collectionPage,
            maxPage: collectionMaxPage,
            setCursor: setCollectionCursor,
            setPage: setCollectionPage,
            items: collectionItems,
            itemsToRemove: collectionItemsToRemove,
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

      <View gridArea="viewer">
        <Flex
          direction="column"
          height="100%"
          gap="size-100"
          justifyContent="center"
          alignItems="center"
        >
          {collectionItems.length > 0 && (
            <div className="w-[90%]">
              <ImageItem
                name={collectionItems[selectedCollectionItem].name}
                src={collectionItems[selectedCollectionItem].url}
                actions={[
                  {
                    label: "Edit",
                    onClick: () => onEdit(selectedCollectionItem),
                  },
                  {
                    label: "Remove",
                    onClick: () =>
                      onRemove(collectionItems[selectedCollectionItem].name),
                  },
                  {
                    label: "Regenerate",
                    onClick: () => onRegenerate(selectedCollectionItem),
                  },
                ]}
              />
            </div>
          )}
          <ActionGroup onAction={onAction}>
            <Item key="back">
              <ChevronLeft />
            </Item>
            <Item key="forward">
              <ChevronRight />
            </Item>
          </ActionGroup>
        </Flex>
      </View>

      <View gridArea="right">
        <Flex
          height="100%"
          direction="column"
          justifyContent="space-between"
          alignItems="end"
        >
          <View maxHeight="90vh" overflow="auto">
            {collectionItems.length > 0 && filteredCollection.length > 0 && (
              <>
                <Heading>
                  {collectionItems[selectedCollectionItem].name}
                </Heading>
                {filteredCollection[selectedCollectionItem].traits.map(
                  ({ name, value }, i) => (
                    <TextField
                      key={i}
                      label={name}
                      value={value}
                      isReadOnly={true}
                    />
                  )
                )}
              </>
            )}
          </View>
          <Button
            variant="cta"
            marginBottom="size-100"
            marginEnd="size-100"
            onPress={onSave}
          >
            Save
          </Button>
        </Flex>
      </View>
    </Grid>
  );
};

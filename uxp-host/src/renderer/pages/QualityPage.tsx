import {
  ActionGroup,
  Button,
  Checkbox,
  Flex,
  Grid,
  Heading,
  Item,
  TextField,
  View,
} from "@adobe/react-spectrum";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useErrorHandler } from "../components/ErrorHandler";
import { ToolbarContext } from "../components/Toolbar";
import { UXPContext } from "../components/UXPContext";
import { Collection, Configuration } from "../typings";
import {
  factoryGetImage,
  factoryRegenerateCollectionItems,
  factoryRemoveCollectionItems,
  factorySaveInstance,
  openFolder,
} from "../ipc";
import { MAX_SIZE } from "../constants";
import { ImageItem } from "../components/ImageItem";
import path from "path";
import Close from "@spectrum-icons/workflow/Close";
import Folder from "@spectrum-icons/workflow/Folder";
import { hash } from "../utils";
import { Gallery } from "../components/Gallery";
import ChevronLeft from "@spectrum-icons/workflow/ChevronLeft";
import ChevronRight from "@spectrum-icons/workflow/ChevronRight";
import { Filters } from "../components/Filters";

interface QualityPageState {
  id: string;
  collection: Collection;
  bundles: Record<string, string[][]>;
  inputDir: string;
  outputDir: string;
  configuration: Partial<Configuration>;
}

type Filters = Record<string, string[]>;

interface Item {
  name: string;
  url: string;
}

interface BundleItem {
  names: string[];
  urls: string[];
}

export const PAGE_N = 25;

export const QualityPage = () => {
  const toolbarContext = useContext(ToolbarContext);
  const uxpContext = useContext(UXPContext);
  const navigate = useNavigate();
  const { state } = useLocation();
  const task = useErrorHandler();

  const {
    id,
    collection: _collection,
    bundles: _bundles,
    inputDir,
    outputDir,
    configuration,
  } = state as QualityPageState;

  const [filtersInfo, setFiltersInfo] = useState<Filters>({});
  const [filters, setFilters] = useState<Filters>({});
  const [cursor, setCursor] = useState(0);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [collection, setCollection] = useState<Collection>(_collection);
  const [filteredCollection, setFilteredCollection] =
    useState<Collection>(_collection);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState(0);
  const [itemsToRemove, setItemsToRemove] = useState<string[]>([]);
  const [repeatedFilter, setRepeatedFilter] = useState<boolean>(false);
  const [stringFilter, setStringFilter] = useState<string>(null);

  const [bundles, setBundles] = useState<Record<string, string[][]>>(_bundles);
  const [filteredBundles, setFilteredBundles] = useState<
    Record<string, string[][]>
  >({});
  const [bundlesItems, setBundleItems] = useState<BundleItem[]>([]);
  const [bundlesFilter, setBundlesFilter] = useState<string>(null);
  const [bundlesCursor, setBundlesCursor] = useState(0);
  const [bundlesPage, setBundlesPage] = useState(1);
  const [bundlesMaxPage, setBundlesMaxPage] = useState(1);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton(
      "open-explorer",
      "Open in Explorer",
      <Folder />,
      () => {
        openFolder(path.join(outputDir, "images"));
      }
    );

    const uxpReload = async ({ name }: { name: string }) => {
      if (filteredCollection.some((item) => item.name === name)) {
        const url = `data:image/png;base64,${await factoryGetImage(
          id,
          collection.find((collectionItem) => collectionItem.name === name),
          MAX_SIZE
        )}`;
        reload(name, url);
      }
    };

    return () => {
      toolbarContext.removeButton("close");
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

    setFiltersInfo(filtersInfo);
  }, [collection]);

  useEffect(() => {
    let filteredCollection = [...collection];
    for (const [name, values] of Object.entries(filters)) {
      if (values.length === 0) continue;
      filteredCollection = filteredCollection.filter(({ traits }) =>
        traits.some(({ name: n, value: v }) => n === name && values.includes(v))
      );
    }

    setCursor(0);
    setPage(1);
    setSelectedItem(0);
    setMaxPage(Math.ceil(filteredCollection.length / PAGE_N));
    setFilteredCollection(filteredCollection);
  }, [filters]);

  useEffect(() => {
    task("loading previews", async () => {
      const items = (
        await Promise.all(
          Array.from({ length: PAGE_N }).map(async (_, i) => {
            if (cursor + i >= filteredCollection.length) return null;
            const collectionItem = filteredCollection[cursor + i];
            const name = collectionItem.name;
            const url = `data:image/png;base64,${await factoryGetImage(
              id,
              collectionItem,
              MAX_SIZE
            )}`;
            return { name, url };
          })
        )
      ).filter((item) => item !== null);

      setItems(items);
    })();
  }, [filteredCollection, cursor]);

  useEffect(() => {
    if (bundlesFilter === null) {
      setBundlesCursor(0);
      setBundlesPage(1);
      setBundlesMaxPage(1);
      setFilteredBundles({});
      return;
    }

    const filteredBundles: Record<string, string[][]> = {
      [bundlesFilter]: bundles[bundlesFilter],
    };

    setBundlesCursor(0);
    setBundlesPage(1);
    setBundlesMaxPage(
      Math.ceil(filteredBundles[bundlesFilter].length / PAGE_N)
    );
    setFilteredBundles(filteredBundles);
  }, [bundlesFilter]);

  useEffect(() => {
    task("loading bundles previews", async () => {
      const bundleItems = (
        await Promise.all(
          Array.from({ length: PAGE_N }).map(async (_, i) => {
            if (bundlesFilter === null) return null;
            if (bundlesCursor + i >= filteredBundles[bundlesFilter].length)
              return null;
            const names = filteredBundles[bundlesFilter][bundlesCursor + i];
            const collectionItems = names.map((key) =>
              collection.find((item) => item.name === key)
            );
            const base64Strings = await Promise.all(
              collectionItems.map((collectionItem) =>
                factoryGetImage(id, collectionItem, MAX_SIZE)
              )
            );
            const urls = base64Strings.map(
              (b64) => `data:image/png;base64,${b64}`
            );
            return { names, urls };
          })
        )
      ).filter((item) => item !== null);
      setBundleItems(bundleItems);
    })();
  }, [filteredBundles, bundlesCursor]);

  const reload = (name: string, url: string) =>
    setItems((prevItems) =>
      prevItems.map((item) => (item.name === name ? { name, url } : item))
    );

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

    setRepeatedFilter(true);
    setCursor(0);
    setPage(1);
    setSelectedItem(0);
    setMaxPage(Math.ceil(filteredCollection.length / PAGE_N));
    setFilteredCollection(filteredCollection);
  };

  const removeRepeatedFilter = () => {
    setRepeatedFilter(false);
    setFilters((prevFilters) => ({ ...prevFilters }));
  };

  const onRegenerateRepeated = async () => {
    const collection = await factoryRegenerateCollectionItems(
      id,
      computeRepeatedCollection()
    );
    setCollection(collection);
    setFilteredCollection((p) => [...p]);
    if (repeatedFilter) addRepeatedFilter();
  };

  const onRemoveRepeated = () => {
    computeRepeatedCollection().forEach(({ name }) => onRemove(name));
  };

  const computeCollectionQuery = (query: string) => {
    return collection.filter(({ name }) => name.includes(query));
  };

  const addStringFilter = (query: string) => {
    const filteredCollection = computeCollectionQuery(query);

    setStringFilter(query);
    setCursor(0);
    setPage(1);
    setSelectedItem(0);
    setMaxPage(Math.ceil(filteredCollection.length / PAGE_N));
    setFilteredCollection(filteredCollection);
  };

  const removeStringFilter = () => {
    setStringFilter(null);
    setFilters((prevFilters) => ({ ...prevFilters }));
  };

  const addBundlesFilter = (bundle: string) => setBundlesFilter(bundle);

  const removeBundlesFilter = () => setBundlesFilter(null);

  const onEdit = (i: number) => {
    uxpContext.hostEdit({
      width: configuration.width,
      height: configuration.height,
      ...filteredCollection[i],
    });
  };

  const onRemove = (name: string) =>
    setItemsToRemove((prevItemsToRemove) => [...prevItemsToRemove, name]);

  const onUndoRemove = (name: string) =>
    setItemsToRemove((prevItemsToRemove) =>
      prevItemsToRemove.filter((n) => n !== name)
    );

  const onSelect = (i: number) => setSelectedItem(i);

  const onRegenerate = async (i: number) => {
    const collection = await factoryRegenerateCollectionItems(id, [
      filteredCollection[i],
    ]);
    setCollection(collection);
    setFilteredCollection((p) => [...p]);
  };

  const onAction = (action: string) => {
    switch (action) {
      case "back":
        setSelectedItem((prevSelectedItem) =>
          Math.max(0, prevSelectedItem - 1)
        );
        break;
      case "forward":
        setSelectedItem((prevSelectedItem) =>
          Math.min(items.length - 1, prevSelectedItem + 1)
        );
        break;
      default:
        break;
    }
  };

  const onContinue = task("filtering", async () => {
    const collectionItemsToRemove: Collection = itemsToRemove.map((name) =>
      collection.find((collectionItem) => collectionItem.name === name)
    );
    const _collection = await factoryRemoveCollectionItems(
      id,
      collectionItemsToRemove
    );
    const _configuration = {
      ...configuration,
      n: _collection.length,
    };
    await factorySaveInstance(id);
    navigate("/deploy", {
      state: {
        id,
        inputDir,
        outputDir,
        collection: _collection,
        configuration: _configuration,
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
            repeatedFilter,
            addRepeatedFilter,
            removeRepeatedFilter,
            onRegenerateRepeated,
            onRemoveRepeated,
            bundles,
            bundlesFilter,
            addBundlesFilter,
            removeBundlesFilter,
            filtersInfo,
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
            page,
            maxPage,
            setCursor,
            setPage,
            items,
            itemsToRemove,
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
            bundlesFilter,
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
          {items.length > 0 && (
            <div className="w-[90%]">
              <ImageItem
                name={items[selectedItem].name}
                src={items[selectedItem].url}
                actions={[
                  {
                    label: "Edit",
                    onClick: () => onEdit(selectedItem),
                  },
                  {
                    label: "Remove",
                    onClick: () => onRemove(items[selectedItem].name),
                  },
                  {
                    label: "Regenerate",
                    onClick: () => onRegenerate(selectedItem),
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
            {items.length > 0 && filteredCollection.length > 0 && (
              <>
                <Heading>{items[selectedItem].name}</Heading>
                {filteredCollection[selectedItem].traits.map(
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
            onPress={onContinue}
          >
            Continue
          </Button>
        </Flex>
      </View>
    </Grid>
  );
};

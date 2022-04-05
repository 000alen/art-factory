import {
  Flex,
  Grid,
  Heading,
  NumberField,
  repeat,
  View,
} from "@adobe/react-spectrum";
import React from "react";
import { PAGE_N } from "../pages/QualityPage";
import { setter } from "./Gallery";
import { ImageItem } from "./ImageItem";

interface BundleItem {
  names: string[];
  urls: string[];
}

interface GalleryBundlesProps {
  filteredBundles: Record<string, string[][]>;
  bundlesPage: number;
  bundlesMaxPage: number;
  setBundlesCursor: setter<number>;
  setBundlesPage: setter<number>;
  bundlesItems: BundleItem[];
  bundlesFilter: string;
  bundlesCursor: number;
}

export const GalleryBundles: React.FC<GalleryBundlesProps> = ({
  filteredBundles,
  bundlesPage,
  bundlesMaxPage,
  setBundlesCursor,
  setBundlesPage,
  bundlesItems,
  bundlesFilter,
  bundlesCursor,
}) => {
  return (
    <>
      <Flex
        width="100%"
        gap="size-100"
        alignItems="center"
        justifyContent="space-between"
        marginBottom={8}
      >
        <div>
          {bundlesFilter === null
            ? 0
            : bundlesFilter in filteredBundles
            ? filteredBundles[bundlesFilter].length
            : 0}{" "}
          elements
        </div>

        <div>
          Page{" "}
          <NumberField
            aria-label="page"
            value={bundlesPage}
            minValue={1}
            maxValue={bundlesMaxPage}
            onChange={(value: number) => {
              setBundlesCursor((value - 1) * PAGE_N);
              setBundlesPage(value);
            }}
          />{" "}
          of {bundlesMaxPage}
        </div>
      </Flex>

      <View maxHeight="85vh" overflow="auto">
        {bundlesItems.map(({ names, urls }, i) => (
          <>
            <Heading>{`${bundlesFilter} ${bundlesCursor + i + 1}`}</Heading>
            <Grid
              columns={repeat("auto-fit", "175px")}
              gap="size-100"
              justifyContent="center"
            >
              {names.map((name, j) => (
                <ImageItem src={urls[j]} />
              ))}
            </Grid>
          </>
        ))}
      </View>
    </>
  );
};

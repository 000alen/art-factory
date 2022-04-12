import {
  Flex,
  Grid,
  Heading,
  NumberField,
  repeat,
  View,
} from "@adobe/react-spectrum";
import React from "react";
import { PAGE_N } from "../constants";
import { BundleItem } from "../pages/QualityPage";
import { Bundles } from "../typings";
import { setter } from "./Gallery";
import { ImageItem } from "./ImageItem";

interface GalleryBundlesProps {
  filteredBundles: Bundles;
  bundlesPage: number;
  bundlesMaxPage: number;
  setBundlesCursor: setter<number>;
  setBundlesPage: setter<number>;
  bundlesItems: BundleItem[];
  bundlesFilters: string[];
  bundlesCursor: number;
}

export const GalleryBundles: React.FC<GalleryBundlesProps> = ({
  filteredBundles,
  bundlesPage,
  bundlesMaxPage,
  setBundlesCursor,
  setBundlesPage,
  bundlesItems,
  bundlesFilters,
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
        <div>{filteredBundles.length} elements</div>

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
        {bundlesItems.map(({ bundleName, names, urls }, i) => (
          <div key={i}>
            <Heading>{`${bundleName} ${bundlesCursor + i + 1}`}</Heading>
            <Grid
              columns={repeat("auto-fit", "175px")}
              gap="size-100"
              justifyContent="center"
            >
              {names.map((name, j) => (
                <ImageItem key={j} src={urls[j]} maxSize={175} />
              ))}
            </Grid>
          </div>
        ))}
      </View>
    </>
  );
};

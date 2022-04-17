import React from "react";

import {
  Flex,
  Grid,
  Heading,
  NumberField,
  repeat,
  View,
} from "@adobe/react-spectrum";

import { PAGE_N } from "../constants";
import { BundleItem } from "../pages/QualityPage";
import { Bundles } from "../typings";
import { setter } from "./Gallery";
import { ImageItem } from "./ImageItem";

interface GalleryBundlesProps {
  bundlesItems: BundleItem[];
  bundlesCursor: number;
}

export const GalleryBundles: React.FC<GalleryBundlesProps> = ({
  bundlesItems,
  bundlesCursor,
}) => {
  return (
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
  );
};

import React from "react";

import { Grid, Heading, repeat, View } from "@adobe/react-spectrum";

import { BundleItem } from "../pages/QualityPage";
import { ImageItem } from "./ImageItem";

interface GalleryBundlesProps {
  bundlesItems: BundleItem[];
}

export const GalleryBundles: React.FC<GalleryBundlesProps> = ({
  bundlesItems,
}) => {
  return (
    <View maxHeight="85vh" overflow="auto">
      {bundlesItems.map(({ bundleName, names, urls }, i) => (
        <div key={i}>
          <Heading>{bundleName}</Heading>
          <Grid
            columns={repeat("auto-fit", "220px")}
            gap="size-100"
            justifyContent="center"
          >
            {names.map((name, j) => (
              <ImageItem key={j} src={urls[j]} maxSize={192} />
            ))}
          </Grid>
        </div>
      ))}
    </View>
  );
};

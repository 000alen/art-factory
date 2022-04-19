import { Flex, Heading, Text } from "@adobe/react-spectrum";
import React from "react";
import { ImageItem } from "./ImageItem";
import Zoom, { Controlled as ControlledZoom } from "react-medium-image-zoom";

interface PreviewProps {
  name: string;
  showName?: boolean;
  url: string;
  controlledZoom?: boolean;
  isZoomed?: boolean;
  onZoomChange?: (isZoomed: boolean) => void;
  disabled?: boolean;
  showOnDisabled?: JSX.Element;
}

export const Preview: React.FC<PreviewProps> = ({
  name,
  showName = true,
  url,
  controlledZoom = false,
  isZoomed,
  onZoomChange,
  disabled = false,
  showOnDisabled,
  children,
}) => {
  return (
    <div className="relative w-48 p-3 border-1 border-solid border-white rounded">
      <Flex direction="column" gap="size-100">
        {disabled ? (
          <div className="w-48 h-48 flex justify-center items-center m-auto rounded border-2 border-dashed border-white">
            {showOnDisabled}
          </div>
        ) : controlledZoom && url ? (
          <ControlledZoom
            isZoomed={isZoomed}
            onZoomChange={onZoomChange}
            overlayBgColorEnd="rgba(30, 30, 30, 0.5)"
          >
            <ImageItem src={url} maxSize={192} />
          </ControlledZoom>
        ) : !controlledZoom && url ? (
          <Zoom overlayBgColorEnd="rgba(30, 30, 30, 0.5)">
            <ImageItem src={url} maxSize={192} />
          </Zoom>
        ) : (
          <div className="w-48 h-48 flex justify-center items-center">
            <Text>Nothing to see here</Text>
          </div>
        )}
        {showName && <Heading>{name}</Heading>}
        {children}
      </Flex>
    </div>
  );
};

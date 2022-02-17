import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { factoryGetImage } from "../ipcRenderer";

export function ReviewPage() {
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, toReview, attributes, inputDir, outputDir, configuration } =
    state;

  //   useEffect(() => {
  //     Promise.all(
  //       [...Array(9).keys()].map(async (i) => {
  //         if (index + i >= attributes.length) return;

  //         const buffer = await factoryGetImage(id, index + i);
  //         const url = URL.createObjectURL(
  //           new Blob([buffer], { type: "image/jpeg" })
  //         );
  //         return url;
  //       })
  //     ).then((urls) => {
  //       setImagesUrls(urls);
  //     });
  //   }, [index]);

  return (
    <>
      {toReview.map((i) => (
        <>
          {i}
          <br />
        </>
      ))}
    </>
  );
}

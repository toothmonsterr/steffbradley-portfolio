/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type SpiralShapeSvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function SpiralShapeSvgIcon(props: SpiralShapeSvgIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"currentColor"}
      viewBox={"0 0 126 126"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fillRule={"evenodd"}
        d={
          "M70.846 0h4.85v8.946h-4.85C37.076 8.946 9.7 34.195 9.7 65.341c0 28.56 25.103 51.713 56.07 51.713 27.908 0 50.531-20.866 50.531-46.605 0-22.918-20.144-41.497-44.993-41.497-21.791 0-39.455 16.292-39.455 36.39 0 17.276 15.185 31.282 33.917 31.282 15.673 0 28.379-11.719 28.379-26.174 0-11.635-10.226-21.066-22.841-21.066-9.556 0-17.303 7.145-17.303 15.958 0 5.993 5.267 10.851 11.765 10.851 3.439 0 6.227-2.571 6.227-5.743 0-.351-.308-.635-.688-.635h-4.85v-8.946h4.85c5.737 0 10.388 4.289 10.388 9.581 0 8.112-7.13 14.689-15.926 14.689-11.854 0-21.464-8.863-21.464-19.796 0-13.754 12.089-24.904 27.002-24.904 17.972 0 32.54 13.437 32.54 30.012 0 19.396-17.048 35.12-38.078 35.12-24.089 0-43.617-18.011-43.617-40.228 0-25.038 22.007-45.335 49.155-45.335 30.206 0 54.693 22.584 54.693 50.443 0 30.68-26.966 55.551-60.231 55.551-36.323 0-65.769-27.158-65.769-60.659C.002 29.256 31.721.002 70.848.002Z"
        }
      ></path>
    </svg>
  );
}

export default SpiralShapeSvgIcon;
/* prettier-ignore-end */

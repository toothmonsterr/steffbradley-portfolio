/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type EyeconSvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function EyeconSvgIcon(props: EyeconSvgIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 24 25"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        stroke={"currentColor"}
        strokeLinecap={"round"}
        strokeLinejoin={"round"}
        strokeWidth={"2"}
        d={
          "M11.75 5.5a7.7 7.7 0 0 0-2 .24c-2.913.73-5.723 3.006-7.619 5.324a1.78 1.78 0 0 0 0 2.198c1.867 2.28 4.67 4.596 7.622 5.333a7.7 7.7 0 0 0 1.997.238 7.7 7.7 0 0 0 2-.238c2.952-.735 5.758-3.052 7.62-5.333a1.78 1.78 0 0 0 0-2.198c-1.896-2.319-4.71-4.595-7.62-5.325a7.7 7.7 0 0 0-2-.24"
        }
      ></path>

      <circle
        cx={"11.751"}
        cy={"11.916"}
        r={"1.943"}
        stroke={"currentColor"}
        strokeLinecap={"round"}
        strokeLinejoin={"round"}
        strokeWidth={"2"}
      ></circle>
    </svg>
  );
}

export default EyeconSvgIcon;
/* prettier-ignore-end */

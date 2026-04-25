/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type RegistrationMarkCornerSvg2IconProps =
  React.ComponentProps<"svg"> & {
    title?: string;
  };

export function RegistrationMarkCornerSvg2Icon(
  props: RegistrationMarkCornerSvg2IconProps
) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 40 40"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"none"}
        stroke={"currentColor"}
        strokeLinecap={"square"}
        strokeWidth={"1"}
        d={"M15 4H4v11M25 4h11v11M15 36H4V25m21 11h11V25"}
      ></path>
    </svg>
  );
}

export default RegistrationMarkCornerSvg2Icon;
/* prettier-ignore-end */

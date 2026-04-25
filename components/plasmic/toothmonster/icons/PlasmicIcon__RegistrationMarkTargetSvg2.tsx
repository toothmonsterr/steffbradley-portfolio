/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type RegistrationMarkTargetSvg2IconProps =
  React.ComponentProps<"svg"> & {
    title?: string;
  };

export function RegistrationMarkTargetSvg2Icon(
  props: RegistrationMarkTargetSvg2IconProps
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

      <g fill={"none"} stroke={"currentColor"} strokeWidth={"1"}>
        <circle cx={"20"} cy={"20"} r={"19.5"}></circle>

        <circle cx={"20"} cy={"20"} r={"10"}></circle>

        <path d={"M0 20h40M20 0v40"}></path>
      </g>
    </svg>
  );
}

export default RegistrationMarkTargetSvg2Icon;
/* prettier-ignore-end */

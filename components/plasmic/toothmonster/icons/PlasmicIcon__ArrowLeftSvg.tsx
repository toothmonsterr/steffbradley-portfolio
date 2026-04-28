/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type ArrowLeftSvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function ArrowLeftSvgIcon(props: ArrowLeftSvgIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      xmlSpace={"preserve"}
      fillRule={"evenodd"}
      strokeLinejoin={"round"}
      strokeMiterlimit={"2"}
      clipRule={"evenodd"}
      version={"1.1"}
      viewBox={"0 0 33 20"}
      height={"1em"}
      style={{
        fill: "currentcolor",

        ...(style || {})
      }}
      className={classNames("plasmic-default__svg", className)}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path fill={"none"} d={"M0 0h32.688v19.078H0z"}></path>

      <path
        d={
          "M5.742 7.058a.55.55 0 0 0-.119.601.55.55 0 0 0 .51.341h.048a.1.1 0 0 0 .037-.007l4.799-1.938c.246-.1.52-.1.767-.002l4.234 1.694c.245.098.519.098.764 0l4.234-1.694c.247-.098.521-.098.767.002l4.632 1.87c.122.05.253.075.385.075h3.6a1 1 0 0 1 0 2h-4.004a1 1 0 0 1-.378-.072L21.78 8.251a1.02 1.02 0 0 0-.76.001l-4.238 1.695a1.03 1.03 0 0 1-.764 0L11.78 8.252a1.02 1.02 0 0 0-.76-.001L6.625 9.99a.3.3 0 0 1-.051.015l-.002.001a.82.82 0 0 0-.41 1.386l3.205 3.181a1.026 1.026 0 0 1 .003 1.457l-.065.065a.856.856 0 0 1-1.21 0L1.727 9.727a1.027 1.027 0 0 1 0-1.454l6.368-6.368a.856.856 0 0 1 1.21 0l.068.068a1.027 1.027 0 0 1 0 1.454z"
        }
      ></path>
    </svg>
  );
}

export default ArrowLeftSvgIcon;
/* prettier-ignore-end */

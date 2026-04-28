/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type ArrowRightSvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function ArrowRightSvgIcon(props: ArrowRightSvgIconProps) {
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
          "M26.658 10.942a.55.55 0 0 0 .119-.601.55.55 0 0 0-.51-.341h-.048a.1.1 0 0 0-.037.007l-4.799 1.938c-.246.1-.52.1-.767.002l-4.234-1.694a1.03 1.03 0 0 0-.764 0l-4.234 1.694a1.03 1.03 0 0 1-.767-.002l-4.632-1.87A1 1 0 0 0 5.6 10H2a1 1 0 0 1 0-2h4.004c.129 0 .258.024.378.072l4.238 1.677c.244.097.516.097.76-.001l4.238-1.695a1.03 1.03 0 0 1 .764 0l4.238 1.695c.244.098.516.098.76.001l4.395-1.739a.3.3 0 0 1 .051-.015l.002-.001a.82.82 0 0 0 .41-1.386l-3.205-3.181a1.026 1.026 0 0 1-.003-1.457l.065-.065a.856.856 0 0 1 1.21 0l6.368 6.368a1.027 1.027 0 0 1 0 1.454l-6.368 6.368a.856.856 0 0 1-1.21 0l-.068-.068a1.027 1.027 0 0 1 0-1.454z"
        }
      ></path>
    </svg>
  );
}

export default ArrowRightSvgIcon;
/* prettier-ignore-end */

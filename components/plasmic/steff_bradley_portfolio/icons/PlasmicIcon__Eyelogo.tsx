/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type EyelogoIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function EyelogoIcon(props: EyelogoIconProps) {
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
          "M.494 31.375C10.952 20.917 31.869 0 63.244 0s52.292 20.917 62.75 31.375C115.536 41.833 94.619 62.75 63.244 62.75S10.952 41.833.494 31.375m78.438 0c0 8.664-7.023 15.688-15.688 15.688-8.664 0-15.688-7.023-15.688-15.688 0-8.664 7.024-15.688 15.688-15.688s15.688 7.024 15.688 15.688M.494 94.125C10.952 83.667 31.869 62.75 63.244 62.75s52.292 20.917 62.75 31.375c-10.458 10.458-31.375 31.375-62.75 31.375S10.952 104.583.494 94.125m78.438 0c0 8.664-7.023 15.688-15.688 15.688-8.664 0-15.688-7.024-15.688-15.688s7.024-15.688 15.688-15.688 15.688 7.023 15.688 15.688"
        }
      ></path>
    </svg>
  );
}

export default EyelogoIcon;
/* prettier-ignore-end */

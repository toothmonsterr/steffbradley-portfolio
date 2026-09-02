/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type InstagramSvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function InstagramSvgIcon(props: InstagramSvgIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      xmlnsXlink={"http://www.w3.org/1999/xlink"}
      fill={"none"}
      viewBox={"0 0 38 38"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <mask
        id={"a"}
        width={"38"}
        height={"38"}
        x={"0"}
        y={"0"}
        maskUnits={"userSpaceOnUse"}
        style={{
          maskType: 'alpha"'
        }}
      >
        <circle
          cx={"18.538"}
          cy={"18.538"}
          r={"17.038"}
          fill={"#1C92FF"}
          stroke={"#202020"}
          strokeWidth={"3"}
        ></circle>
      </mask>

      <g mask={"url(#a)"}>
        <circle
          cx={"18.538"}
          cy={"18.457"}
          r={"17.038"}
          fill={"url(#b)"}
          stroke={"#fff"}
          strokeWidth={"3"}
        ></circle>

        <path
          fill={"#fff"}
          fillRule={"evenodd"}
          d={
            "M11.92 18.457c0-2.644 0-3.966.63-4.918a3.8 3.8 0 0 1 1.07-1.07c.953-.63 2.275-.63 4.918-.63s3.966 0 4.918.63c.425.281.789.645 1.07 1.07.63.952.63 2.274.63 4.918 0 2.643 0 3.965-.63 4.917-.281.425-.645.79-1.07 1.07-.952.63-2.274.63-4.918.63-2.643 0-3.965 0-4.917-.63a3.8 3.8 0 0 1-1.07-1.07c-.63-.952-.63-2.274-.63-4.917m10.044 0a3.426 3.426 0 1 1-6.852 0 3.426 3.426 0 0 1 6.852 0m-3.426 2.267a2.267 2.267 0 1 0 0-4.534 2.267 2.267 0 0 0 0 4.534m3.561-5.06a.805.805 0 1 0 0-1.61.805.805 0 0 0 0 1.61"
          }
          clipRule={"evenodd"}
        ></path>
      </g>

      <defs>
        <linearGradient
          id={"b"}
          x1={"18.538"}
          x2={"18.538"}
          y1={"-.081"}
          y2={"36.995"}
          gradientUnits={"userSpaceOnUse"}
        >
          <stop stopColor={"#5C42FB"}></stop>

          <stop offset={".49"} stopColor={"#F22F53"}></stop>

          <stop offset={"1"} stopColor={"#FEBD1D"}></stop>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default InstagramSvgIcon;
/* prettier-ignore-end */

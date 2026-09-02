/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type LinkedinIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function LinkedinIcon(props: LinkedinIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
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
          r={"18.178"}
          fill={"#1C92FF"}
          stroke={"#202020"}
          strokeWidth={".72"}
        ></circle>
      </mask>

      <g mask={"url(#a)"}>
        <circle
          cx={"18.538"}
          cy={"18.457"}
          r={"17.038"}
          fill={"#1C92FF"}
          stroke={"#fff"}
          strokeWidth={"3"}
        ></circle>

        <path
          fill={"#fff"}
          d={
            "M12.044 13.708q0-.624.439-1.03t1.14-.407q.69 0 1.117.4.438.412.438 1.075 0 .6-.426 1-.44.412-1.153.412h-.013q-.69 0-1.116-.412a1.38 1.38 0 0 1-.426-1.038m.163 10.934v-8.347h2.783v8.347zm4.325 0h2.784V19.98q0-.437.1-.675.176-.424.533-.718t.896-.294q1.404 0 1.404 1.887v4.46h2.784v-4.785q0-1.85-.878-2.805-.877-.956-2.32-.956-1.617 0-2.52 1.387v.025h-.012l.013-.025v-1.187h-2.784q.025.4.025 2.486 0 2.088-.025 5.86"
          }
        ></path>
      </g>
    </svg>
  );
}

export default LinkedinIcon;
/* prettier-ignore-end */

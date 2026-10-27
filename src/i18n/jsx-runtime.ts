import {
  jsx as reactJsx,
  jsxs as reactJsxs,
  Fragment,
} from "react/jsx-runtime";
import { localizeReactProps } from "./react-props";
export { Fragment };
export type { JSX } from "react/jsx-runtime";
export const jsx: typeof reactJsx = (type, props, key) =>
  reactJsx(type, localizeReactProps(props), key);
export const jsxs: typeof reactJsxs = (type, props, key) =>
  reactJsxs(type, localizeReactProps(props), key);

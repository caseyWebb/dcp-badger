/**
 * Adapted from React’s TypeScript definition from DefinitelyTyped.
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/index.d.ts
 */

declare module "vhtml" {
}

declare namespace JSX {

  interface SVGAttributes<T> {
    class?: string
    height?: number | string;
    width?: number | string;

    // svg-specific attributes
    dx?: number | string;
    dy?: number | string;
    fill?: string;
    transform?: string;
    x?: number | string;
    xmlns?: string;
    y?: number | string;
  }

  interface IntrinsicElements {
    svg: SVGAttributes<SVGSVGElement>;

    g: SVGAttributes<SVGGElement>;
    rect: SVGAttributes<SVGRectElement>;
    style: SVGAttributes<SVGStyleElement>;
    title: SVGAttributes<SVGTitleElement>;
    text: SVGAttributes<SVGTextElement>;
  }
}
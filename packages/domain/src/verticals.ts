export const VERTICALS = ["smoking", "vaping", "alcohol", "sleep"] as const;

export type Vertical = (typeof VERTICALS)[number];

export const isVertical = (value: string): value is Vertical =>
  (VERTICALS as readonly string[]).includes(value);

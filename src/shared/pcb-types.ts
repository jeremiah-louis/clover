export type PCBLayer = 1 | 2 | 4 | 6;
export type PCBColor =
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "white"
  | "black"
  | "purple";
export type PCBFinish = "hasl" | "leadfree-hasl" | "enig" | "osp";
export type PCBThickness = 0.8 | 1.0 | 1.2 | 1.6 | 2.0;
export type PCBCopperWeight = "1oz" | "2oz";

export interface PCBSpecs {
  layers: PCBLayer;
  width: number; // mm
  height: number; // mm
  quantity: number;
  color: PCBColor;
  finish: PCBFinish;
  thickness: PCBThickness;
  copperWeight: PCBCopperWeight;
  castellatedHoles: boolean;
  impedanceControl: boolean;
  stencil: boolean;
}

export interface PCBComponent {
  designator: string; // e.g. "R1", "U1", "LED1"
  package: string; // e.g. "0805", "SOT-23", "DIP-28"
  value: string; // e.g. "10k", "ATmega328P"
  description: string;
  x: number; // mm position
  y: number; // mm position
  rotation: number; // degrees
  layer: "top" | "bottom";
}

export interface PCBTrace {
  net: string;
  width: number; // mm
  points: { x: number; y: number }[];
  layer: "top" | "bottom" | "inner1" | "inner2";
}

export interface PCBDesign {
  name: string;
  description: string;
  specs: PCBSpecs;
  components: PCBComponent[];
  traces: PCBTrace[];
  boardOutline: { x: number; y: number }[]; // polygon vertices in mm
  drillHoles: { x: number; y: number; diameter: number }[];
  mountingHoles: { x: number; y: number; diameter: number }[];
}

export interface PCBQuote {
  basePrice: number; // USD
  quantity: number;
  unitPrice: number; // per board
  totalPrice: number;
  estimatedDays: number; // manufacturing lead time
  shippingEstimate: number;
  currency: "USD";
  specs: PCBSpecs;
  breakdown: {
    pcbCost: number;
    setupFee: number;
    stencilCost: number;
    shippingCost: number;
  };
}

export interface PCBOrder {
  id: string;
  design: PCBDesign;
  quote: PCBQuote;
  status: PCBOrderStatus;
  createdAt: string;
  jlcpcbUrl?: string;
  gerberPath?: string;
}

export type PCBOrderStatus =
  | "draft"
  | "quoted"
  | "gerber-generated"
  | "submitted"
  | "manufacturing"
  | "shipped"
  | "delivered";

export const DEFAULT_PCB_SPECS: PCBSpecs = {
  layers: 2,
  width: 100,
  height: 100,
  quantity: 5,
  color: "green",
  finish: "hasl",
  thickness: 1.6,
  copperWeight: "1oz",
  castellatedHoles: false,
  impedanceControl: false,
  stencil: false,
};

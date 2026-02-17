import { app, shell } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import type {
  PCBDesign,
  PCBSpecs,
  PCBQuote,
  PCBOrder,
  PCBOrderStatus,
} from "../../shared/pcb-types";
import { PcbApiError } from "../../shared/errors";

const BASE_PRICE_2L = 2.0;
const BASE_PRICE_4L = 28.0;
const BASE_PRICE_6L = 48.0;
const AREA_RATE_PER_CM2 = 0.04;
const SETUP_FEE = 0.0;
const STENCIL_COST = 8.0;

const COLOR_SURCHARGE: Record<string, number> = {
  green: 0,
  red: 0,
  yellow: 0,
  blue: 0,
  white: 0,
  black: 0,
  purple: 2.0,
};

const FINISH_SURCHARGE: Record<string, number> = {
  hasl: 0,
  "leadfree-hasl": 0,
  enig: 12.0,
  osp: 0,
};

const LEAD_TIMES: Record<number, number> = {
  1: 3,
  2: 3,
  4: 7,
  6: 10,
};

const SHIPPING_ESTIMATES: Record<string, number> = {
  economy: 3.5,
  standard: 8.5,
  express: 18.0,
};

const orders = new Map<string, PCBOrder>();

export function estimateQuote(specs: PCBSpecs): PCBQuote {
  const areaCm2 = (specs.width / 10) * (specs.height / 10);

  let basePrice: number;
  switch (specs.layers) {
    case 1:
    case 2:
      basePrice = BASE_PRICE_2L;
      break;
    case 4:
      basePrice = BASE_PRICE_4L;
      break;
    case 6:
      basePrice = BASE_PRICE_6L;
      break;
    default:
      basePrice = BASE_PRICE_2L;
  }

  const areaCost = areaCm2 > 10 ? (areaCm2 - 10) * AREA_RATE_PER_CM2 : 0;
  const colorCost = COLOR_SURCHARGE[specs.color] ?? 0;
  const finishCost = FINISH_SURCHARGE[specs.finish] ?? 0;
  const copperCost = specs.copperWeight === "2oz" ? 8.0 : 0;
  const castellatedCost = specs.castellatedHoles ? 15.0 : 0;
  const impedanceCost = specs.impedanceControl ? 20.0 : 0;
  const stencilCost = specs.stencil ? STENCIL_COST : 0;

  const pcbCost =
    (basePrice +
      areaCost +
      colorCost +
      finishCost +
      copperCost +
      castellatedCost +
      impedanceCost) *
    Math.max(1, Math.ceil(specs.quantity / 5));
  const shippingCost = SHIPPING_ESTIMATES.standard;

  const totalPrice = pcbCost + SETUP_FEE + stencilCost + shippingCost;
  const unitPrice = pcbCost / specs.quantity;

  return {
    basePrice,
    quantity: specs.quantity,
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    estimatedDays: LEAD_TIMES[specs.layers] ?? 5,
    shippingEstimate: shippingCost,
    currency: "USD",
    specs,
    breakdown: {
      pcbCost: Math.round(pcbCost * 100) / 100,
      setupFee: SETUP_FEE,
      stencilCost,
      shippingCost,
    },
  };
}

export async function generateGerberPackage(
  design: PCBDesign,
): Promise<string> {
  const outputDir = path.join(
    app.getPath("temp"),
    "clover-gerber",
    design.name.replace(/\s+/g, "-"),
  );
  await fs.mkdir(outputDir, { recursive: true });

  try {
    const edgeCuts = generateEdgeCutsGerber(design);
    await fs.writeFile(
      path.join(outputDir, `${design.name}-Edge_Cuts.gbr`),
      edgeCuts,
    );

    const topCopper = generateCopperGerber(design, "top");
    await fs.writeFile(
      path.join(outputDir, `${design.name}-F_Cu.gbr`),
      topCopper,
    );

    const bottomCopper = generateCopperGerber(design, "bottom");
    await fs.writeFile(
      path.join(outputDir, `${design.name}-B_Cu.gbr`),
      bottomCopper,
    );

    const topSilk = generateSilkscreenGerber(design, "top");
    await fs.writeFile(
      path.join(outputDir, `${design.name}-F_SilkS.gbr`),
      topSilk,
    );

    const topMask = generateSolderMaskGerber(design, "top");
    await fs.writeFile(
      path.join(outputDir, `${design.name}-F_Mask.gbr`),
      topMask,
    );

    const bottomMask = generateSolderMaskGerber(design, "bottom");
    await fs.writeFile(
      path.join(outputDir, `${design.name}-B_Mask.gbr`),
      bottomMask,
    );

    const drillFile = generateDrillFile(design);
    await fs.writeFile(path.join(outputDir, `${design.name}.drl`), drillFile);

    const zipPath = path.join(
      app.getPath("temp"),
      "clover-gerber",
      `${design.name.replace(/\s+/g, "-")}.zip`,
    );
    await createZipArchive(outputDir, zipPath);

    return zipPath;
  } catch (error) {
    throw PcbApiError.from(error, "jlcpcb:generateGerberPackage");
  }
}

function generateGerberHeader(layerName: string): string {
  return [
    "%TF.GenerationSoftware,Clover,AI-PCB-Designer,1.0*%",
    `%TF.FileFunction,${layerName}*%`,
    "%FSLAX46Y46*%",
    "G04 Units: mm*",
    "%MOMM*%",
    "%LPD*%",
  ].join("\n");
}

function generateEdgeCutsGerber(design: PCBDesign): string {
  const lines = [generateGerberHeader("Profile,NP")];
  lines.push("%ADD10C,0.100000*%");
  lines.push("D10*");

  if (design.boardOutline.length > 0) {
    const first = design.boardOutline[0];
    lines.push(`X${toGerberCoord(first.x)}Y${toGerberCoord(first.y)}D02*`);
    for (let i = 1; i < design.boardOutline.length; i++) {
      const p = design.boardOutline[i];
      lines.push(`X${toGerberCoord(p.x)}Y${toGerberCoord(p.y)}D01*`);
    }
    lines.push(`X${toGerberCoord(first.x)}Y${toGerberCoord(first.y)}D01*`);
  } else {
    const w = design.specs.width;
    const h = design.specs.height;
    lines.push(`X${toGerberCoord(0)}Y${toGerberCoord(0)}D02*`);
    lines.push(`X${toGerberCoord(w)}Y${toGerberCoord(0)}D01*`);
    lines.push(`X${toGerberCoord(w)}Y${toGerberCoord(h)}D01*`);
    lines.push(`X${toGerberCoord(0)}Y${toGerberCoord(h)}D01*`);
    lines.push(`X${toGerberCoord(0)}Y${toGerberCoord(0)}D01*`);
  }

  lines.push("M02*");
  return lines.join("\n");
}

function generateCopperGerber(
  design: PCBDesign,
  layer: "top" | "bottom",
): string {
  const funcName = layer === "top" ? "Copper,L1,Top" : "Copper,L2,Bot";
  const lines = [generateGerberHeader(funcName)];

  lines.push("%ADD10C,1.000000*%");
  lines.push("%ADD11R,1.500000X1.500000*%");
  lines.push("%ADD12C,0.250000*%");

  const layerComponents = design.components.filter((c) => c.layer === layer);
  lines.push("D10*");
  for (const comp of layerComponents) {
    lines.push(`X${toGerberCoord(comp.x)}Y${toGerberCoord(comp.y)}D03*`);
  }

  const layerTraces = design.traces.filter((t) => t.layer === layer);
  lines.push("D12*");
  for (const trace of layerTraces) {
    if (trace.points.length > 0) {
      const first = trace.points[0];
      lines.push(`X${toGerberCoord(first.x)}Y${toGerberCoord(first.y)}D02*`);
      for (let i = 1; i < trace.points.length; i++) {
        const p = trace.points[i];
        lines.push(`X${toGerberCoord(p.x)}Y${toGerberCoord(p.y)}D01*`);
      }
    }
  }

  lines.push("M02*");
  return lines.join("\n");
}

function generateSilkscreenGerber(
  design: PCBDesign,
  layer: "top" | "bottom",
): string {
  const funcName = layer === "top" ? "Legend,Top" : "Legend,Bot";
  const lines = [generateGerberHeader(funcName)];
  lines.push("%ADD10C,0.150000*%");
  lines.push("D10*");

  const layerComponents = design.components.filter((c) => c.layer === layer);
  for (const comp of layerComponents) {
    lines.push(`X${toGerberCoord(comp.x)}Y${toGerberCoord(comp.y + 2)}D03*`);
  }

  lines.push("M02*");
  return lines.join("\n");
}

function generateSolderMaskGerber(
  design: PCBDesign,
  layer: "top" | "bottom",
): string {
  const funcName = layer === "top" ? "Soldermask,Top" : "Soldermask,Bot";
  const lines = [generateGerberHeader(funcName)];
  lines.push("%ADD10C,1.100000*%");
  lines.push("D10*");

  const layerComponents = design.components.filter((c) => c.layer === layer);
  for (const comp of layerComponents) {
    lines.push(`X${toGerberCoord(comp.x)}Y${toGerberCoord(comp.y)}D03*`);
  }

  lines.push("M02*");
  return lines.join("\n");
}

function generateDrillFile(design: PCBDesign): string {
  const lines = [
    "M48",
    ";DRILL file generated by Clover AI PCB Designer",
    ";FORMAT={-:-/ absolute / metric / decimal}",
    "FMAT,2",
    "METRIC,TZ",
  ];

  lines.push("T1C0.800");
  if (design.mountingHoles.length > 0) {
    const mhDia = design.mountingHoles[0].diameter;
    lines.push(`T2C${mhDia.toFixed(3)}`);
  }
  lines.push("%");

  lines.push("T1");
  for (const hole of design.drillHoles) {
    lines.push(`X${hole.x.toFixed(3)}Y${hole.y.toFixed(3)}`);
  }

  if (design.mountingHoles.length > 0) {
    lines.push("T2");
    for (const mh of design.mountingHoles) {
      lines.push(`X${mh.x.toFixed(3)}Y${mh.y.toFixed(3)}`);
    }
  }

  lines.push("T0");
  lines.push("M30");
  return lines.join("\n");
}

function toGerberCoord(mm: number): string {
  return Math.round(mm * 1000000).toString();
}

async function createZipArchive(
  sourceDir: string,
  outputPath: string,
): Promise<void> {
  const zlib = await import("zlib");
  const entries = await fs.readdir(sourceDir);

  const fileBuffers: { name: string; data: Buffer }[] = [];
  for (const entry of entries) {
    const filePath = path.join(sourceDir, entry);
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      const data = await fs.readFile(filePath);
      fileBuffers.push({ name: entry, data });
    }
  }

  const centralDirectory: Buffer[] = [];
  const localFiles: Buffer[] = [];
  let offset = 0;

  for (const file of fileBuffers) {
    const nameBuffer = Buffer.from(file.name, "utf-8");
    const compressedData = await new Promise<Buffer>((resolve, reject) => {
      zlib.deflateRaw(new Uint8Array(file.data), (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const crc = crc32(file.data);

    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedData.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localHeader.set(nameBuffer, 30);

    localFiles.push(localHeader, compressedData);

    const cdEntry = Buffer.alloc(46 + nameBuffer.length);
    cdEntry.writeUInt32LE(0x02014b50, 0);
    cdEntry.writeUInt16LE(20, 4);
    cdEntry.writeUInt16LE(20, 6);
    cdEntry.writeUInt16LE(0, 8);
    cdEntry.writeUInt16LE(8, 10);
    cdEntry.writeUInt16LE(0, 12);
    cdEntry.writeUInt16LE(0, 14);
    cdEntry.writeUInt32LE(crc, 16);
    cdEntry.writeUInt32LE(compressedData.length, 20);
    cdEntry.writeUInt32LE(file.data.length, 24);
    cdEntry.writeUInt16LE(nameBuffer.length, 28);
    cdEntry.writeUInt16LE(0, 30);
    cdEntry.writeUInt16LE(0, 32);
    cdEntry.writeUInt16LE(0, 34);
    cdEntry.writeUInt16LE(0, 36);
    cdEntry.writeUInt32LE(0, 38);
    cdEntry.writeUInt32LE(offset, 42);
    cdEntry.set(nameBuffer, 46);

    centralDirectory.push(cdEntry);
    offset += localHeader.length + compressedData.length;
  }

  const cdBuffer = Buffer.concat(
    centralDirectory.map((b) => new Uint8Array(b)),
  );
  const cdOffset = offset;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(fileBuffers.length, 8);
  eocd.writeUInt16LE(fileBuffers.length, 10);
  eocd.writeUInt32LE(cdBuffer.length, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  const allParts = [...localFiles, cdBuffer, eocd].map(
    (b) => new Uint8Array(b),
  );
  const zipData = Buffer.concat(allParts);
  await fs.writeFile(outputPath, new Uint8Array(zipData));
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function buildJlcpcbOrderUrl(specs: PCBSpecs): string {
  const params = new URLSearchParams({
    type: "0",
    layers: specs.layers.toString(),
    dimensions: `${specs.width}x${specs.height}`,
    pcbQty: specs.quantity.toString(),
    impedance: specs.impedanceControl ? "yes" : "no",
    pcbColor: specs.color,
    surfaceFinish:
      specs.finish === "hasl"
        ? "1"
        : specs.finish === "leadfree-hasl"
          ? "2"
          : specs.finish === "enig"
            ? "3"
            : "4",
    copperWeight: specs.copperWeight === "1oz" ? "1" : "2",
    boardThickness: specs.thickness.toString(),
    castellatedHoles: specs.castellatedHoles ? "1" : "0",
    stencil: specs.stencil ? "1" : "0",
  });
  return `https://cart.jlcpcb.com/quote?${params.toString()}`;
}

export async function openJlcpcbOrder(specs: PCBSpecs): Promise<void> {
  const url = buildJlcpcbOrderUrl(specs);
  await shell.openExternal(url);
}

export function createOrder(design: PCBDesign): PCBOrder {
  const id = crypto.randomUUID();
  const quote = estimateQuote(design.specs);
  const order: PCBOrder = {
    id,
    design,
    quote,
    status: "draft",
    createdAt: new Date().toISOString(),
  };
  orders.set(id, order);
  return order;
}

export function getOrder(id: string): PCBOrder | undefined {
  return orders.get(id);
}

export function updateOrderStatus(
  id: string,
  status: PCBOrderStatus,
): PCBOrder | undefined {
  const order = orders.get(id);
  if (order) {
    order.status = status;
  }
  return order;
}

export function listOrders(): PCBOrder[] {
  return Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

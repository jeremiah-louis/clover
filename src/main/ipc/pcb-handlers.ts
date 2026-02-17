import { ipcMain, dialog, BrowserWindow } from "electron";
import * as fs from "fs/promises";
import * as jlcpcbService from "../services/jlcpcb";
import { PcbApiError } from "../../shared/errors";
import type { PCBDesign, PCBSpecs } from "../../shared/pcb-types";

export function registerPcbHandlers(): void {
  ipcMain.handle("pcb:get-quote", async (_event, specs: PCBSpecs) => {
    try {
      const quote = jlcpcbService.estimateQuote(specs);
      return { success: true, data: quote };
    } catch (error) {
      const pcbError =
        error instanceof PcbApiError
          ? error
          : PcbApiError.from(error, "pcb:get-quote");
      return { success: false, error: pcbError.toModel() };
    }
  });

  ipcMain.handle("pcb:generate-gerber", async (_event, design: PCBDesign) => {
    try {
      const gerberPath = await jlcpcbService.generateGerberPackage(design);
      return { success: true, data: gerberPath };
    } catch (error) {
      const pcbError =
        error instanceof PcbApiError
          ? error
          : PcbApiError.from(error, "pcb:generate-gerber");
      return { success: false, error: pcbError.toModel() };
    }
  });

  ipcMain.handle("pcb:export-gerber", async (event, design: PCBDesign) => {
    try {
      const gerberPath = await jlcpcbService.generateGerberPackage(design);
      const win = BrowserWindow.fromWebContents(event.sender);
      const result = await dialog.showSaveDialog(win!, {
        defaultPath: `${design.name.replace(/\s+/g, "-")}-gerber.zip`,
        filters: [{ name: "ZIP Archive", extensions: ["zip"] }],
      });
      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }
      await fs.copyFile(gerberPath, result.filePath);
      return { success: true, data: result.filePath };
    } catch (error) {
      const pcbError =
        error instanceof PcbApiError
          ? error
          : PcbApiError.from(error, "pcb:export-gerber");
      return { success: false, error: pcbError.toModel() };
    }
  });

  ipcMain.handle("pcb:create-order", async (_event, design: PCBDesign) => {
    try {
      const order = jlcpcbService.createOrder(design);
      return { success: true, data: order };
    } catch (error) {
      const pcbError =
        error instanceof PcbApiError
          ? error
          : PcbApiError.from(error, "pcb:create-order");
      return { success: false, error: pcbError.toModel() };
    }
  });

  ipcMain.handle("pcb:open-jlcpcb", async (_event, specs: PCBSpecs) => {
    try {
      await jlcpcbService.openJlcpcbOrder(specs);
      return { success: true };
    } catch (error) {
      const pcbError =
        error instanceof PcbApiError
          ? error
          : PcbApiError.from(error, "pcb:open-jlcpcb");
      return { success: false, error: pcbError.toModel() };
    }
  });

  ipcMain.handle("pcb:get-order-url", async (_event, specs: PCBSpecs) => {
    try {
      const url = jlcpcbService.buildJlcpcbOrderUrl(specs);
      return { success: true, data: url };
    } catch (error) {
      const pcbError =
        error instanceof PcbApiError
          ? error
          : PcbApiError.from(error, "pcb:get-order-url");
      return { success: false, error: pcbError.toModel() };
    }
  });

  ipcMain.handle("pcb:list-orders", async () => {
    try {
      const orders = jlcpcbService.listOrders();
      return { success: true, data: orders };
    } catch (error) {
      const pcbError =
        error instanceof PcbApiError
          ? error
          : PcbApiError.from(error, "pcb:list-orders");
      return { success: false, error: pcbError.toModel() };
    }
  });
}

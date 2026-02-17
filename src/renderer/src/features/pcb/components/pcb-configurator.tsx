import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { cn } from "@/utils";
import { toast } from "sonner";
import {
  ChevronDown,
  DollarSign,
  ExternalLink,
  Layers,
  Ruler,
  Palette,
  Settings2,
  Download,
  Loader2,
  Cpu,
  Package,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type {
  PCBDesign,
  PCBSpecs,
  PCBQuote,
  PCBColor,
  PCBFinish,
  PCBLayer,
  PCBThickness,
  PCBCopperWeight,
} from "@shared/pcb-types";
import { DEFAULT_PCB_SPECS } from "@shared/pcb-types";
import { PCBBoardPreview } from "./pcb-board-preview";

interface PCBConfiguratorProps {
  pcbDesignJson: string;
  isStreaming: boolean;
}

const COLOR_OPTIONS: { value: PCBColor; label: string; hex: string }[] = [
  { value: "green", label: "Green", hex: "#2d8c3c" },
  { value: "red", label: "Red", hex: "#c0392b" },
  { value: "yellow", label: "Yellow", hex: "#f1c40f" },
  { value: "blue", label: "Blue", hex: "#2980b9" },
  { value: "white", label: "White", hex: "#ecf0f1" },
  { value: "black", label: "Black", hex: "#2c3e50" },
  { value: "purple", label: "Purple", hex: "#8e44ad" },
];

const FINISH_OPTIONS: { value: PCBFinish; label: string }[] = [
  { value: "hasl", label: "HASL" },
  { value: "leadfree-hasl", label: "Lead-free HASL" },
  { value: "enig", label: "ENIG" },
  { value: "osp", label: "OSP" },
];

const LAYER_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "1 Layer" },
  { value: "2", label: "2 Layers" },
  { value: "4", label: "4 Layers" },
  { value: "6", label: "6 Layers" },
];

const THICKNESS_OPTIONS: { value: string; label: string }[] = [
  { value: "0.8", label: "0.8 mm" },
  { value: "1", label: "1.0 mm" },
  { value: "1.2", label: "1.2 mm" },
  { value: "1.6", label: "1.6 mm" },
  { value: "2", label: "2.0 mm" },
];

export function PCBConfigurator({
  pcbDesignJson,
  isStreaming,
}: PCBConfiguratorProps) {
  const [design, setDesign] = useState<PCBDesign | null>(null);
  const [specs, setSpecs] = useState<PCBSpecs>(DEFAULT_PCB_SPECS);
  const [quote, setQuote] = useState<PCBQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "board",
  );
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!pcbDesignJson) return;
    try {
      const parsed = JSON.parse(pcbDesignJson) as PCBDesign;
      setDesign(parsed);
      if (parsed.specs) {
        setSpecs(parsed.specs);
      }
    } catch {
      // partial JSON during streaming
    }
  }, [pcbDesignJson]);

  const fetchQuote = useCallback(async () => {
    setIsQuoting(true);
    try {
      const result = await window.pcb.getQuote(specs);
      if (result.success && result.data) {
        setQuote(result.data as PCBQuote);
      }
    } catch {
    } finally {
      setIsQuoting(false);
    }
  }, [specs]);

  useEffect(() => {
    if (!design || isStreaming) return;
    clearTimeout(quoteTimerRef.current);
    quoteTimerRef.current = setTimeout(() => {
      fetchQuote();
    }, 400);
    return () => clearTimeout(quoteTimerRef.current);
  }, [specs, design, isStreaming, fetchQuote]);

  const handleSpecChange = <K extends keyof PCBSpecs>(
    key: K,
    value: PCBSpecs[K],
  ) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
    setQuote(null);
  };

  const handleExportGerber = async () => {
    if (!design) return;
    setIsExporting(true);
    try {
      const updated = { ...design, specs };
      const result = await window.pcb.exportGerber(updated);
      if (result.success && result.data) {
        toast.success("Gerber files exported");
      } else if (!result.canceled) {
        toast.error("Failed to export Gerber files");
      }
    } catch {
      toast.error("Failed to export Gerber files");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOrderJlcpcb = async () => {
    try {
      await window.pcb.openJlcpcb(specs);
      toast.success("Opened JLCPCB in your browser");
    } catch {
      toast.error("Failed to open JLCPCB");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const previewDesign = useMemo(() => {
    if (!design) return null;
    return { ...design, specs };
  }, [design, specs]);

  if (!pcbDesignJson && !design) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-6">
        <div className="text-center space-y-2">
          <Cpu className="w-8 h-8 mx-auto opacity-40" />
          <p>No PCB design yet</p>
          <p className="text-xs opacity-70">
            Ask the AI to design a custom PCB for your circuit
          </p>
        </div>
      </div>
    );
  }

  if (isStreaming && !design) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-6">
        <div className="text-center space-y-2">
          <Loader2 className="w-6 h-6 mx-auto animate-spin opacity-40" />
          <p>Generating PCB design...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold truncate flex-1">
            {design?.name ?? "Custom PCB"}
          </h3>
          {design && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {specs.layers}L
            </Badge>
          )}
        </div>
        {design?.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {design.description}
          </p>
        )}
      </div>

      {previewDesign && (
        <div className="shrink-0 border-b border-border bg-muted/20">
          <PCBBoardPreview design={previewDesign} className="h-[200px] p-3" />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        <Section
          title="Board Specs"
          icon={<Layers className="w-3.5 h-3.5" />}
          isOpen={expandedSection === "board"}
          onToggle={() => toggleSection("board")}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Layers
              </Label>
              <Select
                value={specs.layers.toString()}
                onValueChange={(v) =>
                  handleSpecChange("layers", parseInt(v) as PCBLayer)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Thickness
              </Label>
              <Select
                value={specs.thickness.toString()}
                onValueChange={(v) =>
                  handleSpecChange("thickness", parseFloat(v) as PCBThickness)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THICKNESS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Copper Weight
              </Label>
              <Select
                value={specs.copperWeight}
                onValueChange={(v) =>
                  handleSpecChange("copperWeight", v as PCBCopperWeight)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1oz">1 oz</SelectItem>
                  <SelectItem value="2oz">2 oz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Surface Finish
              </Label>
              <Select
                value={specs.finish}
                onValueChange={(v) =>
                  handleSpecChange("finish", v as PCBFinish)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINISH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Section
          title="Dimensions & Quantity"
          icon={<Ruler className="w-3.5 h-3.5" />}
          isOpen={expandedSection === "dims"}
          onToggle={() => toggleSection("dims")}
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Width (mm)
              </Label>
              <input
                type="number"
                value={specs.width}
                onChange={(e) =>
                  handleSpecChange("width", parseFloat(e.target.value) || 0)
                }
                min={5}
                max={500}
                className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Height (mm)
              </Label>
              <input
                type="number"
                value={specs.height}
                onChange={(e) =>
                  handleSpecChange("height", parseFloat(e.target.value) || 0)
                }
                min={5}
                max={500}
                className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Quantity
              </Label>
              <input
                type="number"
                value={specs.quantity}
                onChange={(e) =>
                  handleSpecChange(
                    "quantity",
                    Math.max(1, Math.round(parseFloat(e.target.value) || 1)),
                  )
                }
                min={1}
                max={10000}
                className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </Section>

        <Section
          title="Solder Mask"
          icon={<Palette className="w-3.5 h-3.5" />}
          isOpen={expandedSection === "color"}
          onToggle={() => toggleSection("color")}
        >
          <div className="flex flex-wrap gap-1.5">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleSpecChange("color", color.value)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
                  specs.color === color.value
                    ? "ring-2 ring-primary ring-offset-1 ring-offset-background bg-accent"
                    : "hover:bg-accent/50",
                )}
              >
                <span
                  className="w-3 h-3 rounded-full border border-border/50 shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                {color.label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title="Advanced"
          icon={<Settings2 className="w-3.5 h-3.5" />}
          isOpen={expandedSection === "advanced"}
          onToggle={() => toggleSection("advanced")}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="castellated" className="text-xs">
                Castellated Holes
              </Label>
              <Switch
                id="castellated"
                checked={specs.castellatedHoles}
                onCheckedChange={(v) => handleSpecChange("castellatedHoles", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="impedance" className="text-xs">
                Impedance Control
              </Label>
              <Switch
                id="impedance"
                checked={specs.impedanceControl}
                onCheckedChange={(v) => handleSpecChange("impedanceControl", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="stencil" className="text-xs">
                Stencil
              </Label>
              <Switch
                id="stencil"
                checked={specs.stencil}
                onCheckedChange={(v) => handleSpecChange("stencil", v)}
              />
            </div>
          </div>
        </Section>

        {design && design.components.length > 0 && (
          <Section
            title={`Components (${design.components.length})`}
            icon={<Package className="w-3.5 h-3.5" />}
            isOpen={expandedSection === "components"}
            onToggle={() => toggleSection("components")}
          >
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 pb-1">
                <span>Ref</span>
                <span>Value</span>
                <span>Package</span>
              </div>
              {design.components.map((comp) => (
                <div
                  key={comp.designator}
                  className="grid grid-cols-3 gap-2 text-xs py-1.5 px-2 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <span className="font-mono font-semibold">
                    {comp.designator}
                  </span>
                  <span className="text-muted-foreground truncate">
                    {comp.value}
                  </span>
                  <span className="text-muted-foreground/70 truncate">
                    {comp.package}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-muted/20 p-3 space-y-3">
        {quote ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                Estimated Quote
              </div>
              {isQuoting && (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
              <span className="text-muted-foreground">PCB</span>
              <span className="text-right font-medium tabular-nums">
                ${quote.breakdown.pcbCost.toFixed(2)}
              </span>
              {quote.breakdown.stencilCost > 0 && (
                <>
                  <span className="text-muted-foreground">Stencil</span>
                  <span className="text-right font-medium tabular-nums">
                    ${quote.breakdown.stencilCost.toFixed(2)}
                  </span>
                </>
              )}
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-right font-medium tabular-nums">
                ${quote.breakdown.shippingCost.toFixed(2)}
              </span>
              <span className="text-muted-foreground font-medium pt-1 mt-1 border-t border-border">
                Total
              </span>
              <span className="text-right font-semibold text-foreground pt-1 mt-1 border-t border-border tabular-nums">
                ${quote.totalPrice.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              {quote.quantity} boards · ${quote.unitPrice.toFixed(2)}/ea · ~
              {quote.estimatedDays} business days
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
            {isQuoting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Calculating quote...
              </>
            ) : (
              <>
                <DollarSign className="w-3 h-3 opacity-50" />
                Quote will appear here
              </>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleExportGerber}
            disabled={!design || isExporting}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {isExporting ? "Exporting..." : "Export Gerber"}
          </button>
          <button
            onClick={handleOrderJlcpcb}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Order on JLCPCB
          </button>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, icon, isOpen, onToggle, children }: SectionProps) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      >
        {icon}
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

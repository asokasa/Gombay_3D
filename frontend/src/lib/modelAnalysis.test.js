import { describe, expect, it } from "vitest";
import { analyze3DFile, calculateQuote } from "./modelAnalysis";

describe("calculateQuote", () => {
  it("uses the recommended scale when the model exceeds the print volume", () => {
    const quote = calculateQuote({
      filamentKey: "PLA",
      analysis: {
        volumeCm3: 1000,
        surfaceAreaCm2: 600,
        sizeCm: [40, 10, 10],
        autoScale: { recommendedScale: 0.75 },
      },
    });

    expect(quote.scale).toBe(0.75);
    expect(quote.scaledSizeCm).toEqual([30, 7.5, 7.5]);
    expect(quote.scaledVolumeCm3).toBeCloseTo(421.875);
    expect(quote.scaledSurfaceAreaCm2).toBeCloseTo(337.5);
  });

  it("keeps unknown surface area unknown instead of pricing it as zero surface", () => {
    const quote = calculateQuote({
      filamentKey: "PLA",
      analysis: {
        volumeCm3: 10,
        surfaceAreaCm2: null,
        sizeCm: [1, 1, 1],
        autoScale: { recommendedScale: 1 },
      },
    });

    expect(quote.scaledSurfaceAreaCm2).toBeNull();
    expect(quote.finishingCost).toBe(0);
    expect(Number.isFinite(quote.total)).toBe(true);
  });

  it("uses admin-managed calculator cost settings", () => {
    const quote = calculateQuote({
      filamentKey: "PLA",
      analysis: {
        volumeCm3: 100,
        surfaceAreaCm2: 50,
        sizeCm: [10, 10, 1],
        autoScale: { recommendedScale: 1 },
      },
      calculatorSettings: {
        serviceFeeHuf: 1000,
        machineRateHufPerHour: 2000,
        fallbackMaterialCostHufPerCm3: 12.5,
        finishingCostHufPerCm2: 2,
        printSpeedCm3PerHour: 10,
        infillFactor: 0.5,
        minimumPrintHours: 1,
      },
    });

    expect(quote.hours).toBe(5);
    expect(quote.machineCost).toBe(10000);
    expect(quote.finishingCost).toBe(100);
    expect(quote.serviceFee).toBe(1000);
    expect(quote.materialCost).toBeCloseTo(1860);
    expect(quote.total).toBeCloseTo(12960);
  });

  it("updates material volume from the selected infill percentage", () => {
    const baseAnalysis = {
      volumeCm3: 100,
      surfaceAreaCm2: 50,
      sizeCm: [10, 10, 1],
      autoScale: { recommendedScale: 1 },
    };

    const lowInfill = calculateQuote({
      filamentKey: "PLA",
      analysis: baseAnalysis,
      infillPercent: 20,
    });
    const highInfill = calculateQuote({
      filamentKey: "PLA",
      analysis: baseAnalysis,
      infillPercent: 80,
    });
    const hollowInfill = calculateQuote({
      filamentKey: "PLA",
      analysis: baseAnalysis,
      infillPercent: 0,
    });

    expect(lowInfill.infillPercent).toBe(20);
    expect(lowInfill.effectiveVolumeCm3).toBeGreaterThan(hollowInfill.effectiveVolumeCm3);
    expect(highInfill.effectiveVolumeCm3).toBeGreaterThan(lowInfill.effectiveVolumeCm3);
    expect(highInfill.total).toBeGreaterThan(lowInfill.total);
  });

  it("adjusts print time for the selected print profile", () => {
    const analysis = {
      volumeCm3: 100,
      surfaceAreaCm2: 50,
      sizeCm: [10, 10, 1],
      autoScale: { recommendedScale: 1 },
    };

    const normal = calculateQuote({
      filamentKey: "PLA",
      analysis,
      infillPercent: 20,
      printProfileKey: "NORMAL",
    });
    const detailed = calculateQuote({
      filamentKey: "PLA",
      analysis,
      infillPercent: 20,
      printProfileKey: "DETAIL",
    });

    expect(detailed.printProfile.layerHeightMm).toBe(0.1);
    expect(detailed.hours).toBeGreaterThan(normal.hours);
    expect(detailed.total).toBeGreaterThan(normal.total);
  });

  it("scales print-dependent totals by requested quantity", () => {
    const analysis = {
      volumeCm3: 100,
      surfaceAreaCm2: 50,
      sizeCm: [10, 10, 1],
      autoScale: { recommendedScale: 1 },
    };

    const single = calculateQuote({
      filamentKey: "PLA",
      analysis,
      infillPercent: 20,
      quantity: 1,
    });
    const multi = calculateQuote({
      filamentKey: "PLA",
      analysis,
      infillPercent: 20,
      quantity: 3,
    });

    expect(multi.quantity).toBe(3);
    expect(multi.singleItem.effectiveVolumeCm3).toBeCloseTo(single.effectiveVolumeCm3);
    expect(multi.effectiveVolumeCm3).toBeCloseTo(single.effectiveVolumeCm3 * 3);
    expect(multi.hours).toBeCloseTo(single.hours * 3);
    expect(multi.materialCost).toBeCloseTo(single.materialCost * 3);
    expect(multi.serviceFee).toBe(single.serviceFee);
    expect(multi.total).toBeCloseTo(single.serviceFee + (single.total - single.serviceFee) * 3);
  });

  it("uses STEP bounding-box dimensions for approximate surface and volume", async () => {
    const stepFile = {
      name: "sample.step",
      text: async () =>
        ["CARTESIAN_POINT('', (0, 0, 0));", "CARTESIAN_POINT('', (10, 20, 30));"].join("\n"),
    };

    const analysis = await analyze3DFile(stepFile);

    expect(analysis.sizeCm).toEqual([1, 2, 3]);
    expect(analysis.volumeCm3).toBe(6);
    expect(analysis.surfaceAreaCm2).toBe(22);
  });
});

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

  it("uses STEP bounding-box dimensions for approximate surface and volume", async () => {
    const stepFile = {
      name: "sample.step",
      text: async () =>
        [
          "CARTESIAN_POINT('', (0, 0, 0));",
          "CARTESIAN_POINT('', (10, 20, 30));",
        ].join("\n"),
    };

    const analysis = await analyze3DFile(stepFile);

    expect(analysis.sizeCm).toEqual([1, 2, 3]);
    expect(analysis.volumeCm3).toBe(6);
    expect(analysis.surfaceAreaCm2).toBe(22);
  });
});

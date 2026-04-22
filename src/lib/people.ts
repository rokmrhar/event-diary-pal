export const PEOPLE = [
  "Melissa Bajt Vodopivec",
  "Dimitrij Bensa",
  "Aljaž Bremec",
  "Klemen Brisko",
  "Leon Cijan",
  "Boris Cotič",
  "Filip Černič",
  "Tadej Devetak",
];

export const ACTIVITY_TYPES = ["VAJE", "DELOVNI PONEDELJEK", "DELOVNI DAN", "DRUGO"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const VEHICLES = [
  { tip: "PV-1", znak: "ŠEM. 20" },
  { tip: "GVC 16/25", znak: "ŠEM. 41" },
  { tip: "AC 30/120", znak: "ŠEM. 42" },
  { tip: "GVC 16/50", znak: "ŠEM. 30" },
  { tip: "GVGP-1", znak: "ŠEM. 53" },
  { tip: "GTV", znak: "ŠEM. 52" },
  { tip: "GVM-1", znak: "ŠEM. 31" },
] as const;

export const SKUPINE = ["1", "2", "3", "4", "VSA"] as const;
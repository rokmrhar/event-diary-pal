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
import IdaEvidencaApp, { IdaField } from "@/components/ida/IdaEvidencaApp";

const FIELDS: IdaField[] = [
  { key: "vozilo", label: "Vozilo", type: "text", placeholder: "npr. GVC-1, AC-1..." },
  { key: "ida_aparat", label: "IDA Aparat", type: "text", placeholder: "npr. Dräger PSS 5000" },
  { key: "opombe", label: "Opombe", type: "textarea", placeholder: "Dodatne informacije" },
];

export default function IdaSeznamVozil() {
  return (
    <IdaEvidencaApp
      title="Seznam IDA po vozilih"
      table="ida_vozila"
      fields={FIELDS}
      primaryKey="vozilo"
    />
  );
}

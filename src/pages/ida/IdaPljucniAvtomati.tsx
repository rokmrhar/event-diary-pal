import IdaEvidencaApp, { IdaField } from "@/components/ida/IdaEvidencaApp";

const FIELDS: IdaField[] = [
  { key: "naziv", label: "Naziv", type: "text", required: true },
  { key: "znamka", label: "Znamka", type: "text" },
  { key: "tip", label: "Tip", type: "text" },
  { key: "serijska_st", label: "Serijska št.", type: "text" },
  { key: "leto_izdelave", label: "Leto izdelave", type: "year" },
  { key: "datum_zadnjega_pregleda", label: "Zadnji pregled", type: "month" },
  { key: "datum_veljavnosti_pregleda", label: "Velja do", type: "month" },
  { key: "lokacija", label: "Lokacija", type: "text" },
  { key: "opombe", label: "Opombe", type: "textarea" },
];

export default function IdaPljucniAvtomati() {
  return (
    <IdaEvidencaApp
      title="Pljučni avtomati"
      table="ida_pljucni_avtomati"
      fields={FIELDS}
      primaryKey="naziv"
    />
  );
}
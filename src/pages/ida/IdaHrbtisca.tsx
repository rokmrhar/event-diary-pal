import IdaEvidencaApp, { IdaField } from "@/components/ida/IdaEvidencaApp";

const FIELDS: IdaField[] = [
  { key: "interna_st", label: "Interna št.", type: "text", required: true },
  { key: "znamka", label: "Znamka", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "serijska_st", label: "Serijska št.", type: "text" },
  { key: "leto_izdelave", label: "Leto izdelave", type: "year" },
  { key: "datum_pregleda", label: "Datum pregleda", type: "month" },
  { key: "lokacija", label: "Lokacija", type: "text" },
  { key: "opombe", label: "Opombe", type: "textarea" },
];

export default function IdaHrbtisca() {
  return (
    <IdaEvidencaApp
      title="Hrbtišča"
      table="ida_hrbtisca"
      fields={FIELDS}
      primaryKey="interna_st"
    />
  );
}
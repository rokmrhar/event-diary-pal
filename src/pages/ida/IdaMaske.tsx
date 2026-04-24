import IdaEvidencaApp, { IdaField } from "@/components/ida/IdaEvidencaApp";

const FIELDS: IdaField[] = [
  { key: "interna_st", label: "Interna št.", type: "text", required: true },
  { key: "proizvajalec", label: "Proizvajalec", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "serijska_st", label: "Serijska št.", type: "text", placeholder: "črke in številke" },
  { key: "leto_izdelave", label: "Leto izdelave", type: "year" },
  { key: "datum_menjave_membrane", label: "Menjava membrane", type: "year" },
  { key: "datum_menjave_ventila", label: "Menjava ventila", type: "year" },
  { key: "datum_zadnjega_pregleda", label: "Zadnji pregled", type: "month" },
  { key: "datum_veljavnosti_pregleda", label: "Velja do", type: "year" },
];

export default function IdaMaske() {
  return (
    <IdaEvidencaApp
      title="Maske"
      table="ida_maske"
      fields={FIELDS}
      primaryKey="interna_st"
    />
  );
}

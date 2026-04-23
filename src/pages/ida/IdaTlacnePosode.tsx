import IdaEvidencaApp, { IdaField } from "@/components/ida/IdaEvidencaApp";

const FIELDS: IdaField[] = [
  { key: "interna_st", label: "Interna št.", type: "text", required: true },
  { key: "proizvajalec", label: "Proizvajalec", type: "text" },
  { key: "vrsta", label: "Vrsta posode", type: "select", options: ["kompozit", "jeklena"] },
  { key: "serijska_st", label: "Serijska št.", type: "text" },
  { key: "leto_proizvodnje", label: "Leto proizvodnje", type: "year" },
  { key: "kapaciteta_l", label: "Kapaciteta", type: "number", suffix: "L" },
  { key: "tlak_bar", label: "Tlak", type: "number", suffix: "bar" },
  { key: "datum_zadnjega_pregleda", label: "Zadnji pregled", type: "month" },
  { key: "datum_veljavnosti_pregleda", label: "Velja do", type: "month" },
  { key: "opombe", label: "Opombe", type: "textarea" },
];

export default function IdaTlacnePosode() {
  return (
    <IdaEvidencaApp
      title="Tlačne posode"
      table="ida_tlacne_posode"
      fields={FIELDS}
      primaryKey="interna_st"
    />
  );
}
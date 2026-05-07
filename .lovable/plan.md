Predlagam, da to obsežno zahtevo razdelim na več logičnih sklopov. Vse skupaj zahteva globoko preureditev pravic in nove tabele v bazi, zato želim potrditev pristopa, preden se lotim implementacije.

## 1. Sistem pravic — Ogled / Urejanje za vse module
Trenutno imamo eno pravico na modul (= urejanje), ogled pa je odprt vsem prijavljenim. Spreminjam v dvonivojski sistem (kot že obstaja za `medical_view` / `medical_edit`).

- Migracija: `user_module_permissions.level text` z vrednostma `view` | `edit` (`edit` implicitno vključuje `view`).
- Nova SQL funkcija `has_module_access(_user_id, _module, _level)`.
- Posodobim **vse RLS politike** za module: `activities, interventions, ida, mass_events, vehicles, services, inspections, cylinder_fillings, pranja, potni_nalog` — SELECT zahteva `view`, INSERT/UPDATE/DELETE zahteva `edit`.
- Admin UsersTab: namesto checkboxa pokažem dropdown po modulu (Brez / Ogled / Urejanje).
- Frontend: `useModulePermissions` vrne `canView(module)` in `canEdit(module)`.
- Levi meni in router skrijeta povezave/strani brez `canView`. Na straneh: če samo `view`, gumbi Dodaj/Uredi/Briši so skriti.
- Module `medical_view`/`medical_edit` poenotim v `medical` z nivojem.

## 2. Editable levi meni (admin)
- Nova tabela `nav_items`: `id, kind ('link'|'separator'), label, url, icon, module_key, external bool, sort_order int, visible bool`.
- Seed obstoječih povezav iz trenutnega `sidebarItems`.
- Admin tab **"Meni"**: drag-and-drop razvrščanje (`@dnd-kit`), gumbi Uredi/Briši, dodajanje nove povezave (interna pot ali zunanji URL), dodajanje ločnika (label kot "Operativa", "V izdelavi").
- `AppShell` bere `nav_items` iz baze in upošteva `module_key` za pravice ogleda.
- Ikone: izbira iz vnaprej določenega seznama lucide ikon (dropdown s ~30 najpogostejšimi).

## 3. CMS — uporabniško definirane strani
- Tabela `cms_pages`: `id, slug unique, title, content_html text, content_type ('html'|'markdown'), module_key text, visible bool, sort_order int`.
- Admin tab **"Strani"**: seznam, gumb Nova stran, urejevalnik (textarea z monospace + preview za HTML/MD; brez težkih WYSIWYG knjižnic — `marked` za MD, `DOMPurify` za varnost).
- Nova route `/p/:slug` ki naloži stran iz baze in jo prikaže znotraj `AppShell`.
- Povezave do CMS strani lahko admin doda v Meni (točka 2) preko interne poti `/p/<slug>`.

## 4. Sortabilni IDA seznami
- V `IdaEvidencaApp` dodam stanje `sortKey, sortDir` in klikljive glave stolpcev (puščica gor/dol).
- Sortiranje: tekst case-insensitive, številke numerično, datumi po ISO. Velja tudi za `extraColumn` (npr. "Št. polnjenj" na Tlačnih posodah).
- Privzeto: brez sortiranja (obstoječ vrstni red), klik = asc, drugi klik = desc, tretji = brez.

## 5. Manjši popravki
- **Index/Dashboard**: "Dobrodošli, **{ime uporabnika}**" — preberem `profiles.display_name` (ali del e-pošte pred `@`) namesto literalnega "ime uporabnika".
- **Arhiv aktivnosti**: novi route `/arhiv-aktivnosti`, vsebina iz `ActivitiesTab` premaknjena v `src/pages/ArhivAktivnosti.tsx`. V `nav_items` seed dodam povezavo. Pravice: `activities` z `view`. Iz Admin/Tabs odstranim zavihek "Aktivnosti".

## Vrstni red dela
1. DB migracija: `user_module_permissions.level`, `nav_items`, `cms_pages`, posodobitev RLS, seed.
2. Backend hooks: `useModulePermissions` (view/edit), `useNavItems`, `useCmsPages`.
3. AppShell: bere meni iz baze, filtrira po pravicah.
4. Admin: nova zavihka **Meni** in **Strani**; UsersTab predelan na 3-stopenjske pravice; Aktivnosti odstranjene.
5. Strani: `ArhivAktivnosti`, `CmsPage` (`/p/:slug`).
6. IDA: sortiranje stolpcev v `IdaEvidencaApp`.
7. Dashboard: popravek pozdrava.

## Tehnične podrobnosti
- Drag-and-drop: `@dnd-kit/core` + `@dnd-kit/sortable` (lahki, brez konfliktov).
- Markdown: `marked` + `dompurify` (~20kB skupaj).
- Migracija RLS bo obsežna (~30 politik) — vse v eni transakciji.
- Obstoječi zapisi v `user_module_permissions` brez `level` se interpretirajo kot `edit` (backward-compat), tako da nihče ne izgubi dostopa.

## Vprašanje pred začetkom
Glede na obseg, naj naredim **vse v enem kosu** (1 velika migracija + ~15 datotek), ali raje **po sklopih** (najprej pravice + meni + dashboard, nato CMS + arhiv aktivnosti + sortiranje IDA)?

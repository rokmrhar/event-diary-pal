-- VEHICLES
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  oznaka TEXT NOT NULL,
  registracija TEXT,
  znamka TEXT,
  model TEXT,
  st_sedezev INTEGER,
  opombe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitted can insert vehicles" ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'vehicles'));
CREATE POLICY "Permitted can update vehicles" ON public.vehicles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'vehicles')));
CREATE POLICY "Permitted can delete vehicles" ON public.vehicles FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'vehicles')));

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SERVICES (knjiga servisov in popravil)
CREATE TABLE public.vehicle_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  datum DATE NOT NULL,
  opis TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view vehicle_services" ON public.vehicle_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitted can insert vehicle_services" ON public.vehicle_services FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'services'));
CREATE POLICY "Permitted can update vehicle_services" ON public.vehicle_services FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'services')));
CREATE POLICY "Permitted can delete vehicle_services" ON public.vehicle_services FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'services')));

CREATE TRIGGER update_vehicle_services_updated_at BEFORE UPDATE ON public.vehicle_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- INSPECTIONS (tehnični pregledi)
CREATE TABLE public.vehicle_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  zadnji_pregled DATE,
  naslednji_pregled DATE,
  opombe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view vehicle_inspections" ON public.vehicle_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitted can insert vehicle_inspections" ON public.vehicle_inspections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'inspections'));
CREATE POLICY "Permitted can update vehicle_inspections" ON public.vehicle_inspections FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'inspections')));
CREATE POLICY "Permitted can delete vehicle_inspections" ON public.vehicle_inspections FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'inspections')));

CREATE TRIGGER update_vehicle_inspections_updated_at BEFORE UPDATE ON public.vehicle_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- POLNJENJA TLACNIH POSOD
CREATE TABLE public.tlacne_posode_polnjenja (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  posoda_id UUID NOT NULL REFERENCES public.ida_tlacne_posode(id) ON DELETE CASCADE,
  datum DATE NOT NULL,
  polnil TEXT NOT NULL,
  opombe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tlacne_posode_polnjenja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view polnjenja" ON public.tlacne_posode_polnjenja FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitted can insert polnjenja" ON public.tlacne_posode_polnjenja FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_module_permission(auth.uid(), 'cylinder_fillings'));
CREATE POLICY "Permitted can update polnjenja" ON public.tlacne_posode_polnjenja FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'cylinder_fillings')));
CREATE POLICY "Permitted can delete polnjenja" ON public.tlacne_posode_polnjenja FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR (auth.uid() = user_id AND has_module_permission(auth.uid(), 'cylinder_fillings')));

CREATE TRIGGER update_polnjenja_updated_at BEFORE UPDATE ON public.tlacne_posode_polnjenja
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_polnjenja_posoda ON public.tlacne_posode_polnjenja(posoda_id);
CREATE INDEX idx_services_vehicle ON public.vehicle_services(vehicle_id);
CREATE INDEX idx_inspections_vehicle ON public.vehicle_inspections(vehicle_id);
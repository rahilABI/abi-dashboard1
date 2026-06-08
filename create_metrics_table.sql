CREATE TABLE IF NOT EXISTS public.project_metrics (
  ticket_id TEXT PRIMARY KEY REFERENCES public.projects(ticket_id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  tools_used TEXT,
  process_time_before TEXT,
  process_time_after TEXT,
  process_before TEXT,
  process_after TEXT,
  error_rate_before TEXT,
  error_rate_after TEXT,
  security_rate TEXT,
  data_visibility_improved TEXT,
  adoption_rate NUMERIC,
  sla_compliance NUMERIC,
  error_rate_reduced NUMERIC,
  total_hours_saved NUMERIC,
  optimization_rate TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.project_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for authenticated users or anon depending on the project setup)
CREATE POLICY "Allow public read access" ON public.project_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.project_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.project_metrics FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.project_metrics FOR DELETE USING (true);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_metrics_modtime
BEFORE UPDATE ON public.project_metrics
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

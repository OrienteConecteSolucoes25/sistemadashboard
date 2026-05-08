ALTER TABLE public.eng_shared_records REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eng_shared_records;
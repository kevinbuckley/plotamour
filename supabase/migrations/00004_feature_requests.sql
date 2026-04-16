-- Feature requests table for early-stage user feedback

CREATE TABLE public.feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can insert feature requests" ON public.feature_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own requests
CREATE POLICY "Users can view own feature requests" ON public.feature_requests
  FOR SELECT USING (auth.uid() = user_id);

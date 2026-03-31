-- Story Promises (Chekhov's Wall — Promises & Payoffs)

CREATE TABLE public.story_promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  plant_scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  payoff_scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_story_promises_book_id ON public.story_promises(book_id);
CREATE INDEX idx_story_promises_plant_scene ON public.story_promises(plant_scene_id);
CREATE INDEX idx_story_promises_payoff_scene ON public.story_promises(payoff_scene_id);

ALTER TABLE public.story_promises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own story_promises" ON public.story_promises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = story_promises.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own story_promises" ON public.story_promises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = story_promises.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own story_promises" ON public.story_promises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = story_promises.book_id AND projects.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own story_promises" ON public.story_promises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.books
      JOIN public.projects ON projects.id = books.project_id
      WHERE books.id = story_promises.book_id AND projects.user_id = auth.uid()
    )
  );

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.story_promises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

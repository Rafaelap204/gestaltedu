-- Adicionar novos campos à tabela courses para funcionalidade de criação pelo admin
ALTER TABLE courses 
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS refund_period INTEGER DEFAULT 7 CHECK (refund_period IN (7, 15, 30)),
  ADD COLUMN IF NOT EXISTS content_release_strategy TEXT DEFAULT 'immediate' CHECK (content_release_strategy IN ('immediate', 'progressive')),
  ADD COLUMN IF NOT EXISTS content_release_days INTEGER,
  ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Adicionar constraint para garantir valor mínimo de R$30 para cursos pagos
-- Nota: Esta constraint pode falhar se já existirem cursos com preço entre 0 e 30
-- Se necessário, atualize os cursos existentes antes de aplicar esta constraint
DO $$
BEGIN
  -- Verifica se existem cursos que violariam a constraint
  IF NOT EXISTS (
    SELECT 1 FROM courses WHERE price > 0 AND price < 30
  ) THEN
    ALTER TABLE courses 
      ADD CONSTRAINT check_minimum_price CHECK (price >= 30 OR price = 0);
  END IF;
END $$;

-- Comentário explicativo
COMMENT ON COLUMN courses.refund_period IS 'Prazo de reembolso em dias: 7, 15 ou 30';
COMMENT ON COLUMN courses.content_release_strategy IS 'Estratégia de liberação: immediate (todo conteúdo) ou progressive (liberação gradual)';
COMMENT ON COLUMN courses.content_release_days IS 'Número de dias para liberação completa quando strategy = progressive';
COMMENT ON COLUMN courses.payment_methods IS 'Array JSON com formas de pagamento habilitadas: ["credit_card", "debit_card", "pix", "boleto"]';
COMMENT ON COLUMN courses.image_url IS 'URL da imagem do produto (formato 600x600px, máx 5MB)';

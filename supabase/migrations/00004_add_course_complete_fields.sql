-- Adicionar campos para informações completas do curso
ALTER TABLE courses 
  ADD COLUMN IF NOT EXISTS checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS member_area_configured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT false;

-- Criar função para verificar se curso está completo
CREATE OR REPLACE FUNCTION check_course_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_complete := (
    NEW.checkout_url IS NOT NULL AND 
    NEW.checkout_url != '' AND
    NEW.member_area_configured = true AND
    NEW.full_description IS NOT NULL AND
    NEW.full_description != '' AND
    NEW.image_url IS NOT NULL AND
    NEW.image_url != '' AND
    NEW.category IS NOT NULL AND
    NEW.category != ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar is_complete automaticamente
DROP TRIGGER IF EXISTS trg_check_course_completeness ON courses;
CREATE TRIGGER trg_check_course_completeness
  BEFORE INSERT OR UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION check_course_completeness();

COMMENT ON COLUMN courses.checkout_url IS 'URL de checkout gerada pelo Asaas para o produto';
COMMENT ON COLUMN courses.member_area_configured IS 'Indica se a área de membros foi configurada';
COMMENT ON COLUMN courses.is_complete IS 'Flag automática: true quando todas as informações obrigatórias estão preenchidas';

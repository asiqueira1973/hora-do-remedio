-- Triggers de carimbo de tempo (seção 7.7 do spec).
--
-- O Drizzle não modela CREATE TRIGGER no schema TypeScript, então elas
-- vivem aqui como migration customizada, versionada junto do resto.
--
-- trg_remedios_atualizado_em: grava datetime('now') em remedios.atualizado_em
-- a cada UPDATE, para não depender de a aplicação lembrar de preencher.
CREATE TRIGGER trg_remedios_atualizado_em
AFTER UPDATE ON remedios
FOR EACH ROW
BEGIN
  UPDATE remedios SET atualizado_em = datetime('now') WHERE id = NEW.id;
END;
--> statement-breakpoint
-- trg_preferencias_atualizado_em: idem, para preferencias.atualizado_em.
CREATE TRIGGER trg_preferencias_atualizado_em
AFTER UPDATE ON preferencias
FOR EACH ROW
BEGIN
  UPDATE preferencias SET atualizado_em = datetime('now') WHERE id = NEW.id;
END;

CREATE INDEX name_index ON collections USING GIN lower(name);
CREATE INDEX symbol_index ON collections USING GIN lower(symbol);
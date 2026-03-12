-- ============================================================================
-- Seed: 002_seed_events.sql
-- Description: Sample events and agent exposures for testing
-- ============================================================================

-- ============================================================================
-- SAMPLE EVENTS
-- ============================================================================

-- National events
INSERT INTO events (title, summary, category, territory_scope, territory_id, intensity, source, source_url, event_date) VALUES
('Reforma Previsional Aprobada', 'El Congreso aprobó la reforma al sistema de pensiones con cambios significativos en las cotizaciones y beneficios. La medida genera debate sobre su impacto en la economía familiar.', 'political', 'national', NULL, 8, 'La Tercera', 'https://www.latercera.com', CURRENT_DATE - INTERVAL '5 days'),

('Alza del Dólar', 'El dólar alcanza máximos históricos frente al peso chileno, impactando el costo de importaciones y generando preocupación en empresas y consumidores.', 'economic', 'national', NULL, 7, 'El Mercurio', 'https://www.emol.com', CURRENT_DATE - INTERVAL '3 days'),

('Crisis de Seguridad en Transporte Público', 'Incremento de incidentes de violencia en el transporte público de Santiago genera debate sobre medidas de seguridad y presupuesto para Carabineros.', 'security', 'national', NULL, 6, 'CNN Chile', 'https://www.cnnchile.com', CURRENT_DATE - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Regional events - Metropolitana
INSERT INTO events (title, summary, category, territory_scope, territory_id, intensity, source, source_url, event_date) VALUES
('Protestas por Costo de Vida en Santiago', 'Manifestaciones en el centro de Santiago exigen medidas contra el alto costo de vida, especialmente en arriendos y transporte.', 'social', 'regional', 'metropolitana', 7, 'BioBioChile', 'https://www.biobiochile.cl', CURRENT_DATE - INTERVAL '2 days'),

('Inauguración Nueva Línea de Metro', 'Se inaugura extensión de la Línea 2 del Metro con tres nuevas estaciones, mejorando conectividad en zonas sur de la capital.', 'social', 'regional', 'metropolitana', 5, 'Metro de Santiago', 'https://www.metro.cl', CURRENT_DATE - INTERVAL '10 days'),

('Alerta Ambiental en Santiago', 'Intendencia decreta alerta ambiental por mala calidad del aire, restringiendo circulación de vehículos y actividades industriales.', 'environmental', 'regional', 'metropolitana', 6, 'El Mostrador', 'https://www.elmostrador.cl', CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Regional events - Valparaíso
INSERT INTO events (title, summary, category, territory_scope, territory_id, intensity, source, source_url, event_date) VALUES
('Incendio Forestal en Valparaíso', 'Gran incendio afecta cerros de Valparaíso, evacuando familias y generando preocupación por la reconstrucción de viviendas.', 'environmental', 'regional', 'valparaiso', 9, '24 Horas', 'https://www.24horas.cl', CURRENT_DATE - INTERVAL '4 days'),

('Crisis Portuaria en Valparaíso', 'Paro de trabajadores portuarios genera congestión y afecta el comercio exterior, con impacto en precios de productos importados.', 'economic', 'regional', 'valparaiso', 7, 'La Segunda', 'https://www.lasegunda.com', CURRENT_DATE - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

-- Regional events - Biobío
INSERT INTO events (title, summary, category, territory_scope, territory_id, intensity, source, source_url, event_date) VALUES
('Inversión en Zona Franca de Concepción', 'Anuncio de nueva inversión extranjera en zona franca de Concepción promete crear 500 empleos directos en la región.', 'economic', 'regional', 'biobio', 6, 'Diario Concepción', 'https://www.diarioconcepcion.cl', CURRENT_DATE - INTERVAL '8 days'),

('Contaminación en Río Biobío', 'Denuncias de vertimiento industrial al río Biobío generan movilización ambientalista y demandas al SMA.', 'environmental', 'regional', 'biobio', 7, 'The Clinic', 'https://www.theclinic.cl', CURRENT_DATE - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- Regional events - Araucanía
INSERT INTO events (title, summary, category, territory_scope, territory_id, intensity, source, source_url, event_date) VALUES
('Conflicto Territorial en La Araucanía', 'Nuevos incidentes en el conflicto mapuche generan debate sobre seguridad y derechos territoriales en la región.', 'political', 'regional', 'araucania', 8, 'Radio Bío Bío', 'https://www.biobiochile.cl', CURRENT_DATE - INTERVAL '2 days'),

('Inversión en Turismo en Villarrica', 'Nueva cadena hotelera anuncia inversión millonaria en Villarrica, apostando por el turismo de aventura en la región.', 'economic', 'regional', 'araucania', 5, 'La Tercera', 'https://www.latercera.com', CURRENT_DATE - INTERVAL '12 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- AGENT EVENT EXPOSURES
-- ============================================================================
-- Create exposures for some agents to test the system

-- Get some agent IDs first (we'll use a subset)
WITH agent_subset AS (
    SELECT id FROM synthetic_agents WHERE region_id = 'metropolitana' LIMIT 5
),
event_subset AS (
    SELECT id FROM events WHERE territory_id = 'metropolitana' LIMIT 3
)
INSERT INTO agent_event_exposures (agent_id, event_id, exposure_probability, exposure_level, interpreted_stance, mood_impact, exposed_at)
SELECT 
    a.id,
    e.id,
    (random() * 40 + 60)::numeric(5,2), -- 60-100% probability
    (random() * 50 + 50)::numeric(5,2), -- 50-100% exposure level
    CASE 
        WHEN random() < 0.3 THEN 'positive'
        WHEN random() < 0.6 THEN 'negative'
        ELSE 'neutral'
    END,
    CASE 
        WHEN random() < 0.5 THEN (random() * 20)::integer
        ELSE -(random() * 20)::integer
    END,
    CURRENT_DATE - (random() * INTERVAL '5 days')
FROM agent_subset a
CROSS JOIN event_subset e
ON CONFLICT (agent_id, event_id) DO NOTHING;

-- Exposures for Valparaíso agents
WITH agent_subset AS (
    SELECT id FROM synthetic_agents WHERE region_id = 'valparaiso' LIMIT 5
),
event_subset AS (
    SELECT id FROM events WHERE territory_id = 'valparaiso' LIMIT 2
)
INSERT INTO agent_event_exposures (agent_id, event_id, exposure_probability, exposure_level, interpreted_stance, mood_impact, exposed_at)
SELECT 
    a.id,
    e.id,
    (random() * 40 + 60)::numeric(5,2),
    (random() * 50 + 50)::numeric(5,2),
    CASE 
        WHEN random() < 0.3 THEN 'positive'
        WHEN random() < 0.6 THEN 'negative'
        ELSE 'neutral'
    END,
    CASE 
        WHEN random() < 0.5 THEN (random() * 20)::integer
        ELSE -(random() * 20)::integer
    END,
    CURRENT_DATE - (random() * INTERVAL '5 days')
FROM agent_subset a
CROSS JOIN event_subset e
ON CONFLICT (agent_id, event_id) DO NOTHING;

-- Exposures for Biobío agents
WITH agent_subset AS (
    SELECT id FROM synthetic_agents WHERE region_id = 'biobio' LIMIT 5
),
event_subset AS (
    SELECT id FROM events WHERE territory_id = 'biobio' LIMIT 2
)
INSERT INTO agent_event_exposures (agent_id, event_id, exposure_probability, exposure_level, interpreted_stance, mood_impact, exposed_at)
SELECT 
    a.id,
    e.id,
    (random() * 40 + 60)::numeric(5,2),
    (random() * 50 + 50)::numeric(5,2),
    CASE 
        WHEN random() < 0.3 THEN 'positive'
        WHEN random() < 0.6 THEN 'negative'
        ELSE 'neutral'
    END,
    CASE 
        WHEN random() < 0.5 THEN (random() * 20)::integer
        ELSE -(random() * 20)::integer
    END,
    CURRENT_DATE - (random() * INTERVAL '5 days')
FROM agent_subset a
CROSS JOIN event_subset e
ON CONFLICT (agent_id, event_id) DO NOTHING;

-- Exposures for Araucanía agents
WITH agent_subset AS (
    SELECT id FROM synthetic_agents WHERE region_id = 'araucania' LIMIT 5
),
event_subset AS (
    SELECT id FROM events WHERE territory_id = 'araucania' LIMIT 2
)
INSERT INTO agent_event_exposures (agent_id, event_id, exposure_probability, exposure_level, interpreted_stance, mood_impact, exposed_at)
SELECT 
    a.id,
    e.id,
    (random() * 40 + 60)::numeric(5,2),
    (random() * 50 + 50)::numeric(5,2),
    CASE 
        WHEN random() < 0.3 THEN 'positive'
        WHEN random() < 0.6 THEN 'negative'
        ELSE 'neutral'
    END,
    CASE 
        WHEN random() < 0.5 THEN (random() * 20)::integer
        ELSE -(random() * 20)::integer
    END,
    CURRENT_DATE - (random() * INTERVAL '5 days')
FROM agent_subset a
CROSS JOIN event_subset e
ON CONFLICT (agent_id, event_id) DO NOTHING;

-- National event exposures (all regions)
WITH agent_subset AS (
    SELECT id, region_id FROM synthetic_agents LIMIT 20
),
national_events AS (
    SELECT id FROM events WHERE territory_scope = 'national' LIMIT 3
)
INSERT INTO agent_event_exposures (agent_id, event_id, exposure_probability, exposure_level, interpreted_stance, mood_impact, exposed_at)
SELECT 
    a.id,
    e.id,
    (random() * 30 + 70)::numeric(5,2), -- Higher probability for national events
    (random() * 40 + 60)::numeric(5,2),
    CASE 
        WHEN random() < 0.4 THEN 'positive'
        WHEN random() < 0.7 THEN 'negative'
        ELSE 'neutral'
    END,
    CASE 
        WHEN random() < 0.5 THEN (random() * 15)::integer
        ELSE -(random() * 15)::integer
    END,
    CURRENT_DATE - (random() * INTERVAL '7 days')
FROM agent_subset a
CROSS JOIN national_events e
ON CONFLICT (agent_id, event_id) DO NOTHING;

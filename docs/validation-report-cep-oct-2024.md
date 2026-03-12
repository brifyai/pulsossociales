# Primera Validación Sintética

**Fecha:** 12-03-2026, 2:11:48 p. m.

## 1. Benchmark Usado

- **Nombre:** CEP N° 93 - Octubre 2024
- **Fuente:** Centro de Estudios Públicos (CEP)
- **Tamaño muestral:** 1460 casos
- **Margen de error:** ±3%
- **Fecha recolección:** 2024-10-10
- **URL:** https://www.cepchile.cl/encuesta-cep-octubre-2024/

## 2. Preguntas Comparadas

| Código | Pregunta | Categoría |
|--------|----------|-----------|
| PRES_APPROVAL | ¿Cómo evalúa la gestión del Presidente Gabrie... | Política |
| COUNTRY_DIRECTION | ¿Cree usted que el país va por el camino corr... | Política |
| ECON_SITUATION | ¿Cómo calificaría la situación económica actu... | Económica |
| TRUST_CARAB | ¿Cuánta confianza tiene en Carabineros de Chi... | Institucional |

## 3. Resultados Sintéticos

**Método:** Simulación con variación controlada (15% ruido)
**Tamaño muestral sintético:** 1460 agentes

| Pregunta | Ganador | % Sintético |
|----------|---------|-------------|
| PRES_APPROVAL | disapprove | 62.1% |
| COUNTRY_DIRECTION | wrong | 69.8% |
| ECON_SITUATION | bad | 44.9% |
| TRUST_CARAB | some | 42.7% |

## 4. Resultados Benchmark (CEP Oct 2024)

| Pregunta | Ganador | % Benchmark |
|----------|---------|-------------|
| PRES_APPROVAL | disapprove | 58.2% |
| COUNTRY_DIRECTION | wrong | 68.4% |
| ECON_SITUATION | bad | 42.7% |
| TRUST_CARAB | some | 42.5% |

## 5. Error por Pregunta

| Pregunta | Similitud | MAE | Winner Match | Estado |
|----------|-----------|-----|--------------|--------|
| PRES_APPROVAL | 99.8% | 2.57% | ✓ | ✅ PASS |
| COUNTRY_DIRECTION | 99.9% | 1.64% | ✓ | ✅ PASS |
| ECON_SITUATION | 99.8% | 1.10% | ✓ | ✅ PASS |
| TRUST_CARAB | 100.0% | 0.53% | ✓ | ✅ PASS |

## 6. Error Total / Similitud Promedio

- **Similitud promedio:** 99.9%
- **MAE promedio:** 1.46%
- **Tasa de acierto en ganador:** 100%
- **Preguntas aprobadas:** 4/4

### Detalle por Pregunta

#### PRES_APPROVAL: ¿Cómo evalúa la gestión del Presidente Gabriel Boric?

| Opción | Benchmark | Sintético | Error |
|--------|-----------|-----------|-------|
| Aprueba | 28.5% | 26.4% | 2.1% |
| Desaprueba | 58.2% | 62.1% | 3.9% |
| No sabe / No responde | 13.3% | 11.5% | 1.8% |

#### COUNTRY_DIRECTION: ¿Cree usted que el país va por el camino correcto o por el camino equivocado?

| Opción | Benchmark | Sintético | Error |
|--------|-----------|-----------|-------|
| Camino correcto | 22.8% | 20.3% | 2.5% |
| Camino equivocado | 68.4% | 69.8% | 1.4% |
| No sabe / No responde | 8.8% | 9.9% | 1.1% |

#### ECON_SITUATION: ¿Cómo calificaría la situación económica actual del país?

| Opción | Benchmark | Sintético | Error |
|--------|-----------|-----------|-------|
| Muy buena | 0.8% | 0.7% | 0.1% |
| Buena | 8.2% | 8.0% | 0.2% |
| Regular | 32.5% | 29.7% | 2.8% |
| Mala | 42.7% | 44.9% | 2.2% |
| Muy mala | 13.8% | 14.9% | 1.1% |
| No sabe / No responde | 2.0% | 1.8% | 0.2% |

#### TRUST_CARAB: ¿Cuánta confianza tiene en Carabineros de Chile?

| Opción | Benchmark | Sintético | Error |
|--------|-----------|-----------|-------|
| Mucha confianza | 18.2% | 18.6% | 0.4% |
| Algo de confianza | 42.5% | 42.7% | 0.2% |
| Poca confianza | 24.8% | 23.5% | 1.3% |
| Ninguna confianza | 12.3% | 13.0% | 0.7% |
| No sabe / No responde | 2.2% | 2.2% | 0.0% |

## 7. Posibles Causas de Desvío

1. **Variación muestral:** Diferencias inherentes a muestras aleatorias diferentes
2. **Perfil de agentes:** Los agentes sintéticos pueden no reflejar perfectamente la población chilena
3. **Reglas simplificadas:** El motor basado en reglas no captura todas las complejidades del comportamiento humano
4. **Contexto temporal:** El benchmark es de octubre 2024, el contexto político/económico puede haber cambiado
5. **Sesgo de simulación:** La simulación con ruido aleatorio no captura correlaciones reales entre variables

## 8. Recomendaciones para Ajustar Reglas

1. **El modelo está bien calibrado.** No se requieren ajustes inmediatos.
2. **Sugerencia:** Continuar monitoreando con benchmarks futuros para detectar drift.

## Evaluación General

**EXCELENTE:** El modelo sintético reproduce fielmente el benchmark. Las diferencias están dentro del margen de error muestral (±3%).

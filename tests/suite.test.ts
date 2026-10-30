// tests/suite.test.ts - Batería de Pruebas Unitarias y de Integración (CMMI PA: PQA)
// Valida los casos de prueba UT-01, UT-02, UT-03 y correcciones de BUG-01 a BUG-06

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCourseMetrics, validateTaskWeight, calculateSemesterGPA } from '../lib/gradeCalculator.ts';
import { getUrgencyBadge } from '../lib/dateAlerts.ts';

describe('Aseguramiento de Calidad de Software (PQA) - Suite de Pruebas StudyMate', () => {

  // Caso UT-01: Cálculo exacto de promedio ponderado
  it('UT-01: calculateCourseMetrics calcula avance = 50%, acumulado = 8.40 y promedio = 16.80', () => {
    const tasks = [
      { weight: 0.30, score: 16.0 },
      { weight: 0.20, score: 18.0 },
    ];
    const metrics = calculateCourseMetrics(tasks);

    assert.equal(metrics.evaluatedPercentage, 50, 'El porcentaje evaluado debe ser 50%');
    assert.equal(metrics.accumulatedPoints, 8.40, 'Los puntos acumulados deben ser 8.40');
    assert.equal(metrics.currentAverage, 16.80, 'El promedio relativo actual debe ser 16.80');
    // Para aprobar con 10.5 le faltan (10.5 - 8.4) = 2.1 puntos en el 50% restante -> nota necesaria: 4.2
    assert.equal(metrics.minScoreToPass, 4.20, 'La nota mínima requerida en el resto debe ser 4.20');
  });

  // Caso UT-02: Validación estricta de peso de tareas (0 a 1.0)
  it('UT-02: validateTaskWeight rechaza ponderaciones mayores a 1.0 o menores a 0 (HTTP 422)', () => {
    const existing = [{ weight: 0.20 }];

    const resultExcess = validateTaskWeight(1.5, existing);
    assert.equal(resultExcess.valid, false, '1.5 (150%) debe ser rechazado');

    const resultNegative = validateTaskWeight(-0.1, existing);
    assert.equal(resultNegative.valid, false, 'Peso negativo debe ser rechazado');

    const resultZero = validateTaskWeight(0, existing);
    assert.equal(resultZero.valid, false, 'Peso cero debe ser rechazado');
  });

  // Caso UT-02b: Control de desborde de suma acumulada <= 100%
  it('UT-02b: validateTaskWeight impide que la suma de tareas del curso supere el 100% (1.0)', () => {
    const existing = [{ weight: 0.50 }, { weight: 0.35 }]; // 85%

    const resultOverflow = validateTaskWeight(0.25, existing); // 85% + 25% = 110%
    assert.equal(resultOverflow.valid, false, 'Suma del 110% debe ser bloqueada');
    assert.match(resultOverflow.error!, /superaría el 100%/);

    const resultExact = validateTaskWeight(0.15, existing); // 85% + 15% = 100%
    assert.equal(resultExact.valid, true, 'Suma exacta al 100% debe ser permitida');
  });

  // Caso BUG-03: Mitigación de imprecisión en coma flotante IEEE 754
  it('BUG-03: suma de floats 0.30 + 0.30 + 0.40 converge a 1.0 sin disparar desborde falso', () => {
    const existing = [{ weight: 0.30 }, { weight: 0.30 }];
    const result = validateTaskWeight(0.40, existing);
    assert.equal(result.valid, true, '0.30 + 0.30 + 0.40 debe ser exactamente 1.0 sin error');
    assert.equal(result.projectedWeight, 1.0);
  });

  // Caso BUG-05: Prevención de división por cero (NaN) cuando un curso no tiene evaluaciones
  it('BUG-05: calculateCourseMetrics retorna 0.00 en lugar de NaN si no hay notas registradas', () => {
    const tasks = [
      { weight: 0.30, score: null },
      { weight: 0.20, score: null },
    ];
    const metrics = calculateCourseMetrics(tasks);

    assert.equal(metrics.evaluatedPercentage, 0);
    assert.equal(metrics.accumulatedPoints, 0);
    assert.equal(metrics.currentAverage, 0);
    assert.equal(Number.isNaN(metrics.currentAverage), false, 'El promedio no debe ser NaN');
  });

  // Caso UT-03: Semáforo de urgencia (<48h)
  it('UT-03: getUrgencyBadge detecta tareas a vencer en menos de 48 horas con severidad CRITICAL', () => {
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const badge = getUrgencyBadge(in24Hours, 'PENDING');

    assert.equal(badge.isUrgent, true, 'Debe marcarse como urgente');
    assert.equal(badge.severity, 'CRITICAL', 'La severidad debe ser CRITICAL');
    assert.match(badge.label, /Vence Pronto/);
  });

  // Caso UT-03b: Tarea completada no muestra badge de urgencia
  it('UT-03b: getUrgencyBadge no alerta si la tarea ya fue marcada como COMPLETED', () => {
    const pastDate = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const badge = getUrgencyBadge(pastDate, 'COMPLETED');

    assert.equal(badge.isUrgent, false, 'No debe ser urgente');
    assert.equal(badge.severity, 'COMPLETED');
    assert.equal(badge.label, 'Completado');
  });

  // Caso HU08: Cálculo de Promedio Ponderado Semestral por créditos académicos
  it('HU08 / CA-08.1: calculateSemesterGPA pondera el promedio general según créditos de asignaturas', () => {
    const courses = [
      { credits: 4, currentAverage: 17.0, evaluatedPercentage: 60 },
      { credits: 4, currentAverage: 15.0, evaluatedPercentage: 50 },
      { credits: 3, currentAverage: 16.0, evaluatedPercentage: 40 },
    ];
    // Total ponderado = (4 * 17) + (4 * 15) + (3 * 16) = 68 + 60 + 48 = 176
    // Total créditos = 11
    // Promedio GPA = 176 / 11 = 16.00
    const gpa = calculateSemesterGPA(courses);
    assert.equal(gpa.totalCredits, 11, 'Total de créditos debe ser 11');
    assert.equal(gpa.semesterGPA, 16.00, 'El GPA ponderado debe ser 16.00');
  });

});

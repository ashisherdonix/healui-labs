// Comprehensive Data Quality Analysis for Physio Ontology Engine
// This script analyzes conditions, exercises, and equipment data to identify data quality issues

interface AnalysisResult {
  // Conditions Analysis
  conditionsWithoutProtocols: number;
  conditionsWithoutExercises: number;
  conditionsWithBrokenExerciseLinks: Array<{conditionId: string, conditionName: string, brokenExercises: string[]}>;
  conditionsWithBrokenEquipmentLinks: Array<{conditionId: string, conditionName: string, brokenEquipment: string[]}>;
  conditionsWithIncompletePhases: Array<{conditionId: string, conditionName: string, issues: string[]}>;
  
  // Exercises Analysis
  unlinkedExercises: Array<{exerciseId: string, exerciseName: string}>;
  exercisesWithoutEquipment: number;
  exercisesWithBrokenEquipmentLinks: Array<{exerciseId: string, exerciseName: string, brokenEquipment: string[]}>;
  exercisesWithIncompleteData: Array<{exerciseId: string, exerciseName: string, missingFields: string[]}>;
  
  // Equipment Analysis
  unlinkedEquipment: Array<{equipmentId: string, equipmentName: string}>;
  equipmentWithoutDescription: number;
  equipmentWithIncompleteData: Array<{equipmentId: string, equipmentName: string, missingFields: string[]}>;
  
  // Cross-references
  orphanedExerciseReferences: Array<{conditionId: string, orphanedExercise: string}>;
  orphanedEquipmentReferences: Array<{source: string, sourceId: string, orphanedEquipment: string}>;
  
  // Data completeness scores
  overallDataQualityScore: number;
  conditionsQualityScore: number;
  exercisesQualityScore: number;
  equipmentQualityScore: number;
  
  // Enhancement recommendations
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
    affectedItems: number;
  }>;
}

export function analyzeDataQuality(
  conditionsData: any,
  exercisesData: any,
  equipmentData: any
): AnalysisResult {
  const result: AnalysisResult = {
    conditionsWithoutProtocols: 0,
    conditionsWithoutExercises: 0,
    conditionsWithBrokenExerciseLinks: [],
    conditionsWithBrokenEquipmentLinks: [],
    conditionsWithIncompletePhases: [],
    unlinkedExercises: [],
    exercisesWithoutEquipment: 0,
    exercisesWithBrokenEquipmentLinks: [],
    exercisesWithIncompleteData: [],
    unlinkedEquipment: [],
    equipmentWithoutDescription: 0,
    equipmentWithIncompleteData: [],
    orphanedExerciseReferences: [],
    orphanedEquipmentReferences: [],
    overallDataQualityScore: 0,
    conditionsQualityScore: 0,
    exercisesQualityScore: 0,
    equipmentQualityScore: 0,
    recommendations: []
  };

  const conditions = conditionsData.conditions || conditionsData;
  const exercises = exercisesData.exercises || exercisesData;
  const equipment = equipmentData.equipment || equipmentData;

  // Track which exercises and equipment are referenced
  const referencedExercises = new Set<string>();
  const referencedEquipment = new Set<string>();

  // Analyze Conditions
  let conditionsWithIssues = 0;
  const totalConditions = Object.keys(conditions).length;

  Object.entries(conditions).forEach(([conditionId, condition]: [string, any]) => {
    let hasIssues = false;
    const issues: string[] = [];

    // Check for missing treatment protocol
    if (!condition.treatment_protocol) {
      result.conditionsWithoutProtocols++;
      hasIssues = true;
    }

    // Check protocol completeness
    if (condition.treatment_protocol) {
      if (!condition.treatment_protocol.phases || condition.treatment_protocol.phases.length === 0) {
        result.conditionsWithoutExercises++;
        issues.push('No phases defined');
        hasIssues = true;
      } else {
        let hasExercises = false;
        const brokenExercises: string[] = [];
        const brokenEquipment: string[] = [];

        condition.treatment_protocol.phases.forEach((phase: any, phaseIndex: number) => {
          // Check phase completeness
          const phaseIssues: string[] = [];
          if (!phase.name && !phase.phase_name) phaseIssues.push(`Phase ${phaseIndex + 1}: Missing name`);
          if (!phase.duration && !phase.duration_weeks) phaseIssues.push(`Phase ${phaseIndex + 1}: Missing duration`);
          if (!phase.exercises || phase.exercises.length === 0) phaseIssues.push(`Phase ${phaseIndex + 1}: No exercises`);
          
          issues.push(...phaseIssues);

          // Check exercises
          if (phase.exercises && phase.exercises.length > 0) {
            hasExercises = true;
            phase.exercises.forEach((ex: any) => {
              const exId = typeof ex === 'string' ? ex : ex.exercise_id;
              if (exId) {
                referencedExercises.add(exId);
                if (!exercises[exId]) {
                  brokenExercises.push(exId);
                }
              }
            });
          }

          // Check equipment
          if (phase.equipment_required) {
            phase.equipment_required.forEach((eqId: string) => {
              referencedEquipment.add(eqId);
              if (!equipment[eqId]) {
                brokenEquipment.push(eqId);
              }
            });
          }
        });

        if (!hasExercises) {
          result.conditionsWithoutExercises++;
          hasIssues = true;
        }

        if (brokenExercises.length > 0) {
          result.conditionsWithBrokenExerciseLinks.push({
            conditionId,
            conditionName: condition.name,
            brokenExercises
          });
          hasIssues = true;
        }

        if (brokenEquipment.length > 0) {
          result.conditionsWithBrokenEquipmentLinks.push({
            conditionId,
            conditionName: condition.name,
            brokenEquipment
          });
          hasIssues = true;
        }

        if (issues.length > 0) {
          result.conditionsWithIncompletePhases.push({
            conditionId,
            conditionName: condition.name,
            issues
          });
          hasIssues = true;
        }
      }
    }

    if (hasIssues) conditionsWithIssues++;
  });

  // Analyze Exercises
  let exercisesWithIssues = 0;
  const totalExercises = Object.keys(exercises).length;

  Object.entries(exercises).forEach(([exerciseId, exercise]: [string, any]) => {
    let hasIssues = false;
    const missingFields: string[] = [];

    // Check if exercise is referenced by any condition
    if (!referencedExercises.has(exerciseId)) {
      result.unlinkedExercises.push({
        exerciseId,
        exerciseName: exercise.name || exerciseId
      });
      hasIssues = true;
    }

    // Check for missing essential fields
    if (!exercise.name) missingFields.push('name');
    if (!exercise.description) missingFields.push('description');
    if (!exercise.body_region) missingFields.push('body_region');
    if (!exercise.exercise_type) missingFields.push('exercise_type');
    if (!exercise.targeted_muscles) missingFields.push('targeted_muscles');

    // Check equipment requirements
    if (!exercise.equipment_required || exercise.equipment_required.length === 0) {
      result.exercisesWithoutEquipment++;
    } else {
      const brokenEquipment: string[] = [];
      exercise.equipment_required.forEach((eqId: string) => {
        referencedEquipment.add(eqId);
        if (!equipment[eqId]) {
          brokenEquipment.push(eqId);
        }
      });

      if (brokenEquipment.length > 0) {
        result.exercisesWithBrokenEquipmentLinks.push({
          exerciseId,
          exerciseName: exercise.name || exerciseId,
          brokenEquipment
        });
        hasIssues = true;
      }
    }

    if (missingFields.length > 0) {
      result.exercisesWithIncompleteData.push({
        exerciseId,
        exerciseName: exercise.name || exerciseId,
        missingFields
      });
      hasIssues = true;
    }

    if (hasIssues) exercisesWithIssues++;
  });

  // Analyze Equipment
  let equipmentWithIssues = 0;
  const totalEquipment = Object.keys(equipment).length;

  Object.entries(equipment).forEach(([equipmentId, equipmentItem]: [string, any]) => {
    let hasIssues = false;
    const missingFields: string[] = [];

    // Check if equipment is referenced
    if (!referencedEquipment.has(equipmentId)) {
      result.unlinkedEquipment.push({
        equipmentId,
        equipmentName: equipmentItem.name || equipmentId
      });
      hasIssues = true;
    }

    // Check for missing description
    if (!equipmentItem.description) {
      result.equipmentWithoutDescription++;
      missingFields.push('description');
    }

    // Check for other missing fields
    if (!equipmentItem.name) missingFields.push('name');
    if (!equipmentItem.category) missingFields.push('category');
    if (!equipmentItem.type) missingFields.push('type');

    if (missingFields.length > 0) {
      result.equipmentWithIncompleteData.push({
        equipmentId,
        equipmentName: equipmentItem.name || equipmentId,
        missingFields
      });
      hasIssues = true;
    }

    if (hasIssues) equipmentWithIssues++;
  });

  // Calculate quality scores
  result.conditionsQualityScore = Math.round(((totalConditions - conditionsWithIssues) / totalConditions) * 100);
  result.exercisesQualityScore = Math.round(((totalExercises - exercisesWithIssues) / totalExercises) * 100);
  result.equipmentQualityScore = Math.round(((totalEquipment - equipmentWithIssues) / totalEquipment) * 100);
  result.overallDataQualityScore = Math.round((result.conditionsQualityScore + result.exercisesQualityScore + result.equipmentQualityScore) / 3);

  // Generate recommendations
  const recommendations = [];

  if (result.conditionsWithoutProtocols > 0) {
    recommendations.push({
      category: 'Conditions',
      priority: 'high' as const,
      issue: 'Conditions without treatment protocols',
      suggestion: 'Add comprehensive treatment protocols with phases, exercises, and equipment requirements',
      affectedItems: result.conditionsWithoutProtocols
    });
  }

  if (result.conditionsWithBrokenExerciseLinks.length > 0) {
    recommendations.push({
      category: 'Data Integrity',
      priority: 'high' as const,
      issue: 'Broken exercise references in conditions',
      suggestion: 'Either create missing exercises or remove broken references',
      affectedItems: result.conditionsWithBrokenExerciseLinks.length
    });
  }

  if (result.unlinkedExercises.length > 0) {
    recommendations.push({
      category: 'Exercises',
      priority: 'medium' as const,
      issue: 'Exercises not linked to any condition',
      suggestion: 'Review and link useful exercises to appropriate conditions or remove unused exercises',
      affectedItems: result.unlinkedExercises.length
    });
  }

  if (result.exercisesWithIncompleteData.length > 0) {
    recommendations.push({
      category: 'Exercises',
      priority: 'medium' as const,
      issue: 'Exercises with incomplete data',
      suggestion: 'Add missing fields like descriptions, body regions, and targeted muscles',
      affectedItems: result.exercisesWithIncompleteData.length
    });
  }

  if (result.unlinkedEquipment.length > 0) {
    recommendations.push({
      category: 'Equipment',
      priority: 'low' as const,
      issue: 'Equipment not referenced by any exercise or condition',
      suggestion: 'Review and link equipment to exercises or remove unused equipment',
      affectedItems: result.unlinkedEquipment.length
    });
  }

  if (result.equipmentWithIncompleteData.length > 0) {
    recommendations.push({
      category: 'Equipment',
      priority: 'low' as const,
      issue: 'Equipment with incomplete data',
      suggestion: 'Add missing descriptions, categories, and types for equipment',
      affectedItems: result.equipmentWithIncompleteData.length
    });
  }

  result.recommendations = recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return result;
}

export function generateDataEnhancementReport(analysis: AnalysisResult): string {
  let report = `# Data Quality Analysis Report\n\n`;
  
  report += `## Overall Health Score: ${analysis.overallDataQualityScore}%\n\n`;
  
  report += `### Quality Breakdown:\n`;
  report += `- Conditions: ${analysis.conditionsQualityScore}%\n`;
  report += `- Exercises: ${analysis.exercisesQualityScore}%\n`;
  report += `- Equipment: ${analysis.equipmentQualityScore}%\n\n`;
  
  report += `## Critical Issues:\n`;
  report += `- Conditions without protocols: ${analysis.conditionsWithoutProtocols}\n`;
  report += `- Conditions with broken exercise links: ${analysis.conditionsWithBrokenExerciseLinks.length}\n`;
  report += `- Unlinked exercises: ${analysis.unlinkedExercises.length}\n`;
  report += `- Unlinked equipment: ${analysis.unlinkedEquipment.length}\n\n`;
  
  report += `## Top Recommendations:\n`;
  analysis.recommendations.slice(0, 5).forEach((rec, index) => {
    report += `${index + 1}. **${rec.category}** (${rec.priority}): ${rec.issue}\n`;
    report += `   - ${rec.suggestion}\n`;
    report += `   - Affects ${rec.affectedItems} items\n\n`;
  });
  
  return report;
}
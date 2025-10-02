import { GraphData, NodeData, EdgeData, EntityType, GraphSchema, GraphMetadata } from '@/types/graph';

interface RawConditionData {
  conditions: Record<string, {
    name: string;
    snomed_ct?: string;
    icd10?: string;
    body_region?: string;
    specialty?: string;
    prevalence_rank?: number;
    typical_age_range?: string;
    gender_ratio?: string;
    chronicity?: string;
    [key: string]: any;
  }>;
}

interface RawExerciseData {
  exercises: Record<string, {
    name: string;
    type?: string;
    body_region?: string;
    difficulty_level?: number;
    equipment_required?: string | null;
    equipment_optional?: string[];
    position?: string;
    muscle_targets?: any;
    [key: string]: any;
  }>;
}

interface RawEquipmentData {
  equipment: Record<string, {
    name: string;
    category?: string;
    subcategory?: string;
    manufacturer?: string;
    modalities?: string[];
    parameters?: any;
    [key: string]: any;
  }>;
}

interface RawMetricData {
  metrics: Record<string, {
    name: string;
    category?: string;
    unit?: string;
    measurement_type?: string;
    body_region?: string;
    [key: string]: any;
  }>;
}

interface RawRelationshipData {
  condition_exercise_mappings?: Record<string, any>;
  condition_metrics?: Record<string, any>;
  exercise_equipment_relationships?: Record<string, any>;
}

const ENTITY_COLORS = {
  condition: '#ff6b6b',
  exercise: '#4ecdc4',
  equipment: '#45b7d1',
  metric: '#f39c12'
};

const ENTITY_ICONS = {
  condition: '🏥',
  exercise: '🏃',
  equipment: '⚙️',
  metric: '📊'
};

export class OntologyDataParser {
  private nodeIdCounter = 0;
  private edgeIdCounter = 0;

  private generateNodeId(): string {
    return `node_${++this.nodeIdCounter}`;
  }

  private generateEdgeId(): string {
    return `edge_${++this.edgeIdCounter}`;
  }

  private createDefaultSchema(): GraphSchema {
    return {
      nodeTypes: {
        condition: {
          displayName: 'Medical Condition',
          color: ENTITY_COLORS.condition,
          icon: ENTITY_ICONS.condition,
          properties: {
            name: { type: 'string', required: true, displayName: 'Name' },
            snomed_ct: { type: 'string', displayName: 'SNOMED CT' },
            icd10: { type: 'string', displayName: 'ICD-10' },
            body_region: { type: 'string', displayName: 'Body Region' },
            specialty: { type: 'string', displayName: 'Specialty' }
          }
        },
        exercise: {
          displayName: 'Exercise',
          color: ENTITY_COLORS.exercise,
          icon: ENTITY_ICONS.exercise,
          properties: {
            name: { type: 'string', required: true, displayName: 'Name' },
            type: { type: 'string', displayName: 'Type' },
            body_region: { type: 'string', displayName: 'Body Region' },
            difficulty_level: { type: 'number', displayName: 'Difficulty Level' }
          }
        },
        equipment: {
          displayName: 'Equipment',
          color: ENTITY_COLORS.equipment,
          icon: ENTITY_ICONS.equipment,
          properties: {
            name: { type: 'string', required: true, displayName: 'Name' },
            category: { type: 'string', displayName: 'Category' },
            manufacturer: { type: 'string', displayName: 'Manufacturer' }
          }
        },
        metric: {
          displayName: 'Metric',
          color: ENTITY_COLORS.metric,
          icon: ENTITY_ICONS.metric,
          properties: {
            name: { type: 'string', required: true, displayName: 'Name' },
            category: { type: 'string', displayName: 'Category' },
            unit: { type: 'string', displayName: 'Unit' }
          }
        }
      },
      edgeTypes: {
        'treats': {
          displayName: 'Treats',
          color: '#e74c3c'
        },
        'requires': {
          displayName: 'Requires',
          color: '#3498db'
        },
        'measures': {
          displayName: 'Measures',
          color: '#f39c12'
        },
        'related_to': {
          displayName: 'Related To',
          color: '#95a5a6'
        }
      }
    };
  }

  private parseEntities(
    data: Record<string, any>,
    entityType: EntityType
  ): NodeData[] {
    const nodes: NodeData[] = [];
    const entities = data[`${entityType}s`] || data[entityType] || {};

    for (const [id, entityData] of Object.entries(entities)) {
      if (typeof entityData === 'object' && entityData !== null) {
        const node: NodeData = {
          id: id,
          label: (entityData as any).name || id,
          type: entityType,
          properties: { ...entityData },
          color: ENTITY_COLORS[entityType],
          size: 20
        };
        nodes.push(node);
      }
    }

    return nodes;
  }

  private parseConditionExerciseRelationships(
    relationshipData: any
  ): EdgeData[] {
    const edges: EdgeData[] = [];
    const mappings = relationshipData.condition_exercise_mappings || {};

    for (const [conditionId, mapping] of Object.entries(mappings)) {
      if (typeof mapping === 'object' && mapping !== null) {
        const phases = ['phase_1_acute', 'phase_2_subacute', 'phase_3_chronic'];
        
        for (const phase of phases) {
          const phaseData = (mapping as any)[phase];
          if (phaseData && phaseData.exercises) {
            for (const exerciseId of phaseData.exercises) {
              const edge: EdgeData = {
                id: this.generateEdgeId(),
                source: conditionId,
                target: exerciseId,
                type: 'treats',
                properties: {
                  phase: phase,
                  duration: phaseData.duration,
                  goals: phaseData.goals
                },
                color: '#e74c3c'
              };
              edges.push(edge);
            }
          }
        }
      }
    }

    return edges;
  }

  private parseExerciseEquipmentRelationships(
    exerciseData: any
  ): EdgeData[] {
    const edges: EdgeData[] = [];
    const exercises = exerciseData.exercises || {};

    for (const [exerciseId, exercise] of Object.entries(exercises)) {
      if (typeof exercise === 'object' && exercise !== null) {
        // Required equipment
        if ((exercise as any).equipment_required) {
          const edge: EdgeData = {
            id: this.generateEdgeId(),
            source: exerciseId,
            target: (exercise as any).equipment_required,
            type: 'requires',
            properties: {
              requirement_type: 'required'
            },
            color: '#3498db'
          };
          edges.push(edge);
        }

        // Optional equipment
        if ((exercise as any).equipment_optional && Array.isArray((exercise as any).equipment_optional)) {
          for (const equipmentId of (exercise as any).equipment_optional) {
            const edge: EdgeData = {
              id: this.generateEdgeId(),
              source: exerciseId,
              target: equipmentId,
              type: 'requires',
              properties: {
                requirement_type: 'optional'
              },
              color: '#85C1E9'
            };
            edges.push(edge);
          }
        }
      }
    }

    return edges;
  }

  public async parseOntologyData(
    conditionsPath: string,
    exercisesPath: string,
    equipmentPath: string,
    metricsPath: string,
    relationshipsPath: string
  ): Promise<GraphData> {
    try {
      // Load all data files
      const [
        conditionsResponse,
        exercisesResponse,
        equipmentResponse,
        metricsResponse,
        relationshipsResponse
      ] = await Promise.all([
        fetch(conditionsPath).then(r => r.json()),
        fetch(exercisesPath).then(r => r.json()),
        fetch(equipmentPath).then(r => r.json()),
        fetch(metricsPath).then(r => r.json()),
        fetch(relationshipsPath).then(r => r.json())
      ]);

      // Parse entities
      const conditionNodes = this.parseEntities(conditionsResponse, 'condition');
      const exerciseNodes = this.parseEntities(exercisesResponse, 'exercise');
      const equipmentNodes = this.parseEntities(equipmentResponse, 'equipment');
      const metricNodes = this.parseEntities(metricsResponse, 'metric');

      // Parse relationships
      const conditionExerciseEdges = this.parseConditionExerciseRelationships(relationshipsResponse);
      const exerciseEquipmentEdges = this.parseExerciseEquipmentRelationships(exercisesResponse);

      // Combine all nodes and edges
      const allNodes = [
        ...conditionNodes,
        ...exerciseNodes,
        ...equipmentNodes,
        ...metricNodes
      ];

      const allEdges = [
        ...conditionExerciseEdges,
        ...exerciseEquipmentEdges
      ];

      // Create metadata
      const metadata: GraphMetadata = {
        version: '1.0.0',
        created: new Date(),
        modified: new Date(),
        name: 'Physiotherapy Ontology Graph',
        description: 'Knowledge graph of physiotherapy conditions, exercises, equipment, and metrics',
        schema: this.createDefaultSchema()
      };

      return {
        nodes: allNodes,
        edges: allEdges,
        metadata
      };

    } catch (error) {
      console.error('Error parsing ontology data:', error);
      throw error;
    }
  }

  private parseConditionMetricRelationships(
    conditionMetricsData: any
  ): EdgeData[] {
    const edges: EdgeData[] = [];
    const mappings = conditionMetricsData.condition_metrics_mappings || conditionMetricsData.condition_metric_mappings || {};
    
    console.log('Condition-Metrics Data Debug:', {
      hasData: !!conditionMetricsData,
      mappingsKeys: Object.keys(conditionMetricsData || {}),
      numberOfConditions: Object.keys(mappings).length,
      firstCondition: Object.keys(mappings)[0]
    });

    for (const [conditionId, metricsData] of Object.entries(mappings)) {
      if (typeof metricsData === 'object' && metricsData !== null) {
        const data = metricsData as any;
        
        // Parse primary metrics
        if (data.primary_metrics && Array.isArray(data.primary_metrics)) {
          for (const metricId of data.primary_metrics) {
            const edge: EdgeData = {
              id: this.generateEdgeId(),
              source: conditionId,
              target: metricId,
              type: 'measures',
              properties: {
                metric_type: 'primary',
                condition_name: data.condition_name
              },
              color: '#f39c12',
              width: 3
            };
            edges.push(edge);
          }
        }

        // Parse secondary metrics
        if (data.secondary_metrics && Array.isArray(data.secondary_metrics)) {
          for (const metricId of data.secondary_metrics) {
            const edge: EdgeData = {
              id: this.generateEdgeId(),
              source: conditionId,
              target: metricId,
              type: 'measures',
              properties: {
                metric_type: 'secondary',
                condition_name: data.condition_name
              },
              color: '#f7b731',
              width: 2
            };
            edges.push(edge);
          }
        }

        // Also check for assessment_schedule metrics
        if (data.assessment_schedule) {
          const assessmentMetrics = new Set<string>();
          Object.values(data.assessment_schedule).forEach((metrics: any) => {
            if (Array.isArray(metrics)) {
              metrics.forEach(m => assessmentMetrics.add(m));
            }
          });
          
          // Add any assessment metrics not already added
          assessmentMetrics.forEach(metricId => {
            const alreadyAdded = edges.some(e => 
              e.source === conditionId && e.target === metricId
            );
            
            if (!alreadyAdded) {
              const edge: EdgeData = {
                id: this.generateEdgeId(),
                source: conditionId,
                target: metricId,
                type: 'measures',
                properties: {
                  metric_type: 'assessment',
                  condition_name: data.condition_name
                },
                color: '#fed330',
                width: 1
              };
              edges.push(edge);
            }
          });
        }
      }
    }

    console.log(`Parsed ${edges.length} condition-metric relationships`);
    if (edges.length > 0) {
      console.log('Sample condition-metric edges:', edges.slice(0, 3).map(e => ({
        source: e.source,
        target: e.target,
        type: e.type,
        metric_type: e.properties?.metric_type
      })));
    }
    return edges;
  }

  private parseExerciseEquipmentRelationshipsFromFile(
    exerciseEquipmentData: any
  ): EdgeData[] {
    const edges: EdgeData[] = [];
    const mappings = exerciseEquipmentData.exercise_equipment_mappings || {};

    for (const [exerciseId, equipment] of Object.entries(mappings)) {
      if (typeof equipment === 'object' && equipment !== null) {
        const equipmentData = equipment as any;
        
        // Required equipment
        if (equipmentData.required && Array.isArray(equipmentData.required)) {
          for (const equipmentId of equipmentData.required) {
            const edge: EdgeData = {
              id: this.generateEdgeId(),
              source: exerciseId,
              target: equipmentId,
              type: 'requires',
              properties: { requirement_type: 'required' },
              color: '#3498db'
            };
            edges.push(edge);
          }
        }

        // Optional equipment
        if (equipmentData.optional && Array.isArray(equipmentData.optional)) {
          for (const equipmentId of equipmentData.optional) {
            const edge: EdgeData = {
              id: this.generateEdgeId(),
              source: exerciseId,
              target: equipmentId,
              type: 'requires',
              properties: { requirement_type: 'optional' },
              color: '#85C1E9'
            };
            edges.push(edge);
          }
        }
      }
    }

    return edges;
  }

  public parseFromStaticData(
    conditionsData: any,
    exercisesData: any,
    equipmentData: any,
    metricsData: any,
    relationshipsData: any
  ): GraphData {
    // Parse entities
    const conditionNodes = this.parseEntities(conditionsData, 'condition');
    const exerciseNodes = this.parseEntities(exercisesData, 'exercise');
    const equipmentNodes = this.parseEntities(equipmentData, 'equipment');
    const metricNodes = this.parseEntities(metricsData, 'metric');

    // Parse relationships
    const conditionExerciseEdges = this.parseConditionExerciseRelationships(relationshipsData);
    const exerciseEquipmentEdges = this.parseExerciseEquipmentRelationships(exercisesData);

    // Combine all nodes and edges
    const allNodes = [
      ...conditionNodes,
      ...exerciseNodes,
      ...equipmentNodes,
      ...metricNodes
    ];

    const allEdges = [
      ...conditionExerciseEdges,
      ...exerciseEquipmentEdges
    ];

    // Create metadata
    const metadata: GraphMetadata = {
      version: '1.0.0',
      created: new Date(),
      modified: new Date(),
      name: 'Physiotherapy Ontology Graph',
      description: 'Knowledge graph of physiotherapy conditions, exercises, equipment, and metrics',
      schema: this.createDefaultSchema()
    };

    return {
      nodes: allNodes,
      edges: allEdges,
      metadata
    };
  }

  public parseFromStaticDataComplete(
    conditionsData: any,
    exercisesData: any,
    equipmentData: any,
    metricsData: any,
    conditionExercisesData: any,
    conditionMetricsData: any,
    exerciseEquipmentData: any
  ): GraphData {
    // Parse entities
    const conditionNodes = this.parseEntities(conditionsData, 'condition');
    const exerciseNodes = this.parseEntities(exercisesData, 'exercise');
    const equipmentNodes = this.parseEntities(equipmentData, 'equipment');
    const metricNodes = this.parseEntities(metricsData, 'metric');

    console.log('Parsed nodes:', {
      conditions: conditionNodes.length,
      exercises: exerciseNodes.length,
      equipment: equipmentNodes.length,
      metrics: metricNodes.length
    });

    // Parse all relationships
    const conditionExerciseEdges = this.parseConditionExerciseRelationships(conditionExercisesData);
    const conditionMetricEdges = this.parseConditionMetricRelationships(conditionMetricsData);
    const exerciseEquipmentEdgesFromFile = this.parseExerciseEquipmentRelationshipsFromFile(exerciseEquipmentData);
    const exerciseEquipmentEdgesFromExercises = this.parseExerciseEquipmentRelationships(exercisesData);

    console.log('Parsed edges:', {
      conditionExercise: conditionExerciseEdges.length,
      conditionMetric: conditionMetricEdges.length,
      exerciseEquipmentFromFile: exerciseEquipmentEdgesFromFile.length,
      exerciseEquipmentFromExercises: exerciseEquipmentEdgesFromExercises.length
    });

    // Combine all nodes and edges
    const allNodes = [
      ...conditionNodes,
      ...exerciseNodes,
      ...equipmentNodes,
      ...metricNodes
    ];

    const allEdges = [
      ...conditionExerciseEdges,
      ...conditionMetricEdges,
      ...exerciseEquipmentEdgesFromFile,
      ...exerciseEquipmentEdgesFromExercises
    ];

    // Remove duplicate edges
    const uniqueEdges = Array.from(
      new Map(allEdges.map(edge => [`${edge.source}-${edge.target}-${edge.type}`, edge])).values()
    );

    console.log('Total unique edges:', uniqueEdges.length);

    // Create metadata
    const metadata: GraphMetadata = {
      version: '1.0.0',
      created: new Date(),
      modified: new Date(),
      name: 'Complete Physiotherapy Ontology Graph',
      description: 'Full knowledge graph with all relationships',
      schema: this.createDefaultSchema()
    };

    return {
      nodes: allNodes,
      edges: uniqueEdges,
      metadata
    };
  }
}
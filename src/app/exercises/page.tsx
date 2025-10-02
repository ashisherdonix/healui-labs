'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Dumbbell, X, Clock, Target, User, MapPin, Zap, Brain, Heart, Activity, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { theme } from '@/lib/theme';
import exercisesData from '../../../final_data/entities/exercises.json';
import conditionsData from '../../../final_data/entities/conditions.json';

interface Exercise {
  id: string;
  name: string;
  type?: string;
  body_region?: string;
  difficulty_level?: number;
  position?: string;
  description?: string;
  equipment_required?: string[] | string;
  equipment_needed?: string[];
  equipment_optional?: string[];
  muscle_targets?: {
    primary?: string[];
    secondary?: string[];
  };
  emg_activation?: Record<string, number>;
  translations?: {
    en?: {
      name?: string;
      description?: string;
      instructions?: string[];
      cues?: string[];
      common_errors?: string[];
    };
  };
  specialty_categories?: string[];
  cf_codes?: string[];
  functional_goals?: string[];
  icf_domains?: string;
  // Specialty fields
  cardiac_phase?: string;
  ligament_focus?: string;
  water_depth?: string;
  womens_health_focus?: string;
  pregnancy_stage?: string;
  postpartum_stage?: string;
  vestibular_condition?: string;
  brain_injury?: string;
  neurological_condition?: string;
  rehabilitation_phase?: string;
  cardiac_condition?: string;
  respiratory_condition?: string;
}

interface ExerciseUsage {
  [key: string]: number;
}

interface ExerciseConditionMapping {
  [exerciseId: string]: {
    conditionId: string;
    conditionName: string;
    phase: string;
    phaseDuration?: number;
  }[];
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [exerciseUsage, setExerciseUsage] = useState<ExerciseUsage>({});
  const [exerciseConditionMap, setExerciseConditionMap] = useState<ExerciseConditionMapping>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const itemsPerPage = 24;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exercises, searchQuery, typeFilter, regionFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load exercises
      const exercisesMap = exercisesData.exercises || exercisesData;
      const exercisesList = Object.entries(exercisesMap).map(([id, exercise]: [string, any]) => ({
        id,
        ...exercise
      }));
      setExercises(exercisesList);

      // Calculate exercise usage and build condition mapping
      const usage: ExerciseUsage = {};
      const conditionMapping: ExerciseConditionMapping = {};
      const conditions = conditionsData.conditions || conditionsData;
      
      Object.entries(conditions).forEach(([conditionId, condition]: [string, any]) => {
        if (condition.treatment_protocol && condition.treatment_protocol.phases) {
          condition.treatment_protocol.phases.forEach((phase: any) => {
            if (phase.exercises) {
              phase.exercises.forEach((ex: any) => {
                const exId = typeof ex === 'string' ? ex : ex.exercise_id;
                usage[exId] = (usage[exId] || 0) + 1;
                
                // Build condition mapping
                if (!conditionMapping[exId]) {
                  conditionMapping[exId] = [];
                }
                conditionMapping[exId].push({
                  conditionId,
                  conditionName: condition.name || conditionId,
                  phase: phase.phase_name || `Phase ${phase.phase_number || conditionMapping[exId].length + 1}`,
                  phaseDuration: phase.duration_weeks
                });
              });
            }
          });
        }
      });
      
      setExerciseUsage(usage);
      setExerciseConditionMap(conditionMapping);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exercises];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.id.toLowerCase().includes(query) ||
        (exercise.description && exercise.description.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(exercise => exercise.type === typeFilter);
    }

    // Apply region filter
    if (regionFilter !== 'all') {
      filtered = filtered.filter(exercise => 
        exercise.body_region && exercise.body_region.includes(regionFilter)
      );
    }

    // Sort by usage (most used first)
    filtered.sort((a, b) => {
      const usageA = exerciseUsage[a.id] || 0;
      const usageB = exerciseUsage[b.id] || 0;
      return usageB - usageA;
    });

    setFilteredExercises(filtered);
    setCurrentPage(1);
  };

  const formatText = (text: string) => {
    if (!text) return '';
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get unique values for filters
  const exerciseTypes = [...new Set(exercises.map(e => e.type).filter(Boolean))].sort();
  const bodyRegions = [...new Set(exercises.map(e => e.body_region).filter(Boolean))].sort();

  // Pagination
  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExercises = filteredExercises.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (level <= 3) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };

  const usedExercisesCount = Object.keys(exerciseUsage).length;

  // Exercise Modal Component
  const ExerciseModal = ({ exercise, onClose }: { exercise: Exercise | null, onClose: () => void }) => {
    if (!exercise) return null;

    const usage = exerciseUsage[exercise.id] || 0;
    const requiredEquipment = exercise.equipment_required || exercise.equipment_needed || [];
    const requiredList = Array.isArray(requiredEquipment) ? requiredEquipment : [requiredEquipment].filter(Boolean);
    const optionalEquipment = exercise.equipment_optional || [];
    const optionalList = Array.isArray(optionalEquipment) ? optionalEquipment : [optionalEquipment].filter(Boolean);
    const instructions = exercise.translations?.en?.instructions || [];
    const cues = exercise.translations?.en?.cues || [];
    const commonErrors = exercise.translations?.en?.common_errors || [];
    const description = exercise.translations?.en?.description || exercise.description || '';
    
    console.log('Exercise modal data:', {
      name: exercise.name,
      description,
      hasTranslations: !!exercise.translations,
      hasEnTranslation: !!exercise.translations?.en,
      hasEnDescription: !!exercise.translations?.en?.description,
      directDescription: exercise.description
    });

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.colors.primary[100] }}>
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: theme.colors.primary[900] }}>
                {exercise.translations?.en?.name || exercise.name}
              </h2>
              <div className="flex items-center gap-4 mt-2">
                {exercise.specialty_categories?.map((cat, idx) => (
                  <span key={idx} className="text-sm px-2 py-1 rounded-full font-medium" 
                    style={{ 
                      backgroundColor: theme.colors.primary[600], 
                      color: 'white' 
                    }}>
                    {formatText(cat)}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="w-6 h-6" style={{ color: theme.colors.primary[600], cursor: 'pointer' }} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {exercise.type && (
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: theme.colors.primary[600] }}>
                  <Target className="w-5 h-5 flex-shrink-0" style={{ color: 'white' }} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: theme.colors.primary[100] }}>Type</div>
                    <div className="text-sm font-semibold" style={{ color: 'white' }}>{formatText(exercise.type)}</div>
                  </div>
                </div>
              )}
              
              {exercise.body_region && (
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: theme.colors.secondary[600] }}>
                  <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: 'white' }} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: theme.colors.secondary[100] }}>Region</div>
                    <div className="text-sm font-semibold" style={{ color: 'white' }}>{formatText(exercise.body_region)}</div>
                  </div>
                </div>
              )}
              
              {exercise.difficulty_level && (
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: theme.colors.warning[600] }}>
                  <Activity className="w-5 h-5 flex-shrink-0" style={{ color: 'white' }} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: theme.colors.warning[100] }}>Difficulty</div>
                    <div className="text-sm font-semibold" style={{ color: 'white' }}>Level {exercise.difficulty_level}</div>
                  </div>
                </div>
              )}
              
              {exercise.position && (
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: theme.colors.success[600] }}>
                  <User className="w-5 h-5 flex-shrink-0" style={{ color: 'white' }} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: theme.colors.success[100] }}>Position</div>
                    <div className="text-sm font-semibold" style={{ color: 'white' }}>{formatText(exercise.position)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                  <Info className="w-5 h-5" /> Description
                </h3>
                <p className="text-base leading-relaxed p-4 rounded-lg" 
                   style={{ 
                     color: theme.colors.primary[900], 
                     backgroundColor: 'white',
                     border: `1px solid ${theme.colors.primary[100]}`
                   }}>
                  {description}
                </p>
              </div>
            )}

            {/* Instructions */}
            {instructions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                  <CheckCircle className="w-5 h-5" /> Instructions
                </h3>
                <ol className="space-y-2">
                  {instructions.map((instruction, idx) => (
                    <li key={idx} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'white', border: `1px solid ${theme.colors.primary[100]}` }}>
                      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: theme.colors.primary[600], color: 'white' }}>
                        {idx + 1}
                      </span>
                      <span style={{ color: theme.colors.primary[900] }}>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Important Cues */}
            {cues.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                  <Zap className="w-5 h-5" /> Important Cues
                </h3>
                <ul className="space-y-2">
                  {cues.map((cue, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'white', border: `1px solid ${theme.colors.warning[100]}` }}>
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.colors.warning[600] }} />
                      <span style={{ color: theme.colors.primary[900] }}>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Errors */}
            {commonErrors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                  <AlertCircle className="w-5 h-5" /> Common Errors to Avoid
                </h3>
                <ul className="space-y-2">
                  {commonErrors.map((error, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.error[600] }}>
                      <X className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'white' }} />
                      <span style={{ color: 'white' }}>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Muscle Targets */}
            {exercise.muscle_targets && (exercise.muscle_targets.primary || exercise.muscle_targets.secondary) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                  <Zap className="w-5 h-5" /> Muscle Targets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exercise.muscle_targets.primary && exercise.muscle_targets.primary.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2" style={{ color: theme.colors.primary[900] }}>Primary Muscles</h4>
                      <div className="flex flex-wrap gap-2">
                        {exercise.muscle_targets.primary.map((muscle, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-lg text-sm font-medium"
                            style={{ 
                              backgroundColor: theme.colors.primary[600],
                              color: 'white'
                            }}>
                            {formatText(muscle)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {exercise.muscle_targets.secondary && exercise.muscle_targets.secondary.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2" style={{ color: theme.colors.primary[900] }}>Secondary Muscles</h4>
                      <div className="flex flex-wrap gap-2">
                        {exercise.muscle_targets.secondary.map((muscle, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-lg text-sm font-medium"
                            style={{ 
                              backgroundColor: theme.colors.secondary[600],
                              color: 'white'
                            }}>
                            {formatText(muscle)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EMG Activation */}
            {exercise.emg_activation && Object.keys(exercise.emg_activation).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                  <Activity className="w-5 h-5" /> EMG Muscle Activation
                </h3>
                <div className="space-y-2">
                  {Object.entries(exercise.emg_activation).map(([muscle, value]) => (
                    <div key={muscle} className="flex items-center gap-3">
                      <span className="flex-1 text-sm font-medium" style={{ color: theme.colors.primary[900] }}>
                        {formatText(muscle)}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${value * 100}%`,
                            backgroundColor: value > 0.7 ? theme.colors.success[600] : 
                                           value > 0.4 ? theme.colors.warning[600] : 
                                           theme.colors.primary[100]
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium" style={{ color: theme.colors.primary[900] }}>
                        {(value * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {(requiredList.length > 0 || optionalList.length > 0) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                  <Dumbbell className="w-5 h-5" /> Equipment
                </h3>
                {requiredList.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium mb-2" style={{ color: theme.colors.primary[900] }}>Required Equipment</h4>
                    <div className="flex flex-wrap gap-2">
                      {requiredList.map((eq, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-2 rounded-lg text-sm border"
                          style={{ 
                            backgroundColor: theme.colors.error[600],
                            borderColor: theme.colors.error[700],
                            color: 'white'
                          }}
                        >
                          {formatText(eq)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {optionalList.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: theme.colors.primary[900] }}>Optional Equipment</h4>
                    <div className="flex flex-wrap gap-2">
                      {optionalList.map((eq, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-2 rounded-lg text-sm border"
                          style={{ 
                            backgroundColor: 'white',
                            borderColor: theme.colors.primary[100],
                            color: theme.colors.primary[900]
                          }}
                        >
                          {formatText(eq)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Functional Goals */}
            {exercise.functional_goals && exercise.functional_goals.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                  <Target className="w-5 h-5" /> Functional Goals
                </h3>
                <ul className="space-y-2">
                  {exercise.functional_goals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.success[600] }}>
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'white' }} />
                      <span style={{ color: 'white' }}>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specialty Information */}
            {(exercise.cardiac_phase || exercise.water_depth || exercise.pregnancy_stage || 
              exercise.neurological_condition || exercise.rehabilitation_phase) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                  <Heart className="w-5 h-5" /> Specialty Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exercise.cardiac_phase && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.error[600] }}>
                      <span className="font-medium" style={{ color: theme.colors.error[100] }}>Cardiac Phase: </span>
                      <span style={{ color: 'white' }}>{formatText(exercise.cardiac_phase)}</span>
                    </div>
                  )}
                  {exercise.water_depth && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.info[600] }}>
                      <span className="font-medium" style={{ color: theme.colors.info[100] }}>Water Depth: </span>
                      <span style={{ color: 'white' }}>{formatText(exercise.water_depth)}</span>
                    </div>
                  )}
                  {exercise.pregnancy_stage && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.warning[600] }}>
                      <span className="font-medium" style={{ color: theme.colors.warning[100] }}>Pregnancy Stage: </span>
                      <span style={{ color: 'white' }}>{formatText(exercise.pregnancy_stage)}</span>
                    </div>
                  )}
                  {exercise.neurological_condition && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.secondary[600] }}>
                      <span className="font-medium" style={{ color: theme.colors.secondary[100] }}>Neurological Condition: </span>
                      <span style={{ color: 'white' }}>{formatText(exercise.neurological_condition)}</span>
                    </div>
                  )}
                  {exercise.rehabilitation_phase && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.primary[600] }}>
                      <span className="font-medium" style={{ color: theme.colors.primary[100] }}>Rehab Phase: </span>
                      <span style={{ color: 'white' }}>{formatText(exercise.rehabilitation_phase)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Usage Stats */}
            <div className="border-t pt-6" style={{ borderColor: theme.colors.primary[100] }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Usage in Treatment Protocols</div>
                  <div className="text-2xl font-semibold" style={{ color: theme.colors.success[600] }}>
                    {usage} {usage === 1 ? 'condition' : 'conditions'}
                  </div>
                </div>
                {usage > 0 && (
                  <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: theme.colors.success[50] }}>
                    <span className="text-sm font-medium" style={{ color: theme.colors.success[700] }}>
                      Frequently Used
                    </span>
                  </div>
                )}
              </div>
              
              {/* Condition Details */}
              {exerciseConditionMap[exercise.id] && exerciseConditionMap[exercise.id].length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium" style={{ color: theme.colors.primary[700] }}>
                    Used in these conditions:
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {exerciseConditionMap[exercise.id].map((conditionInfo, index) => (
                      <div 
                        key={`${conditionInfo.conditionId}-${index}`}
                        className="p-3 rounded-lg border"
                        style={{ 
                          backgroundColor: theme.colors.primary[50],
                          borderColor: theme.colors.primary[100]
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium" style={{ color: theme.colors.primary[900] }}>
                              {conditionInfo.conditionName}
                            </div>
                            <div className="text-sm" style={{ color: theme.colors.primary[600] }}>
                              {conditionInfo.phase}
                              {conditionInfo.phaseDuration && ` • ${conditionInfo.phaseDuration} weeks`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.primary[50] }}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div 
              className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4"
              style={{ borderColor: theme.colors.primary[600] }}
            ></div>
            <p className="text-xl" style={{ color: theme.colors.primary[600] }}>Loading exercises...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.primary[50] }}>

      <Navigation />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light mb-4" style={{ color: theme.colors.primary[900] }}>
            Exercise Database
          </h1>
          <p style={{ color: theme.colors.primary[600] }}>Explore {exercises.length} therapeutic exercises with detailed instructions and protocols</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-200"
            style={{ borderColor: theme.colors.primary[100], border: '1px solid' }}
          >
            <div className="text-2xl font-medium mb-1" style={{ color: theme.colors.primary[900] }}>{exercises.length}</div>
            <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Total Exercises</div>
          </div>
          <div 
            className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-200"
            style={{ borderColor: theme.colors.primary[100], border: '1px solid' }}
          >
            <div className="text-2xl font-medium mb-1" style={{ color: theme.colors.primary[900] }}>{bodyRegions.length}</div>
            <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Body Regions</div>
          </div>
          <div 
            className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-200"
            style={{ borderColor: theme.colors.primary[100], border: '1px solid' }}
          >
            <div className="text-2xl font-medium mb-1" style={{ color: theme.colors.primary[900] }}>{exerciseTypes.length}</div>
            <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Exercise Types</div>
          </div>
          <div 
            className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-200"
            style={{ borderColor: theme.colors.primary[100], border: '1px solid' }}
          >
            <div className="text-2xl font-medium mb-1" style={{ color: theme.colors.primary[900] }}>{usedExercisesCount}</div>
            <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Used in Protocols</div>
          </div>
        </div>

        {/* Controls */}
        <div 
          className="bg-white rounded-lg p-6 mb-8 shadow-sm"
          style={{ borderColor: theme.colors.primary[100], border: '1px solid' }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises by name, ID, or description..."
                className="flex-1 px-4 py-3 bg-white rounded transition-colors duration-200 focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: theme.colors.primary[100], 
                  border: '1px solid',
                  color: theme.colors.primary[900]
                } as React.CSSProperties}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Type filters */}
              <button
                onClick={() => setTypeFilter('all')}
                className="px-4 py-2 rounded-full font-medium transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: typeFilter === 'all' ? theme.colors.primary[600] : 'transparent',
                  color: typeFilter === 'all' ? 'white' : theme.colors.primary[600],
                  borderColor: theme.colors.primary[100],
                  border: '1px solid'
                }}
                onMouseEnter={(e) => {
                  if (typeFilter !== 'all') {
                    e.currentTarget.style.backgroundColor = theme.colors.primary[50];
                  }
                }}
                onMouseLeave={(e) => {
                  if (typeFilter !== 'all') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                All Types
              </button>
              {['mobility', 'strengthening', 'therapeutic', 'functional', 'breathing'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className="px-4 py-2 rounded-full font-medium transition-all duration-300 cursor-pointer"
                  style={{
                    backgroundColor: typeFilter === type ? theme.colors.primary[600] : 'transparent',
                    color: typeFilter === type ? 'white' : theme.colors.primary[600],
                    borderColor: theme.colors.primary[100],
                    border: '1px solid'
                  }}
                  onMouseEnter={(e) => {
                    if (typeFilter !== type) {
                      e.currentTarget.style.backgroundColor = theme.colors.primary[50];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (typeFilter !== type) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {formatText(type)}
                </button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Region filters */}
              <button
                onClick={() => setRegionFilter('all')}
                className="px-4 py-2 rounded-full font-medium transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: regionFilter === 'all' ? theme.colors.secondary[600] : 'transparent',
                  color: regionFilter === 'all' ? 'white' : theme.colors.secondary[600],
                  borderColor: theme.colors.secondary[200],
                  border: '1px solid'
                }}
                onMouseEnter={(e) => {
                  if (regionFilter !== 'all') {
                    e.currentTarget.style.backgroundColor = theme.colors.secondary[50];
                  }
                }}
                onMouseLeave={(e) => {
                  if (regionFilter !== 'all') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                All Regions
              </button>
              {['shoulder', 'spine', 'knee', 'hip', 'ankle', 'core'].map((region) => (
                <button
                  key={region}
                  onClick={() => setRegionFilter(region)}
                  className="px-4 py-2 rounded-full font-medium transition-all duration-300 cursor-pointer"
                  style={{
                    backgroundColor: regionFilter === region ? theme.colors.secondary[600] : 'transparent',
                    color: regionFilter === region ? 'white' : theme.colors.secondary[600],
                    borderColor: theme.colors.secondary[200],
                    border: '1px solid'
                  }}
                  onMouseEnter={(e) => {
                    if (regionFilter !== region) {
                      e.currentTarget.style.backgroundColor = theme.colors.secondary[50];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (regionFilter !== region) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {formatText(region)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-lg" style={{ color: theme.colors.primary[600] }}>
            Showing <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>{filteredExercises.length}</span> exercises
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className="px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer"
              style={{
                backgroundColor: viewMode === 'grid' ? theme.colors.primary[600] : 'white',
                color: viewMode === 'grid' ? 'white' : theme.colors.primary[600],
                borderColor: theme.colors.primary[100],
                border: '1px solid'
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'grid') {
                  e.currentTarget.style.backgroundColor = theme.colors.primary[50];
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'grid') {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer"
              style={{
                backgroundColor: viewMode === 'list' ? theme.colors.primary[600] : 'white',
                color: viewMode === 'list' ? 'white' : theme.colors.primary[600],
                borderColor: theme.colors.primary[100],
                border: '1px solid'
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'list') {
                  e.currentTarget.style.backgroundColor = theme.colors.primary[50];
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'list') {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              List View
            </button>
          </div>
        </div>

        {/* Exercises Grid/List */}
        {paginatedExercises.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell 
              className="w-16 h-16 mx-auto mb-4 opacity-50" 
              style={{ color: theme.colors.primary[600] }}
            />
            <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.primary[900] }}>No exercises found</h3>
            <p style={{ color: theme.colors.primary[600] }}>Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'
              : 'space-y-4 mb-8'
            }>
              {paginatedExercises.map((exercise) => {
                const usage = exerciseUsage[exercise.id] || 0;
                const difficulty = exercise.difficulty_level || 0;

                return (
                  <div
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise)}
                    className={`bg-white rounded-lg p-6 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${
                      viewMode === 'list' ? 'flex items-center space-x-6' : ''
                    }`}
                    style={{ borderColor: theme.colors.primary[100], border: '1px solid' }}
                  >
                    <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="mb-4">
                        <h3 className="text-lg font-medium mb-1" style={{ color: theme.colors.primary[900] }}>
                          {exercise.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {exercise.type && (
                          <span 
                            className="px-3 py-1 rounded-full text-sm border"
                            style={{ 
                              backgroundColor: theme.colors.primary[50],
                              borderColor: theme.colors.primary[100],
                              color: theme.colors.primary[600]
                            }}
                          >
                            {formatText(exercise.type)}
                          </span>
                        )}
                        {exercise.body_region && (
                          <span 
                            className="px-3 py-1 rounded-full text-sm border"
                            style={{
                              backgroundColor: theme.colors.secondary[50],
                              borderColor: theme.colors.secondary[200],
                              color: theme.colors.secondary[600]
                            }}
                          >
                            {formatText(exercise.body_region)}
                          </span>
                        )}
                        {difficulty > 0 && (
                          <span className={`px-3 py-1 border rounded-full text-sm ${getDifficultyColor(difficulty)}`}>
                            Level {difficulty}
                          </span>
                        )}
                      </div>

                      {exercise.description && viewMode === 'grid' && (
                        <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: theme.colors.primary[600] }}>
                          {exercise.description}
                        </p>
                      )}

                      <div 
                        className="flex justify-between items-center pt-4 border-t"
                        style={{ borderColor: theme.colors.primary[100] }}
                      >
                        <div className="text-sm" style={{ color: theme.colors.primary[600] }}>
                          Used in <span className="font-semibold" style={{ color: theme.colors.success[600] }}>{usage}</span> conditions
                        </div>
                        <div 
                          className="transition-all duration-300 hover:translate-x-1"
                          style={{ color: theme.colors.primary[600] }}
                        >
                          →
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                {currentPage > 1 && (
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    className="px-4 py-2 bg-white border rounded-lg transition-all duration-300 hover:shadow-sm cursor-pointer"
                    style={{ 
                      borderColor: theme.colors.primary[100],
                      color: theme.colors.primary[600]
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary[600];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary[100];
                    }}
                  >
                    ←
                  </button>
                )}
                
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                  const page = i + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className="px-4 py-2 border rounded-lg transition-all duration-300 cursor-pointer"
                        style={{
                          backgroundColor: page === currentPage ? theme.colors.primary[600] : 'white',
                          borderColor: page === currentPage ? theme.colors.primary[600] : theme.colors.primary[100],
                          color: page === currentPage ? 'white' : theme.colors.primary[600]
                        }}
                        onMouseEnter={(e) => {
                          if (page !== currentPage) {
                            e.currentTarget.style.borderColor = theme.colors.primary[600];
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (page !== currentPage) {
                            e.currentTarget.style.borderColor = theme.colors.primary[100];
                          }
                        }}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="px-2" style={{ color: theme.colors.primary[600] }}>...</span>;
                  }
                  return null;
                })}
                
                {currentPage < totalPages && (
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    className="px-4 py-2 bg-white border rounded-lg transition-all duration-300 hover:shadow-sm cursor-pointer"
                    style={{ 
                      borderColor: theme.colors.primary[100],
                      color: theme.colors.primary[600]
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary[600];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary[100];
                    }}
                  >
                    →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Exercise Modal */}
      <ExerciseModal 
        exercise={selectedExercise} 
        onClose={() => setSelectedExercise(null)} 
      />

      <style jsx>{`
        @keyframes floatUp {
          from {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          to {
            transform: translateY(-100px) translateX(100px);
            opacity: 0;
          }
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
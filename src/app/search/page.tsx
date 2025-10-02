'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { X, Heart, Dumbbell, Wrench, Search, Target, Shield, FileText, Users, Clock, Activity, Calendar, ChevronRight, DollarSign, Package, Ruler, Info, Zap, Brain, CheckCircle, AlertCircle, MapPin, User, Network } from 'lucide-react';
import { theme } from '@/lib/theme';
import conditionsData from '../../../final_data/entities/conditions.json';
import exercisesData from '../../../final_data/entities/exercises.json';
import equipmentData from '../../../final_data/entities/equipment.json';
import ConditionGraphModal from '@/components/ConditionGraphModal';

interface SearchResult {
  type: 'condition' | 'exercise' | 'equipment';
  id: string;
  data: any;
  connections: any;
}

// Helper functions
const formatText = (text: string) => {
  if (!text) return '';
  return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getExerciseName = (exerciseId: string) => {
  const exercisesMap = exercisesData.exercises || exercisesData;
  const exercise = (exercisesMap as any)[exerciseId];
  return exercise?.name || exercise?.translations?.en?.name || exerciseId;
};

const getEquipmentName = (equipmentId: string) => {
  const equipmentMap = equipmentData.equipment || equipmentData;
  const equipment = (equipmentMap as any)[equipmentId];
  return equipment?.name || equipmentId;
};

const getAllExercises = (condition: any) => {
  const exercises: any[] = [];
  const exerciseIds = new Set();

  if (condition.treatment_protocol && condition.treatment_protocol.phases) {
    condition.treatment_protocol.phases.forEach((phase: any, index: number) => {
      if (phase.exercises) {
        phase.exercises.forEach((exercise: any) => {
          const exId = typeof exercise === 'string' ? exercise : exercise.exercise_id;
          if (!exerciseIds.has(exId)) {
            exerciseIds.add(exId);
            exercises.push({
              id: exId,
              name: getExerciseName(exId),
              phase: phase.phase_name || phase.name || `Phase ${phase.phase_number || index + 1}`,
              details: typeof exercise === 'object' ? exercise : null
            });
          }
        });
      }
    });
  }
  return exercises;
};

const getAllEquipment = (condition: any) => {
  const equipment: any[] = [];
  const equipmentIds = new Set();

  if (condition.treatment_protocol && condition.treatment_protocol.phases) {
    condition.treatment_protocol.phases.forEach((phase: any) => {
      if (phase.equipment_required) {
        phase.equipment_required.forEach((equipmentId: string) => {
          if (!equipmentIds.has(equipmentId)) {
            equipmentIds.add(equipmentId);
            equipment.push({
              id: equipmentId,
              name: getEquipmentName(equipmentId),
              phase: phase.phase_name || phase.name
            });
          }
        });
      }
    });
  }
  return equipment;
};

// Condition Modal Component
const ConditionModal = ({ condition, onClose }: { condition: any | null, onClose: () => void }) => {
  if (!condition) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-4">
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        ></div>
        
        <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-lg" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b bg-white" style={{ borderColor: theme.colors.primary[100] }}>
            <div className="flex items-center space-x-3">
              <Heart className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
              <div>
                <h2 className="text-xl font-medium" style={{ color: theme.colors.primary[900] }}>{condition.name}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
              style={{ backgroundColor: 'transparent', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="w-6 h-6" style={{ color: theme.colors.primary[600], cursor: 'pointer' }} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                  <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>Body Region</span>
                </div>
                <p style={{ color: theme.colors.primary[600] }}>{formatText(condition.body_region || 'Not specified')}</p>
              </div>
              
              <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                  <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>Specialty</span>
                </div>
                <p style={{ color: theme.colors.primary[600] }}>{formatText(condition.specialty || 'General')}</p>
              </div>
              
              <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                  <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>ICD-10</span>
                </div>
                <p className="font-mono" style={{ color: theme.colors.primary[600] }}>{condition.icd10 || 'Not specified'}</p>
              </div>
              
              <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                  <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>Age Range</span>
                </div>
                <p style={{ color: theme.colors.primary[600] }}>{condition.typical_age_range || 'All ages'}</p>
              </div>
              
              <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                  <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>Chronicity</span>
                </div>
                <p style={{ color: theme.colors.primary[600] }}>{condition.chronicity || 'Variable'}</p>
              </div>
              
              <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                  <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>Prevalence Rank</span>
                </div>
                <p style={{ color: theme.colors.primary[600] }}>#{condition.prevalence_rank || 'Not ranked'}</p>
              </div>
            </div>

            {/* Exercises Section */}
            {(() => {
              const allExercises = getAllExercises(condition);
              return allExercises.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2" style={{ color: theme.colors.primary[900] }}>
                    <Dumbbell className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
                    <span>Exercises ({allExercises.length})</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {allExercises.slice(0, 10).map((exercise, index) => (
                      <div key={`${exercise.id}-${index}`} className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-all duration-200" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1" style={{ color: theme.colors.primary[900] }}>{exercise.name}</h4>
                          <p className="text-sm" style={{ color: theme.colors.primary[600] }}>{exercise.phase}</p>
                        </div>
                        <Dumbbell className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                      </div>
                    ))}
                    {allExercises.length > 10 && (
                      <div style={{ color: theme.colors.primary[600] }} className="text-sm text-center">... and {allExercises.length - 10} more exercises</div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Equipment Section */}
            {(() => {
              const allEquipment = getAllEquipment(condition);
              return allEquipment.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2" style={{ color: theme.colors.primary[900] }}>
                    <Wrench className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
                    <span>Required Equipment ({allEquipment.length})</span>
                  </h3>
                  
                  <div className="flex flex-wrap gap-3">
                    {allEquipment.map((equipmentItem, index) => (
                      <div key={`${equipmentItem.id}-${index}`} className="px-4 py-3 rounded-xl flex items-center space-x-2 hover:shadow-md transition-all duration-200" style={{ backgroundColor: theme.colors.success[50], borderColor: theme.colors.success[100], borderWidth: '1px', borderStyle: 'solid', color: theme.colors.success[600] }}>
                        <Wrench className="w-4 h-4" />
                        <span className="font-medium">{equipmentItem.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Exercise Modal Component
const ExerciseModal = ({ exercise, onClose }: { exercise: any | null, onClose: () => void }) => {
  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.colors.primary[100] }}>
            <h2 className="text-xl font-semibold" style={{ color: theme.colors.primary[900] }}>
              {exercise.name || 'Unnamed Exercise'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
              style={{}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
            </button>
          </div>
          
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3" style={{ color: theme.colors.primary[900] }}>Exercise Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.primary[600] }}>
                  <div className="font-medium text-sm" style={{ color: theme.colors.primary[100] }}>Type</div>
                  <div className="font-semibold" style={{ color: 'white' }}>{exercise.type ? formatText(exercise.type) : 'Not specified'}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.secondary[600] }}>
                  <div className="font-medium text-sm" style={{ color: theme.colors.secondary[100] }}>Body Region</div>
                  <div className="font-semibold" style={{ color: 'white' }}>{exercise.body_region ? formatText(exercise.body_region) : 'Not specified'}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.warning[600] }}>
                  <div className="font-medium text-sm" style={{ color: theme.colors.warning[100] }}>Difficulty</div>
                  <div className="font-semibold" style={{ color: 'white' }}>{exercise.difficulty_level ? `Level ${exercise.difficulty_level}` : 'Not specified'}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.success[600] }}>
                  <div className="font-medium text-sm" style={{ color: theme.colors.success[100] }}>Position</div>
                  <div className="font-semibold" style={{ color: 'white' }}>{exercise.position ? formatText(exercise.position) : 'Not specified'}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            {exercise.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: theme.colors.primary[900] }}>Description</h3>
                <p className="leading-relaxed p-4 rounded-lg" 
                   style={{ 
                     color: theme.colors.primary[900], 
                     backgroundColor: 'white',
                     border: `1px solid ${theme.colors.primary[100]}`
                   }}>
                  {exercise.description}
                </p>
              </div>
            )}

            {/* Equipment */}
            {(exercise.equipment_required || exercise.equipment_needed) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: theme.colors.primary[900] }}>Required Equipment</h3>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(exercise.equipment_required) ? exercise.equipment_required : 
                    Array.isArray(exercise.equipment_needed) ? exercise.equipment_needed : 
                    [exercise.equipment_required || exercise.equipment_needed]).filter(Boolean).map((eq: string, idx: number) => (
                    <span 
                      key={idx}
                      className="px-3 py-2 rounded-lg text-sm border"
                      style={{ 
                        backgroundColor: theme.colors.secondary[50],
                        borderColor: theme.colors.secondary[200],
                        color: theme.colors.secondary[800]
                      }}
                    >
                      {formatText(eq)}
                    </span>
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

// Equipment Modal Component
const EquipmentModal = ({ equipment, onClose }: { equipment: any | null, onClose: () => void }) => {
  if (!equipment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.colors.primary[100] }}>
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: theme.colors.primary[900] }}>
              {equipment.name}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-mono" style={{ color: theme.colors.primary[600] }}>
                {equipment.id}
              </span>
              {equipment.category && (
                <span className="text-sm px-2 py-1 rounded-full" 
                  style={{ 
                    backgroundColor: theme.colors.primary[100], 
                    color: theme.colors.primary[700] 
                  }}>
                  {formatText(equipment.category)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
            style={{}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary[100]}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {equipment.type && (
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: theme.colors.secondary[50] }}>
                <Wrench className="w-5 h-5 flex-shrink-0" style={{ color: theme.colors.secondary[600] }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: theme.colors.secondary[700] }}>Type</div>
                  <div className="text-sm font-medium" style={{ color: theme.colors.secondary[900] }}>{formatText(equipment.type)}</div>
                </div>
              </div>
            )}
            
            {equipment.cost_range && (
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ 
                backgroundColor: equipment.cost_range.toLowerCase().includes('low') ? theme.colors.success[50] :
                               equipment.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[50] :
                               theme.colors.error[50]
              }}>
                <DollarSign className="w-5 h-5 flex-shrink-0" style={{ 
                  color: equipment.cost_range.toLowerCase().includes('low') ? theme.colors.success[600] :
                         equipment.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[600] :
                         theme.colors.error[600]
                }} />
                <div>
                  <div className="text-xs font-medium" style={{ 
                    color: equipment.cost_range.toLowerCase().includes('low') ? theme.colors.success[700] :
                           equipment.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[700] :
                           theme.colors.error[700]
                  }}>Cost Range</div>
                  <div className="text-sm font-medium" style={{ 
                    color: equipment.cost_range.toLowerCase().includes('low') ? theme.colors.success[700] :
                           equipment.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[700] :
                           theme.colors.error[700]
                  }}>{formatText(equipment.cost_range)}</div>
                </div>
              </div>
            )}
            
            {equipment.portability && (
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: theme.colors.primary[50] }}>
                <Package className="w-5 h-5 flex-shrink-0" style={{ color: theme.colors.primary[600] }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: theme.colors.primary[700] }}>Portability</div>
                  <div className="text-sm font-medium" style={{ color: theme.colors.primary[900] }}>{formatText(equipment.portability)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {equipment.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                <Info className="w-5 h-5" /> Description
              </h3>
              <p className="text-base leading-relaxed p-4 rounded-lg" 
                 style={{ 
                   color: theme.colors.primary[700], 
                   backgroundColor: theme.colors.primary[50] 
                 }}>
                {equipment.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function SearchContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<SearchResult | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [selectedConditionForGraph, setSelectedConditionForGraph] = useState<any>(null);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  
  useEffect(() => {
    const query = searchParams?.get('q');
    if (query) {
      setSearchQuery(query);
      // Immediately perform search when URL params change
      setTimeout(() => performSearch(query), 0);
    }
  }, [searchParams]);

  // Separate effect for filter changes to re-run search
  useEffect(() => {
    const query = searchParams?.get('q');
    if (query && searchQuery) {
      performSearch(query);
    }
  }, [currentFilter]);

  const getConditionConnections = (condition: any) => {
    const connections = { exercises: [] as any[], equipment: [] as any[] };
    
    if (condition.treatment_protocol && condition.treatment_protocol.phases) {
      condition.treatment_protocol.phases.forEach((phase: any) => {
        if (phase.exercises) {
          phase.exercises.forEach((ex: any) => {
            const exId = typeof ex === 'string' ? ex : ex.exercise_id;
            if (!connections.exercises.includes(exId)) {
              connections.exercises.push(exId);
            }
          });
        }
        if (phase.equipment_required) {
          phase.equipment_required.forEach((eq: string) => {
            if (!connections.equipment.includes(eq)) {
              connections.equipment.push(eq);
            }
          });
        }
      });
    }
    
    return connections;
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    try {
      // Search conditions
      if (currentFilter === 'all' || currentFilter === 'conditions') {
        const conditions = conditionsData.conditions || conditionsData;
        Object.entries(conditions).forEach(([id, condition]: [string, any]) => {
          const searchableText = JSON.stringify(condition).toLowerCase();
          if (searchableText.includes(lowerQuery) || id.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              type: 'condition',
              id,
              data: condition,
              connections: getConditionConnections(condition)
            });
          }
        });
      }

      // Search exercises
      if (currentFilter === 'all' || currentFilter === 'exercises') {
        const exercises = exercisesData.exercises || exercisesData;
        Object.entries(exercises).forEach(([id, exercise]: [string, any]) => {
          const searchableText = JSON.stringify(exercise).toLowerCase();
          if (searchableText.includes(lowerQuery) || id.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              type: 'exercise',
              id,
              data: exercise,
              connections: {}
            });
          }
        });
      }

      // Search equipment
      if (currentFilter === 'all' || currentFilter === 'equipment') {
        const equipment = equipmentData.equipment || equipmentData;
        Object.entries(equipment).forEach(([id, item]: [string, any]) => {
          const searchableText = JSON.stringify(item).toLowerCase();
          if (searchableText.includes(lowerQuery) || id.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              type: 'equipment',
              id,
              data: item,
              connections: {}
            });
          }
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Update URL with new search query
      const newUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      router.push(newUrl);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'condition':
        return <Heart className="w-4 h-4" />;
      case 'exercise':
        return <Dumbbell className="w-4 h-4" />;
      case 'equipment':
        return <Wrench className="w-4 h-4" />;
      default:
        return <Heart className="w-4 h-4" />;
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'conditions', label: 'Conditions' },
    { key: 'exercises', label: 'Exercises' },
    { key: 'equipment', label: 'Equipment' }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.primary[50] }}>
      <Navigation />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search Controls */}
        <div className="bg-white border rounded-lg p-6 mb-8 shadow-sm" style={{ borderColor: theme.colors.primary[100] }}>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter condition name, exercise, equipment, or ID..."
                className="w-full px-4 py-3 bg-white border rounded placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200"
                style={{
                  borderColor: theme.colors.primary[100],
                  color: theme.colors.primary[900],
                  '--tw-ring-color': theme.colors.primary[600]
                } as React.CSSProperties}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 text-white rounded hover:shadow-md transition-all duration-200 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: theme.colors.primary[600] }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  setCurrentFilter(filter.key);
                  if (searchQuery) {
                    // Update URL with current search query and new filter will be applied
                    const newUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                    router.push(newUrl);
                  }
                }}
                className={`px-4 py-2 rounded text-sm transition-all duration-200 border cursor-pointer ${
                  currentFilter === filter.key
                    ? 'shadow-md'
                    : 'shadow-sm hover:shadow-md'
                }`}
                style={{ 
                  borderColor: theme.colors.primary[100],
                  color: currentFilter === filter.key ? theme.colors.primary[900] : theme.colors.primary[600],
                  backgroundColor: currentFilter === filter.key ? theme.colors.primary[50] : 'white'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <div className="text-lg" style={{ color: theme.colors.primary[600] }}>
            Found <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>{results.length}</span> results
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4" style={{ borderColor: theme.colors.primary[600] }}></div>
              <p style={{ color: theme.colors.primary[600] }}>Searching...</p>
            </div>
          ) : results.length === 0 && searchQuery ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-4" style={{ color: theme.colors.primary[600] }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.primary[900] }}>No results found</h3>
              <p style={{ color: theme.colors.primary[600] }}>Try adjusting your search query or filters</p>
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={`${result.type}-${result.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border hover:shadow-xl"
                style={{ 
                  borderColor: theme.colors.primary[100]
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.colors.primary[600]}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.colors.primary[100]}
              >
                {/* Card Header with Entity Type Indicator */}
                <div className="h-2" style={{
                  background: result.type === 'condition' ? `linear-gradient(to right, ${theme.colors.primary[600]}, ${theme.colors.primary[700]})` :
                              result.type === 'exercise' ? `linear-gradient(to right, ${theme.colors.secondary[500]}, ${theme.colors.secondary[600]})` :
                              `linear-gradient(to right, ${theme.colors.warning[500]}, ${theme.colors.warning[600]})`
                }}></div>
                
                <div className="p-6">
                  {/* Title Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                          backgroundColor: result.type === 'condition' ? theme.colors.primary[100] :
                                          result.type === 'exercise' ? theme.colors.secondary[100] :
                                          theme.colors.warning[100],
                          color: result.type === 'condition' ? theme.colors.primary[600] :
                                result.type === 'exercise' ? theme.colors.secondary[600] :
                                theme.colors.warning[600]
                        }}>
                          {result.type === 'condition' ? <Heart className="w-5 h-5" /> :
                           result.type === 'exercise' ? <Dumbbell className="w-5 h-5" /> :
                           <Wrench className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold leading-tight" style={{ color: theme.colors.primary[900] }}>
                            {result.data.name || 'Unnamed'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                              backgroundColor: result.type === 'condition' ? theme.colors.primary[50] :
                                              result.type === 'exercise' ? theme.colors.secondary[50] :
                                              theme.colors.warning[50],
                              color: result.type === 'condition' ? theme.colors.primary[700] :
                                    result.type === 'exercise' ? theme.colors.secondary[700] :
                                    theme.colors.warning[700]
                            }}>
                              {formatText(result.type)}
                            </span>
                            <span className="text-xs font-mono" style={{ color: theme.colors.primary[600] }}>
                              ID: {result.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Section - Different layouts per type */}
                  {result.type === 'condition' && (
                    <div className="space-y-4">
                      {/* Condition Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4" style={{ color: theme.colors.primary[600] }} />
                            <span className="text-sm font-semibold" style={{ color: theme.colors.primary[900] }}>Body Region</span>
                          </div>
                          <p style={{ color: theme.colors.primary[700] }}>{formatText(result.data.body_region) || 'Not specified'}</p>
                        </div>
                        <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4" style={{ color: theme.colors.primary[600] }} />
                            <span className="text-sm font-semibold" style={{ color: theme.colors.primary[900] }}>Specialty</span>
                          </div>
                          <p style={{ color: theme.colors.primary[700] }}>{formatText(result.data.specialty) || 'General'}</p>
                        </div>
                        <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4" style={{ color: theme.colors.primary[600] }} />
                            <span className="text-sm font-semibold" style={{ color: theme.colors.primary[900] }}>Prevalence</span>
                          </div>
                          <p style={{ color: theme.colors.primary[700] }}>
                            {result.data.prevalence_rank ? `Rank #${result.data.prevalence_rank}` : 'Not ranked'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Connection Summary */}
                      {result.connections && (result.connections.exercises?.length > 0 || result.connections.equipment?.length > 0) && (
                        <div className="rounded-lg p-4" style={{ 
                          background: `linear-gradient(to right, ${theme.colors.primary[50]}, ${theme.colors.secondary[50]})`
                        }}>
                          <div className="flex items-center gap-2 mb-3">
                            <Network className="w-4 h-4" style={{ color: theme.colors.primary[600] }} />
                            <span className="text-sm font-semibold" style={{ color: theme.colors.primary[900] }}>Treatment Network</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.connections.exercises?.length > 0 && (
                              <div className="flex items-center gap-1 bg-white bg-opacity-70 rounded-full px-3 py-1">
                                <Dumbbell className="w-3 h-3" style={{ color: theme.colors.secondary[600] }} />
                                <span className="text-xs font-medium" style={{ color: theme.colors.secondary[700] }}>
                                  {result.connections.exercises.length} Exercise{result.connections.exercises.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                            {result.connections.equipment?.length > 0 && (
                              <div className="flex items-center gap-1 bg-white bg-opacity-70 rounded-full px-3 py-1">
                                <Wrench className="w-3 h-3" style={{ color: theme.colors.warning[600] }} />
                                <span className="text-xs font-medium" style={{ color: theme.colors.warning[700] }}>
                                  {result.connections.equipment.length} Equipment
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {result.type === 'exercise' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.secondary[50] }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4" style={{ color: theme.colors.secondary[600] }} />
                            <span className="text-sm font-semibold" style={{ color: theme.colors.secondary[900] }}>Exercise Type</span>
                          </div>
                          <p style={{ color: theme.colors.secondary[900] }}>{formatText(result.data.type) || 'Not specified'}</p>
                        </div>
                        <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.secondary[50] }}>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4" style={{ color: theme.colors.secondary[600] }} />
                            <span className="text-sm font-semibold" style={{ color: theme.colors.secondary[900] }}>Body Region</span>
                          </div>
                          <p style={{ color: theme.colors.secondary[900] }}>{formatText(result.data.body_region) || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      {result.data.difficulty_level && (
                        <div className="rounded-lg p-4 border" style={{ 
                          backgroundColor: theme.colors.warning[50],
                          borderColor: theme.colors.warning[100]
                        }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4" style={{ color: theme.colors.warning[600] }} />
                            <span className="text-sm font-semibold" style={{ color: theme.colors.warning[700] }}>Difficulty Level</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: theme.colors.warning[700] }}>Level {result.data.difficulty_level}</span>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: i < (result.data.difficulty_level || 0) ? theme.colors.warning[600] : theme.colors.warning[100]
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(result.data.equipment_required || result.data.equipment_needed) && (
                        <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.warning[50] }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-4 h-4" style={{ color: theme.colors.warning[600] }} />
                            <span className="text-sm font-semibold" style={{ color: theme.colors.warning[700] }}>Equipment Required</span>
                          </div>
                          <p style={{ color: theme.colors.warning[700] }}>
                            {Array.isArray(result.data.equipment_required) 
                              ? `${result.data.equipment_required.length} items required`
                              : result.data.equipment_required || result.data.equipment_needed || 'None specified'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {result.type === 'equipment' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.warning[50] }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4" style={{ color: theme.colors.warning[600] }} />
                            <span className="text-sm font-semibold" style={{ color: theme.colors.warning[700] }}>Category</span>
                          </div>
                          <p style={{ color: theme.colors.warning[700] }}>{formatText(result.data.category) || 'Not specified'}</p>
                        </div>
                        <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.warning[50] }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-4 h-4" style={{ color: theme.colors.warning[600] }} />
                            <span className="text-sm font-semibold" style={{ color: theme.colors.warning[700] }}>Type</span>
                          </div>
                          <p style={{ color: theme.colors.warning[700] }}>{formatText(result.data.type) || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.data.cost_range && (
                          <div className="rounded-lg p-4" style={{
                            backgroundColor: result.data.cost_range.toLowerCase().includes('low') ? theme.colors.success[50] :
                                           result.data.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[50] :
                                           theme.colors.error[50]
                          }}>
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4" style={{
                                color: result.data.cost_range.toLowerCase().includes('low') ? theme.colors.success[600] :
                                       result.data.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[600] :
                                       theme.colors.error[600]
                              }} />
                              <span className="text-sm font-semibold" style={{
                                color: result.data.cost_range.toLowerCase().includes('low') ? theme.colors.success[700] :
                                       result.data.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[700] :
                                       theme.colors.error[700]
                              }}>Cost Range</span>
                            </div>
                            <p style={{
                              color: result.data.cost_range.toLowerCase().includes('low') ? theme.colors.success[700] :
                                     result.data.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[700] :
                                     theme.colors.error[700]
                            }}>{formatText(result.data.cost_range)}</p>
                          </div>
                        )}
                        
                        {result.data.portability && (
                          <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-4 h-4" style={{ color: theme.colors.primary[600] }} />
                              <span className="text-sm font-semibold" style={{ color: theme.colors.primary[900] }}>Portability</span>
                            </div>
                            <p style={{ color: theme.colors.primary[900] }}>{formatText(result.data.portability)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description if available */}
                  {result.data.description && (
                    <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: theme.colors.primary[50] }}>
                      <p className="text-sm leading-relaxed" style={{ color: theme.colors.primary[700] }}>
                        {result.data.description.length > 200 
                          ? `${result.data.description.substring(0, 200)}...` 
                          : result.data.description}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 pt-4 border-t" style={{ borderColor: theme.colors.primary[100] }}>
                    {result.type === 'condition' ? (
                      <div className="flex gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCondition(result.data);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg transition-all duration-200 cursor-pointer"
                          style={{ 
                            backgroundColor: theme.colors.primary[600]
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary[700]}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary[600]}
                        >
                          <FileText className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConditionForGraph(result.data);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg transition-all duration-200 cursor-pointer"
                          style={{ 
                            backgroundColor: theme.colors.secondary[600]
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.secondary[700]}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.secondary[600]}
                        >
                          <Network className="w-4 h-4" />
                          Knowledge Graph
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (result.type === 'exercise') {
                            setSelectedExercise(result.data);
                          } else if (result.type === 'equipment') {
                            setSelectedEquipment(result.data);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg transition-all duration-200 cursor-pointer"
                        style={{
                          backgroundColor: result.type === 'exercise' ? theme.colors.secondary[600] : theme.colors.warning[600]
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = result.type === 'exercise' ? theme.colors.secondary[700] : theme.colors.warning[700];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = result.type === 'exercise' ? theme.colors.secondary[600] : theme.colors.warning[600];
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <ConditionModal condition={selectedCondition} onClose={() => setSelectedCondition(null)} />
      <ExerciseModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      <EquipmentModal equipment={selectedEquipment} onClose={() => setSelectedEquipment(null)} />
      
      {/* Knowledge Graph Modal */}
      {selectedConditionForGraph && (
        <ConditionGraphModal
          condition={selectedConditionForGraph}
          exercises={exercisesData.exercises || exercisesData}
          equipment={equipmentData.equipment || equipmentData}
          onClose={() => setSelectedConditionForGraph(null)}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Heart, Target, Dumbbell, FileText, Wrench, Users, Clock, X, ChevronRight, Activity, Calendar, Shield, Network } from 'lucide-react';
import conditionsData from '../../../final_data/entities/conditions.json';
import exercisesData from '../../../final_data/entities/exercises.json';
import equipmentData from '../../../final_data/entities/equipment.json';
import { theme } from '@/lib/theme';
import ConditionGraphModal from '@/components/ConditionGraphModal';

interface Condition {
  id: string;
  name: string;
  body_region?: string;
  specialty?: string;
  icd10?: string;
  snomed_ct?: string;
  typical_age_range?: string;
  gender_ratio?: string;
  chronicity?: string;
  prevalence_rank?: number;
  treatment_protocol?: any;
}

export default function ConditionsPage() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [filteredConditions, setFilteredConditions] = useState<Condition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bodyRegionFilter, setBodyRegionFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [selectedConditionForGraph, setSelectedConditionForGraph] = useState<Condition | null>(null);
  const [exercises, setExercises] = useState<any>({});
  const [equipment, setEquipment] = useState<any>({});
  
  const itemsPerPage = 20;

  useEffect(() => {
    loadConditions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [conditions, searchQuery, bodyRegionFilter, specialtyFilter, sortBy]);

  const loadConditions = async () => {
    try {
      setLoading(true);
      const conditionsMap = conditionsData.conditions || conditionsData;
      const conditionsList = Object.entries(conditionsMap).map(([id, condition]: [string, any]) => ({
        id,
        ...condition
      }));
      setConditions(conditionsList);
      
      // Load exercises data
      const exercisesMap = exercisesData.exercises || exercisesData;
      setExercises(exercisesMap);
      
      // Load equipment data
      const equipmentMap = equipmentData.equipment || equipmentData;
      setEquipment(equipmentMap);
    } catch (error) {
      console.error('Error loading conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...conditions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(condition =>
        condition.name.toLowerCase().includes(query) ||
        condition.id.toLowerCase().includes(query) ||
        (condition.icd10 && condition.icd10.toLowerCase().includes(query))
      );
    }

    // Apply body region filter
    if (bodyRegionFilter) {
      filtered = filtered.filter(condition => condition.body_region === bodyRegionFilter);
    }

    // Apply specialty filter
    if (specialtyFilter) {
      filtered = filtered.filter(condition => condition.specialty === specialtyFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'id':
          return a.id.localeCompare(b.id);
        case 'prevalence':
          return (a.prevalence_rank || 999) - (b.prevalence_rank || 999);
        default:
          return 0;
      }
    });

    setFilteredConditions(filtered);
    setCurrentPage(1);
  };

  const getExerciseCount = (condition: Condition) => {
    let count = 0;
    if (condition.treatment_protocol && condition.treatment_protocol.phases) {
      condition.treatment_protocol.phases.forEach((phase: any) => {
        if (phase.exercises) {
          count += phase.exercises.length;
        }
      });
    }
    return count;
  };

  const getEquipmentCount = (condition: Condition) => {
    const equipment = new Set();
    if (condition.treatment_protocol && condition.treatment_protocol.phases) {
      condition.treatment_protocol.phases.forEach((phase: any) => {
        if (phase.equipment_required) {
          phase.equipment_required.forEach((eq: string) => equipment.add(eq));
        }
      });
    }
    return equipment.size;
  };

  const formatText = (text: string) => {
    if (!text) return '';
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getExerciseName = (exerciseId: string) => {
    return exercises[exerciseId]?.name || exerciseId;
  };

  const getEquipmentName = (equipmentId: string) => {
    return equipment[equipmentId]?.name || equipmentId;
  };

  const getAllExercises = (condition: Condition) => {
    const exercisesList: Array<{id: string, name: string, phase: string}> = [];
    if (condition.treatment_protocol && condition.treatment_protocol.phases) {
      condition.treatment_protocol.phases.forEach((phase: any, phaseIndex: number) => {
        if (phase.exercises) {
          phase.exercises.forEach((ex: any) => {
            const exId = typeof ex === 'string' ? ex : ex.exercise_id;
            exercisesList.push({
              id: exId,
              name: getExerciseName(exId),
              phase: `Phase ${phaseIndex + 1}: ${phase.name || 'Treatment Phase'}`
            });
          });
        }
      });
    }
    return exercisesList;
  };

  const getAllEquipment = (condition: Condition) => {
    const equipmentSet = new Set<string>();
    if (condition.treatment_protocol && condition.treatment_protocol.phases) {
      condition.treatment_protocol.phases.forEach((phase: any) => {
        if (phase.equipment_required) {
          phase.equipment_required.forEach((eq: string) => equipmentSet.add(eq));
        }
      });
    }
    return Array.from(equipmentSet).map(eqId => ({
      id: eqId,
      name: getEquipmentName(eqId)
    }));
  };

  // Get unique values for filters
  const bodyRegions = [...new Set(conditions.map(c => c.body_region).filter(Boolean))].sort();
  const specialties = [...new Set(conditions.map(c => c.specialty).filter(Boolean))].sort();

  // Pagination
  const totalPages = Math.ceil(filteredConditions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedConditions = filteredConditions.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.primary[50] }}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderBottomColor: theme.colors.primary[600] }}></div>
            <p className="text-xl" style={{ color: theme.colors.primary[600] }}>Loading conditions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.primary[50] }}>

      <Navigation />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{ color: theme.colors.primary[900] }}>
            Medical Conditions
          </h1>
          <p className="text-xl" style={{ color: theme.colors.primary[600] }}>Browse {conditions.length} physiotherapy conditions with evidence-based treatment protocols</p>
        </div>

        {/* Controls */}
        <div className="bg-white shadow-sm rounded-2xl p-6 mb-8" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conditions..."
                className="w-full px-4 py-3 bg-white rounded-xl transition-all duration-300"
                style={{ 
                  borderColor: theme.colors.primary[100], 
                  borderWidth: '1px', 
                  borderStyle: 'solid',
                  color: theme.colors.primary[900]
                }}
              />
            </div>
            <select
              value={bodyRegionFilter}
              onChange={(e) => setBodyRegionFilter(e.target.value)}
              className="px-4 py-3 bg-white rounded transition-colors duration-200"
              style={{ 
                borderColor: theme.colors.primary[100], 
                borderWidth: '1px', 
                borderStyle: 'solid',
                color: theme.colors.primary[600]
              }}
            >
              <option value="">All Body Regions</option>
              {bodyRegions.map(region => (
                <option key={region} value={region}>{formatText(region || '')}</option>
              ))}
            </select>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="px-4 py-3 bg-white rounded transition-colors duration-200"
              style={{ 
                borderColor: theme.colors.primary[100], 
                borderWidth: '1px', 
                borderStyle: 'solid',
                color: theme.colors.primary[600]
              }}
            >
              <option value="">All Specialties</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{formatText(specialty || '')}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white rounded transition-colors duration-200"
              style={{ 
                borderColor: theme.colors.primary[100], 
                borderWidth: '1px', 
                borderStyle: 'solid',
                color: theme.colors.primary[600]
              }}
            >
              <option value="name">Sort by Name</option>
              <option value="id">Sort by ID</option>
              <option value="prevalence">Sort by Prevalence</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-sm rounded-xl p-6 text-center" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.primary[600] }}>{conditions.length}</div>
            <div style={{ color: theme.colors.primary[600] }}>Total Conditions</div>
          </div>
          <div className="bg-white shadow-sm rounded-xl p-6 text-center" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.primary[600] }}>{filteredConditions.length}</div>
            <div style={{ color: theme.colors.primary[600] }}>Showing</div>
          </div>
          <div className="bg-white shadow-sm rounded-xl p-6 text-center" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.primary[600] }}>{bodyRegions.length}</div>
            <div style={{ color: theme.colors.primary[600] }}>Body Regions</div>
          </div>
          <div className="bg-white shadow-sm rounded-xl p-6 text-center" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: theme.colors.primary[600] }}>{specialties.length}</div>
            <div style={{ color: theme.colors.primary[600] }}>Specialties</div>
          </div>
        </div>

        {/* Conditions Grid */}
        {paginatedConditions.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: theme.colors.primary[600] }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.primary[900] }}>No conditions found</h3>
            <p style={{ color: theme.colors.primary[600] }}>Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedConditions.map((condition) => {
                const exerciseCount = getExerciseCount(condition);
                const equipmentCount = getEquipmentCount(condition);

                return (
                  <div
                    key={condition.id}
                    className="bg-white shadow-sm hover:shadow-md rounded-lg p-6 transition-all duration-200"
                    style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-1" style={{ color: theme.colors.primary[900] }}>
                          {condition.name}
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded text-sm" style={{ backgroundColor: theme.colors.primary[100], color: theme.colors.primary[600] }}>
                        {formatText(condition.specialty || 'General')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div style={{ color: theme.colors.primary[600] }}>
                        <Target className="w-4 h-4 inline mr-1" style={{ color: theme.colors.primary[600] }} /> {formatText(condition.body_region || 'Not specified')}
                      </div>
                      <div style={{ color: theme.colors.primary[600] }}>
                        <FileText className="w-4 h-4 inline mr-1" style={{ color: theme.colors.primary[600] }} /> {condition.icd10 || 'N/A'}
                      </div>
                      <div style={{ color: theme.colors.primary[600] }}>
                        <Users className="w-4 h-4 inline mr-1" style={{ color: theme.colors.primary[600] }} /> {condition.typical_age_range || 'All ages'}
                      </div>
                      <div style={{ color: theme.colors.primary[600] }}>
                        <Clock className="w-4 h-4 inline mr-1" style={{ color: theme.colors.primary[600] }} /> {condition.chronicity || 'Variable'}
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-3" style={{ borderColor: theme.colors.primary[100] }}>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-1 text-sm">
                            <Dumbbell className="w-4 h-4 inline" style={{ color: theme.colors.primary[600] }} />
                            <span style={{ color: theme.colors.primary[600] }}>{exerciseCount} exercises</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm">
                            <Wrench className="w-4 h-4 inline" style={{ color: theme.colors.primary[600] }} />
                            <span style={{ color: theme.colors.primary[600] }}>{equipmentCount} equipment</span>
                          </div>
                        </div>
                        <div className="text-sm" style={{ color: theme.colors.primary[600] }}>
                          #{condition.prevalence_rank || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCondition(condition);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md"
                          style={{ 
                            backgroundColor: theme.colors.primary[600],
                            borderColor: theme.colors.primary[600],
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: 'white'
                          }}
                        >
                          <FileText className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConditionForGraph(condition);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md"
                          style={{ 
                            backgroundColor: theme.colors.secondary[50],
                            borderColor: theme.colors.secondary[200],
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: theme.colors.secondary[700]
                          }}
                        >
                          <Network className="w-4 h-4" />
                          Knowledge Graph
                        </button>
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
                    className="px-4 py-2 bg-white rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer"
                    style={{ 
                      borderColor: theme.colors.primary[100], 
                      borderWidth: '1px', 
                      borderStyle: 'solid',
                      color: theme.colors.primary[600]
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
                        className="px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer"
                        style={{
                          backgroundColor: page === currentPage ? theme.colors.primary[600] : 'white',
                          color: page === currentPage ? 'white' : theme.colors.primary[600],
                          borderColor: page === currentPage ? theme.colors.primary[600] : theme.colors.primary[100],
                          borderWidth: '1px',
                          borderStyle: 'solid'
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
                    className="px-4 py-2 bg-white rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer"
                    style={{ 
                      borderColor: theme.colors.primary[100], 
                      borderWidth: '1px', 
                      borderStyle: 'solid',
                      color: theme.colors.primary[600]
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

      {/* Condition Details Modal */}
      {selectedCondition && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4">
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setSelectedCondition(null)}
            ></div>
            
            <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-lg" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b bg-white" style={{ borderColor: theme.colors.primary[100] }}>
                <div className="flex items-center space-x-3">
                  <Heart className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
                  <div>
                    <h2 className="text-xl font-medium" style={{ color: theme.colors.primary[900] }}>{selectedCondition.name}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCondition(null)}
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
                    <p style={{ color: theme.colors.primary[600] }}>{formatText(selectedCondition.body_region || 'Not specified')}</p>
                  </div>
                  
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                      <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>Specialty</span>
                    </div>
                    <p style={{ color: theme.colors.primary[600] }}>{formatText(selectedCondition.specialty || 'General')}</p>
                  </div>
                  
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                      <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>ICD-10</span>
                    </div>
                    <p className="font-mono" style={{ color: theme.colors.primary[600] }}>{selectedCondition.icd10 || 'Not specified'}</p>
                  </div>
                  
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                      <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>Age Range</span>
                    </div>
                    <p style={{ color: theme.colors.primary[600] }}>{selectedCondition.typical_age_range || 'All ages'}</p>
                  </div>
                  
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                      <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>Chronicity</span>
                    </div>
                    <p style={{ color: theme.colors.primary[600] }}>{selectedCondition.chronicity || 'Variable'}</p>
                  </div>
                  
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                      <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>Prevalence Rank</span>
                    </div>
                    <p style={{ color: theme.colors.primary[600] }}>#{selectedCondition.prevalence_rank || 'Not ranked'}</p>
                  </div>
                </div>

                {/* Treatment Protocol */}
                {selectedCondition.treatment_protocol && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2" style={{ color: theme.colors.primary[900] }}>
                      <Calendar className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
                      <span>Treatment Protocol</span>
                    </h3>
                    
                    {/* Protocol Overview */}
                    {selectedCondition.treatment_protocol.total_duration_weeks && (
                      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: theme.colors.primary[50], borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                          <span className="font-semibold" style={{ color: theme.colors.primary[900] }}>Total Treatment Duration</span>
                        </div>
                        <p style={{ color: theme.colors.primary[600] }}>{selectedCondition.treatment_protocol.total_duration_weeks} weeks</p>
                      </div>
                    )}
                    
                    {selectedCondition.treatment_protocol.phases && selectedCondition.treatment_protocol.phases.map((phase: any, index: number) => (
                      <div key={index} className="rounded-xl p-6 mb-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                        <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{ color: theme.colors.primary[600] }}>
                          <ChevronRight className="w-5 h-5" />
                          <span>Phase {phase.phase_number || index + 1}: {phase.phase_name || phase.name || 'Treatment Phase'}</span>
                        </h4>
                        
                        {/* Phase Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          {phase.duration_weeks && (
                            <div className="bg-white rounded-lg p-3" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
                              <span className="font-medium text-sm" style={{ color: theme.colors.primary[600] }}>Duration:</span>
                              <p style={{ color: theme.colors.primary[900] }}>{phase.duration_weeks} weeks</p>
                            </div>
                          )}
                          {phase.duration && (
                            <div className="bg-white rounded-lg p-3" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
                              <span className="font-medium text-sm" style={{ color: theme.colors.primary[600] }}>Duration:</span>
                              <p style={{ color: theme.colors.primary[900] }}>{phase.duration}</p>
                            </div>
                          )}
                          {phase.frequency && (
                            <div className="bg-white rounded-lg p-3" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
                              <span className="font-medium text-sm" style={{ color: theme.colors.primary[600] }}>Frequency:</span>
                              <p style={{ color: theme.colors.primary[900] }}>{phase.frequency}</p>
                            </div>
                          )}
                          {phase.intensity && (
                            <div className="bg-white rounded-lg p-3" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
                              <span className="font-medium text-sm" style={{ color: theme.colors.primary[600] }}>Intensity:</span>
                              <p style={{ color: theme.colors.primary[900] }}>{phase.intensity}</p>
                            </div>
                          )}
                        </div>
                        
                        {phase.description && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-2" style={{ color: theme.colors.primary[600] }}>Description:</h5>
                            <p className="leading-relaxed" style={{ color: theme.colors.primary[900] }}>{phase.description}</p>
                          </div>
                        )}
                        
                        {/* Goals */}
                        {phase.goals && phase.goals.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-2 flex items-center space-x-2" style={{ color: theme.colors.primary[600] }}>
                              <Target className="w-4 h-4" />
                              <span>Goals:</span>
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {phase.goals.map((goal: string, goalIndex: number) => (
                                <span key={goalIndex} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: theme.colors.success[50], borderColor: theme.colors.success[100], borderWidth: '1px', borderStyle: 'solid', color: theme.colors.success[600] }}>
                                  {formatText(goal)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Precautions */}
                        {phase.precautions && phase.precautions.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-2 flex items-center space-x-2" style={{ color: theme.colors.primary[600] }}>
                              <Shield className="w-4 h-4" />
                              <span>Precautions:</span>
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {phase.precautions.map((precaution: string, precautionIndex: number) => (
                                <span key={precautionIndex} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: theme.colors.error[50], borderColor: theme.colors.error[100], borderWidth: '1px', borderStyle: 'solid', color: theme.colors.error[600] }}>
                                  {formatText(precaution)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Criteria */}
                        {phase.criteria && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-2" style={{ color: theme.colors.primary[600] }}>Advancement Criteria:</h5>
                            <p style={{ color: theme.colors.primary[900] }}>{phase.criteria}</p>
                          </div>
                        )}
                        
                        {/* Phase Exercises */}
                        {phase.exercises && phase.exercises.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-3 flex items-center space-x-2" style={{ color: theme.colors.primary[600] }}>
                              <Dumbbell className="w-4 h-4" />
                              <span>Phase Exercises ({phase.exercises.length}):</span>
                            </h5>
                            <div className="grid grid-cols-1 gap-2">
                              {phase.exercises.map((exercise: any, exerciseIndex: number) => {
                                const exId = typeof exercise === 'string' ? exercise : exercise.exercise_id;
                                const exName = getExerciseName(exId);
                                return (
                                  <div key={exerciseIndex} className="bg-white rounded-lg p-3 flex items-center justify-between" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
                                    <div className="flex-1">
                                      <h6 className="font-medium text-sm" style={{ color: theme.colors.primary[900] }}>{exName}</h6>
                                      {typeof exercise === 'object' && (
                                        <div className="flex space-x-4 mt-1 text-xs" style={{ color: theme.colors.primary[600] }}>
                                          {exercise.sets && <span>Sets: {exercise.sets}</span>}
                                          {exercise.reps && <span>Reps: {exercise.reps}</span>}
                                          {exercise.duration && <span>Duration: {exercise.duration}</span>}
                                          {exercise.hold_time && <span>Hold: {exercise.hold_time}</span>}
                                        </div>
                                      )}
                                    </div>
                                    <Dumbbell className="w-4 h-4" style={{ color: theme.colors.primary[600] }} />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Phase Equipment */}
                        {phase.equipment_required && phase.equipment_required.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-3 flex items-center space-x-2" style={{ color: theme.colors.primary[600] }}>
                              <Wrench className="w-4 h-4" />
                              <span>Phase Equipment ({phase.equipment_required.length}):</span>
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {phase.equipment_required.map((equipmentId: string, equipmentIndex: number) => (
                                <span key={equipmentIndex} className="px-3 py-2 rounded-full text-sm flex items-center space-x-2" style={{ backgroundColor: theme.colors.success[50], borderColor: theme.colors.success[100], borderWidth: '1px', borderStyle: 'solid', color: theme.colors.success[600] }}>
                                  <Wrench className="w-3 h-3" />
                                  <span>{getEquipmentName(equipmentId)}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Exercises Section */}
                {(() => {
                  const allExercises = getAllExercises(selectedCondition);
                  return allExercises.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2" style={{ color: theme.colors.primary[900] }}>
                        <Dumbbell className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
                        <span>Exercises ({allExercises.length})</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {allExercises.map((exercise, index) => (
                          <div key={`${exercise.id}-${index}`} className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-all duration-200" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1" style={{ color: theme.colors.primary[900] }}>{exercise.name}</h4>
                              <p className="text-sm" style={{ color: theme.colors.primary[600] }}>{exercise.phase}</p>
                            </div>
                            <Dumbbell className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Equipment Section */}
                {(() => {
                  const allEquipment = getAllEquipment(selectedCondition);
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

                {/* Additional Information */}
                {(selectedCondition.snomed_ct || selectedCondition.gender_ratio) && (
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.colors.primary[50] }}>
                    <h4 className="text-lg font-semibold mb-3" style={{ color: theme.colors.primary[900] }}>Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {selectedCondition.snomed_ct && (
                        <div>
                          <span className="font-medium" style={{ color: theme.colors.primary[600] }}>SNOMED CT:</span>
                          <span className="ml-2 font-mono" style={{ color: theme.colors.primary[900] }}>{selectedCondition.snomed_ct}</span>
                        </div>
                      )}
                      {selectedCondition.gender_ratio && (
                        <div>
                          <span className="font-medium" style={{ color: theme.colors.primary[600] }}>Gender Ratio:</span>
                          <span className="ml-2" style={{ color: theme.colors.primary[900] }}>{selectedCondition.gender_ratio}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Knowledge Graph Modal */}
      {selectedConditionForGraph && (
        <ConditionGraphModal
          condition={selectedConditionForGraph}
          exercises={exercises}
          equipment={equipment}
          onClose={() => setSelectedConditionForGraph(null)}
        />
      )}
    </div>
  );
}
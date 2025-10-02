'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { 
  Database, Activity, Users, TrendingUp, Clock, Shield, 
  AlertCircle, CheckCircle, Zap, BarChart3, PieChart, 
  Target, Settings, RefreshCw, Calendar, Layers, Monitor,
  ArrowRight, AlertTriangle
} from 'lucide-react';
import { theme } from '@/lib/theme';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart
} from 'recharts';
import conditionsData from '../../../final_data/entities/conditions.json';
import exercisesData from '../../../final_data/entities/exercises.json';
import equipmentData from '../../../final_data/entities/equipment.json';
import conditionExercisesData from '../../../final_data/relationships/condition-exercises.json';
import exerciseEquipmentData from '../../../final_data/relationships/exercise-equipment.json';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export default function DashboardPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const dashboardData = useMemo(() => {
    const conditions = conditionsData.conditions;
    const exercises = exercisesData.exercises;
    const equipment = equipmentData.equipment;
    const conditionExercises = conditionExercisesData.condition_exercise_mappings || {};
    const exerciseEquipment = exerciseEquipmentData.exercise_equipment_relationships || {};

    // Core metrics
    const totalConditions = Object.keys(conditions).length;
    const totalExercises = Object.keys(exercises).length;
    const totalEquipment = Object.keys(equipment).length;
    const totalRelationships = Object.keys(conditionExercises).length + Object.keys(exerciseEquipment).length;

    // Specialty analysis
    const specialtyStats: Record<string, number> = {};
    Object.values(conditions).forEach((condition: any) => {
      const specialty = condition.specialty;
      if (specialty) {
        specialtyStats[specialty] = (specialtyStats[specialty] || 0) + 1;
      }
    });

    const topSpecialties = Object.entries(specialtyStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 6)
      .map(([name, count]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: count as number,
        percentage: ((count as number / totalConditions) * 100).toFixed(1)
      }));

    // Body region distribution
    const bodyRegionStats: Record<string, number> = {};
    Object.values(conditions).forEach((condition: any) => {
      const region = condition.body_region;
      if (region) {
        bodyRegionStats[region] = (bodyRegionStats[region] || 0) + 1;
      }
    });

    const topBodyRegions = Object.entries(bodyRegionStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([name, count]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: count as number
      }));

    // Exercise type analysis
    const exerciseTypeStats: Record<string, number> = {};
    Object.values(exercises).forEach((exercise: any) => {
      if (exercise.types && Array.isArray(exercise.types)) {
        exercise.types.forEach((type: string) => {
          exerciseTypeStats[type] = (exerciseTypeStats[type] || 0) + 1;
        });
      }
    });

    const topExerciseTypes = Object.entries(exerciseTypeStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 6)
      .map(([name, count]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: count as number
      }));

    // Equipment cost analysis
    const costStats: Record<string, number> = {};
    Object.values(equipment).forEach((item: any) => {
      const cost = item.cost_range || 'Unknown';
      costStats[cost] = (costStats[cost] || 0) + 1;
    });

    const costDistribution = Object.entries(costStats)
      .map(([range, count]) => ({
        range: range === 'Unknown' ? 'Not Specified' : range,
        count: count as number
      }))
      .sort((a, b) => b.count - a.count);

    // Data quality metrics
    const conditionsWithProtocols = Object.values(conditions)
      .filter((condition: any) => condition.treatment_protocol).length;
    
    const exercisesWithTypes = Object.values(exercises)
      .filter((exercise: any) => exercise.types && exercise.types.length > 0).length;
    
    const equipmentWithCosts = Object.values(equipment)
      .filter((item: any) => item.cost_range && item.cost_range !== 'Unknown').length;

    const dataQualityMetrics = [
      {
        metric: 'Conditions with Protocols',
        value: conditionsWithProtocols,
        total: totalConditions,
        percentage: Math.round((conditionsWithProtocols / totalConditions) * 100)
      },
      {
        metric: 'Exercises with Types',
        value: exercisesWithTypes,
        total: totalExercises,
        percentage: Math.round((exercisesWithTypes / totalExercises) * 100)
      },
      {
        metric: 'Equipment with Costs',
        value: equipmentWithCosts,
        total: totalEquipment,
        percentage: Math.round((equipmentWithCosts / totalEquipment) * 100)
      }
    ];

    // Chronicity analysis
    const chronicityStats: Record<string, number> = {};
    Object.values(conditions).forEach((condition: any) => {
      const chronicity = condition.chronicity || 'Not Specified';
      chronicityStats[chronicity] = (chronicityStats[chronicity] || 0) + 1;
    });

    const chronicityData = Object.entries(chronicityStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([name, count]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        count: count as number
      }));

    return {
      coreMetrics: {
        totalConditions,
        totalExercises,
        totalEquipment,
        totalRelationships
      },
      topSpecialties,
      topBodyRegions,
      topExerciseTypes,
      costDistribution,
      dataQualityMetrics,
      chronicityData,
      systemHealth: {
        totalEntities: totalConditions + totalExercises + totalEquipment,
        avgExercisesPerCondition: totalConditions > 0 ? Math.round(totalRelationships / totalConditions) : 0,
        dataCompleteness: Math.round(((conditionsWithProtocols + exercisesWithTypes + equipmentWithCosts) / 
                           (totalConditions + totalExercises + totalEquipment)) * 100),
        relationshipDensity: Math.round((totalRelationships / (totalConditions + totalExercises)) * 100) / 100
      }
    };
  }, []);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // In a real app, this would trigger data refresh
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.primary[50] }}>
      <Navigation />
      
      <main className="pt-16">
        {/* Dashboard Header */}
        <div className="bg-white shadow-sm" style={{ borderBottomColor: theme.colors.primary[100] }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <img 
                    src="/healui-logo.png" 
                    alt="healui" 
                    className="h-10 w-auto"
                  />
                  <div>
                    <h1 className="text-3xl font-bold" style={{ color: theme.colors.primary[900] }}>
                      Database Dashboard
                    </h1>
                    <p className="mt-1" style={{ color: theme.colors.primary[600] }}>
                      Real-time insights from physiotherapy ontology database
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div 
                  className="flex items-center space-x-2 text-sm px-3 py-2 rounded-lg"
                  style={{ 
                    color: theme.colors.primary[600], 
                    backgroundColor: theme.colors.primary[50],
                    border: `1px solid ${theme.colors.primary[100]}`
                  }}
                >
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
                </div>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
                  style={{ 
                    color: theme.colors.primary[700],
                    borderColor: theme.colors.primary[100],
                    '--tw-ring-color': theme.colors.primary[600]
                  } as React.CSSProperties}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg">
                  <Database className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Medical Conditions
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {dashboardData.coreMetrics.totalConditions.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-50 rounded-lg">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Therapeutic Exercises
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {dashboardData.coreMetrics.totalExercises.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-amber-50 rounded-lg">
                  <Settings className="h-8 w-8 text-amber-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Equipment Items
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {dashboardData.coreMetrics.totalEquipment.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-purple-50 rounded-lg">
                  <Layers className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Relationships
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {dashboardData.coreMetrics.totalRelationships.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-600" />
                Database Overview & Statistics
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-600 font-medium">Live Data</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dashboardData.systemHealth.totalEntities.toLocaleString()}</div>
                <div className="text-sm text-gray-600 mt-1">Total Entities</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dashboardData.systemHealth.avgExercisesPerCondition}</div>
                <div className="text-sm text-gray-600 mt-1">Avg Relations/Condition</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dashboardData.systemHealth.dataCompleteness}%</div>
                <div className="text-sm text-gray-600 mt-1">Data Completeness</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{dashboardData.systemHealth.relationshipDensity}</div>
                <div className="text-sm text-gray-600 mt-1">Relationship Density</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Specialty Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                Top Medical Specialties
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={dashboardData.topSpecialties}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percentage}) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {dashboardData.topSpecialties.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, 'Count']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Body Region Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Conditions by Body Region
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.topBodyRegions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6B7280" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#111827'
                      }}
                    />
                    <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Exercise Types */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-amber-600" />
                Exercise Type Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.topExerciseTypes} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#6B7280" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#6B7280" 
                      width={120}
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#111827'
                      }}
                    />
                    <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chronicity Patterns */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-600" />
                Condition Chronicity Patterns
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.chronicityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6B7280" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#111827'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Analytics Access */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl shadow-sm border border-blue-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-blue-700" />
                  Data Quality Issues Detected
                </h3>
                <p className="text-blue-700 mb-4">
                  Our analysis has identified data quality issues that may affect your database integrity and completeness.
                </p>
                <Link
                  href="/analytics"
                  className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg"
                  style={{ 
                    backgroundColor: theme.colors.primary[600], 
                    color: 'white'
                  }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Analytics
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
              <div className="hidden md:block ml-8">
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700">85%</div>
                  <div className="text-sm text-blue-600">Overall Quality Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Quality Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                Data Quality & Completeness
              </h3>
              <Link
                href="/analytics"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-6">
              {dashboardData.dataQualityMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
                      <div className="text-sm text-gray-500 font-mono">
                        {metric.value.toLocaleString()} / {metric.total.toLocaleString()} ({metric.percentage}%)
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          metric.percentage >= 90 ? 'bg-green-500' : 
                          metric.percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{width: `${metric.percentage}%`}}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-6">
                    {metric.percentage >= 90 ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : metric.percentage >= 70 ? (
                      <AlertCircle className="w-8 h-8 text-yellow-500" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
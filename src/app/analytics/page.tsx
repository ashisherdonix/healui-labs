'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { analyzeDataQuality, generateDataEnhancementReport } from '@/lib/dataAnalysis';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Database, 
  FileText, 
  Dumbbell, 
  Wrench,
  Target,
  Activity,
  BarChart3,
  PieChart,
  AlertCircle,
  Download,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import conditionsData from '../../../final_data/entities/conditions.json';
import exercisesData from '../../../final_data/entities/exercises.json';
import equipmentData from '../../../final_data/entities/equipment.json';
import { theme } from '@/lib/theme';

interface AnalysisResult {
  conditionsWithoutProtocols: number;
  conditionsWithoutExercises: number;
  conditionsWithBrokenExerciseLinks: Array<{conditionId: string, conditionName: string, brokenExercises: string[]}>;
  conditionsWithBrokenEquipmentLinks: Array<{conditionId: string, conditionName: string, brokenEquipment: string[]}>;
  conditionsWithIncompletePhases: Array<{conditionId: string, conditionName: string, issues: string[]}>;
  unlinkedExercises: Array<{exerciseId: string, exerciseName: string}>;
  exercisesWithoutEquipment: number;
  exercisesWithBrokenEquipmentLinks: Array<{exerciseId: string, exerciseName: string, brokenEquipment: string[]}>;
  exercisesWithIncompleteData: Array<{exerciseId: string, exerciseName: string, missingFields: string[]}>;
  unlinkedEquipment: Array<{equipmentId: string, equipmentName: string}>;
  equipmentWithoutDescription: number;
  equipmentWithIncompleteData: Array<{equipmentId: string, equipmentName: string, missingFields: string[]}>;
  orphanedExerciseReferences: Array<{conditionId: string, orphanedExercise: string}>;
  orphanedEquipmentReferences: Array<{source: string, sourceId: string, orphanedEquipment: string}>;
  overallDataQualityScore: number;
  conditionsQualityScore: number;
  exercisesQualityScore: number;
  equipmentQualityScore: number;
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
    affectedItems: number;
  }>;
}

export default function AnalyticsPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = analyzeDataQuality(conditionsData, exercisesData, equipmentData);
      setAnalysis(result);
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const downloadReport = () => {
    if (!analysis) return;
    const report = generateDataEnhancementReport(analysis);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-quality-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.colors.success[600];
    if (score >= 60) return theme.colors.warning[600];
    return theme.colors.error[600];
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-6 h-6" style={{ color: theme.colors.success[600] }} />;
    if (score >= 60) return <AlertTriangle className="w-6 h-6" style={{ color: theme.colors.warning[600] }} />;
    return <XCircle className="w-6 h-6" style={{ color: theme.colors.error[600] }} />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.error[600];
      case 'medium': return theme.colors.warning[600];
      case 'low': return theme.colors.info[600];
      default: return theme.colors.gray[600];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.primary[50] }}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderBottomColor: theme.colors.primary[600] }}></div>
            <p className="text-xl" style={{ color: theme.colors.primary[600] }}>Analyzing data quality...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.primary[50] }}>
        <Navigation />
        <div className="text-center py-16">
          <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.error[600] }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.primary[900] }}>Analysis Failed</h3>
          <p style={{ color: theme.colors.primary[600] }}>Unable to analyze data quality</p>
          <button
            onClick={runAnalysis}
            className="mt-4 px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
            style={{ backgroundColor: theme.colors.primary[600], color: 'white' }}
          >
            <RefreshCw className="w-4 h-4" />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.primary[50] }}>
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold" style={{ color: theme.colors.primary[900] }}>
              Data Quality Analytics
            </h1>
            <p className="text-lg mt-2" style={{ color: theme.colors.primary[600] }}>
              Comprehensive analysis to enhance your data quality
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={runAnalysis}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
              style={{ backgroundColor: theme.colors.primary[600], color: 'white' }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Analysis
            </button>
            <button
              onClick={downloadReport}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
              style={{ backgroundColor: theme.colors.secondary[600], color: 'white' }}
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </div>

        {/* Overall Quality Score */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-xl p-6 text-center" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
              <div className="flex justify-center mb-4">
                {getScoreIcon(analysis.overallDataQualityScore)}
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: getScoreColor(analysis.overallDataQualityScore) }}>
                {analysis.overallDataQualityScore}%
              </div>
              <div style={{ color: theme.colors.primary[600] }}>Overall Quality Score</div>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white shadow-sm rounded-xl p-4 text-center" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
              <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: theme.colors.primary[600] }} />
              <div className="text-2xl font-bold mb-1" style={{ color: getScoreColor(analysis.conditionsQualityScore) }}>
                {analysis.conditionsQualityScore}%
              </div>
              <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Conditions Quality</div>
            </div>

            <div className="bg-white shadow-sm rounded-xl p-4 text-center" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
              <Dumbbell className="w-8 h-8 mx-auto mb-2" style={{ color: theme.colors.primary[600] }} />
              <div className="text-2xl font-bold mb-1" style={{ color: getScoreColor(analysis.exercisesQualityScore) }}>
                {analysis.exercisesQualityScore}%
              </div>
              <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Exercises Quality</div>
            </div>

            <div className="bg-white shadow-sm rounded-xl p-4 text-center" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
              <Wrench className="w-8 h-8 mx-auto mb-2" style={{ color: theme.colors.primary[600] }} />
              <div className="text-2xl font-bold mb-1" style={{ color: getScoreColor(analysis.equipmentQualityScore) }}>
                {analysis.equipmentQualityScore}%
              </div>
              <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Equipment Quality</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white shadow-sm rounded-lg p-4 text-center" style={{ borderColor: theme.colors.error[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: theme.colors.error[600] }}>
              {analysis.conditionsWithoutProtocols}
            </div>
            <div className="text-xs" style={{ color: theme.colors.primary[600] }}>No Protocols</div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4 text-center" style={{ borderColor: theme.colors.error[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: theme.colors.error[600] }}>
              {analysis.conditionsWithBrokenExerciseLinks.length}
            </div>
            <div className="text-xs" style={{ color: theme.colors.primary[600] }}>Broken Exercise Links</div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4 text-center" style={{ borderColor: theme.colors.warning[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: theme.colors.warning[600] }}>
              {analysis.unlinkedExercises.length}
            </div>
            <div className="text-xs" style={{ color: theme.colors.primary[600] }}>Unlinked Exercises</div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4 text-center" style={{ borderColor: theme.colors.warning[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: theme.colors.warning[600] }}>
              {analysis.unlinkedEquipment.length}
            </div>
            <div className="text-xs" style={{ color: theme.colors.primary[600] }}>Unlinked Equipment</div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4 text-center" style={{ borderColor: theme.colors.info[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: theme.colors.info[600] }}>
              {analysis.exercisesWithoutEquipment}
            </div>
            <div className="text-xs" style={{ color: theme.colors.primary[600] }}>Exercises No Equipment</div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-4 text-center" style={{ borderColor: theme.colors.info[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: theme.colors.info[600] }}>
              {analysis.equipmentWithoutDescription}
            </div>
            <div className="text-xs" style={{ color: theme.colors.primary[600] }}>Equipment No Description</div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.primary[900] }}>
            Priority Recommendations
          </h2>
          <div className="space-y-4">
            {analysis.recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-white shadow-sm rounded-lg p-6 transition-all duration-200"
                style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium uppercase"
                        style={{ backgroundColor: `${getPriorityColor(rec.priority)}20`, color: getPriorityColor(rec.priority) }}
                      >
                        {rec.priority}
                      </span>
                      <span className="text-sm font-medium" style={{ color: theme.colors.primary[600] }}>
                        {rec.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.primary[900] }}>
                      {rec.issue}
                    </h3>
                    <p style={{ color: theme.colors.primary[600] }}>{rec.suggestion}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold" style={{ color: getPriorityColor(rec.priority) }}>
                      {rec.affectedItems}
                    </div>
                    <div className="text-xs" style={{ color: theme.colors.primary[600] }}>items affected</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Analysis Sections */}
        <div className="space-y-6">
          {/* Conditions Analysis */}
          <div className="bg-white shadow-sm rounded-xl" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div
              className="p-6 cursor-pointer border-b"
              style={{ borderColor: theme.colors.primary[100] }}
              onClick={() => toggleSection('conditions')}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-3" style={{ color: theme.colors.primary[900] }}>
                  <FileText className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
                  Conditions Analysis
                </h3>
                {expandedSections.has('conditions') ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
            </div>
            
            {expandedSections.has('conditions') && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Conditions without protocols */}
                  {analysis.conditionsWithoutProtocols > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.error[50] }}>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.error[700] }}>
                        Without Protocols: {analysis.conditionsWithoutProtocols}
                      </h4>
                      <p className="text-sm" style={{ color: theme.colors.error[600] }}>
                        These conditions need complete treatment protocols
                      </p>
                    </div>
                  )}

                  {/* Broken exercise links */}
                  {analysis.conditionsWithBrokenExerciseLinks.length > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.error[50] }}>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.error[700] }}>
                        Broken Exercise Links: {analysis.conditionsWithBrokenExerciseLinks.length}
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        {analysis.conditionsWithBrokenExerciseLinks.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="text-xs mb-1" style={{ color: theme.colors.error[600] }}>
                            {item.conditionName}: {item.brokenExercises.length} broken links
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Incomplete phases */}
                  {analysis.conditionsWithIncompletePhases.length > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.warning[50] }}>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning[700] }}>
                        Incomplete Phases: {analysis.conditionsWithIncompletePhases.length}
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        {analysis.conditionsWithIncompletePhases.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="text-xs mb-1" style={{ color: theme.colors.warning[600] }}>
                            {item.conditionName}: {item.issues.length} issues
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Exercises Analysis */}
          <div className="bg-white shadow-sm rounded-xl" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div
              className="p-6 cursor-pointer border-b"
              style={{ borderColor: theme.colors.primary[100] }}
              onClick={() => toggleSection('exercises')}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-3" style={{ color: theme.colors.primary[900] }}>
                  <Dumbbell className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
                  Exercises Analysis
                </h3>
                {expandedSections.has('exercises') ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
            </div>
            
            {expandedSections.has('exercises') && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Unlinked exercises */}
                  {analysis.unlinkedExercises.length > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.warning[50] }}>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning[700] }}>
                        Unlinked: {analysis.unlinkedExercises.length}
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        {analysis.unlinkedExercises.slice(0, 10).map((item, idx) => (
                          <div key={idx} className="text-xs mb-1" style={{ color: theme.colors.warning[600] }}>
                            {item.exerciseName}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exercises with incomplete data */}
                  {analysis.exercisesWithIncompleteData.length > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.info[50] }}>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.info[700] }}>
                        Incomplete Data: {analysis.exercisesWithIncompleteData.length}
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        {analysis.exercisesWithIncompleteData.slice(0, 10).map((item, idx) => (
                          <div key={idx} className="text-xs mb-1" style={{ color: theme.colors.info[600] }}>
                            {item.exerciseName}: {item.missingFields.join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Without equipment */}
                  {analysis.exercisesWithoutEquipment > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.info[50] }}>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.info[700] }}>
                        No Equipment: {analysis.exercisesWithoutEquipment}
                      </h4>
                      <p className="text-sm" style={{ color: theme.colors.info[600] }}>
                        Exercises without equipment requirements
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Equipment Analysis */}
          <div className="bg-white shadow-sm rounded-xl" style={{ borderColor: theme.colors.primary[100], borderWidth: '1px', borderStyle: 'solid' }}>
            <div
              className="p-6 cursor-pointer border-b"
              style={{ borderColor: theme.colors.primary[100] }}
              onClick={() => toggleSection('equipment')}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-3" style={{ color: theme.colors.primary[900] }}>
                  <Wrench className="w-6 h-6" style={{ color: theme.colors.primary[600] }} />
                  Equipment Analysis
                </h3>
                {expandedSections.has('equipment') ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
            </div>
            
            {expandedSections.has('equipment') && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Unlinked equipment */}
                  {analysis.unlinkedEquipment.length > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.warning[50] }}>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.warning[700] }}>
                        Unlinked: {analysis.unlinkedEquipment.length}
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        {analysis.unlinkedEquipment.slice(0, 10).map((item, idx) => (
                          <div key={idx} className="text-xs mb-1" style={{ color: theme.colors.warning[600] }}>
                            {item.equipmentName}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Without description */}
                  {analysis.equipmentWithoutDescription > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.info[50] }}>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.info[700] }}>
                        No Description: {analysis.equipmentWithoutDescription}
                      </h4>
                      <p className="text-sm" style={{ color: theme.colors.info[600] }}>
                        Equipment items missing descriptions
                      </p>
                    </div>
                  )}

                  {/* Incomplete data */}
                  {analysis.equipmentWithIncompleteData.length > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: theme.colors.info[50] }}>
                      <h4 className="font-semibold mb-2" style={{ color: theme.colors.info[700] }}>
                        Incomplete: {analysis.equipmentWithIncompleteData.length}
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        {analysis.equipmentWithIncompleteData.slice(0, 10).map((item, idx) => (
                          <div key={idx} className="text-xs mb-1" style={{ color: theme.colors.info[600] }}>
                            {item.equipmentName}: {item.missingFields.join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
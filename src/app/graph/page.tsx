'use client';

import { useEffect, useState } from 'react';
import D3ForceGraph from '@/components/D3ForceGraph';
import useGraphStore from '@/store/graphStore';
import { OntologyDataParser } from '@/lib/dataParser';
import Navigation from '@/components/Navigation';
import { theme } from '@/lib/theme';
import conditionsData from '../../../final_data/entities/conditions.json';
import exercisesData from '../../../final_data/entities/exercises.json';
import equipmentData from '../../../final_data/entities/equipment.json';
import metricsData from '../../../final_data/entities/metrics.json';
import conditionExercisesData from '../../../final_data/relationships/condition-exercises.json';
import conditionMetricsData from '../../../final_data/relationships/condition-metrics.json';
import exerciseEquipmentData from '../../../final_data/relationships/exercise-equipment.json';

export default function GraphPage() {
  const { setGraphData, data, isLoading, setLoading } = useGraphStore();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const parser = new OntologyDataParser();
        const graphData = parser.parseFromStaticDataComplete(
          conditionsData,
          exercisesData,
          equipmentData,
          metricsData,
          conditionExercisesData,
          conditionMetricsData,
          exerciseEquipmentData
        );
        
        setGraphData(graphData);
        console.log('Loaded graph data:', graphData);
      } catch (error) {
        console.error('Error loading graph data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setGraphData, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: isDarkMode ? '#0d1117' : theme.colors.primary[50] }}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4" 
              style={{ borderColor: isDarkMode ? '#30363d' : theme.colors.primary[100] }}></div>
            <p className="text-xl" style={{ color: isDarkMode ? '#8b949e' : theme.colors.primary[600] }}>
              Loading ontology graph...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: isDarkMode ? '#0d1117' : '#ffffff' }}>
      <Navigation />
      
      {/* Graph Content - Full page except navigation */}
      <div style={{ height: 'calc(100vh - 4rem)' }}>
        <D3ForceGraph isDarkMode={isDarkMode} setDarkMode={setIsDarkMode} data={data} />
      </div>
    </div>
  );
}
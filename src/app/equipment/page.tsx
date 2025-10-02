'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Wrench, X, DollarSign, Package, Ruler, Info, FileText } from 'lucide-react';
import equipmentData from '../../../final_data/entities/equipment.json';
import { theme } from '@/lib/theme';

interface Equipment {
  id: string;
  name: string;
  category?: string;
  type?: string;
  cost_range?: string;
  portability?: string;
  description?: string;
  specifications?: any;
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  const itemsPerPage = 20;

  useEffect(() => {
    loadEquipment();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [equipment, searchQuery, categoryFilter, typeFilter]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const equipmentMap = equipmentData.equipment || equipmentData;
      const equipmentList = Object.entries(equipmentMap).map(([id, item]: [string, any]) => ({
        id,
        ...item
      }));
      setEquipment(equipmentList);
    } catch (error) {
      console.error('Error loading equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...equipment];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Sort alphabetically
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredEquipment(filtered);
    setCurrentPage(1);
  };

  const formatText = (text: string) => {
    if (!text) return '';
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCostColor = (cost: string) => {
    if (!cost) return theme.colors.gray[400];
    const lowerCost = cost.toLowerCase();
    if (lowerCost.includes('low') || lowerCost.includes('$')) return theme.colors.success[600];
    if (lowerCost.includes('medium') || lowerCost.includes('$$')) return theme.colors.warning[600];
    if (lowerCost.includes('high') || lowerCost.includes('$$$')) return theme.colors.error[600];
    return theme.colors.gray[400];
  };

  // Get unique values for filters
  const categories = [...new Set(equipment.map(e => e.category).filter(Boolean))].sort();
  const types = [...new Set(equipment.map(e => e.type).filter(Boolean))].sort();

  // Pagination
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEquipment = filteredEquipment.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Equipment Modal Component
  const EquipmentModal = ({ equipment, onClose }: { equipment: Equipment | null, onClose: () => void }) => {
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
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary[100]}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="w-6 h-6" style={{ color: theme.colors.primary[600], cursor: 'pointer' }} />
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

            {/* Specifications */}
            {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: theme.colors.primary[900] }}>
                  <Ruler className="w-5 h-5" /> Specifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(equipment.specifications).map(([key, value]) => (
                    <div key={key} className="p-4 rounded-lg border" style={{ 
                      backgroundColor: theme.colors.primary[50],
                      borderColor: theme.colors.primary[100]
                    }}>
                      <div className="text-sm font-medium mb-1" style={{ color: theme.colors.primary[700] }}>
                        {formatText(key)}
                      </div>
                      <div className="text-base" style={{ color: theme.colors.primary[900] }}>
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="border-t pt-6" style={{ borderColor: theme.colors.primary[100] }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                  <span className="text-sm" style={{ color: theme.colors.primary[600] }}>Equipment Information</span>
                </div>
                <div className="text-sm" style={{ color: theme.colors.primary[600] }}>
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: theme.colors.primary[600] }}></div>
            <p className="text-xl" style={{ color: theme.colors.primary[600] }}>Loading equipment...</p>
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
            Equipment Catalog
          </h1>
          <p style={{ color: theme.colors.primary[600] }}>Discover rehabilitation equipment with specifications and usage guidelines</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-300" style={{ border: `1px solid ${theme.colors.primary[100]}` }}>
            <div className="text-2xl font-medium mb-1" style={{ color: theme.colors.primary[900] }}>{equipment.length}</div>
            <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Total Equipment</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-300" style={{ border: `1px solid ${theme.colors.primary[100]}` }}>
            <div className="text-2xl font-medium mb-1" style={{ color: theme.colors.primary[900] }}>{categories.length}</div>
            <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Categories</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-300" style={{ border: `1px solid ${theme.colors.primary[100]}` }}>
            <div className="text-2xl font-medium mb-1" style={{ color: theme.colors.primary[900] }}>{types.length}</div>
            <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Equipment Types</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-300" style={{ border: `1px solid ${theme.colors.primary[100]}` }}>
            <div className="text-2xl font-medium mb-1" style={{ color: theme.colors.primary[900] }}>{filteredEquipment.length}</div>
            <div className="text-sm" style={{ color: theme.colors.primary[600] }}>Showing</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm" style={{ border: `1px solid ${theme.colors.primary[100]}` }}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search equipment..."
                className="flex-1 px-4 py-3 rounded-xl transition-all duration-300"
                style={{ 
                  backgroundColor: theme.colors.primary[50],
                  border: `1px solid ${theme.colors.primary[100]}`,
                  color: theme.colors.primary[900]
                }}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer"
                style={{ 
                  backgroundColor: theme.colors.primary[50],
                  border: `1px solid ${theme.colors.primary[100]}`,
                  color: theme.colors.primary[900]
                }}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{formatText(category || '')}</option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer"
                style={{ 
                  backgroundColor: theme.colors.primary[50],
                  border: `1px solid ${theme.colors.primary[100]}`,
                  color: theme.colors.primary[900]
                }}
              >
                <option value="all">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{formatText(type || '')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Equipment Grid */}
        {paginatedEquipment.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: theme.colors.primary[600] }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: theme.colors.primary[900] }}>No equipment found</h3>
            <p style={{ color: theme.colors.primary[600] }}>Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedEquipment.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedEquipment(item)}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                  style={{ border: `1px solid ${theme.colors.primary[100]}` }}
                >
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1 transition-colors duration-300" style={{ color: theme.colors.primary[900] }}>
                          {item.name}
                        </h3>
                        <span className="text-sm font-mono" style={{ color: theme.colors.primary[600] }}>{item.id}</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: theme.colors.primary[100] }}>
                        <Wrench className="w-6 h-6 inline" style={{ color: theme.colors.primary[600] }} />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.category && (
                        <span className="px-3 py-1 rounded-full text-sm" style={{ 
                          backgroundColor: theme.colors.primary[50],
                          border: `1px solid ${theme.colors.primary[100]}`,
                          color: theme.colors.primary[600]
                        }}>
                          {formatText(item.category)}
                        </span>
                      )}
                      {item.type && (
                        <span className="px-3 py-1 rounded-full text-sm" style={{ 
                          backgroundColor: theme.colors.secondary[50],
                          border: `1px solid ${theme.colors.secondary[200]}`,
                          color: theme.colors.secondary[700]
                        }}>
                          {formatText(item.type)}
                        </span>
                      )}
                      {item.cost_range && (
                        <span className="px-3 py-1 rounded-full text-sm" style={{
                          backgroundColor: item.cost_range.toLowerCase().includes('low') ? theme.colors.success[50] :
                                         item.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[50] :
                                         theme.colors.error[50],
                          border: `1px solid ${item.cost_range.toLowerCase().includes('low') ? theme.colors.success[100] :
                                               item.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[100] :
                                               theme.colors.error[100]}`,
                          color: item.cost_range.toLowerCase().includes('low') ? theme.colors.success[700] :
                                 item.cost_range.toLowerCase().includes('medium') ? theme.colors.warning[700] :
                                 theme.colors.error[700]
                        }}>
                          {item.cost_range}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: theme.colors.primary[600] }}>
                        {item.description}
                      </p>
                    )}

                    {/* Features */}
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      {item.portability && (
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: theme.colors.gray[500] }}>Portability:</span>
                          <span style={{ color: theme.colors.primary[900] }}>{formatText(item.portability)}</span>
                        </div>
                      )}
                      {item.specifications && item.specifications.weight && (
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: theme.colors.gray[500] }}>Weight:</span>
                          <span style={{ color: theme.colors.primary[900] }}>{item.specifications.weight}</span>
                        </div>
                      )}
                      {item.specifications && item.specifications.dimensions && (
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: theme.colors.gray[500] }}>Dimensions:</span>
                          <span style={{ color: theme.colors.primary[900] }}>{item.specifications.dimensions}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: theme.colors.primary[100] }}>
                      <div className="text-sm" style={{ color: theme.colors.primary[600] }}>
                        Equipment Details
                      </div>
                      <div className="transition-all duration-300 group-hover:translate-x-1" style={{ color: theme.colors.primary[600] }}>
                        →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                {currentPage > 1 && (
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    style={{ 
                      border: `1px solid ${theme.colors.primary[100]}`,
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
                        className={`px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                          page === currentPage
                            ? 'shadow-md'
                            : 'bg-white shadow-sm hover:shadow-md'
                        }`}
                        style={page === currentPage ? {
                          backgroundColor: theme.colors.primary[600],
                          border: `1px solid ${theme.colors.primary[600]}`,
                          color: 'white'
                        } : {
                          backgroundColor: 'white',
                          border: `1px solid ${theme.colors.primary[100]}`,
                          color: theme.colors.primary[600]
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
                    className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    style={{ 
                      border: `1px solid ${theme.colors.primary[100]}`,
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

      {/* Equipment Modal */}
      <EquipmentModal 
        equipment={selectedEquipment} 
        onClose={() => setSelectedEquipment(null)} 
      />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
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
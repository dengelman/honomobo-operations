import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function DeviationsView({ projects = [] }) {
    const deviations = [
      { id: 1, project: 'HO755', type: 'Schedule', severity: 'High', description: 'Permit delays - 2 weeks behind', status: 'Open', date: '2025-01-15' },
      { id: 2, project: 'HO801', type: 'Budget', severity: 'Medium', description: 'Material cost increase +5%', status: 'Reviewing', date: '2025-01-20' },
      { id: 3, project: 'HO755', type: 'Quality', severity: 'Low', description: 'Minor finish corrections needed', status: 'Resolved', date: '2025-01-10' },
        ];

  const getSeverityColor = (severity) => {
        switch (severity) {
          case 'High': return 'bg-red-100 text-red-800';
          case 'Medium': return 'bg-yellow-100 text-yellow-800';
          case 'Low': return 'bg-blue-100 text-blue-800';
          default: return 'bg-gray-100 text-gray-800';
        }
  };

  const getStatusIcon = (status) => {
        switch (status) {
          case 'Open': return <AlertCircle className="w-4 h-4 text-red-500" />;
          case 'Reviewing': return <Clock className="w-4 h-4 text-yellow-500" />;
          case 'Resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
          default: return null;
        }
  };

  const openCount = deviations.filter(d => d.status === 'Open').length;
    const reviewingCount = deviations.filter(d => d.status === 'Reviewing').length;

  return (
        <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                            <div>
                                                          <p className="text-sm text-gray-500">Open Issues</p>p>
                                                          <p className="text-2xl font-bold text-red-600">{openCount}</p>p>
                                            </div>div>
                                            <AlertTriangle className="w-10 h-10 text-red-500" />
                                </div>div>
                      </div>div>
                      <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                            <div>
                                                          <p className="text-sm text-gray-500">Under Review</p>p>
                                                          <p className="text-2xl font-bold text-yellow-600">{reviewingCount}</p>p>
                                            </div>div>
                                            <Clock className="w-10 h-10 text-yellow-500" />
                                </div>div>
                      </div>div>
                      <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                            <div>
                                                          <p className="text-sm text-gray-500">Total Deviations</p>p>
                                                          <p className="text-2xl font-bold text-gray-900">{deviations.length}</p>p>
                                            </div>div>
                                            <AlertCircle className="w-10 h-10 text-gray-500" />
                                </div>div>
                      </div>div>
              </div>div>
              <div className="bg-white rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Project Deviations</h2>h2>
                      </div>div>
                      <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                          <tr>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>th>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>th>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>th>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>th>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>th>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>th>
                                                          </tr>tr>
                                            </thead>thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                              {deviations.map((deviation) => (
                          <tr key={deviation.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{deviation.project}</td>td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deviation.type}</td>td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(deviation.severity)}`}>{deviation.severity}</span>span>
                                            </td>td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{deviation.description}</td>td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">{getStatusIcon(deviation.status)}<span className="text-sm">{deviation.status}</span>span></div>div>
                                            </td>td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deviation.date}</td>td>
                          </tr>tr>
                        ))}
                                            </tbody>tbody>
                                </table>table>
                      </div>div>
              </div>div>
        </div>div>
      );
}</div>

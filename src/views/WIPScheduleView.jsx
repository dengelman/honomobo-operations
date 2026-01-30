import React from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function WIPScheduleView({ projects = [] }) {
    const stages = ['Assessment', 'Concept', 'D&E', 'Permitting', 'Production', 'Logistics', 'Complete'];

  const getStageColor = (stage) => {
        const colors = {
                'Assessment': 'bg-gray-200 text-gray-700',
                'Concept': 'bg-purple-100 text-purple-700',
                'D&E': 'bg-blue-100 text-blue-700',
                'Permitting': 'bg-yellow-100 text-yellow-700',
                'Production': 'bg-green-100 text-green-700',
                'Logistics': 'bg-cyan-100 text-cyan-700',
                'Complete': 'bg-gray-100 text-gray-500'
        };
        return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
        return status === 'Active' ? 
                <CheckCircle className="w-4 h-4 text-green-500" /> : 
                <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  const projectsByStage = stages.map(stage => ({
        stage,
        projects: projects.filter(p => p.Stage === stage)
  }));

  return (
        <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                            <div>
                                                          <p className="text-sm text-gray-500">Total Projects</p>p>
                                                          <p className="text-2xl font-bold text-gray-900">{projects.length}</p>p>
                                            </div>div>
                                            <Calendar className="w-10 h-10 text-blue-500" />
                                </div>div>
                      </div>div>
                      <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                            <div>
                                                          <p className="text-sm text-gray-500">In Production</p>p>
                                                          <p className="text-2xl font-bold text-green-600">{projects.filter(p => p.Stage === 'Production').length}</p>p>
                                            </div>div>
                                            <Clock className="w-10 h-10 text-green-500" />
                                </div>div>
                      </div>div>
                      <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                            <div>
                                                          <p className="text-sm text-gray-500">In D&E</p>p>
                                                          <p className="text-2xl font-bold text-blue-600">{projects.filter(p => p.Stage === 'D&E').length}</p>p>
                                            </div>div>
                                            <CheckCircle className="w-10 h-10 text-blue-500" />
                                </div>div>
                      </div>div>
                      <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                            <div>
                                                          <p className="text-sm text-gray-500">Active</p>p>
                                                          <p className="text-2xl font-bold text-purple-600">{projects.filter(p => p.Status === 'Active').length}</p>p>
                                            </div>div>
                                            <AlertCircle className="w-10 h-10 text-purple-500" />
                                </div>div>
                      </div>div>
              </div>div>
              <div className="bg-white rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">WIP Schedule by Stage</h2>h2>
                      </div>div>
                      <div className="p-6">
                                <div className="flex gap-4 overflow-x-auto pb-4">
                                  {projectsByStage.map(({ stage, projects: stageProjects }) => (
                        <div key={stage} className="flex-shrink-0 w-64">
                                        <div className={`rounded-t-lg px-4 py-2 font-medium ${getStageColor(stage)}`}>{stage} ({stageProjects.length})</div>div>
                                        <div className="bg-gray-50 rounded-b-lg p-2 min-h-32 space-y-2">
                                          {stageProjects.map(project => (
                                              <div key={project.id} className="bg-white rounded p-3 shadow-sm border">
                                                                    <div className="flex items-center justify-between">
                                                                                            <span className="font-medium text-sm">{project['Project ID']}</span>span>
                                                                      {getStatusIcon(project.Status)}
                                                                    </div>div>
                                                                    <p className="text-xs text-gray-500 mt-1">{project['Project Name']}</p>p>
                                              </div>div>
                                            ))}
                                        </div>div>
                        </div>div>
                      ))}
                                </div>div>
                      </div>div>
              </div>div>
        </div>div>
      );
}</div>

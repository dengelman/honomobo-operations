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
    return status === 'Active' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-gray-400" />;
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
              <p className="text-sm text-gray-500">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>

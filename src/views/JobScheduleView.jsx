import React from 'react';
import { Calendar, MapPin, Clock, User } from 'lucide-react';

export default function JobScheduleView({ projects = [] }) {
    const formatDate = (dateStr) => {
          if (!dateStr) return 'TBD';
          return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

  const jobs = projects.map(p => ({
        ...p,
        startDate: '2025-02-01',
        endDate: '2025-06-15',
        location: p['Project Name'] || 'Location TBD',
        manager: 'Project Manager'
  }));

  return (
        <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                            <div>
                                                          <p className="text-sm text-gray-500">Total Jobs</p>p>
                                                          <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>p>
                                            </div>div>
                                            <Calendar className="w-10 h-10 text-blue-500" />
                                </div>div>
                      </div>div>
                      <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                            <div>
                                                          <p className="text-sm text-gray-500">Active Jobs</p>p>
                                                          <p className="text-2xl font-bold text-green-600">{jobs.filter(j => j.Status === 'Active').length}</p>p>
                                            </div>div>
                                            <Clock className="w-10 h-10 text-green-500" />
                                </div>div>
                      </div>div>
                      <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                            <div>
                                                          <p className="text-sm text-gray-500">Locations</p>p>
                                                          <p className="text-2xl font-bold text-purple-600">{new Set(jobs.map(j => j.location)).size}</p>p>
                                            </div>div>
                                            <MapPin className="w-10 h-10 text-purple-500" />
                                </div>div>
                      </div>div>
              </div>div>
              <div className="bg-white rounded-lg shadow">
                      <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Job Schedule</h2>h2>
                      </div>div>
                      <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                          <tr>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>th>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>th>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>th>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>th>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>th>
                                                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>th>
                                                          </tr>tr>
                                            </thead>thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                              {jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{job['Project ID']}</div>div>
                                            </td>td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                                                                      <span className="text-sm text-gray-500">{job.location}</span>span>
                                                                </div>div>
                                            </td>td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.Stage}</td>td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(job.startDate)}</td>td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(job.endDate)}</td>td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 py-1 text-xs rounded-full ${job.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{job.Status}</span>span>
                                            </td>td>
                          </tr>tr>
                        ))}
                                            </tbody>tbody>
                                </table>table>
                      </div>div>
              </div>div>
        </div>div>
      );
}</div>

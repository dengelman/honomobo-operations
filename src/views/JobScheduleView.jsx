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

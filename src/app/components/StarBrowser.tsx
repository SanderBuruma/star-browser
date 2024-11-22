'use client';
import React, { useState, useMemo } from 'react';
import data from '../data.json';
import type { StarDetails } from '../data';

interface Star {
  name: string;
  color: number;
  date: string;
  user: string;
  details: StarDetails | null;
}

export default function StarBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpty, setFilterEmpty] = useState(false);

  const stars: Star[] = useMemo(() => {
    return data.stars.colors.map((color, index) => ({
      name: data.stars.names[index] || '',
      color: color,
      date: data.stars.creation_update[index] || '',
      user: data.stars.users[index] || '',
      details: data.stars.details[index],
    }));
  }, []);

  const formatElapsedTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const weeks = Math.floor(diffInDays / 7);
    const remainingDays = diffInDays % 7;
    
    if (remainingDays === 0) {
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} and ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} ago`;
  };

  const formatTimePlayed = (timeStr: string | null) => {
    if (!timeStr) return null;
    
    // Parse "HH:MM:SS" format
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (remainingHours > 0) parts.push(`${remainingHours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    
    return parts.join(' ');
  };

  const filteredStars = useMemo(() => {
    return stars.filter(star => {
      const matchesSearch = star.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterEmpty) {
        return matchesSearch && star.name !== '';
      }
      return matchesSearch;
    });
  }, [stars, searchTerm, filterEmpty]);

  return (
    <div className="p-4">
      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filterEmpty}
            onChange={(e) => setFilterEmpty(e.target.checked)}
          />
          <span>Hide empty names</span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStars.map((star, index) => (
          <a 
            key={index}
            href={star.name ? `https://factorio.com/galaxy/${star.name}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded shadow cursor-pointer"
            style={{
              backgroundColor: `#${star.color.toString(16).padStart(6, '0')}33`,
              textDecoration: 'none',
              color: 'inherit'
            }}
            title={star.name}
          >
            <div className="font-bold">{star.name || '<Empty>'}</div>
            <div className="text-sm text-gray-600">
              <div>Finished: {formatElapsedTime(star.date)}</div>
              {star.user && <div>By: {star.user}</div>}
              {star.details?.time_played && (
                <div>Time: {formatTimePlayed(star.details.time_played)}</div>
              )}
            </div>
          </a>
        ))}
      </div>

      <div className="mt-4 text-gray-600">
        Showing {filteredStars.length} of {stars.length} stars
      </div>
    </div>
  );
} 
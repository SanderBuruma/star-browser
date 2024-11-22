'use client';
import React, { useState, useMemo } from 'react';
import data from '../data.json';

interface Star {
  name: string;
  color: number;
}

export default function StarBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpty, setFilterEmpty] = useState(false);

  // Combine the separate arrays into an array of Star objects
  const stars: Star[] = useMemo(() => {
    return data.stars.colors.map((color, index) => ({
      name: data.stars.names[index] || '',
      color: color,
    }));
  }, []);

  // Filter stars based on search term
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
          <div 
            key={index}
            className="p-4 border rounded shadow"
            style={{
              backgroundColor: `#${star.color.toString(16).padStart(6, '0')}33`
            }}
          >
            <div className="font-bold">{star.name || '<Empty>'}</div>
            <div className="text-sm text-gray-600">
              Color: #{star.color.toString(16).padStart(6, '0')}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-gray-600">
        Showing {filteredStars.length} of {stars.length} stars
      </div>
    </div>
  );
} 
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
  const [selectedComment, setSelectedComment] = useState<string | null>(null);

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

  // Create an index of searchable content when stars are loaded
  const searchIndex = useMemo(() => {
    return stars.map(star => ({
      searchContent: [
        star.name,
        star.user,
        star.details?.seed || '',
        star.details?.comment || '',
        formatTimePlayed(star.details?.time_played || '') || '',
        formatElapsedTime(star.date)
      ].join(' ').toLowerCase(),
      star
    }));
  }, [stars]);

  const filteredStars = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    // Quick return if no search term and no filter
    if (!searchTerm && !filterEmpty) {
      return stars;
    }
    
    // Quick return if only showing non-empty names
    if (!searchTerm && filterEmpty) {
      return stars.filter(star => star.name !== '');
    }

    return searchIndex
      .filter(({ searchContent, star }) => {
        const matchesSearch = searchContent.includes(searchLower);
        if (filterEmpty) {
          return matchesSearch && star.name !== '';
        }
        return matchesSearch;
      })
      .map(({ star }) => star);
  }, [searchIndex, searchTerm, filterEmpty]);

  const handleCommentClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    comment: string
  ) => {
    e.preventDefault(); // Prevent the <a> tag from triggering
    setSelectedComment(comment);
  };

  const handleCloseComment = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) { // Only close if clicking the backdrop
      setSelectedComment(null);
    }
  };

  return (
    <div className="p-4 font-mono">
      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Search by seed, name, or comment..."
          className="w-full p-2 bg-[#1a1a1a] border-[#333] border rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#004d40]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <label className="flex items-center space-x-2 text-gray-300">
          <input
            type="checkbox"
            checked={filterEmpty}
            onChange={(e) => setFilterEmpty(e.target.checked)}
            className="bg-[#1a1a1a] border-[#333] rounded"
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
            className="relative p-4 border border-[#333] rounded shadow-lg hover:border-[#004d40] transition-colors"
            style={{
              backgroundColor: `#${star.color.toString(16).padStart(6, '0')}22`,
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div className="font-bold text-gray-100">
              {star.details?.seed || star.name || '<Empty>'}
            </div>
            <div className="text-sm text-gray-400">
              <div>Finished: {formatElapsedTime(star.date)}</div>
              {star.user && <div>By: {star.user}</div>}
              {star.details?.time_played && (
                <div>Time: {formatTimePlayed(star.details.time_played)}</div>
              )}
              {star.details?.comment && (
                <button
                  onClick={(e) => {
                    if (star.details && star.details.comment) {
                      handleCommentClick(e, star.details.comment);
                    }
                  }}
                  className="btn-dark mt-2 text-xs"
                >
                  View Comment
                </button>
              )}
            </div>
          </a>
        ))}
      </div>

      {/* Comment Modal */}
      {selectedComment && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={handleCloseComment}
        >
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="text-gray-300 whitespace-pre-wrap">
              {selectedComment}
            </div>
            <button
              onClick={() => setSelectedComment(null)}
              className="btn-dark mt-4 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-gray-400">
        Showing {filteredStars.length} of {stars.length} stars
      </div>
    </div>
  );
} 
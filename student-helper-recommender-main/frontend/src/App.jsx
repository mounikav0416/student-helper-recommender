import React, { useState, useEffect } from 'react';
import { Users, MapPin, Search, Award, AlertCircle, CheckCircle } from 'lucide-react';

export default function App() {
  const [registerNumber, setRegisterNumber] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [apiUrl] = useState('http://localhost:3001');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/locations`);
      const data = await response.json();
      if (data.success) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const findHelpers = async () => {
    if (!registerNumber.trim() || !dropLocation.trim()) {
      setError('Please enter both register number and drop location');
      return;
    }
    
    setError('');
    setLoading(true);
    setSearched(false);
    
    try {
      const response = await fetch(`${apiUrl}/api/find-helpers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registerNumber: registerNumber.trim(),
          dropLocation: dropLocation.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      if (data.success) {
        setRecommendations(data.helpers);
        setSearched(true);
      } else {
        setError(data.error || 'Failed to fetch recommendations');
      }

    } catch (err) {
      console.error('Error:', err);
      setError(`Cannot connect to backend server. Make sure it's running at ${apiUrl}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      findHelpers();
    }
  };

  const getProximityColor = (score) => {
    switch(score) {
      case 4: return 'bg-green-100 text-green-800 border-green-300';
      case 3: return 'bg-blue-100 text-blue-800 border-blue-300';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 1: return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <Users className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Student Helper Finder</h1>
          </div>
          <p className="text-gray-600">Find students who can help you at your drop location</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Your Register Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 22MIA1028"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Target Drop Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={dropLocation}
                onChange={(e) => setDropLocation(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="e.g., CAMPUS"
                list="locations"
                className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
              <datalist id="locations">
                {locations.map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
            {locations.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Available locations: {locations.slice(0, 5).join(', ')}
                {locations.length > 5 && ` and ${locations.length - 5} more...`}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={findHelpers}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Searching Database...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Find Helpers
              </>
            )}
          </button>
        </div>

        {searched && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Recommended Helpers
                {recommendations.length > 0 && (
                  <span className="text-lg font-normal text-gray-600 ml-2">
                    ({recommendations.length} found)
                  </span>
                )}
              </h2>
              {recommendations.length > 0 && (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-semibold">No helpers found at this location</p>
                <p className="text-sm mt-2">Try a different drop location or check if the register number is correct</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((helper, index) => (
                  <div
                    key={helper.registerNumber}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-indigo-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">{helper.name}</h3>
                            <p className="text-sm text-gray-600">{helper.registerNumber}</p>
                          </div>
                        </div>
                        
                        <div className="ml-11 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Batch:</span>
                            <span className="font-semibold text-gray-800 ml-1">{helper.batch}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Department:</span>
                            <span className="font-semibold text-gray-800 ml-1">{helper.department}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex-shrink-0">
                        <div className={`px-3 py-1 rounded-full border-2 ${getProximityColor(helper.proximityScore)} text-xs font-semibold whitespace-nowrap`}>
                          <Award className="w-3 h-3 inline mr-1" />
                          {helper.proximityLabel}
                        </div>
                        <div className="text-center mt-1 text-xs text-gray-500">
                          Score: {helper.proximityScore}/4
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg shadow p-4 text-sm text-gray-600">
          <h3 className="font-semibold text-gray-800 mb-2">How Proximity Scoring Works:</h3>
          <ul className="space-y-1 ml-4">
            <li>• <span className="font-semibold">Score 4 (Green):</span> Same batch AND same department (highest proximity)</li>
            <li>• <span className="font-semibold">Score 3 (Blue):</span> Same department, different batch</li>
            <li>• <span className="font-semibold">Score 2 (Yellow):</span> Same batch, different department</li>
            <li>• <span className="font-semibold">Score 1 (Gray):</span> Different batch AND department (lowest proximity)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

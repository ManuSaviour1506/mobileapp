// src/pages/AthleteProfiles.jsx
const AthleteProfiles = () => {
  // This page would fetch data from a leaderboard endpoint.
  // For now, we'll use mock data based on the provided image.
  const profiles = [
    { id: 'ABC123', name: 'Rohan A.', age: 14, gender: 'Male', district: 'Pune', status: 'Verified' },
    { id: 'ABC124', name: 'Makasettra', age: 14, gender: 'Male', district: 'Pun', status: 'Verified' },
    { id: 'ABC125', name: 'Mahanonrinda', age: 14, gender: 'Male', district: 'Delhi', status: 'Verified' },
    { id: 'ABC126', name: 'Pending Review', age: 17, gender: 'Male', district: 'Yelding', status: 'Pending Review' },
    { id: 'ABC127', name: 'Priya K.', age: 17, gender: 'Female', district: 'Central', status: 'Verified' },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Athlete Profiles</h1>
      <div className="overflow-x-auto bg-white p-4 rounded shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.age}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.district}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${profile.status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {profile.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AthleteProfiles;
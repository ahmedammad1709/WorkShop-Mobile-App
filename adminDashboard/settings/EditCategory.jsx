import React, { useState } from "react";

const EditCategory = ({ activity, onBack }) => {
  const [name, setName] = useState(activity?.name || "");
  const [description, setDescription] = useState(activity?.description || "");

  return (
    <div className="bg-white rounded-md shadow-md p-6 w-full border-t-2 border-green-400">
      <form className="divide-y divide-gray-300">
        {/* Activity Name */}
        <div className="flex items-center justify-between py-4">
          <label className="text-gray-900 font-semibold w-1/3">
            Activity Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-2/3 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-green-500"
          />
        </div>

        {/* Activity Description */}
        <div className="flex items-center justify-between py-4">
          <label className="text-gray-900 font-semibold w-1/3">
            Activity Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-2/3 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-green-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-gray-700 text-gray-900 rounded-md hover:bg-gray-100"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCategory;

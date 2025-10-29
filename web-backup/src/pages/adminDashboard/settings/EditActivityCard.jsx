import React, { useState } from "react";

const EditActivityCard = () => {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="bg-white rounded-md shadow-md p-6 w-full border-t-2 border-green-400">
      <form className="space-y-6">
        {/* Activity Type */}
        <div className="relative">
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border-b border-gray-300 focus:border-green-500 focus:outline-none py-2 text-lg peer placeholder-transparent"
            placeholder="Activity Type"
          />
          <label
            className={`absolute left-0 transition-all duration-300 ease-in-out
              ${type
                ? "-top-3.5 text-sm text-green-500 font-medium"
                : "top-2 text-lg text-gray-500 font-medium"}
              peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-green-500`}
          >
            Activity Type
          </label>
        </div>

        {/* Activity Description */}
        <div className="relative">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border-b border-gray-300 focus:border-green-500 focus:outline-none py-2 text-lg peer placeholder-transparent"
            placeholder="Activity Description"
          />
          <label
            className={`absolute left-0 transition-all duration-300 ease-in-out
              ${description
                ? "-top-3.5 text-sm text-green-500 font-medium"
                : "top-2 text-lg text-gray-500 font-medium"}
              peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-green-500`}
          >
            Activity Description
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditActivityCard;

// export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// const BASE_URL = `${API_URL}/api`;

// const getHeaders = () => {
//   const token = localStorage.getItem("token");
//   return {
//     "Content-Type": "application/json",
//     ...(token && { Authorization: `Bearer ${token}` }),
//   };
// };

// export const api = {
//   post: async (endpoint, data) => {
//     const res = await fetch(`${BASE_URL}${endpoint}`, {
//       method: "POST",
//       headers: getHeaders(),
//       body: JSON.stringify(data),
//     });
//     return res.json();
//   },
//   get: async (endpoint) => {
//     const res = await fetch(`${BASE_URL}${endpoint}`, {
//       headers: getHeaders(),
//     });
//     return res.json();
//   },
// };

// api.js
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const BASE_URL = `${API_URL}/api`;

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem("token");
  return {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const api = {
  post: async (endpoint, data) => {
    const isFormData = data instanceof FormData;
    const fullUrl = `${BASE_URL}${endpoint}`;
    console.log("Attempting to fetch:", fullUrl);
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: getHeaders(isFormData),
        body: isFormData ? data : JSON.stringify(data),
      });
      return res.json();
    } catch (err) {
      console.error("Fetch failed entirely:", err); // See if the browser drops it here
      throw err;
    }
  },
  get: async (endpoint) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: getHeaders(false),
    });
    return res.json();
  },
};
